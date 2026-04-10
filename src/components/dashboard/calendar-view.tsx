"use client";

import { useState, useMemo } from "react";
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
import { ChevronLeft, ChevronRight, X, Plus, Calendar as CalendarIcon, Trash2, Loader2, CalendarClock, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ManualBookingModal } from "./manual-booking-modal";

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
  metadata?: {
    is_reminder?: boolean;
    is_manual?: boolean;
    timezone?: string;
    availability_title?: string;
  } | null;
  services: { name: string } | null;
  clients: { full_name: string | null } | null;
}

interface CalendarViewProps {
  divinerId: string;
  availabilitySlots: AvailabilitySlot[];
  overrides: AvailabilityOverride[];
  bookings: Booking[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

function formatDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function CalendarView({
  divinerId,
  availabilitySlots,
  overrides,
  bookings,
}: CalendarViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showAddOverride, setShowAddOverride] = useState(false);
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [bookingTime, setBookingTime] = useState<string | undefined>();
  const [overrideDate, setOverrideDate] = useState("");
  const [overrideStart, setOverrideStart] = useState("09:00");
  const [overrideEnd, setOverrideEnd] = useState("17:00");
  const [overrideType, setOverrideType] = useState<"block" | "special">(
    "block"
  );
  const [saving, setSaving] = useState(false);

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);

