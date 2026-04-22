"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Moon, Sun, Info } from "lucide-react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────
type ChartData = {
  id: string;
  member_id: string;
  month: string;
  transit_data: Record<string, unknown>;
  created_at: string;
} | null;

type NatalChartData = {
  id: string;
  natal_chart: Record<string, unknown>;
  full_name: string;
  date_of_birth: string;
} | null;

type ChartStatus = "loading" | "ready" | "empty" | "pending" | "failed";

type ApiStatus = "ready" | "empty" | "pending" | "failed";

type ApiResponse = {
  natalChart: NatalChartData;
  monthlyTransit: ChartData;
  // Older responses won't include status — treat as inferred from data.
  status?: { natal: ApiStatus; transit: ApiStatus };
};

// Polling is reserved for real "pending" (background generation) states.
// Confirmed empty/failed/ready responses stop fetching immediately so the
// dashboard doesn't sit on a spinner for minutes when no data exists.
const POLL_INTERVAL_MS = 10_000;
const MAX_PENDING_POLLS = 18; // ~3 minutes, only while explicitly pending
const MAX_ERROR_RETRIES = 2;

export function AstroChartsSection() {
  const [natalChart, setNatalChart] = useState<NatalChartData>(null);
  const [monthlyTransit, setMonthlyTransit] = useState<ChartData>(null);
  const [natalStatus, setNatalStatus] = useState<ChartStatus>("loading");
  const [transitStatus, setTransitStatus] = useState<ChartStatus>("loading");
  const [showTooltip, setShowTooltip] = useState<"natal" | "transit" | null>(null);

  // Refs for values we want to read inside the interval without re-running it.
  const errorCountRef = useRef(0);
  const pendingPollsRef = useRef(0);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    function stopPolling() {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    async function fetchCharts() {
      try {
        const res = await fetch("/api/community/astro-charts");
        if (!res.ok) {
          errorCountRef.current += 1;
          if (errorCountRef.current >= MAX_ERROR_RETRIES) {
            if (cancelled) return;
            setNatalStatus("failed");
            setTransitStatus("failed");
            stopPolling();
          }
          return;
        }

        const data: ApiResponse = await res.json();
        if (cancelled) return;

        errorCountRef.current = 0;

        // Infer status from payload shape when the API hasn't been updated yet.
        const natal: ApiStatus =
          data.status?.natal ?? (data.natalChart ? "ready" : "empty");
        const transit: ApiStatus =
          data.status?.transit ?? (data.monthlyTransit ? "ready" : "empty");

        if (data.natalChart) setNatalChart(data.natalChart);
        if (data.monthlyTransit) setMonthlyTransit(data.monthlyTransit);

        setNatalStatus(natal);
        setTransitStatus(transit);

        // Keep polling only while the backend says something is genuinely
        // pending. "empty" and "ready" are terminal states.
        const anyPending = natal === "pending" || transit === "pending";
        if (!anyPending) {
          stopPolling();
          return;
        }

        pendingPollsRef.current += 1;
        if (pendingPollsRef.current >= MAX_PENDING_POLLS) {
          // Give up gracefully instead of spinning forever.
          if (natal === "pending") setNatalStatus("empty");
          if (transit === "pending") setTransitStatus("empty");
          stopPolling();
        }
      } catch {
        errorCountRef.current += 1;
        if (errorCountRef.current >= MAX_ERROR_RETRIES && !cancelled) {
          setNatalStatus("failed");
          setTransitStatus("failed");
          stopPolling();
        }
      }
    }

    fetchCharts();
    intervalId = setInterval(fetchCharts, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      stopPolling();
    };
  }, []);

  return (
    <div className="space-y-3">
      {/* Natal Chart Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="size-4 text-amber-500" />
              <CardTitle className="text-sm">Your Natal Chart</CardTitle>
            </div>
            <button
              type="button"
              aria-label="About natal chart"
              onClick={() =>
                setShowTooltip(showTooltip === "natal" ? null : "natal")
              }
              className="text-muted-foreground hover:text-foreground"
            >
              <Info className="size-4" />
            </button>
          </div>
          {showTooltip === "natal" && (
            <div className="mt-2 rounded-md border bg-muted/50 p-2 text-xs text-muted-foreground">
              Your natal chart is a snapshot of the sky at the exact moment of
              your birth. It reveals your core nature, strengths, and life themes.
            </div>
          )}
        </CardHeader>
        <CardContent>
          {natalStatus === "loading" || natalStatus === "pending" ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {natalStatus === "pending"
                  ? "Your chart is being prepared..."
                  : "Checking chart data..."}
              </p>
            </div>
          ) : natalStatus === "failed" ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Could not load chart data. Try refreshing the page.
              </p>
            </div>
          ) : natalStatus === "ready" && natalChart ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">Chart Ready</Badge>
                <span className="text-xs text-muted-foreground">
                  {natalChart.full_name}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                DOB:{" "}
                {new Date(natalChart.date_of_birth + "T12:00:00").toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric", year: "numeric" }
                )}
              </p>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/community/family">View Full Chart →</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                No natal chart found yet. Generate your chart from Family or Horoscope.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/community/family">Add Family Member</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Transit Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="size-4 text-blue-500" />
              <CardTitle className="text-sm">Monthly Transit</CardTitle>
            </div>
            <button
              type="button"
              aria-label="About monthly transit"
              onClick={() =>
                setShowTooltip(showTooltip === "transit" ? null : "transit")
              }
              className="text-muted-foreground hover:text-foreground"
            >
              <Info className="size-4" />
            </button>
          </div>
          {showTooltip === "transit" && (
            <div className="mt-2 rounded-md border bg-muted/50 p-2 text-xs text-muted-foreground">
              Monthly transits show how current planetary movements are affecting
              your natal chart — revealing opportunities and challenges for the month ahead.
            </div>
          )}
        </CardHeader>
        <CardContent>
          {transitStatus === "loading" || transitStatus === "pending" ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {transitStatus === "pending"
                  ? "Monthly transit is being calculated..."
                  : "Checking chart data..."}
              </p>
            </div>
          ) : transitStatus === "failed" ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Could not load chart data. Try refreshing the page.
              </p>
            </div>
          ) : transitStatus === "ready" && monthlyTransit ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs bg-blue-500">Ready</Badge>
                <span className="text-xs text-muted-foreground">
                  {monthlyTransit.month}
                </span>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/community/transits">View Detailed Transit Report →</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                No monthly transit data found for this month yet.
              </p>
              <Button asChild variant="ghost" size="sm">
                <Link href="/community/transits">Check Transits Page</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
