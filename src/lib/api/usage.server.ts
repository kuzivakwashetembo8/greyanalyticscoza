// Usage / cost recorder — one row per AI request so operators can trace
// how many tokens each user is consuming and roughly what it cost.
// Non-blocking: failures are logged but never fail the outer request.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function recordUsage(
  userId: string,
  kind: string,
  amount = 1,
  costCents = 0,
): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("usage_events").insert({
      user_id: userId,
      kind,
      amount,
      cost_cents: costCents,
    });
    if (error) console.error("[usage] insert failed:", error.message);
  } catch (err) {
    console.error("[usage] exception:", err);
  }
}

// Rough Groq pricing table (fractional cents per 1k tokens; not exact).
// Adjust as new models are added. Used only for internal telemetry, not billing.
const RATE_PER_1K_CENTS: Record<string, number> = {
  "llama-3.1-8b-instant": 0.008,
  "llama-3.3-70b-versatile": 0.06,
  "openai/gpt-oss-20b": 0.02,
  "openai/gpt-oss-120b": 0.08,
};

export function estimateCostCents(model: string, tokens: number): number {
  const rate = RATE_PER_1K_CENTS[model] ?? 0.05;
  return Math.max(0, Math.round((tokens / 1000) * rate));
}