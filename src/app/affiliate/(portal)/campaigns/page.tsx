"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Megaphone,
  Target,
  TrendingUp,
  DollarSign,
  Clock,
  Copy,
  Check,
  ExternalLink,
  Star,
  ShoppingBag,
  BarChart3,
  CalendarRange,
  Info,
} from "lucide-react";

/* ─────────────── Types ─────────────── */

interface Summary {
  campaignsJoined: number;
  activeCampaigns: number;
  totalConversions: number;
  totalEarned: number;
  pendingEarnings: number;
}

interface CampaignRow {
  campaignId: string;
  campaignName: string;
  description: string | null;
  divinerName: string;
  isDivinerCampaign: boolean;
  targetProductType: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  commissionRate: number;
  commissionType: string;
  myConversions: number;
  myEarned: number;
  myOrderVolume: number;
  shareLink: string;
}

interface MonthlyRow {
  month: string;
  conversions: number;
  earned: number;
}

interface ReportData {
  summary: Summary;
  campaigns: CampaignRow[];
  monthly: MonthlyRow[];
  affiliateId: string;
}

/* ─────────────── Helpers ─────────────── */

const STATUS_COLORS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  paused: "secondary",
  draft: "outline",
  completed: "secondary",
  expired: "destructive",
};

const PRODUCT_LABELS: Record<string, string> = {
  session: "Sessions",
  package: "Packages",
  subscription: "Subscriptions",
  astrology: "Astrology",
  tarot: "Tarot",
  general: "All Products",
};

const PERIODS = [
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "1y", label: "1 Year" },
  { value: "all", label: "All Time" },
] as const;

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtCommission(type: string, rate: number) {
  return type === "fixed" ? `${fmtCurrency(rate / 100)} flat` : `${rate}%`;
}

function fmtMonth(iso: string) {
  const [year, month] = iso.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString(
    "en-US",
    { month: "short", year: "numeric" }
  );
}

/* ─────────────── Copy button ─────────────── */

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handle() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed — try manually");
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handle}
      className="shrink-0 h-7 text-xs gap-1"
    >
      {copied ? (
        <Check className="size-3 text-emerald-500" />
      ) : (
        <Copy className="size-3" />
      )}
      {label ?? "Copy"}
    </Button>
  );
}

/* ─────────────── Campaign card ─────────────── */

