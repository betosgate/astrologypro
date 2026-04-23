import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookingDetailSheet } from "@/components/dashboard/booking-detail-sheet";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  Video,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Practice Sessions - AstrologyPro" };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type BookingSource = "bookings" | "admin_bookings";

/**
 * Unified shape for both legacy diviner bookings (`bookings` table) and the
 * newer admin↔trainee sessions (`admin_bookings` table). Fields are filled
 * from whichever source produced the row.
 */
type UnifiedBooking = {
  id: string;
  source: BookingSource;
  status: string;
  scheduledAt: string;
  durationMinutes: number;
  /** Display name of the host (diviner or admin). */
  hostDisplayName: string | null;
  /** Host's URL username — used to build the join URL. */
  hostUsername: string | null;
  /** Service name for display. Admin bookings don't have a service row — we
   *  use a friendly label instead. */
  serviceName: string | null;
  serviceCategory: string | null;
  /**
   * Pre-built Join URL:
   *   bookings (legacy)      → `/{username}/session/{id}`
   *   admin_bookings         → `/book/{username}/session/{id}`
   * Null when we can't resolve a username (rare data-integrity edge).
   */
  joinHref: string | null;
  /**
   * Action base path used by BookingDetailSheet for admin_bookings so the
   * trainee can reschedule/cancel without leaving the drawer. Pre-existing
   * endpoint from the prior session: /api/trainee/appointments/admin-bookings/{id}
   */
  actionBasePath: string | null;
  clientName: string;
  clientEmail: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }),
  };
}

