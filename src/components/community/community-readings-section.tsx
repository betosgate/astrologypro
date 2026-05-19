"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarClock,
  Clock,
  ExternalLink,
  Loader2,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingDetailSheet } from "@/components/dashboard/booking-detail-sheet";
import { PerennialReadingButton } from "@/components/community/perennial-reading-cta";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

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

function getBookingAmount(booking: CommunityBooking) {
  return Number(booking.total_amount || booking.base_price || 0);
}

function getBookingDetailPayload(booking: CommunityBooking) {
  const amount = getBookingAmount(booking);
  return {
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
  };
}

function DetailSheetButton({ booking }: { booking: CommunityBooking }) {
  return (
    <BookingDetailSheet
      detailsOnly
      viewerRole="client"
      joinHref={booking.join_href}
      rescheduleHref={booking.reschedule_href}
      booking={getBookingDetailPayload(booking)}
    />
  );
}

function ReadingRow({ booking }: { booking: CommunityBooking }) {
  const canJoin = !!booking.join_href && JOINABLE_STATUSES.has(booking.status);
  const amount = getBookingAmount(booking);

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
        <DetailSheetButton booking={booking} />
      </div>
    </div>
  );
}

function useCommunityBookings() {
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

  return { bookings, loading, error, reload: loadBookings };
}

function splitBookings(bookings: CommunityBooking[]) {
  const now = Date.now();
  return {
    upcoming: bookings
      .filter((booking) => new Date(booking.scheduled_at).getTime() >= now)
      .sort(sortUpcoming),
    past: bookings
      .filter((booking) => new Date(booking.scheduled_at).getTime() < now)
      .sort(sortPast),
  };
}

export function CommunityReadingsSection() {
  const { bookings, loading, error } = useCommunityBookings();
  const { upcoming, past } = splitBookings(bookings);

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

export function CommunityReadingsDashboardPreview() {
  const { bookings, loading, error } = useCommunityBookings();
  const { upcoming, past } = splitBookings(bookings);
  const preview = upcoming[0] ?? past[0] ?? null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarClock className="size-4 text-primary" />
              <CardTitle className="text-base">My Readings</CardTitle>
            </div>
            <CardDescription>
              {loading
                ? "Loading readings..."
                : `${upcoming.length} upcoming · ${past.length} past`}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild size="sm" variant="outline">
              <Link href="/community/sessions">View All</Link>
            </Button>
            <PerennialReadingButton size="sm" className="gap-1.5">
              <BookOpen className="size-3.5" />
              Book a Reading
            </PerennialReadingButton>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading readings...
          </div>
        ) : error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : preview ? (
          <ReadingRow booking={preview} />
        ) : (
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">No readings booked yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Book with your 5% Community member discount and your session
                details will appear here.
              </p>
            </div>
            <PerennialReadingButton size="sm" className="shrink-0">
              Book a Reading - 5% Discount
            </PerennialReadingButton>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CommunityReadingsExplorer() {
  const { bookings, loading, error } = useCommunityBookings();
  const { upcoming, past } = splitBookings(bookings);
  const allBookings = useMemo(() => [...upcoming, ...past], [upcoming, past]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedId && allBookings.some((booking) => booking.id === selectedId)) {
      return;
    }
    setSelectedId(allBookings[0]?.id ?? null);
  }, [allBookings, selectedId]);

  const selected = allBookings.find((booking) => booking.id === selectedId) ?? null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border bg-card/60 p-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading readings...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (allBookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="size-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">No readings booked yet</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Book a reading with your Community discount. Your session link,
              details, recordings, and history will appear here.
            </p>
          </div>
          <PerennialReadingButton>Book a Reading - 5% Discount</PerennialReadingButton>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-4">
        {upcoming.length > 0 && (
          <ReadingListGroup
            title="Upcoming"
            bookings={upcoming}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        )}
        {past.length > 0 && (
          <ReadingListGroup
            title="History"
            bookings={past}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        )}
      </div>
      <div className="lg:col-span-8">
        {selected ? (
          <ReadingDetailPanel booking={selected} />
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/5 text-center">
            <Video className="size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              Select a reading to view details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ReadingListGroup({
  title,
  bookings,
  selectedId,
  onSelect,
}: {
  title: string;
  bookings: CommunityBooking[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {bookings.map((booking) => (
        <ReadingListCard
          key={booking.id}
          booking={booking}
          selected={selectedId === booking.id}
          onClick={() => onSelect(booking.id)}
        />
      ))}
    </div>
  );
}

function ReadingListCard({
  booking,
  selected,
  onClick,
}: {
  booking: CommunityBooking;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-colors hover:border-primary/50",
        selected ? "border-primary bg-primary/[0.03] ring-1 ring-primary/20" : "bg-card/50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-bold">
            {booking.title || "Reading"}
          </p>
          <Badge
            variant={STATUS_VARIANT[booking.status] ?? "outline"}
            className="shrink-0 text-[10px]"
          >
            {booking.status}
          </Badge>
        </div>
        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          <p>{formatDateTime(booking.scheduled_at)}</p>
          <p>{booking.duration_minutes} min · {booking.diviner_name}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ReadingDetailPanel({ booking }: { booking: CommunityBooking }) {
  const canJoin = !!booking.join_href && JOINABLE_STATUSES.has(booking.status);
  const amount = getBookingAmount(booking);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-xl">{booking.title || "Reading"}</CardTitle>
              <Badge variant={STATUS_VARIANT[booking.status] ?? "outline"}>
                {booking.status}
              </Badge>
            </div>
            <CardDescription className="mt-2 flex items-center gap-2">
              <Video className="size-3.5" />
              With {booking.diviner_name}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {canJoin && (
              <Button asChild>
                <a href={booking.join_href ?? "#"}>
                  <ExternalLink className="mr-2 size-4" />
                  Join Session
                </a>
              </Button>
            )}
            <DetailSheetButton booking={booking} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <DetailItem label="Date & Time" value={formatDateTime(booking.scheduled_at)} />
          <DetailItem label="Duration" value={`${booking.duration_minutes} Minutes`} />
          <DetailItem label="Amount" value={amount > 0 ? formatCurrency(amount) : "Free"} />
          <DetailItem label="ID" value={`#${booking.id.slice(0, 8)}`} mono />
        </div>
        {booking.booking_notes && (
          <div className="rounded-lg border bg-muted/10 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Notes
            </p>
            <p className="mt-2 text-sm">{booking.booking_notes}</p>
          </div>
        )}
        <div className="rounded-lg border bg-muted/10 p-4 text-sm text-muted-foreground">
          Open Details to view session metadata, recording status, transcript,
          and playback information when available.
        </div>
      </CardContent>
    </Card>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={cn("text-sm font-medium", mono && "font-mono text-muted-foreground")}>
        {value}
      </p>
    </div>
  );
}
