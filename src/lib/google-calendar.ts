import { createAdminClient } from "@/lib/supabase/admin";
import {
  deleteCalendarConnection,
  listCalendarConnections,
  upsertCalendarConnection,
  type CalendarConnectionRecord,
} from "@/lib/calendar/connections";
import { getGoogleCredentials } from "@/lib/calendar/provider-credentials";

// Google OAuth client credentials are now resolved at call time via
// getGoogleCredentials() — it reads the admin-managed google_api_keys table
// first, then falls back to env vars. See tasks/09.04.2026/calendar-module/
// 11-api-keys-config.md for why.

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events.owned",
];
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export interface GoogleBusyScheduleEntry {
  id: string;
  title: string;
  start: string;
  end: string;
  status?: string | null;
  description?: string | null;
  location?: string | null;
  source: "google";
}

interface GoogleEventBoundary {
  dateTime?: unknown;
  date?: unknown;
  timeZone?: unknown;
}

interface GoogleAccountMetadata {
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
    timeMin: zonedDateTimeToUtc(date, "00:00:00", timeZone).toISOString(),
    timeMax: zonedDateTimeToUtc(date, "23:59:59", timeZone).toISOString(),
  };
}

function extractLegacyGoogleRefreshToken(token: unknown): string | null {
  if (typeof token === "string" && token.length > 0) {
    return token;
  }

  if (
    token &&
    typeof token === "object" &&
    "refresh_token" in token &&
    typeof (token as { refresh_token?: unknown }).refresh_token === "string"
  ) {
    return (token as { refresh_token: string }).refresh_token;
  }

  return null;
}

function normalizeGoogleEventBoundary(
  boundary: GoogleEventBoundary | undefined,
  fallbackTimeZone: string
): string | null {
  if (!boundary) return null;

  if (typeof boundary.dateTime === "string" && boundary.dateTime.length > 0) {
    return boundary.dateTime;
  }

  if (typeof boundary.date === "string" && boundary.date.length > 0) {
    const boundaryTimeZone =
      typeof boundary.timeZone === "string" && boundary.timeZone.length > 0
        ? boundary.timeZone
        : fallbackTimeZone;

    return zonedDateTimeToUtc(
      boundary.date,
      "00:00:00",
      boundaryTimeZone
    ).toISOString();
  }

  return null;
}

function normalizeGoogleEventBounds(
  event: Record<string, unknown>,
  fallbackTimeZone: string
): { start: string; end: string } | null {
  const startBoundary = event.start as GoogleEventBoundary | undefined;
  const endBoundary = event.end as GoogleEventBoundary | undefined;
  const eventTimeZone =
    (typeof startBoundary?.timeZone === "string" && startBoundary.timeZone) ||
    (typeof endBoundary?.timeZone === "string" && endBoundary.timeZone) ||
    fallbackTimeZone;

  const start = normalizeGoogleEventBoundary(startBoundary, eventTimeZone);
  let end = normalizeGoogleEventBoundary(endBoundary, eventTimeZone);

  if (!start || !end) {
    return null;
  }

  if (
    new Date(end).getTime() <= new Date(start).getTime() &&
    typeof startBoundary?.date === "string" &&
    typeof startBoundary?.dateTime !== "string"
  ) {
    end = new Date(new Date(start).getTime() + 24 * 60 * 60 * 1000).toISOString();
  }

  return { start, end };
}

async function getGoogleConnections(ownerId: string): Promise<CalendarConnectionRecord[]> {
  const supabase = createAdminClient();
  const connections = await listCalendarConnections(supabase, ownerId, "google");
  if (connections.length > 0) {
    return connections;
  }

  const { data: diviner } = await supabase
    .from("diviners")
    .select("id, user_id, google_calendar_token")
    .eq("id", ownerId)
    .maybeSingle();

  if (!diviner) {
    return [];
  }

  const legacyRefreshToken = extractLegacyGoogleRefreshToken(diviner.google_calendar_token);
  if (!legacyRefreshToken) {
    return [];
  }

  return [
    {
      id: `legacy-google-${ownerId}`,
      user_id: diviner.user_id ?? "",
      owner_id: diviner.id,
      provider: "google",
      email: null,
      account_identifier: `legacy-google:${ownerId}`,
      access_token: null,
      refresh_token: legacyRefreshToken,
      expires_at: null,
      created_at: null,
      updated_at: null,
    },
  ];
}

async function getPreferredGoogleConnection(
  ownerId: string
): Promise<CalendarConnectionRecord | null> {
  const connections = await getGoogleConnections(ownerId);
  return connections[0] ?? null;
}

