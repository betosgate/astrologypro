import { createAdminClient } from "@/lib/supabase/admin";
import {
  upsertCalendarConnection,
  deleteCalendarConnection,
} from "@/lib/calendar/connections";
import { getMicrosoftCredentials } from "@/lib/calendar/provider-credentials";

// Tenant ID now comes from microsoft_api_keys (falls back to "common" inside
// getMicrosoftCredentials) — do not hardcode it here anymore.
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

/** Build the Microsoft OAuth2 consent URL */
export async function getMsOAuthUrl(divinerId: string): Promise<string> {
  const creds = await getMicrosoftCredentials();
  // Wrap divinerId and redirect_api in a JSON for the proxy Lambda
  const state = JSON.stringify({
    id: divinerId,
    redirect_uri: creds.redirectUri,
    astrologypro: true,
  });

  const params = new URLSearchParams({
    client_id: creds.clientId,
    response_type: "code",
    redirect_uri: creds.redirectUri,
    scope: "Calendars.ReadWrite offline_access User.Read",
    response_mode: "query",
    state: state,
    prompt: "select_account",
  });
  return `https://login.microsoftonline.com/${creds.tenantId}/oauth2/v2.0/authorize?${params}`;
}

/** Exchange auth code for tokens and persist to calendar_connections */
export async function handleMsOAuthCallback(
  code: string,
  ownerId: string,
  // Pre-existing parameter; kept for call-site compatibility. Will be used
  // when dual-writing to calendar_connections by user_id is required.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userId: string
): Promise<void> {
  const creds = await getMicrosoftCredentials();
  const body = new URLSearchParams({
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    code,
    redirect_uri: creds.redirectUri,
    grant_type: "authorization_code",
    scope: "Calendars.ReadWrite offline_access User.Read",
  });

  const res = await fetch(`https://login.microsoftonline.com/${creds.tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) throw new Error(`MS token exchange failed: ${res.status}`);
  const tokens = await res.json();

  const admin = createAdminClient();
  await admin.from("diviners").update({ outlook_calendar_token: tokens }).eq("id", ownerId);

  // Dual-write into normalized calendar_connections (cutover from JSONB).
  // Best-effort — never throws.
  await upsertCalendarConnection(admin, {
    divinerId: ownerId,
    provider: "microsoft",
    refreshToken: tokens.refresh_token,
    accessToken: tokens.access_token ?? null,
    expiresAt:
      typeof tokens.expires_in === "number"
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null,
  });
}

/** For proxy relay: directly persist the token object */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function persistMsTokens(ownerId: string, tokens: any): Promise<void> {
  const admin = createAdminClient();
  await admin.from("calendar_connections").upsert({
    owner_id: ownerId,
    provider: "microsoft",
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
    updated_at: new Date().toISOString()
  }, {
    onConflict: "owner_id,provider" // Note: user_id might be missing from proxy relay if not passed
  });
}

/** Get a valid access token, refreshing if needed */
async function getMsAccessToken(ownerId: string): Promise<string | null> {
  const admin = createAdminClient();

  // Pull the legacy JSONB and the user_id needed for the new lookup in one query.
  const { data: diviner } = await admin
    .from("diviners")
    .select("user_id, outlook_calendar_token")
    .eq("id", ownerId)
    .maybeSingle();

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

  if (!token || !token.refresh_token) return null;

  // If token is still valid (with 5 min buffer), return it
  const expiresAtValue = token.expires_at ?? (Date.now() / 1000 + (token.expires_in ?? 3600));
  if (expiresAtValue > Date.now() / 1000 + 300 && token.access_token) return token.access_token;

  // Refresh
  const creds = await getMicrosoftCredentials();
  const body = new URLSearchParams({
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    refresh_token: token.refresh_token,
    grant_type: "refresh_token",
    scope: "Calendars.ReadWrite offline_access User.Read",
  });

  const res = await fetch(`https://login.microsoftonline.com/${creds.tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) return null;
  const newTokens = await res.json();
  
  // Update both legacy and normalized storage
  await admin.from("diviners").update({ outlook_calendar_token: newTokens }).eq("id", ownerId);

  await upsertCalendarConnection(admin, {
    divinerId: ownerId,
    provider: "microsoft",
    refreshToken: newTokens.refresh_token ?? token.refresh_token,
    accessToken: newTokens.access_token ?? null,
    expiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
  });

  return newTokens.access_token;
}

/** Get busy time blocks from Outlook Calendar for a given date */
export async function getMsFreeBusy(
  ownerId: string,
  date: string // YYYY-MM-DD
): Promise<Array<{ start: string; end: string }>> {
  const accessToken = await getMsAccessToken(ownerId);
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
  ownerId: string,
  booking: BookingForCalendar
): Promise<string | null> {
  const accessToken = await getMsAccessToken(ownerId);
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
  ownerId: string,
  eventId: string,
  newScheduledAt: string,
  durationMinutes: number
): Promise<boolean> {
  const accessToken = await getMsAccessToken(ownerId);
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
  ownerId: string,
  eventId: string
): Promise<boolean> {
  const accessToken = await getMsAccessToken(ownerId);
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
export async function disconnectMsCalendar(ownerId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("diviners").update({ outlook_calendar_token: null }).eq("id", ownerId);
  // Mirror the disconnect into the normalized calendar_connections table.
  await deleteCalendarConnection(admin, ownerId, "microsoft");
}
