// Tiny browser-side client for accounting integrations.
// Real work happens server-side; the UI only opens the auth URL and
// triggers sync/disconnect via /api/accounting/*.

import type { AccountingProvider, NormalisedTransaction } from "@/services/accounting/types";

export interface ConnectionStatus {
  provider: AccountingProvider;
  connected: boolean;
  externalId?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: string;
}

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function listConnections(): Promise<ConnectionStatus[]> {
  return asJson(await fetch("/api/accounting/status", { credentials: "include" }));
}

export function startConnect(provider: AccountingProvider): void {
  // Full-page redirect so the OAuth provider can take over.
  window.location.href = `/api/accounting/connect/${provider}`;
}

export async function disconnect(provider: AccountingProvider): Promise<void> {
  await asJson(await fetch(`/api/accounting/disconnect/${provider}`, {
    method: "POST",
    credentials: "include",
  }));
}

export async function syncTransactions(
  provider: AccountingProvider,
  opts: { from?: string; to?: string; limit?: number } = {},
): Promise<{ transactions: NormalisedTransaction[] }> {
  return asJson(await fetch(`/api/accounting/sync/${provider}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  }));
}
