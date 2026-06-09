// GET /api/accounting/callback/$provider
// OAuth provider redirects the user here with ?code=...&state=...
// We decode the state to recover the user, exchange the code for tokens,
// persist them, and bounce the user back to /settings.

import { createFileRoute } from "@tanstack/react-router";
import { getAccountingService, type AccountingProvider } from "@/services/accounting";
import { saveTokens } from "@/lib/accounting/storage";

const PROVIDERS = new Set<AccountingProvider>(["xero", "quickbooks", "sage"]);

export const Route = createFileRoute("/api/accounting/callback/$provider")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const provider = params.provider as AccountingProvider;
        if (!PROVIDERS.has(provider)) return new Response("Unknown provider", { status: 400 });

        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const stateRaw = url.searchParams.get("state");
        const error = url.searchParams.get("error");
        // Intuit appends realmId to the callback querystring.
        const realmId = url.searchParams.get("realmId") ?? undefined;

        if (error) {
          return Response.redirect(new URL(`/settings?integration=${provider}&error=${encodeURIComponent(error)}`, url), 302);
        }
        if (!code || !stateRaw) return new Response("Missing code or state", { status: 400 });

        let userId: string;
        try {
          const decoded = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf8")) as { userId: string };
          userId = decoded.userId;
          if (!userId) throw new Error("missing userId in state");
        } catch {
          return new Response("Invalid state", { status: 400 });
        }

        const svc = getAccountingService(provider);
        try {
          // QuickBooks needs realmId; pack it back into the state string for the service.
          const stateForExchange = provider === "quickbooks" ? JSON.stringify({ realmId }) : stateRaw;
          const tokens = await svc.exchangeCode(code, stateForExchange);
          await saveTokens(userId, provider, tokens);
          return Response.redirect(new URL(`/settings?integration=${provider}&status=connected`, url), 302);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Token exchange failed";
          console.error(`[accounting/callback/${provider}]`, msg);
          return Response.redirect(new URL(`/settings?integration=${provider}&error=${encodeURIComponent(msg)}`, url), 302);
        }
      },
    },
  },
});
