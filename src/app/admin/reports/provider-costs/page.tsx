"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Video, Phone, TrendingDown, DollarSign } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface VideoProviderStats {
  sessions: number;
  totalMinutes: number;
  estimatedCost: number;
  costPerMinute: number;
}

interface PhoneProviderStats {
  sessions: number;
  totalMinutes: number;
  totalCost: number;
  costPerMinute: number;
}

interface Savings {
  amount: number;
  percent: number;
}

interface PhoneSessionRow {
  provider: string;
  count: number;
  totalPlatformCost: number;
  totalCharged: number;
  avgDuration: number;
}

interface MonthlyCostRow {
  month: string;
  dailyCost: number;
  chimeCost: number;
  twilioCost: number;
  chimePhoneCost: number;
}

interface ProviderCostData {
  video: {
    daily: VideoProviderStats;
    chime: VideoProviderStats;
    savings: Savings;
  };
  phone: {
    twilio: PhoneProviderStats;
    chime: PhoneProviderStats;
    savings: Savings;
  };
  phoneSessions: PhoneSessionRow[];
  monthlyCosts: MonthlyCostRow[];
}

// ─── Period options ──────────────────────────────────────────────────────────

const PERIODS = [
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
  { label: "1 year", value: "1y" },
  { label: "All time", value: "all" },
] as const;

// ─── Formatters ──────────────────────────────────────────────────────────────

function fmtCurrency(n: number): string {
  return `$${n.toFixed(2)}`;
}

function fmtNumber(n: number): string {
  return n.toLocaleString();
}

