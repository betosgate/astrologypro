"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Plus,
  RotateCw,
  Trash2,
} from "lucide-react";

/**
 * /admin/rituals/[id] — Tabbed editor for a single ritual configuration.
 *
 * Spec source:
 *   docs/tasks/2026-04-27/04-ritual-configurations-gap-analysis-post-db-migration.md
 *
 * Tabs:
 *   Overview / Display / Playback / Mappings / Assets / Publish
 *
 * Mappings tab manages per-ritual mapping rows scoped to this
 * configuration; the Assets tab includes the final-override picker,
 * since that's the asset the configuration "owns" most directly.
 */

interface RitualAsset {
  id: string;
  asset_key: string;
  title: string;
  source_type: "upload" | "external_url";
  storage_path: string | null;
  external_url: string | null;
  is_active: boolean;
  is_published: boolean;
  archived_at: string | null;
}

interface RitualDefinition {
  id: string;
  key: string;
  title: string;
  description: string | null;
  ritual_type: "static" | "dynamic";
  supported_mode: "invocation" | "banishing" | "both";
  badge_label: string | null;
  icon_key: string | null;
  sort_order: number;
  is_visible: boolean;
  is_published: boolean;
  archived_at: string | null;
  playback_policy_json: Record<string, unknown> | null;
  final_override_enabled: boolean;
  final_override_asset_id: string | null;
  card_title_override: string | null;
  card_description_override: string | null;
  card_cta_label_override: string | null;
  playlist_title_override: string | null;
  completion_message: string | null;
  missing_asset_message: string | null;
  final_override_asset?: RitualAsset | null;
}

interface PerRitualMapping {
  id: string;
  tag_key: string | null;
  asset_id: string;
  is_active: boolean;
  asset?: RitualAsset | null;
}

type Tab =
  | "overview"
  | "display"
  | "playback"
  | "mappings"
  | "assets"
  | "publish";

