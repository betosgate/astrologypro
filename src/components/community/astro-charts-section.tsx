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
import { Loader2, Moon, Sun, Info, ChevronLeft, ChevronRight } from "lucide-react";
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

type NatalChartItem = {
  id: string;
  natal_chart: Record<string, unknown>;
  full_name: string;
  date_of_birth: string;
};

type ApiResponse = {
  natalChart: NatalChartData;
  /**
   * community-natal-carousel Task 02 (2026-04-26): the API now returns the
   * full list of family members with charts so the dashboard card can render
   * a member carousel. Older responses won't include this field — fall back
   * to the singular `natalChart` for back-compat.
   */
  natalCharts?: NatalChartItem[];
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
  /**
   * community-natal-carousel Task 02 (2026-04-26): the dashboard ready
   * state is a member carousel. `natalCharts` is the full list returned
   * by /api/community/astro-charts; `activeChartIndex` is the slot the
   * user has cycled to. Old API responses without the `natalCharts` field
   * fall back to a one-item list built from the legacy `natalChart`
   * field (see fetch handler below).
   */
  const [natalCharts, setNatalCharts] = useState<NatalChartItem[]>([]);
  const [activeChartIndex, setActiveChartIndex] = useState(0);
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

        if (data.monthlyTransit) setMonthlyTransit(data.monthlyTransit);

        // Carousel: prefer the explicit list when the API returns one.
        // Old API responses still produce a one-item list from natalChart.
        const nextCharts: NatalChartItem[] =
          Array.isArray(data.natalCharts) && data.natalCharts.length > 0
            ? data.natalCharts
            : data.natalChart
            ? [data.natalChart as NatalChartItem]
            : [];
        setNatalCharts(nextCharts);
        // Keep the active index in range when the list shrinks (e.g. a
        // family member is removed and the chart count drops by one).
        setActiveChartIndex((idx) =>
          nextCharts.length === 0 ? 0 : Math.min(idx, nextCharts.length - 1)
        );

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
              <CardTitle className="text-sm">Natal Charts</CardTitle>
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
              Browse saved natal charts for you and your household members, and
              open the full chart details for any available profile.
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
          ) : natalStatus === "ready" && natalCharts.length > 0 ? (
            // community-natal-carousel Task 02 (2026-04-26):
            // The ready-state used to be a single static member block. It's
            // now a lightweight member carousel — prev/next chevrons cycle
            // through every household member with a saved chart, the active
            // member's name + DOB + chart-ready badge are shown, and the
            // View Full Chart deep-link follows the active member's id.
            //
            // For a one-item list the chevrons are hidden so the layout
            // doesn't feel overbuilt for the single-chart case (Scenario 2
            // in the QA checklist).
            (() => {
              const safeIndex = Math.min(
                Math.max(activeChartIndex, 0),
                natalCharts.length - 1
              );
              const active = natalCharts[safeIndex];
              const total = natalCharts.length;
              const isMulti = total > 1;
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="default" className="text-xs shrink-0">
                        Chart Ready
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">
                        {active.full_name}
                      </span>
                    </div>
                    {isMulti && (
                      <span
                        className="text-[10px] text-muted-foreground tabular-nums shrink-0"
                        aria-label={`Member ${safeIndex + 1} of ${total}`}
                      >
                        {safeIndex + 1} / {total}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    DOB:{" "}
                    {new Date(
                      active.date_of_birth + "T12:00:00"
                    ).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {isMulti && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8 shrink-0"
                        aria-label="Previous member"
                        onClick={() =>
                          setActiveChartIndex((idx) =>
                            (idx - 1 + total) % total
                          )
                        }
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                    )}
                    {/*
                      Deep-link into the family-member detail route where
                      the shared HoroscopeToolkitPage renders the chart.
                      Uses the *active* carousel member, not always the
                      first one.
                    */}
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/community/family/${active.id}`}>
                        View Full Chart →
                      </Link>
                    </Button>
                    {isMulti && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8 shrink-0"
                        aria-label="Next member"
                        onClick={() =>
                          setActiveChartIndex((idx) => (idx + 1) % total)
                        }
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="space-y-2">
              {/*
                Task 04: keep empty-state copy honest — do not imply a generation
                job is running. Link straight to the shared toolkit route
                (`/community/horoscope`), where the user can complete birth
                data or render their chart.
              */}
              <p className="text-xs text-muted-foreground">
                No natal chart found yet. Open Horoscope to generate or view your chart.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/community/horoscope">Open Horoscope</Link>
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
              <Button asChild variant="outline" size="sm">
                <Link href="/community/transits">Check Transits Page</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
