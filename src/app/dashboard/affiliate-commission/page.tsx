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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  DollarSign,
  ArrowLeft,
  Eye,
  Link as LinkIcon,
  Copy,
  Users,
  TrendingUp,
  Clock,
  Wallet,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommissionRule {
  id: string;
  rule_name: string;
  rule_type: "percentage" | "fixed";
  rate: number;
  currency: string;
  applies_to: string;
  is_active: boolean;
  created_at: string;
}

interface LedgerEntry {
  id: string;
  affiliate_user_id: string;
  booking_id: string | null;
  order_amount_cents: number;
  commission_amount_cents: number;
  status: string;
  description: string | null;
  period_start: string | null;
  period_end: string | null;
  approved_at: string | null;
  created_at: string;
}

interface PayoutRecord {
  id: string;
  affiliate_user_id: string;
  amount_cents: number;
  currency: string;
  payout_method: string | null;
  reference_number: string | null;
  notes: string | null;
  status: string;
  paid_at: string;
  created_at: string;
}

interface ReferralLink {
  id: string;
  affiliate_id: string;
  slug: string;
  url: string;
  product_id: string | null;
  product_type: string | null;
  clicks: number;
  conversions: number;
  is_active: boolean;
  created_at: string;
}

interface AffiliateSummary {
  affiliate_user_id: string;
  name: string | null;
  email: string | null;
  total_earned: number;
  pending: number;
  approved: number;
  paid: number;
  last_payout_at: string | null;
}

interface AffiliateRow {
  id: string;
  diviner_id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  notes: string | null;
  default_commission_type: string;
  default_commission_value: number;
  total_earned: number;
  pending_commission: number;
  approved_commission: number;
  paid_commission: number;
  total_paid_out: number;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDateStr(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    approved: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    payable: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    paid: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    reversed: "bg-muted text-muted-foreground",
    recorded: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    verified: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
    failed: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AffiliateCommissionPage() {
  const [activeTab, setActiveTab] = useState("affiliates");

  // Rules state
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    rule_name: "",
    rule_type: "percentage" as "percentage" | "fixed",
    rate: "",
    applies_to: "all" as string,
  });
  const [savingRule, setSavingRule] = useState(false);

  // Ledger state
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [ledgerCursor, setLedgerCursor] = useState<string | null>(null);
  const [ledgerHasMore, setLedgerHasMore] = useState(false);
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState("");
  const [ledgerAffiliateFilter, setLedgerAffiliateFilter] = useState("");
  const [recordLedgerOpen, setRecordLedgerOpen] = useState(false);
  const [ledgerForm, setLedgerForm] = useState({
    affiliate_user_id: "",
    order_amount_cents: "",
    description: "",
    period_start: "",
    period_end: "",
  });
  const [savingLedger, setSavingLedger] = useState(false);
  const [actioningEntry, setActioningEntry] = useState<string | null>(null);

