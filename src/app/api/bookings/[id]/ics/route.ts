import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateICS } from "@/lib/ics";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  const admin = createAdminClient();

  // Fetch booking with all related data needed for ICS generation
  const { data: booking, error } = await admin
    .from("bookings")
    .select(`
      id, scheduled_at, duration_minutes, status, booking_token,
      client_id, diviner_id,
      services(name, description, duration_minutes),
      diviners(display_name, timezone),
      clients(full_name, email)
    `)
    .eq("id", id)
    .single();

  if (error || !booking) {
    return Response.json(
      {
        type: "https://astrologypro.com/errors/not-found",
        title: "Not Found",
        status: 404,
        detail: "Booking not found.",
      },
      { status: 404 }
    );
  }

  // ---------------------------------------------------------------------------
  // Authorization: valid booking_token in query string OR authenticated user
  // who is the client or diviner on this booking
  // ---------------------------------------------------------------------------
  let authorized = false;

  if (token && token === booking.booking_token) {
    authorized = true;
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Check if authenticated user is the client on this booking
      const { data: clientRecord } = await admin
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (clientRecord && clientRecord.id === booking.client_id) {
        authorized = true;
      }

      // Check if authenticated user is the diviner on this booking
      if (!authorized) {
        const { data: divinerRecord } = await admin
          .from("diviners")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (divinerRecord && divinerRecord.id === booking.diviner_id) {
          authorized = true;
        }
      }
    }
  }

  if (!authorized) {
    return Response.json(
      {
        type: "https://astrologypro.com/errors/forbidden",
        title: "Forbidden",
        status: 403,
        detail: "You are not authorized to access this booking.",
      },
      { status: 403 }
    );
  }

  // ---------------------------------------------------------------------------
  // Extract related record data (PostgREST joins come back as objects)
  // ---------------------------------------------------------------------------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookingAny = booking as Record<string, any>;

  const svc = bookingAny.services as {
    name: string;
    description: string | null;
    duration_minutes: number;
  } | null;

  const div = bookingAny.diviners as {
    display_name: string;
    timezone: string | null;
  } | null;

  const client = bookingAny.clients as {
    full_name: string | null;
    email: string;
  } | null;

  if (!svc || !div || !client) {
    return Response.json(
      {
        type: "https://astrologypro.com/errors/internal",
        title: "Internal Server Error",
        status: 500,
        detail: "Booking data is incomplete.",
      },
      { status: 500 }
    );
  }

  // ---------------------------------------------------------------------------
  // Build ICS
  // ---------------------------------------------------------------------------
  const startISO = booking.scheduled_at;
  const durationMins = booking.duration_minutes ?? svc.duration_minutes;
  const endISO = new Date(
    new Date(startISO).getTime() + durationMins * 60 * 1000
  ).toISOString();

  // Use a placeholder organizer email if the diviner's user email isn't fetched
  // The ICS organizer field is informational; the invite goes to the attendee.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const organizerEmail =
    process.env.AWS_SES_FROM_ADDRESS?.replace(/^.*<(.+)>$/, "$1") ??
    "noreply@divineinfinitebeing.com";

  const title = `${svc.name} with ${div.display_name}`;
  const description = [
    svc.description ?? svc.name,
    "",
    `Duration: ${durationMins} minutes`,
    `Manage your booking: ${appUrl}/booking/${booking.booking_token}`,
  ]
    .join("\n")
    .trim();

  const icsContent = generateICS({
    uid: booking.id,
    title,
    description,
    startISO,
    endISO,
    organizerName: div.display_name,
    organizerEmail,
    attendeeName: client.full_name ?? "Client",
    attendeeEmail: client.email,
    location: "Online via AstrologyPro",
    timezone: div.timezone ?? undefined,
  });

  return new Response(icsContent, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="booking-${id}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
