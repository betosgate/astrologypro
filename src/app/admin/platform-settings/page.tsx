"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings2 } from "lucide-react";

interface PlatformSettings {
  id: string;
  ms_pm_discount_enabled: boolean;
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
        </div>
      ) : null}
    </div>
  );
}
