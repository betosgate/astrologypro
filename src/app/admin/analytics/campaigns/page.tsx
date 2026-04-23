"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  MousePointerClick,
  Target,
  Eye,
  DollarSign,
  Download,
} from "lucide-react";

interface LeaderboardRow {
  campaign_id: string;
  campaign_name: string;
  campaign_code: string;
  owner_type: "diviner" | "affiliate";
  diviner_id: string | null;
  diviner_username: string | null;
  owner_affiliate_id: string | null;
  owner_affiliate_type: "diviner_affiliate" | "social_advocate" | null;
  owner_affiliate_username: string | null;
  destination_type: "PROFILE" | "SERVICE" | null;
  destination_label: string;
  status: string;
  clicks: number;
  unique_clicks: number;
  views: number;
  conversions: number;
  ctr: number;
  cvr: number;
  order_revenue_cents: number;
  commission_cents: number;
  created_at: string;
}

const PERIODS = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
  { label: "All", value: "all" },
] as const;

const SORTS = [
  { label: "Clicks", value: "clicks" },
  { label: "Conversions", value: "conversions" },
  { label: "Commission", value: "commission" },
  { label: "Revenue", value: "revenue" },
  { label: "CTR", value: "ctr" },
  { label: "CVR", value: "cvr" },
  { label: "Views", value: "views" },
] as const;

function fmtCents(c: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
}

function fmtPct(v: number) {
  return `${(v * 100).toFixed(2)}%`;
}

export default function AdminCampaignLeaderboard() {
  const [range, setRange] = useState<(typeof PERIODS)[number]["value"]>("30d");
  const [ownerType, setOwnerType] = useState<"all" | "diviner" | "affiliate">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused" | "archived">("all");
  const [sort, setSort] = useState<(typeof SORTS)[number]["value"]>("clicks");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterQuery = useMemo(() => {
    const p = new URLSearchParams({
      range,
      owner_type: ownerType,
      status: statusFilter,
      sort,
      order: "desc",
      limit: "100",
    });
    if (search.trim()) p.set("search", search.trim());
    return p.toString();
  }, [range, ownerType, statusFilter, sort, search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics/campaigns?${filterQuery}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string; title?: string };
        setError(body.detail ?? body.title ?? `HTTP ${res.status}`);
        return;
      }
      const json = (await res.json()) as { rows: LeaderboardRow[]; total: number };
      setRows(json.rows ?? []);
      setTotal(json.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [filterQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.clicks += r.clicks;
        acc.views += r.views;
        acc.conversions += r.conversions;
        acc.commission += r.commission_cents;
        return acc;
      },
      { clicks: 0, views: 0, conversions: 0, commission: 0 },
    );
  }, [rows]);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Campaign Leaderboard</h1>
          <p className="text-xs text-muted-foreground">
            Every campaign ranked by performance — diviner-owned and affiliate-owned.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setRange(p.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors border ${
                range === p.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-input text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
          <select
            className="flex h-8 rounded-md border border-input bg-transparent px-2 text-xs"
            value={ownerType}
            onChange={(e) => setOwnerType(e.target.value as typeof ownerType)}
          >
            <option value="all">All owners</option>
            <option value="diviner">Diviner-owned</option>
            <option value="affiliate">Affiliate-owned</option>
          </select>
          <select
            className="flex h-8 rounded-md border border-input bg-transparent px-2 text-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </select>
          <select
            className="flex h-8 rounded-md border border-input bg-transparent px-2 text-xs"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                Sort: {s.label}
              </option>
            ))}
          </select>
          <input
            className="flex h-8 rounded-md border border-input bg-transparent px-2 text-xs"
            placeholder="Search name / code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <a
            href={`/api/admin/analytics/campaigns/export?${filterQuery}`}
            className="inline-flex items-center gap-1 h-8 rounded-md border border-input px-3 text-xs font-medium hover:bg-muted"
            download
          >
            <Download className="size-3.5" />
            Export CSV
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi icon={MousePointerClick} label="Clicks" value={summary.clicks.toLocaleString()} />
        <Kpi icon={Eye} label="Views" value={summary.views.toLocaleString()} />
        <Kpi icon={Target} label="Conversions" value={summary.conversions.toLocaleString()} />
        <Kpi icon={DollarSign} label="Commission" value={fmtCents(summary.commission)} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            Campaigns ({rows.length}
            {total > rows.length ? ` of ${total}` : ""})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">Loading…</div>
          ) : error ? (
            <div className="py-12 text-center text-xs text-destructive">{error}</div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">No data</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">Conv.</TableHead>
                    <TableHead className="text-right">CVR</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.campaign_id}>
                      <TableCell className="font-medium">
                        <div>{r.campaign_name}</div>
                        <p className="text-[10px] text-muted-foreground font-mono">{r.campaign_code}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {r.owner_type}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {r.owner_type === "diviner"
                            ? r.diviner_username ?? "—"
                            : r.owner_affiliate_username ?? "—"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">{r.destination_label}</div>
                        <p className="text-[10px] text-muted-foreground capitalize">
                          {r.destination_type?.toLowerCase() ?? "—"}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">{r.clicks.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{r.views.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{fmtPct(r.ctr)}</TableCell>
                      <TableCell className="text-right">{r.conversions.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{fmtPct(r.cvr)}</TableCell>
                      <TableCell className="text-right">{fmtCents(r.order_revenue_cents)}</TableCell>
                      <TableCell className="text-right font-medium">{fmtCents(r.commission_cents)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {r.status}
                        </Badge>
                      </TableCell>
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
