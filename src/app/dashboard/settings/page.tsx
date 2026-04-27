"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PRICING } from "@/lib/constants";
import { toast } from "sonner";
import {
  CalendarConnections,
  type CalendarConnectionSummary,
} from "@/components/dashboard/calendar-connections";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  CreditCard,
  CalendarDays,
  Bell,
  UserCog,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Heart,
  Plus,
  Pencil,
  Trash2,
  Phone,
  Sparkles,
} from "lucide-react";

function formatCurrency(amount: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount);
}

interface DivinerSettings {
  id: string;
  subscription_status: string | null;
  plan_id: string | null;
  stripe_subscription_id: string | null;
  stripe_account_id: string | null;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  paypal_onboarded: boolean;
  paypal_merchant_id: string | null;
  youtube_channel_id: string | null;
  notification_email: boolean;
  notification_sms: boolean;
  notification_booking_confirmed: boolean;
  notification_booking_cancelled: boolean;
  notification_payout: boolean;
  twilio_phone_number: string | null;
  twilio_phone_sid: string | null;
  chime_phone_number: string | null;
  phone_dialin_enabled: boolean;
  phone_mobile: string | null;
  phone_answer_mode: "mobile" | "browser" | "both";
  created_at: string | null;
  service_package_code: string | null;
}

interface StripeSubscriptionDetails {
  id: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  amount: number;
  currency: string;
  interval: string;
  plan_name: string;
  one_time_fee: number;
  one_time_fee_currency: string;
}

interface DiscountRule {
  id: string;
  name: string;
  type: "session_count" | "package";
  min_sessions: number | null;
  discount_percent: number;
  is_active: boolean;
}

interface PricingPlanSummary {
  plan_id: string;
  display_name: string;
  recurring_amount: number | null;
  custom_fields?: { slug?: string; value?: string }[];
}

interface PricingItemSummary {
  item_key?: string;
  plans: PricingPlanSummary[];
}

