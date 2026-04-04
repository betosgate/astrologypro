"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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

// Poll Supabase for chart/transit data every 10 seconds until found
const POLL_INTERVAL_MS = 10_000;
const MAX_POLLS = 18; // ~3 minutes

export function AstroChartsSection() {
  const [natalChart, setNatalChart] = useState<NatalChartData>(null);
  const [monthlyTransit, setMonthlyTransit] = useState<ChartData>(null);
  const [natalLoading, setNatalLoading] = useState(true);
  const [transitLoading, setTransitLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);
  const [showTooltip, setShowTooltip] = useState<"natal" | "transit" | null>(null);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    let polls = 0;

    async function fetchCharts() {
      const res = await fetch("/api/community/astro-charts");
      if (!res.ok) return;
      const data = await res.json();

      if (data.natalChart) {
        setNatalChart(data.natalChart);
        setNatalLoading(false);
      }
      if (data.monthlyTransit) {
        setMonthlyTransit(data.monthlyTransit);
        setTransitLoading(false);
      }

      polls += 1;
      setPollCount(polls);

      // Stop polling when both are loaded or max polls reached
      if ((data.natalChart && data.monthlyTransit) || polls >= MAX_POLLS) {
        clearInterval(intervalId);
        // If max polls reached, stop loading states
        if (polls >= MAX_POLLS) {
          setNatalLoading(false);
          setTransitLoading(false);
        }
      }
    }

    fetchCharts();
    intervalId = setInterval(fetchCharts, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
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
          {natalLoading ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {pollCount === 0
                  ? "Checking for your chart..."
                  : "Your chart is being prepared..."}
              </p>
            </div>
          ) : natalChart ? (
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
                No natal chart found. Add a family member to generate one.
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
          {transitLoading ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {pollCount === 0
                  ? "Checking for transit data..."
                  : "Monthly transit is being calculated..."}
              </p>
            </div>
          ) : monthlyTransit ? (
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
                No transit data for this month yet. Generated on the 1st of each month.
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
