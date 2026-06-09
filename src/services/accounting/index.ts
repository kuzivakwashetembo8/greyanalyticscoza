// Provider registry — pick the right service implementation by id.

import { xeroService } from "./xeroService";
import { quickbooksService } from "./quickbooksService";
import { sageService } from "./sageService";
import type { AccountingProvider, AccountingService } from "./types";

const REGISTRY: Record<AccountingProvider, AccountingService> = {
  xero: xeroService,
  quickbooks: quickbooksService,
  sage: sageService,
};

export function getAccountingService(provider: AccountingProvider): AccountingService {
  const svc = REGISTRY[provider];
  if (!svc) throw new Error(`Unknown accounting provider: ${provider}`);
  return svc;
}

export const ACCOUNTING_PROVIDERS: AccountingProvider[] = ["xero", "quickbooks", "sage"];

export type { AccountingProvider, AccountingService, AccountingTokens, NormalisedTransaction } from "./types";
