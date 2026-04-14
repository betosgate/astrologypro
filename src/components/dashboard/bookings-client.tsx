"use client";

import { useState, useMemo } from "react";
import { formatDateTime } from "@/lib/format";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookingDetailSheet } from "@/components/dashboard/booking-detail-sheet";
import { SessionPrepSheet } from "@/components/dashboard/session-prep";
import {
  CalendarX2,
  Search,
  CalendarCheck,
  Clock,
  Users,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";

// ── Types ────────────────────────────────────────────────────────────────────

interface BookingsClientProps {
  bookings: Record<string, unknown>[];
  clientPrevSessions: Record<
    string,
    { count: number; lastDate: string | null; lastNotes: string | null }
  >;
  divinerUsername: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  pending_payment: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  canceled: "bg-red-500/10 text-red-500 border-red-500/20",
  in_progress: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  no_show: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "pending_payment", label: "Awaiting Payment" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "canceled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

const PAGE_SIZE = 15;

// ── Component ────────────────────────────────────────────────────────────────

export function BookingsClient({
  bookings,
  clientPrevSessions,
  divinerUsername,
}: BookingsClientProps) {
  const [timeView, setTimeView] = useState<"upcoming" | "past">("upcoming");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const now = useMemo(() => new Date(), []);

  // ── Computed KPIs ──────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 7);

    let sessionsThisWeek = 0;
    let hoursThisWeek = 0;
    let upcomingCount = 0;
    let totalClients = new Set<string>();
    let totalRevenue = 0;

    for (const b of bookings) {
      const scheduledAt = new Date(b.scheduled_at as string);
      const status = b.status as string;
      const duration = b.duration_minutes as number;
      const clientId = b.client_id as string;

      if (
        scheduledAt >= thisWeekStart &&
        scheduledAt < thisWeekEnd &&
        ["pending", "confirmed", "in_progress", "completed"].includes(status)
      ) {
        sessionsThisWeek++;
        hoursThisWeek += duration / 60;
      }

      if (
        scheduledAt > now &&
        ["pending", "confirmed", "pending_payment"].includes(status)
      ) {
        upcomingCount++;
      }

      if (clientId) totalClients.add(clientId);

      if (["confirmed", "completed"].includes(status) && (b.base_price as number) > 0) {
        totalRevenue += b.base_price as number;
      }
    }

    return {
      sessionsThisWeek,
      hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
      upcomingCount,
      totalClients: totalClients.size,
      totalRevenue,
    };
  }, [bookings, now]);

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let result = bookings;

    // Time filter
    result = result.filter((b) => {
      const scheduledAt = new Date(b.scheduled_at as string);
      return timeView === "upcoming" ? scheduledAt >= now : scheduledAt < now;
    });

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((b) => b.status === statusFilter);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((b) => {
        const client = b.clients as { full_name?: string; email?: string } | null;
        const service = b.services as { name?: string } | null;
        const meta = b.metadata as { availability_title?: string } | null;
        const qr = b.questionnaire_responses as Record<string, unknown> | null;

        const fields = [
          client?.full_name,
          client?.email,
          service?.name,
          meta?.availability_title,
          b.status as string,
          // Search attendees
          ...(Array.isArray(qr?.attendees)
            ? (qr!.attendees as Array<{ name?: string; email?: string }>).flatMap(
                (a) => [a.name, a.email]
              )
            : []),
          qr?.secondPersonName as string | undefined,
          qr?.secondPersonEmail as string | undefined,
          // Search by date
          new Date(b.scheduled_at as string).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          new Date(b.scheduled_at as string).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
        ];

        return fields.some((f) => f && f.toLowerCase().includes(q));
      });
    }

    // Sort: upcoming ascending, past descending
    result = [...result].sort((a, b) => {
      const aTime = new Date(a.scheduled_at as string).getTime();
      const bTime = new Date(b.scheduled_at as string).getTime();
      return timeView === "upcoming" ? aTime - bTime : bTime - aTime;
    });

    return result;
  }, [bookings, timeView, statusFilter, search, now]);

  // ── Pagination ─────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  function updateFilter(fn: () => void) {
    fn();
    setPage(1);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground">
          Manage your client sessions and appointments.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
              <CalendarCheck className="size-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{kpis.sessionsThisWeek}</p>
              <p className="text-xs text-muted-foreground">Sessions this week</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Clock className="size-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{kpis.hoursThisWeek}</p>
              <p className="text-xs text-muted-foreground">Hours booked</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10">
              <TrendingUp className="size-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{kpis.upcomingCount}</p>
              <p className="text-xs text-muted-foreground">Upcoming sessions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Users className="size-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{kpis.totalClients}</p>
              <p className="text-xs text-muted-foreground">Total clients</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <DollarSign className="size-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(kpis.totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Total revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar: Time toggle + Status filter + Search */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Upcoming / Past toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              timeView === "upcoming"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
            onClick={() => updateFilter(() => setTimeView("upcoming"))}
          >
            Upcoming
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              timeView === "past"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
            onClick={() => updateFilter(() => setTimeView("past"))}
          >
            Past
          </button>
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                statusFilter === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-muted/50"
              }`}
              onClick={() => updateFilter(() => setStatusFilter(opt.value))}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative ml-auto min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search client, service, date..."
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {timeView === "upcoming" ? "Upcoming" : "Past"} Bookings
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {paged.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                <CalendarX2 className="size-7 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">
                  {search
                    ? "No matching bookings"
                    : timeView === "upcoming"
                    ? "No upcoming bookings"
                    : "No past bookings"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {search
                    ? "Try different search terms or adjust filters."
                    : timeView === "upcoming"
                    ? "When clients book sessions with you, they will appear here."
                    : "Completed and cancelled sessions appear here."}
                </p>
              </div>
              {!search && timeView === "upcoming" && (
                <Button asChild variant="outline">
                  <Link href="/dashboard/services">Manage Services</Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((booking) => {
                  const client = booking.clients as {
                    full_name?: string;
                    email?: string;
                    birth_date?: string;
                    birth_time?: string;
                    birth_city?: string;
                  } | null;
                  const service = booking.services as { name?: string } | null;
                  const meta = booking.metadata as {
                    is_reminder?: boolean;
                    availability_title?: string;
                  } | null;
                  const prev = booking.client_id
                    ? clientPrevSessions[booking.client_id as string]
                    : null;
                  const status = booking.status as string;

                  const basePrice = (booking.base_price as number) ?? 0;
                  const paymentIntentId = booking.stripe_payment_intent_id as string | null;
                  const refundedAt = booking.refunded_at as string | null;
                  const paymentBadge = (() => {
                    if (refundedAt) return { label: "Refunded", cls: "bg-red-500/10 text-red-500 border-red-500/20" };
                    if (basePrice === 0) return { label: "Free", cls: "bg-muted text-muted-foreground border-border" };
                    if (["confirmed", "completed", "in_progress"].includes(status)) return { label: "Paid", cls: "bg-green-500/10 text-green-500 border-green-500/20" };
                    return { label: "Unpaid", cls: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" };
                  })();

                  return (
                    <TableRow key={booking.id as string}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {new Date(
                              booking.scheduled_at as string
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(
                              booking.scheduled_at as string
                            ).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {meta?.is_reminder
                              ? "Personal Reminder (Self)"
                              : client?.full_name ?? "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {client?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {meta?.availability_title ?? service?.name ?? "--"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {booking.duration_minutes as number} min
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {basePrice > 0 ? formatCurrency(basePrice) : "Free"}
                          </p>
                          <Badge className={paymentBadge.cls} variant="outline">
                            {paymentBadge.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={STATUS_COLORS[status] ?? ""}
                          variant="outline"
                        >
                          {status === "pending_payment"
                            ? "Awaiting Payment"
                            : status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <BookingDetailSheet
                            booking={{
                              id: booking.id as string,
                              scheduled_at: booking.scheduled_at as string,
                              status,
                              duration: booking.duration_minutes as number,
                              amount: basePrice,
                              payment_intent_id: paymentIntentId,
                              notes: booking.session_notes as string | null,
                              session_notes:
                                (booking.session_notes as string) ?? null,
                              booking_notes: (booking.booking_notes as string) ?? null,
                              client_name: client?.full_name ?? "Unknown",
                              client_email: client?.email ?? "",
                              service_name: service?.name ?? "Unknown",
                              refund_amount:
                                (booking.refund_amount as number) ?? null,
                              refunded_at: refundedAt,
                              refund_reason:
                                (booking.refund_reason as string) ?? null,
                            }}
                          />
                          <SessionPrepSheet
                            booking={{
                              id: booking.id as string,
                              scheduled_at: booking.scheduled_at as string,
                              status,
                              service_name: service?.name ?? "Unknown",
                              client_name: client?.full_name ?? "Unknown",
                              client_email: client?.email ?? "",
                              client_id: (booking.client_id as string) ?? null,
                              birth_date: client?.birth_date ?? null,
                              birth_time: client?.birth_time ?? null,
                              birth_city: client?.birth_city ?? null,
                              questionnaire_responses:
                                (booking.questionnaire_responses as Record<
                                  string,
                                  string | undefined
                                >) ?? null,
                              previous_session_count: prev?.count ?? 0,
                              last_session_date: prev?.lastDate ?? null,
                              session_notes: prev?.lastNotes ?? null,
                              username: divinerUsername || "admin",
                              metadata: (booking.metadata as Record<string, unknown>) ?? null,
                              stripe_payment_intent_id: (booking.stripe_payment_intent_id as string) ?? null,
                              base_price: (booking.base_price as number) ?? null,
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card/50 px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">{filtered.length}</span>{" "}
            bookings
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            {Array.from({ length: Math.max(totalPages, 1) }, (_, i) => {
              const maxVisible = 7;
              let pageNum: number;
              if (totalPages <= maxVisible) {
                pageNum = i + 1;
              } else if (page <= 4) {
                pageNum = i + 1;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - maxVisible + 1 + i;
              } else {
                pageNum = page - 3 + i;
              }
              if (pageNum < 1 || pageNum > Math.max(totalPages, 1)) return null;
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="icon"
                  className="size-8 text-xs"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
