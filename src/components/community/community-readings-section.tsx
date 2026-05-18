"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, CalendarClock, Clock, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingDetailSheet } from "@/components/dashboard/booking-detail-sheet";
import { PerennialReadingButton } from "@/components/community/perennial-reading-cta";
import { formatCurrency, formatDateTime } from "@/lib/format";

interface CommunityBooking {
  id: string;
  source: "bookings";
  title: string;
  diviner_name: string;
  diviner_username: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  join_href: string | null;
  reschedule_href: string | null;
  service_id: string | null;
  service_name: string | null;
  client_id: string | null;
  client_name: string | null;
  client_email: string | null;
  base_price: number;
  total_amount: number;
  booking_notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  confirmed: "default",
  in_progress: "secondary",
  completed: "default",
  canceled: "destructive",
  cancelled: "destructive",
  no_show: "destructive",
};

const JOINABLE_STATUSES = new Set(["pending", "confirmed", "in_progress"]);

function sortUpcoming(a: CommunityBooking, b: CommunityBooking) {
  return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
}

function sortPast(a: CommunityBooking, b: CommunityBooking) {
  return new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime();
}

function ReadingRow({ booking }: { booking: CommunityBooking }) {
  const canJoin = !!booking.join_href && JOINABLE_STATUSES.has(booking.status);
  const amount = Number(booking.total_amount || booking.base_price || 0);

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3 sm:flex-row sm:items-center">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <Clock className="size-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold">
            {booking.title || "Reading"}
          </p>
          <Badge
            variant={STATUS_VARIANT[booking.status] ?? "outline"}
            className="text-[10px]"
          >
            {booking.status}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDateTime(booking.scheduled_at)} · {booking.duration_minutes} min
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          With <span className="font-medium text-foreground">{booking.diviner_name}</span>
          {amount > 0 ? ` · ${formatCurrency(amount)}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
        {canJoin && (
          <Button asChild size="sm" className="gap-1.5">
            <a href={booking.join_href ?? "#"}>
              <ExternalLink className="size-3.5" />
              Join
            </a>
          </Button>
        )}
        <BookingDetailSheet
          detailsOnly
          viewerRole="client"
          joinHref={booking.join_href}
          rescheduleHref={booking.reschedule_href}
          booking={{
            id: booking.id,
            scheduled_at: booking.scheduled_at,
            status: booking.status,
            duration: booking.duration_minutes,
            amount,
            base_price: booking.base_price,
            notes: booking.booking_notes,
            booking_notes: booking.booking_notes,
            client_name: booking.client_name ?? "You",
            client_email: booking.client_email ?? "",
            client_id: booking.client_id,
            service_name: booking.service_name ?? booking.title ?? "Reading",
            metadata: booking.metadata,
            username: booking.diviner_username ?? undefined,
          }}
        />
      </div>
    </div>
  );
}

export function CommunityReadingsSection() {
  const [bookings, setBookings] = useState<CommunityBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/community/bookings", {
        cache: "no-store",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Could not load readings");
      }
      setBookings((json.data ?? []) as CommunityBooking[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load readings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBookings();

    function reloadOnReturn() {
      void loadBookings();
    }

    function reloadOnVisible() {
      if (document.visibilityState === "visible") {
        void loadBookings();
      }
    }

    window.addEventListener("pageshow", reloadOnReturn);
    window.addEventListener("focus", reloadOnReturn);
    document.addEventListener("visibilitychange", reloadOnVisible);

    return () => {
      window.removeEventListener("pageshow", reloadOnReturn);
      window.removeEventListener("focus", reloadOnReturn);
      document.removeEventListener("visibilitychange", reloadOnVisible);
    };
  }, [loadBookings]);

  const now = Date.now();
  const upcoming = bookings
    .filter((booking) => new Date(booking.scheduled_at).getTime() >= now)
    .sort(sortUpcoming);
  const past = bookings
    .filter((booking) => new Date(booking.scheduled_at).getTime() < now)
    .sort(sortPast);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">My Readings</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Your booked AstrologyPro readings and session details. Community
            members receive a 5% discount when booking a reading.
          </p>
        </div>
        <PerennialReadingButton size="sm" className="w-full gap-1.5 sm:w-auto">
          <BookOpen className="size-3.5" />
          Book a Reading - 5% Discount
        </PerennialReadingButton>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Upcoming Readings</CardTitle>
          <CardDescription>
            {loading
              ? "Loading readings..."
              : `${upcoming.length} upcoming · ${past.length} past`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading readings...
            </div>
          ) : error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <BookOpen className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">No readings booked yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Book with your 5% Community member discount to see your
                  session link and details here.
                </p>
              </div>
              <PerennialReadingButton size="sm">Book a Reading - 5% Discount</PerennialReadingButton>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.length > 0 ? (
                upcoming.map((booking) => (
                  <ReadingRow key={booking.id} booking={booking} />
                ))
              ) : (
                <p className="rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground">
                  No upcoming readings.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && !error && past.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Past Readings</CardTitle>
            <CardDescription>Completed and earlier reading bookings.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {past.map((booking) => (
                <ReadingRow key={booking.id} booking={booking} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
