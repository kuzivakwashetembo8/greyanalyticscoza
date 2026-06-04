// Client helper — invokes the server `/api/analyze` route for a single agent.
// The UI runs four of these in parallel and tracks per-agent status.

import type { AgentId, AgentResult } from "./types";

export interface AnalyzeResponse {
  success: boolean;
  result?: AgentResult;
  error?: string;
}

export async function runAgent(agent: AgentId, text: string, signal?: AbortSignal): Promise<AgentResult> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent, text }),
    signal,
  });
  const json = (await res.json()) as AnalyzeResponse;
  if (!json.success || !json.result) {
    throw new Error(json.error ?? `Agent ${agent} failed (HTTP ${res.status})`);
  }
  return json.result;
}
