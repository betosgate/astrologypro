"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DeepDive {
  affiliate: {
    id: string;
    name: string;
    email: string;
    type: "social_advocate" | "diviner_affiliate";
    joined_at: string;
  };
  period: string;
  kpis: {
    active_assignments: number;
    active_campaigns: number;
    clicks: number;
    unique_clicks: number;
    conversions: number;
    gmv_cents: number;
    commission_cents: number;
  };
  assignments: Array<{
    id: string;
    diviner_name: string;
    destination_type: string;
    destination_name: string;
    commission_type: string;
    commission_value: number;
    is_active: boolean;
    assigned_at: string;
  }>;
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    diviner_name: string;
    campaign_code: string | null;
    destination_name: string;
  }>;
  daily: Array<{ date: string; clicks: number; conversions: number }>;
  conversions: Array<{
    id: string;
    booking_id: string | null;
    converted_at: string;
    order_amount_cents: number;
    commission_amount_cents: number;
    reversed_at: string | null;
  }>;
  abuse_signals: {
    total_clicks: number;
    bot_clicks: number;
    bot_rate_pct: number;
    clicks_per_unique: number;
    top_ip_share_pct: number;
  };
}

const PERIODS = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
  { label: "All", value: "all" },
];

function fmtCents(c: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AdminAffiliateDeepDive({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const type = (searchParams.get("type") ?? "social_advocate") as
    | "social_advocate"
    | "diviner_affiliate";
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<DeepDive | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/analytics/affiliates/${id}?type=${type}&period=${period}`
      );
      if (res.ok) setData(await res.json());
      else toast.error("Failed to load affiliate");
    } finally {
      setLoading(false);
    }
  }, [id, type, period]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="py-24 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!data) return <div className="py-24 text-center text-sm text-muted-foreground">Not found</div>;

  const maxDaily = Math.max(1, ...data.daily.map((d) => d.clicks));
  const redFlags = [
    data.abuse_signals.bot_rate_pct > 30 && "High bot rate",
    data.abuse_signals.clicks_per_unique > 5 && "Very high clicks-per-unique ratio",
    data.abuse_signals.top_ip_share_pct > 60 && "Traffic concentrated from one IP",
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/analytics/affiliates">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">{data.affiliate.name}</h1>
              <Badge variant="outline" className="text-[10px]">
                {data.affiliate.type === "social_advocate" ? "Advocate" : "Affiliate"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{data.affiliate.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors border ${
                period === p.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-input text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
        <Kpi label="Active Assignments" value={data.kpis.active_assignments} />
        <Kpi label="Active Campaigns" value={data.kpis.active_campaigns} />
        <Kpi label="Clicks" value={data.kpis.clicks} />
        <Kpi label="Conversions" value={data.kpis.conversions} />
        <Kpi label="Commission" value={fmtCents(data.kpis.commission_cents)} />
      </div>

      {/* Red-flag panel */}
      {redFlags.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-50 dark:bg-amber-950/10">
          <CardContent className="py-3 flex items-start gap-2.5">
            <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Abuse signals</p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                {redFlags.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Bot: {data.abuse_signals.bot_rate_pct}%, clicks/unique: {data.abuse_signals.clicks_per_unique},
                top-IP share: {data.abuse_signals.top_ip_share_pct}%
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Activity Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {data.daily.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No activity</p>
          ) : (
            <div className="flex items-end gap-0.5 h-24 w-full">
              {data.daily.map((d, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-end group relative"
                  title={`${d.date}: ${d.clicks} clicks, ${d.conversions} conv`}
                >
                  <div
                    className="w-full rounded-sm bg-primary/30 group-hover:bg-primary/60"
                    style={{ height: `${(d.clicks / maxDaily) * 100}%`, minHeight: d.clicks > 0 ? "2px" : "0" }}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignments */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Assignments ({data.assignments.length})</CardTitle></CardHeader>
        <CardContent>
          {data.assignments.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">None</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Diviner</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.assignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.diviner_name}</TableCell>
                    <TableCell>{a.destination_name}</TableCell>
                    <TableCell>
                      {a.commission_type === "percent" ? `${a.commission_value}%` : `$${a.commission_value}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.is_active ? "default" : "secondary"}>
                        {a.is_active ? "Active" : "Revoked"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Conversions */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Conversions</CardTitle></CardHeader>
        <CardContent>
          {data.conversions.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">None</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead className="text-right">Order</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.conversions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{fmtDate(c.converted_at)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {c.booking_id ? (
                        <Link href={`/admin/bookings/${c.booking_id}`} className="hover:underline">
                          {c.booking_id.slice(0, 8)}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">{fmtCents(c.order_amount_cents)}</TableCell>
                    <TableCell className="text-right font-medium">{fmtCents(c.commission_amount_cents)}</TableCell>
                    <TableCell>
                      {c.reversed_at ? (
                        <Badge variant="destructive">Reversed</Badge>
                      ) : (
                        <Badge variant="default">Credited</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