async function getGoogleAccountMetadata(accessToken: string): Promise<GoogleAccountMetadata> {
  try {
    const response = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary?fields=id,summary`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Google primary calendar lookup failed");
    }

    const payload = await response.json();
    const rawId = typeof payload.id === "string" ? payload.id.trim() : "";
    const rawSummary = typeof payload.summary === "string" ? payload.summary.trim() : "";
    const emailCandidate = [rawId, rawSummary].find((value) => value.includes("@")) ?? null;

    return {
      accountIdentifier: (rawId || emailCandidate || `google:${accessToken.slice(0, 16)}`).toLowerCase(),
      email: emailCandidate ? emailCandidate.toLowerCase() : null,
    };
  } catch {
    return {
      accountIdentifier: `google:${accessToken.slice(0, 16)}`.toLowerCase(),
      email: null,
    };
  }
}

async function getAccessToken(
  ownerId: string,
  connection: CalendarConnectionRecord
): Promise<string | null> {
  if (connection.access_token && connection.expires_at) {
    const expiresAt = new Date(connection.expires_at).getTime();
    if (expiresAt > Date.now() + 5 * 60 * 1000) {
      return connection.access_token;
    }
  }

  const creds = await getGoogleCredentials();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      refresh_token: connection.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    console.error("[google-calendar] Failed to refresh Google access token");
    return null;
  }

  const tokens = await response.json();
  const accessToken =
    typeof tokens.access_token === "string" && tokens.access_token.length > 0
      ? tokens.access_token
      : null;

  if (!accessToken) {
    return null;
  }

  const metadata = await getGoogleAccountMetadata(accessToken);
  await upsertCalendarConnection(createAdminClient(), {
    divinerId: ownerId,
    provider: "google",
    refreshToken:
      typeof tokens.refresh_token === "string" && tokens.refresh_token.length > 0
        ? tokens.refresh_token
        : connection.refresh_token,
    accessToken,
    expiresAt:
      typeof tokens.expires_in === "number"
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null,
    email: metadata.email ?? connection.email,
    accountIdentifier: metadata.accountIdentifier ?? connection.account_identifier,
  });

  return accessToken;
}

async function getGoogleBusyScheduleByRange(
  ownerId: string,
  timeMin: string,
  timeMax: string,
  timeZone: string
): Promise<GoogleBusyScheduleEntry[]> {
  const connections = await getGoogleConnections(ownerId);
  if (connections.length === 0) {
    return [];
  }

  const connectionResults = await Promise.all(
    connections.map(async (connection) => {
      const accessToken = await getAccessToken(ownerId, connection);
      if (!accessToken) {
        return [] as GoogleBusyScheduleEntry[];
      }

      const busyByKey = new Map<string, GoogleBusyScheduleEntry>();
      let calendarIds: string[] = ["primary"];
      const calendarTimezones = new Map<string, string>();

      try {
        const calendarListResponse = await fetch(
          `${GOOGLE_CALENDAR_API}/users/me/calendarList?showHidden=false`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (calendarListResponse.ok) {
          const calendarList = await calendarListResponse.json();
          const ids = (calendarList.items ?? [])
            .filter((calendar: {
              id?: string;
              deleted?: boolean;
              selected?: boolean;
              timeZone?: string;
            }) => {
              if (!calendar.id || calendar.deleted) return false;
              if (typeof calendar.timeZone === "string" && calendar.timeZone.length > 0) {
                calendarTimezones.set(calendar.id, calendar.timeZone);
              }
              return calendar.selected !== false;
            })
            .map((calendar: { id: string }) => calendar.id);

          if (ids.length > 0) {
            calendarIds = ids;
          }
        }
      } catch (error) {
        console.warn(
          "[google-calendar] calendarList lookup failed; falling back to primary events",
          error
        );
      }

      try {
        const freeBusyResponse = await fetch(`${GOOGLE_CALENDAR_API}/freeBusy`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            timeMin,
            timeMax,
            items: calendarIds.map((id) => ({ id })),
          }),
        });

        if (freeBusyResponse.ok) {
          const freeBusyPayload = (await freeBusyResponse.json()) as {
            calendars?: Record<string, { busy?: Array<{ start?: string; end?: string }> }>;
          };

          for (const calendarId of calendarIds) {
            const busyEntries = freeBusyPayload.calendars?.[calendarId]?.busy ?? [];
            for (const busyEntry of busyEntries) {
              if (
                typeof busyEntry.start !== "string" ||
                busyEntry.start.length === 0 ||
                typeof busyEntry.end !== "string" ||
                busyEntry.end.length === 0
              ) {
                continue;
              }

              busyByKey.set(`${busyEntry.start}-${busyEntry.end}`, {
                id: `${calendarId}-${busyEntry.start}-${busyEntry.end}`,
                title: "Google Calendar busy",
                start: busyEntry.start,
                end: busyEntry.end,
                status: "busy",
                description: null,
                location: null,
                source: "google",
              });
            }
          }
        } else {
          console.warn(
            "[google-calendar] freeBusy lookup failed:",
            await freeBusyResponse.text()
          );
        }
      } catch (error) {
        console.warn("[google-calendar] freeBusy lookup threw:", error);
      }

      try {
        const responses = await Promise.all(
          calendarIds.map((calendarId) =>
            fetch(
              `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?singleEvents=true&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&showDeleted=false&maxResults=2500&timeZone=${encodeURIComponent(timeZone)}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
              }
            ).then(async (response) => ({
              calendarId,
              ok: response.ok,
              body: response.ok ? await response.json() : await response.text(),
            }))
          )
        );

        for (const response of responses) {
          if (!response.ok) {
            console.warn(
              `[google-calendar] events lookup failed for ${response.calendarId}:`,
              response.body
            );
            continue;
          }

          const items = Array.isArray((response.body as { items?: unknown[] }).items)
            ? ((response.body as { items: unknown[] }).items as Array<Record<string, unknown>>)
            : [];

          for (const event of items) {
            if (event.status === "cancelled") continue;
            const startBoundary = event.start as GoogleEventBoundary | undefined;
            const isAllDayEvent =
              typeof startBoundary?.date === "string" &&
              typeof startBoundary?.dateTime !== "string";
            if (event.transparency === "transparent" && !isAllDayEvent) continue;

            const normalizedBounds = normalizeGoogleEventBounds(
              event,
              calendarTimezones.get(response.calendarId) ?? timeZone
            );
            if (!normalizedBounds) continue;
            const { start, end } = normalizedBounds;
            const key = `${start}-${end}`;
            const existing = busyByKey.get(key);

            busyByKey.set(key, {
              id: String(event.id ?? existing?.id ?? `${response.calendarId}-${start}-${end}`),
              title: String(event.summary ?? existing?.title ?? "Google Calendar event"),
              start,
              end,
              status:
                typeof event.status === "string" ? event.status : existing?.status ?? null,
              description:
                typeof event.description === "string"
                  ? event.description
                  : existing?.description ?? null,
              location:
                typeof event.location === "string" ? event.location : existing?.location ?? null,
              source: "google",
            });
          }
        }
      } catch (error) {
        console.warn("[google-calendar] events lookup threw:", error);
      }

      return Array.from(busyByKey.values());
    })
  );

  const busyByKey = new Map<string, GoogleBusyScheduleEntry>();
  for (const connectionResult of connectionResults) {
    for (const entry of connectionResult) {
      busyByKey.set(`${entry.start}-${entry.end}-${entry.title}`, entry);
    }
  }

  return Array.from(busyByKey.values());
}

