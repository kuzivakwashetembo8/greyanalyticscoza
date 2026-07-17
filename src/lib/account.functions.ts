// Server-side account deletion. Deletes profile + reports (via CASCADE)
// and finally removes the auth.users row using the service-role admin
// client. Loaded inside the handler to keep the admin client off the
// client bundle graph.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    // Best-effort cleanup of user-owned data (RLS enforces ownership).
    await supabase.from("audit_log").insert({
      user_id: userId,
      event: "account.delete_requested",
      detail: {},
    });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // profiles / reports / uploads / alerts / accounting_connections all
    // cascade from auth.users on delete.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });