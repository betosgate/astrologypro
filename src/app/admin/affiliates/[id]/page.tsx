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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  ArrowLeft,
  DollarSign,
  CheckCircle2,
  XCircle,
  Wallet,
  PauseCircle,
  AlertTriangle,
} from "lucide-react";

interface Affiliate {
  id: string;
  diviner_id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  notes: string | null;
  default_commission_type: string;
  default_commission_value: number;
  created_at: string;
}

interface Commission {
  id: string;
  order_reference: string | null;
  order_amount_cents: number;
  commission_type: string;
  commission_rate: number;
  commission_amount_cents: number;
  status: string;
  approved_at: string | null;
  notes: string | null;
  is_locked: boolean;
  created_at: string;
}

interface Payout {
  id: string;
  amount_cents: number;
  method: string | null;
  reference: string | null;
  notes: string | null;
  paid_at: string;
  created_at: string;
}

interface Dispute {
  id: string;
  commission_id: string | null;
  affiliate_id: string;
  raised_by: string | null;
  status: string;
  reason: string;
  resolution_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

const DISPUTE_STATUS_CLASS: Record<string, string> = {
  open: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  under_review: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  resolved: "bg-green-500/10 text-green-600 border-green-500/20",
  dismissed: "bg-muted text-muted-foreground border-border",
};

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  pending: "outline",
  suspended: "secondary",
  blocked: "destructive",
};

