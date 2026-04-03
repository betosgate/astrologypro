"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
} from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface DivinerSettings {
  id: string;
  subscription_status: string | null;
  plan_id: string | null;
  stripe_subscription_id: string | null;
  stripe_account_id: string | null;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  google_calendar_connected: boolean;
  youtube_channel_id: string | null;
  notification_email: boolean;
  notification_sms: boolean;
  notification_booking_confirmed: boolean;
  notification_booking_cancelled: boolean;
  notification_payout: boolean;
  twilio_phone_number: string | null;
  twilio_phone_sid: string | null;
  phone_dialin_enabled: boolean;
  phone_mobile: string | null;
  phone_answer_mode: "mobile" | "browser" | "both";
}

interface PhoneSession {
  id: string;
  session_type: string;
  started_at: string | null;
  duration_seconds: number | null;
  amount_charged: number | null;
  platform_cost: number | null;
  status: string;
}

interface DiscountRule {
  id: string;
  name: string;
  type: "session_count" | "package";
  min_sessions: number | null;
  discount_percent: number;
  is_active: boolean;
}

function UpgradeToBothButton() {
  const router = useRouter();
  const [upgrading, setUpgrading] = useState(false);

  async function handleUpgrade() {
    if (
      !confirm(
        "Upgrade to The Oracle plan? Your monthly rate will change from $97 to $147 with proration. This gives you all 20 services + phone readings."
      )
    )
      return;

    setUpgrading(true);
    try {
      const res = await fetch("/api/stripe/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPlanId: "both" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Upgrade failed");
        return;
      }
      toast.success("Upgraded to The Oracle plan!");
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
        "Upgrade to Oracle"
      )}
    </Button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<DivinerSettings | null>(null);

  // Phone state
  const [phoneProvisioning, setPhoneProvisioning] = useState(false);
  const [phoneSessions, setPhoneSessions] = useState<PhoneSession[]>([]);

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
    } else if (calendarStatus === "error") {
      const reason = searchParams.get("reason");
      toast.error(
        `Failed to connect Google Calendar${reason ? `: ${reason}` : ""}`
      );
      router.replace("/dashboard/settings", { scroll: false });
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
          "id, subscription_status, plan_id, stripe_subscription_id, stripe_account_id, charges_enabled, payouts_enabled, google_calendar_connected, youtube_channel_id, notification_email, notification_sms, notification_booking_confirmed, notification_booking_cancelled, notification_payout, twilio_phone_number, twilio_phone_sid, phone_dialin_enabled, phone_mobile, phone_answer_mode"
        )
        .eq("user_id", user.id)
        .single();

      if (data) {
        setSettings({
          id: data.id,
          subscription_status: data.subscription_status ?? null,
          plan_id: data.plan_id ?? null,
          stripe_subscription_id: data.stripe_subscription_id ?? null,
          stripe_account_id: data.stripe_account_id ?? null,
          charges_enabled: data.charges_enabled ?? false,
          payouts_enabled: data.payouts_enabled ?? false,
          google_calendar_connected: data.google_calendar_connected ?? false,
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
          phone_dialin_enabled: data.phone_dialin_enabled ?? false,
          phone_mobile: data.phone_mobile ?? null,
          phone_answer_mode: data.phone_answer_mode ?? "both",
        });

        // Load discount rules
        const { data: rules } = await supabase
          .from("discount_rules")
          .select("id, name, type, min_sessions, discount_percent, is_active")
          .eq("diviner_id", data.id)
          .order("created_at", { ascending: true });

        if (rules) {
          setDiscountRules(rules);
        }

        // Load phone sessions
        const { data: sessions } = await supabase
          .from("phone_sessions")
          .select("id, session_type, started_at, duration_seconds, amount_charged, platform_cost, status")
          .eq("diviner_id", data.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (sessions) {
          setPhoneSessions(sessions);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

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
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>
                Your current plan and billing information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-xs text-muted-foreground">
                    Your subscription status
                  </p>
                </div>
                <Badge
                  variant={
                    settings.subscription_status === "active"
                      ? "default"
                      : "secondary"
                  }
                >
                  {settings.subscription_status ?? "No subscription"}
                </Badge>
              </div>
              {settings.plan_id && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Current Plan</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {settings.plan_id === "both"
                          ? "The Oracle (both)"
                          : settings.plan_id === "tarot"
                          ? "The Tarot Reader"
                          : "The Astrologer"}
                      </p>
                    </div>
                    {settings.plan_id !== "both" &&
                      settings.subscription_status === "active" && (
                        <UpgradeToBothButton />
                      )}
                  </div>
                </>
              )}
              <Separator />
              {settings.subscription_status === "active" && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    toast.info(
                      "Cancellation flow will be handled via Stripe Customer Portal"
                    );
                  }}
                >
                  Cancel Subscription
                </Button>
              )}
            </CardContent>
          </Card>
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
              {settings.stripe_account_id && (
                <p className="text-xs text-muted-foreground">
                  Account ID: {settings.stripe_account_id}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Google Calendar</CardTitle>
              <CardDescription>
                Sync your bookings with Google Calendar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border p-4">
                {settings.google_calendar_connected ? (
                  <CheckCircle2 className="size-5 text-green-500" />
                ) : (
                  <XCircle className="size-5 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">Google Calendar</p>
                  <p className="text-xs text-muted-foreground">
                    {settings.google_calendar_connected
                      ? "Connected"
                      : "Not connected"}
                  </p>
                </div>
                {settings.google_calendar_connected && (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    Connected
                  </Badge>
                )}
              </div>
              {settings.google_calendar_connected ? (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const supabase = createClient();
                      const { error } = await supabase
                        .from("diviners")
                        .update({
                          google_calendar_token: null,
                          google_calendar_connected: false,
                        })
                        .eq("id", settings.id);
                      if (error) {
                        toast.error("Failed to disconnect Google Calendar");
                      } else {
                        setSettings({
                          ...settings,
                          google_calendar_connected: false,
                        });
                        toast.success("Google Calendar disconnected");
                      }
                    } catch {
                      toast.error("Failed to disconnect Google Calendar");
                    }
                  }}
                >
                  Disconnect Google Calendar
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    window.location.href = "/api/calendar/connect";
                  }}
                >
                  <CalendarDays className="mr-2 size-4" />
                  Connect Google Calendar
                </Button>
              )}
              <p className="text-sm text-muted-foreground">
                When connected, client bookings will automatically appear on
                your Google Calendar.
              </p>
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
          <Card>
            <CardHeader>
              <CardTitle>Dedicated Phone Number</CardTitle>
              <CardDescription>
                Get a phone number so clients can dial in for readings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.twilio_phone_number ? (
                <>
                  <div className="flex items-center gap-3 rounded-lg border p-4">
                    <Phone className="size-5 text-green-500" />
                    <div className="flex-1">
                      <p className="text-lg font-semibold">
                        {settings.twilio_phone_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Your dedicated phone number
                      </p>
                    </div>
                    <Badge
                      variant={
                        settings.phone_dialin_enabled ? "default" : "secondary"
                      }
                    >
                      {settings.phone_dialin_enabled ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Phone Dial-in</p>
                      <p className="text-xs text-muted-foreground">
                        Allow clients to call this number for readings
                      </p>
                    </div>
                    <Switch
                      checked={settings.phone_dialin_enabled}
                      onCheckedChange={async (checked) => {
                        const supabase = createClient();
                        const { error } = await supabase
                          .from("diviners")
                          .update({ phone_dialin_enabled: !!checked })
                          .eq("id", settings.id);
                        if (error) {
                          toast.error("Failed to update phone dial-in setting");
                        } else {
                          setSettings({
                            ...settings,
                            phone_dialin_enabled: !!checked,
                          });
                          toast.success(
                            checked
                              ? "Phone dial-in enabled"
                              : "Phone dial-in disabled"
                          );
                        }
                      }}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You do not have a dedicated phone number yet. Provision one
                    to allow clients to call in for phone readings.
                  </p>
                  <Button
                    onClick={async () => {
                      setPhoneProvisioning(true);
                      try {
                        const res = await fetch(
                          "/api/twilio/provision-number",
                          { method: "POST" }
                        );
                        const data = await res.json();
                        if (!res.ok) {
                          toast.error(
                            data.error ?? "Failed to provision number"
                          );
                          return;
                        }
                        setSettings({
                          ...settings,
                          twilio_phone_number: data.phoneNumber,
                          phone_dialin_enabled: true,
                        });
                        toast.success(
                          `Phone number provisioned: ${data.phoneNumber}`
                        );
                      } catch {
                        toast.error("Failed to provision phone number");
                      } finally {
                        setPhoneProvisioning(false);
                      }
                    }}
                    disabled={phoneProvisioning}
                  >
                    {phoneProvisioning ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Provisioning...
                      </>
                    ) : (
                      <>
                        <Phone className="mr-2 size-4" />
                        Get a Dedicated Phone Number
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {settings.twilio_phone_number && (
            <Card>
              <CardHeader>
                <CardTitle>Call Answering</CardTitle>
                <CardDescription>
                  Choose how you want to receive incoming calls. You can answer in your browser, on your mobile phone, or both at the same time.
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
                    When a client calls, we&apos;ll also ring this number so you never miss a reading.
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
                        <p className="font-medium capitalize">{mode === "both" ? "Browser + Mobile" : mode === "browser" ? "Browser only" : "Mobile only"}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {mode === "both" ? "Recommended" : mode === "browser" ? "Dashboard widget" : "Ring your phone"}
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

          <Card>
            <CardHeader>
              <CardTitle>Phone Reading Pricing</CardTitle>
              <CardDescription>
                Phone readings are billed at $25.00 for the first 20 minutes,
                plus $0.50 per additional minute. Platform takes 20%.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Base Price</p>
                  <p className="text-lg font-bold">$25.00</p>
                  <p className="text-xs text-muted-foreground">First 20 min</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Overage</p>
                  <p className="text-lg font-bold">$0.50</p>
                  <p className="text-xs text-muted-foreground">Per extra min</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">You Earn</p>
                  <p className="text-lg font-bold">80%</p>
                  <p className="text-xs text-muted-foreground">Of each call</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {phoneSessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Phone Session History</CardTitle>
                <CardDescription>
                  Your recent phone sessions and billing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* Summary */}
                  {(() => {
                    const completed = phoneSessions.filter(
                      (s) => s.status === "completed"
                    );
                    const totalRevenue = completed.reduce(
                      (sum, s) => sum + (s.amount_charged ?? 0),
                      0
                    );
                    const totalCost = completed.reduce(
                      (sum, s) => sum + (s.platform_cost ?? 0),
                      0
                    );
                    return (
                      <div className="mb-4 grid grid-cols-3 gap-4 text-center">
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">
                            Total Calls
                          </p>
                          <p className="text-lg font-bold">
                            {completed.length}
                          </p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">
                            Total Revenue
                          </p>
                          <p className="text-lg font-bold">
                            {formatCurrency(totalRevenue)}
                          </p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">
                            Phone Costs
                          </p>
                          <p className="text-lg font-bold">
                            {formatCurrency(totalCost)}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Session list */}
                  <div className="rounded-lg border">
                    {phoneSessions.slice(0, 10).map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between border-b px-4 py-3 last:border-b-0"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {session.session_type === "scheduled_dialin"
                              ? "Scheduled Dial-in"
                              : "Phone Reading"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {session.started_at
                              ? new Date(session.started_at).toLocaleString()
                              : "Pending"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {session.duration_seconds
                              ? `${Math.ceil(session.duration_seconds / 60)} min`
                              : "--"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {session.amount_charged != null
                              ? formatCurrency(session.amount_charged)
                              : "--"}
                          </p>
                        </div>
                        <Badge
                          variant={
                            session.status === "completed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {session.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
