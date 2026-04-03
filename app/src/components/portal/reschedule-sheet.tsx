"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RotateCcw } from "lucide-react";

interface RescheduleSheetProps {
  bookingId: string;
  serviceName: string;
  divinerName: string;
}

export function RescheduleSheet({
  bookingId,
  serviceName,
  divinerName,
}: RescheduleSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const [preferredDate, setPreferredDate] = useState("");
  const [timePreference, setTimePreference] = useState("");
  const [notes, setNotes] = useState("");

  // Get today's date in YYYY-MM-DD for min attribute
  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!preferredDate || !timePreference) {
      setError("Please select a preferred date and time of day.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/portal/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, preferredDate, timePreference, notes }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setDone(true);
      router.refresh();
      setTimeout(() => {
        setOpen(false);
        setDone(false);
        setPreferredDate("");
        setTimePreference("");
        setNotes("");
      }, 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
      >
        <RotateCcw className="mr-1 size-3" />
        Reschedule
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Request Reschedule</SheetTitle>
            <p className="text-sm text-muted-foreground">
              Request a new time for your{" "}
              <span className="font-medium text-foreground">{serviceName}</span>{" "}
              with{" "}
              <span className="font-medium text-foreground">{divinerName}</span>
            </p>
          </SheetHeader>

          {done ? (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="text-2xl">✓</div>
              <p className="font-medium text-foreground">Request sent!</p>
              <p className="text-sm text-muted-foreground">
                Your diviner will be in touch to confirm a new time.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="reschedule-date">Preferred new date</Label>
                <input
                  id="reschedule-date"
                  type="date"
                  min={today}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="reschedule-time">Time of day preference</Label>
                <Select value={timePreference} onValueChange={setTimePreference}>
                  <SelectTrigger id="reschedule-time">
                    <SelectValue placeholder="Select a preference..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Morning">Morning (before noon)</SelectItem>
                    <SelectItem value="Afternoon">Afternoon (12pm – 5pm)</SelectItem>
                    <SelectItem value="Evening">Evening (after 5pm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="reschedule-notes">
                  Any other info for your reader?{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="reschedule-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. I'm flexible on the exact time, just need a weekday…"
                  rows={3}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <SheetFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Request Reschedule"
                  )}
                </Button>
              </SheetFooter>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
