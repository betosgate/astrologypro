"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";

/**
 * /admin/rituals/new — create a new Ritual Configuration.
 *
 * Spec source:
 *   docs/tasks/2026-04-27/04-ritual-configurations-gap-analysis-post-db-migration.md
 *
 * Sectioned form:
 *   1. Basic information
 *   2. Display settings
 *   3. Playback settings (incl. final-override toggle)
 *   4. Publish + visibility
 *
 * Asset assignment (final-override target + per-ritual mappings) lives
 * on the edit screen so the create flow stays simple.
 */
export default function NewRitualConfigurationPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState({
    key: "",
    title: "",
    description: "",
    ritual_type: "dynamic" as "static" | "dynamic",
    supported_mode: "both" as "invocation" | "banishing" | "both",
    badge_label: "",
    sort_order: "0",
    is_visible: true,
    is_published: false,
    final_override_enabled: false,
    autoplay: true,
    sequential_lock: true,
    allow_backward_replay: true,
    show_playlist: true,
    completion_requires_video_end: true,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/admin/ritual-configurations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: form.key.trim(),
        title: form.title.trim(),
        description: form.description.trim() || null,
        ritual_type: form.ritual_type,
        supported_mode: form.supported_mode,
        badge_label: form.badge_label.trim() || null,
        sort_order: Number(form.sort_order) || 0,
        is_visible: form.is_visible,
        is_published: form.is_published,
        final_override_enabled: form.final_override_enabled,
        playback_policy_json: {
          autoplay: form.autoplay,
          sequential_lock: form.sequential_lock,
          allow_backward_replay: form.allow_backward_replay,
          show_playlist: form.show_playlist,
          completion_requires_video_end: form.completion_requires_video_end,
          missing_asset_behavior: "warn_and_skip",
        },
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(j.error ?? "Failed to create configuration");
      setBusy(false);
      return;
    }
    router.push(`/admin/rituals/${j.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/rituals"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 size-4" />
          Back to Ritual Configurations
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          New Ritual Configuration
        </h1>
        <p className="text-sm text-muted-foreground">
          Define a ritual that community users can run. Assets and tag
          mappings can be wired in after creation.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Basic information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="key">Internal key / slug *</Label>
                <Input
                  id="key"
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  placeholder="planetary_zodiacal_invocation"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Stable identifier used by community runtime to load this configuration.
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Short description</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Display</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>Ritual type</Label>
                <Select
                  value={form.ritual_type}
                  onValueChange={(v) =>
                    setForm({ ...form, ritual_type: v as "static" | "dynamic" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static">Static</SelectItem>
                    <SelectItem value="dynamic">Dynamic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Supported mode</Label>
                <Select
                  value={form.supported_mode}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      supported_mode: v as "invocation" | "banishing" | "both",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invocation">Invocation</SelectItem>
                    <SelectItem value="banishing">Banishing</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="sort_order">Sort order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm({ ...form, sort_order: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="badge">Card badge label</Label>
              <Input
                id="badge"
                value={form.badge_label}
                onChange={(e) =>
                  setForm({ ...form, badge_label: e.target.value })
                }
                placeholder="Custom"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Playback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <PolicyToggle
                id="autoplay"
                label="Autoplay first video"
                value={form.autoplay}
                onChange={(v) => setForm({ ...form, autoplay: v })}
              />
              <PolicyToggle
                id="sequential_lock"
                label="Lock forward navigation until current video ends"
                value={form.sequential_lock}
                onChange={(v) => setForm({ ...form, sequential_lock: v })}
              />
              <PolicyToggle
                id="allow_backward_replay"
                label="Allow backward replay"
                value={form.allow_backward_replay}
                onChange={(v) => setForm({ ...form, allow_backward_replay: v })}
              />
              <PolicyToggle
                id="show_playlist"
                label="Show playlist sidebar"
                value={form.show_playlist}
                onChange={(v) => setForm({ ...form, show_playlist: v })}
              />
              <PolicyToggle
                id="completion_requires_video_end"
                label="Completion requires video end"
                value={form.completion_requires_video_end}
                onChange={(v) =>
                  setForm({ ...form, completion_requires_video_end: v })
                }
              />
            </div>
            <div className="rounded-md border bg-muted/30 px-3 py-3">
              <PolicyToggle
                id="final_override"
                label="Use a single final-override video instead of the generated playlist"
                value={form.final_override_enabled}
                onChange={(v) =>
                  setForm({ ...form, final_override_enabled: v })
                }
              />
              <p className="mt-1 text-xs text-muted-foreground">
                The override video is selected on the edit screen after creation.
                When on, runtime playback uses one video and ignores the playlist.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Publish &amp; visibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <PolicyToggle
                id="is_visible"
                label="Visible to community"
                value={form.is_visible}
                onChange={(v) => setForm({ ...form, is_visible: v })}
              />
              <PolicyToggle
                id="is_published"
                label="Published (otherwise stays as draft)"
                value={form.is_published}
                onChange={(v) => setForm({ ...form, is_published: v })}
              />
            </div>
          </CardContent>
        </Card>

        {err ? <p className="text-sm text-red-500">{err}</p> : null}

        <div className="flex gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create configuration"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/rituals")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function PolicyToggle({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={value}
        onCheckedChange={(c) => onChange(!!c)}
      />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
}
