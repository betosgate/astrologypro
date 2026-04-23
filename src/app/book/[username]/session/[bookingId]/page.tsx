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
 * Dev-mode diagnostic page. Renders inline instead of 404ing so we can
 * see exactly which precondition failed. In production the same branches
 * still call notFound() — this helper is only used when NODE_ENV is not
 * "production".
 */
function SessionDiagnosticPage({
  reason,
  details,
}: {
  reason: string;
  details: Record<string, unknown>;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-8 font-mono text-sm">
      <h1 className="text-xl font-semibold text-red-600">
        Session page — {reason}
      </h1>
      <p className="text-muted-foreground">
        This diagnostic screen is only shown in development. In production the
        user would see a generic 404.
      </p>
      <pre className="overflow-auto rounded-md border bg-muted/30 p-4 text-xs">
        {JSON.stringify(details, null, 2)}
      </pre>
    </div>
  );
}

const isDev = process.env.NODE_ENV !== "production";

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
  const { data: booking, error: bookingError } = await admin
    .from("admin_bookings")
    .select(
      "id, admin_user_id, client_name, client_email, scheduled_at, duration_minutes, timezone, status, chime_meeting_id, video_provider",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError) {
    console.error("[session-page] admin_bookings query error:", bookingError);
    if (isDev) {
      return (
        <SessionDiagnosticPage
          reason="admin_bookings query error"
          details={{ bookingId, username, error: bookingError.message }}
        />
      );
    }
    notFound();
  }

  if (!booking) {
    console.warn(
      `[session-page] no admin_bookings row for id=${bookingId} (url username=${username})`,
    );
    if (isDev) {
      // Run a diagnostic: check if this id actually lives in some other table
      // so we know what surface is broken (legacy bookings? typo in id?).
      const { data: legacy } = await admin
        .from("bookings")
        .select("id, diviner_id, owner_id, status")
        .eq("id", bookingId)
        .maybeSingle();
      return (
        <SessionDiagnosticPage
          reason="booking not found in admin_bookings"
          details={{
            bookingId,
            urlUsername: username,
            foundInLegacyBookings: !!legacy,
            legacy,
            hint: legacy
              ? "This id lives in `bookings` (legacy diviner flow). This page only handles `admin_bookings`. Use /<divinerUsername>/session/<id> instead."
              : "No row with this id in either admin_bookings or bookings. The id is wrong, or the row was deleted.",
          }}
        />
      );
    }
    notFound();
  }

  // Resolve the actual host admin from the booking row, NOT from the URL
  // username. That way a username change (or a bad URL segment) doesn't
  // 404 the page.
  //
  // NOTE: do not select `display_name` — that column does not exist on
  // admin_users in every environment, and PostgREST returns a silent
  // column-not-found error when we ask for it. Username is enough for
  // the header; we already have the hostName fallback below.
  const { data: hostAdminByBookingId, error: hostAdminByBookingError } =
    await admin
      .from("admin_users")
      .select("user_id, username")
      .eq("user_id", booking.admin_user_id)
      .maybeSingle();

  if (hostAdminByBookingError) {
    console.error(
      "[session-page] admin_users lookup by user_id error:",
      hostAdminByBookingError,
    );
  }

  let hostAdminRow:
    | { user_id: string; username: string | null }
    | null = (hostAdminByBookingId as
      | { user_id: string; username: string | null }
      | null) ?? null;

  // Fallback — if the booking's admin_user_id is orphaned (the admin_users
  // row was deleted/recreated after the booking was made), fall back to
  // whatever admin currently owns the URL username. The booking row is still
  // authoritative for auth (see isOwnerAdmin below), but the page needs an
  // admin profile to render the header, and the URL-username admin is the
  // sensible display host.
  if (!hostAdminRow?.user_id) {
    console.warn(
      `[session-page] no admin_users row for admin_user_id=${booking.admin_user_id} on booking=${bookingId}, falling back to url username=${username}`,
    );
    const { data: urlAdminRow, error: urlAdminError } = await admin
      .from("admin_users")
      .select("user_id, username")
      .ilike("username", username)
      .maybeSingle();
    if (urlAdminError) {
      console.error(
        "[session-page] admin_users lookup by username error:",
        urlAdminError,
      );
    }
    hostAdminRow =
      (urlAdminRow as { user_id: string; username: string | null } | null) ??
      null;
  }

  if (!hostAdminRow?.user_id) {
    console.warn(
      `[session-page] no admin_users row for admin_user_id=${booking.admin_user_id} or url username=${username} (booking=${bookingId})`,
    );
    if (isDev) {
      // Dump everything in admin_users so we can see the ground truth.
      // Something is odd: the wizard created this booking using the same
      // .ilike("username", username) query, but the session page sees no row.
      const { data: allAdmins, error: dumpError } = await admin
        .from("admin_users")
        .select("id, user_id, username, email, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      return (
        <SessionDiagnosticPage
          reason="no admin_users row for booking's admin_user_id or url username"
          details={{
            bookingId,
            bookingAdminUserId: booking.admin_user_id,
            urlUsername: username,
            adminUsersDumpError: dumpError?.message ?? null,
            adminUsersCount: allAdmins?.length ?? 0,
            adminUsers: allAdmins ?? [],
            hint: "Compare booking.admin_user_id against the user_id column in adminUsers below, and compare 'tabby' (case-insensitive) against the username column. If admin_users is empty or the username is spelled differently (extra whitespace, different casing, etc.), that's the bug.",
          }}
        />
      );
    }
    notFound();
  }

  // Auto-heal — if we reached `hostAdminRow` via the URL-username fallback
  // (because the original admin_user_id was orphaned), re-point the booking at
  // the current URL-username admin. This fixes the data so downstream flows
  // (Chime join, reschedule, cancel) work without manual SQL. We guard with an
  // `.eq("admin_user_id", <old-id>)` filter so a concurrent write can't race
  // us into corrupting a valid row.
  if (booking.admin_user_id !== (hostAdminRow.user_id as string)) {
    const oldAdminUserId = booking.admin_user_id;
    const newAdminUserId = hostAdminRow.user_id as string;
    console.warn(
      `[session-page] auto-healing admin_bookings.admin_user_id ${oldAdminUserId} -> ${newAdminUserId} for booking=${bookingId}`,
    );
    const { error: healError } = await admin
      .from("admin_bookings")
      .update({ admin_user_id: newAdminUserId })
      .eq("id", bookingId)
      .eq("admin_user_id", oldAdminUserId);
    if (healError) {
      console.error("[session-page] auto-heal failed:", healError);
    } else {
      booking.admin_user_id = newAdminUserId;
    }
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
  if (booking.status === "canceled") {
    if (isDev) {
      return (
        <SessionDiagnosticPage
          reason="booking is canceled"
          details={{ bookingId, status: booking.status }}
        />
      );
    }
    notFound();
  }

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
      if (isDev) {
        return (
          <SessionDiagnosticPage
            reason="not authenticated — would redirect to /login"
            details={{
              bookingId,
              bookingClientEmail: booking.client_email,
              hint: "No supabase auth session. In production you would be redirected to /login?reason=session&next=…",
            }}
          />
        );
      }
      redirect(
        `/login?reason=session&next=${encodeURIComponent(
          `/book/${username}/session/${bookingId}`,
        )}`,
      );
    }
    // Logged in, but the email on the auth session doesn't match the booking
    // and the viewer isn't the host admin either.
    if (isDev) {
      return (
        <SessionDiagnosticPage
          reason="logged in but not authorized for this booking"
          details={{
            bookingId,
            authUserId: user.id,
            authEmail,
            bookingAdminUserId: booking.admin_user_id,
            bookingClientEmail: booking.client_email,
            adminUserResolved: !!adminUser,
            adminUserId: adminUser?.id ?? null,
            isOwnerAdmin,
            isClient,
            hint: "Either (a) log in as the booking's host admin, (b) log in as the booking's client email, or (c) add the logged-in admin to admin_users so requireAdmin() resolves.",
          }}
        />
      );
    }
    notFound();
  }

  const role: "diviner" | "client" = isOwnerAdmin ? "diviner" : "client";
  const hostName = adminRow.username ?? "Host";
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
