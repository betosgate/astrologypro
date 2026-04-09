import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared upsert helper for the calendar_connections table.
 *
 * Used by the Google + Microsoft OAuth callback handlers and by their
 * background refresh paths to dual-write into the normalized table during
 * the cutover from diviners.{google,outlook}_calendar_token JSONB.
 *
 * Resolves user_id from diviners.user_id automatically — callers only need
 * the divinerId (which becomes owner_id in calendar_connections).
 *
 * Failures are caught and logged but never thrown — the dual-write must
 * never break the legacy write path during the cutover window.
 */

export type CalendarProvider = "google" | "microsoft";

export interface CalendarConnectionRecord {
  id: string;
  user_id: string;
  owner_id: string;
  provider: CalendarProvider;
  email: string | null;
  account_identifier: string;
  access_token: string | null;
  refresh_token: string;
  expires_at: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface UpsertCalendarConnectionInput {
  divinerId: string;
  provider: CalendarProvider;
  refreshToken: string;
  /** Optional access token. Google flow doesn't keep one; Microsoft does. */
  accessToken?: string | null;
  /** Optional ISO timestamp or epoch seconds for token expiry. */
  expiresAt?: Date | string | number | null;
  /** Optional connected-account email, when the OAuth response provides one. */
  email?: string | null;
  /** Stable provider-side account key for reconnect/update dedupe. */
  accountIdentifier?: string | null;
}

function normalizeConnectionIdentity(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized.toLowerCase() : null;
}

export async function upsertCalendarConnection(
  admin: SupabaseClient,
  input: UpsertCalendarConnectionInput,
): Promise<void> {
  try {
    const { divinerId, provider, refreshToken, accessToken, expiresAt, email, accountIdentifier } = input;
    if (!divinerId || !refreshToken) return;

    // Resolve auth user_id from the diviner row.
    const { data: diviner } = await admin
      .from("diviners")
      .select("id, user_id")
      .eq("id", divinerId)
      .maybeSingle();

    if (!diviner?.user_id) {
      console.warn(
        "[calendar/connections] cannot dual-write — diviner missing user_id:",
        divinerId,
      );
      return;
    }

    let expiresAtIso: string | null = null;
    if (expiresAt instanceof Date) {
      expiresAtIso = expiresAt.toISOString();
    } else if (typeof expiresAt === "number") {
      expiresAtIso = new Date(expiresAt * 1000).toISOString();
    } else if (typeof expiresAt === "string" && expiresAt.length > 0) {
      expiresAtIso = expiresAt;
    }

    const normalizedEmail = normalizeConnectionIdentity(email);
    const normalizedAccountIdentifier =
      normalizeConnectionIdentity(accountIdentifier) ??
      normalizedEmail ??
      `${provider}:${refreshToken}`;

    const { error } = await admin
      .from("calendar_connections")
      .upsert(
        {
          user_id: diviner.user_id,
          owner_id: diviner.id,
          provider,
          refresh_token: refreshToken,
          access_token: accessToken ?? null,
          expires_at: expiresAtIso,
          email: normalizedEmail,
          account_identifier: normalizedAccountIdentifier,
        },
        { onConflict: "user_id,provider,account_identifier" },
      );

    if (error) {
      // 42P01 = relation does not exist (table not migrated yet)
      const code = (error as { code?: string }).code;
      if (code === "42P01") {
        console.warn(
          "[calendar/connections] table missing — run migration 20260408000109 first",
        );
        return;
      }
      console.error("[calendar/connections] upsert error:", error);
    }
  } catch (err) {
    console.error("[calendar/connections] unhandled upsert error:", err);
  }
}

export async function listCalendarConnections(
  admin: SupabaseClient,
  divinerId: string,
  provider?: CalendarProvider,
): Promise<CalendarConnectionRecord[]> {
  try {
    let query = admin
      .from("calendar_connections")
      .select(
        "id, user_id, owner_id, provider, email, account_identifier, access_token, refresh_token, expires_at, created_at, updated_at"
      )
      .eq("owner_id", divinerId)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (provider) {
      query = query.eq("provider", provider);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[calendar/connections] list error:", error);
      return [];
    }

    return (data ?? []) as CalendarConnectionRecord[];
  } catch (err) {
    console.error("[calendar/connections] unhandled list error:", err);
    return [];
  }
}

/**
 * Soft-delete: clear the connection row when a user disconnects a provider.
 * Best-effort like upsertCalendarConnection — never throws.
 */
export async function deleteCalendarConnection(
  admin: SupabaseClient,
  divinerId: string,
  provider: CalendarProvider,
  connectionId?: string,
): Promise<void> {
  try {
    let query = admin
      .from("calendar_connections")
      .delete()
      .eq("owner_id", divinerId)
      .eq("provider", provider);

    if (connectionId) {
      query = query.eq("id", connectionId);
    }

    await query;
  } catch (err) {
    console.error("[calendar/connections] delete error:", err);
  }
}
