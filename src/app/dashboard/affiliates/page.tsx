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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Eye,
  Users,
  DollarSign,
  Wallet,
  UserPlus,
  Send,
  MoreHorizontal,
  RefreshCw,
  XCircle,
  AlertTriangle,
  Lock,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  FilterX,
} from "lucide-react";
import {
  createInvite,
  resendInviteByJunction,
  revokeInvite,
} from "@/lib/api/affiliates-client";
import { cn } from "@/lib/utils";

interface LatestInvite {
  id: string;
  expires_at: string;
  revoked_at: string | null;
  resent_count: number;
  created_at: string;
}

interface Affiliate {
  id: string;
  diviner_id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  default_commission_type: string;
  default_commission_value: number;
  created_at: string;
  // Additive from Task 04
  affiliate_account_id: string | null;
  account_status: "unclaimed" | "active" | "blocked" | null;
  user_id: string | null;
  avatar_url: string | null;
  invited_at: string | null;
  accepted_at: string | null;
  latest_invite: LatestInvite | null;
}

interface Summary {
  total_affiliates: number;
  active_affiliates: number;
  total_commissions_earned_cents: number;
  total_paid_cents: number;
  pending_balance_cents: number;
}

type DerivedStatus =
  | "pending"
  | "pending_expired"
  | "active"
  | "suspended"
  | "blocked"
  | "account_blocked";

const STATUS_COLORS: Record<DerivedStatus, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  pending: "outline",
  pending_expired: "outline",
  suspended: "secondary",
  blocked: "destructive",
  account_blocked: "destructive",
};

const STATUS_LABEL: Record<DerivedStatus, string> = {
  active: "Active",
  pending: "Pending",
  pending_expired: "Expired",
  suspended: "Suspended",
  blocked: "Blocked",
  account_blocked: "Blocked (account)",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
  { value: "blocked", label: "Blocked" },
];

function deriveStatus(aff: Affiliate): DerivedStatus {
  if (aff.account_status === "blocked") return "account_blocked";
  if (aff.status === "pending") {
    const exp = aff.latest_invite?.expires_at;
    if (exp && new Date(exp).getTime() < Date.now()) return "pending_expired";
    if (aff.latest_invite?.revoked_at) return "pending_expired";
    return "pending";
  }
  if (aff.status === "active") return "active";
  if (aff.status === "suspended") return "suspended";
  if (aff.status === "blocked") return "blocked";
  return "pending";
}

function fmtCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DashboardAffiliatesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [agreementSigned, setAgreementSigned] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, startRefreshing] = useTransition();

  // URL State
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "all";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10), 100);
  const totalPages = Math.ceil(total / limit);

  // Invite dialog state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSaving, setInviteSaving] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [showCommission, setShowCommission] = useState(false);
  const [commType, setCommType] = useState<"percentage" | "fixed">("percentage");
  const [commValue, setCommValue] = useState("10");

  // Row action in-flight state
  const [busyRowId, setBusyRowId] = useState<string | null>(null);

  function resetInviteForm() {
    setInviteName("");
    setInviteEmail("");
    setInviteMessage("");
    setShowCommission(false);
    setCommType("percentage");
    setCommValue("10");
  }

  const loadAffiliates = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has("limit")) params.set("limit", String(limit));
    
    const [affRes, sumRes] = await Promise.all([
      fetch(`/api/dashboard/affiliates?${params.toString()}`),
      fetch("/api/dashboard/affiliates/summary"),
    ]);
    if (affRes.ok) {
      const j = await affRes.json();
      setAffiliates(j.data ?? []);
      setTotal(j.total ?? 0);
      if (typeof j?.meta?.affiliate_agreement_signed === "boolean") {
        setAgreementSigned(j.meta.affiliate_agreement_signed);
      }
    }
    if (sumRes.ok) {
      const j = await sumRes.json();
      setSummary(j.data ?? null);
    }
    setLoading(false);
  }, [searchParams, limit]);

  useEffect(() => {
    loadAffiliates();
  }, [loadAffiliates]);

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
      await loadAffiliates();
      toast.success("Data refreshed");
    });
  };

  const handleReset = () => {
    router.push(pathname);
  };

  async function handleInvite() {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setInviteSaving(true);
    try {
      const result = await createInvite({
        email: inviteEmail.trim(),
        name: inviteName.trim(),
        message: inviteMessage.trim() || undefined,
        ...(showCommission
          ? {
              default_commission_type: commType,
              default_commission_value: parseFloat(commValue) || 0,
            }
          : {}),
      });
      if (result.email_delivery === "failed") {
        toast.warning(
          `Invitation saved but email delivery failed. You can resend from the affiliate's row.`,
        );
      } else {
        toast.success(
          `Invitation sent to ${inviteEmail.trim()}. They have 14 days to accept.`,
        );
      }
      setInviteOpen(false);
      resetInviteForm();
      await loadAffiliates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setInviteSaving(false);
    }
  }

  async function handleResend(aff: Affiliate) {
    setBusyRowId(aff.id);
    try {
      const result = await resendInviteByJunction(aff.id);
      if (result.email_delivery === "failed") {
        toast.warning("New invite created, but email delivery failed.");
      } else {
        toast.success(`Invitation resent to ${aff.email}.`);
      }
      await loadAffiliates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend");
    } finally {
      setBusyRowId(null);
    }
  }

  async function handleRevoke(aff: Affiliate) {
    if (!aff.latest_invite?.id) {
      toast.error("No active invite to revoke");
      return;
    }
    if (
      !confirm(
        `Revoke the pending invitation for ${aff.email}? The affiliate will no longer be able to accept.`,
      )
    )
      return;
    setBusyRowId(aff.id);
    try {
      const result = await revokeInvite(aff.latest_invite.id);
      toast.success(
        result.junction_action === "deleted"
          ? "Invitation revoked and affiliate removed from your list."
          : "Invitation revoked. Partnership moved to Suspended (had prior commission history).",
      );
      await loadAffiliates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke");
    } finally {
      setBusyRowId(null);
    }
  }

  const canInvite = agreementSigned;

  if (loading && affiliates.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Affiliates</h1>
            <p className="text-muted-foreground">
              Manage your affiliate partners and track commissions.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const hasActiveFilters = !!q || status !== "all" || !!from || !!to;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Affiliates</h1>
          <p className="text-muted-foreground">
            Manage your affiliate partners and track commissions.
          </p>
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
          <Button asChild variant="outline">
            <Link href="/dashboard/affiliates/new">
              <Plus className="mr-2 size-4" aria-hidden />
              Assign affiliate
            </Link>
          </Button>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetInviteForm}
                disabled={!canInvite}
                aria-disabled={!canInvite}
                title={
                  !canInvite
                    ? "Sign the affiliate partnership agreement to enable invitations"
                    : undefined
                }
              >
                <Send className="mr-2 size-4" aria-hidden />
                Invite Affiliate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Affiliate Partner</DialogTitle>
                <DialogDescription>
                  Send an invitation email. They&rsquo;ll receive a link that
                  expires in 14 days.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-name">Name</Label>
                  <Input
                    id="invite-name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Jane Smith"
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="jane@example.com"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-message">Personal message (optional)</Label>
                  <Textarea
                    id="invite-message"
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="I'd love for you to join my affiliate program…"
                    rows={3}
                  />
                </div>

                <div className="space-y-2 rounded-md border p-3">
                  <button
                    type="button"
                    onClick={() => setShowCommission((v) => !v)}
                    className="flex w-full items-center justify-between text-sm font-medium"
                  >
                    <span>Commission (optional)</span>
                    <span className="text-xs text-muted-foreground">
                      {showCommission ? "Hide" : "Customize"}
                    </span>
                  </button>
                  {showCommission && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1.5">
                        <Label>Type</Label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                          value={commType}
                          onChange={(e) =>
                            setCommType(e.target.value as "percentage" | "fixed")
                          }
                        >
                          <option value="percentage">Percentage</option>
                          <option value="fixed">Fixed amount</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>
                          {commType === "percentage" ? "%" : "Amount (cents)"}
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          value={commValue}
                          onChange={(e) => setCommValue(e.target.value)}
                        />
                      </div>
                      <p className="col-span-2 text-xs text-muted-foreground">
                        You can change this from the affiliate&rsquo;s detail page
                        after they accept.
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleInvite}
                  disabled={inviteSaving}
                  className="w-full"
                >
                  {inviteSaving ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 size-4" aria-hidden />
                      Send Invitation
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Agreement gate banner */}
      {!agreementSigned && (
        <Alert
          role="alert"
          aria-live="polite"
          className="border-amber-400/40 bg-amber-50 dark:bg-amber-950/20"
        >
          <AlertTriangle className="size-4 text-amber-500" aria-hidden />
          <AlertTitle>Sign the affiliate partnership agreement</AlertTitle>
          <AlertDescription className="mt-1 space-y-3">
            <p>
              Before inviting affiliates, you&rsquo;ll need to accept the
              affiliate partnership terms. This only takes a moment.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/account/affiliate-agreement">
                Review &amp; Sign Agreement
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
              <Users className="size-4 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary.total_affiliates}</p>
              <p className="text-xs text-muted-foreground">
                {summary.active_affiliates} active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Commissions Earned</CardTitle>
              <DollarSign className="size-4 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {fmtCents(summary.total_commissions_earned_cents)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <DollarSign className="size-4 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{fmtCents(summary.total_paid_cents)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
              <Wallet className="size-4 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-600">
                {fmtCents(summary.pending_balance_cents)}
              </p>
              <p className="text-xs text-muted-foreground">Owed to affiliates</p>
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
              placeholder="Search by name or email…"
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
            <SelectTrigger className="w-full">
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

      {/* Affiliates Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>All Affiliates</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading && affiliates.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : affiliates.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                <UserPlus className="size-7 text-muted-foreground" aria-hidden />
              </div>
              <div>
                <h3 className="text-lg font-medium">No affiliates found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? "Try adjusting your search or filters."
                    : "Send an invitation to start tracking referrals."}
                </p>
              </div>
              {!hasActiveFilters && (
                <Button
                  onClick={() => {
                    resetInviteForm();
                    setInviteOpen(true);
                  }}
                  disabled={!canInvite}
                >
                  <Send className="mr-2 size-4" aria-hidden />
                  Invite Your First Affiliate
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
                      <TableHead>Email</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliates.map((aff) => {
                      const derived = deriveStatus(aff);
                      const isBusy = busyRowId === aff.id;
                      const isAccountBlocked = aff.account_status === "blocked";
                      const isPending = aff.status === "pending";
                      return (
                        <TableRow key={aff.id}>
                          <TableCell className="font-medium">{aff.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {aff.email}
                          </TableCell>
                          <TableCell>
                            {aff.default_commission_type === "percentage"
                              ? `${aff.default_commission_value}%`
                              : `$${(aff.default_commission_value / 100).toFixed(2)}`}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1.5">
                              {isAccountBlocked && (
                                <Lock className="size-3 text-destructive" aria-hidden />
                              )}
                              <Badge variant={STATUS_COLORS[derived]}>
                                {STATUS_LABEL[derived]}
                              </Badge>
                            </span>
                          </TableCell>
                          <TableCell>{fmtDate(aff.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                asChild
                                title="View details"
                              >
                                <Link
                                  href={`/dashboard/affiliates/${aff.id}`}
                                  aria-label={`View details for ${aff.name}`}
                                >
                                  <Eye className="size-3.5" aria-hidden />
                                </Link>
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    disabled={isBusy || isAccountBlocked}
                                    aria-label="More actions"
                                  >
                                    {isBusy ? (
                                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                                    ) : (
                                      <MoreHorizontal className="size-3.5" aria-hidden />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Row actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {isPending && (
                                    <>
                                      <DropdownMenuItem onClick={() => handleResend(aff)}>
                                        <RefreshCw className="mr-2 size-4" aria-hidden />
                                        {derived === "pending_expired"
                                          ? "Resend (fresh token)"
                                          : "Resend invitation"}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => handleRevoke(aff)}
                                        disabled={!aff.latest_invite?.id}
                                      >
                                        <XCircle className="mr-2 size-4" aria-hidden />
                                        Revoke invitation
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {!isPending && (
                                    <DropdownMenuItem asChild>
                                      <Link href={`/dashboard/affiliates/${aff.id}`}>
                                        <Eye className="mr-2 size-4" aria-hidden />
                                        Open detail page
                                      </Link>
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
  );
}
