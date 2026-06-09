// Sage Business Cloud Accounting integration.
//
// Docs: https://developer.sage.com/accounting/guides/authenticating/authentication/
//
// Required env vars (server-only):
//   SAGE_CLIENT_ID
//   SAGE_CLIENT_SECRET
//   SAGE_REDIRECT_URI
//   SAGE_COUNTRY     optional, default "ZA"

import {
  type AccountingService,
  type AccountingTokens,
  type NormalisedTransaction,
  MissingProviderConfigError,
} from "./types";

const AUTH_URL = "https://www.sageone.com/oauth2/auth/central";
const TOKEN_URL = "https://oauth.accounting.sage.com/token";
const API_BASE = "https://api.accounting.sage.com/v3.1";

function requireConfig() {
  const clientId = process.env.SAGE_CLIENT_ID;
  const clientSecret = process.env.SAGE_CLIENT_SECRET;
  const redirectUri = process.env.SAGE_REDIRECT_URI;
  const missing: string[] = [];
  if (!clientId) missing.push("SAGE_CLIENT_ID");
  if (!clientSecret) missing.push("SAGE_CLIENT_SECRET");
  if (!redirectUri) missing.push("SAGE_REDIRECT_URI");
  if (missing.length) throw new MissingProviderConfigError("sage", missing);
  return {
    clientId: clientId!,
    clientSecret: clientSecret!,
    redirectUri: redirectUri!,
    country: process.env.SAGE_COUNTRY ?? "ZA",
  };
}

async function postToken(extra: Record<string, string>): Promise<AccountingTokens> {
  const { clientId, clientSecret } = requireConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    ...extra,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Sage token exchange failed (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    requested_by_id?: string;
  };

  // Discover the primary business id (X-Site header).
  let businessId: string | undefined;
  let businessName: string | undefined;
  try {
    const bizRes = await fetch(`${API_BASE}/businesses`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    if (bizRes.ok) {
      const bizData = (await bizRes.json()) as { $items?: Array<{ id: string; name?: string }> };
      businessId = bizData.$items?.[0]?.id;
      businessName = bizData.$items?.[0]?.name;
    }
  } catch (err) {
    console.warn("[sageService] could not list businesses:", err);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    externalId: businessId,
    metadata: { businessName, requestedById: data.requested_by_id },
  };
}

export const sageService: AccountingService = {
  provider: "sage",

  getAuthUrl(state: string): string {
    const { clientId, redirectUri, country } = requireConfig();
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "full_access",
      country,
      state,
    });
    return `${AUTH_URL}?${params.toString()}`;
  },

  async exchangeCode(code: string): Promise<AccountingTokens> {
    const { redirectUri } = requireConfig();
    return postToken({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    });
  },

  async refresh(refreshToken: string): Promise<AccountingTokens> {
    return postToken({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });
  },

  async fetchTransactions(
    tokens: AccountingTokens,
    opts: { from?: string; to?: string; limit?: number } = {},
  ): Promise<NormalisedTransaction[]> {
    if (!tokens.externalId) throw new Error("Sage connection missing business id");
    const limit = opts.limit ?? 200;
    const url = new URL(`${API_BASE}/bank_transactions`);
    url.searchParams.set("items_per_page", String(Math.min(limit, 200)));
    if (opts.from) url.searchParams.set("from_date", opts.from);
    if (opts.to) url.searchParams.set("to_date", opts.to);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        "X-Site": tokens.externalId,
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new Error(`Sage GET bank_transactions failed (${res.status}): ${await res.text()}`);
    const data = (await res.json()) as {
      $items?: Array<{
        id: string;
        date: string;
        total_amount: number;
        transaction_type?: { name?: string; id?: string };
        contact_name?: string;
        reference?: string;
        bank_account?: { displayed_as?: string };
        base_currency?: { id?: string };
      }>;
    };

    return (data.$items ?? []).map((t) => {
      const typeId = t.transaction_type?.id ?? "";
      const isIncome = /RECEIPT|DEPOSIT|SALES/i.test(typeId);
      const sign = isIncome ? 1 : -1;
      return {
        id: t.id,
        date: t.date,
        description: t.reference ?? t.contact_name ?? t.transaction_type?.name ?? "Bank transaction",
        amount: sign * Math.abs(Number(t.total_amount ?? 0)),
        currency: t.base_currency?.id ?? "ZAR",
        account: t.bank_account?.displayed_as,
        contact: t.contact_name,
        reference: t.reference,
        raw: t,
      };
    });
  },
};
