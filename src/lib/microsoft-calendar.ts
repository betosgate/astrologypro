import { createAdminClient } from "@/lib/supabase/admin";
import {
  upsertCalendarConnection,
  deleteCalendarConnection,
  listCalendarConnections,
  type CalendarConnectionRecord,
} from "@/lib/calendar/connections";
import { getMicrosoftCredentials } from "@/lib/calendar/provider-credentials";

// Tenant ID now comes from microsoft_api_keys (falls back to "common" inside
// getMicrosoftCredentials) — do not hardcode it here anymore.
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

interface MicrosoftAccountMetadata {
  accountIdentifier: string;
  email: string | null;
}

function parseDate(date: string): { year: number; month: number; day: number } {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

function parseTime(time: string): { hour: number; minute: number; second: number } {
  const [hour = 0, minute = 0, second = 0] = time.split(":").map(Number);
  return { hour, minute, second };
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const map = new Map<string, string>();
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") {
      map.set(part.type, part.value);
    }
  }

  return {
    year: Number(map.get("year") ?? "0"),
    month: Number(map.get("month") ?? "1"),
    day: Number(map.get("day") ?? "1"),
    hour: Number(map.get("hour") ?? "0"),
    minute: Number(map.get("minute") ?? "0"),
    second: Number(map.get("second") ?? "0"),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getTimeZoneParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return asUtc - date.getTime();
}

function zonedDateTimeToUtc(date: string, time: string, timeZone: string): Date {
  const { year, month, day } = parseDate(date);
  const { hour, minute, second } = parseTime(time);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);

  let offsetMs = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
  let actualUtc = utcGuess - offsetMs;

  const refinedOffsetMs = getTimeZoneOffsetMs(new Date(actualUtc), timeZone);
  if (refinedOffsetMs !== offsetMs) {
    offsetMs = refinedOffsetMs;
    actualUtc = utcGuess - offsetMs;
  }

  return new Date(actualUtc);
}

function getUtcDayRange(date: string, timeZone: string) {
  return {
    startDateTime: zonedDateTimeToUtc(date, "00:00:00", timeZone).toISOString(),
    endDateTime: zonedDateTimeToUtc(date, "23:59:59", timeZone).toISOString(),
  };
}

async function getMicrosoftAccountMetadata(
  accessToken: string
): Promise<MicrosoftAccountMetadata> {
  try {
    const response = await fetch(`${GRAPH_BASE}/me?$select=id,mail,userPrincipalName`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Microsoft /me lookup failed");
    }

    const payload = await response.json();
    const accountIdentifier =
      typeof payload.id === "string" && payload.id.length > 0
        ? payload.id
        : `microsoft:${accessToken.slice(0, 16)}`;
    const emailCandidate =
      typeof payload.mail === "string" && payload.mail.length > 0
        ? payload.mail
        : typeof payload.userPrincipalName === "string" && payload.userPrincipalName.length > 0
          ? payload.userPrincipalName
          : null;

    return {
      accountIdentifier: accountIdentifier.toLowerCase(),
      email: emailCandidate ? emailCandidate.toLowerCase() : null,
    };
  } catch {
    return {
      accountIdentifier: `microsoft:${accessToken.slice(0, 16)}`.toLowerCase(),
      email: null,
    };
  }
}

