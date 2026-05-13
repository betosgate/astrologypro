"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  Eye,
  Users,
  DollarSign,
  Target,
  Megaphone,
  BarChart3,
  TrendingUp,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle,
  Link2,
  Search,
  ChevronLeft,
  ChevronRight,
  FilterX,
  RefreshCw,
} from "lucide-react";
import { CampaignDestinationPicker, type DestinationValue } from "@/components/dashboard/campaign-destination-picker";
import { CampaignUrlDisplay } from "@/components/dashboard/campaign-url-display";
import { CampaignDestinationBadge } from "@/components/dashboard/campaign-destination-badge";
import { cn } from "@/lib/utils";

/* ─────────────── Campaign list types ─────────────── */

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string;
  end_date: string | null;
  commission_type: string;
  commission_value: number;
  budget_cap_cents: number | null;
  spent_cents: number;
  target_product_type: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  affiliates_count: number;
  conversions_count: number;
  total_commission_cents: number;
  created_at: string;
  // Destination fields
  destination_type: "PROFILE" | "SERVICE" | null;
  destination_service_template_id: string | null;
  campaign_code: string | null;
  share_url: string | null;
  auto_paused_at: string | null;
  auto_pause_reason: string | null;
}

interface CreatedCampaignResult {
  id: string;
  name: string;
  campaign_code: string | null;
  share_url: string | null;
  destination_type: "PROFILE" | "SERVICE" | null;
  status?: string | null;
}

const STATUS_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  paused: "outline",
  expired: "destructive",
  archived: "outline",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "expired", label: "Expired" },
  { value: "archived", label: "Archived" },
];

function fmtCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ─────────────── Analytics (reports) types ─────────────── */

interface ReportSummary {
  totalCampaigns: number;
  activeCampaigns: number;
  totalConversions: number;
  totalRevenue: number;
  totalCommissionsPaid: number;
  avgROI: number;
}

interface CampaignRow {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  affiliates: number;
  clicks: number;
  uniqueClicks: number;
  conversions: number;
  revenue: number;
  commissionSpent: number;
  budgetCap: number;
  budgetUsedPct: number;
  roi: number;
}

interface MonthlyRow {
  month: string;
  conversions: number;
  revenue: number;
  commissions: number;
}

interface ReportData {
  summary: ReportSummary;
  campaigns: CampaignRow[];
  monthly: MonthlyRow[];
}

const REPORT_STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  paused: "secondary",
  archived: "outline",
  expired: "destructive",
};

function fmtCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function fmtReportDate(iso: string | null) {
  if (!iso) return "--";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtMonth(ym: string) {
  const [y, m] = ym.split("-");
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function budgetColor(pct: number): string {
  if (pct > 95) return "bg-red-500";
  if (pct >= 80) return "bg-amber-500";
  return "bg-emerald-500";
}

const PERIODS = [
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "1y", label: "1 year" },
  { value: "all", label: "All time" },
] as const;

type SortKey = "revenue" | "conversions" | "roi" | "commissionSpent";

/* ─────────────── Analytics tab content ─────────────── */

function AnalyticsTabContent() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>("30d");
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortAsc, setSortAsc] = useState(false);

  const loadReport = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/campaigns/reports?period=${p}`);
      if (!res.ok) {
        const err = await res.json();
        setError(err.title ?? "Failed to load report");
        return;
      }
      const json: ReportData = await res.json();
      setData(json);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport(period);
  }, [period, loadReport]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  const sortedCampaigns = data
    ? [...data.campaigns].sort((a, b) => {
        const diff = (a[sortKey] as number) - (b[sortKey] as number);
        return sortAsc ? diff : -diff;
      })
    : [];

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => loadReport(period)}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { summary, monthly } = data;
  const maxConversions = Math.max(...monthly.map((m) => m.conversions), 1);
  const maxRevenue = Math.max(...monthly.map((m) => m.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        {PERIODS.map((p) => (
          <Button
            key={p.value}
            variant={period === p.value ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(p.value)}
            disabled={loading}
          >
            {p.label}
          </Button>
        ))}
        {loading && <Loader2 className="size-4 animate-spin text-muted-foreground ml-2" />}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Megaphone className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalCampaigns}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Target className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.activeCampaigns}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalConversions.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmtCurrency(summary.totalRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg ROI</CardTitle>
            <BarChart3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.avgROI}%</p>
            <p className="text-xs text-muted-foreground">
              Commissions: {fmtCurrency(summary.totalCommissionsPaid)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      {monthly.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4" />
              Monthly Performance
            </CardTitle>
            <CardDescription>Conversions and revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 sm:gap-2 overflow-x-auto pb-2" style={{ minHeight: 200 }}>
              {monthly.map((m) => {
                const convHeight = Math.max((m.conversions / maxConversions) * 150, 4);
                const revHeight = Math.max((m.revenue / maxRevenue) * 150, 4);

                return (
                  <div key={m.month} className="flex flex-col items-center gap-1 min-w-[48px]">
                    <div className="flex items-end gap-0.5" style={{ height: 160 }}>
                      <div
                        className="w-4 rounded-t bg-primary/70"
                        style={{ height: convHeight }}
                        title={`${m.conversions} conversions`}
                      />
                      <div
                        className="w-4 rounded-t bg-emerald-500/70"
                        style={{ height: revHeight }}
                        title={fmtCurrency(m.revenue)}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {fmtMonth(m.month)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block size-2.5 rounded-sm bg-primary/70" /> Conversions
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block size-2.5 rounded-sm bg-emerald-500/70" /> Revenue
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>
            {sortedCampaigns.length} campaign{sortedCampaigns.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedCampaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No campaigns yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Affiliates</TableHead>
                    <TableHead title="Total human clicks on the campaign's /r/ link">Clicks</TableHead>
                    <TableHead title="Unique visitors in a 24h window">Unique</TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1 hover:text-foreground"
                        onClick={() => handleSort("conversions")}
                        type="button"
                      >
                        Conversions <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1 hover:text-foreground"
                        onClick={() => handleSort("revenue")}
                        type="button"
                      >
                        Revenue <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1 hover:text-foreground"
                        onClick={() => handleSort("commissionSpent")}
                        type="button"
                      >
                        Commission <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1 hover:text-foreground"
                        onClick={() => handleSort("roi")}
                        type="button"
                      >
                        ROI <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCampaigns.map((camp) => (
                    <TableRow key={camp.id}>
                      <TableCell className="font-medium">{camp.name}</TableCell>
                      <TableCell>
                        <Badge variant={REPORT_STATUS_COLORS[camp.status] ?? "outline"}>
                          {camp.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {fmtReportDate(camp.startDate)} - {fmtReportDate(camp.endDate)}
                      </TableCell>
                      <TableCell>{camp.affiliates}</TableCell>
                      <TableCell className="font-medium">{camp.clicks.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground">{camp.uniqueClicks.toLocaleString()}</TableCell>
                      <TableCell>{camp.conversions.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">{fmtCurrency(camp.revenue)}</TableCell>
                      <TableCell>{fmtCurrency(camp.commissionSpent)}</TableCell>
                      <TableCell>
                        {camp.budgetCap > 0 ? (
                          <div className="min-w-[80px]">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>{camp.budgetUsedPct}%</span>
                              <span className="text-muted-foreground">{fmtCurrency(camp.budgetCap)}</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${budgetColor(camp.budgetUsedPct)}`}
                                style={{ width: `${Math.min(camp.budgetUsedPct, 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">No cap</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={camp.roi > 0 ? "text-emerald-600 font-medium" : "text-muted-foreground"}>
                          {camp.roi}%
                        </span>
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

/* ─────────────── Main page ─────────────── */

export default function DashboardCampaignsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, startRefreshing] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createdCampaign, setCreatedCampaign] = useState<CreatedCampaignResult | null>(null);

  // URL State
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "all";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10), 100);
  const totalPages = Math.ceil(total / limit);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formUtmSource, setFormUtmSource] = useState("");
  const [formUtmMedium, setFormUtmMedium] = useState("");
  const [formUtmCampaign, setFormUtmCampaign] = useState("");
  const [formDestination, setFormDestination] = useState<DestinationValue>({
    destination_type: null,
    destination_service_template_id: null,
  });
  const [formChannel, setFormChannel] = useState("");

  function resetForm() {
    setFormName("");
    setFormDesc("");
    setFormStartDate("");
    setFormEndDate("");
    setFormUtmSource("");
    setFormUtmMedium("");
    setFormUtmCampaign("");
    setFormDestination({ destination_type: null, destination_service_template_id: null });
    setFormChannel("");
    setCreatedCampaign(null);
  }

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has("limit")) params.set("limit", String(limit));

    const res = await fetch(`/api/dashboard/campaigns?${params}`);
    if (res.ok) {
      const json = await res.json();
      setCampaigns(json.data ?? []);
      setTotal(json.total ?? 0);
    }
    setLoading(false);
  }, [searchParams, limit]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const pushParams = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (!v || v === "all") {
          next.delete(k);
        } else {
          next.set(k, v);
        }
      }
      if (!("page" in updates)) next.delete("page");
      router.push(`${pathname}?${next.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const handleRefresh = () => {
    startRefreshing(async () => {
      await loadCampaigns();
      toast.success("Data refreshed");
    });
  };

  const handleReset = () => {
    router.push(pathname);
  };

  async function handleCreate() {
    if (!formName.trim() || !formStartDate) {
      toast.error("Name and start date are required");
      return;
    }
    if (formDestination.destination_type === "SERVICE" && !formDestination.destination_service_template_id) {
      toast.error("Please select a service destination");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/dashboard/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formName,
        description: formDesc || undefined,
        start_date: formStartDate,
        end_date: formEndDate || undefined,
        utm_source: formUtmSource || undefined,
        utm_medium: formUtmMedium || undefined,
        utm_campaign: formUtmCampaign || undefined,
        destination_type: formDestination.destination_type || undefined,
        destination_service_template_id: formDestination.destination_service_template_id || undefined,
        channel: formChannel || undefined,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      const created = json.data as CreatedCampaignResult;
      setCreatedCampaign(created);
      await loadCampaigns();
    } else {
      const err = await res.json();
      toast.error(err.detail ?? err.title ?? "Failed to create campaign");
    }
    setSaving(false);
  }

  // Summary stats (derived from current view or global? usually global is better for cards)
  const totalCampaigns = total;
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length; // This is only on page, maybe fetch global stats? 
  // For now we'll stick to the current data or just show what we have.
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions_count, 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + (c.total_commission_cents || 0), 0);

  const hasActiveFilters = !!q || status !== "all" || !!from || !!to;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">Manage and analyze your affiliate marketing campaigns.</p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1.5"
            >
              <FilterX className="size-4" />
              Reset
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-1.5"
          >
            <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 size-4" />
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{createdCampaign ? "Campaign Created!" : "Create Campaign"}</DialogTitle>
                <DialogDescription>
                  {createdCampaign
                    ? "Your campaign is ready. Copy the URL to share with affiliates."
                    : "Set up a new promotional campaign for your affiliates."}
                </DialogDescription>
              </DialogHeader>

              {createdCampaign ? (
                /* ── Success screen ── */
                <div className="mt-4 space-y-5">
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
                    <CheckCircle className="size-5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{createdCampaign.name}</p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">
                        {createdCampaign.destination_type === "PROFILE" ? "Profile destination" : "Service destination"}
                      </p>
                    </div>
                  </div>

                  {createdCampaign.share_url ? (
                    <CampaignUrlDisplay
                      url={createdCampaign.share_url}
                      code={createdCampaign.campaign_code ?? undefined}
                      label={
                        createdCampaign.status && createdCampaign.status !== "active"
                          ? "Campaign URL — inactive until activated"
                          : "Campaign URL — share this with affiliates"
                      }
                      showOpenButton
                      isInactive={!!createdCampaign.status && createdCampaign.status !== "active"}
                      inactiveReason={createdCampaign.status ?? "Draft"}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No campaign URL generated (campaign created without destination).
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Done
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={resetForm}
                    >
                      <Plus className="mr-1.5 size-4" />
                      Create Another
                    </Button>
                  </div>
                </div>
              ) : (
                /* ── Creation form ── */
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="c-name">Campaign Name</Label>
                    <Input id="c-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Spring Promotion 2026" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-desc">Description (optional)</Label>
                    <Textarea id="c-desc" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Details about this campaign..." rows={2} />
                  </div>

                  {/* Destination picker */}
                  <div className="rounded-lg border p-3 space-y-1">
                    <CampaignDestinationPicker
                      value={formDestination}
                      onChange={(dest) => setFormDestination(dest)}
                      disabled={saving}
                    />
                  </div>

                  {/* Channel */}
                  <div className="space-y-2">
                    <Label>Channel (optional)</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      value={formChannel}
                      onChange={(e) => setFormChannel(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Select channel…</option>
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="youtube">YouTube</option>
                      <option value="email">Email</option>
                      <option value="twitter">Twitter / X</option>
                      <option value="tiktok">TikTok</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="direct">Direct</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="c-start">Start Date</Label>
                      <Input id="c-start" type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="c-end">End Date (optional)</Label>
                      <Input id="c-end" type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">UTM Parameters</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input placeholder="utm_source" value={formUtmSource} onChange={(e) => setFormUtmSource(e.target.value)} />
                      <Input placeholder="utm_medium" value={formUtmMedium} onChange={(e) => setFormUtmMedium(e.target.value)} />
                      <Input placeholder="utm_campaign" value={formUtmCampaign} onChange={(e) => setFormUtmCampaign(e.target.value)} />
                    </div>
                  </div>
                  <Button onClick={handleCreate} disabled={saving} className="w-full">
                    {saving ? (
                      <><Loader2 className="mr-2 size-4 animate-spin" />Creating…</>
                    ) : (
                      "Create Campaign"
                    )}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs: Campaigns | Analytics */}
      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">
            <Target className="mr-1.5 size-3.5" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="mr-1.5 size-3.5" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* ── Campaigns tab ── */}
        <TabsContent value="campaigns" className="mt-6">
          <div className="space-y-6">
            {/* Summary Stats */}
            {loading && campaigns.length === 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                    <Megaphone className="size-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{total}</p>
                    <p className="text-xs text-muted-foreground">{activeCampaigns} active on page</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
                    <Users className="size-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {campaigns.reduce((s, c) => s + c.affiliates_count, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">On this page</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                    <Target className="size-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{totalConversions}</p>
                    <p className="text-xs text-muted-foreground">On this page</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Commission Spent</CardTitle>
                    <DollarSign className="size-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{fmtCents(totalSpent)}</p>
                    <p className="text-xs text-muted-foreground">On this page</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filters Bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name…"
                    value={q}
                    onChange={(e) => pushParams({ q: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48 space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(val) => pushParams({ status: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-40 space-y-2">
                <Label htmlFor="from">From Date</Label>
                <Input
                  id="from"
                  type="date"
                  value={from}
                  onChange={(e) => pushParams({ from: e.target.value })}
                />
              </div>
              <div className="w-full sm:w-40 space-y-2">
                <Label htmlFor="to">To Date</Label>
                <Input
                  id="to"
                  type="date"
                  value={to}
                  onChange={(e) => pushParams({ to: e.target.value })}
                />
              </div>
            </div>

            {/* Campaigns Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>All Campaigns</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {loading && campaigns.length === 0 ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 py-16 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                      <Megaphone className="size-7 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">No campaigns found</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {hasActiveFilters
                          ? "Try adjusting your search or filters."
                          : "Create your first campaign to start tracking affiliate promotions."}
                      </p>
                    </div>
                    {!hasActiveFilters && (
                      <Button onClick={() => { setDialogOpen(true); resetForm(); }}>
                        <Plus className="mr-2 size-4" />
                        Create Your First Campaign
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Destination</TableHead>
                            <TableHead>Campaign URL</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Affiliates</TableHead>
                            <TableHead>Conversions</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {campaigns.map((c) => (
                            <TableRow key={c.id}>
                              <TableCell className="font-medium">
                                <div>
                                  {c.name}
                                  {c.auto_paused_at && (
                                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-amber-600 dark:text-amber-400">
                                      <AlertTriangle className="size-3" />
                                      Auto-paused
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {c.auto_paused_at ? (
                                  <Badge variant="destructive" className="gap-1">
                                    <AlertTriangle className="size-2.5" />
                                    Auto-Paused
                                  </Badge>
                                ) : (
                                  <Badge variant={STATUS_BADGE[c.status] ?? "outline"}>{c.status}</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <CampaignDestinationBadge
                                  destinationType={c.destination_type}
                                />
                              </TableCell>
                              <TableCell>
                                {c.share_url ? (
                                  <div className="flex items-center gap-1.5">
                                    <code className="font-mono text-[11px] text-muted-foreground">
                                      {c.campaign_code}
                                    </code>
                                    <button
                                      type="button"
                                      title="Copy URL"
                                      onClick={async () => {
                                        await navigator.clipboard.writeText(c.share_url!);
                                        toast.success("URL copied");
                                      }}
                                      className="p-0.5 rounded hover:bg-muted"
                                    >
                                      <Link2 className="size-3 text-muted-foreground" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">
                                {fmtDate(c.start_date)}
                                {c.end_date ? ` - ${fmtDate(c.end_date)}` : ""}
                              </TableCell>
                              <TableCell>{c.affiliates_count}</TableCell>
                              <TableCell>{c.conversions_count}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="size-8" asChild title="View details">
                                  <Link href={`/dashboard/campaigns/${c.id}`}>
                                    <Eye className="size-3.5" />
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between border-t pt-6 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-muted-foreground">
                          Showing {total === 0 ? 0 : (page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                        </div>
                        <Select
                          value={String(limit)}
                          onValueChange={(val) => pushParams({ limit: val, page: "1" })}
                        >
                          <SelectTrigger className="h-8 w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[10, 25, 50, 100].map((n) => (
                              <SelectItem key={n} value={String(n)}>
                                {n} / page
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => pushParams({ page: String(page - 1) })}
                            disabled={page <= 1}
                          >
                            <ChevronLeft className="mr-1 size-4" />
                            Previous
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum = i + 1;
                              if (totalPages > 5 && page > 3) {
                                pageNum = page - 3 + i;
                              }
                              if (pageNum > totalPages) return null;
                              return (
                                <Button
                                  key={pageNum}
                                  variant={page === pageNum ? "default" : "outline"}
                                  size="sm"
                                  className="size-8 p-0"
                                  onClick={() => pushParams({ page: String(pageNum) })}
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => pushParams({ page: String(page + 1) })}
                            disabled={page >= totalPages}
                          >
                            Next
                            <ChevronRight className="ml-1 size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Analytics tab ── */}
        <TabsContent value="analytics" className="mt-6">
          <AnalyticsTabContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
