"use client";

import { useEffect, useState, useCallback } from "react";
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
import {
  Loader2,
  Radio,
  Info,
  Trash2,
  Plus,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface StreamPlatformConfig {
  id: string;
  diviner_id: string;
  platform: string;
  display_name: string | null;
  stream_url: string | null;
  embed_url: string | null;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface DivinerLiveState {
  is_live: boolean;
  live_platforms: string[];
}

const ALL_PLATFORMS = [
  { id: "youtube", label: "YouTube", emoji: "📺" },
  { id: "facebook", label: "Facebook", emoji: "👤" },
  { id: "instagram", label: "Instagram", emoji: "📷" },
  { id: "tiktok", label: "TikTok", emoji: "🎵" },
  { id: "zoom", label: "Zoom", emoji: "💻" },
  { id: "other", label: "Other", emoji: "🌐" },
] as const;

type PlatformId = (typeof ALL_PLATFORMS)[number]["id"];

function getPlatformMeta(id: string) {
  return ALL_PLATFORMS.find((p) => p.id === id) ?? { id, label: id, emoji: "🌐" };
}

export default function LiveStreamPage() {
  const [loading, setLoading] = useState(true);
  const [liveState, setLiveState] = useState<DivinerLiveState>({ is_live: false, live_platforms: [] });
  const [togglingLive, setTogglingLive] = useState(false);
  const [platforms, setPlatforms] = useState<StreamPlatformConfig[]>([]);
  const [savingPlatform, setSavingPlatform] = useState<string | null>(null);
  const [deletingPlatform, setDeletingPlatform] = useState<string | null>(null);
  // Local edits to platform configs before saving
  const [edits, setEdits] = useState<Record<string, Partial<StreamPlatformConfig>>>({});

  const load = useCallback(async () => {
    try {
      const [liveRes, platformsRes] = await Promise.all([
        fetch("/api/dashboard/live-status-get").then((r) => r.ok ? r.json() : null),
        fetch("/api/dashboard/live-platforms"),
      ]);

      if (platformsRes.ok) {
        const data = await platformsRes.json() as { platforms: StreamPlatformConfig[] };
        setPlatforms(data.platforms ?? []);
        // Initialize edits from loaded data
        const initialEdits: Record<string, Partial<StreamPlatformConfig>> = {};
        for (const p of data.platforms ?? []) {
          initialEdits[p.platform] = { ...p };
        }
        setEdits(initialEdits);
      }

      // Load live state via a GET on diviners via a separate endpoint or from session
      // We fetch via the live-status POST pattern (GET variant); use the platforms list and
      // fall back to a simple supabase client call via a hidden endpoint.
      // Since we don't have a dedicated GET endpoint, we check the liveRes:
      if (liveRes?.diviner) {
        setLiveState({
          is_live: liveRes.diviner.is_live ?? false,
          live_platforms: liveRes.diviner.live_platforms ?? [],
        });
      }
    } catch {
      toast.error("Failed to load live stream settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load live state from server via a client-side supabase call
    async function loadLiveState() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("diviners")
          .select("is_live, live_platforms")
          .eq("user_id", user.id)
          .single();
        if (data) {
          setLiveState({
            is_live: (data as { is_live?: boolean }).is_live ?? false,
            live_platforms: (data as { live_platforms?: string[] }).live_platforms ?? [],
          });
        }
      } catch {
        // Non-fatal: state defaults to offline
      }
    }
    loadLiveState();
    load();
  }, [load]);

  async function toggleLive() {
    setTogglingLive(true);
    const newIsLive = !liveState.is_live;
    const newLivePlatforms = newIsLive ? liveState.live_platforms : [];

    try {
      const res = await fetch("/api/dashboard/live-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_live: newIsLive, live_platforms: newLivePlatforms }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        toast.error(err.error ?? "Failed to update live status");
        return;
      }
      const result = await res.json() as { diviner: { is_live: boolean; live_platforms: string[] } };
      setLiveState({
        is_live: result.diviner.is_live,
        live_platforms: result.diviner.live_platforms ?? [],
      });
      toast.success(newIsLive ? "You are now LIVE!" : "Live stream ended");
    } catch {
      toast.error("Network error updating live status");
    } finally {
      setTogglingLive(false);
    }
  }

  async function updateLivePlatforms(platformId: string, checked: boolean) {
    const newLivePlatforms = checked
      ? [...liveState.live_platforms.filter((p) => p !== platformId), platformId]
      : liveState.live_platforms.filter((p) => p !== platformId);

    try {
      const res = await fetch("/api/dashboard/live-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_live: liveState.is_live, live_platforms: newLivePlatforms }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        toast.error(err.error ?? "Failed to update live platforms");
        return;
      }
      const result = await res.json() as { diviner: { is_live: boolean; live_platforms: string[] } };
      setLiveState({
        is_live: result.diviner.is_live,
        live_platforms: result.diviner.live_platforms ?? [],
      });
    } catch {
      toast.error("Network error updating live platforms");
    }
  }

  async function savePlatform(platformId: string) {
    const edit = edits[platformId];
    if (!edit) return;
    setSavingPlatform(platformId);
    try {
      const res = await fetch("/api/dashboard/live-platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: platformId,
          stream_url: edit.stream_url ?? null,
          embed_url: edit.embed_url ?? null,
          display_name: edit.display_name ?? null,
          is_enabled: edit.is_enabled ?? true,
          sort_order: edit.sort_order ?? 0,
        }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        toast.error(err.error ?? "Failed to save platform");
        return;
      }
      const result = await res.json() as { platform: StreamPlatformConfig };
      setPlatforms((prev) => {
        const exists = prev.find((p) => p.platform === platformId);
        if (exists) {
          return prev.map((p) => p.platform === platformId ? result.platform : p);
        }
        return [...prev, result.platform];
      });
      setEdits((prev) => ({ ...prev, [platformId]: { ...result.platform } }));
      toast.success("Platform saved");
    } catch {
      toast.error("Network error saving platform");
    } finally {
      setSavingPlatform(null);
    }
  }

  async function deletePlatform(platformId: string) {
    setDeletingPlatform(platformId);
    try {
      const res = await fetch(`/api/dashboard/live-platforms/${platformId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        toast.error(err.error ?? "Failed to remove platform");
        return;
      }
      setPlatforms((prev) => prev.filter((p) => p.platform !== platformId));
      setEdits((prev) => {
        const next = { ...prev };
        delete next[platformId];
        return next;
      });
      // Also remove from live_platforms if present
      if (liveState.live_platforms.includes(platformId)) {
        await updateLivePlatforms(platformId, false);
      }
      toast.success("Platform removed");
    } catch {
      toast.error("Network error removing platform");
    } finally {
      setDeletingPlatform(null);
    }
  }

  function addPlatform(platformId: PlatformId) {
    if (edits[platformId]) return; // already added
    setEdits((prev) => ({
      ...prev,
      [platformId]: {
        platform: platformId,
        stream_url: null,
        embed_url: null,
        display_name: null,
        is_enabled: true,
        sort_order: Object.keys(prev).length,
      },
    }));
  }

  function updateEdit(platformId: string, field: keyof StreamPlatformConfig, value: unknown) {
    setEdits((prev) => ({
      ...prev,
      [platformId]: {
        ...(prev[platformId] ?? {}),
        [field]: value,
      },
    }));
  }

  // Active platform IDs (configured or being added)
  const activePlatformIds = Object.keys(edits);
  const availableToAdd = ALL_PLATFORMS.filter((p) => !activePlatformIds.includes(p.id));

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
        <h1 className="text-2xl font-bold tracking-tight">Live Streaming</h1>
        <p className="text-muted-foreground">
          Manage your multi-platform live stream presence and go live status.
        </p>
      </div>

      {/* ===== LIVE STATUS TOGGLE ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="size-5" />
            Live Status
          </CardTitle>
          <CardDescription>
            Toggle your live status to let viewers know when you are streaming.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {liveState.is_live ? (
                <span className="relative flex size-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex size-3 rounded-full bg-green-500" />
                </span>
              ) : (
                <span className="size-3 rounded-full bg-gray-500" />
              )}
              {liveState.is_live ? (
                <Badge className="gap-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/20">
                  🔴 You are LIVE
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">Currently offline</span>
              )}
            </div>
            <Button
              onClick={toggleLive}
              disabled={togglingLive}
              size="lg"
              className={
                liveState.is_live
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-green-600 text-white hover:bg-green-700"
              }
            >
              {togglingLive ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Radio className="mr-2 size-4" />
              )}
              {liveState.is_live ? "End Live" : "Go Live"}
            </Button>
          </div>

          {/* Platform checkboxes when live */}
          {liveState.is_live && activePlatformIds.length > 0 && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
              <p className="mb-3 text-sm font-medium text-green-400">
                Which platforms are you currently streaming on?
              </p>
              <div className="flex flex-wrap gap-3">
                {activePlatformIds.map((pid) => {
                  const meta = getPlatformMeta(pid);
                  return (
                    <label
                      key={pid}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm transition-colors hover:bg-white/[0.06]"
                    >
                      <Checkbox
                        checked={liveState.live_platforms.includes(pid)}
                        onCheckedChange={(checked) => updateLivePlatforms(pid, checked === true)}
                      />
                      <span>{meta.emoji}</span>
                      <span>{meta.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== PLATFORM CONFIGS ===== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Stream Platforms</h2>
            <p className="text-sm text-muted-foreground">
              Configure stream URLs for each platform.
            </p>
          </div>

          {availableToAdd.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Plus className="size-4" />
                  Add Platform
                  <ChevronDown className="size-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {availableToAdd.map((p) => (
                  <DropdownMenuItem key={p.id} onClick={() => addPlatform(p.id as PlatformId)}>
                    <span className="mr-2">{p.emoji}</span>
                    {p.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {activePlatformIds.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <Radio className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No platforms configured yet.</p>
              <p className="text-xs text-muted-foreground/60">
                Use the &ldquo;Add Platform&rdquo; button above to add your first stream platform.
              </p>
            </CardContent>
          </Card>
        )}

        {activePlatformIds.map((pid) => {
          const meta = getPlatformMeta(pid);
          const edit = edits[pid] ?? {};
          const isSaving = savingPlatform === pid;
          const isDeleting = deletingPlatform === pid;
          const savedConfig = platforms.find((p) => p.platform === pid);
          const isDirty =
            !savedConfig ||
            edit.stream_url !== savedConfig.stream_url ||
            edit.embed_url !== savedConfig.embed_url ||
            edit.display_name !== savedConfig.display_name ||
            edit.is_enabled !== savedConfig.is_enabled ||
            edit.sort_order !== savedConfig.sort_order;

          return (
            <Card key={pid}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="text-lg">{meta.emoji}</span>
                    {meta.label}
                    {liveState.live_platforms.includes(pid) && liveState.is_live && (
                      <Badge className="ml-1 gap-1 bg-green-500/20 text-green-400 hover:bg-green-500/20 text-xs">
                        🔴 Live
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`enabled-${pid}`} className="text-xs text-muted-foreground">
                        Enabled
                      </Label>
                      <Switch
                        id={`enabled-${pid}`}
                        checked={edit.is_enabled ?? true}
                        onCheckedChange={(checked) => updateEdit(pid, "is_enabled", checked)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => deletePlatform(pid)}
                      disabled={isDeleting}
                      aria-label={`Remove ${meta.label}`}
                    >
                      {isDeleting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`stream-url-${pid}`}>Stream URL</Label>
                    <Input
                      id={`stream-url-${pid}`}
                      value={edit.stream_url ?? ""}
                      onChange={(e) => updateEdit(pid, "stream_url", e.target.value || null)}
                      placeholder={
                        pid === "youtube"
                          ? "UCxxxxxxxxxxxxxxxxx (Channel ID)"
                          : pid === "facebook"
                          ? "https://www.facebook.com/yourpage/videos/..."
                          : pid === "zoom"
                          ? "https://zoom.us/j/..."
                          : "Stream or channel URL"
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`embed-url-${pid}`} className="flex items-center gap-1.5">
                      Embed URL
                      <span
                        title="If different from stream URL, e.g. YouTube embed link"
                        className="cursor-help"
                      >
                        <Info className="size-3.5 text-muted-foreground" />
                      </span>
                      <span className="text-xs text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id={`embed-url-${pid}`}
                      value={edit.embed_url ?? ""}
                      onChange={(e) => updateEdit(pid, "embed_url", e.target.value || null)}
                      placeholder={
                        pid === "youtube"
                          ? "https://www.youtube.com/embed/live_stream?channel=..."
                          : "Direct embed URL if different"
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`display-name-${pid}`}>
                      Display Name
                      <span className="ml-1 text-xs text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id={`display-name-${pid}`}
                      value={edit.display_name ?? ""}
                      onChange={(e) => updateEdit(pid, "display_name", e.target.value || null)}
                      placeholder={`e.g. My ${meta.label} Channel`}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`sort-order-${pid}`}>Sort Order</Label>
                    <Input
                      id={`sort-order-${pid}`}
                      type="number"
                      min={0}
                      value={edit.sort_order ?? 0}
                      onChange={(e) =>
                        updateEdit(pid, "sort_order", parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </div>
                </div>

                {/* Preview link */}
                {(edit.stream_url || edit.embed_url) && (
                  <a
                    href={edit.stream_url ?? edit.embed_url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  >
                    Open stream URL
                    <ExternalLink className="size-3" />
                  </a>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={() => savePlatform(pid)}
                    disabled={isSaving || !isDirty}
                    size="sm"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Saving...
                      </>
                    ) : isDirty ? (
                      "Save"
                    ) : (
                      "Saved"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ===== HOW TO GO LIVE INSTRUCTIONS ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="size-5" />
            How to Go Live
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <ol className="list-inside list-decimal space-y-2">
            <li>
              Add your platform(s) above and enter the stream URL for each.
            </li>
            <li>
              Start streaming on your platform of choice (YouTube Studio, Facebook Live, etc.).
            </li>
            <li>
              Click <strong className="text-foreground">Go Live</strong> on this page and check
              which platforms you are live on.
            </li>
            <li>
              Your public profile page will show an embedded player and a live badge to viewers.
            </li>
            <li>
              When you finish, click <strong className="text-foreground">End Live</strong> to
              remove the live badge from your profile.
            </li>
          </ol>
          <p className="flex items-start gap-1.5">
            <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/60" />
            <span>
              For YouTube, enter your Channel ID (found at{" "}
              <a
                href="https://www.youtube.com/account_advanced"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-foreground"
              >
                youtube.com/account_advanced
                <ExternalLink className="size-2.5" />
              </a>
              ). For other platforms, paste the direct stream or video URL.
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
