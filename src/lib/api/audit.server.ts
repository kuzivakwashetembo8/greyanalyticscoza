import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function recordSecurityEvent(
  userId: string,
  event: string,
  detail: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await supabaseAdmin.from("audit_log").insert({
    user_id: userId,
    event,
    detail: JSON.parse(JSON.stringify({ ...detail, at: new Date().toISOString() })),
  });
  if (error) console.error(`[audit] ${event}:`, error.message);
}
