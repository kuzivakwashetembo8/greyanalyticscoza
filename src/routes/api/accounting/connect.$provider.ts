// GET /api/accounting/connect/$provider
// Starts the OAuth flow. Requires an authenticated user (we encode their
// user id into `state` so the callback can persist tokens against them).
//
// NOTE: For full CSRF protection in production, also sign `state` with an
// HMAC and verify on callback. Left intentionally simple here; rotate
// SESSION_SECRET if you add HMAC signing later.

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getAccountingService, type AccountingProvider } from "@/services/accounting";

const PROVIDERS = new Set<AccountingProvider>(["xero", "quickbooks", "sage"]);

async function userIdFromRequest(request: Request): Promise<string | null> {
  // Prefer Authorization header; fall back to ?token=... for top-level
  // browser redirects that cannot set headers.
  const auth = request.headers.get("authorization");
  let token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  if (!token) {
    const url = new URL(request.url);
    token = url.searchParams.get("token") ?? undefined;
  }
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export const Route = createFileRoute("/api/accounting/connect/$provider")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const provider = params.provider as AccountingProvider;
        if (!PROVIDERS.has(provider)) return new Response("Unknown provider", { status: 400 });

        const userId = await userIdFromRequest(request);
        if (!userId) {
          // The browser will normally be sending a session cookie via Supabase,
          // but during a top-level redirect we may not have one yet. Bounce to
          // /login with a `next` param.
          const next = `/api/accounting/connect/${provider}`;
          return Response.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, request.url), 302);
        }

        const svc = getAccountingService(provider);
        try {
          const state = Buffer.from(JSON.stringify({ userId, provider, ts: Date.now() })).toString("base64url");
          const url = svc.getAuthUrl(state);
          return Response.redirect(url, 302);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "OAuth start failed";
          console.error(`[accounting/connect/${provider}]`, msg);
          return new Response(msg, { status: 500 });
        }
      },
    },
  },
});
