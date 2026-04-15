"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
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
} from "lucide-react";

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
}

const STATUS_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  active: "default",
  paused: "outline",
  completed: "default",
  expired: "destructive",
};

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
  draft: "outline",
  ended: "destructive",
  completed: "secondary",
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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formCommType, setFormCommType] = useState("percentage");
  const [formCommValue, setFormCommValue] = useState("10");
  const [formBudgetCap, setFormBudgetCap] = useState("");
  const [formTargetProduct, setFormTargetProduct] = useState("");
  const [formUtmSource, setFormUtmSource] = useState("");
  const [formUtmMedium, setFormUtmMedium] = useState("");
  const [formUtmCampaign, setFormUtmCampaign] = useState("");

  function resetForm() {
    setFormName("");
    setFormDesc("");
    setFormStartDate("");
    setFormEndDate("");
    setFormCommType("percentage");
    setFormCommValue("10");
    setFormBudgetCap("");
    setFormTargetProduct("");
    setFormUtmSource("");
    setFormUtmMedium("");
    setFormUtmCampaign("");
  }

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    const res = await fetch(`/api/dashboard/campaigns?${params}`);
    if (res.ok) {
      const json = await res.json();
      setCampaigns(json.data ?? []);
    }
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  async function handleCreate() {
    if (!formName.trim() || !formStartDate) {
      toast.error("Name and start date are required");
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
        commission_type: formCommType,
        commission_value: parseFloat(formCommValue) || 0,
        budget_cap_cents: formBudgetCap ? parseInt(formBudgetCap, 10) * 100 : undefined,
        target_product_type: formTargetProduct || undefined,
        utm_source: formUtmSource || undefined,
        utm_medium: formUtmMedium || undefined,
        utm_campaign: formUtmCampaign || undefined,
      }),
    });
    if (res.ok) {
      toast.success("Campaign created");
      setDialogOpen(false);
      resetForm();
      await loadCampaigns();
    } else {
      const err = await res.json();
      toast.error(err.title ?? "Failed to create campaign");
    }
    setSaving(false);
  }

  // Summary stats
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions_count, 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + (c.total_commission_cents || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">Manage and analyze your affiliate marketing campaigns.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 size-4" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Campaign</DialogTitle>
              <DialogDescription>
                Set up a new promotional campaign for your affiliates.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="c-name">Campaign Name</Label>
                <Input id="c-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Spring Promotion 2026" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-desc">Description (optional)</Label>
                <Textarea id="c-desc" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Details about this campaign..." rows={2} />
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Commission Type</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={formCommType} onChange={(e) => setFormCommType(e.target.value)}>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed amount</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{formCommType === "percentage" ? "Commission %" : "Fixed amount ($)"}</Label>
                  <Input type="number" min="0" value={formCommValue} onChange={(e) => setFormCommValue(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-budget">Budget Cap ($, optional)</Label>
                <Input id="c-budget" type="number" min="0" value={formBudgetCap} onChange={(e) => setFormBudgetCap(e.target.value)} placeholder="Max commission payout in dollars" />
              </div>
              <div className="space-y-2">
                <Label>Target Product Type</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={formTargetProduct} onChange={(e) => setFormTargetProduct(e.target.value)}>
                  <option value="">All products</option>
                  <option value="session">Sessions</option>
                  <option value="package">Packages</option>
                  <option value="subscription">Subscriptions</option>
                </select>
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
                  <><Loader2 className="mr-2 size-4 animate-spin" />Creating...</>
                ) : (
                  "Create Campaign"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
            {loading ? (
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
                    <p className="text-2xl font-bold">{totalCampaigns}</p>
                    <p className="text-xs text-muted-foreground">{activeCampaigns} active</p>
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
                    <p className="text-xs text-muted-foreground">Across all campaigns</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                    <Target className="size-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{totalConversions}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Commission Spent</CardTitle>
                    <DollarSign className="size-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{fmtCents(totalSpent)}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filter */}
            <div className="flex flex-wrap gap-3">
              <select
                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Campaigns Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Campaigns</CardTitle>
                <CardDescription>
                  {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 py-16 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                      <Megaphone className="size-7 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">No campaigns yet</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Create your first campaign to start tracking affiliate promotions.
                      </p>
                    </div>
                    <Button onClick={() => { setDialogOpen(true); resetForm(); }}>
                      <Plus className="mr-2 size-4" />
                      Create Your First Campaign
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead>Commission</TableHead>
                          <TableHead>Affiliates</TableHead>
                          <TableHead>Conversions</TableHead>
                          <TableHead>Spent / Budget</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaigns.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell>
                              <Badge variant={STATUS_BADGE[c.status] ?? "outline"}>{c.status}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {fmtDate(c.start_date)}
                              {c.end_date ? ` - ${fmtDate(c.end_date)}` : ""}
                            </TableCell>
                            <TableCell>
                              {c.commission_type === "percentage"
                                ? `${c.commission_value}%`
                                : `$${Number(c.commission_value).toFixed(2)}`}
                            </TableCell>
                            <TableCell>{c.affiliates_count}</TableCell>
                            <TableCell>{c.conversions_count}</TableCell>
                            <TableCell>
                              {fmtCents(c.total_commission_cents)}
                              {c.budget_cap_cents ? (
                                <span className="text-xs text-muted-foreground"> / {fmtCents(c.budget_cap_cents)}</span>
                              ) : null}
                            </TableCell>
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
