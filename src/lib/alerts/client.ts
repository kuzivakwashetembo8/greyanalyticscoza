// Client-side helper: fires the alert pipeline and persists results in
// localStorage so the AlertsPage can render delivery history.

import type { AgentResult, Anomaly } from "@/lib/analysis/types";
import type { AlertRequestPayload, AlertResponse, SentAlert } from "./types";
import { appendSentAlerts, updateSentAlert } from "./storage";
import { bearerHeaders } from "@/lib/api/bearer";

/**
 * Extract a ZAR amount from an anomaly's free-form text. Looks at
 * description + evidence + fix. Returns 0 when nothing parseable found.
 */
export function extractAmount(a: Anomaly): number {
  const blob = `${a.description} ${a.evidence} ${a.fix}`;
  // Match R12,480.00 / R 12 480 / R12480 — capture digits possibly
  // separated by spaces, commas, dots.
  const m = blob.match(/R\s?([\d][\d\s.,]{1,})/i);
  if (!m) return 0;
  const raw = m[1].replace(/\s/g, "").replace(/,/g, "");
  // Treat the last dot as decimal separator if present and has 1-2 digits after.
  const dotIdx = raw.lastIndexOf(".");
  let n: number;
  if (dotIdx > -1 && raw.length - dotIdx - 1 <= 2) {
    n = parseFloat(raw);
  } else {
    n = parseFloat(raw.replace(/\./g, ""));
  }
  return Number.isFinite(n) ? n : 0;
}

export function collectTriggerAnomalies(results: Partial<Record<string, AgentResult>>): AlertRequestPayload["anomalies"] {
  const out: AlertRequestPayload["anomalies"] = [];
  for (const r of Object.values(results)) {
    if (!r) continue;
    for (const a of r.anomalies) {
      const amount = extractAmount(a);
      if (a.severity === "high" || amount > 2000) {
        out.push({
          type: a.type,
          amount,
          severity: a.severity,
          fix: a.fix,
          description: a.description,
        });
      }
    }
  }
  return out;
}

export interface TriggerAlertsArgs {
  reportId: string;
  businessName: string;
  whatsappTo?: string;
  emailTo?: string;
  analyses: Partial<Record<string, AgentResult>>;
}

export interface TriggerAlertsOutcome {
  triggered: boolean;
  response?: AlertResponse;
  persisted: SentAlert[];   // rows written to localStorage history
  error?: string;
}

/**
 * Build the payload, call /api/alerts, then persist one history row per
 * (anomaly × channel) so the AlertsPage shows real delivery status.
 */
export async function triggerAlerts(args: TriggerAlertsArgs): Promise<TriggerAlertsOutcome> {
  const anomalies = collectTriggerAnomalies(args.analyses);
  if (anomalies.length === 0) {
    return { triggered: false, persisted: [] };
  }

  const payload: AlertRequestPayload = {
    reportId: args.reportId,
    businessName: args.businessName,
    whatsappTo: args.whatsappTo,
    emailTo: args.emailTo,
    // Placeholder link for now per spec.
    reportLink: `${typeof window !== "undefined" ? window.location.origin : ""}/inspection/${args.reportId}`,
    anomalies,
  };

  try {
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await bearerHeaders()) },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as AlertResponse;
    if (!res.ok) throw new Error(data.reason ?? `Alert dispatch failed (HTTP ${res.status})`);
    if (!data.triggered) return { triggered: false, response: data, persisted: [] };

    const top = [...anomalies].sort((a, b) => (b.amount || 0) - (a.amount || 0))[0];
    const rows: SentAlert[] = data.results.map((r) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${r.channel}`,
      reportId: args.reportId,
      businessName: args.businessName,
      anomalyType: top.type,
      amount: top.amount,
      severity: top.severity,
      fixSummary: top.fix,
      channel: r.channel,
      status: r.status,
      to: r.to,
      sentAt: Date.now(),
      error: r.error,
    }));
    appendSentAlerts(rows);
    return { triggered: true, response: data, persisted: rows };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Alert dispatch failed";
    // Record both channels as failed so the user sees something they can retry.
    const top = anomalies[0];
    const rows: SentAlert[] = [];
    if (args.whatsappTo) rows.push(makeFailedRow(args, top, "whatsapp", args.whatsappTo, msg));
    if (args.emailTo) rows.push(makeFailedRow(args, top, "email", args.emailTo, msg));
    if (rows.length) appendSentAlerts(rows);
    return { triggered: true, persisted: rows, error: msg };
  }
}

function makeFailedRow(
  args: TriggerAlertsArgs,
  top: AlertRequestPayload["anomalies"][number],
  channel: "whatsapp" | "email",
  to: string,
  error: string,
): SentAlert {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${channel}`,
    reportId: args.reportId,
    businessName: args.businessName,
    anomalyType: top.type,
    amount: top.amount,
    severity: top.severity,
    fixSummary: top.fix,
    channel,
    status: "failed",
    to,
    sentAt: Date.now(),
    error,
  };
}

/** Retry a single previously-failed alert row by re-sending only its channel. */
export async function retrySingleAlert(row: SentAlert): Promise<SentAlert> {
  const retryCount = row.retryCount ?? 0;
  if (retryCount >= 3) {
    const error = "Retry limit reached (3 attempts).";
    updateSentAlert(row.id, { error, retryCount });
    return { ...row, error, retryCount };
  }
  const payload: AlertRequestPayload = {
    reportId: row.reportId,
    businessName: row.businessName,
    whatsappTo: row.channel === "whatsapp" ? row.to : undefined,
    emailTo: row.channel === "email" ? row.to : undefined,
    reportLink: `${typeof window !== "undefined" ? window.location.origin : ""}/inspection/${row.reportId}`,
    anomalies: [{
      type: row.anomalyType,
      amount: row.amount,
      severity: row.severity,
      fix: row.fixSummary,
      description: row.fixSummary,
    }],
    retryChannel: row.channel,
  };
  try {
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await bearerHeaders()) },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as AlertResponse;
    if (!res.ok) throw new Error(data.reason ?? `Alert retry failed (HTTP ${res.status})`);
    const ch = data.results.find((r) => r.channel === row.channel);
    const patch: Partial<SentAlert> = ch
      ? { status: ch.status, error: ch.error, sentAt: Date.now(), retryCount: retryCount + 1 }
      : { status: "failed", error: "Channel not attempted", sentAt: Date.now(), retryCount: retryCount + 1 };
    updateSentAlert(row.id, patch);
    return { ...row, ...patch };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Retry failed";
    updateSentAlert(row.id, { status: "failed", error: msg, sentAt: Date.now(), retryCount: retryCount + 1 });
    return { ...row, status: "failed", error: msg, sentAt: Date.now(), retryCount: retryCount + 1 };
  }
}
