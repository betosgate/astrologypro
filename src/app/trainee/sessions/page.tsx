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
  XCircle,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Practice Sessions - AstrologyPro" };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Booking = {
  id: string;
  status: string;
  scheduled_at: string;
  duration_minutes: number;
  daily_room_url: string | null;
  diviner: { display_name: string } | null;
  service: { name: string; category: string } | null;
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

  // Look up the client record linked to this user (needed for booking lookup)
  const { data: clientRow } = await admin
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  let upcomingBookings: Booking[] = [];
  let pastBookings: Booking[] = [];
  let totalCompleted = 0;
  let completedThisMonth = 0;

  if (clientRow) {
    const now = new Date().toISOString();
    const firstOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    ).toISOString();

    // Fetch upcoming + past bookings in parallel
    const [upcomingResult, pastResult] = await Promise.all([
      // Upcoming: scheduled in the future (or in progress), not canceled
      admin
        .from("bookings")
        .select(
          "id, status, scheduled_at, duration_minutes, daily_room_url, diviners(display_name), services(name, category)"
        )
        .eq("client_id", clientRow.id)
        .gte("scheduled_at", now)
        .not("status", "in", '("canceled","no_show")')
        .order("scheduled_at", { ascending: true })
        .limit(20),

      // Past: before now (including in_progress edge case) — any status
      admin
        .from("bookings")
        .select(
          "id, status, scheduled_at, duration_minutes, daily_room_url, diviners(display_name), services(name, category)"
        )
        .eq("client_id", clientRow.id)
        .lt("scheduled_at", now)
        .order("scheduled_at", { ascending: false })
        .limit(20),
    ]);

    // Shape the data
    function shapeRow(row: Record<string, unknown>): Booking {
      const divinersRaw = row.diviners;
      const servicesRaw = row.services;
      return {
        id: row.id as string,
        status: row.status as string,
        scheduled_at: row.scheduled_at as string,
        duration_minutes: row.duration_minutes as number,
        daily_room_url: (row.daily_room_url as string | null) ?? null,
        diviner:
          divinersRaw && typeof divinersRaw === "object" && !Array.isArray(divinersRaw)
            ? { display_name: (divinersRaw as { display_name: string }).display_name }
            : null,
        service:
          servicesRaw && typeof servicesRaw === "object" && !Array.isArray(servicesRaw)
            ? {
                name: (servicesRaw as { name: string; category: string }).name,
                category: (servicesRaw as { name: string; category: string }).category,
              }
            : null,
      };
    }

    upcomingBookings = (upcomingResult.data ?? [])
      .map((r) => shapeRow(r as unknown as Record<string, unknown>));

    pastBookings = (pastResult.data ?? [])
      .map((r) => shapeRow(r as unknown as Record<string, unknown>));

    totalCompleted = pastBookings.filter((b) => b.status === "completed").length;

    completedThisMonth = pastBookings.filter(
      (b) => b.status === "completed" && b.scheduled_at >= firstOfMonth
    ).length;
  }

  const hasAnyBookings = upcomingBookings.length > 0 || pastBookings.length > 0;

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

      {/* ── No client record note ── */}
      {!clientRow && (
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
              const { date, time } = formatDateTime(booking.scheduled_at);
              const joinable =
                booking.daily_room_url &&
                isJoinable(booking.scheduled_at, booking.duration_minutes);
              return (
                <Card key={booking.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm font-semibold">
                          {booking.service?.name ?? "Practice Session"}
                        </CardTitle>
                        <CardDescription className="mt-0.5 text-xs">
                          {booking.diviner?.display_name
                            ? `with ${booking.diviner.display_name}`
                            : null}
                          {booking.service?.category && (
                            <span className="ml-2 capitalize">
                              · {booking.service.category}
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
                        {booking.duration_minutes} min
                      </span>
                    </div>
                    {joinable && (
                      <Button size="sm" asChild>
                        <a
                          href={booking.daily_room_url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Join video session"
                        >
                          <Video className="mr-1.5 size-3.5" aria-hidden="true" />
                          Join
                        </a>
                      </Button>
                    )}
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
              const { date, time } = formatDateTime(booking.scheduled_at);
              return (
                <Card key={booking.id}>
                  <CardContent className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {booking.service?.name ?? "Practice Session"}
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
                        {booking.diviner?.display_name && (
                          <span>with {booking.diviner.display_name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge status={booking.status} />
                      <BookingDetailSheet
                        booking={{
                          id: booking.id,
                          scheduled_at: booking.scheduled_at,
                          status: booking.status,
                          duration: booking.duration_minutes,
                          amount: 0,
                          notes: null,
                          client_name: trainee?.name ?? "Trainee",
                          client_email: trainee?.email ?? "",
                          service_name: booking.service?.name ?? "Practice Session",
                        }}
                        viewerRole="client"
                        detailsOnly
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
