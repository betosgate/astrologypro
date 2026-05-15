"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type RsvpStatus = "going" | "maybe" | "not_going";

interface Props {
  eventId: string;
  initialStatus: RsvpStatus | null;
  initialCounts: { going: number; maybe: number };
  onStatusChange?: (status: RsvpStatus | null, counts: { going: number; maybe: number }) => void;
}

export function EventRsvpButton({ eventId, initialStatus, initialCounts, onStatusChange }: Props) {
  const [status, setStatus] = useState<RsvpStatus | null>(initialStatus);
  const [counts, setCounts] = useState(initialCounts);
  const [loading, setLoading] = useState(false);

  function applyState(nextStatus: RsvpStatus | null, nextCounts: { going: number; maybe: number }) {
    setStatus(nextStatus);
    setCounts(nextCounts);
    onStatusChange?.(nextStatus, nextCounts);
  }

  async function handleRsvp(next: RsvpStatus) {
    if (loading) return;
    setLoading(true);

    // Optimistic update
    const prev = status;
    const prevCounts = { ...counts };
    const newCounts = { ...counts };

    // Remove previous count contribution
    if (prev === "going") newCounts.going = Math.max(0, newCounts.going - 1);
    if (prev === "maybe") newCounts.maybe = Math.max(0, newCounts.maybe - 1);

    if (next === status) {
      // Toggle off — DELETE
      applyState(null, newCounts);
      try {
        const res = await fetch(`/api/community/events/${eventId}/rsvp`, {
          method: "DELETE",
        });
        if (!res.ok) {
          applyState(prev, prevCounts);
        }
      } catch {
        applyState(prev, prevCounts);
      }
    } else {
      // Upsert new status
      if (next === "going") newCounts.going += 1;
      if (next === "maybe") newCounts.maybe += 1;
      applyState(next, newCounts);
      try {
        const res = await fetch(`/api/community/events/${eventId}/rsvp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
        if (!res.ok) {
          applyState(prev, prevCounts);
        }
      } catch {
        applyState(prev, prevCounts);
      }
    }

    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => handleRsvp("going")}
          aria-pressed={status === "going"}
          className={cn(
            "h-7 px-2.5 text-xs gap-1",
            status === "going" && "bg-green-500/10 border-green-400 text-green-700 hover:bg-green-500/20"
          )}
        >
          <Check className="size-3" />
          Going
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => handleRsvp("maybe")}
          aria-pressed={status === "maybe"}
          className={cn(
            "h-7 px-2.5 text-xs gap-1",
            status === "maybe" && "bg-yellow-500/10 border-yellow-400 text-yellow-700 hover:bg-yellow-500/20"
          )}
        >
          <HelpCircle className="size-3" />
          Maybe
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => handleRsvp("not_going")}
          aria-pressed={status === "not_going"}
          className={cn(
            "h-7 px-2.5 text-xs gap-1",
            status === "not_going" && "bg-red-500/10 border-red-400 text-red-700 hover:bg-red-500/20"
          )}
        >
          <X className="size-3" />
          Can&apos;t Go
        </Button>
      </div>
      {(counts.going > 0 || counts.maybe > 0) && (
        <p className="text-xs text-muted-foreground">
          {counts.going > 0 && `${counts.going} going`}
          {counts.going > 0 && counts.maybe > 0 && " · "}
          {counts.maybe > 0 && `${counts.maybe} maybe`}
        </p>
      )}
    </div>
  );
}