function isJoinable(scheduledAt: string, durationMinutes: number): boolean {
  const now = Date.now();
  const start = new Date(scheduledAt).getTime();
  const end = start + durationMinutes * 60_000;
  const thirtyMinBefore = start - 30 * 60_000;
  return now >= thirtyMinBefore && now <= end;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    confirmed: { label: "Confirmed", variant: "default" },
    pending: { label: "Pending", variant: "outline" },
    in_progress: { label: "In Progress", variant: "default" },
    completed: { label: "Completed", variant: "secondary" },
    canceled: { label: "Canceled", variant: "destructive" },
    cancelled: { label: "Canceled", variant: "destructive" },
    no_show: { label: "No Show", variant: "destructive" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "outline" };
  return <Badge variant={variant}>{label}</Badge>;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function TraineeSessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainee } = await supabase
    .from("trainees")
    .select("id, name, email, training_status, mentor_diviner_id")
    .eq("user_id", user.id)
    .single();

  if (!trainee) redirect("/join/trainee");

  const admin = createAdminClient();

  // Look up the client record linked to this user (needed for legacy booking
  // lookup). Trainees created before the admin↔trainee flow may not have a
  // clients row; in that case `upcomingBookings`/`pastBookings` from the
  // legacy table will just be empty and only admin_bookings will appear.
  const { data: clientRow } = await admin
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const clientId = (clientRow?.id as string | null) ?? null;
  const authEmail = user.email?.trim().toLowerCase() ?? "";

  const now = new Date().toISOString();
  const firstOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  ).toISOString();

  // ── Parallel fetch: legacy diviner bookings + admin_bookings ──────────────
  // Legacy table matches by client_id. admin_bookings matches by the
  // authenticated user's email (case-insensitive), consistent with the rest
  // of the trainee surfaces (/api/trainee/appointments was updated to the
  // same pattern in the prior Chime session work).
  const [
    legacyUpcomingResult,
    legacyPastResult,
    adminUpcomingResult,
    adminPastResult,
  ] = await Promise.all([
    clientId
      ? admin
          .from("bookings")
          .select(
            "id, status, scheduled_at, duration_minutes, diviner_id, " +
              "diviners:diviner_id(id, username, display_name), " +
              "services(name, category)",
          )
          .eq("client_id", clientId)
          .gte("scheduled_at", now)
          .not("status", "in", '("canceled","no_show")')
          .order("scheduled_at", { ascending: true })
          .limit(20)
      : Promise.resolve({ data: [] as unknown[] }),
    clientId
      ? admin
          .from("bookings")
          .select(
            "id, status, scheduled_at, duration_minutes, diviner_id, " +
              "diviners:diviner_id(id, username, display_name), " +
              "services(name, category)",
          )
          .eq("client_id", clientId)
          .lt("scheduled_at", now)
          .order("scheduled_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] as unknown[] }),
    authEmail
      ? admin
          .from("admin_bookings")
          .select(
            "id, status, scheduled_at, duration_minutes, client_name, client_email, admin_user_id",
          )
          .ilike("client_email", authEmail)
          .gte("scheduled_at", now)
          .neq("status", "canceled")
          .order("scheduled_at", { ascending: true })
          .limit(20)
      : Promise.resolve({ data: [] as unknown[] }),
    authEmail
      ? admin
          .from("admin_bookings")
          .select(
            "id, status, scheduled_at, duration_minutes, client_name, client_email, admin_user_id",
          )
          .ilike("client_email", authEmail)
          .lt("scheduled_at", now)
          .order("scheduled_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  // Resolve admin usernames so the Join URL can be built for admin_bookings.
  const adminUserIds = new Set<string>();
  for (const row of [
    ...((adminUpcomingResult.data as Array<Record<string, unknown>>) ?? []),
    ...((adminPastResult.data as Array<Record<string, unknown>>) ?? []),
  ]) {
    const id = row.admin_user_id;
    if (typeof id === "string") adminUserIds.add(id);
  }

  const adminUserMap = new Map<
    string,
    { username: string | null; display: string | null }
  >();
  if (adminUserIds.size > 0) {
    const { data: adminUsers } = await admin
      .from("admin_users")
      .select("user_id, username, email")
      .in("user_id", [...adminUserIds]);
    for (const row of adminUsers ?? []) {
      adminUserMap.set(row.user_id as string, {
        username: (row.username as string | null) ?? null,
        // admin_users has no display_name column in this schema; fall back to
        // username / email for a friendly label.
        display:
          ((row.username as string | null) ||
            (row.email as string | null)) ?? null,
      });
    }
  }

  // ── Shape helpers ─────────────────────────────────────────────────────────
  function shapeLegacy(row: Record<string, unknown>): UnifiedBooking {
    const divinersRaw = row.diviners;
    const servicesRaw = row.services;
    const diviner =
      divinersRaw &&
      typeof divinersRaw === "object" &&
      !Array.isArray(divinersRaw)
        ? (divinersRaw as {
            id: string;
            username: string | null;
            display_name: string | null;
          })
        : null;
    const service =
      servicesRaw &&
      typeof servicesRaw === "object" &&
      !Array.isArray(servicesRaw)
        ? (servicesRaw as { name: string; category: string })
        : null;

    const username = diviner?.username ?? null;
    const id = row.id as string;
    return {
      id,
      source: "bookings",
      status: row.status as string,
      scheduledAt: row.scheduled_at as string,
      durationMinutes: Number(row.duration_minutes ?? 0),
      hostDisplayName: diviner?.display_name ?? null,
      hostUsername: username,
      serviceName: service?.name ?? "Practice Session",
      serviceCategory: service?.category ?? null,
      joinHref: username
        ? `/${encodeURIComponent(username)}/session/${encodeURIComponent(id)}`
        : null,
      actionBasePath: null,
      clientName: trainee.name ?? "Trainee",
      clientEmail: trainee.email ?? authEmail,
    };
  }

  function shapeAdminBooking(row: Record<string, unknown>): UnifiedBooking {
    const id = row.id as string;
    const adminUserId = (row.admin_user_id as string | null) ?? null;
    const lookup = adminUserId ? adminUserMap.get(adminUserId) : null;
    return {
      id,
      source: "admin_bookings",
      status: row.status as string,
      scheduledAt: row.scheduled_at as string,
      durationMinutes: Number(row.duration_minutes ?? 0),
      hostDisplayName: lookup?.display ?? null,
      hostUsername: lookup?.username ?? null,
      serviceName: "Practice Session",
      serviceCategory: null,
      joinHref: lookup?.username
        ? `/book/${encodeURIComponent(lookup.username)}/session/${encodeURIComponent(id)}`
        : null,
      actionBasePath: `/api/trainee/appointments/admin-bookings/${id}`,
      clientName:
        ((row.client_name as string | null) ?? trainee.name) ?? "Trainee",
      clientEmail:
        ((row.client_email as string | null) ?? trainee.email) ?? authEmail,
    };
  }

  const upcomingBookings: UnifiedBooking[] = [
    ...((legacyUpcomingResult.data as Array<Record<string, unknown>>) ?? [])
      .map(shapeLegacy),
    ...((adminUpcomingResult.data as Array<Record<string, unknown>>) ?? [])
      .map(shapeAdminBooking),
  ].sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  const pastBookings: UnifiedBooking[] = [
    ...((legacyPastResult.data as Array<Record<string, unknown>>) ?? [])
      .map(shapeLegacy),
    ...((adminPastResult.data as Array<Record<string, unknown>>) ?? [])
      .map(shapeAdminBooking),
  ].sort(
    (a, b) =>
      new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
  );

  const totalCompleted = pastBookings.filter(
    (b) => b.status === "completed",
  ).length;

  const completedThisMonth = pastBookings.filter(
    (b) => b.status === "completed" && b.scheduledAt >= firstOfMonth,
  ).length;

  const hasAnyBookings =
    upcomingBookings.length > 0 || pastBookings.length > 0;
  const hasAnyClientRecord = !!clientId || upcomingBookings.length > 0 || pastBookings.length > 0;

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Practice Sessions</h1>
        <p className="text-muted-foreground">
          Your supervised practice readings and session history.
        </p>
      </div>

      {/* ── Stats ── */}
      {hasAnyBookings && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="size-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{totalCompleted}</p>
                <p className="text-xs text-muted-foreground">Total completed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                <Calendar className="size-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{completedThisMonth}</p>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── No client record note — only show when we genuinely have nothing ── */}
      {!hasAnyClientRecord && (
        <Card>
          <CardContent className="flex items-start gap-3 py-4">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Practice sessions are scheduled through your mentor&apos;s booking system.
              Once your mentor books a session with you, it will appear here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Upcoming Sessions ── */}
      <section aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading" className="mb-4 text-lg font-semibold">
          Upcoming Sessions
        </h2>
        {upcomingBookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Calendar className="size-6 text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-sm">No upcoming sessions</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your mentor will schedule supervised practice sessions here. Check back soon.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((booking) => {
              const { date, time } = formatDateTime(booking.scheduledAt);
              const joinable =
                !!booking.joinHref &&
                isJoinable(booking.scheduledAt, booking.durationMinutes);
              return (
                <Card key={`${booking.source}:${booking.id}`} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm font-semibold">
                          {booking.serviceName ?? "Practice Session"}
                        </CardTitle>
                        <CardDescription className="mt-0.5 text-xs">
                          {booking.hostDisplayName
                            ? `with ${booking.hostDisplayName}`
                            : null}
                          {booking.serviceCategory && (
                            <span className="ml-2 capitalize">
                              · {booking.serviceCategory}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-4 pt-0">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3.5" aria-hidden="true" />
                        {date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" aria-hidden="true" />
                        {time}
                      </span>
                      <span className="hidden sm:flex items-center gap-1">
                        {booking.durationMinutes} min
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <BookingDetailSheet
                        booking={{
                          id: booking.id,
                          scheduled_at: booking.scheduledAt,
                          status: booking.status,
                          duration: booking.durationMinutes,
                          amount: 0,
                          notes: null,
                          client_name: booking.clientName,
                          client_email: booking.clientEmail,
                          service_name: booking.serviceName ?? "Practice Session",
                          username: booking.hostUsername ?? undefined,
                        }}
                        viewerRole="client"
                        detailsOnly
                        actionBasePath={booking.actionBasePath}
                        joinHref={booking.joinHref ?? null}
                      />
                      {joinable && booking.joinHref && (
                        <Button size="sm" asChild>
                          <a
                            href={booking.joinHref}
                            aria-label="Join video session"
                          >
                            <Video className="mr-1.5 size-3.5" aria-hidden="true" />
                            Join
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Separator />

      {/* ── Past Sessions ── */}
      <section aria-labelledby="past-heading">
        <h2 id="past-heading" className="mb-4 text-lg font-semibold">
          Past Sessions
        </h2>
        {pastBookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Clock className="size-6 text-muted-foreground" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-sm">No session history yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Completed practice sessions will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pastBookings.map((booking) => {
              const { date, time } = formatDateTime(booking.scheduledAt);
              return (
                <Card key={`${booking.source}:${booking.id}`}>
                  <CardContent className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {booking.serviceName ?? "Practice Session"}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" aria-hidden="true" />
                          {date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" aria-hidden="true" />
                          {time}
                        </span>
                        {booking.hostDisplayName && (
                          <span>with {booking.hostDisplayName}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge status={booking.status} />
                      <BookingDetailSheet
                        booking={{
                          id: booking.id,
                          scheduled_at: booking.scheduledAt,
                          status: booking.status,
                          duration: booking.durationMinutes,
                          amount: 0,
                          notes: null,
                          client_name: booking.clientName,
                          client_email: booking.clientEmail,
                          service_name: booking.serviceName ?? "Practice Session",
                          username: booking.hostUsername ?? undefined,
                        }}
                        viewerRole="client"
                        detailsOnly
                        actionBasePath={booking.actionBasePath}
                        joinHref={booking.joinHref ?? null}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ── How to Schedule ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">How to Schedule a Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Practice sessions are arranged through your assigned mentor. To request a session:
          </p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Reach out to your mentor directly via the platform or your agreed communication channel.</li>
            <li>Your mentor will create a booking for a supervised practice reading.</li>
            <li>Once confirmed, it will appear in the <strong>Upcoming Sessions</strong> list above.</li>
            <li>Join via the <strong>Join</strong> button up to 30 minutes before the session start time.</li>
          </ol>
          {trainee.training_status === "active" && (
            <div className="mt-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/trainee/profile">
                  <ExternalLink className="mr-1.5 size-3.5" aria-hidden="true" />
                  View mentor on your profile
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
