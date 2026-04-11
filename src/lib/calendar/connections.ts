import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared upsert helper for the calendar_connections table.
 *
 * Handles both the original schema (without account_identifier) and the
 * multi-account schema (with account_identifier). Automatically detects
 * which columns exist and falls back gracefully.
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
  accessToken?: string | null;
  expiresAt?: Date | string | number | null;
  email?: string | null;
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

    const { data: diviner } = await admin
      .from("diviners")
      .select("id, user_id")
      .eq("id", divinerId)
      .maybeSingle();

    if (!diviner?.user_id) {
      console.warn("[calendar/connections] cannot dual-write — diviner missing user_id:", divinerId);
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
      `${provider}:${refreshToken.slice(0, 16)}`;

    // Try with account_identifier first (multi-account schema)
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
      const code = (error as { code?: string }).code;

      // 42P01 = table missing, 42703 = column missing, PGRST204 = column not in schema cache
      if (code === "42P01") {
        console.warn("[calendar/connections] table missing — run migration first");
        return;
      }

      if (code === "42703" || code === "PGRST204") {
        // account_identifier column doesn't exist — retry without it
        const { error: fallbackError } = await admin
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
            },
            { onConflict: "user_id,provider" },
          );

        if (fallbackError) {
          console.error("[calendar/connections] upsert fallback error:", fallbackError);
        }
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
    // Try with account_identifier first
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
      const code = (error as { code?: string }).code;

      // Column doesn't exist — retry without account_identifier
      if (code === "42703" || code === "PGRST204") {
        let fallbackQuery = admin
          .from("calendar_connections")
          .select(
            "id, user_id, owner_id, provider, email, access_token, refresh_token, expires_at, created_at, updated_at"
          )
          .eq("owner_id", divinerId)
          .order("updated_at", { ascending: false })
          .order("created_at", { ascending: false });

        if (provider) {
          fallbackQuery = fallbackQuery.eq("provider", provider);
        }

        const { data: fallbackData, error: fallbackError } = await fallbackQuery;

        if (fallbackError) {
          console.error("[calendar/connections] list fallback error:", fallbackError);
          return [];
        }

        // Map without account_identifier — use email or provider as fallback
        return (fallbackData ?? []).map((row: Record<string, unknown>) => ({
          ...(row as Omit<CalendarConnectionRecord, "account_identifier">),
          account_identifier: (row.email as string) ?? `${row.provider}:${row.id}`,
        })) as CalendarConnectionRecord[];
      }

      console.error("[calendar/connections] list error:", error);
      return [];
    }

    return (data ?? []) as CalendarConnectionRecord[];
  } catch (err) {
    console.error("[calendar/connections] unhandled list error:", err);
    return [];
  }
}

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
