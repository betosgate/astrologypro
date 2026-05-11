"use client";

// /dashboard/affiliates/[id]
//
// Diviner's per-affiliate detail. v2 model — drops the legacy "Referral
// Links" + "Commission Ledger" + "Payout History" cards (System A) and
// shows instead:
//
//   - Identity + pending-invite actions (unchanged)
//   - KPI tiles scoped to the caller's slice (clicks, conversions,
//     earned, reversed) from /api/dashboard/affiliate-reports/by-affiliate/[id]
//   - Assignments + current rate per product
//   - Rate-history timeline (spec §6.2)
//   - Recent Conversions (caller's slice only) from
//     /api/dashboard/affiliate-reports/conversions?affiliate_id=...
//
// "Record Payout" button is gone — Stripe auto-split handles payouts in
// Phase 2.
//
// Spec: docs/specs/affiliate-commission-system.md §6.2 + §5 Flow G

import { useEffect, useState, useCallback, use } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  ArrowLeft,
  DollarSign,
  Mail,
  Clock,
  RefreshCw,
  XCircle,
  Users as UsersIcon,
  Lock,
  TrendingUp,
  History,
  Pencil,
  Target,
  Bot,
  Globe,
  MousePointerClick,
} from "lucide-react";
import {
  resendInviteByJunction,
  revokeInvite,
} from "@/lib/api/affiliates-client";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  notes: string | null;
  default_commission_type: string;
  default_commission_value: number;
  created_at: string;
  affiliate_account_id: string | null;
  user_id: string | null;
  avatar_url: string | null;
  account_status: "unclaimed" | "active" | "blocked" | null;
  partnership_count: number;
  invited_at: string | null;
  accepted_at: string | null;
  latest_invite: {
    id: string;
    expires_at: string;
    revoked_at: string | null;
    resent_count: number;
    created_at: string;
  } | null;
}

interface ReportPayload {
  period: "30d" | "90d" | "1y" | "all";
  kpis: {
    clicks: number;
    human_clicks: number;
    unique_clicks: number;
    bot_clicks: number;
    unique_rate: number;
    conversions: number;
    conversion_rate: number;
    earned_cents: number;
    reversed_cents: number;
  };
  by_device: Array<{ device_type: string; clicks: number; percentage: number }>;
  by_country: Array<{ country_code: string; country_name: string; clicks: number; percentage: number }>;
  by_source: Array<{ source: string; clicks: number; percentage: number }>;
  channel_performance: Array<{ channel: string; campaigns: number; clicks: number; conversions: number }>;
  assignments: Array<{
    id: string;
    destination_type: string;
    destination_id: string | null;
    commission_type: "percentage" | "fixed";
    commission_value: number;
    is_active: boolean;
    assigned_at: string | null;
    revoked_at: string | null;
  }>;
  campaigns: Array<{
    id: string;
    campaign_code: string;
    name: string | null;
    status: string;
    created_at: string;
  }>;
  rate_history: Array<{
    id: string;
    assignment_id: string;
    old_commission_type: "percentage" | "fixed" | null;
    old_commission_value: number | null;
    new_commission_type: "percentage" | "fixed";
    new_commission_value: number;
    changed_at: string;
    changed_by: string | null;
    reason: string | null;
  }>;
}

interface Conversion {
  id: string;
  campaign_id: string;
  booking_id: string | null;
  order_amount_cents: number;
  commission_amount_cents: number;
  // Real DB enum is 'percent' | 'flat' (legacy 'percentage'/'fixed'
  // names appear in older code). Accept both for compatibility.
  rate_type_used: "percentage" | "fixed" | "percent" | "flat";
  rate_value_used: number;
  reversed_at: string | null;
  // Real column name is `reversal_reason` (not `reversed_reason`).
  reversal_reason: string | null;
  // Real column name is `converted_at` (not `created_at`).
  converted_at: string;
}

