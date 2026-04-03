"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { generateReferralCode } from "@/lib/format";
import { formatCurrency } from "@/lib/format";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  Eye,
  Pencil,
  UserX,
  UserCheck,
  DollarSign,
  Users,
  TrendingUp,
  Copy,
} from "lucide-react";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  commission_percent: number;
  referral_code: string;
  is_active: boolean;
  total_referrals: number;
  total_earned: number;
  total_paid: number;
}

export default function AffiliatesPage() {
  const [loading, setLoading] = useState(true);
  const [divinerId, setDivinerId] = useState<string | null>(null);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [markPaidDialog, setMarkPaidDialog] = useState<Affiliate | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCommission, setFormCommission] = useState("10");

  const loadAffiliates = useCallback(async (divId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("affiliates")
      .select(
        "id, name, email, phone, commission_percent, referral_code, is_active, total_referrals, total_earned, total_paid"
      )
      .eq("diviner_id", divId)
      .order("created_at", { ascending: false });

    if (data) setAffiliates(data);
  }, []);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: diviner } = await supabase
        .from("diviners")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (diviner) {
        setDivinerId(diviner.id);
        await loadAffiliates(diviner.id);
      }
      setLoading(false);
    }
    load();
  }, [loadAffiliates]);

  function resetForm() {
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormCommission("10");
    setEditingAffiliate(null);
  }

  function openAddSheet() {
    resetForm();
    setSheetOpen(true);
  }

  function openEditSheet(affiliate: Affiliate) {
    setEditingAffiliate(affiliate);
    setFormName(affiliate.name);
    setFormEmail(affiliate.email);
    setFormPhone(affiliate.phone ?? "");
    setFormCommission(String(affiliate.commission_percent));
    setSheetOpen(true);
  }

  async function handleSaveAffiliate() {
    if (!divinerId || !formName || !formEmail) {
      toast.error("Name and email are required");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    if (editingAffiliate) {
      // Update
      const { error } = await supabase
        .from("affiliates")
        .update({
          name: formName,
          email: formEmail,
          phone: formPhone || null,
          commission_percent: parseFloat(formCommission) || 10,
        })
        .eq("id", editingAffiliate.id);

      if (error) {
        toast.error("Failed to update affiliate");
      } else {
        toast.success("Affiliate updated");
        await loadAffiliates(divinerId);
      }
    } else {
      // Create
      const { error } = await supabase.from("affiliates").insert({
        diviner_id: divinerId,
        name: formName,
        email: formEmail,
        phone: formPhone || null,
        commission_percent: parseFloat(formCommission) || 10,
        referral_code: generateReferralCode(),
        is_active: true,
        total_referrals: 0,
        total_earned: 0,
        total_paid: 0,
      });

      if (error) {
        toast.error("Failed to create affiliate");
      } else {
        toast.success("Affiliate created");
        await loadAffiliates(divinerId);
      }
    }

    setSaving(false);
    setSheetOpen(false);
    resetForm();
  }

  async function handleToggleActive(affiliate: Affiliate) {
    if (!divinerId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("affiliates")
      .update({ is_active: !affiliate.is_active })
      .eq("id", affiliate.id);

    if (error) {
      toast.error("Failed to update affiliate status");
    } else {
      toast.success(
        affiliate.is_active ? "Affiliate deactivated" : "Affiliate reactivated"
      );
      await loadAffiliates(divinerId);
    }
  }

  async function handleMarkPaid() {
    if (!markPaidDialog || !divinerId) return;
    setMarkingPaid(true);
    const supabase = createClient();

    const unpaidAmount =
      markPaidDialog.total_earned - markPaidDialog.total_paid;

    // Update affiliate total_paid
    const { error } = await supabase
      .from("affiliates")
      .update({ total_paid: markPaidDialog.total_earned })
      .eq("id", markPaidDialog.id);

    if (error) {
      toast.error("Failed to mark as paid");
    } else {
      // Update related referral records to paid
      await supabase
        .from("affiliate_referrals")
        .update({ status: "paid" })
        .eq("affiliate_id", markPaidDialog.id)
        .eq("status", "earned");

      toast.success(`Marked ${formatCurrency(unpaidAmount)} as paid`);
      await loadAffiliates(divinerId);
    }

    setMarkingPaid(false);
    setMarkPaidDialog(null);
  }

  function copyReferralCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success("Referral code copied");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalAffiliates = affiliates.length;
  const activeAffiliates = affiliates.filter((a) => a.is_active).length;
  const totalEarned = affiliates.reduce((sum, a) => sum + a.total_earned, 0);
  const totalPaid = affiliates.reduce((sum, a) => sum + a.total_paid, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Affiliates</h1>
          <p className="text-muted-foreground">
            Manage your affiliate partners and track referrals.
          </p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button onClick={openAddSheet}>
              <Plus className="mr-2 size-4" />
              Add Affiliate
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>
                {editingAffiliate ? "Edit Affiliate" : "Add Affiliate"}
              </SheetTitle>
              <SheetDescription>
                {editingAffiliate
                  ? "Update affiliate details."
                  : "Create a new affiliate partner. A unique referral code will be auto-generated."}
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
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aff-commission">Commission %</Label>
                <Input
                  id="aff-commission"
                  type="number"
                  min="0"
                  max="100"
                  value={formCommission}
                  onChange={(e) => setFormCommission(e.target.value)}
                  placeholder="10"
                />
                <p className="text-xs text-muted-foreground">
                  Percentage of each booking amount paid to this affiliate.
                </p>
              </div>
              <Button
                onClick={handleSaveAffiliate}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : editingAffiliate ? (
                  "Update Affiliate"
                ) : (
                  "Create Affiliate"
                )}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Affiliates
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalAffiliates}</p>
            <p className="text-xs text-muted-foreground">
              {activeAffiliates} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Referrals
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {affiliates.reduce((sum, a) => sum + a.total_referrals, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(totalEarned)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(totalPaid)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalEarned - totalPaid)} outstanding
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Affiliates Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Affiliates</CardTitle>
          <CardDescription>
            {affiliates.length} affiliate
            {affiliates.length !== 1 ? "s" : ""} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {affiliates.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No affiliates yet. Add your first affiliate partner to start
              tracking referrals.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Commission %</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Referrals</TableHead>
                    <TableHead>Earned</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliates.map((affiliate) => {
                    const unpaid =
                      affiliate.total_earned - affiliate.total_paid;
                    return (
                      <TableRow key={affiliate.id}>
                        <TableCell className="font-medium">
                          {affiliate.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {affiliate.email}
                        </TableCell>
                        <TableCell>{affiliate.commission_percent}%</TableCell>
                        <TableCell>
                          <button
                            onClick={() =>
                              copyReferralCode(affiliate.referral_code)
                            }
                            className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 font-mono text-xs hover:bg-muted/80"
                          >
                            {affiliate.referral_code}
                            <Copy className="size-3" />
                          </button>
                        </TableCell>
                        <TableCell>{affiliate.total_referrals}</TableCell>
                        <TableCell>
                          {formatCurrency(affiliate.total_earned)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(affiliate.total_paid)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              affiliate.is_active ? "default" : "secondary"
                            }
                          >
                            {affiliate.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => openEditSheet(affiliate)}
                              title="Edit"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => handleToggleActive(affiliate)}
                              title={
                                affiliate.is_active
                                  ? "Deactivate"
                                  : "Reactivate"
                              }
                            >
                              {affiliate.is_active ? (
                                <UserX className="size-3.5" />
                              ) : (
                                <UserCheck className="size-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              asChild
                              title="View Report"
                            >
                              <Link
                                href={`/dashboard/affiliates/${affiliate.id}`}
                              >
                                <Eye className="size-3.5" />
                              </Link>
                            </Button>
                            {unpaid > 0 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-green-600 hover:text-green-700"
                                onClick={() => setMarkPaidDialog(affiliate)}
                                title="Mark Paid"
                              >
                                <DollarSign className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mark Paid Dialog */}
      <Dialog
        open={!!markPaidDialog}
        onOpenChange={(open) => !open && setMarkPaidDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Mark all outstanding earnings as paid for{" "}
              <span className="font-medium text-foreground">
                {markPaidDialog?.name}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          {markPaidDialog && (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Earned</span>
                <span>
                  {formatCurrency(markPaidDialog.total_earned)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Already Paid</span>
                <span>{formatCurrency(markPaidDialog.total_paid)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-medium">
                <span>Amount to Pay</span>
                <span className="text-green-600">
                  {formatCurrency(
                    markPaidDialog.total_earned - markPaidDialog.total_paid
                  )}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMarkPaidDialog(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleMarkPaid} disabled={markingPaid}>
              {markingPaid ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