  // Payouts state
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    affiliate_user_id: "",
    amount_cents: "",
    payout_method: "",
    reference_number: "",
    notes: "",
    ledger_entry_ids: [] as string[],
  });
  const [savingPayout, setSavingPayout] = useState(false);

  // Summary state
  const [summary, setSummary] = useState<AffiliateSummary[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Links state
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);

  // Affiliates list state
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([]);
  const [affiliatesLoading, setAffiliatesLoading] = useState(true);
  const [addAffiliateOpen, setAddAffiliateOpen] = useState(false);
  const [savingAffiliate, setSavingAffiliate] = useState(false);
  const [affiliateForm, setAffiliateForm] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
    default_commission_type: "percentage" as "percentage" | "fixed",
    default_commission_value: "10",
  });

  // ─── Load Functions ──────────────────────────────────────────────────────────

  const loadRules = useCallback(async () => {
    setRulesLoading(true);
    const res = await fetch("/api/dashboard/affiliate-commission/rules");
    if (res.ok) {
      const json = await res.json() as { data: CommissionRule[] };
      setRules(json.data ?? []);
    }
    setRulesLoading(false);
  }, []);

  const loadLedger = useCallback(
    async (reset = false) => {
      setLedgerLoading(true);
      const params = new URLSearchParams();
      if (ledgerStatusFilter) params.set("status", ledgerStatusFilter);
      if (ledgerAffiliateFilter) params.set("affiliate_id", ledgerAffiliateFilter);
      if (!reset && ledgerCursor) params.set("cursor", ledgerCursor);
      const res = await fetch(
        `/api/dashboard/affiliate-commission/ledger?${params.toString()}`
      );
      if (res.ok) {
        const json = await res.json() as { data: LedgerEntry[]; nextCursor: string | null; hasMore: boolean };
        if (reset) {
          setLedger(json.data ?? []);
        } else {
          setLedger((prev) => [...prev, ...(json.data ?? [])]);
        }
        setLedgerCursor(json.nextCursor);
        setLedgerHasMore(json.hasMore);
      }
      setLedgerLoading(false);
    },
    [ledgerStatusFilter, ledgerAffiliateFilter, ledgerCursor]
  );

  const loadPayouts = useCallback(async () => {
    setPayoutsLoading(true);
    const res = await fetch("/api/dashboard/affiliate-commission/payouts");
    if (res.ok) {
      const json = await res.json() as { data: PayoutRecord[] };
      setPayouts(json.data ?? []);
    }
    setPayoutsLoading(false);
  }, []);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    const res = await fetch("/api/dashboard/affiliate-commission/summary");
    if (res.ok) {
      const json = await res.json() as { data: AffiliateSummary[] };
      setSummary(json.data ?? []);
    }
    setSummaryLoading(false);
  }, []);

  const loadLinks = useCallback(async () => {
    setLinksLoading(true);
    const res = await fetch("/api/dashboard/affiliate-commission/links");
    if (res.ok) {
      const json = await res.json() as { data: ReferralLink[] };
      setLinks(json.data ?? []);
    }
    setLinksLoading(false);
  }, []);

  const loadAffiliates = useCallback(async () => {
    setAffiliatesLoading(true);
    const res = await fetch("/api/dashboard/affiliate-commission/affiliates");
    if (res.ok) {
      const json = await res.json() as { data: AffiliateRow[] };
      setAffiliates(json.data ?? []);
    }
    setAffiliatesLoading(false);
  }, []);

  useEffect(() => {
    void loadRules();
    void loadSummary();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "ledger") {
      setLedgerCursor(null);
      void loadLedger(true);
    }
    if (activeTab === "payouts") void loadPayouts();
    if (activeTab === "summary") void loadSummary();
    if (activeTab === "links") void loadLinks();
    if (activeTab === "affiliates") void loadAffiliates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ─── Rules Handlers ──────────────────────────────────────────────────────────

  function openAddRule() {
    setEditingRule(null);
    setRuleForm({ rule_name: "", rule_type: "percentage", rate: "", applies_to: "all" });
    setRuleDialogOpen(true);
  }

  function openEditRule(rule: CommissionRule) {
    setEditingRule(rule);
    setRuleForm({
      rule_name: rule.rule_name,
      rule_type: rule.rule_type,
      rate: String(rule.rule_type === "percentage" ? rule.rate : rule.rate / 100),
      applies_to: rule.applies_to,
    });
    setRuleDialogOpen(true);
  }

  async function handleSaveRule() {
    const rate = parseFloat(ruleForm.rate);
    if (!ruleForm.rule_name || isNaN(rate) || rate < 0) {
      toast.error("Rule name and a valid rate are required");
      return;
    }
    setSavingRule(true);
    const rateValue = ruleForm.rule_type === "fixed" ? Math.round(rate * 100) : rate;

    if (editingRule) {
      const res = await fetch(
        `/api/dashboard/affiliate-commission/rules/${editingRule.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rule_name: ruleForm.rule_name,
            rate: rateValue,
          }),
        }
      );
      if (res.ok) {
        toast.success("Rule updated");
        await loadRules();
      } else {
        const err = await res.json() as { error?: string };
        toast.error(err.error ?? "Failed to update rule");
      }
    } else {
      const res = await fetch("/api/dashboard/affiliate-commission/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rule_name: ruleForm.rule_name,
          rule_type: ruleForm.rule_type,
          rate: rateValue,
          applies_to: ruleForm.applies_to,
        }),
      });
      if (res.ok) {
        toast.success("Rule created");
        await loadRules();
      } else {
        const err = await res.json() as { error?: string };
        toast.error(err.error ?? "Failed to create rule");
      }
    }
    setSavingRule(false);
    setRuleDialogOpen(false);
  }

  async function handleToggleRule(rule: CommissionRule) {
    const res = await fetch(
      `/api/dashboard/affiliate-commission/rules/${rule.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !rule.is_active }),
      }
    );
    if (res.ok) {
      toast.success(rule.is_active ? "Rule deactivated" : "Rule activated");
      await loadRules();
    } else {
      toast.error("Failed to update rule");
    }
  }

  async function handleDeleteRule(rule: CommissionRule) {
    const res = await fetch(
      `/api/dashboard/affiliate-commission/rules/${rule.id}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      toast.success("Rule deactivated");
      await loadRules();
    } else {
      toast.error("Failed to deactivate rule");
    }
  }

  // ─── Ledger Handlers ─────────────────────────────────────────────────────────

  async function handleRecordLedger() {
    const cents = Math.round(parseFloat(ledgerForm.order_amount_cents) * 100);
    if (!ledgerForm.affiliate_user_id || isNaN(cents) || cents <= 0) {
      toast.error("Affiliate ID and order amount are required");
      return;
    }
    setSavingLedger(true);
    const body: Record<string, unknown> = {
      affiliate_user_id: ledgerForm.affiliate_user_id,
      order_amount_cents: cents,
    };
    if (ledgerForm.description) body.description = ledgerForm.description;
    if (ledgerForm.period_start) body.period_start = ledgerForm.period_start;
    if (ledgerForm.period_end) body.period_end = ledgerForm.period_end;

    const res = await fetch("/api/dashboard/affiliate-commission/ledger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast.success("Commission entry recorded");
      setRecordLedgerOpen(false);
      setLedgerForm({ affiliate_user_id: "", order_amount_cents: "", description: "", period_start: "", period_end: "" });
      setLedgerCursor(null);
      await loadLedger(true);
    } else {
      const err = await res.json() as { error?: string };
      toast.error(err.error ?? "Failed to record commission");
    }
    setSavingLedger(false);
  }

  async function handleLedgerAction(entryId: string, action: "approve" | "reject") {
    setActioningEntry(entryId);
    const res = await fetch(
      `/api/dashboard/affiliate-commission/ledger/${entryId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      }
    );
    if (res.ok) {
      toast.success(`Entry ${action === "approve" ? "approved" : "rejected"}`);
      setLedgerCursor(null);
      await loadLedger(true);
    } else {
      const err = await res.json() as { error?: string };
      toast.error(err.error ?? `Failed to ${action} entry`);
    }
    setActioningEntry(null);
  }

  // ─── Payout Handlers ─────────────────────────────────────────────────────────

  async function handleRecordPayout() {
    const cents = Math.round(parseFloat(payoutForm.amount_cents) * 100);
    if (!payoutForm.affiliate_user_id || isNaN(cents) || cents <= 0) {
      toast.error("Affiliate ID and amount are required");
      return;
    }
    setSavingPayout(true);
    const body: Record<string, unknown> = {
      affiliate_user_id: payoutForm.affiliate_user_id,
      amount_cents: cents,
      ledger_entry_ids: payoutForm.ledger_entry_ids,
    };
    if (payoutForm.payout_method) body.payout_method = payoutForm.payout_method;
    if (payoutForm.reference_number) body.reference_number = payoutForm.reference_number;
    if (payoutForm.notes) body.notes = payoutForm.notes;

    const res = await fetch("/api/dashboard/affiliate-commission/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast.success("Payout recorded");
      setPayoutDialogOpen(false);
      setPayoutForm({ affiliate_user_id: "", amount_cents: "", payout_method: "", reference_number: "", notes: "", ledger_entry_ids: [] });
      await loadPayouts();
      await loadSummary();
    } else {
      const err = await res.json() as { error?: string };
      toast.error(err.error ?? "Failed to record payout");
    }
    setSavingPayout(false);
  }

  // ─── Affiliate Handlers ──────────────────────────────────────────────────────

  async function handleAddAffiliate() {
    if (!affiliateForm.name.trim() || !affiliateForm.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    const commValue = parseFloat(affiliateForm.default_commission_value);
    if (isNaN(commValue) || commValue < 0) {
      toast.error("Commission value must be a non-negative number");
      return;
    }
    setSavingAffiliate(true);
    const body: Record<string, unknown> = {
      name: affiliateForm.name.trim(),
      email: affiliateForm.email.trim(),
      default_commission_type: affiliateForm.default_commission_type,
      default_commission_value: affiliateForm.default_commission_type === "fixed"
        ? Math.round(commValue * 100)
        : commValue,
    };
    if (affiliateForm.phone.trim()) body.phone = affiliateForm.phone.trim();
    if (affiliateForm.notes.trim()) body.notes = affiliateForm.notes.trim();

    const res = await fetch("/api/dashboard/affiliate-commission/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast.success("Affiliate added");
      setAddAffiliateOpen(false);
      setAffiliateForm({
        name: "",
        email: "",
        phone: "",
        notes: "",
        default_commission_type: "percentage",
        default_commission_value: "10",
      });
      await loadAffiliates();
    } else {
      const err = await res.json() as { detail?: string; title?: string };
      toast.error(err.detail ?? err.title ?? "Failed to add affiliate");
    }
    setSavingAffiliate(false);
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/affiliates">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Commission Management</h1>
          <p className="text-muted-foreground">
            Define rules, record ledger entries, and track payouts to your affiliates.
          </p>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      {summary.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Commission Earned</CardTitle>
              <TrendingUp className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCents(summary.reduce((s, a) => s + a.total_earned, 0))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
              <Clock className="size-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-600">
                {formatCents(summary.reduce((s, a) => s + a.pending + a.approved, 0))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
              <Wallet className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-sky-600">
                {formatCents(summary.reduce((s, a) => s + a.paid, 0))}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="rules">Commission Rules</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="links">Referral Links</TabsTrigger>
          <TabsTrigger value="summary">Per-Affiliate</TabsTrigger>
        </TabsList>

        {/* ── TAB 0: Affiliates ── */}
        <TabsContent value="affiliates" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {affiliates.length} affiliate{affiliates.length !== 1 ? "s" : ""}
            </p>
            <Button size="sm" onClick={() => setAddAffiliateOpen(true)}>
              <Plus className="mr-2 size-4" />
              Add Affiliate
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {affiliatesLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : affiliates.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No affiliates yet. Add your first affiliate to get started.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Total Earned</TableHead>
                        <TableHead>Pending</TableHead>
                        <TableHead>Paid Out</TableHead>
                        <TableHead className="text-right">Detail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {affiliates.map((aff) => (
                        <TableRow key={aff.id}>
                          <TableCell className="font-medium">{aff.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{aff.email}</TableCell>
                          <TableCell>{statusBadge(aff.status)}</TableCell>
                          <TableCell>
                            {aff.default_commission_type === "percentage"
                              ? `${aff.default_commission_value}%`
                              : formatCents(aff.default_commission_value)}
                          </TableCell>
                          <TableCell className="font-medium">{formatCents(aff.total_earned)}</TableCell>
                          <TableCell className="text-amber-600">{formatCents(aff.pending_commission + aff.approved_commission)}</TableCell>
                          <TableCell className="text-sky-600">{formatCents(aff.total_paid_out)}</TableCell>
                          <TableCell className="text-right">
                            <Button asChild variant="ghost" size="icon" className="size-8">
                              <Link href={`/dashboard/affiliate-commission/${aff.id}`}>
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
        </TabsContent>

        {/* ── TAB 1: Rules ── */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {rules.length} rule{rules.length !== 1 ? "s" : ""}
            </p>
            <Button size="sm" onClick={openAddRule}>
              <Plus className="mr-2 size-4" />
              Add Rule
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {rulesLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : rules.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No commission rules yet. Add one to auto-calculate commissions.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rule Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Applies To</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell className="font-medium">{rule.rule_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{rule.rule_type}</Badge>
                          </TableCell>
                          <TableCell>
                            {rule.rule_type === "percentage"
                              ? `${rule.rate}%`
                              : formatCents(rule.rate)}
                          </TableCell>
                          <TableCell className="capitalize">{rule.applies_to}</TableCell>
                          <TableCell>
                            {rule.is_active ? (
                              <span className="text-green-600 text-sm font-medium">Yes</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">No</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => openEditRule(rule)}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => handleToggleRule(rule)}
                                title={rule.is_active ? "Deactivate" : "Activate"}
                              >
                                {rule.is_active ? (
                                  <X className="size-3.5 text-muted-foreground" />
                                ) : (
                                  <Check className="size-3.5 text-green-600" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteRule(rule)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
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

        {/* ── TAB 2: Ledger ── */}
        <TabsContent value="ledger" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={ledgerStatusFilter || "_all"} onValueChange={(v) => setLedgerStatusFilter(v === "_all" ? "" : v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLedgerCursor(null);
                void loadLedger(true);
              }}
            >
              Filter
            </Button>
            <div className="ml-auto">
              <Button size="sm" onClick={() => setRecordLedgerOpen(true)}>
                <Plus className="mr-2 size-4" />
                Record Commission
              </Button>
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              {ledgerLoading && ledger.length === 0 ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : ledger.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No ledger entries found.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Affiliate ID</TableHead>
                          <TableHead>Order Amount</TableHead>
                          <TableHead>Commission</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ledger.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="whitespace-nowrap">
                              {formatDateStr(entry.created_at)}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {entry.affiliate_user_id.slice(0, 8)}…
                            </TableCell>
                            <TableCell>{formatCents(entry.order_amount_cents)}</TableCell>
                            <TableCell className="font-medium">
                              {formatCents(entry.commission_amount_cents)}
                            </TableCell>
                            <TableCell>{statusBadge(entry.status)}</TableCell>
                            <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                              {entry.description ?? "—"}
                            </TableCell>
                            <TableCell>
                              {entry.status === "pending" && (
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-green-600 hover:text-green-700"
                                    onClick={() => handleLedgerAction(entry.id, "approve")}
                                    disabled={actioningEntry === entry.id}
                                    title="Approve"
                                  >
                                    {actioningEntry === entry.id ? (
                                      <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                      <Check className="size-3.5" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-destructive hover:text-destructive"
                                    onClick={() => handleLedgerAction(entry.id, "reject")}
                                    disabled={actioningEntry === entry.id}
                                    title="Reject"
                                  >
                                    <X className="size-3.5" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {ledgerHasMore && (
                    <div className="flex justify-center py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadLedger(false)}
                        disabled={ledgerLoading}
                      >
                        {ledgerLoading ? (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : null}
                        Load More
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 3: Payouts ── */}
        <TabsContent value="payouts" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setPayoutDialogOpen(true)}>
              <Plus className="mr-2 size-4" />
              Record Payout
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {payoutsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : payouts.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No payouts recorded yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Affiliate ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDateStr(payout.paid_at)}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {payout.affiliate_user_id.slice(0, 8)}…
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCents(payout.amount_cents)}
                          </TableCell>
                          <TableCell className="capitalize">
                            {payout.payout_method ?? "—"}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {payout.reference_number ?? "—"}
                          </TableCell>
                          <TableCell>{statusBadge(payout.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 4: Referral Links ── */}
        <TabsContent value="links" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            All referral links across your affiliate network. Manage individual links from each affiliate&apos;s detail page.
          </p>
          <Card>
            <CardContent className="p-0">
              {linksLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : links.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No referral links yet. Generate links from each affiliate&apos;s detail page.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>URL</TableHead>
                        <TableHead>Affiliate</TableHead>
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
                          <TableCell className="font-mono text-xs">
                            {link.affiliate_id.slice(0, 8)}…
                          </TableCell>
                          <TableCell className="text-sm capitalize">
                            {link.product_type ?? "—"}
                          </TableCell>
                          <TableCell>{link.clicks}</TableCell>
                          <TableCell>{link.conversions}</TableCell>
                          <TableCell>
                            {link.is_active ? (
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                                active
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                                inactive
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => {
                                navigator.clipboard.writeText(link.url);
                                toast.success("Link copied");
                              }}
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
        </TabsContent>

        {/* ── TAB 5: Per-Affiliate Summary ── */}
        <TabsContent value="summary" className="space-y-4">
          {summaryLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : summary.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No commission data yet.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {summary.map((aff) => (
                <Card key={aff.affiliate_user_id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {aff.name ?? "Unknown Affiliate"}
                    </CardTitle>
                    {aff.email && (
                      <CardDescription>{aff.email}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Earned</span>
                      <span className="font-medium">{formatCents(aff.total_earned)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pending</span>
                      <span className="text-amber-600">{formatCents(aff.pending)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Approved</span>
                      <span className="text-green-600">{formatCents(aff.approved)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paid</span>
                      <span className="text-sky-600">{formatCents(aff.paid)}</span>
                    </div>
                    {aff.last_payout_at && (
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-muted-foreground">Last Payout</span>
                        <span>{formatDateStr(aff.last_payout_at)}</span>
                      </div>
                    )}
                    <div className="pt-2">
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href={`/dashboard/affiliate-commission/${aff.affiliate_user_id}`}>
                          <Eye className="mr-2 size-3.5" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Dialog: Add Affiliate ── */}
      <Dialog open={addAffiliateOpen} onOpenChange={setAddAffiliateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Affiliate</DialogTitle>
            <DialogDescription>
              Create a new affiliate under your network. They will be set to active immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aff-name">Full Name</Label>
              <Input
                id="aff-name"
                value={affiliateForm.name}
                onChange={(e) => setAffiliateForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Jane Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aff-email">Email</Label>
              <Input
                id="aff-email"
                type="email"
                value={affiliateForm.email}
                onChange={(e) => setAffiliateForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="jane@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aff-phone">Phone (optional)</Label>
              <Input
                id="aff-phone"
                value={affiliateForm.phone}
                onChange={(e) => setAffiliateForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+1 555 000 0000"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aff-comm-type">Commission Type</Label>
                <Select
                  value={affiliateForm.default_commission_type}
                  onValueChange={(v) =>
                    setAffiliateForm((f) => ({
                      ...f,
                      default_commission_type: v as "percentage" | "fixed",
                    }))
                  }
                >
                  <SelectTrigger id="aff-comm-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="aff-comm-value">
                  {affiliateForm.default_commission_type === "percentage" ? "Rate (%)" : "Amount ($)"}
                </Label>
                <Input
                  id="aff-comm-value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={affiliateForm.default_commission_value}
                  onChange={(e) =>
                    setAffiliateForm((f) => ({ ...f, default_commission_value: e.target.value }))
                  }
                  placeholder={affiliateForm.default_commission_type === "percentage" ? "10" : "5.00"}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="aff-notes">Notes (optional)</Label>
              <Input
                id="aff-notes"
                value={affiliateForm.notes}
                onChange={(e) => setAffiliateForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Referred by John"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAffiliateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAffiliate} disabled={savingAffiliate}>
              {savingAffiliate ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Add Affiliate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Add/Edit Rule ── */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Rule" : "Add Commission Rule"}</DialogTitle>
            <DialogDescription>
              {editingRule
                ? "Update this commission rule."
                : "Create a new rule. The most recently created active rule will be used when recording commissions."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rule-name">Rule Name</Label>
              <Input
                id="rule-name"
                value={ruleForm.rule_name}
                onChange={(e) => setRuleForm((f) => ({ ...f, rule_name: e.target.value }))}
                placeholder="Standard 10%"
              />
            </div>
            {!editingRule && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="rule-type">Type</Label>
                  <Select
                    value={ruleForm.rule_type}
                    onValueChange={(v) =>
                      setRuleForm((f) => ({ ...f, rule_type: v as "percentage" | "fixed" }))
                    }
                  >
                    <SelectTrigger id="rule-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rule-applies">Applies To</Label>
                  <Select
                    value={ruleForm.applies_to}
                    onValueChange={(v) => setRuleForm((f) => ({ ...f, applies_to: v }))}
                  >
                    <SelectTrigger id="rule-applies">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="booking">Booking</SelectItem>
                      <SelectItem value="subscription">Subscription</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="rule-rate">
                Rate{" "}
                <span className="text-muted-foreground text-xs">
                  {ruleForm.rule_type === "percentage" ? "(0–100)" : "($ amount)"}
                </span>
              </Label>
              <Input
                id="rule-rate"
                type="number"
                min="0"
                step="0.01"
                value={ruleForm.rate}
                onChange={(e) => setRuleForm((f) => ({ ...f, rate: e.target.value }))}
                placeholder={ruleForm.rule_type === "percentage" ? "10" : "5.00"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule} disabled={savingRule}>
              {savingRule ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              {editingRule ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Record Ledger Entry ── */}
      <Dialog open={recordLedgerOpen} onOpenChange={setRecordLedgerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Commission Entry</DialogTitle>
            <DialogDescription>
              Manually record a commission. The active rule will be used to auto-calculate
              the commission amount.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ledger-aff">Affiliate User ID</Label>
              <Input
                id="ledger-aff"
                value={ledgerForm.affiliate_user_id}
                onChange={(e) =>
                  setLedgerForm((f) => ({ ...f, affiliate_user_id: e.target.value }))
                }
                placeholder="UUID of affiliate auth user"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ledger-order">Order Amount ($)</Label>
              <Input
                id="ledger-order"
                type="number"
                min="0"
                step="0.01"
                value={ledgerForm.order_amount_cents}
                onChange={(e) =>
                  setLedgerForm((f) => ({ ...f, order_amount_cents: e.target.value }))
                }
                placeholder="100.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ledger-desc">Description (optional)</Label>
              <Input
                id="ledger-desc"
                value={ledgerForm.description}
                onChange={(e) =>
                  setLedgerForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Booking for Jane"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ledger-start">Period Start</Label>
                <Input
                  id="ledger-start"
                  type="date"
                  value={ledgerForm.period_start}
                  onChange={(e) =>
                    setLedgerForm((f) => ({ ...f, period_start: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ledger-end">Period End</Label>
                <Input
                  id="ledger-end"
                  type="date"
                  value={ledgerForm.period_end}
                  onChange={(e) =>
                    setLedgerForm((f) => ({ ...f, period_end: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordLedgerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordLedger} disabled={savingLedger}>
              {savingLedger ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Record Payout ── */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payout</DialogTitle>
            <DialogDescription>
              Record an external payout you made to an affiliate. Linked ledger entries
              will be marked as paid.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payout-aff">Affiliate User ID</Label>
              <Input
                id="payout-aff"
                value={payoutForm.affiliate_user_id}
                onChange={(e) =>
                  setPayoutForm((f) => ({ ...f, affiliate_user_id: e.target.value }))
                }
                placeholder="UUID of affiliate auth user"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout-amount">Amount Paid ($)</Label>
              <Input
                id="payout-amount"
                type="number"
                min="0"
                step="0.01"
                value={payoutForm.amount_cents}
                onChange={(e) =>
                  setPayoutForm((f) => ({ ...f, amount_cents: e.target.value }))
                }
                placeholder="50.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout-method">Payment Method</Label>
              <Select
                value={payoutForm.payout_method || "_none"}
                onValueChange={(v) =>
                  setPayoutForm((f) => ({
                    ...f,
                    payout_method: v === "_none" ? "" : v,
                  }))
                }
              >
                <SelectTrigger id="payout-method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">— Select method —</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout-ref">Reference Number (optional)</Label>
              <Input
                id="payout-ref"
                value={payoutForm.reference_number}
                onChange={(e) =>
                  setPayoutForm((f) => ({ ...f, reference_number: e.target.value }))
                }
                placeholder="TXN-12345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout-notes">Notes (optional)</Label>
              <Input
                id="payout-notes"
                value={payoutForm.notes}
                onChange={(e) =>
                  setPayoutForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="April commission payout"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout-entries">
                Ledger Entry IDs to mark as paid (optional, comma-separated)
              </Label>
              <Input
                id="payout-entries"
                placeholder="uuid1, uuid2, ..."
                onChange={(e) => {
                  const ids = e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                  setPayoutForm((f) => ({ ...f, ledger_entry_ids: ids }));
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayout} disabled={savingPayout}>
              {savingPayout ? <Loader2 className="mr-2 size-4 animate-spin" /> : (
                <DollarSign className="mr-2 size-4" />
              )}
              Record Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
