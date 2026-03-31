"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

interface DivinerSettings {
  id: string;
  subscription_status: string | null;
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
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<DivinerSettings | null>(null);

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
          "id, subscription_status, stripe_account_id, charges_enabled, payouts_enabled, google_calendar_connected, youtube_channel_id, notification_email, notification_sms, notification_booking_confirmed, notification_booking_cancelled, notification_payout"
        )
        .eq("user_id", user.id)
        .single();

      if (data) {
        setSettings({
          id: data.id,
          subscription_status: data.subscription_status ?? null,
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
        });
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

  if (!settings) return null;

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
                <div>
                  <p className="text-sm font-medium">Google Calendar</p>
                  <p className="text-xs text-muted-foreground">
                    {settings.google_calendar_connected
                      ? "Connected"
                      : "Not connected"}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Google Calendar integration is coming in Phase 2. Stay tuned for
                automatic booking sync, availability management, and calendar
                overlay features.
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
      </Tabs>
    </div>
  );
}
