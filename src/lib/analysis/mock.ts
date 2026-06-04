// Mock analysis generator — used as a graceful fallback when a Groq API key
// is not configured for a given agent. The output deliberately mirrors the
// real AgentResult schema so the UI cannot tell the difference.

import type { AgentId, AgentResult, Anomaly, Severity } from "./types";
import { agentMeta } from "./types";

const POOL: Record<AgentId, Anomaly[]> = {
  finance: [
    { type: "duplicate-payment", description: "R12,480 paid twice to Mthatha Logistics within 3 days.", evidence: "Two EFTs of R12,480.00 on 12 May and 15 May, same reference.", severity: "high", fix: "Reverse the second payment and add a duplicate-detection rule in Xero." },
    { type: "weekend-spend", description: "Unusual R8,200 card spend on a Sunday at a non-trade supplier.", evidence: "Card txn 09 Jun, 13:42, 'Game East London'.", severity: "medium", fix: "Confirm with owner; if personal, journal to drawings." },
    { type: "vat-classification", description: "Fuel expense booked at 15% VAT instead of the correct deemed input.", evidence: "Account 5320 'Fuel' shows R3,140 input VAT.", severity: "low", fix: "Reclassify per SARS Binding Ruling 14." },
  ],
  operations: [
    { type: "overtime-spike", description: "Payroll overtime jumped 62% in May with no revenue uplift.", evidence: "EMP201 May overtime R41,200 vs Apr R25,400.", severity: "high", fix: "Audit shift rosters; cap overtime approval above 10 hrs/week." },
    { type: "missed-discount", description: "Lost 2.5% early-payment discount with PG Bison (R6,300).", evidence: "Invoice INV-44219 paid day 45, terms 10/30.", severity: "medium", fix: "Set payment reminder at day 8 for PG Bison invoices." },
    { type: "single-source", description: "100% of packaging via one supplier — concentration risk.", evidence: "All 14 packaging POs in Q2 to 'Plasti-Wrap EC'.", severity: "medium", fix: "Onboard a second packaging supplier in Q3." },
  ],
  compliance: [
    { type: "late-vat201", description: "VAT201 for April submitted 9 days late, penalty likely.", evidence: "Submission timestamp 06 Jun (due 25 May).", severity: "high", fix: "Settle penalty; enable eFiling auto-submit." },
    { type: "missing-tax-invoice", description: "R18,900 input VAT claimed on a non-compliant slip.", evidence: "Doc 'Builders Warehouse till slip' lacks VAT number.", severity: "high", fix: "Request valid tax invoice or reverse the input claim." },
    { type: "coida-roe", description: "COIDA Return of Earnings not yet filed for 2025.", evidence: "No ROE reference in compliance log.", severity: "medium", fix: "File ROE before 31 May to avoid 10% penalty." },
  ],
  strategy: [
    { type: "debtor-days", description: "Average debtor days = 67, well above sector norm (38).", evidence: "Aged debtors total R412k, monthly sales R184k.", severity: "high", fix: "Move top 5 debtors to debit-order or 7-day terms." },
    { type: "client-concentration", description: "Buffalo City Municipality = 41% of revenue.", evidence: "Customer ledger 2025 YTD.", severity: "medium", fix: "Target 3 new private-sector contracts this quarter." },
    { type: "margin-drift", description: "Gross margin slipped from 34% (Jan) to 27% (May).", evidence: "Monthly P&L summary 5-mo trend.", severity: "medium", fix: "Re-price the top 10 SKUs; renegotiate Plasti-Wrap terms." },
  ],
};

const INSIGHTS: Record<AgentId, string[]> = {
  finance: [
    "Most leakage is concentrated in a handful of recurring vendors — fixing 3 controls would recover ~R28k/month.",
    "Cash withdrawals exceed the SARB SMME median for similar turnover.",
  ],
  operations: [
    "Overtime is the single biggest controllable cost lever this quarter.",
    "Supplier dependency is the highest operational risk on the file.",
  ],
  compliance: [
    "SARS exposure is the most urgent item — penalties compound monthly.",
    "Document hygiene (valid tax invoices) is the cheapest compliance fix available.",
  ],
  strategy: [
    "The business is profitable on paper but liquidity-constrained — collections, not sales, is the bottleneck.",
    "Diversifying the customer base would unlock better trade-credit terms.",
  ],
};

function pick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

export function mockAgentResult(id: AgentId, text: string): AgentResult {
  // Make the mock feel responsive to input length — thinner text = lower confidence.
  const len = text?.trim().length ?? 0;
  const richness = Math.min(1, len / 4000);
  const count = Math.max(1, Math.round(2 + richness * 2));
  const anomalies = pick(POOL[id], count);
  const insights = pick(INSIGHTS[id], 2);
  const confidence = Number((0.55 + richness * 0.35).toFixed(2));
  return {
    agent: id,
    anomalies,
    insights,
    confidence,
    model: agentMeta(id).model,
    mocked: true,
  };
}

// Severity helper kept here so UI code can colour-code without importing types twice.
export const severityRank: Record<Severity, number> = { high: 3, medium: 2, low: 1 };
