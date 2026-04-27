import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookingDetailSheet } from "@/components/dashboard/booking-detail-sheet";
import { CalendarDays, Mail, StickyNote } from "lucide-react";

export const metadata = { title: "My Bookings — Admin" };
export const dynamic = "force-dynamic";

interface AdminBookingRow {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  timezone: string | null;
  status: string;
  client_name: string;
  client_email: string;
  client_note: string | null;
  google_calendar_event_id: string | null;
  created_at: string;
}

function formatDateTime(iso: string, tz?: string | null): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: tz ?? undefined,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

export default async function AdminMyBookingsPage() {
  const user = await requireAdmin();
  if (!user) redirect("/login?reason=admin");

  const admin = createAdminClient();

  const { data: adminRow } = await admin
    .from("admin_users")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: rows, error } = await admin
    .from("admin_bookings")
    .select(
      "id, scheduled_at, duration_minutes, timezone, status, client_name, client_email, client_note, google_calendar_event_id, created_at",
    )
    .eq("admin_user_id", user.id)
    .order("scheduled_at", { ascending: true });

  const migrationMissing =
    !!error &&
    (error.message.toLowerCase().includes("does not exist") ||
      error.message.toLowerCase().includes("admin_bookings"));

  const bookings: AdminBookingRow[] = migrationMissing
    ? []
    : (rows as unknown as AdminBookingRow[] | null) ?? [];

  // Server-rendered snapshot time for splitting upcoming vs past rows.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const upcoming = bookings.filter(
    (b) => new Date(b.scheduled_at).getTime() >= now && b.status === "confirmed",
  );
  const past = bookings.filter(
    (b) => new Date(b.scheduled_at).getTime() < now || b.status !== "confirmed",
  );

  const bookingUrl =
    adminRow?.username && process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/book/${adminRow.username}`
      : adminRow?.username
        ? `/book/${adminRow.username}`
        : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-muted-foreground text-sm">
            Every booking made on your public calendar link.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/availability">
            <Button variant="outline" size="sm">
              Manage availability
            </Button>
          </Link>
          {bookingUrl && (
            <Button asChild size="sm">
              <a href={bookingUrl} target="_blank" rel="noreferrer">
                Open public link
              </a>
            </Button>
          )}
        </div>
      </div>

      {migrationMissing && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              The admin bookings table isn&rsquo;t migrated yet. Go to{" "}
              <Link href="/admin/db/migrations" className="underline">
                /admin/db/migrations
              </Link>{" "}
              and apply{" "}
              <code className="font-mono text-xs">
                20260421000020_admin_booking_calendar
              </code>{" "}
              and{" "}
              <code className="font-mono text-xs">
                20260421000021_admin_bookings_gcal_event_id
              </code>
              .
            </p>
          </CardContent>
        </Card>
      )}

      {!migrationMissing && bookings.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="mx-auto size-8 text-muted-foreground/40" />
            <p className="mt-4 text-sm text-muted-foreground">
              No bookings yet. Share your booking link to start receiving them.
            </p>
            {bookingUrl && (
              <p className="mt-2 font-mono text-xs text-muted-foreground/70">
                {bookingUrl}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {!migrationMissing && upcoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming ({upcoming.length})</CardTitle>
            <CardDescription>
              Confirmed sessions on or after now.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.map((b) => (
              <BookingRow
                key={b.id}
                booking={b}
                adminUsername={adminRow?.username ?? null}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {!migrationMissing && past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past ({past.length})</CardTitle>
            <CardDescription>Earlier or cancelled sessions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {past.map((b) => (
              <BookingRow
                key={b.id}
                booking={b}
                faded
                adminUsername={adminRow?.username ?? null}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BookingRow({
  booking,
  faded,
  adminUsername,
}: {
  booking: AdminBookingRow;
  faded?: boolean;
  adminUsername: string | null;
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${faded ? "opacity-70" : ""}`}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">
            {formatDateTime(booking.scheduled_at, booking.timezone)}
          </span>
          <Badge variant="outline" className="text-[10px]">
            {booking.duration_minutes} min
          </Badge>
          {booking.status !== "confirmed" && (
            <Badge variant="secondary" className="text-[10px] capitalize">
              {booking.status}
            </Badge>
          )}
          {booking.google_calendar_event_id && (
            <Badge variant="outline" className="text-[10px]">
              Synced to Google
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{booking.client_name}</span>
          <span className="mx-1.5 text-muted-foreground/40">·</span>
          <a
            href={`mailto:${booking.client_email}`}
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <Mail className="size-3" />
            {booking.client_email}
          </a>
        </div>
        {booking.client_note && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <StickyNote className="mt-0.5 size-3 shrink-0" />
            <span className="line-clamp-3 whitespace-pre-wrap">
              {booking.client_note}
            </span>
          </div>
        )}
      </div>
      <div className="shrink-0">
        <BookingDetailSheet
          booking={{
            id: booking.id,
            scheduled_at: booking.scheduled_at,
            status: booking.status,
            duration: booking.duration_minutes,
            amount: 0,
            notes: booking.client_note,
            client_name: booking.client_name,
            client_email: booking.client_email,
            service_name: "Admin Calendar",
          }}
          detailsOnly
          actionBasePath={`/api/admin/my-bookings/${booking.id}`}
          joinHref={
            adminUsername
              ? `/book/${adminUsername}/session/${booking.id}`
              : null
          }
          viewerRole="admin"
        />
      </div>
    </div>
  );
}
