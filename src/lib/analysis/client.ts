// Client helper — invokes the server `/api/analyze` route for a single agent.
// The UI runs four of these in parallel and tracks per-agent status.

import type { AgentId, AgentResult } from "./types";

export interface AnalyzeResponse {
  success: boolean;
  result?: AgentResult;
  error?: string;
}

export async function runAgent(agent: AgentId, text: string, signal?: AbortSignal): Promise<AgentResult> {
  console.log(`[client.runAgent] Starting agent: ${agent}, text length: ${text.length}`);
  
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent, text }),
      signal,
    });
    
    console.log(`[client.runAgent] Fetch completed for ${agent}:`, {
      status: res.status,
      statusText: res.statusText,
      contentType: res.headers.get("content-type"),
      ok: res.ok,
    });
    
    // Check if response is actually JSON before parsing
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const bodyPreview = await res.clone().text().then(t => t.slice(0, 200));
      console.error(`[client.runAgent] ERROR: Non-JSON response for ${agent}`, {
        contentType,
        bodyPreview,
        status: res.status,
      });
      throw new Error(`Server error: got ${res.status} ${res.statusText}, expected JSON. Got content-type: ${contentType}`);
    }
    
    const json = (await res.json()) as AnalyzeResponse;
    console.log(`[client.runAgent] Parsed JSON for ${agent}:`, {
      success: json.success,
      hasResult: !!json.result,
      error: json.error,
    });
    
    if (!json.success || !json.result) {
      const errorMsg = json.error ?? `Agent ${agent} failed (HTTP ${res.status})`;
      console.error(`[client.runAgent] Agent failed for ${agent}:`, errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log(`[client.runAgent] Success for ${agent}:`, {
      mocked: json.result.mocked,
      anomalies: json.result.anomalies.length,
      insights: json.result.insights.length,
      confidence: json.result.confidence,
    });
    
    return json.result;
  } catch (err) {
    console.error(`[client.runAgent] Caught exception for ${agent}:`, err);
    throw err;
  }
}
