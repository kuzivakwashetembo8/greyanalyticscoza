// QuickBooks Online (Intuit) integration.
//
// Docs:
//   OAuth 2.0:   https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0
//   Accounting:  https://developer.intuit.com/app/developer/qbo/docs/api/accounting
//
// Required env vars (server-only):
//   QUICKBOOKS_CLIENT_ID
//   QUICKBOOKS_CLIENT_SECRET
//   QUICKBOOKS_REDIRECT_URI
//   QUICKBOOKS_ENV          "sandbox" (default) or "production"

import {
  type AccountingService,
  type AccountingTokens,
  type NormalisedTransaction,
  MissingProviderConfigError,
} from "./types";

const AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const SCOPES = "com.intuit.quickbooks.accounting";

function requireConfig() {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI;
  const missing: string[] = [];
  if (!clientId) missing.push("QUICKBOOKS_CLIENT_ID");
  if (!clientSecret) missing.push("QUICKBOOKS_CLIENT_SECRET");
  if (!redirectUri) missing.push("QUICKBOOKS_REDIRECT_URI");
  if (missing.length) throw new MissingProviderConfigError("quickbooks", missing);
  const env = (process.env.QUICKBOOKS_ENV ?? "sandbox").toLowerCase();
  const apiBase = env === "production"
    ? "https://quickbooks.api.intuit.com/v3/company"
    : "https://sandbox-quickbooks.api.intuit.com/v3/company";
  return { clientId: clientId!, clientSecret: clientSecret!, redirectUri: redirectUri!, apiBase };
}

function basicAuth(clientId: string, clientSecret: string) {
  return "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

async function postToken(body: URLSearchParams, realmId?: string): Promise<AccountingTokens> {
  const { clientId, clientSecret } = requireConfig();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: basicAuth(clientId, clientSecret),
    },
    body,
  });
  if (!res.ok) throw new Error(`QuickBooks token exchange failed (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    x_refresh_token_expires_in?: number;
  };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    externalId: realmId,
    metadata: { refreshExpiresIn: data.x_refresh_token_expires_in },
  };
}

export const quickbooksService: AccountingService = {
  provider: "quickbooks",

  getAuthUrl(state: string): string {
    const { clientId, redirectUri } = requireConfig();
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      scope: SCOPES,
      redirect_uri: redirectUri,
      state,
    });
    return `${AUTH_URL}?${params.toString()}`;
  },

  async exchangeCode(code: string, state?: string): Promise<AccountingTokens> {
    const { redirectUri } = requireConfig();
    // Intuit returns realmId on the callback querystring; the route handler
    // packs it into JSON state so we can recover it here.
    let realmId: string | undefined;
    try { realmId = state ? (JSON.parse(state) as { realmId?: string }).realmId : undefined; } catch { /* state not JSON */ }
    return postToken(new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }), realmId);
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
    const { apiBase } = requireConfig();
    if (!tokens.externalId) throw new Error("QuickBooks connection missing realmId");
    const limit = opts.limit ?? 200;
    const query = encodeURIComponent(
      `SELECT * FROM Purchase ORDER BY TxnDate DESC MAXRESULTS ${limit}`,
    );
    const res = await fetch(`${apiBase}/${tokens.externalId}/query?query=${query}&minorversion=70`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new Error(`QuickBooks query failed (${res.status}): ${await res.text()}`);
    const data = (await res.json()) as {
      QueryResponse?: {
        Purchase?: Array<{
          Id: string;
          TxnDate: string;
          TotalAmt: number;
          CurrencyRef?: { value: string };
          PrivateNote?: string;
          DocNumber?: string;
          EntityRef?: { name?: string };
          AccountRef?: { name?: string };
        }>;
      };
    };
    const rows = data.QueryResponse?.Purchase ?? [];
    return rows.map((p) => ({
      id: p.Id,
      date: p.TxnDate,
      description: p.PrivateNote ?? p.EntityRef?.name ?? `Purchase ${p.DocNumber ?? p.Id}`,
      amount: -Math.abs(Number(p.TotalAmt ?? 0)),
      currency: p.CurrencyRef?.value ?? "USD",
      account: p.AccountRef?.name,
      contact: p.EntityRef?.name,
      reference: p.DocNumber,
      raw: p,
    }));
  },
};
