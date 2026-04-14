"use client";

import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Layers, Circle } from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SignalPoint = {
  entity_id: string;
  name: string;
  flag_emoji: string | null;
  lat: number;
  lng: number;
  score: number;
  score_date: string;
};

interface WorldMapSignalOverlayProps {
  onSignalsChange: (signals: SignalPoint[] | null) => void;
}

// ─── Score helpers ────────────────────────────────────────────────────────────

function scoreLevel(score: number): "low" | "medium" | "high" {
  if (score <= 3) return "low";
  if (score <= 6) return "medium";
  return "high";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WorldMapSignalOverlay({ onSignalsChange }: WorldMapSignalOverlayProps) {
  const [overlayOn, setOverlayOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signals, setSignals] = useState<SignalPoint[] | null>(null);

  // Time slider: -180 to +30 days from today, default 0 (today)
  const [sliderValue, setSliderValue] = useState(0);

  const today = new Date();
  const viewingDate = new Date(today);
  viewingDate.setDate(viewingDate.getDate() + sliderValue);
  const viewingDateStr = viewingDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mundane/world-map/signals");
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail ?? "Failed to load signal data");
        return null;
      }
      const json = await res.json();
      return (json.signals ?? []) as SignalPoint[];
    } catch {
      toast.error("Network error loading signals");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  async function toggleOverlay() {
    if (overlayOn) {
      // Turn off
      setOverlayOn(false);
      setSignals(null);
      onSignalsChange(null);
      return;
    }

    // Turn on — fetch if not already loaded
    const data = signals ?? await fetchSignals();
    if (data) {
      setSignals(data);
      onSignalsChange(data);
      setOverlayOn(true);
    }
  }

  // Counts by level
  const counts = { low: 0, medium: 0, high: 0 };
  for (const s of signals ?? []) {
    counts[scoreLevel(s.score)]++;
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardContent className="p-4 space-y-4">
        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={overlayOn ? "default" : "outline"}
            size="sm"
            onClick={toggleOverlay}
            disabled={loading}
            className={overlayOn ? "bg-violet-600 hover:bg-violet-700 border-violet-600" : ""}
          >
            {loading ? (
              <><Loader2 className="size-4 animate-spin mr-1.5" />Loading…</>
            ) : (
              <><Layers className="size-4 mr-1.5" />Signal Overlay</>
            )}
          </Button>

          {overlayOn && signals && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-medium">{signals.length}</span> entities with scores
            </div>
          )}
        </div>

        {/* Time slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Time Reference</p>
            <Badge variant="outline" className="text-xs">
              {sliderValue === 0 ? "Today" : sliderValue > 0 ? `+${sliderValue}d` : `${sliderValue}d`}
              {" — "}{viewingDateStr}
            </Badge>
          </div>
          <input
            type="range"
            min={-180}
            max={30}
            step={1}
            value={sliderValue}
            onChange={(e) => setSliderValue(parseInt(e.target.value, 10))}
            className="w-full accent-violet-500"
            aria-label="Time reference slider"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>−180 days</span>
            <span>Today</span>
            <span>+30 days</span>
          </div>
          <p className="text-[11px] text-muted-foreground/70">
            Visual reference only — signal scores are from the most recent 30-day window.
          </p>
        </div>

        {/* Signal Legend */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Signal Legend</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <Circle className="size-3 fill-green-500 text-green-500" />
              <span className="text-green-400 font-medium">Low stress</span>
              <span className="text-muted-foreground">(0–3)</span>
              {overlayOn && <Badge variant="outline" className="text-[10px] border-green-500/20 text-green-400 ml-1">{counts.low}</Badge>}
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Circle className="size-3 fill-amber-500 text-amber-500" />
              <span className="text-amber-400 font-medium">Medium stress</span>
              <span className="text-muted-foreground">(4–6)</span>
              {overlayOn && <Badge variant="outline" className="text-[10px] border-amber-500/20 text-amber-400 ml-1">{counts.medium}</Badge>}
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Circle className="size-3 fill-red-500 text-red-500" />
              <span className="text-red-400 font-medium">High stress</span>
              <span className="text-muted-foreground">(7–10)</span>
              {overlayOn && <Badge variant="outline" className="text-[10px] border-red-500/20 text-red-400 ml-1">{counts.high}</Badge>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
