// Browser-side helper to call the narrative-writer server route.
import type { AgentId, AgentResult } from "@/lib/analysis/types";
import type { ReportPageNarrative } from "./types";

interface ComposeResponse {
  success: boolean;
  pages?: ReportPageNarrative[];
  error?: string;
  mocked?: boolean;
}

export async function composeNarrative(
  businessName: string,
  analyses: Partial<Record<AgentId, AgentResult>>,
  signal?: AbortSignal,
): Promise<{ pages: ReportPageNarrative[]; mocked: boolean }> {
  const res = await fetch("/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ businessName, analyses }),
    signal,
  });
  const json = (await res.json()) as ComposeResponse;
  if (!json.success || !json.pages) {
    throw new Error(json.error ?? `Report composer failed (HTTP ${res.status})`);
  }
  return { pages: json.pages, mocked: Boolean(json.mocked) };
}
