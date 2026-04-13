"use client";

import { useCallback, useEffect, useState, type ElementType } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Globe2, MapPin, MousePointerClick, Users, Clock3 } from "lucide-react";
import type { DivinerTrafficReportResponse } from "@/app/api/admin/reports/diviner-traffic/route";

const PERIODS = [
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "1y", label: "1 Year" },
  { value: "all", label: "All Time" },
] as const;

function pct(part: number, total: number): string {
  if (total <= 0) return "0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

export default function DivinerTrafficReportPage() {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<DivinerTrafficReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports/diviner-traffic?period=${period}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json: DivinerTrafficReportResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={load}>Retry</Button>
      </div>
    );
  }

  if (!data) return null;

  const maxHourly = Math.max(...data.hourly.map((row) => row.hits), 1);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Diviner Traffic Report</h1>
          <p className="text-sm text-muted-foreground">
            Top diviners by tracked hits with country, location, source, time, and partner attribution.
          </p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((item) => (
            <Button
              key={item.value}
              size="sm"
              variant={period === item.value ? "default" : "outline"}
              onClick={() => setPeriod(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Updating...
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Hits" value={String(data.summary.totalHits)} icon={MousePointerClick} />
        <StatCard label="Unique Visitors" value={String(data.summary.uniqueVisitors)} icon={Users} />
        <StatCard
          label="Affiliate Related"
          value={`${data.summary.affiliateHits} (${pct(data.summary.affiliateHits, data.summary.totalHits)})`}
          icon={Globe2}
        />
        <StatCard
          label="Advocate Related"
          value={`${data.summary.advocateHits} (${pct(data.summary.advocateHits, data.summary.totalHits)})`}
          icon={Globe2}
        />
        <StatCard
          label="Organic / Non-Partner"
          value={`${data.summary.organicHits} (${pct(data.summary.organicHits, data.summary.totalHits)})`}
          icon={MapPin}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Diviners By Hits</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Diviner</TableHead>
                <TableHead>Hits</TableHead>
                <TableHead>Unique</TableHead>
                <TableHead>Affiliate</TableHead>
                <TableHead>Advocate</TableHead>
                <TableHead>Top Country</TableHead>
                <TableHead>Top Location</TableHead>
                <TableHead>Top Source</TableHead>
                <TableHead>Last Hit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topDiviners.map((row) => (
                <TableRow key={row.divinerId}>
                  <TableCell>
                    <div className="font-medium">{row.divinerName}</div>
                    <div className="text-xs text-muted-foreground">@{row.username || "unknown"}</div>
                  </TableCell>
                  <TableCell>{row.hits}</TableCell>
                  <TableCell>{row.uniqueVisitors}</TableCell>
                  <TableCell>{row.affiliateHits}</TableCell>
                  <TableCell>{row.advocateHits}</TableCell>
                  <TableCell>{row.topCountry}</TableCell>
                  <TableCell>{row.topLocation}</TableCell>
                  <TableCell>{row.topSource}</TableCell>
                  <TableCell>{row.lastHitAt ? new Date(row.lastHitAt).toLocaleString() : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <BreakdownCard title="Top Countries" rows={data.countries} />
        <BreakdownCard title="Top Locations" rows={data.locations} />
        <BreakdownCard title="Top Sources" rows={data.sources} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hit Distribution By Hour</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {data.hourly.map((row) => {
              const width = Math.max((row.hits / maxHourly) * 100, row.hits > 0 ? 10 : 0);
              return (
                <div key={row.hour} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Clock3 className="size-4 text-muted-foreground" />
                    {row.hour}
                  </div>
                  <div className="mb-2 h-2 rounded bg-muted">
                    <div className="h-2 rounded bg-primary" style={{ width: `${width}%` }} />
                  </div>
                  <div className="text-sm font-semibold">{row.hits} hits</div>
                  <div className="text-xs text-muted-foreground">
                    {row.affiliateHits} affiliate · {row.advocateHits} advocate
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function BreakdownCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; hits: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data.</p>
        ) : (
          rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4">
              <span className="truncate text-sm">{row.label}</span>
              <span className="text-sm font-semibold">{row.hits}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
