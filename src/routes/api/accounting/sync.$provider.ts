// POST /api/accounting/sync/$provider — pull latest transactions.
// Refreshes the access token if expired, then returns a normalised list.

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getFreshTokens } from "@/lib/accounting/storage";
import { getAccountingService } from "@/services/accounting";
import type { AccountingProvider } from "@/services/accounting/types";

const PROVIDERS = new Set<AccountingProvider>(["xero", "quickbooks", "sage"]);

async function userIdFromRequest(request: Request): Promise<string | null> {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export const Route = createFileRoute("/api/accounting/sync/$provider")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const provider = params.provider as AccountingProvider;
        if (!PROVIDERS.has(provider)) return new Response("Unknown provider", { status: 400 });
        const userId = await userIdFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });

        let body: { from?: string; to?: string; limit?: number } = {};
        try { body = (await request.json()) as typeof body; } catch { /* empty body ok */ }

        try {
          const tokens = await getFreshTokens(userId, provider);
          if (!tokens) return new Response("Not connected", { status: 404 });
          const svc = getAccountingService(provider);
          const transactions = await svc.fetchTransactions(tokens, body);
          return Response.json({ transactions });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Sync failed";
          console.error(`[accounting/sync/${provider}]`, msg);
          return new Response(msg, { status: 500 });
        }
      },
    },
  },
});
