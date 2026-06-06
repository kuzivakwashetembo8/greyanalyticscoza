// Client helper — invokes the server `/api/analyze` route for a single agent.
// The UI runs four of these in parallel and tracks per-agent status.

import type { AgentId, AgentResult } from "./types";

export interface AnalyzeResponse {
  success: boolean;
  result?: AgentResult;
  error?: string;
  // Added for Task 1: server returns a structured failure with HTTP 200 so
  // one failing agent doesn't take down the parallel batch. Detect it here
  // and surface as a thrown error the existing UI already knows how to show.
  analysis_failed?: boolean;
  detail?: string;
}

export async function runAgent(agent: AgentId, text: string, signal?: AbortSignal): Promise<AgentResult> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent, text }),
    signal,
  });

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const bodyPreview = await res.clone().text().then((t) => t.slice(0, 200));
    throw new Error(`Server error ${res.status}: ${bodyPreview}`);
  }

  const json = (await res.json()) as AnalyzeResponse;

  if (json.analysis_failed || !json.success || !json.result) {
    throw new Error(json.error ?? `Agent ${agent} failed (HTTP ${res.status})`);
  }
  return json.result;
}
