/**
 * Data access for `social_accounts`.
 *
 * All methods use the service-role admin client — RLS on social_accounts
 * denies all authenticated access, so tokens never leak via a client-side
 * Supabase query.
 *
 * Tokens are encrypted/decrypted here, right at the data boundary. Callers
 * work with ConnectedAccount (plaintext view); the wire format
 * (*_ciphertext / *_iv / *_tag) never leaves this file.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { encryptToken, decryptToken } from "./token-crypto";
import type {
  ConnectedAccount,
  NewConnectionPayload,
  Owner,
  Platform,
  PublicConnectedAccount,
} from "./types";

interface SocialAccountRow {
  id: string;
  owner_type: "admin" | "diviner";
  owner_id: string | null;
  platform: Platform;
  platform_account_id: string;
  platform_account_handle: string | null;
  platform_account_name: string | null;
  access_token_ciphertext: string;
  access_token_iv: string;
  access_token_tag: string;
  refresh_token_ciphertext: string | null;
  refresh_token_iv: string | null;
  refresh_token_tag: string | null;
  token_expires_at: string | null;
  scopes: string[] | null;
  connected_at: string;
  disconnected_at: string | null;
  last_refreshed_at: string | null;
  last_post_at: string | null;
  last_error_at: string | null;
  last_error_message: string | null;
  created_at: string;
  updated_at: string;
}

function rowToConnected(row: SocialAccountRow): ConnectedAccount {
  const accessToken = decryptToken({
    ciphertext: row.access_token_ciphertext,
    iv: row.access_token_iv,
    tag: row.access_token_tag,
  });

  let refreshToken: string | null = null;
  if (
    row.refresh_token_ciphertext &&
    row.refresh_token_iv &&
    row.refresh_token_tag
  ) {
    refreshToken = decryptToken({
      ciphertext: row.refresh_token_ciphertext,
      iv: row.refresh_token_iv,
      tag: row.refresh_token_tag,
    });
  }

  return {
    id: row.id,
    owner: { type: row.owner_type, id: row.owner_id },
    platform: row.platform,
    platformAccountId: row.platform_account_id,
    platformAccountHandle: row.platform_account_handle,
    platformAccountName: row.platform_account_name,
    accessToken,
    refreshToken,
    tokenExpiresAt: row.token_expires_at ? new Date(row.token_expires_at) : null,
    scopes: row.scopes ?? [],
  };
}

export function rowToPublic(row: SocialAccountRow): PublicConnectedAccount {
  return {
    id: row.id,
    ownerType: row.owner_type,
    ownerId: row.owner_id,
    platform: row.platform,
    platformAccountHandle: row.platform_account_handle,
    platformAccountName: row.platform_account_name,
    connectedAt: row.connected_at,
    lastPostAt: row.last_post_at,
    lastErrorAt: row.last_error_at,
    lastErrorMessage: row.last_error_message,
    tokenExpiresAt: row.token_expires_at,
  };
}

/** Find the active connection for an owner on a platform, or null. */
export async function getActiveConnection(
  owner: Owner,
  platform: Platform,
): Promise<ConnectedAccount | null> {
  const admin = createAdminClient();
  let query = admin
    .from("social_accounts")
    .select("*")
    .eq("owner_type", owner.type)
    .eq("platform", platform)
    .is("disconnected_at", null)
    .limit(1);

  query = owner.id === null ? query.is("owner_id", null) : query.eq("owner_id", owner.id);

  const { data } = await query.maybeSingle();
  return data ? rowToConnected(data as SocialAccountRow) : null;
}

/** Same as getActiveConnection but returns the safe public view. */
export async function getActiveConnectionPublic(
  owner: Owner,
  platform: Platform,
): Promise<PublicConnectedAccount | null> {
  const admin = createAdminClient();
  let query = admin
    .from("social_accounts")
    .select("*")
    .eq("owner_type", owner.type)
    .eq("platform", platform)
    .is("disconnected_at", null)
    .limit(1);

  query = owner.id === null ? query.is("owner_id", null) : query.eq("owner_id", owner.id);

  const { data } = await query.maybeSingle();
  return data ? rowToPublic(data as SocialAccountRow) : null;
}

