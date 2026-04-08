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
}

export async function upsertCalendarConnection(
  admin: SupabaseClient,
  input: UpsertCalendarConnectionInput,
): Promise<void> {
  try {
    const { divinerId, provider, refreshToken, accessToken, expiresAt, email } = input;
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
          email: email ?? null,
        },
        { onConflict: "user_id,provider" },
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

/**
 * Soft-delete: clear the connection row when a user disconnects a provider.
 * Best-effort like upsertCalendarConnection — never throws.
 */
export async function deleteCalendarConnection(
  admin: SupabaseClient,
  divinerId: string,
  provider: CalendarProvider,
): Promise<void> {
  try {
    const { data: diviner } = await admin
      .from("diviners")
      .select("user_id")
      .eq("id", divinerId)
      .maybeSingle();
    if (!diviner?.user_id) return;

    await admin
      .from("calendar_connections")
      .delete()
      .eq("user_id", diviner.user_id)
      .eq("provider", provider);
  } catch (err) {
    console.error("[calendar/connections] delete error:", err);
  }
}
