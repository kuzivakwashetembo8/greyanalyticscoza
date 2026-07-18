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
    // Storage objects do not cascade when auth.users is deleted. Remove the
    // caller's private folder explicitly before deleting the account.
    const { data: objects, error: listError } = await supabaseAdmin.storage
      .from("original-documents")
      .list(userId, { limit: 1000 });
    if (listError) throw new Error(`Could not list stored documents: ${listError.message}`);
    if (objects?.length) {
      const paths = objects.map((object) => `${userId}/${object.name}`);
      const { error: removeError } = await supabaseAdmin.storage
        .from("original-documents")
        .remove(paths);
      if (removeError) throw new Error(`Could not remove stored documents: ${removeError.message}`);
    }
    // profiles / reports / uploads / alerts / accounting_connections all
    // cascade from auth.users on delete.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });
