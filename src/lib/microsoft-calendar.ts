import { createAdminClient } from "@/lib/supabase/admin";
import {
  upsertCalendarConnection,
  deleteCalendarConnection,
} from "@/lib/calendar/connections";

const TENANT_ID = "common"; // multi-tenant
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

function getMsClientId() { return process.env.MICROSOFT_CLIENT_ID ?? ""; }
function getMsClientSecret() { return process.env.MICROSOFT_CLIENT_SECRET ?? ""; }
function getMsRedirectUri() {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com"}/api/calendar/microsoft/callback`;
}

/** Build the Microsoft OAuth2 consent URL */
export function getMsOAuthUrl(divinerId: string): string {
  const params = new URLSearchParams({
    client_id: getMsClientId(),
    response_type: "code",
    redirect_uri: getMsRedirectUri(),
    scope: "Calendars.ReadWrite offline_access User.Read",
    response_mode: "query",
    state: divinerId,
    prompt: "select_account",
  });
  return `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?${params}`;
}

/** Exchange auth code for tokens and persist to diviners.outlook_calendar_token */
export async function handleMsOAuthCallback(code: string, divinerId: string): Promise<void> {
  const body = new URLSearchParams({
    client_id: getMsClientId(),
    client_secret: getMsClientSecret(),
    code,
    redirect_uri: getMsRedirectUri(),
    grant_type: "authorization_code",
    scope: "Calendars.ReadWrite offline_access User.Read",
  });

  const res = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) throw new Error(`MS token exchange failed: ${res.status}`);
  const tokens = await res.json();

  const admin = createAdminClient();
  await admin.from("diviners").update({ outlook_calendar_token: tokens }).eq("id", divinerId);

  // Dual-write into normalized calendar_connections (cutover from JSONB).
  // Best-effort — never throws.
  await upsertCalendarConnection(admin, {
    divinerId,
    provider: "microsoft",
    refreshToken: tokens.refresh_token,
    accessToken: tokens.access_token ?? null,
    expiresAt:
      typeof tokens.expires_in === "number"
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null,
  });
}

/** Get a valid access token, refreshing if needed.
 *
 * Read-side cutover: prefer the normalized calendar_connections table.
 * Fall back to the legacy diviners.outlook_calendar_token JSONB during
 * the cutover window so neither newly-connected nor pre-cutover diviners
 * are broken.
 */
async function getMsAccessToken(divinerId: string): Promise<string | null> {
  const admin = createAdminClient();

  // Pull the legacy JSONB and the user_id needed for the new lookup in one query.
  const { data: diviner } = await admin
    .from("diviners")
    .select("user_id, outlook_calendar_token")
    .eq("id", divinerId)
    .single();
  if (!diviner) return null;

  let token: {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
    expires_in?: number;
  } | null = null;

  // 1. Preferred: calendar_connections row for this user + provider
  if (diviner.user_id) {
    const { data: conn } = await admin
      .from("calendar_connections")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", diviner.user_id)
      .eq("provider", "microsoft")
      .maybeSingle();

    if (conn?.refresh_token) {
      token = {
        access_token: conn.access_token ?? "",
        refresh_token: conn.refresh_token,
        expires_at: conn.expires_at
          ? Math.floor(new Date(conn.expires_at).getTime() / 1000)
          : undefined,
      };
    }
  }

  // 2. Fallback: legacy JSONB column on the diviner row
  if (!token && diviner.outlook_calendar_token) {
    token = diviner.outlook_calendar_token as {
      access_token: string;
      refresh_token: string;
      expires_at?: number;
      expires_in?: number;
    };
  }

  if (!token) return null;

  // If token is still valid (with 5 min buffer), return it
  const expiresAt = token.expires_at ?? (Date.now() / 1000 + (token.expires_in ?? 3600));
  if (expiresAt > Date.now() / 1000 + 300 && token.access_token) return token.access_token;

  // Refresh
  const body = new URLSearchParams({
    client_id: getMsClientId(),
    client_secret: getMsClientSecret(),
    refresh_token: token.refresh_token,
    grant_type: "refresh_token",
    scope: "Calendars.ReadWrite offline_access User.Read",
  });

  const res = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) return null;
  const newTokens = await res.json();
  const updatedTokens = {
    ...newTokens,
    expires_at: Math.floor(Date.now() / 1000) + newTokens.expires_in,
  };

  await admin.from("diviners").update({ outlook_calendar_token: updatedTokens }).eq("id", divinerId);

  // Dual-write the rotated token into calendar_connections so the
  // normalized table stays current with the JSONB during the cutover.
  await upsertCalendarConnection(admin, {
    divinerId,
    provider: "microsoft",
    refreshToken: updatedTokens.refresh_token ?? token.refresh_token,
    accessToken: updatedTokens.access_token ?? null,
    expiresAt: new Date(updatedTokens.expires_at * 1000),
  });

  return newTokens.access_token;
}

