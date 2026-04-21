"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, DollarSign, MousePointerClick, TrendingUp } from "lucide-react";

interface AffRow {
  affiliate_id: string;
  affiliate_type: "social_advocate" | "diviner_affiliate";
  name: string;
  email: string | null;
  active_assignments: number;
  active_campaigns: number;
  clicks: number;
  unique_clicks: number;
  conversions: number;
  gmv_cents: number;
  commission_cents: number;
}

interface Summary {
  period: string;
  active_affiliates: number;
  active_assignments: number;
  total_commission_cents: number;
  total_gmv_cents: number;
  total_conversions: number;
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

export default function AdminAffiliateLeaderboard() {
  const [period, setPeriod] = useState("30d");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [rows, setRows] = useState<AffRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (typeFilter) params.set("affiliate_type", typeFilter);
      const res = await fetch(`/api/admin/analytics/affiliates?${params}`);
      if (res.ok) {
        const json = await res.json();
        setSummary(json.summary);
        setRows(json.affiliates ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [period, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Affiliate Leaderboard</h1>
          <p className="text-xs text-muted-foreground">
            Cross-platform: every affiliate with an assignment or any activity.
          </p>
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
          <select
            className="ml-2 flex h-8 w-auto rounded-md border border-input bg-transparent px-2 text-xs"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All types</option>
            <option value="social_advocate">Advocates</option>
            <option value="diviner_affiliate">Affiliates</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Kpi icon={Users} label="Active Affiliates" value={summary.active_affiliates} />
          <Kpi icon={Users} label="Active Assignments" value={summary.active_assignments} />
          <Kpi
            icon={MousePointerClick}
            label="Conversions"
            value={summary.total_conversions}
          />
          <Kpi icon={TrendingUp} label="GMV" value={fmtCents(summary.total_gmv_cents)} />
          <Kpi icon={DollarSign} label="Commission" value={fmtCents(summary.total_commission_cents)} />
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Affiliates ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">No data</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Assignments</TableHead>
                    <TableHead className="text-right">Campaigns</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Unique</TableHead>
                    <TableHead className="text-right">Conv.</TableHead>
                    <TableHead className="text-right">GMV</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={`${r.affiliate_type}-${r.affiliate_id}`}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/analytics/affiliates/${r.affiliate_id}?type=${r.affiliate_type}`}
                          className="hover:underline"
                        >
                          {r.name}
                        </Link>
                        {r.email && (
                          <p className="text-[10px] text-muted-foreground">{r.email}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {r.affiliate_type === "social_advocate" ? "Advocate" : "Affiliate"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{r.active_assignments}</TableCell>
                      <TableCell className="text-right">{r.active_campaigns}</TableCell>
                      <TableCell className="text-right">{r.clicks}</TableCell>
                      <TableCell className="text-right">{r.unique_clicks}</TableCell>
                      <TableCell className="text-right">{r.conversions}</TableCell>
                      <TableCell className="text-right">{fmtCents(r.gmv_cents)}</TableCell>
                      <TableCell className="text-right font-medium">{fmtCents(r.commission_cents)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
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