function CampaignCard({ camp }: { camp: CampaignRow }) {
  const productLabel =
    PRODUCT_LABELS[camp.targetProductType] ?? camp.targetProductType;

  return (
    <Card className="flex flex-col border-border/70 hover:border-border transition-colors">
      <CardContent className="flex flex-col flex-1 gap-4 p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {camp.isDivinerCampaign ? (
                <Star className="size-3.5 text-amber-500 shrink-0" />
              ) : (
                <ShoppingBag className="size-3.5 text-blue-500 shrink-0" />
              )}
              <h3 className="font-semibold text-sm leading-tight truncate">
                {camp.campaignName}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {camp.isDivinerCampaign
                ? `by ${camp.divinerName}`
                : "Platform Campaign"}
              {productLabel && productLabel !== "All Products" && (
                <>
                  {" "}
                  ·{" "}
                  <span className="capitalize">{productLabel}</span>
                </>
              )}
            </p>
            {camp.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {camp.description}
              </p>
            )}
          </div>
          <Badge
            variant={STATUS_COLORS[camp.status] ?? "outline"}
            className="text-[10px] shrink-0"
          >
            {camp.status}
          </Badge>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/50 px-2 py-2.5">
            <p className="text-[10px] text-muted-foreground mb-0.5">
              Conversions
            </p>
            <p className="text-lg font-bold">{camp.myConversions}</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-2 py-2.5">
            <p className="text-[10px] text-muted-foreground mb-0.5">Earned</p>
            <p className="text-lg font-bold text-emerald-600">
              {fmtCurrency(camp.myEarned)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 px-2 py-2.5">
            <p className="text-[10px] text-muted-foreground mb-0.5">
              Commission
            </p>
            <p className="text-lg font-bold">
              {fmtCommission(camp.commissionType, camp.commissionRate)}
            </p>
          </div>
        </div>

        {/* Dates */}
        {(camp.startDate || camp.endDate) && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <CalendarRange className="size-3" />
            <span>
              {fmtDate(camp.startDate)}
              {camp.endDate
                ? ` → ${fmtDate(camp.endDate)}`
                : " · No end date"}
            </span>
          </div>
        )}

        {/* Share link */}
        <div className="space-y-1.5 mt-auto">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            Your Unique Share Link
          </p>
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
            <p className="flex-1 text-[11px] font-mono text-muted-foreground truncate">
              {camp.shareLink}
            </p>
            <CopyButton text={camp.shareLink} label="Copy" />
            <a
              href={camp.shareLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Preview share link"
            >
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────────── Earnings by campaign ─────────────── */

function EarningsByCampaign({ campaigns }: { campaigns: CampaignRow[] }) {
  const withEarnings = campaigns.filter((c) => c.myEarned > 0);
  if (withEarnings.length === 0) return null;

  const maxEarned = Math.max(...withEarnings.map((c) => c.myEarned), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="size-4 text-muted-foreground" />
          Earnings by Campaign
        </CardTitle>
        <CardDescription>
          Proportional breakdown across all campaigns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {withEarnings.map((camp) => {
            const pct = (camp.myEarned / maxEarned) * 100;
            return (
              <div key={camp.campaignId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    {camp.isDivinerCampaign ? (
                      <Star className="size-3 text-amber-400 shrink-0" />
                    ) : (
                      <ShoppingBag className="size-3 text-blue-400 shrink-0" />
                    )}
                    <span className="font-medium truncate">
                      {camp.campaignName}
                    </span>
                    <Badge
                      variant={STATUS_COLORS[camp.status] ?? "outline"}
                      className="text-[9px] h-4 px-1 shrink-0"
                    >
                      {camp.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-xs text-muted-foreground">
                      {camp.myConversions} conv
                    </span>
                    <span className="font-semibold text-emerald-600">
                      {fmtCurrency(camp.myEarned)}
                    </span>
                  </div>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500/70 transition-all duration-500"
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────────── Monthly trend ─────────────── */

function MonthlyTrend({ monthly }: { monthly: MonthlyRow[] }) {
  if (monthly.length === 0) return null;

  const maxEarned = Math.max(...monthly.map((m) => m.earned), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="size-4 text-muted-foreground" />
          Monthly Earnings Trend
        </CardTitle>
        <CardDescription>
          Commission earned per month across all campaigns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {monthly.slice(-12).map((row) => {
            const pct = (row.earned / maxEarned) * 100;
            return (
              <div key={row.month} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground text-right">
                  {fmtMonth(row.month)}
                </span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-5 rounded-sm bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-sm bg-emerald-500/70 transition-all duration-500"
                      style={{ width: `${Math.max(pct, 1)}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-xs font-medium text-right">
                    {fmtCurrency(row.earned)}
                  </span>
                  <span className="w-14 shrink-0 text-[11px] text-muted-foreground text-right">
                    {row.conversions} conv
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────────── Page ─────────────── */

export default function AffiliateCampaignsPage() {
  const router = useRouter();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>("30d");

  const load = useCallback(
    async (p: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/affiliate/campaigns?period=${p}`);
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) {
          const err = (await res.json()) as { title?: string };
          setError(err.title ?? "Failed to load campaigns");
          return;
        }
        setData((await res.json()) as ReportData);
      } catch {
        setError("Network error — please refresh");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    load(period);
  }, [period, load]);

  /* ── Loading skeleton ── */
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Loading your campaign data&hellip;
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-8 w-24 animate-pulse rounded bg-muted" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={() => load(period)}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { summary, campaigns, monthly } = data;
  const divinerCampaigns = campaigns.filter((c) => c.isDivinerCampaign);
  const platformCampaigns = campaigns.filter((c) => !c.isDivinerCampaign);

  const kpis = [
    {
      label: "Campaigns",
      value: summary.campaignsJoined,
      icon: Megaphone,
      color: "text-blue-500",
    },
    {
      label: "Active",
      value: summary.activeCampaigns,
      icon: Target,
      color: "text-emerald-500",
    },
    {
      label: "Conversions",
      value: summary.totalConversions,
      icon: TrendingUp,
      color: "text-purple-500",
    },
    {
      label: "Total Earned",
      value: fmtCurrency(summary.totalEarned),
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      label: "Pending",
      value: fmtCurrency(summary.pendingEarnings),
      icon: Clock,
      color: "text-amber-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
        <p className="text-muted-foreground">
          Campaign participation, share links, and your performance metrics
        </p>
      </div>

      {/* Informational banner when no campaigns assigned */}
      {campaigns.length === 0 && !loading && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40">
          <CardContent className="flex gap-3 py-4 px-5">
            <Info className="size-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">
                Campaigns are assigned by your affiliate manager.
              </p>
              <p className="text-xs mt-0.5 opacity-80">
                Once your diviner or platform admin adds you to a campaign, it
                will appear here with your unique share link and performance
                stats.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Period filter */}
      {campaigns.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Period:
          </span>
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
          {loading && (
            <Loader2 className="size-4 animate-spin text-muted-foreground ml-1" />
          )}
        </div>
      )}

      {/* KPI summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardDescription className="flex items-center gap-1.5 text-xs">
                <Icon className={`size-3.5 ${color}`} />
                {label}
              </CardDescription>
              <CardTitle className="text-2xl mt-1">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Diviner campaigns */}
      {divinerCampaigns.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="size-4 text-amber-500" />
            <h2 className="text-base font-semibold">Diviner Campaigns</h2>
            <span className="text-xs text-muted-foreground">
              ({divinerCampaigns.length}) — Promote a specific diviner&apos;s
              services
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {divinerCampaigns.map((camp) => (
              <CampaignCard key={camp.campaignId} camp={camp} />
            ))}
          </div>
        </section>
      )}

      {/* Platform campaigns */}
      {platformCampaigns.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-4 text-blue-500" />
            <h2 className="text-base font-semibold">Platform Campaigns</h2>
            <span className="text-xs text-muted-foreground">
              ({platformCampaigns.length}) — Promote AstrologyPro services
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {platformCampaigns.map((camp) => (
              <CampaignCard key={camp.campaignId} camp={camp} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {campaigns.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Megaphone className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No campaigns assigned yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Your affiliate manager will add you to campaigns. Each campaign
              gives you a unique share link to promote.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Reports section */}
      {campaigns.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Performance Reports</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <EarningsByCampaign campaigns={campaigns} />
            <MonthlyTrend monthly={monthly} />
          </div>
        </section>
      )}
    </div>
  );
}
