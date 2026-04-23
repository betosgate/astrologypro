import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin-auth";
import { ChimeSessionRoom } from "@/components/session/chime-session-room";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, User } from "lucide-react";

export const metadata = { title: "Video Session" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ username: string; bookingId: string }>;
}

/**
 * Video session for `admin_bookings` rows (admin host ↔ client).
 *
 * Parallels `/{divinerUsername}/session/{bookingId}` but without any
 * product/money concerns — admin bookings have no service, no base
 * price, and no overage. The Chime attendee is provisioned through
 * `/api/chime/admin-bookings/join` (see `ChimeSessionRoom.joinApiPath`).
 *
 * Authorized callers:
 *   - The admin whose `user_id` owns the booking
 *   - An authenticated client whose email matches `client_email`
 */
export default async function AdminBookingSessionPage({ params }: PageProps) {
  const { username, bookingId } = await params;
  const admin = createAdminClient();

  // Look the booking up by id alone — it is the source of truth. The URL
  // username is a vanity segment, not a join condition. This avoids a spurious
  // 404 when the URL's username doesn't match the booking's host admin (e.g.,
  // the admin renamed their username after the booking was created, or the
  // link was hand-crafted with the wrong prefix).
  const { data: booking } = await admin
    .from("admin_bookings")
    .select(
      "id, admin_user_id, client_name, client_email, scheduled_at, duration_minutes, timezone, status, chime_meeting_id, video_provider",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) {
    console.warn(
      `[session-page] no admin_bookings row for id=${bookingId} (url username=${username})`,
    );
    notFound();
  }

  // Resolve the actual host admin from the booking row, NOT from the URL
  // username. That way a username change (or a bad URL segment) doesn't
  // 404 the page.
  const { data: hostAdminRow } = await admin
    .from("admin_users")
    .select("user_id, username, display_name")
    .eq("user_id", booking.admin_user_id)
    .maybeSingle();

  if (!hostAdminRow?.user_id) {
    console.warn(
      `[session-page] no admin_users row for admin_user_id=${booking.admin_user_id} (booking=${bookingId})`,
    );
    notFound();
  }

  // If the URL username is stale/wrong, redirect to the canonical one so the
  // address bar matches the host admin. Only redirect when we have a canonical
  // username to send them to.
  const canonicalUsername = (hostAdminRow.username as string | null) ?? null;
  if (
    canonicalUsername &&
    canonicalUsername.toLowerCase() !== username.toLowerCase()
  ) {
    redirect(
      `/book/${encodeURIComponent(canonicalUsername)}/session/${bookingId}`,
    );
  }

  // Alias so the rest of the file continues to read `adminRow`.
  const adminRow = hostAdminRow;

  // Canceled sessions have no room. Send the caller back to their home.
  if (booking.status === "canceled") notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const adminUser = await getAdminUser();

  const authEmail = user?.email?.trim().toLowerCase() ?? null;
  const bookingEmail = (booking.client_email ?? "").trim().toLowerCase();
  const isOwnerAdmin = !!adminUser && adminUser.id === booking.admin_user_id;
  const isClient =
    !!authEmail && !!bookingEmail && authEmail === bookingEmail;

  if (!isOwnerAdmin && !isClient) {
    // Not logged in at all → bounce through login and return here. Matches the
    // /book/<username>/reschedule/<id> behavior so admin + trainee flows stay
    // consistent.
    if (!user) {
      redirect(
        `/login?reason=session&next=${encodeURIComponent(
          `/book/${username}/session/${bookingId}`,
        )}`,
      );
    }
    // Logged in, but the email on the auth session doesn't match the booking
    // and the viewer isn't the host admin either. Show a 404 so we don't leak
    // the booking's existence.
    notFound();
  }

  const role: "diviner" | "client" = isOwnerAdmin ? "diviner" : "client";
  const hostName = adminRow.display_name ?? adminRow.username ?? "Host";
  const clientName = booking.client_name ?? booking.client_email ?? "Client";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="border-b border-border bg-card/50 px-4 py-3">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">Appointment</h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {role === "diviner" ? "Host" : "Client"}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="size-3.5 text-primary" />
              <span className="text-xs text-muted-foreground/70">Client:</span> {clientName}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5 text-primary" />
              {formatDateTime(booking.scheduled_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-primary" />
              {booking.duration_minutes} min
            </span>
          </div>
        </div>
      </div>

      <ChimeSessionRoom
        bookingId={booking.id}
        meetingId={booking.chime_meeting_id ?? ""}
        attendeeId=""
        joinToken=""
        role={role}
        serviceName="Appointment"
        clientName={clientName}
        divinerName={hostName}
        scheduledDuration={booking.duration_minutes}
        basePrice={0}
        overageRate={0}
        username={adminRow.username}
        joinApiPath="/api/chime/admin-bookings/join"
        disableBillingAndNotes
      />
    </div>
  );
}
