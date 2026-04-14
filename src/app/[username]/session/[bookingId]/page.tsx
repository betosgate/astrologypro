import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SessionRoom } from "@/components/session/session-room";
import { ChimeSessionRoom } from "@/components/session/chime-session-room";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, User } from "lucide-react";
import { createChimeMeeting, createChimeAttendee } from "@/lib/chime-meetings";

interface PageProps {
  params: Promise<{ username: string; bookingId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  return {
    title: "Video Session",
  };
}

export default async function SessionPage({ params }: PageProps) {
  const { username, bookingId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Fetch the booking with related data
  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, scheduled_at, status, duration_minutes, daily_room_url, daily_room_name, video_provider, chime_meeting_id, chime_external_meeting_id, diviner_id, client_id, base_price, questionnaire_responses, services(name, duration_minutes, overage_rate), clients(id, full_name, email, birth_date, birth_time, birth_city)"
    )
    .eq("id", bookingId)
    .single();

  if (!booking) {
    notFound();
  }

  let videoProvider = (booking as any).video_provider ?? "chime";

  // If no Chime meeting exists yet, provision one on-demand so the page
  // never 404s when the diviner navigates here before the button creates it.
  if (videoProvider !== "daily" && !(booking as any).chime_meeting_id) {
    try {
      const admin = createAdminClient();
      const durationMinutes =
        ((booking.services as any)?.duration_minutes as number | undefined) ??
        (booking.duration_minutes as number | undefined) ??
        60;

      const meeting = await createChimeMeeting(bookingId, durationMinutes, 2);
      await createChimeAttendee(meeting.meetingId, `diviner-${booking.diviner_id}`);

      await admin
        .from("bookings")
        .update({
          chime_meeting_id: meeting.meetingId,
          chime_external_meeting_id: meeting.externalMeetingId,
          video_provider: "chime",
        })
        .eq("id", bookingId);

      // Re-fetch updated booking so the room renders with correct meetingId
      const { data: refreshed } = await supabase
        .from("bookings")
        .select(
          "id, scheduled_at, status, duration_minutes, daily_room_url, daily_room_name, video_provider, chime_meeting_id, chime_external_meeting_id, diviner_id, client_id, base_price, questionnaire_responses, services(name, duration_minutes, overage_rate), clients(id, full_name, email, birth_date, birth_time, birth_city)"
        )
        .eq("id", bookingId)
        .single();

      if (refreshed) {
        Object.assign(booking, refreshed);
        videoProvider = "chime";
      }
    } catch (err) {
      console.error("Session page: on-demand Chime provisioning failed:", err);
      notFound();
    }
  }

  // Daily provider still requires a room URL
  if (videoProvider === "daily" && !booking.daily_room_url) {
    notFound();
  }

  // Determine user role
  const { data: diviner } = await supabase
    .from("diviners")
    .select("id, display_name, username")
    .eq("user_id", user.id)
    .single();

  let role: "diviner" | "client" | null = null;

  if (diviner && diviner.id === booking.diviner_id) {
    role = "diviner";
  } else if (booking.client_id === user.id) {
    role = "client";
  }

  if (!role) {
    notFound();
  }

  const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;
  const client = Array.isArray(booking.clients) ? booking.clients[0] : booking.clients;
  const serviceName = (service as any)?.name ?? "Reading Session";
  const clientName = (client as any)?.full_name ?? (client as any)?.email ?? "Client";
  const scheduledDuration = (service as any)?.duration_minutes ?? booking.duration_minutes ?? 60;
  const serviceOverageRate = Number((service as any)?.overage_rate ?? 0.50);

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
          meetingId={(booking as any).chime_meeting_id}
          attendeeId=""
          joinToken=""
          role={role}
          serviceName={serviceName}
          clientName={clientName}
          divinerName={diviner?.display_name ?? "Diviner"}
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
      ) : (
        <SessionRoom
          bookingId={booking.id}
          roomUrl={booking.daily_room_url!}
          role={role}
          serviceName={serviceName}
          clientName={clientName}
          divinerName={diviner?.display_name ?? "Diviner"}
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
