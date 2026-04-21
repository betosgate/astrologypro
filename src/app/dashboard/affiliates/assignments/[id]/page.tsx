"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Ban, MousePointerClick, TrendingUp, DollarSign, Users } from "lucide-react";
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

interface AssignmentDetail {
  assignment: {
    id: string;
    destination_type: "PROFILE" | "SERVICE";
    destination_name: string;
    affiliate_id: string;
    affiliate_type: string;
    affiliate_name: string;
    affiliate_email: string | null;
    commission_type: "percent" | "flat";
    commission_value: number;
    is_active: boolean;
    assigned_at: string;
    revoked_at: string | null;
    notes: string | null;
  };
  kpis: {
    period: string;
    clicks: number;
    unique_clicks: number;
    conversions: number;
    commission_cents: number;
  };
  daily: Array<{ date: string; clicks: number; conversions: number }>;
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    campaign_code: string | null;
    clicks: number;
    conversions: number;
    commission_cents: number;
  }>;
  conversions: Array<{
    id: string;
    booking_id: string | null;
    converted_at: string;
    order_amount_cents: number;
    commission_amount_cents: number;
    reversed_at: string | null;
  }>;
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

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/affiliate-assignments/${id}?period=${period}`);
      if (res.ok) setData(await res.json());
      else toast.error("Failed to load assignment");
    } finally {
      setLoading(false);
    }
  }, [id, period]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRevoke() {
    if (!confirm("Revoke this assignment?")) return;
    const res = await fetch(`/api/dashboard/affiliate-assignments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: false }),
    });
    if (res.ok) {
      toast.success("Revoked");
      load();
    } else {
      toast.error("Failed to revoke");
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">Loading…</div>;
  }
  if (!data) {
    return (
      <div className="py-24 text-center space-y-3">
        <p className="text-sm text-muted-foreground">Assignment not found.</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/affiliates/assignments">Back</Link>
        </Button>
      </div>
    );
  }

  const { assignment, kpis, daily, campaigns, conversions } = data;
  const maxDaily = Math.max(1, ...daily.map((d) => d.clicks));

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/affiliates/assignments">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">{assignment.affiliate_name}</h1>
              <Badge variant="outline" className="text-[10px]">
                {assignment.affiliate_type === "social_advocate" ? "Advocate" : "Affiliate"}
              </Badge>
              <Badge variant={assignment.is_active ? "default" : "secondary"}>
                {assignment.is_active ? "Active" : "Revoked"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {assignment.destination_type === "PROFILE" ? "Profile" : `Service: ${assignment.destination_name}`}
              {" · "}
              Commission:{" "}
              {assignment.commission_type === "percent"
                ? `${assignment.commission_value}%`
                : `$${assignment.commission_value}`}
            </p>
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
          {assignment.is_active && (
            <Button variant="outline" size="sm" className="ml-2 text-destructive" onClick={handleRevoke}>
              <Ban className="mr-1.5 size-3.5" />
              Revoke
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <KpiCard icon={MousePointerClick} label="Clicks" value={kpis.clicks} />
        <KpiCard icon={Users} label="Unique Clicks" value={kpis.unique_clicks} />
        <KpiCard icon={TrendingUp} label="Conversions" value={kpis.conversions} />
        <KpiCard icon={DollarSign} label="Commission" value={fmtCents(kpis.commission_cents)} />
      </div>

      {/* Daily chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Activity Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {daily.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No activity for this period</p>
          ) : (
            <div className="flex items-end gap-0.5 h-24 w-full">
              {daily.map((d, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-end group relative"
                  title={`${d.date}: ${d.clicks} clicks, ${d.conversions} conv`}
                >
                  <div
                    className="w-full rounded-sm bg-primary/30 group-hover:bg-primary/60 transition-colors"
                    style={{ height: `${(d.clicks / maxDaily) * 100}%`, minHeight: d.clicks > 0 ? "2px" : "0" }}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaigns */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Campaigns from This Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              This affiliate hasn't created any campaigns for this assignment yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Conv.</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="font-mono text-xs">{c.campaign_code ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{c.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{c.clicks}</TableCell>
                    <TableCell className="text-right">{c.conversions}</TableCell>
                    <TableCell className="text-right">{fmtCents(c.commission_cents)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Conversions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Conversion Log ({period})</CardTitle>
        </CardHeader>
        <CardContent>
          {conversions.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No conversions in this period.</p>
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
                {conversions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{fmtDate(c.converted_at)}</TableCell>
                    <TableCell className="font-mono text-xs">{c.booking_id?.slice(0, 8) ?? "—"}</TableCell>
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

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
