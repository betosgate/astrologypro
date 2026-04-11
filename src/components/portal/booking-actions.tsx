"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarClock, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface BookingActionsProps {
  bookingId: string;
  divinerUsername: string;
  isUpcoming: boolean;
}

export function BookingActions({
  bookingId,
  divinerUsername,
  isUpcoming,
}: BookingActionsProps) {
  const router = useRouter();
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  async function handleCancel() {
    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to cancel booking");
      }
      toast.success("Booking cancelled. All attendees have been notified.");
      setShowCancel(false);
      router.push("/portal/bookings");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <>
      <div className="flex gap-3">
        {isUpcoming && divinerUsername && (
          <Button
            variant="outline"
            className="flex-1 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
            onClick={() => router.push(`/${divinerUsername}/reschedule/${bookingId}`)}
          >
            <CalendarClock className="mr-2 size-4" />
            Reschedule
          </Button>
        )}
        <Button
          variant="destructive"
          className="flex-1"
          onClick={() => setShowCancel(true)}
        >
          <XCircle className="mr-2 size-4" />
          Cancel Booking
        </Button>
      </div>

      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Cancel Booking
            </DialogTitle>
            <DialogDescription>
              This will cancel the booking, remove it from Google Calendar, and notify all attendees.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="cancel-reason" className="text-sm">
              Reason for cancellation (optional)
            </Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Let the practitioner know why..."
              rows={3}
              className="mt-1"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowCancel(false)} disabled={cancelling}>
              Keep Booking
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? <Loader2 className="mr-2 size-4 animate-spin" /> : <XCircle className="mr-2 size-4" />}
              Yes, Cancel It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
