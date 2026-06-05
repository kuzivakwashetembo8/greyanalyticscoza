// Inspection Export — shared types for the 5-page audit report.
import type { AgentId, AgentResult } from "@/lib/analysis/types";

export interface ReportPageNarrative {
  agent: AgentId | "summary";
  title: string;
  summary: string;        // 2–4 sentences, plain language
  anomalies: Array<{ title: string; description: string; fix: string; severity?: string }>;
  insights: string[];     // bullet points
  // Page 5 only — optional roadmap.
  roadmap?: Array<{ horizon: "this week" | "this month" | "this quarter"; action: string }>;
}

export interface ReportNarrative {
  businessName: string;
  generatedAt: string;     // ISO timestamp
  reportId: string;
  pages: ReportPageNarrative[];
  // Raw analyses are stored alongside so DOCX/TXT can embed JSON blocks.
  analyses: Partial<Record<AgentId, AgentResult>>;
}
