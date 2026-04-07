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
} from "lucide-react";

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
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [savingPayout, setSavingPayout] = useState(false);

  // Payout form
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutDate, setPayoutDate] = useState(new Date().toISOString().split("T")[0]);
  const [payoutMethod, setPayoutMethod] = useState("");
  const [payoutRef, setPayoutRef] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [selectedCommissionIds, setSelectedCommissionIds] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    const [affRes, linksRes, commRes, payRes] = await Promise.all([
      fetch(`/api/dashboard/affiliates/${id}`),
      fetch(`/api/dashboard/affiliates/${id}/links`),
      fetch(`/api/dashboard/affiliates/${id}/commissions`),
      fetch(`/api/dashboard/affiliates/${id}/payouts`),
    ]);

    if (affRes.ok) setAffiliate((await affRes.json()).data);
    if (linksRes.ok) setLinks((await linksRes.json()).data ?? []);
    if (commRes.ok) setCommissions((await commRes.json()).data ?? []);
    if (payRes.ok) setPayouts((await payRes.json()).data ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleGenerateLink() {
    setGeneratingLink(true);
    const res = await fetch(`/api/dashboard/affiliates/${id}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      toast.success("Referral link generated");
      await loadData();
    } else {
      toast.error("Failed to generate link");
    }
    setGeneratingLink(false);
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  }

  async function handleRecordPayout() {
    const amountCents = Math.round(parseFloat(payoutAmount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      toast.error("Enter a valid payout amount");
      return;
    }
    setSavingPayout(true);
    const res = await fetch(`/api/dashboard/affiliates/${id}/payouts`, {
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
          <Button size="sm" onClick={() => setPayoutDialogOpen(true)}>
            <DollarSign className="mr-2 size-4" />
            Record Payout
          </Button>
        </div>
      </div>

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
          <Button size="sm" onClick={handleGenerateLink} disabled={generatingLink}>
            {generatingLink ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Plus className="mr-2 size-4" />
            )}
            Generate Link
          </Button>
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
                      <TableCell>{link.product_type ?? "General"}</TableCell>
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

      {/* Record Payout Dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payout</DialogTitle>
            <DialogDescription>
              Record a manual payment to {affiliate.name}. Pending balance: {fmtCents(pendingTotal)}.
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
                placeholder="Monthly payout"
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
                      <span>
                        {fmtCents(c.commission_amount_cents)} — {c.order_reference ?? fmtDate(c.created_at)}
                      </span>
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
              {savingPayout ? (
                <><Loader2 className="mr-2 size-4 animate-spin" />Saving…</>
              ) : (
                "Record Payout"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
