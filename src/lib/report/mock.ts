// Deterministic mock narrative — fallback when GROQ_* keys are absent so the
// demo always produces a complete 5-page report.
import type { AgentResult } from "@/lib/analysis/types";
import type { ReportPageNarrative } from "./types";

export function mockNarrative(
  businessName: string,
  analyses: Partial<Record<string, AgentResult>>,
): ReportPageNarrative[] {
  const summarise = (label: string, agent: keyof typeof analyses, kicker: string): ReportPageNarrative => {
    const r = analyses[agent];
    return {
      agent: agent as ReportPageNarrative["agent"],
      title: label,
      summary: r
        ? `${kicker} ${businessName}. Confidence ${Math.round(r.confidence * 100)}% across ${r.anomalies.length} findings.`
        : `${kicker} (no data returned).`,
      anomalies: (r?.anomalies ?? []).slice(0, 6).map((a) => ({
        title: a.type.replace(/-/g, " "),
        description: a.description,
        fix: a.fix,
        severity: a.severity,
      })),
      insights: r?.insights ?? [],
    };
  };

  const finance = summarise("Finance Findings", "finance", "Cash movements were reviewed for");
  const ops = summarise("Operations Findings", "operations", "Operating costs and supplier patterns reviewed for");
  const compliance = summarise("Compliance Findings", "compliance", "SARS, COIDA and UIF filings reviewed for");
  const strategy = summarise("Strategy Findings", "strategy", "Growth, margin and concentration risk reviewed for");

  const allAnomalies = [finance, ops, compliance, strategy].flatMap((p) =>
    p.anomalies.map((a) => ({ ...a, page: p.title })),
  );
  const top = allAnomalies
    .sort((a, b) => (a.severity === "high" ? -1 : 0) - (b.severity === "high" ? -1 : 0))
    .slice(0, 6)
    .map((a) => ({ title: a.title, description: `${a.description} (from ${a.page})`, fix: a.fix, severity: a.severity }));

  const summary: ReportPageNarrative = {
    agent: "summary",
    title: "Comprehensive Summary & Strategic Roadmap",
    summary: `Across the four specialist agents, ${allAnomalies.length} findings were raised for ${businessName}. The most material are concentrated in finance and compliance, with material strategic risks around debtor days and supplier concentration.`,
    anomalies: top,
    insights: [
      "Most leakage is recoverable with three control changes inside one month.",
      "Compliance penalties compound monthly — fix these first.",
      "Liquidity, not profitability, is the binding constraint.",
    ],
    roadmap: [
      { horizon: "this week", action: "Settle outstanding SARS submissions and clear duplicate payments." },
      { horizon: "this week", action: "Move top 5 debtors to 7-day or debit-order terms." },
      { horizon: "this month", action: "Onboard a second supplier for packaging to remove single-source risk." },
      { horizon: "this month", action: "Cap overtime approvals above 10 hours per week." },
      { horizon: "this quarter", action: "Diversify customer base — target 3 new private-sector contracts." },
      { horizon: "this quarter", action: "Re-price top 10 SKUs and renegotiate input-cost terms." },
    ],
  };

  return [finance, ops, compliance, strategy, summary];
}