async function getMicrosoftConnections(ownerId: string): Promise<CalendarConnectionRecord[]> {
  const admin = createAdminClient();
  const connections = await listCalendarConnections(admin, ownerId, "microsoft");
  if (connections.length > 0) {
    return connections;
  }

  const { data: diviner } = await admin
    .from("diviners")
    .select("id, user_id, outlook_calendar_token")
    .eq("id", ownerId)
    .maybeSingle();

  if (!diviner?.outlook_calendar_token) {
    return [];
  }

  const legacyToken = diviner.outlook_calendar_token as {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
  };

  if (typeof legacyToken.refresh_token !== "string" || legacyToken.refresh_token.length === 0) {
    return [];
  }

  return [
    {
      id: `legacy-microsoft-${ownerId}`,
      user_id: diviner.user_id ?? "",
      owner_id: diviner.id,
      provider: "microsoft",
      email: null,
      account_identifier: `legacy-microsoft:${ownerId}`,
      access_token:
        typeof legacyToken.access_token === "string" ? legacyToken.access_token : null,
      refresh_token: legacyToken.refresh_token,
      expires_at:
        typeof legacyToken.expires_at === "number"
          ? new Date(legacyToken.expires_at * 1000).toISOString()
          : null,
      created_at: null,
      updated_at: null,
    },
  ];
}

async function getPreferredMicrosoftConnection(
  ownerId: string
): Promise<CalendarConnectionRecord | null> {
  const connections = await getMicrosoftConnections(ownerId);
  return connections[0] ?? null;
}