function UpgradePlanButton({
  newPlanId,
  label,
}: {
  newPlanId: string;
  label: string;
}) {
  const router = useRouter();
  const [upgrading, setUpgrading] = useState(false);

  async function handleUpgrade() {
    if (
      !confirm(
        `Upgrade to ${label}? Your subscription will be updated with proration.`
      )
    )
      return;

    setUpgrading(true);
    try {
      const res = await fetch("/api/stripe/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPlanId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Upgrade failed");
        return;
      }
      toast.success(`Upgraded to ${label}!`);
      router.refresh();
    } catch {
      toast.error("Upgrade failed. Please try again.");
    } finally {
      setUpgrading(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handleUpgrade} disabled={upgrading}>
      {upgrading ? (
        <>
          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
          Upgrading…
        </>
      ) : (
        `Upgrade to ${label}`
      )}
    </Button>
  );
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<DivinerSettings | null>(null);
  const [currentPlanName, setCurrentPlanName] = useState<string | null>(null);
  const [upgradeTargetPlanId, setUpgradeTargetPlanId] = useState<string | null>(null);
  const [upgradeTargetLabel, setUpgradeTargetLabel] = useState<string | null>(null);
  const [calendarConnections, setCalendarConnections] = useState<
    CalendarConnectionSummary[]
  >([]);

  // Stripe Connect live status
  const [stripeStatus, setStripeStatus] = useState<{
    connected: boolean;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    detailsSubmitted?: boolean;
    balance?: { available: number; pending: number };
    recentPayouts?: { id: string; amount: number; currency: string; status: string; arrivalDate: string }[];
  } | null>(null);
  const [stripeStatusLoading, setStripeStatusLoading] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<StripeSubscriptionDetails | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // Phone state
  // phoneProvisioning state removed — admin manages phone number provisioning.
  // phoneSessions state removed — call history lives on /dashboard/phone-calls
  // (the Settings → Phone tab links there instead of duplicating the list).
  const [phoneRequestStatus, setPhoneRequestStatus] = useState<{
    hasPhoneNumber: boolean;
    // Authoritative phone number from the admin-client API (post-reconciliation
    // with the chime_phone_numbers pool). Used as the source of truth for the
    // Phone tab so it doesn't fall through to "Request Phone Number" when the
    // diviner row's column is stale due to drift between the pool table and
    // the diviner row.
    phoneNumber: string | null;
    phoneDialinEnabled: boolean;
    // Shared central platform number — present when the deployment uses a
    // single central line for every diviner (PIN-routed). When set and
    // there's no personal number, the Phone tab shows this with a Shared
    // badge instead of the Request CTA.
    centralPhoneNumber: string | null;
    currentRequest: {
      id: string;
      status: "pending" | "assigned" | "rejected";
      created_at: string;
      rejected_reason: string | null;
    } | null;
    latestRequest: {
      id: string;
      status: "pending" | "assigned" | "rejected";
      created_at: string;
      rejected_reason: string | null;
    } | null;
  } | null>(null);
  const [submittingPhoneRequest, setSubmittingPhoneRequest] = useState(false);

  // Loyalty state
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: "",
    type: "session_count" as "session_count" | "package",
    min_sessions: "",
    discount_percent: "",
  });

  useEffect(() => {
    const calendarStatus = searchParams.get("calendar");
    if (calendarStatus === "connected") {
      toast.success("Google Calendar connected successfully!");
      router.replace("/dashboard/settings", { scroll: false });
    } else if (calendarStatus === "outlook_connected") {
      toast.success("Microsoft Calendar connected successfully!");
      router.replace("/dashboard/settings", { scroll: false });
    } else if (calendarStatus === "error" || calendarStatus === "outlook_error") {
      const reason = searchParams.get("reason");
      toast.error(
        `Failed to connect Calendar${reason ? `: ${reason}` : ""}`
      );
      router.replace("/dashboard/settings", { scroll: false });
    }

    const paypalStatus = searchParams.get("paypal");
    if (paypalStatus === "connected") {
      toast.success("PayPal account connected successfully!");
      router.replace("/dashboard/settings", { scroll: false });
    } else if (paypalStatus === "error") {
      const reason = searchParams.get("reason");
      toast.error(`Failed to connect PayPal${reason ? `: ${reason}` : ""}`);
      router.replace("/dashboard/settings", { scroll: false });
    }

    const stripeStatus = searchParams.get("stripe");
    if (stripeStatus === "complete") {
      toast.success("Stripe account connected! Your payments will be enabled shortly.");
      router.replace("/dashboard/settings?tab=payments", { scroll: false });
    } else if (stripeStatus === "refresh") {
      toast.info("Stripe setup was not completed. Please try again.");
      router.replace("/dashboard/settings?tab=payments", { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("diviners")
        .select(
          "id, subscription_status, plan_id, stripe_subscription_id, stripe_account_id, charges_enabled, payouts_enabled, paypal_onboarded, paypal_merchant_id, youtube_channel_id, notification_email, notification_sms, notification_booking_confirmed, notification_booking_cancelled, notification_payout, twilio_phone_number, twilio_phone_sid, chime_phone_number, phone_dialin_enabled, phone_mobile, phone_answer_mode, created_at, service_package_code"
        )
        .eq("user_id", user.id)
        .single();

      if (data) {
        const { data: connections } = await supabase
          .from("calendar_connections")
          .select("id, provider, email, account_identifier, created_at, updated_at")
          .eq("owner_id", data.id)
          .order("updated_at", { ascending: false })
          .order("created_at", { ascending: false });

        setCalendarConnections(
          (connections ?? []).flatMap((connection) => {
            if (
              connection.provider !== "google" &&
              connection.provider !== "microsoft"
            ) {
              return [];
            }

            return [
              {
                id: String(connection.id),
                provider: connection.provider,
                email:
                  typeof connection.email === "string" ? connection.email : null,
                accountIdentifier: String(connection.account_identifier ?? ""),
                createdAt:
                  typeof connection.created_at === "string"
                    ? connection.created_at
                    : null,
                updatedAt:
                  typeof connection.updated_at === "string"
                    ? connection.updated_at
                    : null,
              },
            ];
          })
        );

        setSettings({
          id: data.id,
          subscription_status: data.subscription_status ?? null,
          plan_id: data.plan_id ?? null,
          stripe_subscription_id: data.stripe_subscription_id ?? null,
          stripe_account_id: data.stripe_account_id ?? null,
          charges_enabled: data.charges_enabled ?? false,
          payouts_enabled: data.payouts_enabled ?? false,
          paypal_onboarded: data.paypal_onboarded ?? false,
          paypal_merchant_id: data.paypal_merchant_id ?? null,
          youtube_channel_id: data.youtube_channel_id ?? null,
          notification_email: data.notification_email ?? true,
          notification_sms: data.notification_sms ?? false,
          notification_booking_confirmed:
            data.notification_booking_confirmed ?? true,
          notification_booking_cancelled:
            data.notification_booking_cancelled ?? true,
          notification_payout: data.notification_payout ?? true,
          twilio_phone_number: data.twilio_phone_number ?? null,
          twilio_phone_sid: data.twilio_phone_sid ?? null,
          chime_phone_number: data.chime_phone_number ?? null,
          phone_dialin_enabled: data.phone_dialin_enabled ?? false,
          phone_mobile: data.phone_mobile ?? null,
          phone_answer_mode: data.phone_answer_mode ?? "both",
          created_at: data.created_at ?? null,
          service_package_code: data.service_package_code ?? null,
        });

        // Fetch subscription details if applicable
        if (data.stripe_subscription_id) {
          setSubscriptionLoading(true);
          fetch("/api/diviner/subscription")
            .then((r) => r.json())
            .then((res) => {
              if (res.subscription) setSubscriptionDetails(res.subscription);
            })
            .catch(() => {})
            .finally(() => setSubscriptionLoading(false));
        }

        // Load discount rules
        const { data: rules } = await supabase
          .from("discount_rules")
          .select("id, name, type, min_sessions, discount_percent, is_active")
          .eq("diviner_id", data.id)
          .order("created_at", { ascending: true });

        if (rules) {
          setDiscountRules(rules);
        }

        // Phone-session history fetch removed — call history now lives on
        // the dedicated /dashboard/phone-calls page, which the Phone tab
        // links to instead of duplicating the list here.

        // Load phone number request status for the Phone tab.
        try {
          const res = await fetch("/api/diviner/phone-requests/me", {
            cache: "no-store",
          });
          if (res.ok) {
            const payload = await res.json();
            setPhoneRequestStatus({
              hasPhoneNumber: !!payload.hasPhoneNumber,
              phoneNumber: payload.phoneNumber ?? null,
              phoneDialinEnabled: !!payload.phoneDialinEnabled,
              centralPhoneNumber: payload.centralPhoneNumber ?? null,
              currentRequest: payload.currentRequest ?? null,
              latestRequest: payload.latestRequest ?? null,
            });
          }
        } catch {
          // Non-fatal — UI will fall back to "Contact admin" messaging.
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleRequestPhoneNumber() {
    if (submittingPhoneRequest) return;
    setSubmittingPhoneRequest(true);
    try {
      const res = await fetch("/api/diviner/phone-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(payload?.error ?? "Could not submit request");
        return;
      }
      toast.success("Phone number request sent to admin");
      // Refetch status so UI flips to "pending" badge.
      const statusRes = await fetch("/api/diviner/phone-requests/me", {
        cache: "no-store",
      });
      if (statusRes.ok) {
        const statusPayload = await statusRes.json();
        setPhoneRequestStatus({
          hasPhoneNumber: !!statusPayload.hasPhoneNumber,
          phoneNumber: statusPayload.phoneNumber ?? null,
          phoneDialinEnabled: !!statusPayload.phoneDialinEnabled,
          centralPhoneNumber: statusPayload.centralPhoneNumber ?? null,
          currentRequest: statusPayload.currentRequest ?? null,
          latestRequest: statusPayload.latestRequest ?? null,
        });
      }
    } catch {
      toast.error("Could not submit request. Please try again.");
    } finally {
      setSubmittingPhoneRequest(false);
    }
  }

  // Fetch live Stripe Connect status whenever stripe_account_id is known
  useEffect(() => {
    if (!settings?.stripe_account_id) return;
    setStripeStatusLoading(true);
    fetch("/api/stripe/connect/status")
      .then((r) => r.json())
      .then((data) => {
        setStripeStatus(data);
        // Sync enabled flags into local settings state
        if (data.connected) {
          setSettings((prev) =>
            prev
              ? {
                  ...prev,
                  charges_enabled: data.chargesEnabled ?? prev.charges_enabled,
                  payouts_enabled: data.payoutsEnabled ?? prev.payouts_enabled,
                }
              : prev
          );
        }
      })
      .catch(() => {})
      .finally(() => setStripeStatusLoading(false));
  }, [settings?.stripe_account_id]);

  useEffect(() => {
    async function loadPricingMetadata() {
      if (!settings?.plan_id) return;

      try {
        const response = await fetch(
          "/api/pricing?keys=professional_divination_course"
        );
        if (!response.ok) return;

        const body = (await response.json()) as { items?: PricingItemSummary[] };
        const item = body.items?.[0];
        if (!item?.plans?.length) return;

        const currentPlan = item.plans.find((plan) => plan.plan_id === settings.plan_id);

        setCurrentPlanName(currentPlan?.display_name ?? settings.plan_id);

        const explicitFullPlan = item.plans.find(
          (plan) =>
            plan.custom_fields?.find((field) => field.slug === "is_full_plan")?.value ===
            "true"
        );
        const derivedFullPlan =
          explicitFullPlan ??
          [...item.plans].sort(
            (a, b) => (b.recurring_amount ?? 0) - (a.recurring_amount ?? 0)
          )[0];

        if (derivedFullPlan && derivedFullPlan.plan_id !== settings.plan_id) {
          setUpgradeTargetPlanId(derivedFullPlan.plan_id);
          setUpgradeTargetLabel(derivedFullPlan.display_name);
        } else {
          setUpgradeTargetPlanId(null);
          setUpgradeTargetLabel(null);
        }
      } catch {
        // Non-blocking fallback — keep current settings UI usable.
      }
    }

    loadPricingMetadata();
  }, [settings?.plan_id]);

  async function handleSaveNotifications() {
    if (!settings) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("diviners")
      .update({
        youtube_channel_id: settings.youtube_channel_id || null,
        notification_email: settings.notification_email,
        notification_sms: settings.notification_sms,
        notification_booking_confirmed:
          settings.notification_booking_confirmed,
        notification_booking_cancelled:
          settings.notification_booking_cancelled,
        notification_payout: settings.notification_payout,
      })
      .eq("id", settings.id);

    setSaving(false);
    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Settings saved");
    }
  }

  async function handleSaveDiscountRule() {
    if (!settings) return;
    if (!ruleForm.name || !ruleForm.discount_percent) {
      toast.error("Please fill in the rule name and discount percentage");
      return;
    }
    setLoyaltyLoading(true);
    const supabase = createClient();

    const payload = {
      diviner_id: settings.id,
      name: ruleForm.name,
      type: ruleForm.type,
      min_sessions: ruleForm.min_sessions
        ? parseInt(ruleForm.min_sessions)
        : null,
      discount_percent: parseFloat(ruleForm.discount_percent),
      is_active: true,
    };

    if (editingRule) {
      const { error } = await supabase
        .from("discount_rules")
        .update(payload)
        .eq("id", editingRule);
      if (error) {
        toast.error("Failed to update discount rule");
      } else {
        setDiscountRules((prev) =>
          prev.map((r) =>
            r.id === editingRule ? { ...r, ...payload } : r
          )
        );
        toast.success("Discount rule updated");
      }
    } else {
      const { data: newRule, error } = await supabase
        .from("discount_rules")
        .insert(payload)
        .select("id, name, type, min_sessions, discount_percent, is_active")
        .single();
      if (error || !newRule) {
        toast.error("Failed to create discount rule");
      } else {
        setDiscountRules((prev) => [...prev, newRule]);
        toast.success("Discount rule created");
      }
    }

    setRuleForm({
      name: "",
      type: "session_count",
      min_sessions: "",
      discount_percent: "",
    });
    setShowAddRule(false);
    setEditingRule(null);
    setLoyaltyLoading(false);
  }

  async function handleDeleteRule(ruleId: string) {
    if (!settings) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("discount_rules")
      .delete()
      .eq("id", ruleId);
    if (error) {
      toast.error("Failed to delete discount rule");
    } else {
      setDiscountRules((prev) => prev.filter((r) => r.id !== ruleId));
      toast.success("Discount rule deleted");
    }
  }

  async function handleStripeReOnboard() {
    try {
      const response = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to create onboarding link");
      }
    } catch {
      toast.error("Failed to connect to Stripe");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <XCircle className="size-8 text-destructive" />
        <p className="font-medium">Could not load settings</p>
        <p className="text-sm text-muted-foreground">Please refresh the page or try again later.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Reload</Button>
      </div>
    );
  }

  const googleConnections = calendarConnections.filter(
    (connection) => connection.provider === "google"
  );
  const microsoftConnections = calendarConnections.filter(
    (connection) => connection.provider === "microsoft"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, payments, and preferences.
        </p>
      </div>

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">
            <UserCog className="mr-2 size-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="mr-2 size-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarDays className="mr-2 size-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 size-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="phone">
            <Phone className="mr-2 size-4" />
            Phone
          </TabsTrigger>
          <TabsTrigger value="loyalty">
            <Heart className="mr-2 size-4" />
            Loyalty
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="mt-6">
          <div className="relative rounded-xl overflow-hidden border border-yellow-500/20 bg-gradient-to-br from-yellow-950/30 via-background to-background px-6 py-8 shadow-sm">
            {/* Radial glow overlay */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 60% 60% at 10% 20%, rgba(234,179,8,0.07) 0%, transparent 70%)",
              }}
            />
            <div className="relative space-y-6">
              {/* Branding badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-500 uppercase tracking-wider">
                  <Sparkles className="size-3" />
                  Diviner Account
                </span>
                {settings.subscription_status === "active" && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-[10px] font-semibold text-green-500 uppercase tracking-wider">
                    <CheckCircle2 className="size-3" />
                    Verified Partner
                  </span>
                )}
              </div>

              {/* Title + sub-title */}
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Your Subscription
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep your platform billing and membership details in view while you grow your practice.
                </p>
              </div>

              <Separator className="opacity-20" />

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="border-yellow-500/20 bg-black/10">
                  <CardContent className="px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-500/70">Status</p>
                    <p className="mt-1 text-sm font-semibold capitalize">
                      {settings.subscription_status === "cancelled" || subscriptionDetails?.cancel_at_period_end
                        ? "Cancelled · Access Active"
                        : settings.subscription_status ?? "No Subscription"}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-yellow-500/20 bg-black/10">
                  <CardContent className="px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-500/70">Enrolled</p>
                    <p className="mt-1 text-sm font-semibold">
                      {settings.created_at ? new Date(settings.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Recently"}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-yellow-500/20 bg-black/10">
                  <CardContent className="px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-500/70">Billing</p>
                    {subscriptionLoading ? (
                      <Loader2 className="mt-1 size-4 animate-spin text-muted-foreground" />
                    ) : subscriptionDetails ? (
                      <>
                        <p className="mt-1 text-sm font-semibold">
                          {formatCurrency(subscriptionDetails.amount / 100, subscriptionDetails.currency)}/{subscriptionDetails.interval}
                        </p>
                        {subscriptionDetails.one_time_fee > 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Enrollment paid {formatCurrency(subscriptionDetails.one_time_fee, subscriptionDetails.one_time_fee_currency)}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="mt-1 text-sm font-semibold">Managed in Stripe</p>
                    )}
                  </CardContent>
                </Card>
                <Card className="border-yellow-500/20 bg-black/10">
                  <CardContent className="px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-500/70">
                      {subscriptionDetails?.cancel_at_period_end ? "Access Until" : "Next Renewal"}
                    </p>
                    {subscriptionLoading ? (
                      <Loader2 className="mt-1 size-4 animate-spin text-muted-foreground" />
                    ) : subscriptionDetails ? (
                      <p className="mt-1 text-sm font-semibold">
                        {new Date(subscriptionDetails.current_period_end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm font-semibold">Cycle Pending</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  className="border-yellow-500/30 bg-black/10 text-yellow-50 hover:bg-yellow-500/10"
                  onClick={async () => {
                    const popup = window.open("", "_blank");
                    try {
                      const res = await fetch("/api/dashboard/billing/portal", { method: "POST" });
                      const data = await res.json();
                      if (data.url && popup) {
                        popup.location.href = data.url;
                      } else {
                        popup?.close();
                        toast.error("Failed to open billing portal");
                      }
                    } catch {
                      popup?.close();
                      toast.error("Failed to open billing portal");
                    }
                  }}
                >
                  Manage Subscription
                </Button>
                
                {upgradeTargetPlanId && (
                  <UpgradePlanButton
                    newPlanId={upgradeTargetPlanId}
                    label={upgradeTargetLabel!}
                  />
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Stripe Connect</CardTitle>
              <CardDescription>
                Accept payments from your clients through Stripe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  {settings.charges_enabled ? (
                    <CheckCircle2 className="size-5 text-green-500" />
                  ) : (
                    <XCircle className="size-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">Charges</p>
                    <p className="text-xs text-muted-foreground">
                      {settings.charges_enabled ? "Enabled" : "Not enabled"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  {settings.payouts_enabled ? (
                    <CheckCircle2 className="size-5 text-green-500" />
                  ) : (
                    <XCircle className="size-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">Payouts</p>
                    <p className="text-xs text-muted-foreground">
                      {settings.payouts_enabled ? "Enabled" : "Not enabled"}
                    </p>
                  </div>
                </div>
              </div>
              {(!settings.charges_enabled || !settings.payouts_enabled) && (
                <Button onClick={handleStripeReOnboard}>
                  <ExternalLink className="mr-2 size-4" />
                  {settings.stripe_account_id
                    ? "Complete Stripe Setup"
                    : "Connect Stripe Account"}
                </Button>
              )}
              {stripeStatusLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  Syncing Stripe status...
                </div>
              )}

              {/* Live Stripe account details */}
              {stripeStatus?.connected && !stripeStatusLoading && (
                <div className="rounded-lg border p-4 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Account Details</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">Available Balance</p>
                      <p className="text-lg font-bold text-green-500">
                        ${stripeStatus.balance?.available.toFixed(2) ?? "0.00"}
                      </p>
                    </div>
                    <div className="rounded-md bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">Pending</p>
                      <p className="text-lg font-bold text-amber-500">
                        ${stripeStatus.balance?.pending.toFixed(2) ?? "0.00"}
                      </p>
                    </div>
                  </div>

                  {/* Payout schedule info */}
                  {stripeStatus.payoutSchedule && (
                    <div className="rounded-md bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground mb-1">Payout Schedule</p>
                      <p className="text-sm font-medium capitalize">
                        {stripeStatus.payoutSchedule.interval === "manual"
                          ? "Manual (payouts must be triggered)"
                          : stripeStatus.payoutSchedule.interval === "daily"
                            ? `Daily (${stripeStatus.payoutSchedule.delay_days ?? 2}-day rolling delay)`
                            : stripeStatus.payoutSchedule.interval === "weekly"
                              ? `Weekly on ${stripeStatus.payoutSchedule.weekly_anchor ?? "monday"}s`
                              : stripeStatus.payoutSchedule.interval === "monthly"
                                ? `Monthly on the ${stripeStatus.payoutSchedule.monthly_anchor ?? 1}${["st","nd","rd"][((stripeStatus.payoutSchedule.monthly_anchor ?? 1) % 10) - 1] || "th"}`
                                : stripeStatus.payoutSchedule.interval}
                      </p>
                      {stripeStatus.payoutsDisabledReason && (
                        <p className="text-xs text-red-400 mt-1">
                          Payouts disabled: {stripeStatus.payoutsDisabledReason.replace(/_/g, " ")}
                        </p>
                      )}
                    </div>
                  )}

                  {/* No pending balance and no payouts — explain why */}
                  {stripeStatus.balance?.pending > 0 && stripeStatus.balance?.available === 0 && (
                    <p className="text-xs text-muted-foreground bg-amber-500/10 rounded-md p-2">
                      Funds are pending while Stripe verifies the payments. They typically become available within 2–7 business days depending on your payout schedule.
                    </p>
                  )}

                  {stripeStatus.recentPayouts && stripeStatus.recentPayouts.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium mb-2">Recent Payouts</p>
                      <div className="space-y-1.5">
                        {stripeStatus.recentPayouts.map((p: { id: string; arrivalDate: string; amount: number; status: string }) => (
                          <div key={p.id} className="flex items-center justify-between text-xs rounded-md bg-muted/30 px-2 py-1.5">
                            <span className="text-muted-foreground">{p.arrivalDate}</span>
                            <span className="font-medium">${p.amount.toFixed(2)}</span>
                            <span className={
                              p.status === "paid" ? "text-green-500 font-medium"
                              : p.status === "in_transit" ? "text-blue-400"
                              : p.status === "failed" ? "text-red-400"
                              : "text-amber-500"
                            }>
                              {p.status === "in_transit" ? "In Transit" : p.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-medium mb-1">Recent Payouts</p>
                      <p className="text-xs text-muted-foreground">No payouts yet. Funds will be paid out to your bank account according to your payout schedule.</p>
                    </div>
                  )}

                  <p className="text-[10px] text-muted-foreground">
                    Account ID: {settings.stripe_account_id}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PayPal Connect — temporarily disabled */}
          {/* <Card className="mt-4">
            <CardHeader>
              <CardTitle>PayPal</CardTitle>
              <CardDescription>
                Accept PayPal payments from clients.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border p-4">
                {settings.paypal_onboarded ? (
                  <CheckCircle2 className="size-5 text-green-500" />
                ) : (
                  <XCircle className="size-5 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">PayPal Account</p>
                  <p className="text-xs text-muted-foreground">
                    {settings.paypal_onboarded ? "Connected" : "Not connected"}
                  </p>
                </div>
                {settings.paypal_onboarded && (
                  <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                    Connected
                  </Badge>
                )}
              </div>
              {settings.paypal_merchant_id && (
                <p className="text-xs text-muted-foreground">
                  Merchant ID: {settings.paypal_merchant_id}
                </p>
              )}
              {settings.paypal_onboarded ? (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/paypal/disconnect", { method: "POST" });
                      if (res.ok) {
                        setSettings({ ...settings, paypal_onboarded: false, paypal_merchant_id: null });
                        toast.success("PayPal disconnected");
                      } else {
                        toast.error("Failed to disconnect PayPal");
                      }
                    } catch {
                      toast.error("Failed to disconnect PayPal");
                    }
                  }}
                >
                  Disconnect PayPal
                </Button>
              ) : (
                <Button onClick={() => { window.location.href = "/api/paypal/connect"; }}>
                  <ExternalLink className="mr-2 size-4" />
                  Connect PayPal Account
                </Button>
              )}
              <p className="text-sm text-muted-foreground">
                Connect your PayPal business account to accept PayPal payments from clients.
              </p>
            </CardContent>
          </Card> */}
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendar Sync</CardTitle>
              <CardDescription>
                Connect one or more Google or Microsoft accounts to block availability and send invites from your newest connected account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CalendarConnections
                googleConnections={googleConnections}
                microsoftConnections={microsoftConnections}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>YouTube Channel</CardTitle>
              <CardDescription>
                Link your YouTube channel for content promotion.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="youtube-channel-id">YouTube Channel ID</Label>
                <Input
                  id="youtube-channel-id"
                  value={settings.youtube_channel_id ?? ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      youtube_channel_id: e.target.value,
                    })
                  }
                  placeholder="UCxxxxxxxxxxxxxxxxx"
                />
                <p className="text-xs text-muted-foreground">
                  Your YouTube channel ID for embedding and notifications.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={settings.notification_email}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notification_email: !!checked,
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">SMS Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Receive notifications via SMS
                  </p>
                </div>
                <Switch
                  checked={settings.notification_sms}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notification_sms: !!checked,
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Booking Confirmed</p>
                  <p className="text-xs text-muted-foreground">
                    When a client confirms a booking
                  </p>
                </div>
                <Switch
                  checked={settings.notification_booking_confirmed}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notification_booking_confirmed: !!checked,
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Booking Cancelled</p>
                  <p className="text-xs text-muted-foreground">
                    When a client cancels a booking
                  </p>
                </div>
                <Switch
                  checked={settings.notification_booking_cancelled}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notification_booking_cancelled: !!checked,
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Payout Received</p>
                  <p className="text-xs text-muted-foreground">
                    When a payout is processed
                  </p>
                </div>
                <Switch
                  checked={settings.notification_payout}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notification_payout: !!checked,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSaveNotifications} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Notification Settings"
            )}
          </Button>
        </TabsContent>

        {/* Phone Tab */}
        <TabsContent value="phone" className="mt-6 space-y-6">
          {/* Dedicated Phone Number — View Only */}
          <Card>
            <CardHeader>
              <CardTitle>Your Phone Number</CardTitle>
              <CardDescription>
                Your dedicated phone number is managed by the platform admin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/*
                Source-of-truth precedence for the assigned-number
                detection:
                  1. The admin-client API response (`phoneRequestStatus`),
                     which is reconciled against the chime_phone_numbers
                     pool every read. This is the authoritative answer
                     and survives drift between the pool and the
                     diviner row.
                  2. The local browser-client query as a fallback (in
                     case the API call hasn't returned yet on first
                     paint).
                The displayed number prefers the API value too, falling
                back to the local one for the same reason.
              */}
              {(() => {
                const assignedNumber =
                  phoneRequestStatus?.phoneNumber ??
                  settings.chime_phone_number ??
                  settings.twilio_phone_number ??
                  null;
                const isActive =
                  phoneRequestStatus?.phoneDialinEnabled ??
                  settings.phone_dialin_enabled;
                if (assignedNumber) {
                  return (
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                        <Phone className="size-5 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-semibold">{assignedNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          Clients can call this number for readings
                        </p>
                      </div>
                      <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  );
                }
                return null;
              })()}
              {/*
                When there's no personal number, three states ranked by
                preference:
                  1. A central shared platform number is configured →
                     show it with a "Shared" badge and PIN guidance.
                     This is the normal happy path on deployments that
                     don't issue per-diviner numbers.
                  2. A request is currently pending → show the pending
                     state.
                  3. Neither → show the Request CTA (legacy fallback;
                     only reachable when the platform has neither a
                     central nor a personal number for this diviner).
              */}
              {!(
                phoneRequestStatus?.phoneNumber ??
                settings.chime_phone_number ??
                settings.twilio_phone_number
              ) &&
                (phoneRequestStatus?.centralPhoneNumber ? (
                  <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                        <Phone className="size-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-semibold">
                          {phoneRequestStatus.centralPhoneNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Shared platform line — calls reach you via your
                          booking PIN
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20"
                      >
                        Shared
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Clients call this number and enter the 6-digit PIN from
                      their booking confirmation. Our system matches the PIN
                      to your booking and bridges the call to you. No
                      per-diviner number is needed.
                    </p>
                  </div>
                ) : phoneRequestStatus?.currentRequest ? (
                  <div className="rounded-lg border border-dashed bg-amber-500/5 p-6 text-center">
                    <Phone className="mx-auto size-8 text-amber-500/60 mb-2" />
                    <p className="text-sm font-medium text-foreground">
                      Request pending — awaiting admin
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Submitted{" "}
                      {new Date(
                        phoneRequestStatus.currentRequest.created_at,
                      ).toLocaleString()}
                      . You&apos;ll see your number here once an admin
                      assigns one.
                    </p>
                    <Badge variant="secondary" className="mt-3">
                      Pending
                    </Badge>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center">
                    <Phone className="mx-auto size-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No phone number assigned yet.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Request a dedicated Chime number from the platform admin
                      below. You&apos;ll be notified once it&apos;s assigned.
                    </p>
                    {phoneRequestStatus?.latestRequest?.status === "rejected" &&
                      phoneRequestStatus.latestRequest.rejected_reason && (
                        <p className="mt-3 text-xs text-destructive">
                          Previous request rejected:{" "}
                          {phoneRequestStatus.latestRequest.rejected_reason}
                        </p>
                      )}
                    <Button
                      className="mt-4"
                      size="sm"
                      onClick={handleRequestPhoneNumber}
                      disabled={submittingPhoneRequest}
                    >
                      {submittingPhoneRequest ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        "Request Phone Number"
                      )}
                    </Button>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Call Answering Mode — Editable. Shown whenever the diviner can
               receive inbound calls at all: a personal number, a legacy
               Twilio number, OR (most common in shared-line deployments)
               the central platform number. Without this gate widening, the
               card would be hidden for every diviner on a central setup,
               leaving them no way to set browser-vs-mobile answer mode. */}
          {(phoneRequestStatus?.phoneNumber ??
            settings.chime_phone_number ??
            settings.twilio_phone_number ??
            phoneRequestStatus?.centralPhoneNumber) && (
            <Card>
              <CardHeader>
                <CardTitle>Call Answering Mode</CardTitle>
                <CardDescription>
                  Choose how you want to receive incoming calls from clients.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="+1 555-000-0000"
                    defaultValue={settings.phone_mobile ?? ""}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    id="phone-mobile-input"
                  />
                  <p className="text-xs text-muted-foreground">
                    When a client calls, we&apos;ll also ring this number so you can answer from your phone.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">How do you want to answer calls?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["both", "browser", "mobile"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setSettings({ ...settings, phone_answer_mode: mode })}
                        className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                          settings.phone_answer_mode === mode
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-input hover:border-primary/50"
                        }`}
                      >
                        <p className="font-medium">{mode === "both" ? "Both" : mode === "browser" ? "Browser Widget" : "Mobile Phone"}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {mode === "both" ? "Recommended — rings everywhere" : mode === "browser" ? "Answer from dashboard" : "Ring your mobile"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={async () => {
                    const mobileInput = document.getElementById("phone-mobile-input") as HTMLInputElement;
                    const mobile = mobileInput?.value?.trim() || null;
                    const supabase = createClient();
                    const { error } = await supabase
                      .from("diviners")
                      .update({ phone_mobile: mobile, phone_answer_mode: settings.phone_answer_mode })
                      .eq("id", settings.id);
                    if (error) {
                      toast.error("Failed to save call settings");
                    } else {
                      setSettings({ ...settings, phone_mobile: mobile });
                      toast.success("Call settings saved");
                    }
                  }}
                >
                  Save Call Settings
                </Button>
              </CardContent>
            </Card>
          )}

          {/*
            Phone Billing card — rewritten to remove the prior misleading
            "$25 + $0.50/min" framing. The actual backend only charges that
            rate for `session_type === 'standalone'` walk-up calls (see
            /api/chime/voice/status). Pre-booked phone sessions
            (`scheduled_dialin`) are paid through the booking and never
            charged a second time. The card now leads with that fact so
            diviners aren't confused about double-billing.
          */}
          <Card>
            <CardHeader>
              <CardTitle>Phone Billing</CardTitle>
              <CardDescription>
                How the platform charges for phone sessions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                    <Phone className="size-4 text-green-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      Booked phone sessions — no extra charge
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      When a client books a session through the system, the
                      booking price is what they pay. Picking up the phone for
                      that booking does not add any extra fee on top — your
                      client is not double-charged.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">
                    Walk-up calls (no booking)
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    If a client calls the platform line <em>without</em> a
                    matching booking, the call is billed at{" "}
                    <span className="font-medium">
                      ${PRICING.PHONE_READING_BASE_PRICE.toFixed(2)}
                    </span>{" "}
                    for the first{" "}
                    <span className="font-medium">
                      {PRICING.PHONE_READING_BASE_MINUTES} minutes
                    </span>
                    , then{" "}
                    <span className="font-medium">
                      ${PRICING.PHONE_READING_OVERAGE_RATE.toFixed(2)}/min
                    </span>{" "}
                    after that. Platform takes{" "}
                    <span className="font-medium">
                      {PRICING.platformFeePercent}%
                    </span>
                    ; you keep the rest. This rule only fires for true walk-up
                    calls with no associated booking.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/*
            Phone call history lives on the dedicated /dashboard/phone-calls
            page (richer filtering, pagination, search, status breakdown).
            We surface a single link instead of duplicating the history
            here — keeps the Settings → Phone tab focused on configuration
            rather than reporting, and removes the misleading per-call
            "Total Revenue" block that mixed pre-paid bookings with
            standalone walk-up calls.
          */}
          <Card>
            <CardContent className="flex items-center justify-between gap-3 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Phone className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Phone call history</p>
                  <p className="text-xs text-muted-foreground">
                    See every inbound and outbound call, with filters and
                    search.
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/phone-calls">View calls</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loyalty Tab */}
        <TabsContent value="loyalty" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Loyalty Discounts</CardTitle>
              <CardDescription>
                Reward returning clients with automatic discounts based on their
                session history.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Rules Table */}
              {discountRules.length > 0 && (
                <div className="rounded-lg border">
                  <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 border-b bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground">
                    <span>Name</span>
                    <span>Type</span>
                    <span>Min Sessions</span>
                    <span>Discount</span>
                    <span>Actions</span>
                  </div>
                  {discountRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 border-b px-4 py-3 last:border-b-0"
                    >
                      <span className="font-medium">{rule.name}</span>
                      <Badge variant="secondary">
                        {rule.type === "session_count"
                          ? "Session Count"
                          : "Package"}
                      </Badge>
                      <span className="text-center text-sm">
                        {rule.min_sessions ?? "N/A"}
                      </span>
                      <span className="text-center text-sm font-semibold text-green-600 dark:text-green-400">
                        {rule.discount_percent}%
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => {
                            setEditingRule(rule.id);
                            setRuleForm({
                              name: rule.name,
                              type: rule.type,
                              min_sessions: rule.min_sessions?.toString() ?? "",
                              discount_percent:
                                rule.discount_percent.toString(),
                            });
                            setShowAddRule(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {discountRules.length === 0 && !showAddRule && (
                <p className="text-sm text-muted-foreground">
                  No discount rules configured yet. Add a rule to automatically
                  reward loyal clients.
                </p>
              )}

              {/* Add / Edit Rule Form */}
              {showAddRule && (
                <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                  <h4 className="font-semibold">
                    {editingRule ? "Edit Discount Rule" : "Add Discount Rule"}
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="rule-name">Rule Name</Label>
                      <Input
                        id="rule-name"
                        placeholder="e.g., Loyal Client Discount"
                        value={ruleForm.name}
                        onChange={(e) =>
                          setRuleForm({ ...ruleForm, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rule-type">Type</Label>
                      <select
                        id="rule-type"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={ruleForm.type}
                        onChange={(e) =>
                          setRuleForm({
                            ...ruleForm,
                            type: e.target.value as
                              | "session_count"
                              | "package",
                          })
                        }
                      >
                        <option value="session_count">Session Count</option>
                        <option value="package">Package Deal</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rule-min-sessions">
                        Minimum Sessions
                      </Label>
                      <Input
                        id="rule-min-sessions"
                        type="number"
                        min="1"
                        placeholder="e.g., 5"
                        value={ruleForm.min_sessions}
                        onChange={(e) =>
                          setRuleForm({
                            ...ruleForm,
                            min_sessions: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rule-discount">Discount %</Label>
                      <Input
                        id="rule-discount"
                        type="number"
                        min="1"
                        max="100"
                        step="0.5"
                        placeholder="e.g., 10"
                        value={ruleForm.discount_percent}
                        onChange={(e) =>
                          setRuleForm({
                            ...ruleForm,
                            discount_percent: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveDiscountRule}
                      disabled={loyaltyLoading}
                    >
                      {loyaltyLoading ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Saving...
                        </>
                      ) : editingRule ? (
                        "Update Rule"
                      ) : (
                        "Save Rule"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddRule(false);
                        setEditingRule(null);
                        setRuleForm({
                          name: "",
                          type: "session_count",
                          min_sessions: "",
                          discount_percent: "",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {!showAddRule && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddRule(true);
                    setEditingRule(null);
                    setRuleForm({
                      name: "",
                      type: "session_count",
                      min_sessions: "",
                      discount_percent: "",
                    });
                  }}
                >
                  <Plus className="mr-2 size-4" />
                  Add Discount Rule
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How Loyalty Discounts Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Session Count:</strong> Automatically applies a discount
                when a client has completed at least the specified number of
                sessions with you. The highest matching rule is used.
              </p>
              <p>
                <strong>Package Deal:</strong> Create named packages with a set
                number of sessions and a discount. Clients see the discount
                applied at checkout.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
