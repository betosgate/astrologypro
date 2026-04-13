"use client";

import { useState } from "react";
import { Radio, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { GovernedLivePlatform, LivePlatformAvailabilityMode } from "@/lib/live-platform-governance";

interface LivePlatformOverridesProps {
  divinerId: string;
  initialPlatforms: GovernedLivePlatform[];
}

const MODE_LABELS: Record<LivePlatformAvailabilityMode, string> = {
  inherit: "Inherit global policy",
  force_enable: "Force enable for this diviner",
  force_disable: "Force disable for this diviner",
};

export function LivePlatformOverrides({
  divinerId,
  initialPlatforms,
}: LivePlatformOverridesProps) {
  const [platforms, setPlatforms] = useState(initialPlatforms);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  function updatePlatform(
    platformKey: string,
    field: "availability_mode" | "reason",
    value: string
  ) {
    setPlatforms((current) =>
      current.map((platform) =>
        platform.platform_key === platformKey ? { ...platform, [field]: value } : platform
      )
    );
  }

  async function savePlatform(platformKey: string) {
    const platform = platforms.find((item) => item.platform_key === platformKey);
    if (!platform) return;

    setSavingKey(platformKey);
    try {
      const response = await fetch(`/api/admin/diviners/${divinerId}/live-platforms`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform_key: platform.platform_key,
          availability_mode: platform.availability_mode,
          reason: platform.reason,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save live platform override");
      }

      setPlatforms(data.platforms ?? []);
      toast.success(`${platform.display_name} policy updated`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save live platform override"
      );
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="size-4 text-amber-500" />
          Live Platform Overrides
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {platforms.map((platform) => (
          <div key={platform.platform_key} className="rounded-xl border border-white/10 p-4">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Radio className="size-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{platform.display_name}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Global: {platform.is_globally_enabled ? "enabled" : "disabled"} · Effective access:{" "}
                  {platform.is_available_for_diviner ? "available" : "blocked"}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => savePlatform(platform.platform_key)}
                disabled={savingKey === platform.platform_key}
              >
                {savingKey === platform.platform_key ? "Saving..." : "Save"}
              </Button>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor={`live-platform-mode-${platform.platform_key}`}>Availability mode</Label>
                <select
                  id={`live-platform-mode-${platform.platform_key}`}
                  value={platform.availability_mode}
                  onChange={(event) =>
                    updatePlatform(
                      platform.platform_key,
                      "availability_mode",
                      event.target.value as LivePlatformAvailabilityMode
                    )
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="inherit">{MODE_LABELS.inherit}</option>
                  <option value="force_enable">{MODE_LABELS.force_enable}</option>
                  <option value="force_disable">{MODE_LABELS.force_disable}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`live-platform-reason-${platform.platform_key}`}>Admin reason</Label>
                <Textarea
                  id={`live-platform-reason-${platform.platform_key}`}
                  rows={2}
                  value={platform.reason ?? ""}
                  onChange={(event) =>
                    updatePlatform(platform.platform_key, "reason", event.target.value)
                  }
                  placeholder="Optional note for why this diviner is overridden."
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
