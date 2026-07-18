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
import { requireBearer } from "@/lib/api/auth-helpers.server";
import { requireRateLimit } from "@/lib/api/rate-limit.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { logServerError } from "@/lib/api/monitoring.server";

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
        const auth = await requireBearer(request);
        if (!auth.ok) return auth.response;
        const rl = await requireRateLimit(auth.userId, "alerts", 20, 10);
        if (!rl.allowed) return rl.response;
        let payload: AlertRequestPayload;
        try { payload = (await request.json()) as AlertRequestPayload; }
        catch { return json({ success: false, error: "Invalid JSON" }, 400); }

        // Load user profile: channel prefs override request-supplied destinations.
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("email, whatsapp, notify_email, notify_whatsapp")
          .eq("id", auth.userId).maybeSingle();

        const notifyEmail = profile?.notify_email !== false;
        const notifyWhats = profile?.notify_whatsapp !== false;
        const emailTo = notifyEmail ? (payload.emailTo ?? profile?.email ?? "") : "";
        const whatsappTo = notifyWhats ? (payload.whatsappTo ?? profile?.whatsapp ?? "") : "";

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

        // Insert a parent alerts row so per-channel deliveries can FK to it.
        const { data: alertRow, error: alertErr } = await supabaseAdmin
          .from("alerts")
          .insert({
            user_id: auth.userId,
            report_id: payload.reportId?.match(/^[0-9a-f-]{36}$/i) ? payload.reportId : null,
            leak_type: top.type,
            amount: top.amount || 0,
            severity: top.severity,
            message: `${top.type} at ${payload.businessName}: ${top.description}`,
            delivery_status: "pending",
          })
          .select("id")
          .single();
        if (alertErr) {
          await logServerError(auth.userId, "alerts.insert", { message: alertErr.message });
        }
        const alertId = alertRow?.id;

        async function recordDelivery(channel: "whatsapp" | "email", to: string, ok: boolean, err?: string, providerId?: string) {
          if (!alertId) return;
          await supabaseAdmin.from("alert_deliveries").insert({
            alert_id: alertId,
            user_id: auth.userId,
            channel,
            status: ok ? "sent" : "failed",
            error: err ?? null,
            provider_id: providerId ?? null,
          });
        }

        if (whatsappTo && whatsappTo.trim()) {
          const r = await sendWhatsApp({ to: whatsappTo, body: buildWhatsAppBody(payload, top) });
          results.push({
            channel: "whatsapp",
            to: whatsappTo,
            status: r.ok ? "sent" : "failed",
            error: r.error,
          });
          await recordDelivery("whatsapp", whatsappTo, r.ok, r.error, r.sid);
        } else {
          console.warn("[api/alerts] WhatsApp channel skipped (opted out or no number)");
        }

        if (emailTo && emailTo.trim()) {
          const subject = `Alert: ${top.type} detected – ${payload.businessName}`;
          const r = await sendEmail({
            to: emailTo,
            subject,
            text: buildEmailBody(payload, triggered),
          });
          results.push({
            channel: "email",
            to: emailTo,
            status: r.ok ? "sent" : "failed",
            error: r.error,
          });
          await recordDelivery("email", emailTo, r.ok, r.error, r.id);
        } else {
          console.warn("[api/alerts] Email channel skipped (opted out or no address)");
        }

        // Update parent alert with rolled-up status.
        if (alertId) {
          const anySent = results.some((r) => r.status === "sent");
          const allSent = results.length > 0 && results.every((r) => r.status === "sent");
          const rollUp = allSent ? "sent" : anySent ? "partial" : "failed";
          await supabaseAdmin.from("alerts").update({
            delivery_status: rollUp,
            channel: results.map((r) => r.channel).join(","),
          }).eq("id", alertId);
        }

        // Mark report as alerted so the UI can dedupe.
        if (payload.reportId && /^[0-9a-f-]{36}$/i.test(payload.reportId)) {
          await supabaseAdmin.from("reports")
            .update({ alerts_sent_at: new Date().toISOString() })
            .eq("id", payload.reportId)
            .eq("user_id", auth.userId);
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
