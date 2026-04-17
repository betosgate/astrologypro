"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Calendar as CalendarIcon,
  Trash2,
  Loader2,
  CalendarClock,
  Save,
  AlertTriangle,
  CreditCard,
  User,
  Mail,
  Phone,
  Star,
  FileText,
  Users2,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { ManualBookingModal } from "./manual-booking-modal";

// ── Types ────────────────────────────────────────────────────────────────────

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface AvailabilityOverride {
  id: string;
  date: string;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
}

interface Booking {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  session_notes: string | null;
  client_session_notes?: string | null;
  booking_notes?: string | null;
  base_price?: number | null;
  stripe_payment_intent_id?: string | null;
  questionnaire_responses?: Record<string, unknown> | null;
  refund_amount?: number | null;
  refunded_at?: string | null;
  refund_reason?: string | null;
  metadata?: {
    is_reminder?: boolean;
    is_manual?: boolean;
    timezone?: string;
    availability_title?: string;
  } | null;
  services: { name: string } | null;
  clients: {
    full_name: string | null;
    email?: string | null;
    phone?: string | null;
    birth_date?: string | null;
    birth_time?: string | null;
    birth_city?: string | null;
  } | null;
}

interface CalendarViewProps {
  divinerId: string;
  divinerUsername: string;
  availabilitySlots: AvailabilitySlot[];
  overrides: AvailabilityOverride[];
  bookings: Booking[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type ViewMode = "day" | "week" | "month";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOUR_HEIGHT = 48;

function getWeekDates(baseDate: Date): Date[] {
  const start = new Date(baseDate);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function getMonthDates(baseDate: Date): Date[] {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // pad start to Sunday
  const startPad = firstDay.getDay();
  const dates: Date[] = [];
  for (let i = -startPad; i <= lastDay.getDate() - 1 + (6 - lastDay.getDay()); i++) {
    dates.push(new Date(year, month, 1 + i));
  }
  return dates;
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

function buildDayColumn(
  date: Date,
  availabilitySlots: AvailabilitySlot[],
  overrides: AvailabilityOverride[],
  bookings: Booking[]
) {
  const dateStr = formatDateStr(date);
  const dayOfWeek = date.getDay();
  const dayOverrides = overrides.filter((o) => o.date === dateStr);
  const isBlockedOff = dayOverrides.some((o) => !o.is_available);

  const availBlocks: { top: number; height: number; label: string }[] = [];
  if (!isBlockedOff) {
    const specialOverride = dayOverrides.find(
      (o) => o.is_available && o.start_time && o.end_time
    );
    if (specialOverride && specialOverride.start_time && specialOverride.end_time) {
      const startMin = timeToMinutes(specialOverride.start_time);
      const endMin = timeToMinutes(specialOverride.end_time);
      availBlocks.push({
        top: (startMin / 60) * HOUR_HEIGHT,
        height: ((endMin - startMin) / 60) * HOUR_HEIGHT,
        label: `${specialOverride.start_time} - ${specialOverride.end_time}`,
      });
    } else {
      for (const slot of availabilitySlots.filter(
        (s) => s.day_of_week === dayOfWeek && s.is_active
      )) {
        const startMin = timeToMinutes(slot.start_time);
        const endMin = timeToMinutes(slot.end_time);
        availBlocks.push({
          top: (startMin / 60) * HOUR_HEIGHT,
          height: ((endMin - startMin) / 60) * HOUR_HEIGHT,
          label: `${slot.start_time} - ${slot.end_time}`,
        });
      }
    }
  }

  const overrideBlocks: { top: number; height: number }[] = [];
  if (isBlockedOff) overrideBlocks.push({ top: 0, height: 24 * HOUR_HEIGHT });

  const bookingBlocks: { top: number; height: number; booking: Booking }[] = [];
  for (const booking of bookings) {
    const bd = new Date(booking.scheduled_at);
    if (formatDateStr(bd) !== dateStr) continue;
    const startMin = bd.getHours() * 60 + bd.getMinutes();
    bookingBlocks.push({
      top: (startMin / 60) * HOUR_HEIGHT,
      height: (booking.duration_minutes / 60) * HOUR_HEIGHT,
      booking,
    });
  }

  return { date, dateStr, availBlocks, overrideBlocks, bookingBlocks };
}

// ── Component ────────────────────────────────────────────────────────────────

export function CalendarView({
  divinerId,
  divinerUsername,
  availabilitySlots,
  overrides,
  bookings,
}: CalendarViewProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [offset, setOffset] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showAddOverride, setShowAddOverride] = useState(false);
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [bookingTime, setBookingTime] = useState<string | undefined>();
  const [overrideDate, setOverrideDate] = useState("");
  const [overrideStart, setOverrideStart] = useState("09:00");
  const [overrideEnd, setOverrideEnd] = useState("17:00");
  const [overrideType, setOverrideType] = useState<"block" | "special">("block");
  const [saving, setSaving] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");

  // ── Computed dates ─────────────────────────────────────────────────────────

  const baseDate = useMemo(() => {
    const d = new Date();
    if (viewMode === "day") d.setDate(d.getDate() + offset);
    else if (viewMode === "week") d.setDate(d.getDate() + offset * 7);
    else {
      d.setMonth(d.getMonth() + offset);
      d.setDate(1);
    }
    return d;
  }, [offset, viewMode]);

  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);
  const monthDates = useMemo(() => getMonthDates(baseDate), [baseDate]);

  const columns = useMemo(() => {
    const dates = viewMode === "day" ? [baseDate] : viewMode === "week" ? weekDates : [];
    return dates.map((d) => buildDayColumn(d, availabilitySlots, overrides, bookings));
  }, [baseDate, viewMode, weekDates, availabilitySlots, overrides, bookings]);

  // ── Navigation label ───────────────────────────────────────────────────────

  const navLabel = useMemo(() => {
    if (viewMode === "day") {
      return baseDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    if (viewMode === "week") {
      return `${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return baseDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [viewMode, baseDate, weekDates]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleDeleteBooking(booking: Booking) {
    setCancelTarget(booking);
    setSelectedBooking(null);
  }

  async function confirmDeleteBooking(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/bookings/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCancelTarget(null);
        window.location.reload();
      } else {
        toast.error("Failed to cancel booking");
      }
    } finally {
      setSaving(false);
    }
  }

  function handleReschedule(booking: Booking) {
    router.push(`/${divinerUsername}/reschedule/${booking.id}`);
  }

  async function handleSaveNotes(bookingId: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_notes: notesValue }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to save notes");
      }
      toast.success("Notes saved — client notified if notes changed");
      setEditingNotes(false);
      window.location.reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save notes");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddOverride() {
    if (!overrideDate) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/availability/${divinerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_override",
          date: overrideDate,
          is_available: overrideType === "special",
          start_time: overrideType === "special" ? overrideStart : undefined,
          end_time: overrideType === "special" ? overrideEnd : undefined,
        }),
      });
      if (res.ok) {
        setShowAddOverride(false);
        window.location.reload();
      }
    } finally {
      setSaving(false);
    }
  }

  // ── Time grid column renderer (shared by day + week) ──────────────────────

  function renderTimeColumn(
    col: ReturnType<typeof buildDayColumn>,
    colCount: number
  ) {
    return (
      <div key={col.dateStr} className="relative border-r">
        {HOURS.map((h) => (
          <div
            key={h}
            className="absolute w-full border-t border-border/50"
            style={{ top: h * HOUR_HEIGHT }}
          />
        ))}

        {col.overrideBlocks.map((block, i) => (
          <div
            key={`ovr-${i}`}
            className="absolute inset-x-0 mx-0.5 rounded bg-red-500/10 border border-red-500/20"
            style={{ top: block.top, height: block.height }}
          >
            <span className="p-1 text-[10px] text-red-400">Blocked</span>
          </div>
        ))}

        {col.availBlocks.map((block, i) => (
          <button
            key={`avail-${i}`}
            type="button"
            className="absolute inset-x-0 mx-0.5 cursor-pointer rounded bg-green-500/15 border border-green-500/20 hover:bg-green-500/25 transition-colors text-left"
            style={{ top: block.top, height: block.height }}
            onClick={() => {
              const slotDate = new Date(col.dateStr + "T00:00:00");
              const [h, m] = block.label.split(" - ")[0].split(":").map(Number);
              slotDate.setHours(h, m, 0, 0);
              setBookingTime(slotDate.toISOString());
              setShowAddBooking(true);
            }}
          >
            <span className="p-1 text-[10px] text-green-400">{block.label}</span>
          </button>
        ))}

        {col.bookingBlocks.map((block, i) => {
          const isPP = block.booking.status === "pending_payment";
          return (
            <button
              key={`book-${i}`}
              type="button"
              className={`absolute inset-x-0 mx-1 cursor-pointer overflow-hidden rounded text-left transition-colors ${
                isPP
                  ? "bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30"
                  : "bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30"
              }`}
              style={{ top: block.top, height: Math.max(block.height, 20) }}
              onClick={() => setSelectedBooking(block.booking)}
            >
              <div className="p-1">
                <p className={`truncate font-medium ${colCount > 1 ? "text-[10px]" : "text-xs"} ${isPP ? "text-blue-300" : "text-amber-300"}`}>
                  {block.booking.metadata?.availability_title ?? block.booking.services?.name ?? "Session"}
                </p>
                <p className={`truncate ${colCount > 1 ? "text-[9px]" : "text-[11px]"} ${isPP ? "text-blue-300/70" : "text-amber-300/70"}`}>
                  {isPP ? "⏳ Awaiting payment" : (block.booking.clients?.full_name ?? "Client")}
                </p>
                {colCount === 1 && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(block.booking.scheduled_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    {" · "}{block.booking.duration_minutes}min
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // ── Time grid (day + week views) ──────────────────────────────────────────

  function renderTimeGrid() {
    const colCount = columns.length;
    const gridCols = colCount === 1 ? "grid-cols-[60px_1fr]" : "grid-cols-[60px_repeat(7,1fr)]";

    return (
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className={colCount === 1 ? "" : "min-w-[700px]"}>
            {/* Day headers */}
            <div className={`grid ${gridCols} border-b`}>
              <div className="border-r p-2" />
              {columns.map(({ date, dateStr }) => {
                const isToday = formatDateStr(new Date()) === dateStr;
                return (
                  <div
                    key={dateStr}
                    className={`border-r p-2 text-center text-sm ${
                      isToday ? "bg-primary/10 font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    <div>{colCount === 1 ? DAYS_FULL[date.getDay()] : DAYS[date.getDay()]}</div>
                    <div className="text-lg">{date.getDate()}</div>
                  </div>
                );
              })}
            </div>

            {/* Time grid */}
            <div
              className="relative overflow-y-auto"
              style={{ height: 680 }}
              ref={(el) => {
                if (el && el.scrollTop === 0) el.scrollTop = 6 * HOUR_HEIGHT;
              }}
            >
              <div
                className={`relative grid ${gridCols}`}
                style={{ height: 24 * HOUR_HEIGHT }}
              >
                <div className="relative border-r">
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="absolute w-full border-t pr-2 text-right text-[11px] text-muted-foreground"
                      style={{ top: h * HOUR_HEIGHT }}
                    >
                      {h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}
                    </div>
                  ))}
                </div>
                {columns.map((col) => renderTimeColumn(col, colCount))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Monthly view ──────────────────────────────────────────────────────────

  function renderMonthGrid() {
    const currentMonth = baseDate.getMonth();
    const todayStr = formatDateStr(new Date());
    const weeks: Date[][] = [];
    for (let i = 0; i < monthDates.length; i += 7) {
      weeks.push(monthDates.slice(i, i + 7));
    }

    return (
      <Card>
        <CardContent className="p-0">
          {/* Day-of-week header */}
          <div className="grid grid-cols-7 border-b">
            {DAYS.map((d) => (
              <div key={d} className="border-r p-2 text-center text-xs font-medium text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          {/* Week rows */}
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b last:border-b-0">
              {week.map((date) => {
                const dateStr = formatDateStr(date);
                const isCurrentMonth = date.getMonth() === currentMonth;
                const isToday = dateStr === todayStr;
                const dayBookings = bookings.filter(
                  (b) => formatDateStr(new Date(b.scheduled_at)) === dateStr
                );
                const dayOverridesList = overrides.filter((o) => o.date === dateStr);
                const isBlocked = dayOverridesList.some((o) => !o.is_available);
                const hasAvailability =
                  !isBlocked &&
                  (dayOverridesList.some((o) => o.is_available && o.start_time) ||
                    availabilitySlots.some(
                      (s) => s.day_of_week === date.getDay() && s.is_active
                    ));

                return (
                  <div
                    key={dateStr}
                    className={`relative min-h-[100px] border-r p-1.5 transition-colors cursor-pointer hover:bg-muted/30 ${
                      !isCurrentMonth ? "bg-muted/10 text-muted-foreground/50" : ""
                    } ${isBlocked ? "bg-red-500/5" : ""}`}
                    onClick={() => {
                      // Click a day in month view → switch to day view
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const target = new Date(date);
                      target.setHours(0, 0, 0, 0);
                      const diff = Math.round(
                        (target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
                      );
                      setOffset(diff);
                      setViewMode("day");
                    }}
                  >
                    {/* Date number */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`inline-flex size-6 items-center justify-center rounded-full text-xs ${
                          isToday
                            ? "bg-primary text-primary-foreground font-bold"
                            : isCurrentMonth
                            ? "font-medium"
                            : ""
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      {hasAvailability && !isBlocked && (
                        <span className="size-1.5 rounded-full bg-green-500/60" />
                      )}
                      {isBlocked && (
                        <span className="text-[9px] text-red-400">Off</span>
                      )}
                    </div>

                    {/* Booking chips */}
                    <div className="space-y-0.5">
                      {dayBookings.slice(0, 3).map((b) => {
                        const isPP = b.status === "pending_payment";
                        return (
                          <button
                            key={b.id}
                            type="button"
                            className={`w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium transition-colors ${
                              isPP
                                ? "bg-blue-500/15 text-blue-300 hover:bg-blue-500/25"
                                : "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBooking(b);
                            }}
                          >
                            {new Date(b.scheduled_at).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}{" "}
                            {b.metadata?.availability_title ?? b.services?.name ?? "Session"}
                          </button>
                        );
                      })}
                      {dayBookings.length > 3 && (
                        <p className="text-[9px] text-muted-foreground pl-1">
                          +{dayBookings.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Navigation bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setOffset((o) => o - 1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[200px] text-center">{navLabel}</h2>
          <Button variant="outline" size="icon" onClick={() => setOffset((o) => o + 1)}>
            <ChevronRight className="size-4" />
          </Button>
          {offset !== 0 && (
            <Button variant="ghost" size="sm" onClick={() => setOffset(0)}>
              Today
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["day", "week", "month"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  viewMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:bg-muted/50"
                }`}
                onClick={() => {
                  setOffset(0);
                  setViewMode(mode);
                }}
              >
                {mode === "day" ? "Day" : mode === "week" ? "Week" : "Month"}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setOverrideType("block"); setShowAddOverride(true); }}
          >
            <X className="mr-1 size-3" />
            Block Day Off
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setOverrideType("special"); setShowAddOverride(true); }}
          >
            <Plus className="mr-1 size-3" />
            Add Special Hours
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            onClick={() => { setBookingTime(undefined); setShowAddBooking(true); }}
          >
            <CalendarIcon className="mr-1 size-3" />
            Create Manual Booking
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block size-3 rounded bg-green-500/30" />
          Available
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-3 rounded bg-amber-500/50" />
          Booked
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-3 rounded bg-red-500/20" />
          Blocked
        </span>
      </div>

      {/* Calendar grid */}
      {viewMode === "month" ? renderMonthGrid() : renderTimeGrid()}

      {/* ── Booking detail sheet ──────────────────────────────────────────── */}
      <Sheet
        open={!!selectedBooking}
        onOpenChange={(open) => { if (!open) { setSelectedBooking(null); setEditingNotes(false); } }}
      >
        <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Booking Details</SheetTitle>
          </SheetHeader>
          {selectedBooking && (() => {
            const qr = selectedBooking.questionnaire_responses ?? {};
            const basePrice = selectedBooking.base_price ?? 0;
            const isRefunded = !!selectedBooking.refunded_at;
            const isPaid = ["confirmed", "completed", "in_progress"].includes(selectedBooking.status);
            const attendees = Array.isArray(qr.attendees)
              ? (qr.attendees as Array<{ name?: string; email?: string }>)
              : null;
            const hasBirthData = !!(
              selectedBooking.clients?.birth_date ||
              selectedBooking.clients?.birth_time ||
              selectedBooking.clients?.birth_city
            );

            return (
              <div className="mt-4 space-y-5 pb-8">

                {/* ── Session info ──────────────────────────────────── */}
                <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Session</p>
                  <div>
                    <p className="text-xs text-muted-foreground">Service</p>
                    <p className="text-sm font-semibold">
                      {selectedBooking.metadata?.availability_title ?? selectedBooking.services?.name ?? "Session"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Date & Time</p>
                      <p className="text-sm font-medium">
                        {new Date(selectedBooking.scheduled_at).toLocaleDateString("en-US", {
                          weekday: "short", month: "short", day: "numeric", year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(selectedBooking.scheduled_at).toLocaleTimeString("en-US", {
                          hour: "numeric", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-sm font-medium">{selectedBooking.duration_minutes} min</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge
                      variant="outline"
                      className={`mt-0.5 text-[10px] uppercase ${
                        selectedBooking.status === "pending_payment"
                          ? "text-blue-400 border-blue-500/40 bg-blue-500/10"
                          : selectedBooking.status === "confirmed"
                          ? "text-green-400 border-green-500/40 bg-green-500/10"
                          : selectedBooking.status === "completed"
                          ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
                          : selectedBooking.status === "in_progress"
                          ? "text-purple-400 border-purple-500/40 bg-purple-500/10"
                          : selectedBooking.status === "canceled"
                          ? "text-red-400 border-red-500/40 bg-red-500/10"
                          : "text-muted-foreground border-border"
                      }`}
                    >
                      {selectedBooking.status === "pending_payment" ? "Awaiting Payment" : selectedBooking.status}
                    </Badge>
                  </div>
                </div>

                {/* ── Client info ───────────────────────────────────── */}
                <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <User className="size-3.5 text-muted-foreground" />
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Client</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {selectedBooking.metadata?.is_reminder
                        ? "Personal Reminder (Self)"
                        : selectedBooking.clients?.full_name ?? "Unknown"}
                    </p>
                  </div>
                  {selectedBooking.clients?.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="size-3 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground break-all">{selectedBooking.clients.email}</p>
                    </div>
                  )}
                  {selectedBooking.clients?.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="size-3 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground">{selectedBooking.clients.phone}</p>
                    </div>
                  )}
                  {hasBirthData && (
                    <div className="pt-1 border-t border-border/50 space-y-1">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Birth Data</p>
                      {selectedBooking.clients?.birth_date && (
                        <p className="text-xs"><span className="text-muted-foreground">DOB: </span>{selectedBooking.clients.birth_date}</p>
                      )}
                      {selectedBooking.clients?.birth_time && (
                        <p className="text-xs"><span className="text-muted-foreground">Time: </span>{selectedBooking.clients.birth_time}</p>
                      )}
                      {selectedBooking.clients?.birth_city && (
                        <p className="text-xs"><span className="text-muted-foreground">City: </span>{selectedBooking.clients.birth_city}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Payment ───────────────────────────────────────── */}
                {basePrice > 0 && (
                  <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="size-3.5 text-muted-foreground" />
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Payment</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="text-sm font-semibold">{formatCurrency(basePrice)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        {isRefunded ? (
                          <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">Refunded</span>
                        ) : isPaid ? (
                          <span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400">Paid</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-400">Unpaid</span>
                        )}
                      </div>
                    </div>
                    {selectedBooking.stripe_payment_intent_id && isPaid && (
                      <div>
                        <p className="text-xs text-muted-foreground">Payment ID</p>
                        <p className="text-[10px] font-mono text-foreground/60 break-all">{selectedBooking.stripe_payment_intent_id}</p>
                      </div>
                    )}
                    {isRefunded && (
                      <div className="pt-1 border-t border-border/50 space-y-1">
                        {selectedBooking.refund_amount && (
                          <p className="text-xs"><span className="text-muted-foreground">Refund amount: </span>{formatCurrency(selectedBooking.refund_amount)}</p>
                        )}
                        {selectedBooking.refunded_at && (
                          <p className="text-xs"><span className="text-muted-foreground">Refunded: </span>{new Date(selectedBooking.refunded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                        )}
                        {selectedBooking.refund_reason && (
                          <p className="text-xs"><span className="text-muted-foreground">Reason: </span>{selectedBooking.refund_reason}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {basePrice === 0 && (
                  <div className="rounded-lg border border-border bg-muted/20 p-3 flex items-center gap-2">
                    <CreditCard className="size-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Free session — no charge</p>
                  </div>
                )}

                {/* ── Questionnaire / Attendees ────────────────────── */}
                {!!(qr.focusQuestion || qr.lifeArea || qr.birthDate || qr.birthCity || attendees || qr.secondPersonEmail) && (
                  <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Star className="size-3.5 text-muted-foreground" />
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Questionnaire</p>
                    </div>
                    {!!qr.lifeArea && (
                      <div>
                        <p className="text-xs text-muted-foreground">Life Area</p>
                        <p className="text-sm">{String(qr.lifeArea)}</p>
                      </div>
                    )}
                    {!!qr.focusQuestion && (
                      <div>
                        <p className="text-xs text-muted-foreground">Focus / Question</p>
                        <p className="text-sm">{String(qr.focusQuestion)}</p>
                      </div>
                    )}
                    {!!qr.birthDate && (
                      <div>
                        <p className="text-xs text-muted-foreground">Birth Date (questionnaire)</p>
                        <p className="text-sm">{String(qr.birthDate)}{qr.birthTime ? ` · ${String(qr.birthTime)}` : ""}{qr.birthCity ? ` · ${String(qr.birthCity)}` : ""}</p>
                      </div>
                    )}
                    {/* Second person */}
                    {!!qr.secondPersonEmail && (
                      <div className="pt-1 border-t border-border/50">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Users2 className="size-3 text-muted-foreground" />
                          <p className="text-[10px] font-medium text-muted-foreground uppercase">Second Person</p>
                        </div>
                        <p className="text-xs">{qr.secondPersonName ? String(qr.secondPersonName) : "—"} · {String(qr.secondPersonEmail)}</p>
                        {!!qr.secondPersonAttending && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">Attending: {String(qr.secondPersonAttending)}</p>
                        )}
                      </div>
                    )}
                    {/* Group attendees */}
                    {attendees && attendees.length > 0 && (
                      <div className="pt-1 border-t border-border/50">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Users2 className="size-3 text-muted-foreground" />
                          <p className="text-[10px] font-medium text-muted-foreground uppercase">Attendees ({attendees.length})</p>
                        </div>
                        <div className="space-y-1">
                          {attendees.map((a, i) => (
                            <div key={i} className="text-xs">
                              <span className="font-medium">{a.name || "—"}</span>
                              {a.email && <span className="text-muted-foreground"> · {a.email}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Booking notes (from client) ───────────────────── */}
                {selectedBooking.booking_notes && (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FileText className="size-3.5 text-amber-400" />
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-400">Client Notes</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedBooking.booking_notes}</p>
                  </div>
                )}

                {/* ── Session notes (private, editable) ────────────── */}
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <FileText className="size-3.5 text-muted-foreground" />
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Session Notes <span className="normal-case font-normal">(private)</span></p>
                    </div>
                    {!editingNotes && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setNotesValue(selectedBooking.session_notes ?? ""); setEditingNotes(true); }}>
                        <Save className="mr-1 h-3 w-3" />
                        {selectedBooking.session_notes ? "Edit" : "Add"}
                      </Button>
                    )}
                  </div>
                  {editingNotes ? (
                    <div className="space-y-2">
                      <Textarea value={notesValue} onChange={(e) => setNotesValue(e.target.value)} rows={4} placeholder="Session notes, themes, follow-up topics…" className="text-sm" />
                      <p className="text-[10px] text-muted-foreground">Client will be emailed if notes change.</p>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" onClick={() => handleSaveNotes(selectedBooking.id)} disabled={saving}>
                          {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingNotes(false)} disabled={saving}>Cancel</Button>
                      </div>
                    </div>
                  ) : selectedBooking.session_notes ? (
                    <div className="text-sm bg-muted/30 p-3 rounded border overflow-auto max-h-[120px]" dangerouslySetInnerHTML={{ __html: selectedBooking.session_notes }} />
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No notes added yet.</p>
                  )}
                </div>

                {/* ── Client's Session Notes ────────────────────────── */}
                {selectedBooking.client_session_notes && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">Client&apos;s Notes</p>
                    <div className="text-sm bg-muted/30 p-3 rounded border overflow-auto max-h-[120px] whitespace-pre-wrap">{selectedBooking.client_session_notes}</div>
                  </div>
                )}

                {/* ── Actions ───────────────────────────────────────── */}
                {!selectedBooking.metadata?.is_reminder && (
                  <Button variant="outline" size="sm" className="w-full border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300" onClick={() => handleReschedule(selectedBooking)}>
                    <CalendarClock className="mr-2 h-4 w-4" />
                    Reschedule — Pick New Slot
                  </Button>
                )}
                <Button variant="destructive" className="w-full" onClick={() => handleDeleteBooking(selectedBooking)} disabled={saving}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Cancel Booking
                </Button>

              </div>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* ── Override sheet ────────────────────────────────────────────────── */}
      <Sheet open={showAddOverride} onOpenChange={setShowAddOverride}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{overrideType === "block" ? "Block Day Off" : "Add Special Hours"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="override-date">Date</Label>
              <Input id="override-date" type="date" value={overrideDate} onChange={(e) => setOverrideDate(e.target.value)} />
            </div>
            {overrideType === "special" && (
              <>
                <div>
                  <Label htmlFor="override-start">Start Time</Label>
                  <Input id="override-start" type="time" value={overrideStart} onChange={(e) => setOverrideStart(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="override-end">End Time</Label>
                  <Input id="override-end" type="time" value={overrideEnd} onChange={(e) => setOverrideEnd(e.target.value)} />
                </div>
              </>
            )}
            <Button className="w-full" disabled={!overrideDate || saving} onClick={handleAddOverride}>
              {saving ? "Saving..." : overrideType === "block" ? "Block Day" : "Save Special Hours"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Manual Booking Modal ─────────────────────────────────────────── */}
      <ManualBookingModal open={showAddBooking} onOpenChange={setShowAddBooking} initialTime={bookingTime} />

      {/* ── Cancel Confirmation Dialog ───────────────────────────────────── */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => { if (!open) setCancelTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Cancel Booking
            </DialogTitle>
            <DialogDescription>This will permanently remove the booking and notify the client.</DialogDescription>
          </DialogHeader>
          {cancelTarget && (
            <div className="space-y-3 rounded-lg border border-border/50 bg-muted/30 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Session</span>
                <span className="font-medium text-right">{cancelTarget.metadata?.availability_title ?? cancelTarget.services?.name ?? "Session"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client</span>
                <span className="font-medium">{cancelTarget.metadata?.is_reminder ? "Personal Reminder" : cancelTarget.clients?.full_name ?? "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scheduled</span>
                <span className="font-medium text-right">{new Date(cancelTarget.scheduled_at).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{cancelTarget.duration_minutes} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className={`text-[10px] uppercase ${cancelTarget.status === "pending_payment" ? "text-blue-400 border-blue-500/40 bg-blue-500/10" : cancelTarget.status === "confirmed" ? "text-green-400 border-green-500/40 bg-green-500/10" : ""}`}>
                  {cancelTarget.status === "pending_payment" ? "⏳ Awaiting Payment" : cancelTarget.status}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setCancelTarget(null)} disabled={saving}>Keep Booking</Button>
            <Button variant="destructive" className="flex-1" onClick={() => cancelTarget && confirmDeleteBooking(cancelTarget.id)} disabled={saving}>
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}
              Yes, Cancel It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
