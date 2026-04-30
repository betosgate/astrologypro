"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Check,
  CreditCard,
  Download,
  ExternalLink,
  Loader2,
  Minus,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  BirthCityAutocomplete,
  extractCountryFromCityLabel,
} from "@/components/community/birth-city-autocomplete";

// ─── Types ───────────────────────────────────────────────────────────────────

type PlanTier = {
  id: string;
  name: string;
  base_price: number;
  included_members: number;
  extra_member_price: number;
  max_total_members: number;
};

type FamilyMember = {
  id: string;
  full_name: string;
  date_of_birth: string;
  relationship: string | null;
  age_group: "child" | "adult";
  birth_time: string | null;
  birth_city: string | null;
  birth_country: string | null;
  notes: string | null;
  is_extra: boolean;
};

type Plan = {
  tier: PlanTier;
  status: string;
  current_period_end: string | null;
  family_members: FamilyMember[];
  member_count: number;
  extra_member_count: number;
  extra_member_charge: number;
  total_monthly: number;
  available_tiers: PlanTier[];
};

type Invoice = {
  id: string;
  number: string | null;
  created: number;
  period_start: number;
  period_end: number;
  amount_paid: number;
  status: string;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
};

type PreviewResult = {
  base_price: number;
  included_members: number;
  extra_count: number;
  extra_price_per: number;
  extra_total: number;
  total: number;
};

