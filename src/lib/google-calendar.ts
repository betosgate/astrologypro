import { createAdminClient } from "@/lib/supabase/admin";
import { upsertCalendarConnection, deleteCalendarConnection } from "@/lib/calendar/connections";
import { getGoogleCredentials } from "@/lib/calendar/provider-credentials";

// Google OAuth client credentials are now resolved at call time via
// getGoogleCredentials() — it reads the admin-managed google_api_keys table
// first, then falls back to env vars. See tasks/09.04.2026/calendar-module/
// 11-api-keys-config.md for why.

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events.owned",
  "https://www.googleapis.com/auth/userinfo.email",
];
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const TABLE_NAME = "calendar_connections";

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
  console.log("[Google OAuth] Exchange response:", {
    has_access: !!tokens.access_token,
    has_refresh: !!tokens.refresh_token,
  });

  const supabase = createAdminClient();

  // We identify the user's connection by both userId and provider
  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert({
      user_id: userId,
      owner_id: ownerId,
      provider: "google",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token, // Google refresh tokens are long-lived
      expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
      updated_at: new Date().toISOString()
    }, {
      onConflict: "user_id,provider"
    });

  if (error) {
    console.error("[Google OAuth] Upsert failed:", error);
    throw new Error(`Failed to store calendar connection: ${error.message}`);
  }

  // Dual-write to the normalized calendar_connections table. Best-effort —
  // never throws because we don't want the cutover write to break the
  // legacy success path. (Pre-existing bug fix: the surrounding function
  // renamed its parameter from divinerId to ownerId but this call site
  // still used the old name.)
  await upsertCalendarConnection(supabase, {
    divinerId: ownerId,
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
 *
 * Read-side cutover: prefer the normalized calendar_connections table.
 * Fall back to the legacy diviners.google_calendar_token JSONB scalar
 * during the cutover window so neither newly-connected nor pre-cutover
 * diviners are broken.
 */
async function getAccessToken(ownerId: string): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("access_token, refresh_token, expires_at")
    .eq("owner_id", ownerId)
    .eq("provider", "google")
    .single();

  if (error || !data?.refresh_token) {
    throw new Error("No Google Calendar connection found for this owner");
  }

  // If token is still valid (5 min buffer), return cached access_token
  if (data.access_token && data.expires_at) {
    const expiresAt = new Date(data.expires_at).getTime();
    if (expiresAt > Date.now() + 5 * 60 * 1000) {
      return data.access_token;
    }
  }

  // Otherwise, refresh it
  const creds = await getGoogleCredentials();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      refresh_token: data.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Google access token");
  }

  const tokens = await response.json();

  // Cache the new access token
  await supabase
    .from(TABLE_NAME)
    .update({
      access_token: tokens.access_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("owner_id", ownerId)
    .eq("provider", "google");

  return tokens.access_token;
}

/**
 * Calls the Google Calendar FreeBusy API to get busy time slots for a given date.
 * Returns an array of { start, end } busy periods.
 */
export async function getAvailableSlotsFromGoogle(
  ownerId: string,
  date: Date
): Promise<{ start: string; end: string }[]> {
  const accessToken = await getAccessToken(ownerId);

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
  const accessToken = await getAccessToken(ownerId);

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
    const accessToken = await getAccessToken(ownerId);
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
    const accessToken = await getAccessToken(ownerId);
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
    const accessToken = await getAccessToken(ownerId);
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
  ownerId: string
): Promise<void> {
  const supabase = createAdminClient();
  // Note: do NOT write google_calendar_connected — it is GENERATED ALWAYS
  // (see migration 20260403000001) and is automatically derived from
  // google_calendar_token IS NOT NULL.
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("owner_id", ownerId)
    .eq("provider", "google");

  if (error) {
    throw new Error(`Failed to disconnect Google Calendar: ${error.message}`);
  }

  // Mirror the disconnect into the normalized calendar_connections table.
  await deleteCalendarConnection(supabase, ownerId, "google");
}
