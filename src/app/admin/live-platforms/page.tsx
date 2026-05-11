"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Radio } from "lucide-react";
import type {
  LiveIntegrationTier,
  LivePlaybackMode,
  LivePlatformKey,
} from "@/lib/live-platform-governance";

interface LivePlatformRegistryRow {
  platform_key: LivePlatformKey;
  display_name: string;
  is_globally_enabled: boolean;
  is_selectable_by_diviners: boolean;
  integration_tier: LiveIntegrationTier;
  playback_mode: LivePlaybackMode;
  supports_embed: boolean;
  supports_chat_embed: boolean;
  supports_oauth_connection: boolean;
  supports_event_sync: boolean;
  supports_auto_live_detection: boolean;
  sort_order: number;
  admin_notes: string | null;
}

export default function AdminLivePlatformsPage() {
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<LivePlatformRegistryRow[]>([]);

  useEffect(() => {
    fetch("/api/admin/live-platforms")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load live platforms");
        return res.json();
      })
      .then((data) => setPlatforms(data.platforms ?? []))
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  function updateLocal(
    platformKey: LivePlatformKey,
    field: keyof LivePlatformRegistryRow,
    value: string | boolean | number | null
  ) {
    setPlatforms((current) =>
      current.map((platform) =>
        platform.platform_key === platformKey ? { ...platform, [field]: value } : platform
      )
    );
  }

  async function savePlatform(platform: LivePlatformRegistryRow) {
    setSavingKey(platform.platform_key);
    try {
      const response = await fetch("/api/admin/live-platforms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(platform),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save live platform");
      }
      setPlatforms((current) =>
        current.map((item) =>
          item.platform_key === platform.platform_key ? data.platform : item
        )
      );
      toast.success(`${platform.display_name} updated`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save live platform");
    } finally {
      setSavingKey(null);
    }
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Live Platform Governance</h1>
        <p className="text-muted-foreground">
          Control which live providers are globally enabled, selectable, embedded, or link-out only.
        </p>
      </div>

      {platforms.map((platform) => (
        <Card key={platform.platform_key}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="size-4 text-muted-foreground" />
              {platform.display_name}
            </CardTitle>
            <CardDescription>
              Key: <code>{platform.platform_key}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor={`${platform.platform_key}-enabled`}>Globally enabled</Label>
                <Switch
                  id={`${platform.platform_key}-enabled`}
                  checked={platform.is_globally_enabled}
                  onCheckedChange={(checked) => updateLocal(platform.platform_key, "is_globally_enabled", checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor={`${platform.platform_key}-selectable`}>Selectable by diviners</Label>
                <Switch
                  id={`${platform.platform_key}-selectable`}
                  checked={platform.is_selectable_by_diviners}
                  onCheckedChange={(checked) => updateLocal(platform.platform_key, "is_selectable_by_diviners", checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor={`${platform.platform_key}-embed`}>Supports embed</Label>
                <Switch
                  id={`${platform.platform_key}-embed`}
                  checked={platform.supports_embed}
                  onCheckedChange={(checked) => updateLocal(platform.platform_key, "supports_embed", checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor={`${platform.platform_key}-chat`}>Supports chat embed</Label>
                <Switch
                  id={`${platform.platform_key}-chat`}
                  checked={platform.supports_chat_embed}
                  onCheckedChange={(checked) => updateLocal(platform.platform_key, "supports_chat_embed", checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor={`${platform.platform_key}-oauth`}>Supports OAuth connection</Label>
                <Switch
                  id={`${platform.platform_key}-oauth`}
                  checked={platform.supports_oauth_connection}
                  onCheckedChange={(checked) => updateLocal(platform.platform_key, "supports_oauth_connection", checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor={`${platform.platform_key}-sync`}>Supports event sync</Label>
                <Switch
                  id={`${platform.platform_key}-sync`}
                  checked={platform.supports_event_sync}
                  onCheckedChange={(checked) => updateLocal(platform.platform_key, "supports_event_sync", checked)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Integration tier</Label>
                <select
                  value={platform.integration_tier}
                  onChange={(event) =>
                    updateLocal(platform.platform_key, "integration_tier", event.target.value as LiveIntegrationTier)
                  }
                  className="flex h-9 w-full rounded-md border border-input px-3 py-2 text-sm"
                >
                  <option value="first_class">First class</option>
                  <option value="managed">Managed</option>
                  <option value="link_out_only">Link-out only</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Playback mode</Label>
                <select
                  value={platform.playback_mode}
                  onChange={(event) =>
                    updateLocal(platform.platform_key, "playback_mode", event.target.value as LivePlaybackMode)
                  }
                  className="flex h-9 w-full rounded-md border border-input px-3 py-2 text-sm"
                >
                  <option value="embedded_player">Embedded player</option>
                  <option value="external_link">External link</option>
                  <option value="manual_status">Manual status</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Display name</Label>
                <Input
                  value={platform.display_name}
                  onChange={(event) => updateLocal(platform.platform_key, "display_name", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={platform.sort_order}
                  onChange={(event) =>
                    updateLocal(platform.platform_key, "sort_order", parseInt(event.target.value, 10) || 0)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Admin notes</Label>
              <Textarea
                rows={3}
                value={platform.admin_notes ?? ""}
                onChange={(event) => updateLocal(platform.platform_key, "admin_notes", event.target.value || null)}
                placeholder="Operational notes, rollout context, or support caveats."
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => savePlatform(platform)}
                disabled={savingKey === platform.platform_key}
              >
                {savingKey === platform.platform_key ? "Saving..." : "Save platform"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
