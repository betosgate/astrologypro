"use client";

import { useState, useEffect, useCallback } from "react";
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
import { ClipboardList, Loader2, RotateCcw, CheckCircle2, NotebookPen, CreditCard, RefreshCw, CalendarClock, XCircle, Send, Receipt, Video, Clock, Share2, Download, FileText, Copy, Sparkles, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { SegmentVideoPlayer } from "@/components/dashboard/segment-video-player";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  canceled: "bg-red-500/10 text-red-500 border-red-500/20",
  "in_progress": "bg-purple-500/10 text-purple-500 border-purple-500/20",
  no_show: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

interface LinkedOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

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
    client_session_notes?: string | null;
    client_name: string;
    client_email: string;
    client_id?: string | null;
    service_name: string;
    refund_amount?: number | null;
    refunded_at?: string | null;
    refund_reason?: string | null;
    // Prep / session fields
    birth_date?: string | null;
    birth_time?: string | null;
    birth_city?: string | null;
    questionnaire_responses?: Record<string, string | undefined> | null;
    username?: string;
    previous_session_count?: number;
    last_session_date?: string | null;
    metadata?: Record<string, unknown> | null;
    stripe_payment_intent_id?: string | null;
    base_price?: number | null;
  };
  linkedOrder?: LinkedOrder | null;
  /**
   * Server-computed "Open Service" link. NULL when the booking's service
   * is unmapped (button is hidden). Only set when viewer is a diviner/admin.
   */
  sessionLink?: string | null;
}

// Format an ISO string into the value expected by <input type="datetime-local">
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface SessionDetails {
  recording_url: string | null;
  recording_share_id: string | null;
  actual_duration_minutes: number | null;
  chime_meeting_id: string | null;
  video_provider: string | null;
  total_amount: number | null;
  overage_amount: number | null;
}

/**
 * Self-contained recording player. Auto-loads segments from S3 on mount
 * and plays them seamlessly as one video via SegmentVideoPlayer.
 */
function RecordingSection({
  bookingId,
  recordingUrl,
  shareId,
  syncingRecording,
  onSync,
}: {
  bookingId: string;
  recordingUrl: string | null;
  shareId: string | null;
  syncingRecording: boolean;
  onSync: () => void;
}) {
  const [segments, setSegments] = useState<{ key: string; size: number; url: string }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-load segments when component mounts
  const loadSegments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/recording-segments`);
      const data = await res.json();
      if (data.segments?.length > 0) {
        setSegments(data.segments);
      } else {
        setError("No recording segments found in S3");
      }
    } catch {
      setError("Failed to load recording");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadSegments();
  }, [loadSegments]);

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
      <div className="flex items-center gap-1.5">
        <Video className="size-3.5 text-muted-foreground" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recording</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading recording…</span>
        </div>
      ) : segments && segments.length > 0 ? (
        <>
          <SegmentVideoPlayer segments={segments} />
          {recordingUrl && (
            <a href={recordingUrl} download target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="w-full gap-2">
                <Download className="size-3.5" />Download Recording
              </Button>
            </a>
          )}
          {shareId && (
            <Button size="sm" variant="ghost" className="w-full gap-2 text-xs text-muted-foreground"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/session/${shareId}/recording`);
                toast.success("Share link copied");
              }}>
              <Share2 className="size-3.5" />Copy Client Share Link
            </Button>
          )}
        </>
      ) : error ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button size="sm" variant="outline" className="w-full gap-2" onClick={loadSegments}>
            <RefreshCw className="size-3.5" />Retry
          </Button>
          {!recordingUrl && (
            <Button size="sm" variant="outline" className="w-full gap-2" disabled={syncingRecording} onClick={onSync}>
              {syncingRecording ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              {syncingRecording ? "Syncing…" : "Sync Recording from S3"}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">No recording available yet.</p>
          <Button size="sm" variant="outline" className="w-full gap-2" disabled={syncingRecording} onClick={onSync}>
            {syncingRecording ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            {syncingRecording ? "Syncing…" : "Sync Recording from S3"}
          </Button>
        </div>
      )}
    </div>
  );
}

