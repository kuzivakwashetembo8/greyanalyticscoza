// Inspection Export — narrative composer server route.
// Calls Groq once with the full analyses JSON and asks for a single JSON
// document containing all 5 pages. Missing provider configuration and model
// failures are returned explicitly; production never substitutes mock output.

import { createFileRoute } from "@tanstack/react-router";
import type { AgentId, AgentResult } from "@/lib/analysis/types";
import type { ReportPageNarrative } from "@/lib/report/types";
import { REPORT_SYSTEM_PROMPT } from "@/lib/report/prompt";
import { requireBearer } from "@/lib/api/auth-helpers.server";
import { requireRateLimit } from "@/lib/api/rate-limit.server";
import { recordUsage, estimateCostCents } from "@/lib/api/usage.server";
import { logServerError } from "@/lib/api/monitoring.server";
import { recordSecurityEvent } from "@/lib/api/audit.server";

const MODEL = "llama-3.3-70b-versatile"; // strong instruction-following on Groq
const TIMEOUT_MS = 90_000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function safeParseJson(raw: string): unknown {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (m) {
    try { return JSON.parse(m[0]); } catch { /* fall through */ }
  }
  throw new Error("Narrative writer did not return valid JSON");
}

function coercePages(parsed: unknown): ReportPageNarrative[] {
  const obj = (parsed ?? {}) as Record<string, unknown>;
  const arr = Array.isArray(obj.pages) ? obj.pages : [];
  return arr.map((p) => {
    const x = (p ?? {}) as Record<string, unknown>;
    const agent = String(x.agent ?? "summary") as ReportPageNarrative["agent"];
    return {
      agent,
      title: String(x.title ?? ""),
      summary: String(x.summary ?? ""),
      anomalies: Array.isArray(x.anomalies)
        ? x.anomalies.slice(0, 6).map((a) => {
            const y = (a ?? {}) as Record<string, unknown>;
            return {
              title: String(y.title ?? ""),
              description: String(y.description ?? ""),
              fix: String(y.fix ?? ""),
              severity: y.severity ? String(y.severity) : undefined,
            };
          })
        : [],
      insights: Array.isArray(x.insights) ? x.insights.slice(0, 5).map(String) : [],
      roadmap: Array.isArray(x.roadmap)
        ? x.roadmap.slice(0, 8).map((r) => {
            const y = (r ?? {}) as Record<string, unknown>;
            const h = String(y.horizon ?? "this month") as "this week" | "this month" | "this quarter";
            return { horizon: h, action: String(y.action ?? "") };
          })
        : undefined,
    };
  });
}

export const Route = createFileRoute("/api/report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireBearer(request);
        if (!auth.ok) return auth.response;
        const rl = await requireRateLimit(auth.userId, "report", 10, 10);
        if (!rl.allowed) return rl.response;
        let body: { businessName?: unknown; analyses?: unknown };
        try { body = (await request.json()) as typeof body; }
        catch { return json({ success: false, error: "Invalid JSON body" }, 400); }

        const businessName = typeof body.businessName === "string" ? body.businessName : "Your business";
        const analyses = (body.analyses ?? {}) as Partial<Record<AgentId, AgentResult>>;

        const completeAgents = Object.values(analyses).filter((result) => result && !result.mocked && result.anomalies).length;
        if (completeAgents !== 4) {
          return json({
            success: false,
            error: `All four specialist analyses are required before report generation (${completeAgents}/4 complete).`,
          }, 400);
        }

        const key = process.env.GROQ_REPORT_KEY ?? process.env.GROQ_API_KEY;
        if (!key) {
          return json({
            success: false,
            error: "Report generation unavailable: GROQ_API_KEY not configured on the server.",
          }, 503);
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({
              model: MODEL,
              response_format: { type: "json_object" },
              temperature: 0.3,
              messages: [
                { role: "system", content: REPORT_SYSTEM_PROMPT },
                { role: "user", content: JSON.stringify({ businessName, analyses }) },
              ],
            }),
          });
          if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Groq ${res.status}: ${txt.slice(0, 200)}`);
          }
          const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
          const content = data.choices?.[0]?.message?.content ?? "";
          const pages = coercePages(safeParseJson(content));
          const approxTokens = 4000;
          void recordUsage(auth.userId, "report", approxTokens, estimateCostCents(MODEL, approxTokens));
          if (pages.length < 5) {
            return json({
              success: false,
              error: `Model returned only ${pages.length} pages; expected 5. Please retry.`,
            }, 502);
          }
          await recordSecurityEvent(auth.userId, "report.generated", {
            business_name: businessName,
            agent_count: completeAgents,
          });
          return json({ success: true, mocked: false, pages });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Composer failed";
          const errorReference = await logServerError(auth.userId, "report", { message: msg });
          return json({ success: false, error: msg, error_reference: errorReference }, 502);
        } finally {
          clearTimeout(timer);
        }
      },
    },
  },
});
