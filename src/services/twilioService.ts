// Twilio WhatsApp service wrapper.
//
// Runs server-side (called from `/api/alerts`). Reads Twilio credentials
// from process.env — if any are missing we log a warning and return a
// soft failure so the rest of the alert pipeline keeps working.
//
// Endpoint: POST https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json
// Auth: HTTP Basic (AccountSID:AuthToken)
// Body: application/x-www-form-urlencoded with To / From / Body.
//
// WhatsApp requires the `whatsapp:` URI prefix on both To and From. We
// normalise raw E.164 numbers (e.g. "+27821234567") to that scheme.

const TWILIO_BASE = "https://api.twilio.com/2010-04-01/Accounts";

function withWhatsAppPrefix(num: string): string {
  const trimmed = num.trim();
  if (trimmed.startsWith("whatsapp:")) return trimmed;
  return `whatsapp:${trimmed}`;
}

export interface SendWhatsAppArgs {
  to: string;       // user's number, with country code, e.g. +27821234567
  body: string;     // message text (already formatted by caller)
}

export interface SendWhatsAppResult {
  ok: boolean;
  to: string;
  error?: string;
  sid?: string;
}

export async function sendWhatsApp({ to, body }: SendWhatsAppArgs): Promise<SendWhatsAppResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    console.warn("[twilioService] Skipping send: TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER not set");
    return { ok: false, to, error: "Twilio credentials not configured" };
  }

  if (!to || !to.trim()) {
    return { ok: false, to, error: "Missing recipient WhatsApp number" };
  }

  const form = new URLSearchParams({
    To: withWhatsAppPrefix(to),
    From: withWhatsAppPrefix(from),
    Body: body,
  });

  try {
    const auth = btoa(`${sid}:${token}`);
    const res = await fetch(`${TWILIO_BASE}/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string; code?: number };
    if (!res.ok) {
      const msg = data.message ?? `Twilio HTTP ${res.status}`;
      console.error("[twilioService] Send failed:", msg);
      return { ok: false, to, error: msg };
    }
    return { ok: true, to, sid: data.sid };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Twilio request failed";
    console.error("[twilioService] Exception:", msg);
    return { ok: false, to, error: msg };
  }
}