  // Build blocks for each column
  const columns = weekDates.map((date) => {
    const dateStr = formatDateStr(date);
    const dayOfWeek = date.getDay();

    // Check overrides for this date
    const dayOverrides = overrides.filter((o) => o.date === dateStr);
    const isBlockedOff = dayOverrides.some((o) => !o.is_available);

    // Availability blocks (green)
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
        const daySlots = availabilitySlots.filter(
          (s) => s.day_of_week === dayOfWeek && s.is_active
        );
        for (const slot of daySlots) {
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

    // Override blocks (red)
    const overrideBlocks: { top: number; height: number }[] = [];
    if (isBlockedOff) {
      overrideBlocks.push({ top: 0, height: 24 * HOUR_HEIGHT });
    }

    // Booking blocks (gold)
    const bookingBlocks: { top: number; height: number; booking: Booking }[] =
      [];
    for (const booking of bookings) {
      const bookingDate = new Date(booking.scheduled_at);
      if (formatDateStr(bookingDate) !== dateStr) continue;
      const startMin =
        bookingDate.getHours() * 60 + bookingDate.getMinutes();
      bookingBlocks.push({
        top: (startMin / 60) * HOUR_HEIGHT,
        height: (booking.duration_minutes / 60) * HOUR_HEIGHT,
        booking,
      });
    }

    return { date, dateStr, availBlocks, overrideBlocks, bookingBlocks };
  });

  // Reschedule mode — stores the booking being rescheduled; user clicks a slot to confirm
  const [reschedulingBooking, setReschedulingBooking] = useState<Booking | null>(null);

  // Cancel dialog
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  // Notes edit state
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");

  async function handleDeleteBooking(booking: Booking) {
    setCancelTarget(booking);
    setSelectedBooking(null);
  }

  async function confirmDeleteBooking(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/bookings/${id}`, {
        method: "DELETE",
      });
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

  async function handleRescheduleSlot(newDateStr: string, startLabel: string) {
    if (!reschedulingBooking) return;
    const [h, m] = startLabel.split(":").map(Number);
    const newDate = newDateStr;
    const newTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/bookings/${reschedulingBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_date: newDate,
          new_time: newTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to reschedule");
      }
      toast.success("Booking rescheduled — client notified");
      setReschedulingBooking(null);
      window.location.reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reschedule");
    } finally {
      setSaving(false);
    }
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

  const weekLabel = `${weekDates[0].toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} - ${weekDates[6].toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((w) => w - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <h2 className="text-lg font-semibold">{weekLabel}</h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((w) => w + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
          {weekOffset !== 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeekOffset(0)}
            >
              Today
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setOverrideType("block");
              setShowAddOverride(true);
            }}
          >
            <X className="mr-1 size-3" />
            Block Day Off
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setOverrideType("special");
              setShowAddOverride(true);
            }}
          >
            <Plus className="mr-1 size-3" />
            Add Special Hours
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            onClick={() => {
              setBookingTime(undefined);
              setShowAddBooking(true);
            }}
          >
            <CalendarIcon className="mr-1 size-3" />
            Create Manual Booking
          </Button>
        </div>
      </div>

      {/* Reschedule mode banner */}
      {reschedulingBooking && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-300">
            <CalendarClock className="size-4 shrink-0" />
            <span>
              <strong>Rescheduling:</strong>{" "}
              {reschedulingBooking.metadata?.availability_title ?? reschedulingBooking.services?.name ?? "Session"}
              {reschedulingBooking.clients?.full_name ? ` — ${reschedulingBooking.clients.full_name}` : ""}
              {" · Click any available slot to set the new time"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 shrink-0"
            onClick={() => setReschedulingBooking(null)}
          >
            <X className="mr-1 size-3" />
            Cancel
          </Button>
        </div>
      )}

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
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="min-w-[700px]">
            {/* Day headers */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b">
              <div className="border-r p-2" />
              {columns.map(({ date, dateStr }) => {
                const isToday = formatDateStr(new Date()) === dateStr;
                return (
                  <div
                    key={dateStr}
                    className={`border-r p-2 text-center text-sm ${
                      isToday
                        ? "bg-primary/10 font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div>{DAYS[date.getDay()]}</div>
                    <div className="text-lg">{date.getDate()}</div>
                  </div>
                );
              })}
            </div>

            {/* Time grid scrolled to 6am */}
            <div
              className="relative overflow-y-auto"
              style={{ height: 680 }}
              ref={(el) => {
                if (el && el.scrollTop === 0) {
                  el.scrollTop = 6 * HOUR_HEIGHT;
                }
              }}
            >
              <div
                className="relative grid grid-cols-[60px_repeat(7,1fr)]"
                style={{ height: 24 * HOUR_HEIGHT }}
              >
                {/* Hour labels */}
                <div className="relative border-r">
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="absolute w-full border-t pr-2 text-right text-[11px] text-muted-foreground"
                      style={{ top: h * HOUR_HEIGHT }}
                    >
                      {h === 0
                        ? "12 AM"
                        : h < 12
                          ? `${h} AM`
                          : h === 12
                            ? "12 PM"
                            : `${h - 12} PM`}
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {columns.map(
                  ({
                    dateStr,
                    availBlocks,
                    overrideBlocks,
                    bookingBlocks,
                  }) => (
                    <div key={dateStr} className="relative border-r">
                      {/* Hour gridlines */}
                      {HOURS.map((h) => (
                        <div
                          key={h}
                          className="absolute w-full border-t border-border/50"
                          style={{ top: h * HOUR_HEIGHT }}
                        />
                      ))}

                      {/* Override blocks (red) */}
                      {overrideBlocks.map((block, i) => (
                        <div
                          key={`ovr-${i}`}
                          className="absolute inset-x-0 mx-0.5 rounded bg-red-500/10 border border-red-500/20"
                          style={{ top: block.top, height: block.height }}
                        >
                          <span className="p-1 text-[10px] text-red-400">
                            Blocked
                          </span>
                        </div>
                      ))}

                      {/* Availability blocks (green) */}
                      {availBlocks.map((block, i) => (
                        <button
                          key={`avail-${i}`}
                          type="button"
                          className="absolute inset-x-0 mx-0.5 cursor-pointer rounded bg-green-500/15 border border-green-500/20 hover:bg-green-500/25 transition-colors text-left"
                          style={{ top: block.top, height: block.height }}
                          onClick={() => {
                            if (reschedulingBooking) {
                              // Reschedule mode — use this slot as the new time
                              handleRescheduleSlot(dateStr, block.label.split(" - ")[0]);
                              return;
                            }
                            // Normal mode — open manual booking modal
                            const slotDate = new Date(dateStr + "T00:00:00");
                            const [h, m] = block.label.split(" - ")[0].split(":").map(Number);
                            slotDate.setHours(h, m, 0, 0);
                            setBookingTime(slotDate.toISOString());
                            setShowAddBooking(true);
                          }}
                        >
                          <span className="p-1 text-[10px] text-green-400">
                            {block.label}
                          </span>
                        </button>
                      ))}

                      {/* Booking blocks */}
                      {bookingBlocks.map((block, i) => {
                        const isPendingPayment = block.booking.status === "pending_payment";
                        return (
                          <button
                            key={`book-${i}`}
                            type="button"
                            className={`absolute inset-x-0 mx-1 cursor-pointer overflow-hidden rounded text-left transition-colors ${
                              isPendingPayment
                                ? "bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30"
                                : "bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30"
                            }`}
                            style={{
                              top: block.top,
                              height: Math.max(block.height, 20),
                            }}
                            onClick={() => setSelectedBooking(block.booking)}
                          >
                            <div className="p-1">
                              <p className={`truncate text-[10px] font-medium ${isPendingPayment ? "text-blue-300" : "text-amber-300"}`}>
                                {block.booking.metadata?.availability_title ?? block.booking.services?.name ?? "Session"}
                              </p>
                              <p className={`truncate text-[9px] ${isPendingPayment ? "text-blue-300/70" : "text-amber-300/70"}`}>
                                {isPendingPayment ? "⏳ Awaiting payment" : (block.booking.clients?.full_name ?? "Client")}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking detail sheet */}
      <Sheet
        open={!!selectedBooking}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedBooking(null);
            setEditingNotes(false);
          }
        }}
      >
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Booking Details</SheetTitle>
          </SheetHeader>
          {selectedBooking && (
            <div className="mt-6 space-y-4">
              {/* Info rows */}
              <div>
                <Label className="text-muted-foreground">Schedule</Label>
                <p className="font-medium">
                  {selectedBooking.metadata?.availability_title ?? selectedBooking.services?.name ?? "Session"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Client</Label>
                <p className="font-medium">
                  {selectedBooking.metadata?.is_reminder
                    ? "Personal Reminder (Self)"
                    : selectedBooking.clients?.full_name ?? "Unknown"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Scheduled</Label>
                <p className="font-medium">
                  {new Date(selectedBooking.scheduled_at).toLocaleString("en-US", {
                    weekday: "long", month: "long", day: "numeric",
                    hour: "numeric", minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Duration</Label>
                <p className="font-medium">{selectedBooking.duration_minutes} minutes</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <Badge
                  variant="outline"
                  className={`ml-1 uppercase text-[10px] ${
                    selectedBooking.status === "pending_payment"
                      ? "text-blue-400 border-blue-500/40 bg-blue-500/10"
                      : selectedBooking.status === "confirmed"
                      ? "text-green-400 border-green-500/40 bg-green-500/10"
                      : ""
                  }`}
                >
                  {selectedBooking.status === "pending_payment" ? "⏳ Awaiting Payment" : selectedBooking.status}
                </Badge>
              </div>

              {/* Notes section */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-muted-foreground">Notes & Instructions</Label>
                  {!editingNotes && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setNotesValue(selectedBooking.session_notes ?? "");
                        setEditingNotes(true);
                      }}
                    >
                      <Save className="mr-1 h-3 w-3" />
                      {selectedBooking.session_notes ? "Edit" : "Add Notes"}
                    </Button>
                  )}
                </div>

                {editingNotes ? (
                  <div className="space-y-2">
                    <Textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      rows={5}
                      placeholder="Session notes, instructions, or details for the client…"
                      className="text-sm"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Client will be emailed if notes change.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSaveNotes(selectedBooking.id)}
                        disabled={saving}
                      >
                        {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingNotes(false)}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : selectedBooking.session_notes ? (
                  <div
                    className="text-sm prose prose-invert max-w-none bg-muted/30 p-4 rounded-lg border overflow-auto max-h-[150px]"
                    dangerouslySetInnerHTML={{ __html: selectedBooking.session_notes }}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground italic">No notes added yet.</p>
                )}
              </div>

              {/* Reschedule */}
              {!selectedBooking.metadata?.is_reminder && (
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                    onClick={() => {
                      setReschedulingBooking(selectedBooking);
                      setSelectedBooking(null);
                    }}
                  >
                    <CalendarClock className="mr-2 h-4 w-4" />
                    Reschedule — Pick New Slot
                  </Button>
                  <p className="mt-1 text-[10px] text-muted-foreground text-center">
                    Click an available slot on the calendar to set the new time.
                  </p>
                </div>
              )}

              {/* Cancel */}
              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleDeleteBooking(selectedBooking)}
                  disabled={saving}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Cancel Booking
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add override sheet */}
      <Sheet open={showAddOverride} onOpenChange={setShowAddOverride}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {overrideType === "block"
                ? "Block Day Off"
                : "Add Special Hours"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="override-date">Date</Label>
              <Input
                id="override-date"
                type="date"
                value={overrideDate}
                onChange={(e) => setOverrideDate(e.target.value)}
              />
            </div>
            {overrideType === "special" && (
              <>
                <div>
                  <Label htmlFor="override-start">Start Time</Label>
                  <Input
                    id="override-start"
                    type="time"
                    value={overrideStart}
                    onChange={(e) => setOverrideStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="override-end">End Time</Label>
                  <Input
                    id="override-end"
                    type="time"
                    value={overrideEnd}
                    onChange={(e) => setOverrideEnd(e.target.value)}
                  />
                </div>
              </>
            )}
            <Button
              className="w-full"
              disabled={!overrideDate || saving}
              onClick={handleAddOverride}
            >
              {saving
                ? "Saving..."
                : overrideType === "block"
                  ? "Block Day"
                  : "Save Special Hours"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Manual Booking Modal */}
      <ManualBookingModal
        open={showAddBooking}
        onOpenChange={setShowAddBooking}
        initialTime={bookingTime}
      />

      {/* Cancel Booking Confirmation Dialog */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => { if (!open) setCancelTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Cancel Booking
            </DialogTitle>
            <DialogDescription>
              This will permanently remove the booking and notify the client.
            </DialogDescription>
          </DialogHeader>

          {cancelTarget && (
            <div className="space-y-3 rounded-lg border border-border/50 bg-muted/30 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Session</span>
                <span className="font-medium text-right">
                  {cancelTarget.metadata?.availability_title ?? cancelTarget.services?.name ?? "Session"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client</span>
                <span className="font-medium">
                  {cancelTarget.metadata?.is_reminder
                    ? "Personal Reminder"
                    : cancelTarget.clients?.full_name ?? "Unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scheduled</span>
                <span className="font-medium text-right">
                  {new Date(cancelTarget.scheduled_at).toLocaleString("en-US", {
                    weekday: "short", month: "short", day: "numeric",
                    hour: "numeric", minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{cancelTarget.duration_minutes} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] uppercase ${
                    cancelTarget.status === "pending_payment"
                      ? "text-blue-400 border-blue-500/40 bg-blue-500/10"
                      : cancelTarget.status === "confirmed"
                      ? "text-green-400 border-green-500/40 bg-green-500/10"
                      : ""
                  }`}
                >
                  {cancelTarget.status === "pending_payment" ? "⏳ Awaiting Payment" : cancelTarget.status}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setCancelTarget(null)}
              disabled={saving}
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => cancelTarget && confirmDeleteBooking(cancelTarget.id)}
              disabled={saving}
            >
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}
              Yes, Cancel It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
