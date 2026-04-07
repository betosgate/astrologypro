"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SessionTimerProps {
  /** Whether the session has started (starts the clock) */
  running: boolean;
  /** Whether the session has ended (stops the clock) */
  ended?: boolean;
  /** Booked duration in minutes — used to detect overtime */
  scheduledDuration: number;
  /** Base session price for cost display */
  basePrice: number;
  /** Per-minute overage rate */
  overageRate: number;
  /** Compact single-line display (for header bars); full card otherwise */
  compact?: boolean;
  /** Called every second with current elapsed seconds */
  onTick?: (elapsedSeconds: number) => void;
}

function formatTime(minutes: number, seconds: number): string {
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * SessionTimer — Billable time display for live reading sessions.
 *
 * Tracks elapsed wall-clock time from when `running` becomes true.
 * Highlights overtime in amber/red and shows running cost.
 * Can be rendered as a compact inline badge (for nav bars) or a full card.
 */
export function SessionTimer({
  running,
  ended = false,
  scheduledDuration,
  basePrice,
  overageRate,
  compact = false,
  onTick,
}: SessionTimerProps) {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    if (running && !ended) {
      startTimeRef.current = new Date();
      timerRef.current = setInterval(() => {
        if (!startTimeRef.current) return;
        const totalSeconds = Math.floor(
          (Date.now() - startTimeRef.current.getTime()) / 1000
        );
        setElapsedMinutes(Math.floor(totalSeconds / 60));
        setElapsedSeconds(totalSeconds % 60);
        onTick?.(totalSeconds);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, ended, onTick]);

  const isOvertime = elapsedMinutes >= scheduledDuration;
  const overtimeMinutes = isOvertime ? elapsedMinutes - scheduledDuration : 0;
  const totalCost = basePrice + overtimeMinutes * overageRate;

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tabular-nums",
          isOvertime
            ? "bg-red-500/15 text-red-400 border border-red-500/30"
            : "bg-muted/60 text-muted-foreground border border-border/50"
        )}
        aria-live="polite"
        aria-label={`Session time: ${formatTime(elapsedMinutes, elapsedSeconds)}${isOvertime ? " — overtime" : ""}`}
      >
        {isOvertime ? (
          <AlertTriangle className="size-3 shrink-0" aria-hidden="true" />
        ) : (
          <Clock className="size-3 shrink-0" aria-hidden="true" />
        )}
        {formatTime(elapsedMinutes, elapsedSeconds)}
        {isOvertime && (
          <span className="opacity-80">+{overtimeMinutes}m OT</span>
        )}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-2",
        isOvertime
          ? "border-red-500/30 bg-red-500/5"
          : "border-border bg-card"
      )}
      aria-live="polite"
    >
      {/* Timer display */}
      <div className="flex items-center gap-2">
        {isOvertime ? (
          <AlertTriangle className="size-4 text-red-500 shrink-0" aria-hidden="true" />
        ) : (
          <Clock className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
        )}
        <span className="text-2xl font-bold tabular-nums">
          {formatTime(elapsedMinutes, elapsedSeconds)}
        </span>
        {isOvertime && (
          <Badge variant="outline" className="text-xs border-red-500/30 text-red-500 bg-red-500/10">
            Overtime
          </Badge>
        )}
      </div>

      {/* Overtime detail */}
      {isOvertime && (
        <p className="text-xs text-red-500/80">
          +{overtimeMinutes} min over — ${(overtimeMinutes * overageRate).toFixed(2)} overage
        </p>
      )}

      {/* Running cost */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Running total</span>
        <span className="font-bold text-primary">${totalCost.toFixed(2)}</span>
      </div>

      {/* Progress bar — scheduled vs elapsed */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isOvertime ? "bg-red-500" : "bg-primary"
          )}
          style={{
            width: `${Math.min(100, (elapsedMinutes / scheduledDuration) * 100)}%`,
          }}
          role="progressbar"
          aria-valuenow={elapsedMinutes}
          aria-valuemin={0}
          aria-valuemax={scheduledDuration}
          aria-label={`${elapsedMinutes} of ${scheduledDuration} scheduled minutes elapsed`}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {elapsedMinutes} / {scheduledDuration} min scheduled
      </p>
    </div>
  );
}
