// Transmit Assessment — shared types for the four-agent analysis pipeline.
// Kept framework-agnostic so the server route and the client UI can share them.

export type AgentId = "finance" | "operations" | "compliance" | "strategy";

export type Severity = "high" | "medium" | "low";

export interface Anomaly {
  type: string;
  description: string;
  evidence: string;
  severity: Severity;
  fix: string;
}

export interface AgentResult {
  agent: AgentId;
  anomalies: Anomaly[];
  insights: string[];
  confidence: number; // 0..1
  model: string;
  mocked: boolean; // true when fallback mock data was used (no API key)
}

export interface AgentMeta {
  id: AgentId;
  label: string;
  model: string;
  envKey: string; // name of the env var holding this agent's Groq key
  focus: string;
}

export const AGENTS: AgentMeta[] = [
  {
    id: "finance",
    label: "Finance",
    model: "openai/gpt-oss-120b",
    envKey: "GROQ_FINANCE_KEY",
    focus: "Duplicate payments, expense anomalies, misclassified transactions",
  },
  {
    id: "operations",
    label: "Operations",
    model: "openai/gpt-oss-20b",
    envKey: "GROQ_OPERATIONS_KEY",
    focus: "Overstocking, overtime payroll spikes, missed early-payment discounts, supplier cycle irregularities",
  },
  {
    id: "compliance",
    label: "Compliance",
    model: "llama-3.3-70b-versatile",
    envKey: "GROQ_COMPLIANCE_KEY",
    focus: "Missing invoices, late statutory submissions, incorrect VAT output, non-compliant deductions",
  },
  {
    id: "strategy",
    label: "Strategy",
    model: "llama-3.1-8b-instant",
    envKey: "GROQ_STRATEGY_KEY",
    focus: "Cashflow bottlenecks, customer concentration risk, growth margin trends, top-line improvement suggestions",
  },
];

export const agentMeta = (id: AgentId): AgentMeta =>
  AGENTS.find((a) => a.id === id) as AgentMeta;