export function BookingDetailSheet({ booking, linkedOrder, sessionLink }: BookingDetailProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);

  // Fetch session/recording details when sheet opens
  useEffect(() => {
    if (!open || sessionDetails) return;
    setLoadingSession(true);
    fetch(`/api/bookings/${booking.id}/session-details`)
      .then((r) => r.json())
      .then((d) => setSessionDetails(d))
      .catch(() => setSessionDetails(null))
      .finally(() => setLoadingSession(false));
  }, [open, booking.id, sessionDetails]);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refunding, setRefunding] = useState(false);
  const [refunded, setRefunded] = useState(!!booking.refunded_at);
  const [syncing, setSyncing] = useState(false);
  const [syncingRecording, setSyncingRecording] = useState(false);
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

  // Note to client state
  const [clientNote, setClientNote] = useState("");
  const [sendingNote, setSendingNote] = useState(false);

  async function handleSaveNotes() {
    setSavingNotes(true);
    try {
      const res = await fetch("/api/bookings/session-notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, sessionNotes, role: "diviner" }),
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

  async function handleSendNote() {
    if (!clientNote.trim()) {
      toast.error("Please write a note before sending");
      return;
    }
    setSendingNote(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/send-note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: clientNote.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to send note");
        return;
      }
      const sent = (data.recipients as Array<{ email: string; success: boolean }>).filter((r) => r.success);
      toast.success(`Note sent to ${sent.length} recipient${sent.length !== 1 ? "s" : ""}`);
      setClientNote("");
    } catch {
      toast.error("Failed to send note");
    } finally {
      setSendingNote(false);
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

  async function handleSyncRecording() {
    setSyncingRecording(true);
    try {
      const res = await fetch("/api/admin/sync-recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to sync recording");
        return;
      }
      if (!data.synced) {
        toast.error(data.message ?? "No recording files found in S3 yet");
        return;
      }
      if (data.segmentCount > 1) {
        toast.success(`Synced — ${data.segmentCount} segments found. Use "Play Full Recording" for complete playback.`);
      } else {
        toast.success("Recording synced — reloading details");
      }
      setSessionDetails(null); // force refetch
    } catch {
      toast.error("Failed to sync recording");
    } finally {
      setSyncingRecording(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <ClipboardList className="mr-1.5 size-3.5" />
          Details
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Booking Details</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-5 p-4">

          {/* ── Session Details + Recording (COMPLETED — shown first) ──── */}
          {booking.status === "completed" && (
            loadingSession ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-4">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading session details…</p>
              </div>
            ) : sessionDetails?.chime_meeting_id ? (
              <>
                <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Video className="size-3.5 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Session Details</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Provider</p>
                      <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
                        {sessionDetails.video_provider ?? "chime"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Actual Duration</p>
                      <p className="font-medium">{sessionDetails.actual_duration_minutes ?? booking.duration} min</p>
                    </div>
                    {sessionDetails.total_amount != null && sessionDetails.total_amount > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground">Total Charged</p>
                        <p className="font-semibold">{formatCurrency(sessionDetails.total_amount / 100)}</p>
                      </div>
                    )}
                    {sessionDetails.actual_duration_minutes != null && sessionDetails.actual_duration_minutes > booking.duration && (
                      <div>
                        <p className="text-xs text-muted-foreground">Overage</p>
                        <p className="font-medium text-amber-500">+{sessionDetails.actual_duration_minutes - booking.duration} min</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Meeting ID</p>
                    <p className="text-xs font-mono text-foreground/60 break-all">{sessionDetails.chime_meeting_id}</p>
                  </div>
                </div>

                <RecordingSection
                  bookingId={booking.id}
                  recordingUrl={sessionDetails.recording_url}
                  shareId={sessionDetails.recording_share_id}
                  syncingRecording={syncingRecording}
                  onSync={handleSyncRecording}
                />

                <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <FileText className="size-3.5 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Transcript</p>
                  </div>
                  <p className="text-sm text-muted-foreground">No transcript saved. Full transcript persistence coming soon.</p>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/10 p-4 text-center">
                <Video className="mx-auto size-6 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No session data found.</p>
                <p className="text-xs text-muted-foreground mt-1">This session may not have used the Chime video provider.</p>
              </div>
            )
          )}

          {/* ── Info block ────────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className={statusColors[booking.status] ?? ""} variant="outline">
                {booking.status}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Client</p>
              <p className="text-sm font-medium">{booking.client_name}</p>
              <p className="text-xs text-muted-foreground">{booking.client_email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Service</p>
              <p className="text-sm font-medium">{booking.service_name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Date & Time</p>
                <p className="text-sm font-medium">{formatDateTime(booking.scheduled_at)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-medium">{booking.duration} min</p>
              </div>
            </div>
          </div>

          {/* ── Join Session (upcoming/in-progress only) ─────────────── */}
          {["confirmed", "in_progress", "pending"].includes(booking.status) && booking.username && (
            <Button
              className="w-full"
              onClick={() => {
                window.location.href = `/${booking.username}/session/${booking.id}`;
              }}
            >
              <Video className="mr-2 size-4" />
              Join Session
            </Button>
          )}

          {/* ── Open Service (toolkit) — diviner-only, hidden when unmapped ─ */}
          {sessionLink && (
            <Button asChild variant="secondary" className="w-full">
              <Link href={sessionLink}>
                <Sparkles className="mr-2 size-4" />
                Open Service
                <ExternalLink className="ml-2 size-3 opacity-70" />
              </Link>
            </Button>
          )}

          {/* ── Birth Data ────────────────────────────────────────────── */}
          {(booking.birth_date || booking.birth_time || booking.birth_city) && (
            <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Birth Data</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-mono">
                  {[booking.birth_date, booking.birth_time, booking.birth_city].filter(Boolean).join(" | ")}
                </p>
                <Button variant="ghost" size="icon" className="size-6"
                  onClick={() => {
                    navigator.clipboard.writeText([booking.birth_date, booking.birth_time, booking.birth_city].filter(Boolean).join(" | "));
                    toast.success("Copied");
                  }}>
                  <Copy className="size-3" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Previous Sessions ─────────────────────────────────────── */}
          {(booking.previous_session_count ?? 0) > 0 && (
            <div className="rounded-lg border bg-muted/20 p-3 space-y-1 text-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">History</p>
              <p>
                {booking.previous_session_count} previous session{(booking.previous_session_count ?? 0) > 1 ? "s" : ""}
                {booking.last_session_date && (
                  <span className="text-muted-foreground"> · Last: {formatDateTime(booking.last_session_date)}</span>
                )}
              </p>
            </div>
          )}

          {/* ── Questionnaire ─────────────────────────────────────────── */}
          {booking.questionnaire_responses && (() => {
            const q = booking.questionnaire_responses!;
            const items = [
              q.focusQuestion && { label: "Focus Question", value: q.focusQuestion },
              q.lifeArea && { label: "Life Area", value: q.lifeArea },
              q.additionalNotes && { label: "Client Notes", value: q.additionalNotes },
            ].filter(Boolean) as { label: string; value: string }[];
            if (!items.length) return null;
            return (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Intake</p>
                {items.map(({ label, value }) => (
                  <div key={label} className="rounded-md bg-muted p-2.5">
                    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                    <p className="text-sm">{value}</p>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* ── PRIMARY ACTIONS (always visible at top) ───────────────── */}
          {(canReschedule || canCancel || canRefund) && !showRescheduleForm && !showCancelForm && !showRefundForm && (
            <div className="flex flex-col gap-2">
              {canReschedule && (
                <Button variant="outline" className="w-full gap-2" onClick={() => setShowRescheduleForm(true)}>
                  <CalendarClock className="size-4" />
                  Reschedule
                </Button>
              )}
              {canCancel && (
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
              {canRefund && (
                <Button variant="outline" className="w-full gap-2" onClick={() => setShowRefundForm(true)}>
                  <RotateCcw className="size-4" />
                  Issue Refund
                </Button>
              )}
            </div>
          )}

          {/* ── Reschedule form ───────────────────────────────────────── */}
          {canReschedule && showRescheduleForm && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <h4 className="text-sm font-semibold">Reschedule Booking</h4>
              <p className="text-xs text-muted-foreground">Select a new date and time. The client will be notified by email.</p>
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
                <Button size="sm" onClick={handleReschedule} disabled={rescheduling}>
                  {rescheduling ? <><Loader2 className="mr-1.5 size-3.5 animate-spin" />Rescheduling…</> : "Confirm Reschedule"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setShowRescheduleForm(false); setNewScheduledAt(toDatetimeLocal(booking.scheduled_at)); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* ── Cancel form ───────────────────────────────────────────── */}
          {canCancel && showCancelForm && (
            <div className="space-y-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <h4 className="text-sm font-semibold text-red-500">Cancel Booking</h4>
              {booking.payment_intent_id && booking.amount > 0 && !refunded ? (
                <p className="text-xs text-muted-foreground">
                  This booking has a payment of <strong>{formatCurrency(booking.amount)}</strong>.
                  Cancelling will automatically issue a full refund to {booking.client_name}. This action cannot be undone.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  The booking will be cancelled and the client will be notified. This action cannot be undone.
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="cancel-reason">Reason for cancellation</Label>
                <Textarea id="cancel-reason" rows={3} placeholder="Provide a reason for cancellation…" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={handleCancel} disabled={canceling}>
                  {canceling ? <><Loader2 className="mr-1.5 size-3.5 animate-spin" />Processing…</> : (booking.payment_intent_id && booking.amount > 0 && !refunded ? "Cancel & Refund" : "Confirm Cancellation")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setShowCancelForm(false); setCancelReason(""); }}>Go Back</Button>
              </div>
            </div>
          )}

          {/* ── Refund form ───────────────────────────────────────────── */}
          {canRefund && showRefundForm && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <h4 className="text-sm font-semibold">Confirm Refund</h4>
              <p className="text-xs text-muted-foreground">
                You are about to refund <strong>{formatCurrency(booking.amount)}</strong> to {booking.client_name}. This action cannot be undone.
              </p>
              <div className="space-y-2">
                <Label htmlFor="refund-reason">Reason for refund</Label>
                <Textarea id="refund-reason" rows={3} placeholder="Provide a reason for this refund..." value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={handleRefund} disabled={refunding}>
                  {refunding ? <><Loader2 className="mr-2 size-4 animate-spin" />Processing…</> : "Confirm Refund"}
                </Button>
                <Button variant="outline" onClick={() => { setShowRefundForm(false); setRefundReason(""); }}>Cancel</Button>
              </div>
            </div>
          )}

          {/* ── Refund status ─────────────────────────────────────────── */}
          {refunded && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-500" />
                <p className="text-sm font-medium text-green-500">Refunded</p>
              </div>
              {booking.refund_amount && <p className="mt-1 text-xs text-muted-foreground">Amount: {formatCurrency(booking.refund_amount)}</p>}
              {booking.refunded_at && <p className="text-xs text-muted-foreground">Date: {formatDateTime(booking.refunded_at)}</p>}
              {booking.refund_reason && <p className="mt-1 text-xs text-muted-foreground">Reason: {booking.refund_reason}</p>}
            </div>
          )}

          {/* ── Payment Info ──────────────────────────────────────────── */}
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
                <Button size="sm" variant="outline" className="w-full mt-1 gap-1.5 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10" onClick={handleSyncPayment} disabled={syncing}>
                  {syncing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                  {syncing ? "Checking…" : "Sync Payment Status"}
                </Button>
              )}
            </div>
          )}

          {/* ── Linked Order ──────────────────────────────────────────── */}
          {linkedOrder && (
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Receipt className="size-3.5 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Linked Order</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">${Number(linkedOrder.amount).toFixed(2)} {linkedOrder.currency.toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground font-mono">{linkedOrder.id.slice(0, 8)}…</p>
                </div>
                <span className={["inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
                  linkedOrder.status === "completed" ? "border-green-500/20 bg-green-500/10 text-green-500" :
                  linkedOrder.status === "refunded" ? "border-red-500/20 bg-red-500/10 text-red-500" :
                  linkedOrder.status === "pending" ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-500" :
                  "border-border bg-muted text-muted-foreground"].join(" ")}>
                  {linkedOrder.status}
                </span>
              </div>
              <Link href="/dashboard/orders">
                <Button size="sm" variant="ghost" className="w-full text-xs mt-1 text-muted-foreground">View all orders →</Button>
              </Link>
            </div>
          )}

          {/* ── Notes ────────────────────────────────────────────────── */}
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

          {/* ── Session Notes (completed only) ────────────────────────── */}
          {booking.status === "completed" && (
            <div className="space-y-2">
              <Label htmlFor="session-notes" className="flex items-center gap-1.5">
                <NotebookPen className="size-3.5" />
                Session Notes
                <span className="text-xs font-normal text-muted-foreground">(private)</span>
              </Label>
              <Textarea id="session-notes" rows={4} placeholder="Add notes about this session…" value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} />
              <Button size="sm" variant="outline" onClick={handleSaveNotes} disabled={savingNotes}>
                {savingNotes ? <><Loader2 className="mr-1.5 size-3.5 animate-spin" />Saving…</> : "Save Notes"}
              </Button>
            </div>
          )}


          {/* ── Client's Session Notes (read-only for diviner) ────────── */}
          {booking.client_session_notes && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <NotebookPen className="size-3.5" />
                Client&apos;s Notes
                <span className="text-xs font-normal text-muted-foreground">(from client)</span>
              </Label>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{booking.client_session_notes}</p>
              </div>
            </div>
          )}

          {/* ── Note to Client ────────────────────────────────────────── */}
          {booking.status !== "canceled" && (
            <div className="space-y-2 rounded-lg border bg-muted/20 p-4">
              <Label htmlFor="client-note" className="flex items-center gap-1.5">
                <Send className="size-3.5" />
                Note to Client
                {booking.client_email && (
                  <span className="ml-auto text-xs font-normal text-muted-foreground truncate max-w-[160px]">→ {booking.client_email}</span>
                )}
              </Label>
              <Textarea id="client-note" rows={3} placeholder="Write a note to send to your client…" value={clientNote} onChange={(e) => setClientNote(e.target.value)} />
              <Button size="sm" onClick={handleSendNote} disabled={sendingNote || !clientNote.trim()} className="gap-1.5">
                {sendingNote ? <><Loader2 className="size-3.5 animate-spin" />Sending…</> : <><Send className="size-3.5" />Send to Client</>}
              </Button>
            </div>
          )}

        </div>
      </SheetContent>
    </Sheet>
  );
}
