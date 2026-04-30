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
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function load() {
    setError(null);
    setLoading(true);
    const defRes = await fetch(`/api/admin/ritual-configurations/${id}`);
    if (!defRes.ok) {
      const e = await defRes.json().catch(() => ({}));
      setError(e.error ?? "Failed to load");
      setLoading(false);
      return;
    }
    const j = await defRes.json();
    setDefinition(j.definition as RitualDefinition);
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
        <MappingsTab definition={definition} />
      ) : null}
      {tab === "assets" ? (
        <AssetsTab definition={definition} onPatch={patch} onReload={load} />
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
            uses the configured final-override asset.
          </p>
        </div>
        <Button onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save"}
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

// ── Mappings tab ──────────────────────────────────────────────────────────
//
// Per-ritual scoped mappings. Lets the admin override what video plays for
// a given tag (e.g. "Fire_Gate_Invocation_Ritual") for THIS ritual only,
// without touching the global mapping. Backed by ritual_asset_mappings
// rows where mapping_scope='ritual_definition' and ritual_definition_id
// matches this configuration.

function MappingsTab({ definition }: { definition: RitualDefinition }) {
  const [mappings, setMappings] = useState<PerRitualMapping[] | null>(null);
  const [assets, setAssets] = useState<RitualAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PerRitualMapping | null>(null);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const [mRes, aRes] = await Promise.all([
        fetch(
          `/api/admin/ritual-asset-mappings?scope=ritual_definition&ritualDefinitionId=${definition.id}&pageSize=200`
        ),
        fetch(`/api/admin/ritual-assets?pageSize=200&status=active&state=published`),
      ]);
      if (!mRes.ok) throw new Error("Failed to load mappings");
      if (!aRes.ok) throw new Error("Failed to load assets");
      const mJson = await mRes.json();
      const aJson = await aRes.json();
      setMappings((mJson.items ?? []) as PerRitualMapping[]);
      const items = Array.isArray(aJson) ? aJson : aJson.items ?? [];
      setAssets(items as RitualAsset[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
      setMappings([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition.id]);

  async function remove(id: string) {
    if (!confirm("Remove this per-ritual mapping?")) return;
    const res = await fetch(`/api/admin/ritual-asset-mappings/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Delete failed");
      return;
    }
    await load();
  }

  async function toggleActive(m: PerRitualMapping) {
    const res = await fetch(`/api/admin/ritual-asset-mappings/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !m.is_active }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Update failed");
      return;
    }
    await load();
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Per-ritual mappings</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Override what video plays for a given tag in <em>this</em>{" "}
            configuration. Falls back to the global mapping when no
            per-ritual row exists.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setShowForm((s) => !s);
          }}
        >
          {showForm && !editing ? (
            "Cancel"
          ) : (
            <>
              <Plus className="mr-1.5 size-4" /> New mapping
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="flex items-center gap-2 rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="size-4" /> {error}
          </div>
        ) : null}

        {(showForm || editing) && (
          <PerRitualMappingForm
            ritualDefinitionId={definition.id}
            assets={assets}
            initial={editing}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            onSaved={async () => {
              setShowForm(false);
              setEditing(null);
              await load();
            }}
          />
        )}

        {loading ? (
          <div className="flex h-24 items-center justify-center">
            <RotateCw className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : !mappings || mappings.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No per-ritual mappings yet. The runtime player will use global
            mappings for every tag.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <code className="text-sm">{m.tag_key ?? "—"}</code>
                  </TableCell>
                  <TableCell className="text-sm">
                    {m.asset?.title ?? (
                      <span className="text-muted-foreground">
                        (asset missing)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        m.is_active
                          ? "border-green-500/30 bg-green-500/10 text-green-600"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {m.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleActive(m)}
                      >
                        {m.is_active ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(m);
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Delete"
                        onClick={() => remove(m.id)}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
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

function PerRitualMappingForm({
  ritualDefinitionId,
  assets,
  initial,
  onCancel,
  onSaved,
}: {
  ritualDefinitionId: string;
  assets: RitualAsset[];
  initial: PerRitualMapping | null;
  onCancel: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [tagKey, setTagKey] = useState(initial?.tag_key ?? "");
  const [assetId, setAssetId] = useState(initial?.asset_id ?? "");
  const [isActive, setIsActive] = useState<boolean>(
    initial?.is_active ?? true
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      if (!tagKey.trim()) {
        setErr("Tag key is required.");
        return;
      }
      if (!assetId) {
        setErr("Pick an asset.");
        return;
      }
      const url = initial
        ? `/api/admin/ritual-asset-mappings/${initial.id}`
        : "/api/admin/ritual-asset-mappings";
      const method = initial ? "PATCH" : "POST";
      const body = initial
        ? { tag_key: tagKey.trim(), asset_id: assetId, is_active: isActive }
        : {
            mapping_scope: "ritual_definition",
            ritual_definition_id: ritualDefinitionId,
            tag_key: tagKey.trim(),
            asset_id: assetId,
            is_active: isActive,
          };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? "Save failed");
        return;
      }
      await onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-md border bg-muted/30 p-4 space-y-3">
      <p className="text-sm font-medium">
        {initial ? "Edit mapping" : "New per-ritual mapping"}
      </p>
      {err ? (
        <div className="flex items-center gap-2 rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4" /> {err}
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Tag key</Label>
          <Input
            placeholder="e.g. Fire_Gate_Invocation_Ritual"
            value={tagKey}
            onChange={(e) => setTagKey(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Asset</Label>
          <Select value={assetId} onValueChange={setAssetId}>
            <SelectTrigger>
              <SelectValue placeholder="Pick an asset…" />
            </SelectTrigger>
            <SelectContent>
              {assets.length === 0 ? (
                <SelectItem value="__none" disabled>
                  No active+published assets available
                </SelectItem>
              ) : (
                assets.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Toggle
        id="mapping-active"
        label="Active"
        value={isActive}
        onChange={setIsActive}
      />
      <div className="flex gap-2">
        <Button onClick={submit} disabled={busy}>
          {busy ? "Saving…" : initial ? "Save changes" : "Create mapping"}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Assets tab ────────────────────────────────────────────────────────────
//
// "Assets" surfaces the configuration's asset relationships:
//   1. Final-override picker — when override is enabled on the Playback
//      tab, this is the single video that replaces the generated playlist.
//   2. Linked assets — read-only summary of assets currently used by the
//      per-ritual mappings (the Mappings tab is where you actually edit
//      them; this is just a quick "what's attached" view).

function AssetsTab({
  definition,
  onPatch,
  onReload,
}: {
  definition: RitualDefinition;
  onPatch: (body: Record<string, unknown>) => Promise<void> | void;
  onReload: () => void | Promise<void>;
}) {
  const [assets, setAssets] = useState<RitualAsset[]>([]);
  const [linked, setLinked] = useState<PerRitualMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pickedId, setPickedId] = useState<string>(
    definition.final_override_asset_id ?? ""
  );
  const [busy, setBusy] = useState(false);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const [aRes, mRes] = await Promise.all([
        fetch(`/api/admin/ritual-assets?pageSize=200&status=active&state=published`),
        fetch(
          `/api/admin/ritual-asset-mappings?scope=ritual_definition&ritualDefinitionId=${definition.id}&pageSize=200`
        ),
      ]);
      if (!aRes.ok) throw new Error("Failed to load assets");
      if (!mRes.ok) throw new Error("Failed to load linked mappings");
      const aJson = await aRes.json();
      const mJson = await mRes.json();
      const items = Array.isArray(aJson) ? aJson : aJson.items ?? [];
      setAssets(items as RitualAsset[]);
      setLinked((mJson.items ?? []) as PerRitualMapping[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition.id]);

  // Keep the picker in sync if the parent re-loads (e.g. after a save).
  useEffect(() => {
    setPickedId(definition.final_override_asset_id ?? "");
  }, [definition.final_override_asset_id]);

  const overrideEnabled = definition.final_override_enabled;
  const currentOverride = useMemo(
    () =>
      definition.final_override_asset ??
      assets.find((a) => a.id === definition.final_override_asset_id) ??
      null,
    [assets, definition.final_override_asset, definition.final_override_asset_id]
  );

  async function saveOverride() {
    setBusy(true);
    try {
      await onPatch({ final_override_asset_id: pickedId || null });
      await onReload();
    } finally {
      setBusy(false);
    }
  }

  async function clearOverride() {
    setBusy(true);
    try {
      setPickedId("");
      await onPatch({ final_override_asset_id: null });
      await onReload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Final-override video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="flex items-center gap-2 rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4" /> {error}
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                overrideEnabled
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                  : "bg-muted text-muted-foreground"
              }
            >
              {overrideEnabled ? "Final override mode" : "Generated playlist mode"}
            </Badge>
            {!overrideEnabled ? (
              <span className="text-xs text-muted-foreground">
                Enable on the Playback tab to use a single override video.
              </span>
            ) : null}
          </div>

          {currentOverride ? (
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium">{currentOverride.title}</p>
              <p className="text-xs text-muted-foreground">
                {currentOverride.source_type === "external_url"
                  ? currentOverride.external_url
                  : currentOverride.storage_path}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge
                  variant="outline"
                  className={
                    currentOverride.is_active
                      ? ""
                      : "border-red-500/30 bg-red-500/10 text-red-500"
                  }
                >
                  {currentOverride.is_active ? "Active" : "Inactive"}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    currentOverride.is_published
                      ? "border-green-500/30 bg-green-500/10 text-green-600"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {currentOverride.is_published ? "Published" : "Draft"}
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No override asset selected.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-1">
              <Label>Pick final-override asset</Label>
              <Select
                value={pickedId}
                onValueChange={setPickedId}
                disabled={!overrideEnabled || loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an asset…" />
                </SelectTrigger>
                <SelectContent>
                  {assets.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      No active+published assets available
                    </SelectItem>
                  ) : (
                    assets.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={saveOverride}
                disabled={
                  !overrideEnabled ||
                  busy ||
                  pickedId === (definition.final_override_asset_id ?? "")
                }
              >
                {busy ? "Saving…" : "Save override"}
              </Button>
              {definition.final_override_asset_id ? (
                <Button
                  variant="outline"
                  onClick={clearOverride}
                  disabled={busy}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Linked assets (per-ritual mappings)</CardTitle>
          <p className="text-xs text-muted-foreground">
            Read-only summary. Edit on the Mappings tab.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-20 items-center justify-center">
              <RotateCw className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : linked.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No per-ritual mappings yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>State</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linked.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <code className="text-sm">{m.tag_key ?? "—"}</code>
                    </TableCell>
                    <TableCell className="text-sm">
                      {m.asset?.title ?? (
                        <span className="text-muted-foreground">
                          (asset missing)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          m.is_active
                            ? ""
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {m.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
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