function fmtRate(n: number): string {
  return `$${n.toFixed(4)}/min`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProviderCostReportPage() {
  const [data, setData] = useState<ProviderCostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("30d");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/reports/provider-costs?period=${period}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? `Request failed (${res.status})`);
      }
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Loading / Error states ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading provider cost data...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4 p-6">
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "#f5f0e8" }}
        >
          Provider Cost Report
        </h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-destructive">
              {error ?? "No data available"}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchData}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Derived values ─────────────────────────────────────────────────────

  const maxMonthlyCost = Math.max(
    ...data.monthlyCosts.map(
      (m) => m.dailyCost + m.chimeCost + m.twilioCost + m.chimePhoneCost
    ),
    1
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "#f5f0e8" }}
          >
            Provider Cost Report
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "rgba(184,188,208,0.6)" }}
          >
            Compare costs across video and phone providers.
          </p>
        </div>

        {/* Period selector */}
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              size="sm"
              variant={period === p.value ? "default" : "outline"}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ─── Video Provider Comparison ─────────────────────────────────────── */}
      <div>
        <h2
          className="mb-3 flex items-center gap-2 text-lg font-semibold"
          style={{ color: "#f5f0e8" }}
        >
          <Video className="size-5" />
          Video Provider Comparison
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Daily.co Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Daily.co</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sessions</span>
                <span className="font-medium">
                  {fmtNumber(data.video.daily.sessions)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Minutes</span>
                <span className="font-medium">
                  {fmtNumber(data.video.daily.totalMinutes)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Cost</span>
                <span className="font-medium">
                  {fmtCurrency(data.video.daily.estimatedCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost / Min</span>
                <span className="font-medium">
                  {fmtRate(data.video.daily.costPerMinute)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Chime Video Card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Amazon Chime</CardTitle>
                {data.video.savings.percent > 0 && (
                  <Badge className="bg-green-600/20 text-green-400 hover:bg-green-600/30">
                    <TrendingDown className="mr-1 size-3" />
                    Saves {data.video.savings.percent}% (
                    {fmtCurrency(data.video.savings.amount)})
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sessions</span>
                <span className="font-medium">
                  {fmtNumber(data.video.chime.sessions)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Minutes</span>
                <span className="font-medium">
                  {fmtNumber(data.video.chime.totalMinutes)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Cost</span>
                <span className="font-medium">
                  {fmtCurrency(data.video.chime.estimatedCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost / Min</span>
                <span className="font-medium">
                  {fmtRate(data.video.chime.costPerMinute)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Phone Provider Comparison ─────────────────────────────────────── */}
      <div>
        <h2
          className="mb-3 flex items-center gap-2 text-lg font-semibold"
          style={{ color: "#f5f0e8" }}
        >
          <Phone className="size-5" />
          Phone Provider Comparison
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Twilio Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Twilio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sessions</span>
                <span className="font-medium">
                  {fmtNumber(data.phone.twilio.sessions)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Minutes</span>
                <span className="font-medium">
                  {fmtNumber(data.phone.twilio.totalMinutes)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Cost</span>
                <span className="font-medium">
                  {fmtCurrency(data.phone.twilio.totalCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost / Min</span>
                <span className="font-medium">
                  {fmtRate(data.phone.twilio.costPerMinute)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Chime PSTN Card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Chime PSTN</CardTitle>
                {data.phone.savings.percent > 0 && (
                  <Badge className="bg-green-600/20 text-green-400 hover:bg-green-600/30">
                    <TrendingDown className="mr-1 size-3" />
                    Saves {data.phone.savings.percent}% (
                    {fmtCurrency(data.phone.savings.amount)})
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sessions</span>
                <span className="font-medium">
                  {fmtNumber(data.phone.chime.sessions)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Minutes</span>
                <span className="font-medium">
                  {fmtNumber(data.phone.chime.totalMinutes)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Cost</span>
                <span className="font-medium">
                  {fmtCurrency(data.phone.chime.totalCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost / Min</span>
                <span className="font-medium">
                  {fmtRate(data.phone.chime.costPerMinute)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Monthly Cost Trend ────────────────────────────────────────────── */}
      {data.monthlyCosts.length > 0 && (
        <div>
          <h2
            className="mb-3 flex items-center gap-2 text-lg font-semibold"
            style={{ color: "#f5f0e8" }}
          >
            <DollarSign className="size-5" />
            Monthly Cost Trend
          </h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {data.monthlyCosts.map((m) => {
                  const total =
                    m.dailyCost + m.chimeCost + m.twilioCost + m.chimePhoneCost;
                  const pctDaily = (m.dailyCost / maxMonthlyCost) * 100;
                  const pctChime = (m.chimeCost / maxMonthlyCost) * 100;
                  const pctTwilio = (m.twilioCost / maxMonthlyCost) * 100;
                  const pctChimePhone =
                    (m.chimePhoneCost / maxMonthlyCost) * 100;

                  return (
                    <div key={m.month} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-medium">
                          {m.month}
                        </span>
                        <span className="font-medium">
                          {fmtCurrency(total)}
                        </span>
                      </div>
                      <div className="flex h-5 w-full overflow-hidden rounded bg-muted/30">
                        {pctDaily > 0 && (
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${pctDaily}%` }}
                            title={`Daily.co: ${fmtCurrency(m.dailyCost)}`}
                          />
                        )}
                        {pctChime > 0 && (
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${pctChime}%` }}
                            title={`Chime Video: ${fmtCurrency(m.chimeCost)}`}
                          />
                        )}
                        {pctTwilio > 0 && (
                          <div
                            className="h-full bg-orange-500"
                            style={{ width: `${pctTwilio}%` }}
                            title={`Twilio: ${fmtCurrency(m.twilioCost)}`}
                          />
                        )}
                        {pctChimePhone > 0 && (
                          <div
                            className="h-full bg-teal-500"
                            style={{ width: `${pctChimePhone}%` }}
                            title={`Chime PSTN: ${fmtCurrency(m.chimePhoneCost)}`}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="size-3 rounded bg-blue-500" />
                  Daily.co
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-3 rounded bg-emerald-500" />
                  Chime Video
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-3 rounded bg-orange-500" />
                  Twilio
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-3 rounded bg-teal-500" />
                  Chime PSTN
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Phone Session Details Table ───────────────────────────────────── */}
      {data.phoneSessions.length > 0 && (
        <div>
          <h2
            className="mb-3 text-lg font-semibold"
            style={{ color: "#f5f0e8" }}
          >
            Phone Session Details
          </h2>
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Provider</th>
                      <th className="pb-2 pr-4 font-medium text-right">
                        Sessions
                      </th>
                      <th className="pb-2 pr-4 font-medium text-right">
                        Platform Cost
                      </th>
                      <th className="pb-2 pr-4 font-medium text-right">
                        Revenue
                      </th>
                      <th className="pb-2 pr-4 font-medium text-right">
                        Avg Duration
                      </th>
                      <th className="pb-2 font-medium text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.phoneSessions.map((ps) => {
                      const margin =
                        ps.totalCharged > 0
                          ? Math.round(
                              ((ps.totalCharged - ps.totalPlatformCost) /
                                ps.totalCharged) *
                                100
                            )
                          : 0;
                      return (
                        <tr key={ps.provider} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-medium capitalize">
                            {ps.provider === "chime"
                              ? "Chime PSTN"
                              : "Twilio"}
                          </td>
                          <td className="py-2 pr-4 text-right">
                            {fmtNumber(ps.count)}
                          </td>
                          <td className="py-2 pr-4 text-right">
                            {fmtCurrency(ps.totalPlatformCost)}
                          </td>
                          <td className="py-2 pr-4 text-right">
                            {fmtCurrency(ps.totalCharged)}
                          </td>
                          <td className="py-2 pr-4 text-right">
                            {ps.avgDuration} min
                          </td>
                          <td className="py-2 text-right">
                            <Badge
                              variant="outline"
                              className={
                                margin >= 90
                                  ? "border-green-500/50 text-green-400"
                                  : margin >= 70
                                    ? "border-yellow-500/50 text-yellow-400"
                                    : "border-red-500/50 text-red-400"
                              }
                            >
                              {margin}%
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
