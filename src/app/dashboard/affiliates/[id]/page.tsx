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
    conversions: number;
    earned_cents: number;
    reversed_cents: number;
  };
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
  rate_type_used: "percentage" | "fixed";
  rate_value_used: number;
  reversed_at: string | null;
  reversed_reason: string | null;
  created_at: string;
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

function fmtRate(type: "percentage" | "fixed", value: number) {
  return type === "percentage"
    ? `${value}%`
    : `${fmtCents(value)} fixed`;
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
    conversions: 0,
    earned_cents: 0,
    reversed_cents: 0,
  };
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {kpis.clicks.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpis.conversions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Earned</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmtCents(kpis.earned_cents)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reversed</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">
              {fmtCents(kpis.reversed_cents)}
            </p>
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
                        {fmtDate(c.created_at)}
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
                            reversed{c.reversed_reason ? ` · ${c.reversed_reason}` : ""}
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
