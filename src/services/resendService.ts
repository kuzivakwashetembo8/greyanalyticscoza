// Resend email service wrapper.
//
// Runs server-side. Requires RESEND_API_KEY in process.env — if missing,
// logs a warning and returns a soft failure so the rest of the alert
// pipeline keeps working.
//
// Endpoint: POST https://api.resend.com/emails
// Auth: Authorization: Bearer ${RESEND_API_KEY}

const RESEND_URL = "https://api.resend.com/emails";

// Default sender — Resend's onboarding sandbox address. Override via
// RESEND_FROM_EMAIL once a verified domain is configured.
const DEFAULT_FROM = "Grey Analytics <onboarding@resend.dev>";

export interface SendEmailArgs {
  to: string;
  subject: string;
  text: string;       // plain-text body
  html?: string;      // optional HTML body
}

export interface SendEmailResult {
  ok: boolean;
  to: string;
  id?: string;
  error?: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailArgs): Promise<SendEmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[resendService] Skipping send: RESEND_API_KEY not set");
    return { ok: false, to, error: "Resend credentials not configured" };
  }
  if (!to || !to.trim()) {
    return { ok: false, to, error: "Missing recipient email" };
  }

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM,
        to: [to],
        subject,
        text,
        html: html ?? `<pre style="font-family:ui-sans-serif,system-ui">${text.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] ?? c))}</pre>`,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      const msg = data.message ?? `Resend HTTP ${res.status}`;
      console.error("[resendService] Send failed:", msg);
      return { ok: false, to, error: msg };
    }
    return { ok: true, to, id: data.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Resend request failed";
    console.error("[resendService] Exception:", msg);
    return { ok: false, to, error: msg };
  }
}
