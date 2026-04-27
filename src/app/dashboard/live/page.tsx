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
import {
  getLivePlatformEmoji,
  getLivePlatformLabel,
  type GovernedLivePlatform,
  type GovernedStreamPlatformConfig,
  type LivePlatformKey,
} from "@/lib/live-platform-governance";

type StreamPlatformConfig = GovernedStreamPlatformConfig;

interface DivinerLiveState {
  is_live: boolean;
  live_platforms: string[];
}

interface LiveSessionSummary {
  id: string;
  platform: string;
  title: string | null;
  status: "scheduled" | "live" | "ended" | "cancelled";
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  check_in_enabled: boolean;
}

export default function LiveStreamPage() {
  const [loading, setLoading] = useState(true);
  const [liveState, setLiveState] = useState<DivinerLiveState>({ is_live: false, live_platforms: [] });
  const [togglingLive, setTogglingLive] = useState(false);
  const [platforms, setPlatforms] = useState<StreamPlatformConfig[]>([]);
  const [availablePlatforms, setAvailablePlatforms] = useState<GovernedLivePlatform[]>([]);
  const [currentSession, setCurrentSession] = useState<LiveSessionSummary | null>(null);
  const [nextScheduledSession, setNextScheduledSession] = useState<LiveSessionSummary | null>(null);
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
        const data = await platformsRes.json() as {
          platforms: StreamPlatformConfig[];
          availablePlatforms: GovernedLivePlatform[];
        };
        setPlatforms(data.platforms ?? []);
        setAvailablePlatforms((data.availablePlatforms ?? []).filter((platform) => platform.is_available_for_diviner));
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
        setCurrentSession((liveRes.currentSession ?? null) as LiveSessionSummary | null);
        setNextScheduledSession((liveRes.nextScheduledSession ?? null) as LiveSessionSummary | null);
      }
    } catch {
      toast.error("Failed to load live stream settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleLive() {
    setTogglingLive(true);
    const newIsLive = !liveState.is_live;
    // When going live, default to every platform the diviner has explicitly
    // enabled (toggle = on). The selection panel below lets them narrow this
    // further if needed, but defaulting here means a freshly configured
    // diviner can hit "Go Live" right after enabling YouTube without first
    // having to tick a separate checkbox.
    const enabledPlatformKeys = platforms
      .filter((p) => p.is_enabled)
      .map((p) => p.platform);
    const newLivePlatforms = newIsLive
      ? liveState.live_platforms.length > 0
        ? liveState.live_platforms
        : enabledPlatformKeys
      : [];

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
      const result = await res.json() as {
        diviner: { is_live: boolean; live_platforms: string[] };
        currentSession?: LiveSessionSummary | null;
        nextScheduledSession?: LiveSessionSummary | null;
      };
      setLiveState({
        is_live: result.diviner.is_live,
        live_platforms: result.diviner.live_platforms ?? [],
      });
      setCurrentSession(result.currentSession ?? null);
      setNextScheduledSession(result.nextScheduledSession ?? null);
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

    // Pre-Go-Live selection (offline): the server only persists
    // `live_platforms` while there's an actual `live_sessions` row with
    // status='live'. If we POST while offline, the server's
    // syncDivinerLiveMirror forces live_platforms back to [] and the
    // response wipes our pick — making the checkbox feel unclickable.
    // Keep the selection in local state until the user clicks Go Live;
    // toggleLive() reads liveState.live_platforms when sending the
    // initial Go Live request.
    if (!liveState.is_live) {
      setLiveState({
        ...liveState,
        live_platforms: newLivePlatforms,
      });
      return;
    }

    // While actually live we do hit the server so mid-stream changes
    // (e.g. add Facebook Live to an in-progress YouTube broadcast) get
    // persisted and reflected on the public profile.
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
      const result = await res.json() as {
        diviner: { is_live: boolean; live_platforms: string[] };
        currentSession?: LiveSessionSummary | null;
        nextScheduledSession?: LiveSessionSummary | null;
      };
      setLiveState({
        is_live: result.diviner.is_live,
        live_platforms: result.diviner.live_platforms ?? [],
      });
      setCurrentSession(result.currentSession ?? null);
      setNextScheduledSession(result.nextScheduledSession ?? null);
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
      await load();
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

  function addPlatform(platformId: LivePlatformKey) {
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
  const availableToAdd = availablePlatforms.filter(
    (platform) => !activePlatformIds.includes(platform.platform_key)
  );

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

          {(currentSession || nextScheduledSession) && (
            <div className="grid gap-3 md:grid-cols-2">
              {currentSession && (
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-green-400">
                    Current session
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {currentSession.title ?? "Live now"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Platform: {currentSession.platform} · Check-in{" "}
                    {currentSession.check_in_enabled ? "enabled" : "disabled"}
                  </p>
                </div>
              )}
              {nextScheduledSession && !currentSession && (
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                    Next scheduled session
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {nextScheduledSession.title ?? "Scheduled live session"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {nextScheduledSession.scheduled_at
                      ? new Date(nextScheduledSession.scheduled_at).toLocaleString()
                      : "No scheduled time set"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/*
            Platform-selection panel.
            Shown any time the diviner has at least one configured platform —
            not only when already live. Previously this was gated on
            `liveState.is_live`, which made it impossible to pre-select
            platforms before the first Go Live click (the server then
            rejected with "Select at least one allowed live platform").
          */}
          {activePlatformIds.length > 0 && (
            <div
              className={`rounded-lg border p-4 ${
                liveState.is_live
                  ? "border-green-500/20 bg-green-500/5"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <p
                className={`mb-3 text-sm font-medium ${
                  liveState.is_live ? "text-green-400" : "text-foreground"
                }`}
              >
                {liveState.is_live
                  ? "Which platforms are you currently streaming on?"
                  : "Pick the platforms you'll go live on"}
              </p>
              <div className="flex flex-wrap gap-3">
                {activePlatformIds.map((pid) => {
                  const platform = availablePlatforms.find((item) => item.platform_key === pid);
                  const label = getLivePlatformLabel(
                    (platform?.platform_key ?? "other") as LivePlatformKey,
                    platform?.display_name
                  );
                  const emoji = getLivePlatformEmoji(
                    (platform?.platform_key ?? "other") as LivePlatformKey
                  );
                  return (
                    <label
                      key={pid}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm transition-colors hover:bg-white/[0.06]"
                    >
                      <Checkbox
                        checked={liveState.live_platforms.includes(pid)}
                        onCheckedChange={(checked) => updateLivePlatforms(pid, checked === true)}
                      />
                      <span>{emoji}</span>
                      <span>{label}</span>
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
                  <DropdownMenuItem key={p.platform_key} onClick={() => addPlatform(p.platform_key)}>
                    <span className="mr-2">{getLivePlatformEmoji(p.platform_key)}</span>
                    {p.display_name}
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
          const edit = edits[pid] ?? {};
          const isSaving = savingPlatform === pid;
          const isDeleting = deletingPlatform === pid;
          const savedConfig = platforms.find((p) => p.platform === pid);
          const platform = availablePlatforms.find((item) => item.platform_key === pid);
          const platformKey = (savedConfig?.platform ?? platform?.platform_key ?? "other") as LivePlatformKey;
          const platformLabel = getLivePlatformLabel(
            platformKey,
            savedConfig?.platform_display_name ?? platform?.display_name
          );
          const platformEmoji = getLivePlatformEmoji(platformKey);
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
                    <span className="text-lg">{platformEmoji}</span>
                    {platformLabel}
                    {liveState.live_platforms.includes(pid) && liveState.is_live && (
                      <Badge className="ml-1 gap-1 bg-green-500/20 text-green-400 hover:bg-green-500/20 text-xs">
                        🔴 Live
                      </Badge>
                    )}
                    {savedConfig?.playback_mode === "external_link" && (
                      <Badge variant="outline" className="text-xs">
                        Link-out
                      </Badge>
                    )}
                    {savedConfig?.playback_mode === "manual_status" && (
                      <Badge variant="outline" className="text-xs">
                        Manual
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
                      aria-label={`Remove ${platformLabel}`}
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
                          : pid === "twitch"
                          ? "https://www.twitch.tv/yourchannel"
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
                      placeholder={`e.g. My ${platformLabel} Channel`}
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
