// Lightweight server-side error monitor. Writes failures into audit_log so
// operators can inspect them per-user. Callers can also pass a userId of
// null for anonymous / cross-cutting errors — those rows are skipped
// (audit_log requires a user_id) but the console log is still emitted.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function logServerError(
  userId: string | null,
  event: string,
  detail: Record<string, unknown> = {},
): Promise<void> {
  const safe = { ...detail, at: new Date().toISOString() };
  console.error(`[monitor] ${event}`, safe);
  if (!userId) return;
  try {
    await supabaseAdmin.from("audit_log").insert({
      user_id: userId,
      event: `error.${event}`,
      detail: safe as unknown as Record<string, unknown>,
    });
  } catch (err) {
    console.error("[monitor] audit_log insert failed:", err);
  }
}