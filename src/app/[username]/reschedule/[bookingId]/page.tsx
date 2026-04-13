import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { RescheduleView } from "@/components/booking/reschedule-view";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarClock } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ username: string; bookingId: string }>;
}

export default async function ReschedulePage({ params }: PageProps) {
  const { username, bookingId } = await params;
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
      "id, scheduled_at, duration_minutes, session_notes, questionnaire_responses, metadata, services(id, name), clients(full_name, email)"
    )
    .eq("id", bookingId)
    .eq("owner_id", diviner.id)
    .single();

  if (!booking) notFound();

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
          <Link href="/dashboard/calendar">
            <ArrowLeft className="size-4" />
            Back to Calendar
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
            {clientName ? (
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
          serviceName={serviceName}
          durationMinutes={booking.duration_minutes}
          serviceId={serviceId}
          clientName={clientName}
          clientEmail={clientEmail}
          sessionNotes={sessionNotes}
          existingAttendees={existingAttendees}
          currentScheduledAt={booking.scheduled_at}
        />
      </div>
    </div>
  );
}
