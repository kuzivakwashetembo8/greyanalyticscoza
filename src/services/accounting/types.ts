// Shared types for accounting integrations (Xero, QuickBooks, Sage).
//
// Each provider exposes a small, uniform surface so the rest of the app can
// stay provider-agnostic:
//   - getAuthUrl()        -> URL the user is redirected to for OAuth consent
//   - exchangeCode()      -> swap an authorization code for tokens
//   - refresh()           -> refresh an access token
//   - fetchTransactions() -> normalised transaction list for analysis
//
// All HTTP calls live server-side; client code only calls /api/accounting/*.

export type AccountingProvider = "xero" | "quickbooks" | "sage";

export interface AccountingTokens {
  accessToken: string;
  refreshToken: string;
  /** Absolute expiry timestamp (ms since epoch). */
  expiresAt: number;
  /** Provider-specific scope (tenant/realm/business id). */
  externalId?: string;
  metadata?: Record<string, unknown>;
}

export interface NormalisedTransaction {
  id: string;
  date: string;          // ISO yyyy-mm-dd
  description: string;
  amount: number;        // signed; positive = income, negative = expense
  currency: string;
  account?: string;
  contact?: string;
  reference?: string;
  raw?: unknown;
}

export interface AccountingService {
  provider: AccountingProvider;
  getAuthUrl(state: string): string;
  exchangeCode(code: string, state?: string): Promise<AccountingTokens>;
  refresh(refreshToken: string): Promise<AccountingTokens>;
  fetchTransactions(
    tokens: AccountingTokens,
    opts?: { from?: string; to?: string; limit?: number },
  ): Promise<NormalisedTransaction[]>;
}

export class MissingProviderConfigError extends Error {
  constructor(public provider: AccountingProvider, public missing: string[]) {
    super(`Missing env vars for ${provider}: ${missing.join(", ")}`);
    this.name = "MissingProviderConfigError";
  }
}