/** Get busy time blocks from Outlook Calendar for a given date */
export async function getMsFreeBusy(
  divinerId: string,
  date: string // YYYY-MM-DD
): Promise<Array<{ start: string; end: string }>> {
  const accessToken = await getMsAccessToken(divinerId);
  if (!accessToken) return [];

  try {
    const startDateTime = `${date}T00:00:00Z`;
    const endDateTime = `${date}T23:59:59Z`;

    const res = await fetch(
      `${GRAPH_BASE}/me/calendarView?startDateTime=${startDateTime}&endDateTime=${endDateTime}&$select=start,end,showAs`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();

    return (data.value ?? [])
      .filter((e: { showAs?: string }) => e.showAs !== "free")
      .map((e: { start: { dateTime: string }; end: { dateTime: string } }) => ({
        start: e.start.dateTime,
        end: e.end.dateTime,
      }));
  } catch {
    return [];
  }
}

type BookingForCalendar = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  client?: { full_name?: string; email?: string } | null;
  service?: { name?: string } | null;
  diviner?: { display_name?: string; username?: string } | null;
  daily_room_url?: string | null;
  booking_notes?: string | null;
};

/** Create a calendar event in Outlook and return the event ID */
export async function createMsCalendarEvent(
  divinerId: string,
  booking: BookingForCalendar
): Promise<string | null> {
  const accessToken = await getMsAccessToken(divinerId);
  if (!accessToken) return null;

  try {
    const start = new Date(booking.scheduled_at);
    const end = new Date(start.getTime() + booking.duration_minutes * 60 * 1000);
    const clientName = booking.client?.full_name ?? "Client";
    const serviceName = booking.service?.name ?? "Session";
    const joinUrl = booking.daily_room_url ?? "";
    const notes = booking.booking_notes ? `\n\nClient Notes: ${booking.booking_notes}` : "";

    const body = {
      subject: `${serviceName} with ${clientName}`,
      body: {
        contentType: "HTML",
        content: `<p>You have a session booked via AstrologyPro.</p>${joinUrl ? `<p><a href="${joinUrl}">Join Session</a></p>` : ""}${notes ? `<p>${notes}</p>` : ""}`,
      },
      start: { dateTime: start.toISOString(), timeZone: "UTC" },
      end: { dateTime: end.toISOString(), timeZone: "UTC" },
      attendees: booking.client?.email
        ? [{ emailAddress: { address: booking.client.email, name: clientName }, type: "required" }]
        : [],
      isOnlineMeeting: !!joinUrl,
      onlineMeetingUrl: joinUrl || undefined,
    };

    const res = await fetch(`${GRAPH_BASE}/me/events`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.id ?? null;
  } catch {
    return null;
  }
}

/** Update an existing Outlook calendar event (e.g. reschedule) */
export async function updateMsCalendarEvent(
  divinerId: string,
  eventId: string,
  newScheduledAt: string,
  durationMinutes: number
): Promise<boolean> {
  const accessToken = await getMsAccessToken(divinerId);
  if (!accessToken) return false;

  try {
    const start = new Date(newScheduledAt);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    const res = await fetch(`${GRAPH_BASE}/me/events/${encodeURIComponent(eventId)}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        start: { dateTime: start.toISOString(), timeZone: "UTC" },
        end: { dateTime: end.toISOString(), timeZone: "UTC" },
      }),
    });

    return res.ok;
  } catch {
    return false;
  }
}

/** Delete an Outlook calendar event (e.g. cancellation) */
export async function deleteMsCalendarEvent(
  divinerId: string,
  eventId: string
): Promise<boolean> {
  const accessToken = await getMsAccessToken(divinerId);
  if (!accessToken) return false;

  try {
    const res = await fetch(`${GRAPH_BASE}/me/events/${encodeURIComponent(eventId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
}

/** Disconnect Outlook calendar */
export async function disconnectMsCalendar(divinerId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("diviners").update({ outlook_calendar_token: null }).eq("id", divinerId);
  // Mirror the disconnect into the normalized calendar_connections table.
  await deleteCalendarConnection(admin, divinerId, "microsoft");
}
