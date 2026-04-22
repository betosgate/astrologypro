import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { RescheduleView } from "@/components/booking/reschedule-view";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarClock } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ username: string; bookingId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function ReschedulePage({ params, searchParams }: PageProps) {
  const { username, bookingId } = await params;
  const { token } = await searchParams;
  const admin = createAdminClient();

  const { data: diviner } = await admin
    .from("diviners")
    .select("id, username, display_name")
    .eq("username", username)
    .eq("is_active", true)
    .single();

  if (!diviner) notFound();

  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id, scheduled_at, duration_minutes, session_notes, questionnaire_responses, metadata, booking_token, services(id, name), clients(full_name, email)"
    )
    .eq("id", bookingId)
    .eq("owner_id", diviner.id)
    .single();

  if (!booking) notFound();

  // The reschedule page is accessed either by the diviner (from the dashboard)
  // or by the client (from the booking-manage link in their confirmation
  // email). The client path supplies the booking_token as a query param; we
  // only pass it through to the view when it matches, so a random URL with a
  // bogus token can't escalate privileges.
  const bookingTokenForClient =
    token && token === (booking as { booking_token?: string }).booking_token
      ? token
      : null;

  const svc = (booking as Record<string, unknown>).services as {
    id: string;
    name: string;
  } | null;
  const client = (booking as Record<string, unknown>).clients as {
    full_name: string | null;
    email: string | null;
  } | null;
  const meta = (booking as Record<string, unknown>).metadata as {
    availability_title?: string;
  } | null;

  const serviceName = meta?.availability_title ?? svc?.name ?? "Session";
  const serviceId = svc?.id ?? null;
  const clientName = client?.full_name ?? null;
  const clientEmail = client?.email ?? null;
  const sessionNotes = (booking as Record<string, unknown>).session_notes as string | null;
  const qr = (booking as Record<string, unknown>).questionnaire_responses as Record<string, unknown> | null;
  const existingAttendees = Array.isArray(qr?.attendees)
    ? (qr.attendees as Array<{ name: string; email: string }>)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-6 gap-2">
          <Link
            href={
              bookingTokenForClient
                ? `/booking/${bookingTokenForClient}`
                : "/dashboard/calendar"
            }
          >
            <ArrowLeft className="size-4" />
            {bookingTokenForClient ? "Back to Booking" : "Back to Calendar"}
          </Link>
        </Button>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
            <CalendarClock className="size-6 text-amber-400" />
          </div>
          <h1 className="mb-2 text-2xl font-bold md:text-3xl">
            Reschedule Session
          </h1>
          <p className="text-muted-foreground">
            Picking a new time for{" "}
            <strong className="text-foreground">{serviceName}</strong>
            {bookingTokenForClient ? (
              <>
                {" "}
                with{" "}
                <strong className="text-foreground">{diviner.display_name}</strong>
              </>
            ) : clientName ? (
              <>
                {" "}
                with{" "}
                <strong className="text-foreground">{clientName}</strong>
              </>
            ) : null}
          </p>
        </div>

        {/* Current booking info */}
        <div className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Current time:</span>
          <span className="font-medium text-foreground">
            {new Date(booking.scheduled_at).toLocaleString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>

        <RescheduleView
          bookingId={bookingId}
          divinerId={diviner.id}
          divinerDisplayName={diviner.display_name}
          divinerUsername={diviner.username}
          serviceName={serviceName}
          durationMinutes={booking.duration_minutes}
          serviceId={serviceId}
          clientName={clientName}
          clientEmail={clientEmail}
          sessionNotes={sessionNotes}
          existingAttendees={existingAttendees}
          currentScheduledAt={booking.scheduled_at}
          bookingToken={bookingTokenForClient}
        />
      </div>
    </div>
  );
}
