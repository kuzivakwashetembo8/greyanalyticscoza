// Server-side helpers for persisting accounting OAuth tokens.
// Uses the admin client because OAuth callbacks land as third-party
// redirects without the user's Supabase auth cookie reliably attached.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getAccountingService } from "@/services/accounting";
import type { Json } from "@/integrations/supabase/types";
import type {
  AccountingProvider,
  AccountingTokens,
} from "@/services/accounting/types";

export async function saveTokens(
  userId: string,
  provider: AccountingProvider,
  tokens: AccountingTokens,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("accounting_connections")
    .upsert(
      {
        user_id: userId,
        provider,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: new Date(tokens.expiresAt).toISOString(),
        external_id: tokens.externalId ?? null,
        metadata: (tokens.metadata ?? {}) as unknown as Json,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" },
    );
  if (error) throw new Error(`Failed to save ${provider} tokens: ${error.message}`);
}

export async function loadTokens(
  userId: string,
  provider: AccountingProvider,
): Promise<AccountingTokens | null> {
  const { data, error } = await supabaseAdmin
    .from("accounting_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle();
  if (error) throw new Error(`Failed to load ${provider} tokens: ${error.message}`);
  if (!data) return null;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(data.expires_at).getTime(),
    externalId: data.external_id ?? undefined,
    metadata: (data.metadata ?? {}) as Record<string, unknown>,
  };
}

export async function deleteTokens(
  userId: string,
  provider: AccountingProvider,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("accounting_connections")
    .delete()
    .eq("user_id", userId)
    .eq("provider", provider);
  if (error) throw new Error(`Failed to delete ${provider} tokens: ${error.message}`);
}

/** Returns valid tokens, refreshing 60s before expiry to absorb clock skew. */
export async function getFreshTokens(
  userId: string,
  provider: AccountingProvider,
): Promise<AccountingTokens | null> {
  const current = await loadTokens(userId, provider);
  if (!current) return null;
  if (current.expiresAt - Date.now() > 60_000) return current;

  const svc = getAccountingService(provider);
  const refreshed = await svc.refresh(current.refreshToken);
  const merged: AccountingTokens = {
    ...refreshed,
    externalId: refreshed.externalId ?? current.externalId,
    metadata: { ...current.metadata, ...refreshed.metadata },
  };
  await saveTokens(userId, provider, merged);
  return merged;
}

export async function listUserConnections(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("accounting_connections")
    .select("provider, external_id, metadata, expires_at")
    .eq("user_id", userId);
  if (error) throw new Error(`Failed to list connections: ${error.message}`);
  return data ?? [];
}
