// POST /api/accounting/disconnect/$provider — remove stored tokens.

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { deleteTokens } from "@/lib/accounting/storage";
import type { AccountingProvider } from "@/services/accounting/types";
import { recordSecurityEvent } from "@/lib/api/audit.server";

const PROVIDERS = new Set<AccountingProvider>(["xero", "quickbooks", "sage"]);

async function userIdFromRequest(request: Request): Promise<string | null> {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export const Route = createFileRoute("/api/accounting/disconnect/$provider")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const provider = params.provider as AccountingProvider;
        if (!PROVIDERS.has(provider)) return new Response("Unknown provider", { status: 400 });
        const userId = await userIdFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        try {
          await deleteTokens(userId, provider);
          await recordSecurityEvent(userId, "integration.disconnected", { provider });
          return Response.json({ ok: true });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Disconnect failed";
          return new Response(msg, { status: 500 });
        }
      },
    },
  },
});