export default function EditRitualConfigurationPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [definition, setDefinition] = useState<RitualDefinition | null>(null);
  const [mappings, setMappings] = useState<PerRitualMapping[]>([]);
  const [assets, setAssets] = useState<RitualAsset[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function load() {
    setError(null);
    setLoading(true);
    const [defRes, assetsRes] = await Promise.all([
      fetch(`/api/admin/ritual-configurations/${id}`),
      fetch(`/api/admin/ritual-assets`),
    ]);
    if (!defRes.ok) {
      const e = await defRes.json().catch(() => ({}));
      setError(e.error ?? "Failed to load");
      setLoading(false);
      return;
    }
    const j = await defRes.json();
    setDefinition(j.definition as RitualDefinition);
    setMappings((j.mappings ?? []) as PerRitualMapping[]);
    if (assetsRes.ok) {
      setAssets((await assetsRes.json()) as RitualAsset[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (id) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function patch(body: Record<string, unknown>) {
    setSaved(false);
    setError(null);
    const res = await fetch(`/api/admin/ritual-configurations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      setError(e.error ?? "Save failed");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    await load();
  }

  if (loading || !definition) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        <RotateCw className="mx-auto mb-2 size-4 animate-spin" /> Loading…
      </div>
    );
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
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">{definition.title}</h1>
          <Badge variant="outline">
            <code>{definition.key}</code>
          </Badge>
          <Badge
            variant="outline"
            className={
              definition.is_published
                ? "border-green-500/30 bg-green-500/10 text-green-600"
                : "bg-muted"
            }
          >
            {definition.is_published ? "Published" : "Draft"}
          </Badge>
          {definition.final_override_enabled ? (
            <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-600">
              Final override on
            </Badge>
          ) : null}
          {saved ? (
            <span className="inline-flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="size-3.5" /> Saved
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b">
        {(
          [
            { id: "overview", label: "Overview" },
            { id: "display", label: "Display" },
            { id: "playback", label: "Playback" },
            { id: "mappings", label: "Mappings" },
            { id: "assets", label: "Assets" },
            { id: "publish", label: "Publish" },
          ] as Array<{ id: Tab; label: string }>
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
              tab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4" /> {error}
        </div>
      ) : null}

      {tab === "overview" ? (
        <OverviewTab definition={definition} onPatch={patch} />
      ) : null}
      {tab === "display" ? (
        <DisplayTab definition={definition} onPatch={patch} />
      ) : null}
      {tab === "playback" ? (
        <PlaybackTab definition={definition} onPatch={patch} />
      ) : null}
      {tab === "mappings" ? (
        <MappingsTab
          definitionId={definition.id}
          mappings={mappings}
          assets={assets}
          onChange={load}
        />
      ) : null}
      {tab === "assets" ? (
        <AssetsTab definition={definition} assets={assets} onPatch={patch} />
      ) : null}
      {tab === "publish" ? (
        <PublishTab definition={definition} onPatch={patch} onArchive={() => router.push("/admin/rituals")} />
      ) : null}
    </div>
  );
}

// ── Tabs ───────────────────────────────────────────────────────────────

function OverviewTab({
  definition,
  onPatch,
}: {
  definition: RitualDefinition;
  onPatch: (body: Record<string, unknown>) => void;
}) {
  const [title, setTitle] = useState(definition.title);
  const [key, setKey] = useState(definition.key);
  const [description, setDescription] = useState(definition.description ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await onPatch({
      title: title.trim(),
      key: key.trim(),
      description: description.trim() || null,
    });
    setBusy(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Internal key</Label>
            <Input value={key} onChange={(e) => setKey(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Description</Label>
          <Textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <Button onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}

function DisplayTab({
  definition,
  onPatch,
}: {
  definition: RitualDefinition;
  onPatch: (body: Record<string, unknown>) => void;
}) {
  const [type, setType] = useState(definition.ritual_type);
  const [mode, setMode] = useState(definition.supported_mode);
  const [badge, setBadge] = useState(definition.badge_label ?? "");
  const [sortOrder, setSortOrder] = useState(String(definition.sort_order));
  const [cardTitle, setCardTitle] = useState(
    definition.card_title_override ?? ""
  );
  const [cardDesc, setCardDesc] = useState(
    definition.card_description_override ?? ""
  );
  const [cardCta, setCardCta] = useState(
    definition.card_cta_label_override ?? ""
  );
  const [playlistTitle, setPlaylistTitle] = useState(
    definition.playlist_title_override ?? ""
  );
  const [completion, setCompletion] = useState(
    definition.completion_message ?? ""
  );
  const [missing, setMissing] = useState(
    definition.missing_asset_message ?? ""
  );
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await onPatch({
      ritual_type: type,
      supported_mode: mode,
      badge_label: badge.trim() || null,
      sort_order: Number(sortOrder) || 0,
      card_title_override: cardTitle.trim() || null,
      card_description_override: cardDesc.trim() || null,
      card_cta_label_override: cardCta.trim() || null,
      playlist_title_override: playlistTitle.trim() || null,
      completion_message: completion.trim() || null,
      missing_asset_message: missing.trim() || null,
    });
    setBusy(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Display</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>Ritual type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as "static" | "dynamic")}
            >
              <SelectTrigger className="w-full">
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
              value={mode}
              onValueChange={(v) =>
                setMode(v as "invocation" | "banishing" | "both")
              }
            >
              <SelectTrigger className="w-full">
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
            <Label>Sort order</Label>
            <Input
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Badge label</Label>
            <Input value={badge} onChange={(e) => setBadge(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Card CTA label</Label>
            <Input
              value={cardCta}
              onChange={(e) => setCardCta(e.target.value)}
              placeholder="Begin the Ritual"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Card title override (defaults to ritual title)</Label>
          <Input
            value={cardTitle}
            onChange={(e) => setCardTitle(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Card description override</Label>
          <Textarea
            rows={2}
            value={cardDesc}
            onChange={(e) => setCardDesc(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Playlist title override</Label>
          <Input
            value={playlistTitle}
            onChange={(e) => setPlaylistTitle(e.target.value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Completion message</Label>
            <Textarea
              rows={2}
              value={completion}
              onChange={(e) => setCompletion(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Missing-asset message</Label>
            <Textarea
              rows={2}
              value={missing}
              onChange={(e) => setMissing(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}

function PlaybackTab({
  definition,
  onPatch,
}: {
  definition: RitualDefinition;
  onPatch: (body: Record<string, unknown>) => void;
}) {
  const policy = (definition.playback_policy_json ?? {}) as Record<
    string,
    unknown
  >;
  const [autoplay, setAutoplay] = useState<boolean>(
    policy.autoplay !== false
  );
  const [seqLock, setSeqLock] = useState<boolean>(
    policy.sequential_lock !== false
  );
  const [allowBack, setAllowBack] = useState<boolean>(
    policy.allow_backward_replay !== false
  );
  const [showPlaylist, setShowPlaylist] = useState<boolean>(
    policy.show_playlist !== false
  );
  const [reqEnd, setReqEnd] = useState<boolean>(
    policy.completion_requires_video_end !== false
  );
  const [missing, setMissing] = useState<string>(
    typeof policy.missing_asset_behavior === "string"
      ? (policy.missing_asset_behavior as string)
      : "warn_and_skip"
  );
  const [overrideOn, setOverrideOn] = useState(definition.final_override_enabled);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await onPatch({
      final_override_enabled: overrideOn,
      playback_policy_json: {
        autoplay,
        sequential_lock: seqLock,
        allow_backward_replay: allowBack,
        show_playlist: showPlaylist,
        completion_requires_video_end: reqEnd,
        missing_asset_behavior: missing,
      },
    });
    setBusy(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Playback policy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle id="autoplay" label="Autoplay first video" value={autoplay} onChange={setAutoplay} />
          <Toggle id="seq" label="Sequential lock until current video ends" value={seqLock} onChange={setSeqLock} />
          <Toggle id="back" label="Allow backward replay" value={allowBack} onChange={setAllowBack} />
          <Toggle id="list" label="Show playlist sidebar" value={showPlaylist} onChange={setShowPlaylist} />
          <Toggle id="end" label="Completion requires video end" value={reqEnd} onChange={setReqEnd} />
        </div>
        <div className="space-y-1">
          <Label>Missing-asset behavior</Label>
          <Select value={missing} onValueChange={setMissing}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="warn_and_skip">Warn and allow skip</SelectItem>
              <SelectItem value="warn_and_block">
                Warn and block (require fix)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-md border bg-muted/30 px-3 py-3">
          <Toggle
            id="override"
            label="Use a single final-override video instead of the generated playlist"
            value={overrideOn}
            onChange={setOverrideOn}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            When on, the runtime player ignores the generated playlist and
            uses the asset selected on the Assets tab.
          </p>
        </div>
        <Button onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}

function MappingsTab({
  definitionId,
  mappings,
  assets,
  onChange,
}: {
  definitionId: string;
  mappings: PerRitualMapping[];
  assets: RitualAsset[];
  onChange: () => void;
}) {
  const [tag, setTag] = useState("");
  const [assetId, setAssetId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const sortedMappings = useMemo(
    () => [...mappings].sort((a, b) => (a.tag_key ?? "").localeCompare(b.tag_key ?? "")),
    [mappings]
  );

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/admin/ritual-asset-mappings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mapping_scope: "ritual_definition",
        ritual_definition_id: definitionId,
        tag_key: tag,
        asset_id: assetId,
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(j.error ?? "Failed to create");
      setBusy(false);
      return;
    }
    setTag("");
    setAssetId("");
    setBusy(false);
    onChange();
  }

  async function remove(id: string) {
    if (!confirm("Delete this mapping?")) return;
    await fetch(`/api/admin/ritual-asset-mappings/${id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Per-ritual mappings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          These overrides apply only when this ritual configuration is the
          one being played. They take precedence over global mappings for
          the same tag.
        </p>
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-3">
          <Input
            placeholder="Tag (e.g. Fire_Gate_Invocation_Ritual)"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            required
          />
          <Select value={assetId} onValueChange={setAssetId}>
            <SelectTrigger>
              <SelectValue placeholder="Asset…" />
            </SelectTrigger>
            <SelectContent>
              {assets
                .filter((a) => a.is_active && a.is_published && !a.archived_at)
                .map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.title}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={busy || !tag || !assetId}>
            <Plus className="mr-1.5 size-4" />
            {busy ? "Adding…" : "Add mapping"}
          </Button>
        </form>
        {err ? <p className="text-sm text-red-500">{err}</p> : null}
        {sortedMappings.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No per-ritual mappings — runtime falls back to global mappings.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMappings.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <code className="text-xs">{m.tag_key}</code>
                  </TableCell>
                  <TableCell>{m.asset?.title ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        m.is_active
                          ? "border-green-500/30 bg-green-500/10 text-green-600"
                          : "bg-muted"
                      }
                    >
                      {m.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => remove(m.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function AssetsTab({
  definition,
  assets,
  onPatch,
}: {
  definition: RitualDefinition;
  assets: RitualAsset[];
  onPatch: (body: Record<string, unknown>) => void;
}) {
  const [overrideAsset, setOverrideAsset] = useState<string>(
    definition.final_override_asset_id ?? ""
  );
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await onPatch({
      final_override_asset_id: overrideAsset || null,
    });
    setBusy(false);
  }

  const eligibleAssets = assets.filter(
    (a) => a.is_active && a.is_published && !a.archived_at
  );
  const current = eligibleAssets.find((a) => a.id === overrideAsset);
  const url = current
    ? current.source_type === "upload"
      ? current.storage_path
      : current.external_url
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Final-override video</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Pick the single video that plays when{" "}
          <strong>final-override mode</strong> is enabled (Playback tab).
          When override is off, this asset is ignored and the generated
          playlist is used.
        </p>
        <div className="space-y-1">
          <Label>Override asset</Label>
          <Select value={overrideAsset} onValueChange={setOverrideAsset}>
            <SelectTrigger>
              <SelectValue placeholder="Select an asset…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">— None —</SelectItem>
              {eligibleAssets.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {url ? (
          <div className="space-y-2">
            <Label>Preview</Label>
            <video
              key={url}
              src={url}
              controls
              className="aspect-video w-full max-w-2xl rounded border bg-black"
            />
          </div>
        ) : null}
        <Button onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save override asset"}
        </Button>
      </CardContent>
    </Card>
  );
}

function PublishTab({
  definition,
  onPatch,
  onArchive,
}: {
  definition: RitualDefinition;
  onPatch: (body: Record<string, unknown>) => void;
  onArchive: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Publish &amp; visibility</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle
            id="is_visible"
            label="Visible in community"
            value={definition.is_visible}
            onChange={(v) => onPatch({ is_visible: v })}
          />
          <Toggle
            id="is_published"
            label="Published (otherwise stays as draft)"
            value={definition.is_published}
            onChange={(v) => onPatch({ is_published: v })}
          />
        </div>
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm font-medium text-destructive">Archive</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Archived configurations are excluded from list views and from
            community runtime reads. Existing references are preserved.
          </p>
          <Button
            variant="destructive"
            size="sm"
            className="mt-2"
            onClick={async () => {
              if (!confirm("Archive this configuration?")) return;
              await fetch(`/api/admin/ritual-configurations/${definition.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ archive: true }),
              });
              onArchive();
            }}
          >
            Archive configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Toggle({
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
