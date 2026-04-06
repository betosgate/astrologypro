"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CalendarDays,
  Clock,
  Printer,
  Video,
  CalendarRange,
  XCircle,
  Loader2,
  CheckCircle2,
  UserCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Diviner {
  display_name: string;
  username: string;
  avatar_url?: string | null;
  timezone?: string | null;
}

interface Service {
  name: string;
  description?: string | null;
}

interface Client {
  full_name: string;
}

interface Booking {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  cancellation_reason?: string | null;
  booking_token: string;
  booking_notes?: string | null;
  daily_room_url?: string | null;
  clients: Client | null;
  services: Service | null;
  diviners: Diviner | null;
}

interface BookingManageClientProps {
  booking: Booking;
  bookingToken: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatLocalDate(isoString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(new Date(isoString));
}

function isWithinJoinWindow(scheduledAt: string): boolean {
  const now = Date.now();
  const sessionTime = new Date(scheduledAt).getTime();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  return now >= sessionTime - windowMs && now <= sessionTime + 60 * 60 * 1000;
}

function statusBadge(status: string) {
  switch (status) {
    case "confirmed":
    case "pending":
      return (
        <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wide">
          Confirmed
        </Badge>
      );
    case "rescheduled":
      return (
        <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold uppercase tracking-wide">
          Rescheduled
        </Badge>
      );
    case "canceled":
      return (
        <Badge className="bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold uppercase tracking-wide">
          Canceled
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold uppercase tracking-wide">
          Completed
        </Badge>
      );
    default:
      return (
        <Badge className="bg-white/10 text-white/60 border border-white/10 text-xs font-semibold uppercase tracking-wide">
          {status}
        </Badge>
      );
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BookingManageClient({ booking, bookingToken }: BookingManageClientProps) {
  const [cancelReason, setCancelReason] = useState("");
  const [canceling, setCanceling] = useState(false);
  const [canceled, setCanceled] = useState(booking.status === "canceled");
  const [cancelError, setCancelError] = useState("");
  const [localDate, setLocalDate] = useState<string | null>(null);
  const [joinVisible, setJoinVisible] = useState(false);

  const diviner = booking.diviners;
  const service = booking.services;
  const isCanceled = canceled || booking.status === "canceled";
  const isCompleted = booking.status === "completed";

  // Detect local time on client only (avoids hydration mismatch)
  useEffect(() => {
    setLocalDate(formatLocalDate(booking.scheduled_at));
    setJoinVisible(isWithinJoinWindow(booking.scheduled_at));
  }, [booking.scheduled_at]);

  async function handleCancel() {
    setCanceling(true);
    setCancelError("");
    try {
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_token: bookingToken,
          reason: cancelReason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCancelError(data.error ?? "Failed to cancel. Please try again.");
      } else {
        setCanceled(true);
      }
    } catch {
      setCancelError("Network error. Please try again.");
    } finally {
      setCanceling(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Canceled success state
  // ---------------------------------------------------------------------------
  if (isCanceled && canceled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-8 text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle2 className="size-14 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white mb-2">Booking Canceled</h1>
            <p className="text-white/60 text-sm leading-relaxed">
              Your booking has been canceled. We hope to see you again soon.
            </p>
          </div>
          {diviner && (
            <Link
              href={`/${diviner.username}`}
              className="inline-block px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors"
            >
              Book Again with {diviner.display_name}
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main layout
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header — Diviner */}
        <div className="px-8 pt-8 pb-6 border-b border-white/10 flex items-center gap-4">
          <div className="shrink-0">
            {diviner?.avatar_url ? (
              <Image
                src={diviner.avatar_url}
                alt={diviner.display_name ?? "Diviner"}
                width={64}
                height={64}
                className="rounded-full object-cover ring-2 ring-purple-500/40"
              />
            ) : (
              <div className="size-16 rounded-full bg-purple-900/60 border border-purple-500/30 flex items-center justify-center">
                <UserCircle className="size-9 text-purple-400" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-0.5">Your Session</p>
            <h1 className="text-white font-semibold text-lg leading-tight truncate">
              {diviner?.display_name ?? "Your Practitioner"}
            </h1>
            {service?.name && (
              <p className="text-purple-300 text-sm font-medium mt-0.5">{service.name}</p>
            )}
          </div>
          <div className="ml-auto shrink-0">
            {statusBadge(isCanceled ? "canceled" : booking.status)}
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-5">

          {/* Service description */}
          {service?.description && (
            <p className="text-white/50 text-sm leading-relaxed">{service.description}</p>
          )}

          {/* Date / Time */}
          <div className="flex items-start gap-3">
            <CalendarDays className="size-4 text-purple-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-white text-sm font-medium">
                {localDate ?? new Date(booking.scheduled_at).toUTCString()}
              </p>
              <p className="text-white/40 text-xs mt-0.5">your local time</p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-3">
            <Clock className="size-4 text-purple-400 shrink-0" />
            <p className="text-white/70 text-sm">{booking.duration_minutes} minutes</p>
          </div>

          {/* Client notes */}
          {booking.booking_notes && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-white/50 text-xs uppercase tracking-wider mb-1.5">Your Notes</p>
              <p className="text-white/70 text-sm leading-relaxed">{booking.booking_notes}</p>
            </div>
          )}

          {/* Cancellation reason */}
          {isCanceled && booking.cancellation_reason && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
              <p className="text-red-400 text-xs uppercase tracking-wider mb-1.5">Cancellation Reason</p>
              <p className="text-white/70 text-sm leading-relaxed">{booking.cancellation_reason}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isCanceled && !isCompleted && (
          <div className="px-8 pb-8 space-y-3">

            {/* Join Session */}
            {joinVisible && booking.daily_room_url && (
              <a
                href={booking.daily_room_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
              >
                <Video className="size-4" />
                Join Session
              </a>
            )}

            {/* Reschedule */}
            {diviner && (
              <Link
                href={`/${diviner.username}?rescheduling=true`}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-white/20 hover:bg-white/10 text-white text-sm font-semibold transition-colors"
              >
                <CalendarRange className="size-4" />
                Reschedule
              </Link>
            )}

            {/* Cancel */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors"
                >
                  <XCircle className="size-4 mr-2" />
                  Cancel Booking
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-900 border border-white/10 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Cancel this booking?</AlertDialogTitle>
                  <AlertDialogDescription className="text-white/60">
                    This action cannot be undone. Please let us know if there is a reason for the cancellation (optional).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation (optional)"
                  rows={3}
                  className="w-full rounded-lg bg-white/5 border border-white/10 text-white/80 placeholder:text-white/30 text-sm px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                {cancelError && (
                  <p className="text-red-400 text-sm">{cancelError}</p>
                )}
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-white/10 border-white/10 text-white hover:bg-white/20 hover:text-white">
                    Keep Booking
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    disabled={canceling}
                    className="bg-red-600 hover:bg-red-500 text-white"
                  >
                    {canceling ? (
                      <><Loader2 className="size-4 mr-2 animate-spin" />Canceling…</>
                    ) : (
                      "Yes, Cancel"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Footer */}
        <div className="px-8 pb-6 flex justify-end">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-xs transition-colors"
          >
            <Printer className="size-3" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
