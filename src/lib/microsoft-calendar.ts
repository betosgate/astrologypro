import { createAdminClient } from "@/lib/supabase/admin";

const TENANT_ID = "common"; // multi-tenant
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

function getMsClientId() { return process.env.MICROSOFT_CLIENT_ID ?? ""; }
function getMsClientSecret() { return process.env.MICROSOFT_CLIENT_SECRET ?? ""; }
function getMsRedirectUri() {
  return process.env.MICROSOFT_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com"}/api/calendar/microsoft/callback`;
}

/** Build the Microsoft OAuth2 consent URL */
export function getMsOAuthUrl(divinerId: string): string {
  // Wrap divinerId and redirect_api in a JSON for the proxy Lambda
  const state = JSON.stringify({
    id: divinerId,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com"}/api/calendar/microsoft/callback`,
    astrologypro: true
  });

  const params = new URLSearchParams({
    client_id: getMsClientId(),
    response_type: "code",
    redirect_uri: getMsRedirectUri(),
    scope: "Calendars.ReadWrite offline_access User.Read",
    response_mode: "query",
    state: state,
    prompt: "select_account",
  });
  return `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?${params}`;
}

/** Exchange auth code for tokens and persist to calendar_connections */
export async function handleMsOAuthCallback(
  code: string, 
  ownerId: string, 
  userId: string
): Promise<void> {
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
  const { error } = await admin.from("calendar_connections").upsert({
    user_id: userId,
    owner_id: ownerId,
    provider: "microsoft",
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
    updated_at: new Date().toISOString()
  }, {
    onConflict: "user_id,provider"
  });

  if (error) {
    console.error("[Microsoft OAuth] Upsert failed:", error);
    throw new Error(`Failed to store Microsoft calendar connection: ${error.message}`);
  }
}

/** For proxy relay: directly persist the token object */
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
  const { data: connection, error } = await admin
    .from("calendar_connections")
    .select("access_token, refresh_token, expires_at")
    .eq("owner_id", ownerId)
    .eq("provider", "microsoft")
    .single();

  if (error || !connection?.refresh_token) return null;

  // If token is still valid (5 min buffer), return cached access_token
  if (connection.access_token && connection.expires_at) {
    const expiresAt = new Date(connection.expires_at).getTime();
    if (expiresAt > Date.now() + 5 * 60 * 1000) {
      return connection.access_token;
    }
  }

  // Refresh
  const body = new URLSearchParams({
    client_id: getMsClientId(),
    client_secret: getMsClientSecret(),
    refresh_token: connection.refresh_token,
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
  const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();

  await admin
    .from("calendar_connections")
    .update({ 
      access_token: newTokens.access_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString()
    })
    .eq("owner_id", ownerId)
    .eq("provider", "microsoft");

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
  await admin.from("calendar_connections").delete().eq("owner_id", ownerId).eq("provider", "microsoft");
}
