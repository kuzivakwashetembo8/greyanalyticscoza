// Transmit Assessment — server route.
//
// One agent per request so the browser can fan out 4 parallel calls and
// stream per-agent status into the UI.
//
// TPM mitigation (added for Task 1):
//   - Per-model token budgets (free-tier TPM ceilings vary 6k–8k).
//   - Local summariser pre-shrinks the user text into the budget BEFORE
//     calling Groq, so we never trip a 413 / rate-limit error on the
//     first attempt.
//   - On a 413 or 429 response we retry with exponential backoff
//     (1s, 2s, 4s — max 3 attempts) and further halve the text budget
//     each retry as a safety net.
//   - On final failure we return a structured `analysis_failed: true`
//     payload so the UI can mark that single agent as failed and offer
//     a retry without breaking the rest of the pipeline.
//
// The agent prompts, analysis structure, and user flow are unchanged.

import { createFileRoute } from "@tanstack/react-router";
import { agentMeta, type AgentId, type AgentResult } from "@/lib/analysis/types";
import { PROMPTS } from "@/lib/analysis/prompts";
import { summariseForAgent, tokensToChars } from "@/lib/analysis/summarise";
import { requireBearer } from "@/lib/api/auth-helpers.server";
import { requireRateLimit } from "@/lib/api/rate-limit.server";
import { recordUsage, estimateCostCents } from "@/lib/api/usage.server";
import { logServerError } from "@/lib/api/monitoring.server";

const TIMEOUT_MS = 60_000;
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [1000, 2000, 4000];

// Per-agent TPM ceilings (tokens per minute on Groq free tier as reported
// by the live errors). We reserve ~1700 tokens for the system prompt and
// response (max_tokens), then convert the remainder to a char budget.
const TPM_BUDGET: Record<AgentId, number> = {
  finance: 8000,     // openai/gpt-oss-120b
  operations: 8000,  // openai/gpt-oss-20b
  compliance: 6000,  // llama-3.3-70b-versatile (conservative)
  strategy: 6000,    // llama-3.1-8b-instant
};
const RESERVED_TOKENS = 1700;
const MAX_COMPLETION_TOKENS = 1200;

function userCharBudget(agent: AgentId, attempt: number): number {
  const baseTokens = Math.max(800, TPM_BUDGET[agent] - RESERVED_TOKENS);
  // Halve the budget on each retry to defensively shrink under any
  // rate-limit / size error we keep hitting.
  const shrunk = Math.floor(baseTokens / Math.pow(2, attempt));
  return tokensToChars(shrunk);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isAgentId(x: unknown): x is AgentId {
  return x === "finance" || x === "operations" || x === "compliance" || x === "strategy";
}

function safeParseJson(raw: string): unknown {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch { /* fall through */ } }
    throw new Error("Agent did not return valid JSON");
  }
}

function coerceResult(agent: AgentId, model: string, parsed: unknown): AgentResult {
  const obj = (parsed ?? {}) as Record<string, unknown>;
  const anomaliesRaw = Array.isArray(obj.anomalies) ? obj.anomalies : [];
  const insightsRaw = Array.isArray(obj.insights) ? obj.insights : [];
  const conf = typeof obj.confidence === "number" ? obj.confidence : 0.5;
  return {
    agent, model, mocked: false,
    confidence: Math.max(0, Math.min(1, conf)),
    insights: insightsRaw.slice(0, 5).map((s) => String(s)),
    anomalies: anomaliesRaw.slice(0, 6).map((a) => {
      const x = (a ?? {}) as Record<string, unknown>;
      const sev = String(x.severity ?? "medium").toLowerCase();
      return {
        type: String(x.type ?? "finding"),
        description: String(x.description ?? ""),
        evidence: String(x.evidence ?? ""),
        severity: sev === "high" || sev === "low" ? (sev as "high" | "low") : "medium",
        fix: String(x.fix ?? x.suggested_fix ?? ""),
      };
    }),
  };
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function callGroqOnce(
  agent: AgentId,
  model: string,
  apiKey: string,
  userText: string,
): Promise<{ ok: true; result: AgentResult } | { ok: false; status: number; body: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: MAX_COMPLETION_TOKENS,
        messages: [
          { role: "system", content: PROMPTS[agent] },
          { role: "user", content: userText },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, status: res.status, body: body.slice(0, 400) };
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content ?? "";
    const parsed = safeParseJson(content);
    return { ok: true, result: coerceResult(agent, model, parsed) };
  } finally {
    clearTimeout(timer);
  }
}

