"use client";

import { useEffect, useState, useCallback } from "react";
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
  Users,
  DollarSign,
  Clock,
  Copy,
  Check,
  ExternalLink,
  Star,
  ShoppingBag,
} from "lucide-react";

/* ---------- types ---------- */

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
  divinerName: string;
  isDivinerCampaign: boolean;
  targetProductType: string;
  status: string;
  startDate: string | null;
  myConversions: number;
  myEarnings: number;
  commissionRate: number;
  commissionType: string;
  shareLink: string;
  subId: string;
}

interface ReportData {
  summary: Summary;
  campaigns: CampaignRow[];
  referralCode: string;
  appUrl: string;
}

/* ---------- helpers ---------- */

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  paused: "secondary",
  draft: "outline",
  ended: "destructive",
  completed: "secondary",
};

const PRODUCT_LABELS: Record<string, string> = {
  astrology: "Astrology Reading",
  tarot: "Tarot Reading",
  "natal-chart": "Natal Chart",
  "solar-return": "Solar Return",
  general: "General",
};

function fmtCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function fmtDate(iso: string | null) {
  if (!iso) return "--";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtCommission(type: string, rate: number) {
  return type === "fixed" ? fmtCurrency(rate / 100) + " fixed" : `${rate}%`;
}

const PERIODS = [
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "1y", label: "1 Year" },
  { value: "all", label: "All Time" },
] as const;

/* ---------- Copy button ---------- */

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={copy} className="shrink-0 h-7 text-xs gap-1">
      {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
      {label ?? "Copy"}
    </Button>
  );
}

/* ---------- Campaign card ---------- */

function CampaignCard({ camp }: { camp: CampaignRow }) {
  return (
    <Card className="border-border/60 hover:border-border transition-colors">
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm leading-tight truncate">{camp.campaignName}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {camp.isDivinerCampaign
                ? `by ${camp.divinerName}`
                : "Platform Campaign"}
              {camp.targetProductType && camp.targetProductType !== "general" && (
                <> · <span className="capitalize">{PRODUCT_LABELS[camp.targetProductType] ?? camp.targetProductType}</span></>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant={STATUS_COLORS[camp.status] ?? "outline"} className="text-[10px]">
              {camp.status}
            </Badge>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/50 px-2 py-2">
            <p className="text-[10px] text-muted-foreground">Conversions</p>
            <p className="text-base font-bold">{camp.myConversions}</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-2 py-2">
            <p className="text-[10px] text-muted-foreground">Earned</p>
            <p className="text-base font-bold text-emerald-600">{fmtCurrency(camp.myEarnings)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-2 py-2">
            <p className="text-[10px] text-muted-foreground">Commission</p>
            <p className="text-base font-bold">{fmtCommission(camp.commissionType, camp.commissionRate)}</p>
          </div>
        </div>

        {/* Sub ID row */}
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Sub ID (Campaign Tracking Code)</p>
          <div className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-1.5">
            <code className="flex-1 text-xs font-mono text-foreground truncate">{camp.subId}</code>
            <CopyButton text={camp.subId} label="Copy ID" />
          </div>
        </div>

        {/* Share link */}
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Your Unique Share Link</p>
          <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5">
            <p className="flex-1 text-xs font-mono text-muted-foreground truncate">{camp.shareLink}</p>
            <CopyButton text={camp.shareLink} label="Copy Link" />
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              asChild
            >
              <a href={camp.shareLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3" />
              </a>
            </Button>
          </div>
        </div>

        {/* Footer */}
        {camp.startDate && (
          <p className="text-[10px] text-muted-foreground">
            Started {fmtDate(camp.startDate)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- component ---------- */

export default function AdvocateCampaignsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>("30d");

  const loadReport = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/advocate/campaigns?period=${p}`);
      if (!res.ok) {
        const err = await res.json();
        setError(err.title ?? "Failed to load campaigns");
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

  /* ---------- loading skeleton ---------- */

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">Loading your campaign data...</p>
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
        </div>
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => loadReport(period)}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { summary, campaigns, referralCode } = data;

  const divinerCampaigns = campaigns.filter((c) => c.isDivinerCampaign);
  const productCampaigns = campaigns.filter((c) => !c.isDivinerCampaign);

  const kpis = [
    {
      label: "Campaigns Joined",
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
      label: "Total Conversions",
      value: summary.totalConversions,
      icon: Users,
      color: "text-purple-500",
    },
    {
      label: "Total Earned",
      value: fmtCurrency(summary.totalEarned),
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      label: "Pending Earnings",
      value: fmtCurrency(summary.pendingEarnings),
      icon: Clock,
      color: "text-amber-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
        <p className="text-muted-foreground">
          Your campaign participation, referral links, and earnings
        </p>
      </div>

      {/* Referral code banner */}
      {referralCode && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3 px-4 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">Your Referral Code</p>
              <p className="text-lg font-bold font-mono">{referralCode}</p>
              <p className="text-[11px] text-muted-foreground">
                This code is baked into every share link below. Anyone who uses your link is tracked to you.
              </p>
            </div>
            <CopyButton text={referralCode} label="Copy Code" />
          </CardContent>
        </Card>
      )}

      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Period:</span>
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
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1.5">
                  <Icon className={`size-3.5 ${kpi.color}`} />
                  {kpi.label}
                </CardDescription>
                <CardTitle className="text-2xl">{kpi.value}</CardTitle>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* ── Diviner Campaigns ── */}
      {divinerCampaigns.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="size-4 text-amber-500" />
            <h2 className="text-base font-semibold">Diviner Campaigns</h2>
            <span className="text-xs text-muted-foreground">
              ({divinerCampaigns.length}) — Promote a specific diviner&apos;s services
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {divinerCampaigns.map((camp) => (
              <CampaignCard key={camp.campaignId} camp={camp} />
            ))}
          </div>
        </div>
      )}

      {/* ── Product / Platform Campaigns ── */}
      {productCampaigns.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-4 text-blue-500" />
            <h2 className="text-base font-semibold">Product Campaigns</h2>
            <span className="text-xs text-muted-foreground">
              ({productCampaigns.length}) — Promote AstrologyPro services directly
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {productCampaigns.map((camp) => (
              <CampaignCard key={camp.campaignId} camp={camp} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {campaigns.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Megaphone className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No campaigns yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Campaigns are assigned by your affiliate manager. Check back soon.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Earnings breakdown */}
      {campaigns.length > 0 && campaigns.some((c) => c.myEarnings > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Earnings by Campaign</CardTitle>
            <CardDescription>Proportional earnings breakdown across all campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const maxEarnings = Math.max(...campaigns.map((c) => c.myEarnings), 1);
              return (
                <div className="space-y-3">
                  {campaigns
                    .filter((c) => c.myEarnings > 0)
                    .map((camp) => {
                      const pct = (camp.myEarnings / maxEarnings) * 100;
                      return (
                        <div key={`earn-${camp.campaignId}`} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              {camp.isDivinerCampaign
                                ? <Star className="size-3 text-amber-400 shrink-0" />
                                : <ShoppingBag className="size-3 text-blue-400 shrink-0" />
                              }
                              <span className="font-medium truncate">{camp.campaignName}</span>
                            </div>
                            <span className="text-muted-foreground shrink-0 ml-2">
                              {fmtCurrency(camp.myEarnings)}
                            </span>
                          </div>
                          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500/70 transition-all"
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
