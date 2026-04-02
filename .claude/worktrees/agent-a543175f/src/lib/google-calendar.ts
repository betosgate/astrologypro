import { createAdminClient } from "@/lib/supabase/admin";

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
 * on the diviner record.
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
  const { error } = await supabase
    .from("diviners")
    .update({
      google_calendar_token: tokens.refresh_token,
      google_calendar_connected: true,
    })
    .eq("id", divinerId);

  if (error) {
    throw new Error(`Failed to store calendar token: ${error.message}`);
  }
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
 * Disconnects Google Calendar by clearing the stored token.
 */
export async function disconnectGoogleCalendar(
  divinerId: string
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("diviners")
    .update({
      google_calendar_token: null,
      google_calendar_connected: false,
    })
    .eq("id", divinerId);

  if (error) {
    throw new Error(`Failed to disconnect Google Calendar: ${error.message}`);
  }
}
