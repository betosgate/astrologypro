"use client";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  ArrowLeft,
  DollarSign,
  Link as LinkIcon,
  Copy,
  Plus,
  Wallet,
  Download,
  Mail,
  Clock,
  RefreshCw,
  XCircle,
  User as UserIcon,
  Users as UsersIcon,
  Lock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  // Task 04 additive fields — canonical account + latest invite + partnerships
  affiliate_account_id: string | null;
  user_id: string | null;
  avatar_url: string | null;
  account_status: "unclaimed" | "active" | "suspended" | "blocked" | null;
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

interface ReferralLink {
  id: string;
  slug: string;
  url: string;
  product_id: string | null;
  product_type: string | null;
  clicks: number;
  conversions: number;
  is_active: boolean;
  created_at: string;
}

interface ServiceOption {
  id: string;
  name: string;
  slug: string;
  category: string;
  is_active: boolean;
}

interface Commission {
  id: string;
  order_reference: string | null;
  order_amount_cents: number;
  commission_type: string;
  commission_rate: number;
  commission_amount_cents: number;
  status: string;
  created_at: string;
}

interface Payout {
  id: string;
  amount_cents: number;
  method: string | null;
  reference: string | null;
  notes: string | null;
  paid_at: string;
}

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  pending: "outline",
  suspended: "secondary",
  blocked: "destructive",
};

function fmtCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function DashboardAffiliateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  // Stripe auto-split (Phase 2) will provide the real payouts feed; until
  // then keep an empty list so the Payout History card and Total Paid stat
  // render in their pre-Phase-2 placeholder state.
  const payouts: Payout[] = [];
  const [loading, setLoading] = useState(true);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [publicUsername, setPublicUsername] = useState("");
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [linkType, setLinkType] = useState<"general" | "diviner_profile" | "diviner_service">("general");
  const [selectedServiceId, setSelectedServiceId] = useState("");

  const loadData = useCallback(async () => {
    const [affRes, linksRes, commRes, profileRes, servicesRes] = await Promise.all([
      fetch(`/api/dashboard/affiliates/${id}`),
      fetch(`/api/dashboard/affiliates/${id}/links`),
      fetch(`/api/dashboard/affiliates/${id}/commissions`),
      fetch("/api/onboarding/profile"),
      fetch("/api/dashboard/services?active=true&limit=100"),
    ]);

    if (affRes.ok) setAffiliate((await affRes.json()).data);
    if (linksRes.ok) setLinks((await linksRes.json()).data ?? []);
    if (commRes.ok) setCommissions((await commRes.json()).data ?? []);
    if (profileRes.ok) {
      const json = await profileRes.json();
      setPublicUsername(json.diviner?.username ?? "");
    }
    if (servicesRes.ok) {
      const json = await servicesRes.json();
      setServices(json.services ?? []);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  // ── Task 04 row actions for pending invites ───────────────────────────────
  const [invitationBusy, setInvitationBusy] = useState(false);

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
        toast.success("Invitation revoked. Partnership moved to Suspended (had commission history).");
        await loadData();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke");
    } finally {
      setInvitationBusy(false);
    }
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

  async function handleGenerateLink() {
    setGeneratingLink(true);
    const payload =
      linkType === "general"
        ? {}
        : linkType === "diviner_profile"
          ? { product_type: "diviner_profile" }
          : { product_type: "diviner_service", product_id: selectedServiceId };

    const res = await fetch(`/api/dashboard/affiliates/${id}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      toast.success("Referral link generated");
      setLinkDialogOpen(false);
      setLinkType("general");
      setSelectedServiceId("");
      await loadData();
    } else {
      const error = await res.json().catch(() => null);
      toast.error(error?.detail ?? "Failed to generate link");
    }
    setGeneratingLink(false);
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
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

  const totalEarned = commissions.reduce((s, c) => s + c.commission_amount_cents, 0);
  const totalPaid = payouts.reduce((s, p) => s + p.amount_cents, 0);
  const pendingCommissions = commissions.filter((c) => c.status === "pending" || c.status === "approved");
  const pendingTotal = pendingCommissions.reduce((s, c) => s + c.commission_amount_cents, 0);
  const selectedService = services.find((service) => service.id === selectedServiceId) ?? null;

  function describeLinkType(type: string | null) {
    if (type === "diviner_profile") return "Diviner profile";
    if (type === "diviner_service") return "Diviner service";
    if (type === "package") return "Package";
    if (type === "session") return "Session";
    if (type === "subscription") return "Subscription";
    return "General";
  }

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
          <Badge variant={STATUS_COLORS[affiliate.status] ?? "outline"}>{affiliate.status}</Badge>
          <span
            title="Manual payouts retired — payouts now happen automatically via Stripe (coming soon)."
            className="inline-flex"
          >
            <Button size="sm" disabled aria-disabled="true">
              <DollarSign className="mr-2 size-4" />
              Record Payout
            </Button>
          </span>
        </div>
      </div>

      {/* Identity card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 pb-4">
          <Avatar className="size-12">
            {affiliate.avatar_url && <AvatarImage src={affiliate.avatar_url} alt="" />}
            <AvatarFallback>{avatarInitials(affiliate.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <CardTitle className="text-base">{affiliate.name}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-1">
                <Mail className="size-3" aria-hidden /> {affiliate.email}
              </span>
              {affiliate.user_id ? (
                <Badge variant="default" className="text-[10px]">Claimed</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">Unclaimed</Badge>
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

      {/* Invitation card — only when junction is pending */}
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
                      : fmtDate(affiliate.latest_invite.created_at)}{" "}
                    · expires {fmtDate(affiliate.latest_invite.expires_at)}
                    {affiliate.latest_invite.resent_count > 0 && (
                      <> · resent {affiliate.latest_invite.resent_count}×</>
                    )}
                    {new Date(affiliate.latest_invite.expires_at).getTime() <
                      Date.now() && (
                      <>
                        {" "}
                        ·{" "}
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
              disabled={invitationBusy || affiliate.account_status === "blocked"}
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

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmtCents(totalEarned)}</p>
            <p className="text-xs text-muted-foreground">{commissions.length} commissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmtCents(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
            <Wallet className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{fmtCents(pendingTotal)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Links */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Referral Links</CardTitle>
            <CardDescription>{links.length} link{links.length !== 1 ? "s" : ""}</CardDescription>
          </div>
          <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
            <Button size="sm" onClick={() => setLinkDialogOpen(true)}>
              <Plus className="mr-2 size-4" />
              Generate Link
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Referral Link</DialogTitle>
                <DialogDescription>
                  Choose whether this affiliate should share your homepage flow, your public profile, or a specific service page.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="link-type">Destination Type</Label>
                  <select
                    id="link-type"
                    value={linkType}
                    onChange={(event) => {
                      const nextType = event.target.value as "general" | "diviner_profile" | "diviner_service";
                      setLinkType(nextType);
                      if (nextType !== "diviner_service") setSelectedServiceId("");
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="general">General homepage flow</option>
                    <option value="diviner_profile">Diviner profile</option>
                    <option value="diviner_service">Specific diviner service</option>
                  </select>
                </div>

                {linkType === "diviner_profile" ? (
                  <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    Destination preview: {publicUsername ? `/${publicUsername}` : "your public profile"}
                  </div>
                ) : null}

                {linkType === "diviner_service" ? (
                  <div className="space-y-2">
                    <Label htmlFor="service-id">Service</Label>
                    <select
                      id="service-id"
                      value={selectedServiceId}
                      onChange={(event) => setSelectedServiceId(event.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select a service</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} ({service.category})
                        </option>
                      ))}
                    </select>
                    {selectedService ? (
                      <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                        Destination preview: {publicUsername ? `/${publicUsername}/services/${selectedService.slug}` : selectedService.name}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <DialogFooter>
                <Button
                  onClick={handleGenerateLink}
                  disabled={generatingLink || (linkType === "diviner_service" && !selectedServiceId)}
                >
                  {generatingLink ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 size-4" />
                  )}
                  Generate Link
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No referral links yet. Generate one above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Copy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell>
                        <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                          <LinkIcon className="size-3 shrink-0" />
                          {link.url}
                        </span>
                      </TableCell>
                      <TableCell>{describeLinkType(link.product_type)}</TableCell>
                      <TableCell>{link.clicks}</TableCell>
                      <TableCell>{link.conversions}</TableCell>
                      <TableCell>
                        <Badge variant={link.is_active ? "default" : "secondary"}>
                          {link.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => copyLink(link.url)}
                          title="Copy link"
                        >
                          <Copy className="size-3.5" />
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

      {/* Commission Ledger */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Commission Ledger</CardTitle>
            <CardDescription>{commissions.length} entries</CardDescription>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
          >
            <a
              href={`/api/dashboard/affiliates/${id}/commissions/export`}
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              <Download className="mr-2 size-4" />
              Export CSV
            </a>
          </Button>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No commissions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Ref</TableHead>
                    <TableHead>Order Amount</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.order_reference ?? "—"}</TableCell>
                      <TableCell>{fmtCents(c.order_amount_cents)}</TableCell>
                      <TableCell className="font-medium">{fmtCents(c.commission_amount_cents)}</TableCell>
                      <TableCell>
                        {c.commission_type === "percentage" ? `${c.commission_rate}%` : `$${(Number(c.commission_rate) / 100).toFixed(2)} fixed`}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const commStatusClass: Record<string, string> = {
                            pending: "bg-gray-500/10 text-gray-600 border-gray-500/20",
                            on_hold: "bg-orange-500/10 text-orange-600 border-orange-500/20",
                            approved: "bg-blue-500/10 text-blue-600 border-blue-500/20",
                            paid: "bg-green-500/10 text-green-600 border-green-500/20",
                            rejected: "bg-red-500/10 text-red-600 border-red-500/20",
                            reversed: "bg-muted text-muted-foreground border-border",
                          };
                          return (
                            <Badge variant="outline" className={`text-xs ${commStatusClass[c.status] ?? "bg-muted text-muted-foreground"}`}>
                              {c.status}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell>{fmtDate(c.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>{payouts.length} payouts</CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="space-y-2 py-6 text-center text-sm text-muted-foreground">
              <p>No payouts recorded yet.</p>
              <p className="text-xs">
                Stripe auto-split — coming soon. Affiliate payouts will be
                processed automatically at the time of each referred sale.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Paid At</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{fmtCents(p.amount_cents)}</TableCell>
                      <TableCell>{p.method ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{p.reference ?? "—"}</TableCell>
                      <TableCell>{fmtDate(p.paid_at)}</TableCell>
                      <TableCell>{p.notes ?? "—"}</TableCell>
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
