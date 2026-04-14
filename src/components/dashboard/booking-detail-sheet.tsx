"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Eye, Loader2, RotateCcw, CheckCircle2, NotebookPen, CreditCard, RefreshCw, CalendarClock, XCircle } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  canceled: "bg-red-500/10 text-red-500 border-red-500/20",
  "in_progress": "bg-purple-500/10 text-purple-500 border-purple-500/20",
  no_show: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

interface BookingDetailProps {
  booking: {
    id: string;
    scheduled_at: string;
    status: string;
    duration: number;
    amount: number;
    payment_intent_id?: string | null;
    notes: string | null;
    booking_notes?: string | null;
    session_notes?: string | null;
    client_name: string;
    client_email: string;
    service_name: string;
    refund_amount?: number | null;
    refunded_at?: string | null;
    refund_reason?: string | null;
  };
}

// Format an ISO string into the value expected by <input type="datetime-local">
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function BookingDetailSheet({ booking }: BookingDetailProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refunding, setRefunding] = useState(false);
  const [refunded, setRefunded] = useState(!!booking.refunded_at);
  const [syncing, setSyncing] = useState(false);
  const [sessionNotes, setSessionNotes] = useState(booking.session_notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);

  // Reschedule state
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [newScheduledAt, setNewScheduledAt] = useState(toDatetimeLocal(booking.scheduled_at));
  const [rescheduling, setRescheduling] = useState(false);

  // Cancel state
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [canceling, setCanceling] = useState(false);
  const [canceled, setCanceled] = useState(booking.status === "canceled");

  async function handleSaveNotes() {
    setSavingNotes(true);
    try {
      const res = await fetch("/api/bookings/session-notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, sessionNotes }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to save notes");
        return;
      }
      toast.success("Session notes saved");
      router.refresh();
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleRefund() {
    if (!refundReason.trim()) {
      toast.error("Please provide a reason for the refund");
      return;
    }

    setRefunding(true);
    try {
      const res = await fetch("/api/stripe/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          reason: refundReason.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to issue refund");
        return;
      }

      toast.success(`Refund of ${formatCurrency(data.amount)} issued successfully`);
      setRefunded(true);
      setShowRefundForm(false);
      router.refresh();
    } catch {
      toast.error("Failed to issue refund");
    } finally {
      setRefunding(false);
    }
  }

  async function handleReschedule() {
    if (!newScheduledAt) {
      toast.error("Please select a new date and time");
      return;
    }
    // Convert datetime-local value (local time) to ISO string
    const isoDate = new Date(newScheduledAt).toISOString();
    setRescheduling(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduled_at: isoDate }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to reschedule booking");
        return;
      }
      toast.success("Booking rescheduled successfully");
      setShowRescheduleForm(false);
      router.refresh();
    } catch {
      toast.error("Failed to reschedule booking");
    } finally {
      setRescheduling(false);
    }
  }

  async function handleCancel() {
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }
    setCanceling(true);
    try {
      // Auto-refund: if paid and not yet refunded, issue refund first
      const shouldRefund =
        !!booking.payment_intent_id &&
        booking.amount > 0 &&
        !refunded;

      if (shouldRefund) {
        const refundRes = await fetch("/api/stripe/refund", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking.id,
            reason: cancelReason.trim(),
          }),
        });
        const refundData = await refundRes.json();
        if (!refundRes.ok) {
          toast.error(refundData.error ?? "Failed to process refund. Cancellation aborted.");
          return;
        }
        setRefunded(true);
      }

      // Cancel the booking
      const cancelRes = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });
      const cancelData = await cancelRes.json();
      if (!cancelRes.ok) {
        toast.error(cancelData.error ?? "Failed to cancel booking");
        return;
      }

      toast.success(shouldRefund ? "Booking cancelled and refund issued" : "Booking cancelled");
      setCanceled(true);
      setShowCancelForm(false);
      router.refresh();
    } catch {
      toast.error("Failed to cancel booking");
    } finally {
      setCanceling(false);
    }
  }

  const canReschedule =
    ["pending", "confirmed"].includes(booking.status) && !canceled;

  const canCancel =
    ["pending", "confirmed", "in_progress"].includes(booking.status) && !canceled;

  const canRefund =
    booking.status === "completed" &&
    booking.amount > 0 &&
    !refunded;

  const canSyncPayment =
    booking.status === "pending" &&
    booking.amount > 0 &&
    !!booking.payment_intent_id;

  async function handleSyncPayment() {
    setSyncing(true);
    try {
      const res = await fetch("/api/stripe/sync-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: booking.id }),
      });
      const data = await res.json();
      if (data.synced) {
        toast.success(data.message ?? "Booking confirmed");
        router.refresh();
        setOpen(false);
      } else {
        toast.error(data.message ?? "Payment not yet completed");
      }
    } catch {
      toast.error("Failed to sync payment status");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Eye className="size-4" />
          <span className="sr-only">View details</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Booking Details</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6 p-4">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge
                className={statusColors[booking.status] ?? ""}
                variant="outline"
              >
                {booking.status}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Client</p>
              <p className="text-sm font-medium">{booking.client_name}</p>
              <p className="text-xs text-muted-foreground">
                {booking.client_email}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Service</p>
              <p className="text-sm font-medium">{booking.service_name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Date & Time</p>
                <p className="text-sm font-medium">
                  {formatDateTime(booking.scheduled_at)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-medium">{booking.duration} min</p>
              </div>
            </div>
            {/* Payment Info */}
            {booking.amount > 0 && (
              <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <CreditCard className="size-3.5 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="text-sm font-semibold">{formatCurrency(booking.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    {booking.refunded_at ? (
                      <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500">Refunded</span>
                    ) : ["confirmed", "completed", "in_progress"].includes(booking.status) ? (
                      <span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">Paid</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-500">Unpaid</span>
                    )}
                  </div>
                </div>
                {booking.payment_intent_id && ["confirmed", "completed", "in_progress"].includes(booking.status) && (
                  <div>
                    <p className="text-xs text-muted-foreground">Payment ID</p>
                    <p className="text-xs font-mono text-foreground/70 break-all">{booking.payment_intent_id}</p>
                  </div>
                )}
                {canSyncPayment && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-1 gap-1.5 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
                    onClick={handleSyncPayment}
                    disabled={syncing}
                  >
                    {syncing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                    {syncing ? "Checking…" : "Sync Payment Status"}
                  </Button>
                )}
              </div>
            )}

            {booking.notes && (
              <div>
                <p className="text-xs text-muted-foreground">Booking Notes</p>
                <p className="text-sm">{booking.notes}</p>
              </div>
            )}

            {booking.booking_notes && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                <p className="text-xs font-medium text-amber-400 mb-1">Client Notes</p>
                <p className="text-sm text-muted-foreground">{booking.booking_notes}</p>
              </div>
            )}

            {/* Session Notes — only for completed bookings */}
            {booking.status === "completed" && (
              <div className="space-y-2">
                <Label htmlFor="session-notes" className="flex items-center gap-1.5">
                  <NotebookPen className="size-3.5" />
                  Session Notes
                  <span className="text-xs font-normal text-muted-foreground">(private)</span>
                </Label>
                <Textarea
                  id="session-notes"
                  rows={4}
                  placeholder="Add notes about this session — themes covered, follow-up topics, key insights…"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                >
                  {savingNotes ? (
                    <>
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save Notes"
                  )}
                </Button>
              </div>
            )}

            {/* Reschedule Action */}
            {canReschedule && !showRescheduleForm && !showCancelForm && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowRescheduleForm(true)}
              >
                <CalendarClock className="size-4" />
                Reschedule
              </Button>
            )}

            {canReschedule && showRescheduleForm && (
              <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <h4 className="text-sm font-semibold">Reschedule Booking</h4>
                <p className="text-xs text-muted-foreground">
                  Select a new date and time. The client will be notified by email.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="new-datetime">New Date & Time</Label>
                  <input
                    id="new-datetime"
                    type="datetime-local"
                    value={newScheduledAt}
                    onChange={(e) => setNewScheduledAt(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleReschedule}
                    disabled={rescheduling}
                  >
                    {rescheduling ? (
                      <><Loader2 className="mr-1.5 size-3.5 animate-spin" />Rescheduling…</>
                    ) : (
                      "Confirm Reschedule"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowRescheduleForm(false);
                      setNewScheduledAt(toDatetimeLocal(booking.scheduled_at));
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Cancel Action */}
            {canCancel && !showCancelForm && !showRescheduleForm && (
              <Button
                variant="outline"
                className="w-full gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                onClick={() => setShowCancelForm(true)}
              >
                <XCircle className="size-4" />
                Cancel Booking
                {booking.payment_intent_id && booking.amount > 0 && !refunded && (
                  <span className="ml-1 text-xs opacity-70">+ auto-refund</span>
                )}
              </Button>
            )}

            {canCancel && showCancelForm && (
              <div className="space-y-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                <h4 className="text-sm font-semibold text-red-500">Cancel Booking</h4>
                {booking.payment_intent_id && booking.amount > 0 && !refunded ? (
                  <p className="text-xs text-muted-foreground">
                    This booking has a payment of <strong>{formatCurrency(booking.amount)}</strong>.
                    Cancelling will automatically issue a full refund to {booking.client_name}.
                    This action cannot be undone.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    The booking will be cancelled and the client will be notified.
                    This action cannot be undone.
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="cancel-reason">Reason for cancellation</Label>
                  <Textarea
                    id="cancel-reason"
                    rows={3}
                    placeholder="Provide a reason for cancellation…"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleCancel}
                    disabled={canceling}
                  >
                    {canceling ? (
                      <><Loader2 className="mr-1.5 size-3.5 animate-spin" />Processing…</>
                    ) : (
                      booking.payment_intent_id && booking.amount > 0 && !refunded
                        ? "Cancel & Refund"
                        : "Confirm Cancellation"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowCancelForm(false);
                      setCancelReason("");
                    }}
                  >
                    Go Back
                  </Button>
                </div>
              </div>
            )}

            {/* Refund Status */}
            {refunded && (
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-green-500" />
                  <p className="text-sm font-medium text-green-500">Refunded</p>
                </div>
                {booking.refund_amount && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Amount: {formatCurrency(booking.refund_amount)}
                  </p>
                )}
                {booking.refunded_at && (
                  <p className="text-xs text-muted-foreground">
                    Date: {formatDateTime(booking.refunded_at)}
                  </p>
                )}
                {booking.refund_reason && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Reason: {booking.refund_reason}
                  </p>
                )}
              </div>
            )}

            {/* Refund Action */}
            {canRefund && !showRefundForm && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowRefundForm(true)}
              >
                <RotateCcw className="mr-2 size-4" />
                Issue Refund
              </Button>
            )}

            {canRefund && showRefundForm && (
              <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <h4 className="text-sm font-semibold">Confirm Refund</h4>
                <p className="text-xs text-muted-foreground">
                  You are about to refund{" "}
                  <strong>{formatCurrency(booking.amount)}</strong> to{" "}
                  {booking.client_name}. This action cannot be undone.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="refund-reason">Reason for refund</Label>
                  <Textarea
                    id="refund-reason"
                    rows={3}
                    placeholder="Provide a reason for this refund..."
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={handleRefund}
                    disabled={refunding}
                  >
                    {refunding ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Confirm Refund"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRefundForm(false);
                      setRefundReason("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
