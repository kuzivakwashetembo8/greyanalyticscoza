// GET /api/accounting/status — list which providers are connected for the user.

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { listUserConnections } from "@/lib/accounting/storage";
import { ACCOUNTING_PROVIDERS } from "@/services/accounting";

async function userIdFromRequest(request: Request): Promise<string | null> {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export const Route = createFileRoute("/api/accounting/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const userId = await userIdFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        try {
          const rows = await listUserConnections(userId);
          const byProvider = new Map(rows.map((r) => [r.provider, r]));
          const result = ACCOUNTING_PROVIDERS.map((p) => {
            const row = byProvider.get(p);
            return {
              provider: p,
              connected: Boolean(row),
              externalId: row?.external_id ?? undefined,
              metadata: row?.metadata ?? undefined,
              expiresAt: row?.expires_at ?? undefined,
            };
          });
          return Response.json(result);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Status failed";
          return new Response(msg, { status: 500 });
        }
      },
    },
  },
});