const EMPTY_FORM = {
  fullName: "",
  dateOfBirth: "",
  birthTime: "",
  birthCity: "",
  birthCountry: "",
  birthLat: "",
  birthLng: "",
  relationship: "",
  notes: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formats a dollar-denominated amount (from our API). */
function formatMoney(dollars: number): string {
  return `$${Number(dollars).toFixed(2)}`;
}

/** Formats a Stripe amount returned in cents. */
function formatStripeCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPeriod(start: number, end: number): string {
  const fmt = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  return `${fmt(start)} – ${fmt(end)}`;
}

function formatNextBilling(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function invoiceStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "paid":
      return "default";
    case "open":
      return "secondary";
    case "void":
      return "outline";
    default:
      return "destructive";
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CommunityPlanPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = searchParams.get("tab") ?? "overview";

  function setTab(tab: string) {
    router.push(`/community/plan?tab=${tab}`, { scroll: false });
  }

  // ── Plan state ──
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [planError, setPlanError] = useState<string | null>(null);

  // ── Subscription state ──
  const [subscription, setSubscription] = useState<{
    current_period_end: string | null;
    status: string | null;
  } | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const loadSubscription = useCallback(async () => {
    setSubscriptionLoading(true);
    try {
      const res = await fetch("/api/pm/subscription");
      if (res.ok) {
        const d = await res.json();
        setSubscription(d.subscription ?? null);
      }
    } catch (err) {
      console.error("Failed to load subscription info:", err);
    } finally {
      setSubscriptionLoading(false);
    }
  }, []);

  const loadPlan = useCallback(async () => {
    setPlanLoading(true);
    setPlanError(null);
    try {
      const res = await fetch("/api/community/plan");
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to load plan");
      }
      const body = await res.json();
      // API wraps the plan object under { plan: { ... } }
      setPlan(body.plan ?? body);
    } catch (err: unknown) {
      setPlanError(err instanceof Error ? err.message : "Failed to load plan");
    } finally {
      setPlanLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlan();
    loadSubscription();
  }, [loadPlan, loadSubscription]);

  // Toast + refresh when the user returns from Stripe conversion checkout.
  useEffect(() => {
    const conversion = searchParams.get("conversion");
    if (conversion === "success") {
      toast.success("Payment confirmed. Your plan has been upgraded.");
      loadPlan();
      router.replace(`/community/plan?tab=${activeTab}`, { scroll: false });
    } else if (conversion === "cancelled") {
      toast.info("Checkout cancelled. Your current plan is unchanged.");
      router.replace(`/community/plan?tab=${activeTab}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ── Invoices state ──
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesLoaded, setInvoicesLoaded] = useState(false);

  const loadInvoices = useCallback(async () => {
    if (invoicesLoaded) return;
    setInvoicesLoading(true);
    try {
      const res = await fetch("/api/community/plan/invoices");
      if (res.ok) {
        const d = await res.json();
        setInvoices(d.invoices ?? []);
        setInvoicesLoaded(true);
      }
    } finally {
      setInvoicesLoading(false);
    }
  }, [invoicesLoaded]);

  useEffect(() => {
    if (activeTab === "billing") {
      loadInvoices();
    }
  }, [activeTab, loadInvoices]);

  // ── Tier switch (preview → confirm / checkout / blocked) ──
  type TierSwitchDecision =
    | "active_subscription_upgrade"
    | "requires_recurring_checkout"
    | "blocked_payment_state";

  type TierSwitchPreview = {
    decision: TierSwitchDecision;
    subscription_status?: string;
    reason?: string;
    can_fix_via_billing_portal?: boolean;
    current_tier: { id: string; name: string; price_cents: number } | null;
    target_tier: { id: string; name: string; price_cents: number };
    preview?: {
      current_plan_price_cents: number;
      target_plan_price_cents: number;
      prorated_amount_due_cents: number;
      next_renewal_amount_cents: number;
      billing_period_start: string | null;
      billing_period_end: string | null;
      new_renewal_date: string | null;
    };
    currency: string;
  };

  const [switchingTier, setSwitchingTier] = useState<PlanTier | null>(null);
  const [tierSwitchLoading, setTierSwitchLoading] = useState(false);
  const [tierSwitchPreview, setTierSwitchPreview] =
    useState<TierSwitchPreview | null>(null);
  const [tierSwitchPreviewLoading, setTierSwitchPreviewLoading] =
    useState(false);

  // Fetch preview whenever a new tier is selected
  useEffect(() => {
    if (!switchingTier) {
      setTierSwitchPreview(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setTierSwitchPreviewLoading(true);
      setTierSwitchPreview(null);
      try {
        const res = await fetch(
          "/api/community/plan/change-tier/preview",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ target_tier_id: switchingTier.id }),
          }
        );
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "Failed to load upgrade preview");
        if (!cancelled) setTierSwitchPreview(d as TierSwitchPreview);
      } catch (err: unknown) {
        if (!cancelled) {
          toast.error(
            err instanceof Error ? err.message : "Failed to load upgrade preview"
          );
          setSwitchingTier(null);
        }
      } finally {
        if (!cancelled) setTierSwitchPreviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [switchingTier]);

  async function handleTierSwitchConfirm() {
    if (!switchingTier || !tierSwitchPreview) return;

    setTierSwitchLoading(true);
    try {
      if (tierSwitchPreview.decision === "active_subscription_upgrade") {
        // Pay prorated difference + swap Stripe subscription item
        const res = await fetch("/api/community/plan/change-tier/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target_tier_id: switchingTier.id }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "Failed to switch plan");
        toast.success(`Switched to ${switchingTier.name} plan`);
        setSwitchingTier(null);
        await loadPlan();
      } else if (tierSwitchPreview.decision === "requires_recurring_checkout") {
        // Start a new recurring Stripe Checkout — pm_tier_id is written by
        // the webhook only after the checkout completes.
        const res = await fetch(
          "/api/community/plan/change-tier/checkout",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ target_tier_id: switchingTier.id }),
          }
        );
        const d = await res.json();
        if (!res.ok || !d.checkout_url)
          throw new Error(d.error ?? "Failed to create checkout session");
        window.location.href = d.checkout_url;
      } else {
        // Blocked — handled by the dedicated button below; shouldn't hit this
        toast.error(
          tierSwitchPreview.reason ??
            "Your payment method needs attention before switching plans."
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to switch plan");
    } finally {
      setTierSwitchLoading(false);
    }
  }

  async function handleFixPaymentMethod() {
    try {
      const res = await fetch("/api/community/billing-portal", {
        method: "POST",
      });
      const d = await res.json();
      if (!res.ok || !d.url)
        throw new Error(d.error ?? "Failed to open billing portal");
      window.location.href = d.url;
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to open billing portal"
      );
    }
  }

  // ── Price calculator ──
  const [calcMembers, setCalcMembers] = useState(1);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!plan) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await fetch(
          `/api/community/plan/preview?members=${calcMembers}`
        );
        if (res.ok) setPreview(await res.json());
      } finally {
        setPreviewLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [calcMembers, plan]);

  // ── Add member ──
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] = useState({ ...EMPTY_FORM });
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [addPreview, setAddPreview] = useState<PreviewResult | null>(null);
  const [addPreviewLoading, setAddPreviewLoading] = useState(false);
  const addMemberMissingCoordinates =
    Boolean(memberForm.birthCity.trim()) &&
    (!memberForm.birthLat.trim() || !memberForm.birthLng.trim());

  // Fetch add-member price preview whenever drawer opens
  useEffect(() => {
    if (!showAddMember || !plan) return;
    const nextCount = plan.member_count + 1;
    setAddPreviewLoading(true);
    fetch(`/api/community/plan/preview?members=${nextCount}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAddPreview(d))
      .finally(() => setAddPreviewLoading(false));
  }, [showAddMember, plan]);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setAddMemberLoading(true);
    setAddMemberError(null);
    try {
      const res = await fetch("/api/community/plan/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberForm),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed to add member");
      toast.success(
        `Member added. Your plan now includes ${(plan?.member_count ?? 0) + 1} members.`
      );
      setShowAddMember(false);
      setMemberForm({ ...EMPTY_FORM });
      await loadPlan();
    } catch (err: unknown) {
      setAddMemberError(
        err instanceof Error ? err.message : "Failed to add member"
      );
    } finally {
      setAddMemberLoading(false);
    }
  }

  // ── Remove member ──
  const [removingMember, setRemovingMember] = useState<FamilyMember | null>(
    null
  );
  const [removeLoading, setRemoveLoading] = useState(false);

  async function handleRemoveMember() {
    if (!removingMember || !plan) return;
    setRemoveLoading(true);
    try {
      const res = await fetch(
        `/api/community/plan/members/${removingMember.id}`,
        { method: "DELETE" }
      );
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? "Failed to remove member");
      toast.success(`${removingMember.full_name} removed from your plan.`);
      setRemovingMember(null);
      await loadPlan();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove member"
      );
    } finally {
      setRemoveLoading(false);
    }
  }

  // ── Cancel / uncancel ──
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showUncancelDialog, setShowUncancelDialog] = useState(false);
  const [uncancelLoading, setUncancelLoading] = useState(false);

  async function handleCancel() {
    setCancelLoading(true);
    try {
      const res = await fetch("/api/community/plan/cancel", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed to schedule cancellation");
      toast.success("Cancellation scheduled. You retain access until your billing period ends.");
      setShowCancelDialog(false);
      await loadPlan();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to schedule cancellation");
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleUncancel() {
    setUncancelLoading(true);
    try {
      const res = await fetch("/api/community/plan/uncancel", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed to reverse cancellation");
      toast.success("Cancellation reversed. Your membership will renew as normal.");
      setShowUncancelDialog(false);
      await loadPlan();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reverse cancellation");
    } finally {
      setUncancelLoading(false);
    }
  }

  // ── Billing portal ──
  const [portalLoading, setPortalLoading] = useState(false);

  async function handleBillingPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/community/billing-portal", {
        method: "POST",
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed to open billing portal");
      window.location.href = d.url;
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to open billing portal"
      );
      setPortalLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  const maxMembers = plan?.tier.max_total_members ?? 10;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manage Your Plan</h1>
        <p className="text-muted-foreground">Perennial Mandalism Membership</p>
      </div>

      {planError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {planError}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview" className="flex-1 sm:flex-none">
            Overview
          </TabsTrigger>
          <TabsTrigger value="members" className="flex-1 sm:flex-none">
            Members
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex-1 sm:flex-none">
            Billing
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Overview ── */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Current plan card */}
          {planLoading ? (
            <Card>
              <CardContent className="space-y-3 py-6">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ) : plan ? (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-lg">🔮</span>
                    {plan.tier.name}
                  </CardTitle>
                  <Badge
                    variant={plan.status === "active" ? "default" : "secondary"}
                    className="uppercase text-xs tracking-wider"
                  >
                    {plan.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Base ({plan.tier.name}, up to {plan.tier.included_members}{" "}
                      members)
                    </span>
                    <span>{formatMoney(plan.tier.base_price)}/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Extra members ({plan.extra_member_count} ×{" "}
                      {formatMoney(plan.tier.extra_member_price)})
                    </span>
                    <span>{formatMoney(plan.extra_member_charge)}</span>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatMoney(plan.total_monthly)}/month</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">
                      Next billing:
                    </span>{" "}
                    {subscriptionLoading ? (
                      <span className="animate-pulse">Loading...</span>
                    ) : subscription?.current_period_end ? (
                      plan?.status === "cancelling"
                        ? `Access until ${formatNextBilling(subscription.current_period_end)}`
                        : formatNextBilling(subscription.current_period_end)
                    ) : plan?.current_period_end ? (
                      // Fallback to plan date if subscription fetch hasn't finished or failed
                      plan.status === "cancelling"
                        ? `Access until ${formatNextBilling(plan.current_period_end)}`
                        : formatNextBilling(plan.current_period_end)
                    ) : (
                      "—"
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Members:</span>{" "}
                    {plan.member_count} of {plan.tier.included_members} included
                  </div>
                </div>

                {/* Cancel / uncancel actions */}
                <Separator />
                <div className="pt-1">
                  {plan.status === "cancelling" ? (
                    <div className="space-y-2">
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Your membership is set to cancel at the end of the billing period. You still have full access until then.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowUncancelDialog(true)}
                      >
                        Keep My Membership
                      </Button>
                    </div>
                  ) : plan.status === "active" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setShowCancelDialog(true)}
                    >
                      Cancel Membership
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Available plan tiers */}
          {plan && plan.available_tiers.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Available Plans
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {plan.available_tiers.map((tier) => {
                  const isCurrent = tier.id === plan.tier.id;
                  return (
                    <Card
                      key={tier.id}
                      className={
                        isCurrent
                          ? "border-primary ring-1 ring-primary"
                          : undefined
                      }
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{tier.name}</CardTitle>
                          {isCurrent && (
                            <div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="size-3" />
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-sm space-y-1 text-muted-foreground">
                          <p>
                            <span className="text-foreground font-medium">
                              {formatMoney(tier.base_price)}/mo
                            </span>{" "}
                            — includes {tier.included_members} member
                            {tier.included_members !== 1 ? "s" : ""}
                          </p>
                          <p>
                            +{formatMoney(tier.extra_member_price)}/mo per extra
                            member
                          </p>
                          <p>Up to {tier.max_total_members} members total</p>
                        </div>
                        {!isCurrent && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => setSwitchingTier(tier)}
                          >
                            Switch to This Plan
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price calculator */}
          {plan && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Price Calculator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    How many members? ({calcMembers})
                  </Label>
                  <div className="flex items-center gap-3">
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-8 shrink-0"
                      disabled={calcMembers <= 1}
                      onClick={() =>
                        setCalcMembers((n) => Math.max(1, n - 1))
                      }
                      aria-label="Decrease members"
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <div className="flex-1">
                      <input
                        type="range"
                        min={1}
                        max={maxMembers}
                        value={calcMembers}
                        onChange={(e) =>
                          setCalcMembers(Number(e.target.value))
                        }
                        className="w-full accent-primary"
                        aria-label="Member count slider"
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-8 shrink-0"
                      disabled={calcMembers >= maxMembers}
                      onClick={() =>
                        setCalcMembers((n) => Math.min(maxMembers, n + 1))
                      }
                      aria-label="Increase members"
                    >
                      <Plus className="size-3.5" />
                    </Button>
                    <span className="w-4 text-center font-medium tabular-nums text-sm">
                      {calcMembers}
                    </span>
                  </div>
                </div>

                {previewLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                ) : preview ? (
                  <div className="rounded-md border bg-muted/30 p-4 space-y-1.5 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>
                        Base (covers {preview.included_members} member
                        {preview.included_members !== 1 ? "s" : ""})
                      </span>
                      <span>{formatMoney(preview.base_price)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>
                        Extra ({preview.extra_count} ×{" "}
                        {formatMoney(preview.extra_price_per)})
                      </span>
                      <span>{formatMoney(preview.extra_total)}</span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{formatMoney(preview.total)}/month</span>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Tab 2: Members ── */}
        <TabsContent value="members" className="mt-6 space-y-5">
          {planLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : plan ? (
            <>
              {/* Summary bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {plan.member_count} of {plan.tier.included_members} included
                    seats used
                  </span>
                  {plan.extra_member_count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {plan.extra_member_count} extra @{" "}
                      {formatMoney(plan.extra_member_charge)}/mo
                    </Badge>
                  )}
                </div>
                <Progress
                  value={Math.min(
                    100,
                    (plan.member_count / plan.tier.included_members) * 100
                  )}
                  className="h-2"
                  aria-label={`${plan.member_count} of ${plan.tier.included_members} seats used`}
                />
              </div>

              {/* Add member button */}
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => {
                    setMemberForm({ ...EMPTY_FORM });
                    setAddMemberError(null);
                    setAddPreview(null);
                    setShowAddMember(true);
                  }}
                  disabled={plan.member_count >= plan.tier.max_total_members}
                >
                  <Plus className="mr-1.5 size-4" />
                  Add Member
                </Button>
              </div>

              {/* Members list */}
              {plan.family_members.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
                      <Users className="size-7 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold">No members yet</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Add members to your plan to include them in your
                        membership.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {plan.family_members.map((m) => {
                    const dob = new Date(m.date_of_birth + "T12:00:00");
                    return (
                      <Card key={m.id}>
                        <CardContent className="flex items-center justify-between gap-4 py-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                              {m.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm">
                                  {m.full_name}
                                </p>
                                {m.relationship && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs capitalize"
                                  >
                                    {m.relationship}
                                  </Badge>
                                )}
                                <Badge
                                  variant="outline"
                                  className="text-xs capitalize"
                                >
                                  {m.age_group}
                                </Badge>
                                {m.is_extra && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs bg-amber-100 text-amber-800 border-amber-300"
                                  >
                                    +{formatMoney(plan.tier.extra_member_price)}
                                    /mo
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {dob.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setRemovingMember(m)}
                            aria-label={`Remove ${m.full_name}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          ) : null}
        </TabsContent>

        {/* ── Tab 3: Billing ── */}
        <TabsContent value="billing" className="mt-6 space-y-6">
          {/* Payment method */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="size-4 text-muted-foreground" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Manage your payment method, cancel, or update billing info via
                the Stripe customer portal.
              </p>
              <Button
                variant="outline"
                onClick={handleBillingPortal}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 size-4" />
                )}
                Open Billing Portal
              </Button>
            </CardContent>
          </Card>

          {/* Invoice history */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Invoice History
            </h2>

            {invoicesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : invoicesLoaded && invoices.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No invoices yet.
                </CardContent>
              </Card>
            ) : invoices.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                      <th className="px-4 py-3 text-left font-medium">
                        Invoice #
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                      <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">
                        Period
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {inv.number ?? inv.id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatDate(inv.created)}
                        </td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-muted-foreground sm:table-cell">
                          {formatPeriod(inv.period_start, inv.period_end)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatStripeCents(inv.amount_paid)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={invoiceStatusVariant(inv.status)}
                            className="capitalize text-xs"
                          >
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {inv.invoice_pdf && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-7"
                                asChild
                                aria-label="Download PDF"
                              >
                                <a
                                  href={inv.invoice_pdf}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                >
                                  <Download className="size-3.5" />
                                </a>
                              </Button>
                            )}
                            {inv.hosted_invoice_url && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-7"
                                asChild
                                aria-label="View invoice"
                              >
                                <a
                                  href={inv.hosted_invoice_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="size-3.5" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Tier switch confirmation dialog ── */}
      <Dialog
        open={!!switchingTier}
        onOpenChange={(open) => !open && !tierSwitchLoading && setSwitchingTier(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch to {switchingTier?.name}?</DialogTitle>
          </DialogHeader>

          {tierSwitchPreviewLoading && (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Calculating upgrade details…
            </div>
          )}

          {!tierSwitchPreviewLoading && tierSwitchPreview && (
            <>
              {/* Active subscription → prorated breakdown */}
              {tierSwitchPreview.decision === "active_subscription_upgrade" &&
                tierSwitchPreview.preview && (
                  <div className="space-y-3 text-sm">
                    <div className="rounded-md border bg-muted/30 p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Current plan</span>
                        <span className="font-medium">
                          {tierSwitchPreview.current_tier?.name ?? "—"} ·{" "}
                          {formatStripeCents(
                            tierSwitchPreview.preview.current_plan_price_cents
                          )}
                          /mo
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">New plan</span>
                        <span className="font-medium">
                          {tierSwitchPreview.target_tier.name} ·{" "}
                          {formatStripeCents(
                            tierSwitchPreview.preview.target_plan_price_cents
                          )}
                          /mo
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t pt-1.5">
                        <span className="font-medium">Prorated amount due today</span>
                        <span className="font-semibold text-foreground">
                          {formatStripeCents(
                            tierSwitchPreview.preview.prorated_amount_due_cents
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Next renewal</span>
                        <span>
                          {formatStripeCents(
                            tierSwitchPreview.preview.next_renewal_amount_cents
                          )}
                          /mo
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      You will pay the prorated difference today. Your new plan
                      starts after payment succeeds. Your next renewal will
                      charge the full target plan amount.
                    </p>
                  </div>
                )}

              {/* Requires checkout → recurring subscription conversion */}
              {tierSwitchPreview.decision === "requires_recurring_checkout" && (
                <div className="space-y-3 text-sm">
                  <div className="rounded-md border bg-muted/30 p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">New plan</span>
                      <span className="font-medium">
                        {tierSwitchPreview.target_tier.name} ·{" "}
                        {formatStripeCents(
                          tierSwitchPreview.target_tier.price_cents
                        )}
                        /month
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This upgrade starts a recurring subscription. Your new plan
                    starts after checkout is complete.
                  </p>
                </div>
              )}

              {/* Blocked payment state → fix payment method */}
              {tierSwitchPreview.decision === "blocked_payment_state" && (
                <div className="space-y-3 text-sm">
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-destructive-foreground">
                    <p className="text-sm font-medium">
                      Your current subscription is{" "}
                      {tierSwitchPreview.subscription_status ?? "blocked"}.
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {tierSwitchPreview.reason ??
                        "Please update your payment method before switching plans."}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSwitchingTier(null)}
              disabled={tierSwitchLoading}
            >
              Cancel
            </Button>
            {tierSwitchPreview?.decision === "blocked_payment_state" ? (
              <Button
                onClick={handleFixPaymentMethod}
                disabled={tierSwitchLoading}
              >
                Fix payment method
              </Button>
            ) : (
              <Button
                onClick={handleTierSwitchConfirm}
                disabled={
                  tierSwitchLoading ||
                  tierSwitchPreviewLoading ||
                  !tierSwitchPreview
                }
              >
                {tierSwitchLoading && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {tierSwitchPreview?.decision === "requires_recurring_checkout"
                  ? "Continue to checkout"
                  : "Confirm & pay"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add member dialog ── */}
      <Dialog
        open={showAddMember}
        onOpenChange={(open) => !open && setShowAddMember(false)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  value={memberForm.fullName}
                  onChange={(e) =>
                    setMemberForm((f) => ({ ...f, fullName: e.target.value }))
                  }
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Relationship</Label>
                <Input
                  value={memberForm.relationship}
                  onChange={(e) =>
                    setMemberForm((f) => ({
                      ...f,
                      relationship: e.target.value,
                    }))
                  }
                  placeholder="e.g. Spouse, Child, Partner"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>
                  Date of Birth <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  type="date"
                  value={memberForm.dateOfBirth}
                  onChange={(e) =>
                    setMemberForm((f) => ({
                      ...f,
                      dateOfBirth: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label>Birth Time</Label>
                  <span className="text-xs text-muted-foreground">
                    (optional)
                  </span>
                </div>
                <Input
                  type="time"
                  value={memberForm.birthTime}
                  onChange={(e) =>
                    setMemberForm((f) => ({
                      ...f,
                      birthTime: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Birth City</Label>
                <BirthCityAutocomplete
                  value={memberForm.birthCity}
                  onChange={(label, option) => {
                    setMemberForm((f) => {
                      const next = {
                        ...f,
                        birthCity: label,
                        birthLat: "",
                        birthLng: "",
                      };
                      if (!option) return next;
                      return {
                        ...next,
                        birthLat: String(option.lat),
                        birthLng: String(option.lng),
                        birthCountry:
                          extractCountryFromCityLabel(option.label) ||
                          f.birthCountry,
                      };
                    });
                  }}
                  placeholder="City"
                />
                {addMemberMissingCoordinates && (
                  <p className="text-xs text-amber-600">
                    Select a city from suggestions to enable chart generation.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Birth Country</Label>
                <Input
                  value={memberForm.birthCountry}
                  onChange={(e) =>
                    setMemberForm((f) => ({
                      ...f,
                      birthCountry: e.target.value,
                    }))
                  }
                  placeholder="Country"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input
                value={memberForm.notes}
                onChange={(e) =>
                  setMemberForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Any additional notes (optional)"
              />
            </div>

            {/* Live price preview */}
            <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm">
              {addPreviewLoading ? (
                <Skeleton className="h-4 w-48" />
              ) : addPreview && plan ? (
                <span>
                  Adding this member will{" "}
                  {addPreview.extra_count > plan.extra_member_count ? (
                    <span className="font-medium text-foreground">
                      increase your bill by +
                      {formatMoney(plan.tier.extra_member_price)}/mo
                    </span>
                  ) : (
                    <span className="font-medium text-foreground">
                      not change your bill
                    </span>
                  )}
                  . New total:{" "}
                  <span className="font-medium text-foreground">
                    {formatMoney(addPreview.total)}/mo
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Calculating price…
                </span>
              )}
            </div>

            {addMemberError && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                {addMemberError}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddMember(false)}
                disabled={addMemberLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addMemberLoading || addMemberMissingCoordinates}
              >
                {addMemberLoading && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Add Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Cancel membership confirmation dialog ── */}
      <Dialog
        open={showCancelDialog}
        onOpenChange={(open) => !open && setShowCancelDialog(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Membership?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Your membership will remain active until the end of your current
            billing period
            {plan?.current_period_end ? (
              <>
                {" "}
                (
                <span className="font-medium text-foreground">
                  {formatNextBilling(plan.current_period_end)}
                </span>
                )
              </>
            ) : null}
            . After that, your access will end. You can rejoin at any time.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={cancelLoading}
            >
              Keep Membership
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelLoading}
            >
              {cancelLoading && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Cancel at Period End
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Uncancel (reactivate) confirmation dialog ── */}
      <Dialog
        open={showUncancelDialog}
        onOpenChange={(open) => !open && setShowUncancelDialog(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keep Your Membership?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Your pending cancellation will be reversed and your membership will
            renew as normal at the end of the current billing period.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowUncancelDialog(false)}
              disabled={uncancelLoading}
            >
              No, keep it cancelled
            </Button>
            <Button onClick={handleUncancel} disabled={uncancelLoading}>
              {uncancelLoading && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Keep My Membership
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Remove member confirmation dialog ── */}
      <Dialog
        open={!!removingMember}
        onOpenChange={(open) => !open && setRemovingMember(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {removingMember?.full_name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {removingMember?.is_extra && plan ? (
              <>
                This will reduce your monthly bill by{" "}
                <span className="font-medium text-foreground">
                  {formatMoney(plan.tier.extra_member_price)}/mo
                </span>
                .{" "}
              </>
            ) : (
              "This member is within your included seats. "
            )}
            This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setRemovingMember(null)}
              disabled={removeLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={removeLoading}
            >
              {removeLoading && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
