// Inspection Export — narrative composer server route.
// Calls Groq once with the full analyses JSON and asks for a single JSON
// document containing all 5 pages. Falls back to a deterministic mock when
// GROQ_API_KEY (or GROQ_REPORT_KEY) is absent so the demo still completes.

import { createFileRoute } from "@tanstack/react-router";
import type { AgentId, AgentResult } from "@/lib/analysis/types";
import type { ReportPageNarrative } from "@/lib/report/types";
import { REPORT_SYSTEM_PROMPT } from "@/lib/report/prompt";
import { mockNarrative } from "@/lib/report/mock";

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
        let body: { businessName?: unknown; analyses?: unknown };
        try { body = (await request.json()) as typeof body; }
        catch { return json({ success: false, error: "Invalid JSON body" }, 400); }

        const businessName = typeof body.businessName === "string" ? body.businessName : "Your business";
        const analyses = (body.analyses ?? {}) as Partial<Record<AgentId, AgentResult>>;

        const key = process.env.GROQ_REPORT_KEY ?? process.env.GROQ_API_KEY;
        if (!key) {
          // Graceful fallback so the demo still produces a 5-page report.
          return json({ success: true, mocked: true, pages: mockNarrative(businessName, analyses) });
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
          if (pages.length < 5) {
            // Model returned fewer pages than required — top up with mock to keep UI usable.
            const filled = [...pages, ...mockNarrative(businessName, analyses).slice(pages.length)];
            return json({ success: true, mocked: false, pages: filled });
          }
          return json({ success: true, mocked: false, pages });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Composer failed";
          return json({ success: false, error: msg }, 502);
        } finally {
          clearTimeout(timer);
        }
      },
    },
  },
});