const STATUS_COLORS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  pending: "outline",
  suspended: "secondary",
  blocked: "destructive",
  revoked: "secondary",
};

function fmtCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtRate(
  type: "percentage" | "fixed" | "percent" | "flat",
  value: number,
) {
  return type === "percentage" || type === "percent"
    ? `${value}%`
    : `${fmtCents(value)} flat`;
}

function avatarInitials(name: string | null) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function HBarRow({ label, clicks, percentage, color = "bg-primary/50" }: { label: string; clicks: number; percentage: number; color?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="truncate max-w-[60%]">{label}</span>
        <span className="text-muted-foreground text-xs">{fmt(clicks)} · {percentage}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export default function DashboardAffiliateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [period, setPeriod] = useState<"30d" | "90d" | "1y" | "all">("90d");
  const [loading, setLoading] = useState(true);
  const [invitationBusy, setInvitationBusy] = useState(false);

  const loadData = useCallback(async () => {
    const [affRes, reportRes, convRes] = await Promise.all([
      fetch(`/api/dashboard/affiliates/${id}`),
      fetch(
        `/api/dashboard/affiliate-reports/by-affiliate/${id}?period=${period}`,
      ),
      fetch(
        `/api/dashboard/affiliate-reports/conversions?affiliate_id=${id}&limit=25`,
      ),
    ]);

    if (affRes.ok) {
      const j = await affRes.json();
      setAffiliate(j.data ?? null);
    }
    if (reportRes.ok) {
      const j = await reportRes.json();
      setReport((j.data as ReportPayload) ?? null);
    }
    if (convRes.ok) {
      const j = await convRes.json();
      setConversions((j.data as Conversion[]) ?? []);
    }
    setLoading(false);
  }, [id, period]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleResendInvite() {
    if (!affiliate) return;
    setInvitationBusy(true);
    try {
      const result = await resendInviteByJunction(affiliate.id);
      if (result.email_delivery === "failed") {
        toast.warning("New invite created, but email delivery failed.");
      } else {
        toast.success(`Invitation resent to ${affiliate.email}.`);
      }
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend");
    } finally {
      setInvitationBusy(false);
    }
  }

  async function handleRevokeInvite() {
    if (!affiliate?.latest_invite?.id) {
      toast.error("No active invite to revoke");
      return;
    }
    if (
      !confirm(
        `Revoke the pending invitation for ${affiliate.email}? The affiliate will no longer be able to accept.`,
      )
    )
      return;
    setInvitationBusy(true);
    try {
      const result = await revokeInvite(affiliate.latest_invite.id);
      if (result.junction_action === "deleted") {
        toast.success("Invitation revoked. Returning to affiliates list.");
        window.location.href = "/dashboard/affiliates";
      } else {
        toast.success(
          "Invitation revoked. Partnership moved to Suspended (had commission history).",
        );
        await loadData();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke");
    } finally {
      setInvitationBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Affiliate not found.</p>
        <Button asChild variant="link" className="mt-2">
          <Link href="/dashboard/affiliates">Back to Affiliates</Link>
        </Button>
      </div>
    );
  }

  const kpis = report?.kpis ?? {
    clicks: 0,
    human_clicks: 0,
    unique_clicks: 0,
    bot_clicks: 0,
    unique_rate: 0,
    conversions: 0,
    conversion_rate: 0,
    earned_cents: 0,
    reversed_cents: 0,
  };
  const by_device = report?.by_device ?? [];
  const by_country = report?.by_country ?? [];
  const by_source = report?.by_source ?? [];
  const channel_performance = report?.channel_performance ?? [];
  const assignments = report?.assignments ?? [];
  const rateHistory = report?.rate_history ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/affiliates">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{affiliate.name}</h1>
          <p className="text-muted-foreground">
            {affiliate.email}
            {affiliate.phone && ` · ${affiliate.phone}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_COLORS[affiliate.status] ?? "outline"}>
            {affiliate.status}
          </Badge>
          <Select
            value={period}
            onValueChange={(v) =>
              setPeriod(v as "30d" | "90d" | "1y" | "all")
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Identity card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 pb-4">
          <Avatar className="size-12">
            {affiliate.avatar_url && (
              <AvatarImage src={affiliate.avatar_url} alt="" />
            )}
            <AvatarFallback>{avatarInitials(affiliate.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <CardTitle className="text-base">{affiliate.name}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-1">
                <Mail className="size-3" aria-hidden /> {affiliate.email}
              </span>
              {affiliate.user_id ? (
                <Badge variant="default" className="text-[10px]">
                  Claimed
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">
                  Unclaimed
                </Badge>
              )}
              {affiliate.account_status === "blocked" && (
                <span className="inline-flex items-center gap-1 text-destructive">
                  <Lock className="size-3" aria-hidden />
                  Blocked platform-wide
                </span>
              )}
            </CardDescription>
          </div>
          {affiliate.partnership_count > 0 && (
            <div
              className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs text-muted-foreground"
              title="This person is also partnered with other diviners"
            >
              <UsersIcon className="size-3.5" aria-hidden />
              <span>
                Also partners with {affiliate.partnership_count} other diviner
                {affiliate.partnership_count !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Pending invitation card */}
      {affiliate.status === "pending" && (
        <Card className="border-amber-400/40 bg-amber-50/50 dark:bg-amber-950/10">
          <CardHeader className="flex flex-row items-start justify-between pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4 text-amber-500" aria-hidden />
                Pending invitation
              </CardTitle>
              <CardDescription className="mt-1">
                {affiliate.latest_invite ? (
                  <>
                    Invited{" "}
                    {affiliate.invited_at
                      ? fmtDate(affiliate.invited_at)
                      : fmtDate(affiliate.latest_invite.created_at)}
                    {" · "}expires{" "}
                    {fmtDate(affiliate.latest_invite.expires_at)}
                    {affiliate.latest_invite.resent_count > 0 && (
                      <> · resent {affiliate.latest_invite.resent_count}×</>
                    )}
                    {new Date(affiliate.latest_invite.expires_at).getTime() <
                      Date.now() && (
                      <>
                        {" · "}
                        <span className="font-medium text-amber-700">
                          Expired
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <>Legacy invite — send a fresh token to reach this contact.</>
                )}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pt-0">
            <Button
              size="sm"
              onClick={handleResendInvite}
              disabled={
                invitationBusy || affiliate.account_status === "blocked"
              }
            >
              {invitationBusy ? (
                <Loader2 className="mr-2 size-3.5 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="mr-2 size-3.5" aria-hidden />
              )}
              {affiliate.latest_invite ? "Resend invitation" : "Send first invite"}
            </Button>
            {affiliate.latest_invite?.id && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={handleRevokeInvite}
                disabled={invitationBusy}
              >
                <XCircle className="mr-2 size-3.5" aria-hidden />
                Revoke
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* KPI tiles */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Human Clicks</CardTitle>
            <MousePointerClick className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(kpis.human_clicks)}</p>
            <p className="text-xs text-muted-foreground mt-1">{kpis.unique_rate}% unique</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Unique Clicks</CardTitle>
            <UsersIcon className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(kpis.unique_clicks)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Conversions</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(kpis.conversions)}</p>
            <p className="text-xs text-muted-foreground mt-1">{kpis.conversion_rate}% rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Bot Clicks</CardTitle>
            <Bot className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(kpis.bot_clicks)}</p>
            <p className="text-xs text-muted-foreground mt-1">filtered out</p>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Earned</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmtCents(kpis.earned_cents)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Reversed: {fmtCents(kpis.reversed_cents)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdowns */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">By Device</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {by_device.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No device data</p>
            ) : by_device.map((row) => (
              <HBarRow key={row.device_type} label={row.device_type} clicks={row.clicks} percentage={row.percentage} />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="size-4 text-muted-foreground" aria-hidden />By Country
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {by_country.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No country data</p>
            ) : by_country.map((row) => (
              <HBarRow key={row.country_code} label={row.country_name} clicks={row.clicks} percentage={row.percentage} color="bg-blue-500/50" />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">By Source</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {by_source.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No source data</p>
            ) : by_source.map((row) => (
              <HBarRow key={row.source} label={row.source} clicks={row.clicks} percentage={row.percentage} color="bg-emerald-500/50" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Channel Performance</CardTitle></CardHeader>
          <CardContent>
            {channel_performance.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No channel data</p>
            ) : (
              <div className="space-y-2">
                {channel_performance.map((row) => (
                  <div key={row.channel} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                    <div>
                      <span className="font-medium capitalize">{row.channel}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{row.campaigns} campaign{row.campaigns !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <span>{fmt(row.clicks)} clicks</span>
                      <span className="mx-1">·</span>
                      <span>{row.conversions} conv</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assignments + current rate */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assignments</CardTitle>
              <CardDescription>
                {assignments.length} assignment
                {assignments.length !== 1 ? "s" : ""} — current rate per
                product. Edit a rate from the Assignments tab.
              </CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/affiliates/assignments">
                <Pencil className="mr-2 size-3.5" aria-hidden />
                Manage assignments
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No products assigned to this affiliate yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Destination</TableHead>
                    <TableHead>Current rate</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-medium">{a.destination_type}</div>
                        {a.destination_id && (
                          <div className="font-mono text-xs text-muted-foreground">
                            {a.destination_id}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {fmtRate(a.commission_type, a.commission_value)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.assigned_at ? fmtDate(a.assigned_at) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={a.is_active ? "default" : "secondary"}
                        >
                          {a.is_active ? "active" : "revoked"}
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

      {/* Campaigns */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-4" aria-hidden />
                Campaigns
              </CardTitle>
              <CardDescription>
                {report?.campaigns?.length ?? 0} campaign
                {(report?.campaigns?.length ?? 0) !== 1 ? "s" : ""} — specific tracking links used by this affiliate.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!report?.campaigns || report.campaigns.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No specific campaigns created for this affiliate yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.campaigns.map((camp) => (
                    <TableRow key={camp.id}>
                      <TableCell className="font-medium">
                        {camp.name || "Untitled Campaign"}
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                          {camp.campaign_code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={camp.status === "active" ? "default" : "outline"}>
                          {camp.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmtDate(camp.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/campaigns/${camp.id}`}>
                            View Details
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

      {/* Rate history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-4" aria-hidden />
            Rate history
          </CardTitle>
          <CardDescription>
            Reverse-chronological. Existing bookings keep the rate they were
            stamped with — only NEW bookings use the current rate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rateHistory.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No rate edits yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rateHistory.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="text-sm">
                        {fmtDateTime(h.changed_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {h.old_commission_type && h.old_commission_value !== null
                          ? fmtRate(
                              h.old_commission_type,
                              h.old_commission_value,
                            )
                          : "—"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {fmtRate(h.new_commission_type, h.new_commission_value)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {h.reason ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent conversions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent conversions</CardTitle>
          <CardDescription>
            Newest first. Showing your slice only — conversions through other
            diviners stay hidden.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {conversions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No conversions yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Order amount</TableHead>
                    <TableHead>Rate used</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm">
                        {fmtDate(c.converted_at)}
                      </TableCell>
                      <TableCell>{fmtCents(c.order_amount_cents)}</TableCell>
                      <TableCell className="text-sm">
                        {fmtRate(c.rate_type_used, c.rate_value_used)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {fmtCents(c.commission_amount_cents)}
                      </TableCell>
                      <TableCell>
                        {c.reversed_at ? (
                          <Badge variant="outline">
                            reversed{c.reversal_reason ? ` · ${c.reversal_reason}` : ""}
                          </Badge>
                        ) : (
                          <Badge variant="default">earned</Badge>
                        )}
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
