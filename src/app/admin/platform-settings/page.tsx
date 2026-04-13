"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Settings2, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface PlatformSettings {
  id: string;
  ms_pm_discount_enabled: boolean;
  no_show_diviner_refund_percent: number;
  no_show_client_refund_percent: number;
  no_show_grace_minutes: number;
  updated_at: string;
}

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/platform-settings")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load settings");
        return r.json();
      })
      .then((d) => setSettings(d as PlatformSettings))
      .catch((err) => setError(err instanceof Error ? err.message : "Unknown error"))
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle(field: string, value: boolean) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/platform-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error((data as { detail?: string }).detail ?? "Failed to save");
      }
      const updated = (await res.json()) as PlatformSettings;
      setSettings(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Settings2 className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Platform Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Global configuration toggles for the platform.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading settings...</p>
      ) : error && !settings ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : settings ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mystery School Pricing</CardTitle>
              <CardDescription>
                Configure discount pricing for Mystery School enrollment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <Label htmlFor="ms-pm-discount" className="text-sm font-medium">
                    PM-User Mystery School Discount
                  </Label>
                  <p className="text-xs text-muted-foreground max-w-md">
                    When enabled, active Perennial Mandalism members pay $17.03/month
                    instead of $27.00/month for Mystery School monthly billing.
                    The one-time enrollment fee ($97.00) is unaffected.
                  </p>
                </div>
                <Switch
                  id="ms-pm-discount"
                  checked={settings.ms_pm_discount_enabled}
                  disabled={saving}
                  onCheckedChange={(checked) =>
                    handleToggle("ms_pm_discount_enabled", checked)
                  }
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date(settings.updated_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <NoShowPolicyCard settings={settings} onUpdated={setSettings} />
        </div>
      ) : null}
    </div>
  );
}

// ─── No-Show Policy Card ─────────────────────────────────────────────────────

function NoShowPolicyCard({
  settings,
  onUpdated,
}: {
  settings: PlatformSettings;
  onUpdated: (s: PlatformSettings) => void;
}) {
  const [divinerRefund, setDivinerRefund] = useState(
    settings.no_show_diviner_refund_percent
  );
  const [clientRefund, setClientRefund] = useState(
    settings.no_show_client_refund_percent
  );
  const [graceMinutes, setGraceMinutes] = useState(
    settings.no_show_grace_minutes
  );
  const [saving, setSaving] = useState(false);

  const hasChanges =
    divinerRefund !== settings.no_show_diviner_refund_percent ||
    clientRefund !== settings.no_show_client_refund_percent ||
    graceMinutes !== settings.no_show_grace_minutes;

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/platform-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          no_show_diviner_refund_percent: divinerRefund,
          no_show_client_refund_percent: clientRefund,
          no_show_grace_minutes: graceMinutes,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error((data as { detail?: string }).detail ?? "Failed to save");
      }
      const updated = (await res.json()) as PlatformSettings;
      onUpdated(updated);
      toast.success("No-show policy updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-5 text-amber-500" />
          <CardTitle className="text-base">No-Show Refund Policy</CardTitle>
        </div>
        <CardDescription>
          Configure automatic refund percentages when a diviner or client
          does not attend a scheduled session. The cron job processes
          no-shows after the grace period expires.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Diviner no-show */}
        <div className="rounded-lg border p-4 space-y-2">
          <Label className="text-sm font-medium">
            Diviner No-Show — Client Refund %
          </Label>
          <p className="text-xs text-muted-foreground">
            If the diviner does not join the session, the client receives this
            percentage of the booking price as an automatic refund.
          </p>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={0}
              max={100}
              value={divinerRefund}
              onChange={(e) => setDivinerRefund(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">% refund to client</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Diviner receives: <strong>{100 - divinerRefund}%</strong> (
            {divinerRefund === 100
              ? "nothing — full refund to client"
              : `${100 - divinerRefund}% retained`}
            )
          </p>
        </div>

        {/* Client no-show */}
        <div className="rounded-lg border p-4 space-y-2">
          <Label className="text-sm font-medium">
            Client No-Show — Client Refund %
          </Label>
          <p className="text-xs text-muted-foreground">
            If the client does not join the session, they receive this percentage
            as a refund. The remaining amount is kept by the diviner.
          </p>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={0}
              max={100}
              value={clientRefund}
              onChange={(e) => setClientRefund(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">% refund to client</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Diviner keeps: <strong>{100 - clientRefund}%</strong> (
            {clientRefund === 0
              ? "full amount — no refund"
              : `client gets ${clientRefund}% back`}
            )
          </p>
        </div>

        {/* Grace period */}
        <div className="rounded-lg border p-4 space-y-2">
          <Label className="text-sm font-medium">
            Grace Period (minutes)
          </Label>
          <p className="text-xs text-muted-foreground">
            How many minutes after the session&apos;s scheduled end time before the
            system marks it as a no-show and processes the refund.
          </p>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={60}
              value={graceMinutes}
              onChange={(e) => setGraceMinutes(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">minutes after session end</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
            Save No-Show Policy
          </Button>
          {hasChanges && (
            <span className="text-xs text-amber-500">Unsaved changes</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
