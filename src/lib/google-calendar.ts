import { createAdminClient } from "@/lib/supabase/admin";
import { upsertCalendarConnection, deleteCalendarConnection } from "@/lib/calendar/connections";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  "http://localhost:3000/api/calendar/callback";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

/**
 * Builds the Google OAuth2 consent URL for calendar access.
 */
export function getOAuthUrl(divinerId: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state: divinerId,
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
  divinerId: string
): Promise<void> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${error}`);
  }

  const tokens = await response.json();

  const supabase = createAdminClient();
  // Note: do NOT write google_calendar_connected — it is a GENERATED ALWAYS
  // column (see migration 20260403000001) and the previous version of this
  // code was failing at runtime because of it.
  const { error } = await supabase
    .from("diviners")
    .update({
      google_calendar_token: tokens.refresh_token,
    })
    .eq("id", divinerId);

  if (error) {
    throw new Error(`Failed to store calendar token: ${error.message}`);
  }

  // Dual-write to the normalized calendar_connections table. Best-effort —
  // never throws because we don't want the cutover write to break the
  // legacy success path.
  await upsertCalendarConnection(supabase, {
    divinerId,
    provider: "google",
    refreshToken: tokens.refresh_token,
    expiresAt:
      typeof tokens.expires_in === "number"
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null,
  });
}

/**
 * Refreshes the access token using the stored refresh token.
 */
async function getAccessToken(divinerId: string): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("diviners")
    .select("google_calendar_token")
    .eq("id", divinerId)
    .single();

  if (error || !data?.google_calendar_token) {
    throw new Error("No Google Calendar token found for this diviner");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: data.google_calendar_token,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Google access token");
  }

  const tokens = await response.json();
  return tokens.access_token;
}

/**
 * Calls the Google Calendar FreeBusy API to get busy time slots for a given date.
 * Returns an array of { start, end } busy periods.
 */
export async function getAvailableSlotsFromGoogle(
  divinerId: string,
  date: Date
): Promise<{ start: string; end: string }[]> {
  const accessToken = await getAccessToken(divinerId);

  const timeMin = new Date(date);
  timeMin.setHours(0, 0, 0, 0);

  const timeMax = new Date(date);
  timeMax.setHours(23, 59, 59, 999);

  const response = await fetch(`${GOOGLE_CALENDAR_API}/freeBusy`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: "primary" }],
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Google Calendar availability");
  }

  const data = await response.json();
  const busySlots = data.calendars?.primary?.busy ?? [];

  return busySlots as { start: string; end: string }[];
}

/**
 * Creates a calendar event on the diviner's Google Calendar with booking details.
 */
export async function createCalendarEvent(
  divinerId: string,
  booking: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    clientEmail?: string;
    clientName?: string;
  }
): Promise<{ eventId: string; htmlLink: string }> {
  const accessToken = await getAccessToken(divinerId);

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
  divinerId: string,
  eventId: string,
  newScheduledAt: string,
  durationMinutes: number
): Promise<boolean> {
  try {
    const accessToken = await getAccessToken(divinerId);
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
  divinerId: string,
  eventId: string
): Promise<boolean> {
  try {
    const accessToken = await getAccessToken(divinerId);
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
  divinerId: string,
  webhookUrl: string
): Promise<{ channelId: string; expiration: string } | null> {
  try {
    const accessToken = await getAccessToken(divinerId);
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
        diviner_id: divinerId,
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
 * Disconnects Google Calendar by clearing the stored token.
 */
export async function disconnectGoogleCalendar(
  divinerId: string
): Promise<void> {
  const supabase = createAdminClient();
  // Note: do NOT write google_calendar_connected — it is GENERATED ALWAYS
  // (see migration 20260403000001) and is automatically derived from
  // google_calendar_token IS NOT NULL.
  const { error } = await supabase
    .from("diviners")
    .update({
      google_calendar_token: null,
    })
    .eq("id", divinerId);

  if (error) {
    throw new Error(`Failed to disconnect Google Calendar: ${error.message}`);
  }

  // Mirror the disconnect into the normalized calendar_connections table.
  await deleteCalendarConnection(supabase, divinerId, "google");
}
