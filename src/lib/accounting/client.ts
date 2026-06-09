// Tiny browser-side client for accounting integrations.
// Real work happens server-side; the UI only opens the auth URL and
// triggers sync/disconnect via /api/accounting/*.

import type { AccountingProvider, NormalisedTransaction } from "@/services/accounting/types";
import { supabase } from "@/integrations/supabase/client";

export interface ConnectionStatus {
  provider: AccountingProvider;
  connected: boolean;
  externalId?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: string;
}

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function listConnections(): Promise<ConnectionStatus[]> {
  return asJson(await fetch("/api/accounting/status", { headers: await authHeaders() }));
}

export async function startConnect(provider: AccountingProvider): Promise<void> {
  // We can't add headers to a top-level browser navigation, so pass the
  // access token as a one-shot query param. The connect route reads either
  // the Authorization header OR ?token=... for the redirect bootstrap.
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? "";
  window.location.href = `/api/accounting/connect/${provider}?token=${encodeURIComponent(token)}`;
}

export async function disconnect(provider: AccountingProvider): Promise<void> {
  await asJson(await fetch(`/api/accounting/disconnect/${provider}`, {
    method: "POST",
    headers: await authHeaders(),
  }));
}

export async function syncTransactions(
  provider: AccountingProvider,
  opts: { from?: string; to?: string; limit?: number } = {},
): Promise<{ transactions: NormalisedTransaction[] }> {
  const headers = { ...(await authHeaders()), "Content-Type": "application/json" };
  return asJson(await fetch(`/api/accounting/sync/${provider}`, {
    method: "POST",
    headers,
    body: JSON.stringify(opts),
  }));
}