async function callGroq(agent: AgentId, text: string, userId: string): Promise<AgentResult> {
  const meta = agentMeta(agent);
  const key = process.env[meta.envKey] ?? process.env.GROQ_API_KEY;
  if (!key) {
    // No demo fallback in production — surface a clear error so the UI can
    // mark this agent as failed instead of pretending a mock was analysis.
    throw new Error(
      `Analysis unavailable: no GROQ_API_KEY (or ${meta.envKey}) configured on the server`,
    );
  }

  let lastErr = "Agent failed";
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const budget = userCharBudget(agent, attempt);
    const { text: payloadText, reduced } = summariseForAgent(text, budget);
    console.log(`[analyze] ${agent} attempt ${attempt + 1}/${MAX_ATTEMPTS} budget=${budget}ch reduced=${reduced}`);
    try {
      const out = await callGroqOnce(agent, meta.model, key, payloadText);
      if (out.ok) {
        // Best-effort cost telemetry (approximate tokens = chars/4).
        const approxTokens = Math.ceil(payloadText.length / 4) + MAX_COMPLETION_TOKENS;
        void recordUsage(userId, `analyze:${agent}`, approxTokens, estimateCostCents(meta.model, approxTokens));
        return out.result;
      }

      // Rate-limit / payload-too-large → back off and shrink further.
      if (out.status === 413 || out.status === 429) {
        lastErr = `Groq ${out.status}: ${out.body.slice(0, 160)}`;
        console.warn(`[analyze] ${agent} ${out.status}; backing off ${BACKOFF_MS[attempt]}ms`);
        if (attempt < MAX_ATTEMPTS - 1) await sleep(BACKOFF_MS[attempt]);
        continue;
      }
      // Non-retryable HTTP error.
      throw new Error(`Groq ${out.status}: ${out.body}`);
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
      // Network / parse errors get one retry too.
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(BACKOFF_MS[attempt]);
        continue;
      }
    }
  }
  throw new Error(lastErr);
}

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireBearer(request);
        if (!auth.ok) return auth.response;
        // 20 requests / 5 minutes per user across all agents.
        const rl = await requireRateLimit(auth.userId, "analyze", 20, 5);
        if (!rl.allowed) return rl.response;
        let body: { agent?: unknown; text?: unknown };
        try { body = (await request.json()) as typeof body; }
        catch { return json({ success: false, error: "Invalid JSON body" }, 400); }

        const { agent, text } = body;
        if (!isAgentId(agent)) return json({ success: false, error: "Unknown agent" }, 400);
        if (typeof text !== "string" || text.trim().length < 10) {
          return json({ success: false, error: "Text input too short to analyse" }, 400);
        }

        try {
          const result = await callGroq(agent, text, auth.userId);
          return json({ success: true, result });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Agent failed";
          await logServerError(auth.userId, "analyze", { agent, message: msg });
          // Graceful structured failure — does NOT 500 the request so the
          // browser's per-agent UI can mark this one failed without crashing
          // the parallel batch.
          return json({
            success: false,
            analysis_failed: true,
            agent,
            error: "We couldn't complete this agent's analysis. You can retry just this agent.",
            detail: msg,
          }, 200);
        }
      },
    },
  },
});