// Gold-standard commission status pill colors
// pending=gray, approved=blue, paid=green, rejected=red, on_hold=orange, reversed=muted
const COMMISSION_STATUS_CLASS: Record<string, string> = {
  pending: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  on_hold: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  approved: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  paid: "bg-green-500/10 text-green-600 border-green-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
  reversed: "bg-muted text-muted-foreground border-border",
  adjusted: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

function fmtCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminAffiliateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [savingPayout, setSavingPayout] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [resolvingDispute, setResolvingDispute] = useState<string | null>(null);

  // Payout form
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutDate, setPayoutDate] = useState(new Date().toISOString().split("T")[0]);
  const [payoutMethod, setPayoutMethod] = useState("");
  const [payoutRef, setPayoutRef] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [selectedCommissionIds, setSelectedCommissionIds] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    const [affRes, commRes, payRes, dispRes] = await Promise.all([
      fetch(`/api/admin/affiliates/${id}`),
      fetch(`/api/admin/affiliates/${id}/commissions`),
      fetch(`/api/admin/affiliates/${id}/payouts`),
      fetch(`/api/admin/affiliates/${id}/disputes`),
    ]);

    if (affRes.ok) {
      const j = await affRes.json();
      setAffiliate(j.data);
    }
    if (commRes.ok) {
      const j = await commRes.json();
      setCommissions(j.data ?? []);
    }
    if (payRes.ok) {
      const j = await payRes.json();
      setPayouts(j.data ?? []);
    }
    if (dispRes.ok) {
      const j = await dispRes.json();
      setDisputes(j.data ?? []);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleStatusChange(newStatus: string) {
    setSavingStatus(true);
    const res = await fetch(`/api/admin/affiliates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      toast.success(`Status updated to ${newStatus}`);
      await loadData();
    } else {
      toast.error("Failed to update status");
    }
    setSavingStatus(false);
  }

  async function handleApproveCommission(commId: string) {
    const res = await fetch(`/api/admin/commissions/${commId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    if (res.ok) {
      toast.success("Commission approved.");
      await loadData();
    } else {
      const err = await res.json();
      toast.error(err.detail ?? err.title ?? "Failed to approve commission.");
    }
  }

  async function handleRejectCommission(commId: string) {
    const res = await fetch(`/api/admin/commissions/${commId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected", reason: "Rejected by admin" }),
    });
    if (res.ok) {
      toast.success("Commission rejected.");
      await loadData();
    } else {
      const err = await res.json();
      toast.error(err.detail ?? err.title ?? "Failed to reject commission.");
    }
  }

  async function handleHoldCommission(commId: string) {
    const res = await fetch(`/api/admin/commissions/${commId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "on_hold", reason: "Placed on hold by admin" }),
    });
    if (res.ok) {
      toast.success("Commission put on hold.");
      await loadData();
    } else {
      const err = await res.json();
      toast.error(err.detail ?? err.title ?? "Failed to put commission on hold.");
    }
  }

  async function handleRecordPayout() {
    const amountCents = Math.round(parseFloat(payoutAmount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      toast.error("Enter a valid payout amount");
      return;
    }
    setSavingPayout(true);
    const res = await fetch(`/api/admin/affiliates/${id}/payouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount_cents: amountCents,
        paid_at: payoutDate,
        method: payoutMethod || undefined,
        reference: payoutRef || undefined,
        notes: payoutNotes || undefined,
        commission_ids: selectedCommissionIds.length > 0 ? selectedCommissionIds : undefined,
      }),
    });
    if (res.ok) {
      toast.success("Payout recorded");
      setPayoutDialogOpen(false);
      setPayoutAmount("");
      setPayoutRef("");
      setPayoutNotes("");
      setPayoutMethod("");
      setSelectedCommissionIds([]);
      await loadData();
    } else {
      const err = await res.json();
      toast.error(err.title ?? "Failed to record payout");
    }
    setSavingPayout(false);
  }

  async function handleResolveDispute(disputeId: string, action: "resolved" | "dismissed", notes?: string) {
    setResolvingDispute(disputeId);
    const res = await fetch(`/api/admin/affiliates/${id}/disputes`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dispute_id: disputeId, status: action, resolution_notes: notes }),
    });
    if (res.ok) {
      toast.success(`Dispute ${action}`);
      await loadData();
    } else {
      const err = await res.json() as { detail?: string; title?: string };
      toast.error(err.detail ?? err.title ?? `Failed to ${action} dispute`);
    }
    setResolvingDispute(null);
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
          <Link href="/admin/affiliates">Back to Affiliates</Link>
        </Button>
      </div>
    );
  }

  const totalCommissionsEarned = commissions.reduce((s, c) => s + c.commission_amount_cents, 0);
  const totalPaid = payouts.reduce((s, p) => s + p.amount_cents, 0);
  const pendingCommissions = commissions.filter((c) => c.status === "pending" || c.status === "approved");
  const pendingTotal = pendingCommissions.reduce((s, c) => s + c.commission_amount_cents, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/affiliates">
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
        <Badge variant={STATUS_COLORS[affiliate.status] ?? "outline"} className="text-sm px-3 py-1">
          {affiliate.status}
        </Badge>
      </div>

      {/* Profile + Actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Commission</span>
              <span>
                {affiliate.default_commission_type === "percentage"
                  ? `${affiliate.default_commission_value}%`
                  : `$${(affiliate.default_commission_value / 100).toFixed(2)} fixed`}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Created</span>
              <span>{fmtDate(affiliate.created_at)}</span>
            </div>
            {affiliate.notes && (
              <div>
                <span className="text-muted-foreground">Notes</span>
                <p className="mt-1">{affiliate.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {affiliate.status !== "active" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleStatusChange("active")}
                disabled={savingStatus}
              >
                <CheckCircle2 className="mr-2 size-4 text-green-600" />
                Activate
              </Button>
            )}
            {affiliate.status === "active" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleStatusChange("suspended")}
                disabled={savingStatus}
              >
                <XCircle className="mr-2 size-4 text-amber-600" />
                Suspend
              </Button>
            )}
            {affiliate.status !== "blocked" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => handleStatusChange("blocked")}
                disabled={savingStatus}
              >
                <XCircle className="mr-2 size-4" />
                Block
              </Button>
            )}
            <Button
              size="sm"
              className="w-full justify-start"
              onClick={() => setPayoutDialogOpen(true)}
            >
              <DollarSign className="mr-2 size-4" />
              Record Payout
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmtCents(totalCommissionsEarned)}</p>
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
            <p className="text-xs text-muted-foreground">{payouts.length} payouts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
            <Wallet className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{fmtCents(pendingTotal)}</p>
            <p className="text-xs text-muted-foreground">{pendingCommissions.length} pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed: Commission Ledger / Payout History / Disputes */}
      <Tabs defaultValue="commissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="commissions">
            Commission Ledger
            {commissions.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
                {commissions.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="payouts">
            Payout History
            {payouts.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
                {payouts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="disputes">
            Disputes
            {disputes.filter((d) => d.status === "open").length > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                {disputes.filter((d) => d.status === "open").length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

      {/* Commission Ledger */}
      <TabsContent value="commissions">
      <Card>
        <CardHeader>
          <CardTitle>Commission Ledger</CardTitle>
          <CardDescription>{commissions.length} entries</CardDescription>
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
                    <TableHead className="text-right">Actions</TableHead>
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
                        <Badge
                          variant="outline"
                          className={`text-xs ${COMMISSION_STATUS_CLASS[c.status] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{fmtDate(c.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {c.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Approve"
                                onClick={() => handleApproveCommission(c.id)}
                              >
                                <CheckCircle2 className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                                title="Put on hold"
                                onClick={() => handleHoldCommission(c.id)}
                              >
                                <PauseCircle className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Reject"
                                onClick={() => handleRejectCommission(c.id)}
                              >
                                <XCircle className="size-3.5" />
                              </Button>
                            </>
                          )}
                          {c.status === "on_hold" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Approve"
                                onClick={() => handleApproveCommission(c.id)}
                              >
                                <CheckCircle2 className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Reject"
                                onClick={() => handleRejectCommission(c.id)}
                              >
                                <XCircle className="size-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      </TabsContent>

      {/* Payout History */}
      <TabsContent value="payouts">
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>{payouts.length} payouts</CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No payouts recorded yet.</p>
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

      </TabsContent>

      {/* Disputes */}
      <TabsContent value="disputes">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              Disputes
            </CardTitle>
            <CardDescription>Commission disputes raised for this affiliate.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {disputes.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No disputes on record for this affiliate.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Raised</TableHead>
                      <TableHead>Resolution</TableHead>
                      <TableHead>Resolved At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disputes.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${DISPUTE_STATUS_CLASS[d.status] ?? "bg-muted text-muted-foreground"}`}
                          >
                            {d.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[220px] text-sm">{d.reason}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {fmtDate(d.created_at)}
                        </TableCell>
                        <TableCell className="max-w-[180px] text-sm text-muted-foreground">
                          {d.resolution_notes ?? "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {d.resolved_at ? fmtDate(d.resolved_at) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {(d.status === "open" || d.status === "under_review") && (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Resolve"
                                disabled={resolvingDispute === d.id}
                                onClick={() => handleResolveDispute(d.id, "resolved")}
                              >
                                {resolvingDispute === d.id ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="size-3.5" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-foreground"
                                title="Dismiss"
                                disabled={resolvingDispute === d.id}
                                onClick={() => handleResolveDispute(d.id, "dismissed")}
                              >
                                <XCircle className="size-3.5" />
                              </Button>
                            </div>
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
      </TabsContent>

      </Tabs>

      {/* Record Payout Dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payout</DialogTitle>
            <DialogDescription>
              Record a manual payout to {affiliate.name}. Pending balance: {fmtCents(pendingTotal)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="100.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={payoutDate}
                onChange={(e) => setPayoutDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Method (optional)</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
              >
                <option value="">Select…</option>
                <option value="bank">Bank transfer</option>
                <option value="paypal">PayPal</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Reference (optional)</Label>
              <Input
                value={payoutRef}
                onChange={(e) => setPayoutRef(e.target.value)}
                placeholder="TXN-12345"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                placeholder="Monthly commission payout"
              />
            </div>
            {pendingCommissions.length > 0 && (
              <div className="space-y-2">
                <Label>Link to commissions (optional)</Label>
                <div className="max-h-40 overflow-y-auto space-y-1 rounded border p-2 text-sm">
                  {pendingCommissions.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCommissionIds.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCommissionIds((prev) => [...prev, c.id]);
                          } else {
                            setSelectedCommissionIds((prev) => prev.filter((x) => x !== c.id));
                          }
                        }}
                      />
                      <span>{fmtCents(c.commission_amount_cents)} — {c.order_reference ?? fmtDate(c.created_at)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayout} disabled={savingPayout}>
              {savingPayout ? <><Loader2 className="mr-2 size-4 animate-spin" />Saving…</> : "Record Payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
