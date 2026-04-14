import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SessionRoom } from "@/components/session/session-room";
import { ChimeSessionRoom } from "@/components/session/chime-session-room";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, User } from "lucide-react";
import { createChimeMeeting, createChimeAttendee } from "@/lib/chime-meetings";

const BOOKING_SELECT =
  "id, scheduled_at, status, duration_minutes, daily_room_url, daily_room_name, video_provider, chime_meeting_id, chime_external_meeting_id, diviner_id, client_id, base_price, questionnaire_responses, services(name, duration_minutes, overage_rate), clients(id, full_name, email, birth_date, birth_time, birth_city), diviners(display_name, username)";

interface PageProps {
  params: Promise<{ username: string; bookingId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return { title: "Video Session" };
}

/** Provision Chime on-demand if no meeting exists yet. Mutates the booking object in place. */
async function ensureChimeMeeting(booking: any, bookingId: string, adminDb: ReturnType<typeof createAdminClient>) {
  const durationMinutes =
    (Array.isArray(booking.services) ? booking.services[0] : booking.services)?.duration_minutes ??
    booking.duration_minutes ??
    60;

  const meeting = await createChimeMeeting(bookingId, durationMinutes, 5);
  await createChimeAttendee(meeting.meetingId, `diviner-${booking.diviner_id}`);

  await adminDb
    .from("bookings")
    .update({
      chime_meeting_id: meeting.meetingId,
      chime_external_meeting_id: meeting.externalMeetingId,
      video_provider: "chime",
    })
    .eq("id", bookingId);

  const { data: refreshed } = await adminDb
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("id", bookingId)
    .single();

  if (refreshed) Object.assign(booking, refreshed);
}

export default async function SessionPage({ params, searchParams }: PageProps) {
  const { username, bookingId } = await params;
  const { token } = await searchParams;

  const admin = createAdminClient();

  let booking: any = null;
  let role: "diviner" | "client" | null = null;
  let divinerDisplayName = "Diviner";

  // ── Token-based guest access (client, no login required) ──────────────────
  if (token) {
    const { data } = await admin
      .from("bookings")
      .select(BOOKING_SELECT)
      .eq("id", bookingId)
      .eq("booking_token", token)
      .single();

    if (!data) notFound();
    booking = data;
    role = "client";

    const divinerInfo = Array.isArray(booking.diviners) ? booking.diviners[0] : booking.diviners;
    divinerDisplayName = divinerInfo?.display_name ?? "Diviner";

  // ── Auth-based access (diviner or authenticated client) ───────────────────
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) notFound();

    const { data } = await supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .eq("id", bookingId)
      .single();

    if (!data) notFound();
    booking = data;

    const [{ data: diviner }, { data: clientRecord }] = await Promise.all([
      supabase.from("diviners").select("id, display_name, username").eq("user_id", user.id).maybeSingle(),
      supabase.from("clients").select("id").eq("user_id", user.id).maybeSingle(),
    ]);

    if (diviner && diviner.id === booking.diviner_id) {
      role = "diviner";
      divinerDisplayName = diviner.display_name;
    } else if (clientRecord && clientRecord.id === booking.client_id) {
      role = "client";
      const divinerInfo = Array.isArray(booking.diviners) ? booking.diviners[0] : booking.diviners;
      divinerDisplayName = divinerInfo?.display_name ?? "Diviner";
    }

    if (!role) notFound();
  }

  // ── Provision Chime on-demand if needed ───────────────────────────────────
  let videoProvider = booking.video_provider ?? "chime";

  if (videoProvider !== "daily" && !booking.chime_meeting_id) {
    try {
      await ensureChimeMeeting(booking, bookingId, admin);
      videoProvider = "chime";
    } catch (err) {
      console.error("Session page: on-demand Chime provisioning failed:", err);
      notFound();
    }
  }

  if (videoProvider === "daily" && !booking.daily_room_url) notFound();

  // ── Extract display data ───────────────────────────────────────────────────
  const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;
  const client  = Array.isArray(booking.clients)  ? booking.clients[0]  : booking.clients;

  const serviceName      = service?.name ?? "Reading Session";
  const clientName       = client?.full_name ?? client?.email ?? "Client";
  const scheduledDuration = service?.duration_minutes ?? booking.duration_minutes ?? 60;
  const serviceOverageRate = Number(service?.overage_rate ?? 0.50);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Session Info Header */}
      <div className="border-b border-border bg-card/50 px-4 py-3">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold gold-text">{serviceName}</h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {role === "diviner" ? "Diviner" : "Client"}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="size-3.5 text-primary" />
              {clientName}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5 text-primary" />
              {formatDateTime(booking.scheduled_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-primary" />
              {scheduledDuration} min
            </span>
          </div>
        </div>
      </div>

      {/* Video Session Room — provider-routed */}
      {videoProvider === "chime" ? (
        <ChimeSessionRoom
          bookingId={booking.id}
          meetingId={booking.chime_meeting_id}
          attendeeId=""
          joinToken=""
          role={role!}
          serviceName={serviceName}
          clientName={clientName}
          divinerName={divinerDisplayName}
          scheduledDuration={scheduledDuration}
          basePrice={Number(booking.base_price)}
          overageRate={serviceOverageRate}
          username={username}
          clientToken={token}
          questionnaire={booking.questionnaire_responses as { focusQuestion?: string; lifeArea?: string; additionalNotes?: string } | undefined}
          clientBirthData={client ? {
            date: client.birth_date ?? undefined,
            time: client.birth_time ?? undefined,
            city: client.birth_city ?? undefined,
          } : undefined}
        />
      ) : (
        <SessionRoom
          bookingId={booking.id}
          roomUrl={booking.daily_room_url!}
          role={role!}
          serviceName={serviceName}
          clientName={clientName}
          divinerName={divinerDisplayName}
          scheduledDuration={scheduledDuration}
          basePrice={Number(booking.base_price)}
          overageRate={serviceOverageRate}
          username={username}
          questionnaire={booking.questionnaire_responses as { focusQuestion?: string; lifeArea?: string; additionalNotes?: string } | undefined}
          clientBirthData={client ? {
            date: client.birth_date ?? undefined,
            time: client.birth_time ?? undefined,
            city: client.birth_city ?? undefined,
          } : undefined}
        />
      )}
    </div>
  );
}