/** List all active connections for an owner. */
export async function listActiveConnections(
  owner: Owner,
): Promise<PublicConnectedAccount[]> {
  const admin = createAdminClient();
  let query = admin
    .from("social_accounts")
    .select("*")
    .eq("owner_type", owner.type)
    .is("disconnected_at", null);

  query = owner.id === null ? query.is("owner_id", null) : query.eq("owner_id", owner.id);

  const { data } = await query;
  return (data ?? []).map((r) => rowToPublic(r as SocialAccountRow));
}

/**
 * Insert or replace the active connection for (owner, platform). Any existing
 * active row for the same (owner, platform) is marked disconnected first, so
 * the partial-unique index stays satisfied.
 */
export async function upsertConnection(
  payload: NewConnectionPayload,
): Promise<ConnectedAccount> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Soft-disconnect any pre-existing active row for this (owner, platform).
  let existing = admin
    .from("social_accounts")
    .update({ disconnected_at: now })
    .eq("owner_type", payload.owner.type)
    .eq("platform", payload.platform)
    .is("disconnected_at", null);

  existing =
    payload.owner.id === null
      ? existing.is("owner_id", null)
      : existing.eq("owner_id", payload.owner.id);

  await existing;

  const access = encryptToken(payload.accessToken);
  const refresh = payload.refreshToken ? encryptToken(payload.refreshToken) : null;

  const { data, error } = await admin
    .from("social_accounts")
    .insert({
      owner_type: payload.owner.type,
      owner_id: payload.owner.id,
      platform: payload.platform,
      platform_account_id: payload.platformAccountId,
      platform_account_handle: payload.platformAccountHandle,
      platform_account_name: payload.platformAccountName,
      access_token_ciphertext: access.ciphertext,
      access_token_iv: access.iv,
      access_token_tag: access.tag,
      refresh_token_ciphertext: refresh?.ciphertext ?? null,
      refresh_token_iv: refresh?.iv ?? null,
      refresh_token_tag: refresh?.tag ?? null,
      token_expires_at: payload.tokenExpiresAt?.toISOString() ?? null,
      scopes: payload.scopes,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to persist social connection: ${error?.message ?? "unknown"}`);
  }
  return rowToConnected(data as SocialAccountRow);
}

/**
 * Update the stored tokens after a refresh. Does NOT change any of the
 * identifying fields (platform_account_id etc.).
 */
export async function updateConnectionTokens(
  id: string,
  tokens: {
    accessToken: string;
    refreshToken: string | null;
    tokenExpiresAt: Date | null;
    scopes: string[];
  },
): Promise<void> {
  const admin = createAdminClient();
  const access = encryptToken(tokens.accessToken);
  const refresh = tokens.refreshToken ? encryptToken(tokens.refreshToken) : null;

  await admin
    .from("social_accounts")
    .update({
      access_token_ciphertext: access.ciphertext,
      access_token_iv: access.iv,
      access_token_tag: access.tag,
      refresh_token_ciphertext: refresh?.ciphertext ?? null,
      refresh_token_iv: refresh?.iv ?? null,
      refresh_token_tag: refresh?.tag ?? null,
      token_expires_at: tokens.tokenExpiresAt?.toISOString() ?? null,
      scopes: tokens.scopes,
      last_refreshed_at: new Date().toISOString(),
    })
    .eq("id", id);
}

/** Stamp a connection after a successful post. */
export async function markConnectionPosted(id: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("social_accounts")
    .update({ last_post_at: new Date().toISOString(), last_error_at: null, last_error_message: null })
    .eq("id", id);
}

/** Stamp a connection after a failed post. */
export async function markConnectionError(id: string, message: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("social_accounts")
    .update({
      last_error_at: new Date().toISOString(),
      last_error_message: message.slice(0, 500),
    })
    .eq("id", id);
}

/** Soft-disconnect a connection (we never hard-delete — keep for audit). */
export async function disconnectConnection(id: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("social_accounts")
    .update({ disconnected_at: new Date().toISOString() })
    .eq("id", id);
}

export async function getConnectionById(
  id: string,
): Promise<ConnectedAccount | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("social_accounts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? rowToConnected(data as SocialAccountRow) : null;
}
