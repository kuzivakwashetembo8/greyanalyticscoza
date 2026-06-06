// Alert pipeline server route.
//
// POST /api/alerts
// Body: AlertRequestPayload
//
// Filters the supplied anomalies down to those that matter (severity
// "high" OR amount > R2,000), formats the WhatsApp + email payloads, and
// dispatches each channel via the dedicated service wrapper. Always
// returns 200 with a structured result list so the client can persist
// per-channel status in its local alert history.

import { createFileRoute } from "@tanstack/react-router";
import { sendWhatsApp } from "@/services/twilioService";
import { sendEmail } from "@/services/resendService";
import type { AlertChannelResult, AlertRequestPayload, AlertResponse } from "@/lib/alerts/types";

const AMOUNT_THRESHOLD = 2000;

function fmtZAR(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "(amount n/a)";
  return `R${n.toLocaleString("en-ZA")}`;
}

function buildWhatsAppBody(p: AlertRequestPayload, top: AlertRequestPayload["anomalies"][number]) {
  // Spec format from the brief.
  return `GREY ANALYTICS ALERT – ${top.type} detected at ${p.businessName}. Amount: ${fmtZAR(top.amount)}. Suggested fix: ${top.fix || "see report"}. View full report: ${p.reportLink}`;
}

function buildEmailBody(p: AlertRequestPayload, list: AlertRequestPayload["anomalies"]) {
  const lines = [
    `Grey Analytics has detected ${list.length} priority finding${list.length === 1 ? "" : "s"} at ${p.businessName}.`,
    "",
    ...list.map((a, i) =>
      [
        `${i + 1}. ${a.type}  [${a.severity.toUpperCase()}]`,
        `   Amount:      ${fmtZAR(a.amount)}`,
        `   Detail:      ${a.description}`,
        `   Suggested:   ${a.fix || "(see report)"}`,
      ].join("\n"),
    ),
    "",
    `Full report: ${p.reportLink}`,
    "",
    "— Grey Analytics",
  ];
  return lines.join("\n");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export const Route = createFileRoute("/api/alerts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: AlertRequestPayload;
        try { payload = (await request.json()) as AlertRequestPayload; }
        catch { return json({ success: false, error: "Invalid JSON" }, 400); }

        const triggered = (payload.anomalies ?? []).filter(
          (a) => a.severity === "high" || (Number.isFinite(a.amount) && a.amount > AMOUNT_THRESHOLD),
        );

        if (triggered.length === 0) {
          const empty: AlertResponse = {
            success: true, triggered: false,
            reason: "No anomalies met the high-severity / R2,000 threshold.",
            results: [], anomalies: [],
          };
          return json(empty);
        }

        // Send to the highest-amount finding via WhatsApp (single message),
        // and a digest of all triggered findings via email.
        const top = [...triggered].sort((a, b) => (b.amount || 0) - (a.amount || 0))[0];
        const results: AlertChannelResult[] = [];

        if (payload.whatsappTo && payload.whatsappTo.trim()) {
          const r = await sendWhatsApp({ to: payload.whatsappTo, body: buildWhatsAppBody(payload, top) });
          results.push({
            channel: "whatsapp",
            to: payload.whatsappTo,
            status: r.ok ? "sent" : "failed",
            error: r.error,
          });
        } else {
          console.warn("[api/alerts] No WhatsApp number on file — skipping WhatsApp channel");
        }

        if (payload.emailTo && payload.emailTo.trim()) {
          const subject = `Alert: ${top.type} detected – ${payload.businessName}`;
          const r = await sendEmail({
            to: payload.emailTo,
            subject,
            text: buildEmailBody(payload, triggered),
          });
          results.push({
            channel: "email",
            to: payload.emailTo,
            status: r.ok ? "sent" : "failed",
            error: r.error,
          });
        } else {
          console.warn("[api/alerts] No email on file — skipping email channel");
        }

        const response: AlertResponse = {
          success: true,
          triggered: true,
          results,
          anomalies: triggered,
        };
        return json(response);
      },
    },
  },
});