/**
 * Builds the Google OAuth2 consent URL for calendar access.
 *
 * Async because client_id / redirect_uri now come from the admin-managed
 * google_api_keys table (with env var fallback). Callers that were
 * synchronous have been updated to await this.
 */
export async function getOAuthUrl(ownerId: string): Promise<string> {
  const creds = await getGoogleCredentials();
  const params = new URLSearchParams({
    client_id: creds.clientId,
    redirect_uri: creds.redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state: ownerId,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchanges an authorization code for tokens and stores the refresh token
 * on the diviner record AND in the new calendar_connections table
 * (dual-write during the cutover from JSONB-on-diviners to a normalized
 * table).
 */
export async function handleOAuthCallback(
  code: string,
  ownerId: string, // Changed from divinerId
  userId: string   // Added userId
): Promise<void> {
  const creds = await getGoogleCredentials();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      redirect_uri: creds.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${error}`);
  }

  const tokens = await response.json();
  const accessToken =
    typeof tokens.access_token === "string" ? tokens.access_token : null;
  const refreshToken =
    typeof tokens.refresh_token === "string" ? tokens.refresh_token : null;
  console.log("[Google OAuth] Exchange response:", {
    has_access: !!accessToken,
    has_refresh: !!refreshToken,
  });

  if (!refreshToken) {
    throw new Error("Google did not return a refresh token for this account");
  }

  const supabase = createAdminClient();
  const metadata = accessToken
    ? await getGoogleAccountMetadata(accessToken)
    : {
        accountIdentifier: `google:${userId}:${Date.now()}`.toLowerCase(),
        email: null,
      };

  await upsertCalendarConnection(supabase, {
    divinerId: ownerId,
    provider: "google",
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

/**
 * Calls the Google Calendar FreeBusy API to get busy time slots for a given date.
 * Returns an array of { start, end } busy periods.
 */
export async function getAvailableSlotsFromGoogle(
  ownerId: string,
  date: string,
  timeZone: string
): Promise<{ start: string; end: string }[]> {
  const busyEntries = await getGoogleBusySchedule(ownerId, date, timeZone);

  return busyEntries.map((entry) => ({
    start: entry.start,
    end: entry.end,
  }));
}

export async function getGoogleBusySchedule(
  ownerId: string,
  date: string,
  timeZone: string
): Promise<GoogleBusyScheduleEntry[]> {
  const { timeMin, timeMax } = getUtcDayRange(date, timeZone);
  return getGoogleBusyScheduleByRange(ownerId, timeMin, timeMax, timeZone);
}

export async function getGoogleBusyScheduleInRange(
  ownerId: string,
  timeMin: string,
  timeMax: string,
  timeZone: string
): Promise<GoogleBusyScheduleEntry[]> {
  return getGoogleBusyScheduleByRange(ownerId, timeMin, timeMax, timeZone);
}

/**
 * Creates a calendar event on the diviner's Google Calendar with booking details.
 */
export async function createCalendarEvent(
  ownerId: string,
  booking: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    clientEmail?: string;
    clientName?: string;
  }
): Promise<{ eventId: string; htmlLink: string }> {
  const connection = await getPreferredGoogleConnection(ownerId);
  if (!connection) {
    throw new Error("No Google Calendar connection found for this owner");
  }
  const accessToken = await getAccessToken(ownerId, connection);
  if (!accessToken) {
    throw new Error("Failed to refresh Google access token");
  }

  const event: Record<string, unknown> = {
    summary: booking.title,
    description: booking.description || "",
    start: {
      dateTime: booking.startTime,
    },
    end: {
      dateTime: booking.endTime,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 30 },
        { method: "email", minutes: 60 },
      ],
    },
  };

  if (booking.clientEmail) {
    event.attendees = [
      {
        email: booking.clientEmail,
        displayName: booking.clientName || undefined,
      },
    ];
  }

  const response = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create calendar event: ${errorText}`);
  }

  const data = await response.json();
  return { eventId: data.id, htmlLink: data.htmlLink };
}

/**
 * Update an existing Google Calendar event (for reschedule).
 */
export async function updateGoogleCalendarEvent(
  ownerId: string,
  eventId: string,
  newScheduledAt: string,
  durationMinutes: number
): Promise<boolean> {
  try {
    const connection = await getPreferredGoogleConnection(ownerId);
    if (!connection) return false;
    const accessToken = await getAccessToken(ownerId, connection);
    if (!accessToken) return false;

    const start = new Date(newScheduledAt);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    const res = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          start: { dateTime: start.toISOString() },
          end: { dateTime: end.toISOString() },
        }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Delete a Google Calendar event (for cancellation).
 */
export async function deleteGoogleCalendarEvent(
  ownerId: string,
  eventId: string
): Promise<boolean> {
  try {
    const connection = await getPreferredGoogleConnection(ownerId);
    if (!connection) return false;
    const accessToken = await getAccessToken(ownerId, connection);
    if (!accessToken) return false;

    const res = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return res.ok || res.status === 410 || res.status === 404;
  } catch {
    return false;
  }
}

/**
 * Sets up a Google Calendar push notification watch on the diviner's primary calendar.
 * Stores the channel-to-diviner mapping in calendar_webhook_channels for webhook reconciliation.
 *
 * @param webhookUrl - The publicly accessible URL for the webhook endpoint
 *   (e.g. https://yourdomain.com/api/webhooks/calendar)
 */
export async function watchGoogleCalendar(
  ownerId: string,
  webhookUrl: string
): Promise<{ channelId: string; expiration: string } | null> {
  try {
    const connection = await getPreferredGoogleConnection(ownerId);
    if (!connection) return null;
    const accessToken = await getAccessToken(ownerId, connection);
    if (!accessToken) return null;

    const channelId = crypto.randomUUID();
    // Google watch channels expire after a max of ~7 days; request the maximum
    const expiration = Date.now() + 7 * 24 * 60 * 60 * 1000;

    const res = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events/watch`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: channelId,
          type: "web_hook",
          address: webhookUrl,
          expiration,
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("[google-calendar] Failed to set up watch:", errText);
      return null;
    }

    const watchData = await res.json();

    // Store the channel mapping so the webhook can look up the diviner
    const supabase = createAdminClient();
    await supabase.from("calendar_webhook_channels").upsert(
      {
        channel_id: channelId,
        diviner_id: ownerId,
        provider: "google",
        resource_id: watchData.resourceId ?? null,
        expiration: new Date(Number(watchData.expiration)).toISOString(),
      },
      { onConflict: "channel_id" }
    );

    return {
      channelId,
      expiration: new Date(Number(watchData.expiration)).toISOString(),
    };
  } catch (err) {
    console.error("[google-calendar] Error setting up watch:", err);
    return null;
  }
}

/**
 * Disconnects Google Calendar by clearing the stored connection.
 */
export async function disconnectGoogleCalendar(
  ownerId: string,
  connectionId?: string
): Promise<void> {
  const supabase = createAdminClient();
  await deleteCalendarConnection(supabase, ownerId, "google", connectionId);
}
