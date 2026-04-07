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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Loader2,
  Plus,
  Eye,
  Users,
  DollarSign,
  Wallet,
} from "lucide-react";

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
}

interface Summary {
  total_affiliates: number;
  active_affiliates: number;
  total_commissions_earned_cents: number;
  total_paid_cents: number;
  pending_balance_cents: number;
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

export default function DashboardAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCommType, setFormCommType] = useState("percentage");
  const [formCommValue, setFormCommValue] = useState("10");
  const [formNotes, setFormNotes] = useState("");

  const loadAffiliates = useCallback(async () => {
    setLoading(true);
    const [affRes, sumRes] = await Promise.all([
      fetch("/api/dashboard/affiliates"),
      fetch("/api/dashboard/affiliates/summary"),
    ]);
    if (affRes.ok) {
      const j = await affRes.json();
      setAffiliates(j.data ?? []);
    }
    if (sumRes.ok) {
      const j = await sumRes.json();
      setSummary(j.data ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAffiliates();
  }, [loadAffiliates]);

  function resetForm() {
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormCommType("percentage");
    setFormCommValue("10");
    setFormNotes("");
  }

  async function handleCreate() {
    if (!formName || !formEmail) {
      toast.error("Name and email are required");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/dashboard/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formName,
        email: formEmail,
        phone: formPhone || undefined,
        notes: formNotes || undefined,
        default_commission_type: formCommType,
        default_commission_value: parseFloat(formCommValue) || 0,
      }),
    });
    if (res.ok) {
      toast.success("Affiliate added");
      setSheetOpen(false);
      resetForm();
      await loadAffiliates();
    } else {
      const err = await res.json();
      toast.error(err.title ?? "Failed to add affiliate");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Affiliates</h1>
          <p className="text-muted-foreground">
            Manage your affiliate partners and track commissions.
          </p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 size-4" />
              Add Affiliate
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add Affiliate</SheetTitle>
              <SheetDescription>
                Create a new affiliate partner under your account.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aff-name">Name</Label>
                <Input
                  id="aff-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aff-email">Email</Label>
                <Input
                  id="aff-email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="jane@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aff-phone">Phone (optional)</Label>
                <Input
                  id="aff-phone"
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+1 555 123 4567"
                />
              </div>
              <div className="space-y-2">
                <Label>Commission type</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={formCommType}
                  onChange={(e) => setFormCommType(e.target.value)}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>{formCommType === "percentage" ? "Commission %" : "Fixed amount (cents)"}</Label>
                <Input
                  type="number"
                  min="0"
                  value={formCommValue}
                  onChange={(e) => setFormCommValue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aff-notes">Notes (optional)</Label>
                <Input
                  id="aff-notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Internal notes…"
                />
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full">
                {saving ? (
                  <><Loader2 className="mr-2 size-4 animate-spin" />Saving…</>
                ) : (
                  "Create Affiliate"
                )}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary.total_affiliates}</p>
              <p className="text-xs text-muted-foreground">{summary.active_affiliates} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Commissions Earned</CardTitle>
              <DollarSign className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{fmtCents(summary.total_commissions_earned_cents)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <DollarSign className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{fmtCents(summary.total_paid_cents)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
              <Wallet className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-600">{fmtCents(summary.pending_balance_cents)}</p>
              <p className="text-xs text-muted-foreground">Owed to affiliates</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Affiliates Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Affiliates</CardTitle>
          <CardDescription>
            {affiliates.length} affiliate{affiliates.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {affiliates.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No affiliates yet. Add your first affiliate partner above.
            </p>
          ) : (
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
                  {affiliates.map((aff) => (
                    <TableRow key={aff.id}>
                      <TableCell className="font-medium">{aff.name}</TableCell>
                      <TableCell className="text-muted-foreground">{aff.email}</TableCell>
                      <TableCell>
                        {aff.default_commission_type === "percentage"
                          ? `${aff.default_commission_value}%`
                          : `$${(aff.default_commission_value / 100).toFixed(2)}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_COLORS[aff.status] ?? "outline"}>{aff.status}</Badge>
                      </TableCell>
                      <TableCell>{fmtDate(aff.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="size-8" asChild title="View details">
                          <Link href={`/dashboard/affiliates/${aff.id}`}>
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
  );
}