async function getMsAccessToken(
  ownerId: string,
  connection: CalendarConnectionRecord
): Promise<string | null> {
  const expiresAtValue = connection.expires_at
    ? Math.floor(new Date(connection.expires_at).getTime() / 1000)
    : undefined;
  if (
    connection.access_token &&
    expiresAtValue &&
    expiresAtValue > Date.now() / 1000 + 300
  ) {
    return connection.access_token;
  }

  const creds = await getMicrosoftCredentials();
  const body = new URLSearchParams({
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    refresh_token: connection.refresh_token,
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
  const accessToken =
    typeof newTokens.access_token === "string" && newTokens.access_token.length > 0
      ? newTokens.access_token
      : null;
  if (!accessToken) return null;

  const metadata = await getMicrosoftAccountMetadata(accessToken);
  await upsertCalendarConnection(createAdminClient(), {
    divinerId: ownerId,
    provider: "microsoft",
    refreshToken:
      typeof newTokens.refresh_token === "string" && newTokens.refresh_token.length > 0
        ? newTokens.refresh_token
        : connection.refresh_token,
    accessToken,
    expiresAt:
      typeof newTokens.expires_in === "number"
        ? new Date(Date.now() + newTokens.expires_in * 1000)
        : null,
    email: metadata.email ?? connection.email,
    accountIdentifier: metadata.accountIdentifier ?? connection.account_identifier,
  });

  return accessToken;
}

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
  const accessToken =
    typeof tokens.access_token === "string" ? tokens.access_token : null;
  const refreshToken =
    typeof tokens.refresh_token === "string" ? tokens.refresh_token : null;
  if (!refreshToken) {
    throw new Error("Microsoft did not return a refresh token for this account");
  }

  const admin = createAdminClient();
  await admin.from("diviners").update({ outlook_calendar_token: tokens }).eq("id", ownerId);
  const metadata = accessToken
    ? await getMicrosoftAccountMetadata(accessToken)
    : {
        accountIdentifier: `microsoft:${ownerId}:${Date.now()}`.toLowerCase(),
        email: null,
      };

  // Dual-write into normalized calendar_connections (cutover from JSONB).
  // Best-effort — never throws.
  await upsertCalendarConnection(admin, {
    divinerId: ownerId,
    provider: "microsoft",
    refreshToken,
    accessToken,
    expiresAt:
      typeof tokens.expires_in === "number"
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null,
    email: metadata.email,
    accountIdentifier: metadata.accountIdentifier,
  });
}

/** For proxy relay: directly persist the token object */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function persistMsTokens(ownerId: string, tokens: any): Promise<void> {
  const accessToken =
    typeof tokens?.access_token === "string" ? tokens.access_token : null;
  const refreshToken =
    typeof tokens?.refresh_token === "string" ? tokens.refresh_token : null;
  if (!refreshToken) {
    throw new Error("Microsoft relay did not include a refresh token");
  }

  const metadata = accessToken
    ? await getMicrosoftAccountMetadata(accessToken)
    : {
        accountIdentifier: `microsoft:${ownerId}:${Date.now()}`.toLowerCase(),
        email: null,
      };

  await upsertCalendarConnection(createAdminClient(), {
    divinerId: ownerId,
    provider: "microsoft",
    refreshToken,
    accessToken,
    expiresAt:
      typeof tokens?.expires_in === "number"
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null,
    email: metadata.email,
    accountIdentifier: metadata.accountIdentifier,
  });
}

/** Get busy time blocks from Outlook Calendar for a given date */
export async function getMsFreeBusyInRange(
  ownerId: string,
  startDateTime: string,
  endDateTime: string
): Promise<Array<{ start: string; end: string }>> {
  const connections = await getMicrosoftConnections(ownerId);
  if (connections.length === 0) return [];

  const results = await Promise.all(
    connections.map(async (connection) => {
      const accessToken = await getMsAccessToken(ownerId, connection);
      if (!accessToken) return [] as Array<{ start: string; end: string }>;

      try {
        const calendarsRes = await fetch(`${GRAPH_BASE}/me/calendars?$select=id`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        const calendars = calendarsRes.ok
          ? ((await calendarsRes.json()).value ?? [])
          : [];

        const calendarIds =
          calendars.length > 0
            ? calendars
                .map((calendar: { id?: string }) => calendar.id)
                .filter((id: string | undefined): id is string => Boolean(id))
            : ["default"];

        const requests = calendarIds.map((calendarId) => {
          const path =
            calendarId === "default"
              ? `${GRAPH_BASE}/me/calendarView`
              : `${GRAPH_BASE}/me/calendars/${encodeURIComponent(calendarId)}/calendarView`;

          const params = new URLSearchParams({
            startDateTime,
            endDateTime,
            $select: "start,end,showAs,isCancelled",
          });

          return fetch(`${path}?${params.toString()}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          });
        });

        const responses = await Promise.all(requests);
        const payloads = await Promise.all(
          responses.map(async (res) => (res.ok ? res.json() : { value: [] }))
        );

        return payloads.flatMap((data) =>
          (data.value ?? [])
            .filter(
              (e: { showAs?: string; isCancelled?: boolean }) =>
                e.showAs !== "free" && e.isCancelled !== true
            )
            .map((e: { start: { dateTime: string }; end: { dateTime: string } }) => ({
              start: e.start.dateTime,
              end: e.end.dateTime,
            }))
        );
      } catch {
        return [] as Array<{ start: string; end: string }>;
      }
    })
  );

  const busyByKey = new Map<string, { start: string; end: string }>();
  for (const result of results) {
    for (const slot of result) {
      busyByKey.set(`${slot.start}-${slot.end}`, slot);
    }
  }

  return Array.from(busyByKey.values());
}

/** Get busy time blocks from Outlook Calendar for a given date */
export async function getMsFreeBusy(
  ownerId: string,
  date: string, // YYYY-MM-DD
  timeZone: string
): Promise<Array<{ start: string; end: string }>> {
  const { startDateTime, endDateTime } = getUtcDayRange(date, timeZone);
  return getMsFreeBusyInRange(ownerId, startDateTime, endDateTime);
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
  const connection = await getPreferredMicrosoftConnection(ownerId);
  if (!connection) return null;
  const accessToken = await getMsAccessToken(ownerId, connection);
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
  const connection = await getPreferredMicrosoftConnection(ownerId);
  if (!connection) return false;
  const accessToken = await getMsAccessToken(ownerId, connection);
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
  const connection = await getPreferredMicrosoftConnection(ownerId);
  if (!connection) return false;
  const accessToken = await getMsAccessToken(ownerId, connection);
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
export async function disconnectMsCalendar(
  ownerId: string,
  connectionId?: string
): Promise<void> {
  await deleteCalendarConnection(createAdminClient(), ownerId, "microsoft", connectionId);
}
