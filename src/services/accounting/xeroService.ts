// Xero Accounting API integration.
//
// Docs: https://developer.xero.com/documentation/guides/oauth2/auth-flow/
// OAuth 2.0 Authorization-Code flow:
//   1. Redirect user to https://login.xero.com/identity/connect/authorize
//   2. Xero redirects back with ?code=...&state=...
//   3. POST to https://identity.xero.com/connect/token (Basic auth)
//   4. GET https://api.xero.com/connections to discover tenantId(s)
//   5. Call /api.xro/2.0/* with `Authorization: Bearer` and `xero-tenant-id`
//
// Required env vars (server-only):
//   XERO_CLIENT_ID
//   XERO_CLIENT_SECRET
//   XERO_REDIRECT_URI   e.g. https://yourapp.com/api/accounting/callback/xero

import {
  type AccountingService,
  type AccountingTokens,
  type NormalisedTransaction,
  MissingProviderConfigError,
} from "./types";

const AUTH_URL = "https://login.xero.com/identity/connect/authorize";
const TOKEN_URL = "https://identity.xero.com/connect/token";
const CONNECTIONS_URL = "https://api.xero.com/connections";
const API_BASE = "https://api.xero.com/api.xro/2.0";

const SCOPES = [
  "offline_access",
  "accounting.transactions.read",
  "accounting.contacts.read",
  "accounting.reports.read",
  "accounting.settings.read",
].join(" ");

function requireConfig() {
  const clientId = process.env.XERO_CLIENT_ID;
  const clientSecret = process.env.XERO_CLIENT_SECRET;
  const redirectUri = process.env.XERO_REDIRECT_URI;
  const missing: string[] = [];
  if (!clientId) missing.push("XERO_CLIENT_ID");
  if (!clientSecret) missing.push("XERO_CLIENT_SECRET");
  if (!redirectUri) missing.push("XERO_REDIRECT_URI");
  if (missing.length) throw new MissingProviderConfigError("xero", missing);
  return { clientId: clientId!, clientSecret: clientSecret!, redirectUri: redirectUri! };
}

function basicAuth(clientId: string, clientSecret: string) {
  return "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

async function postToken(body: URLSearchParams): Promise<AccountingTokens> {
  const { clientId, clientSecret } = requireConfig();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuth(clientId, clientSecret),
    },
    body,
  });
  if (!res.ok) throw new Error(`Xero token exchange failed (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  // Discover tenant for this token.
  const connRes = await fetch(CONNECTIONS_URL, {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  const connections = connRes.ok
    ? ((await connRes.json()) as Array<{ tenantId: string; tenantName?: string }>)
    : [];
  const primary = connections[0];

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    externalId: primary?.tenantId,
    metadata: { tenantName: primary?.tenantName, allTenants: connections },
  };
}

async function xeroGet<T>(path: string, tokens: AccountingTokens): Promise<T> {
  if (!tokens.externalId) throw new Error("Xero connection missing tenantId");
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      "xero-tenant-id": tokens.externalId,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`Xero GET ${path} failed (${res.status}): ${await res.text()}`);
  return (await res.json()) as T;
}

export const xeroService: AccountingService = {
  provider: "xero",

  getAuthUrl(state: string): string {
    const { clientId, redirectUri } = requireConfig();
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: SCOPES,
      state,
    });
    return `${AUTH_URL}?${params.toString()}`;
  },

  async exchangeCode(code: string): Promise<AccountingTokens> {
    const { redirectUri } = requireConfig();
    return postToken(new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }));
  },

  async refresh(refreshToken: string): Promise<AccountingTokens> {
    return postToken(new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }));
  },

  async fetchTransactions(
    tokens: AccountingTokens,
    opts: { from?: string; to?: string; limit?: number } = {},
  ): Promise<NormalisedTransaction[]> {
    const data = await xeroGet<{
      BankTransactions?: Array<{
        BankTransactionID: string;
        Date: string;
        Type: string;
        Total: number;
        CurrencyCode: string;
        Reference?: string;
        Contact?: { Name?: string };
        BankAccount?: { Name?: string };
      }>;
    }>("/BankTransactions?order=Date%20DESC", tokens);

    const rows = data.BankTransactions ?? [];
    const limit = opts.limit ?? 200;
    return rows.slice(0, limit).map((t) => {
      const ms = Number(/\/Date\((\d+)/.exec(t.Date)?.[1] ?? Date.now());
      const sign = t.Type?.startsWith("SPEND") ? -1 : 1;
      return {
        id: t.BankTransactionID,
        date: new Date(ms).toISOString().slice(0, 10),
        description: t.Reference ?? t.Contact?.Name ?? t.Type,
        amount: sign * Number(t.Total ?? 0),
        currency: t.CurrencyCode ?? "ZAR",
        account: t.BankAccount?.Name,
        contact: t.Contact?.Name,
        reference: t.Reference,
        raw: t,
      };
    });
  },
};
