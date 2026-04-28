"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Eye,
  EyeOff,
  Film,
  Filter,
  Globe,
  Pencil,
  Plus,
  Power,
  RotateCw,
  Search,
  Settings,
  Trash2,
  Upload,
} from "lucide-react";

interface RitualDefinition {
  id: string;
  key: string;
  title: string;
  description: string | null;
  ritual_type: "static" | "dynamic";
  supported_mode: "invocation" | "banishing" | "both";
  badge_label: string | null;
  sort_order: number;
  is_visible: boolean;
  is_published: boolean;
  final_override_enabled: boolean;
  final_override_asset_id: string | null;
  archived_at: string | null;
  updated_at: string;
  final_override_asset?: RitualAsset | null;
}

interface RitualAsset {
  id: string;
  asset_key: string;
  title: string;
  source_type: "upload" | "external_url";
  storage_path: string | null;
  external_url: string | null;
  mime_type: string | null;
  duration_seconds: number | null;
  is_active: boolean;
  is_published: boolean;
  archived_at: string | null;
  notes: string | null;
  mapping_count?: number;
  final_override_count?: number;
  updated_at: string;
}

interface AssetMapping {
  id: string;
  mapping_scope: "global" | "ritual_definition";
  ritual_definition_id: string | null;
  tag_key: string | null;
  asset_id: string;
  label_override: string | null;
  is_active: boolean;
  asset?: RitualAsset | null;
}

type Tab = "configs" | "assets" | "mappings" | "playback-settings";

export default function RitualConfigurationsPage() {
  const [tab, setTab] = useState<Tab>("configs");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ritual Configurations</h1>
        <p className="text-muted-foreground">
          Manage ritual definitions, video assets, and tag → asset mappings.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b">
        {[
          { id: "configs", label: "Configurations" },
          { id: "assets", label: "Video Assets" },
          { id: "mappings", label: "Tag Mappings" },
          { id: "playback-settings", label: "Playback Settings" },
        ].map((t) => (
          <Button
            key={t.id}
            variant="ghost"
            className={`rounded-none border-b-2 px-4 pb-3 pt-2 text-sm font-medium transition-colors hover:bg-transparent ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab(t.id as Tab)}
          >
            {t.label}
          </Button>
        ))}
        <div className="ml-auto">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/rituals/legacy-invocations">
              Legacy Invocations
            </Link>
          </Button>
        </div>
      </div>

      {tab === "configs" && <ConfigurationsTab />}
      {tab === "assets" && <AssetsTab />}
      {tab === "mappings" && <MappingsTab />}
      {tab === "playback-settings" && <PlaybackSettingsTab />}
    </div>
  );
}

function ConfigurationsTab() {
  const [items, setItems] = useState<RitualDefinition[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterPublished, setFilterPublished] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterOverride, setFilterOverride] = useState<string>("all");

  async function load() {
    setError(null);
    const res = await fetch("/api/admin/ritual-configurations");
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      setError(e.error ?? "Failed to load configurations");
      setItems([]);
      return;
    }
    setItems((await res.json()) as RitualDefinition[]);
  }
  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => {
      if (item.archived_at) return false;
      if (filterPublished === "published" && !item.is_published) return false;
      if (filterPublished === "draft" && item.is_published) return false;
      if (filterType !== "all" && item.ritual_type !== filterType) return false;
      if (filterOverride === "on" && !item.final_override_enabled) return false;
      if (filterOverride === "off" && item.final_override_enabled) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !item.title.toLowerCase().includes(q) &&
          !item.key.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [items, search, filterPublished, filterType, filterOverride]);

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch(`/api/admin/ritual-configurations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    void load();
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Ritual Definitions</CardTitle>
        <Button asChild>
          <Link href="/admin/rituals/new">
            <Plus className="mr-1.5 size-4" />
            New Ritual Configuration
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search title or key…"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="static">Static</SelectItem>
              <SelectItem value="dynamic">Dynamic</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPublished} onValueChange={setFilterPublished}>
            <SelectTrigger>
              <SelectValue placeholder="Published" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All states</SelectItem>
              <SelectItem value="published">Published only</SelectItem>
              <SelectItem value="draft">Drafts only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterOverride} onValueChange={setFilterOverride}>
            <SelectTrigger>
              <SelectValue placeholder="Override" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any playback mode</SelectItem>
              <SelectItem value="on">Final override on</SelectItem>
              <SelectItem value="off">Generated playlist</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <div className="flex items-center gap-2 rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="size-4" /> {error}
          </div>
        ) : null}

        {!items ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            <RotateCw className="mx-auto mb-2 size-4 animate-spin" />
            Loading…
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No configurations match the current filters.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Playback</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell>
                    <code className="text-xs">{c.key}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {c.ritual_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {c.supported_mode}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {c.final_override_enabled ? (
                      <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-600">
                        Final override
                      </Badge>
                    ) : (
                      <Badge variant="outline">Playlist</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge
                        variant="outline"
                        className={
                          c.is_published
                            ? "border-green-500/30 bg-green-500/10 text-green-600"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {c.is_published ? "Published" : "Draft"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          c.is_visible
                            ? ""
                            : "border-red-500/30 bg-red-500/10 text-red-500"
                        }
                      >
                        {c.is_visible ? "Visible" : "Hidden"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(c.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild size="icon" variant="ghost" title="Edit">
                        <Link href={`/admin/rituals/${c.id}`}>
                          <Pencil className="size-3.5" />
                        </Link>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          patch(c.id, { is_published: !c.is_published })
                        }
                        title={c.is_published ? "Unpublish" : "Publish"}
                      >
                        <CheckCircle2
                          className={`size-3.5 ${c.is_published ? "text-green-600" : "text-muted-foreground"}`}
                        />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => patch(c.id, { is_visible: !c.is_visible })}
                        title={c.is_visible ? "Hide" : "Show"}
                      >
                        {c.is_visible ? (
                          <Eye className="size-3.5" />
                        ) : (
                          <EyeOff className="size-3.5 text-red-500" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          confirm(`Archive "${c.title}"?`)
                            ? patch(c.id, { archive: true })
                            : null
                        }
                        title="Archive"
                      >
                        <Archive className="size-3.5" />
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

import { VideoViewModal } from "@/components/shared/video-view-modal";

function AssetsTab() {
  const [items, setItems] = useState<RitualAsset[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<RitualAsset | null>(null);
  const [previewAsset, setPreviewAsset] = useState<RitualAsset | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [state, setState] = useState("all");
  const [assetOptions, setAssetOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetch("/api/admin/ritual-assets")
      .then((r) => r.json())
      .then((data: RitualAsset[]) => {
        if (Array.isArray(data)) {
          setAssetOptions(data.map(a => ({ value: a.title, label: a.title })));
        }
      })
      .catch(() => {});
  }, []);

  async function load() {
    setError(null);
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (status !== "all") params.set("status", status);
    if (state !== "all") params.set("state", state);

    const res = await fetch(`/api/admin/ritual-assets?${params.toString()}`);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      setError(e.error ?? "Failed to load assets");
      setItems([]);
      return;
    }
    setItems((await res.json()) as RitualAsset[]);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, status, state]);

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch(`/api/admin/ritual-assets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    void load();
  }

  async function archiveAsset(asset: RitualAsset) {
    if (!confirm(`Archive "${asset.title}"?`)) return;
    await fetch(`/api/admin/ritual-assets/${asset.id}`, { method: "DELETE" });
    void load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Video Asset Library</h2>
          <p className="text-sm text-muted-foreground">
            Upload a video file or paste a direct video URL.
          </p>
        </div>
        <Button
          onClick={() => {
            if (editingAsset) {
              setEditingAsset(null);
              setShowForm(false);
            } else {
              setShowForm((s) => !s);
            }
          }}
        >
          {showForm || editingAsset ? (
            "Cancel"
          ) : (
            <>
              <Plus className="mr-1.5 size-4" />
              New Asset
            </>
          )}
        </Button>
      </div>

      {showForm || editingAsset ? (
        <AssetForm
          initialAsset={editingAsset}
          onCompleted={() => {
            setShowForm(false);
            setEditingAsset(null);
            void load();
          }}
        />
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchableSelect
            options={assetOptions}
            value={search}
            onValueChange={setSearch}
            placeholder="Search by asset title..."
            searchPlaceholder="Type to find asset..."
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={state} onValueChange={setState}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setSearch("");
              setStatus("all");
              setState("all");
            }}
            title="Clear all filters"
          >
            <RotateCw className="size-4" />
          </Button>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4" /> {error}
        </div>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {!items ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              <RotateCw className="mx-auto mb-2 size-4 animate-spin" />
              Loading…
            </p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No assets yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((a) => {
                  const url =
                    a.source_type === "upload" ? a.storage_path : a.external_url;
                  return (
                    <TableRow
                      key={a.id}
                      className={a.archived_at ? "opacity-50" : ""}
                    >
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell>
                        <code className="text-xs">{a.asset_key}</code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="w-fit capitalize">
                            {a.source_type === "upload"
                              ? "Upload"
                              : "External URL"}
                          </Badge>
                          {url ? (
                            <button
                              type="button"
                              onClick={() => setPreviewAsset(a)}
                              className="max-w-[16rem] truncate text-left text-xs text-blue-500 hover:underline"
                              title={url}
                            >
                              {url}
                            </button>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant="outline"
                            className={
                              a.is_active
                                ? "border-green-500/30 bg-green-500/10 text-green-600"
                                : ""
                            }
                          >
                            {a.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              a.is_published
                                ? "border-blue-500/30 bg-blue-500/10 text-blue-600"
                                : ""
                            }
                          >
                            {a.is_published ? "Published" : "Draft"}
                          </Badge>
                          {a.archived_at ? (
                            <Badge variant="outline" className="bg-muted">
                              Archived
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {a.mapping_count ?? 0} mapping(s)
                        <br />
                        {a.final_override_count ?? 0} override(s)
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {url ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setPreviewAsset(a)}
                              title="Preview Video"
                            >
                              <Film className="size-3.5" />
                            </Button>
                          ) : null}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingAsset(a);
                              setShowForm(false);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            title="Edit"
                            disabled={!!a.archived_at}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => patch(a.id, { is_active: !a.is_active })}
                            title={a.is_active ? "Deactivate" : "Activate"}
                          >
                            <Power
                              className={`size-3.5 ${a.is_active ? "text-green-600" : "text-muted-foreground"}`}
                            />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => archiveAsset(a)}
                            title="Archive"
                            disabled={!!a.archived_at}
                          >
                            <Archive className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <VideoViewModal
        isOpen={!!previewAsset}
        onClose={() => setPreviewAsset(null)}
        title={previewAsset?.title ?? ""}
        videoUrl={
          previewAsset
            ? previewAsset.source_type === "upload"
              ? previewAsset.storage_path
              : previewAsset.external_url
            : null
        }
      />
    </div>
  );
}

function AssetForm({
  onCompleted,
  initialAsset,
}: {
  onCompleted: () => void;
  initialAsset?: RitualAsset | null;
}) {
  const [mode, setMode] = useState<"upload" | "external_url">(
    initialAsset?.source_type ?? "external_url"
  );
  const [assetKey, setAssetKey] = useState(initialAsset?.asset_key ?? "");
  const [title, setTitle] = useState(initialAsset?.title ?? "");
  const [externalUrl, setExternalUrl] = useState(initialAsset?.external_url ?? "");
  const [notes, setNotes] = useState(initialAsset?.notes ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (initialAsset) {
      setMode(initialAsset.source_type);
      setAssetKey(initialAsset.asset_key);
      setTitle(initialAsset.title);
      setExternalUrl(initialAsset.external_url ?? "");
      setNotes(initialAsset.notes ?? "");
      setFile(null);
      setErr(null);
    } else {
      setMode("external_url");
      setAssetKey("");
      setTitle("");
      setExternalUrl("");
      setNotes("");
      setFile(null);
      setErr(null);
    }
  }, [initialAsset]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      let storagePath: string | null = initialAsset?.storage_path ?? null;
      if (mode === "upload" && file) {
        const fd = new FormData();
        fd.append("file", file);
        const upRes = await fetch("/api/admin/ritual-assets/upload", {
          method: "POST",
          body: fd,
        });
        const upJson = await upRes.json().catch(() => ({}));
        if (!upRes.ok) {
          setErr(upJson.error ?? "Upload failed");
          setBusy(false);
          return;
        }
        storagePath = upJson.storage_path as string;
      } else if (mode === "external_url") {
        storagePath = null;
      }

      const method = initialAsset ? "PATCH" : "POST";
      const url = initialAsset
        ? `/api/admin/ritual-assets/${initialAsset.id}`
        : "/api/admin/ritual-assets";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_key: assetKey,
          title,
          source_type: mode,
          storage_path: storagePath,
          external_url: mode === "external_url" ? externalUrl : null,
          notes: notes || null,
          is_active: initialAsset ? initialAsset.is_active : true,
          is_published: initialAsset ? initialAsset.is_published : true,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j.error ?? "Failed to save asset");
        setBusy(false);
        return;
      }
      onCompleted();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialAsset ? "Edit Asset" : "New Asset"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-3">
            <Button
              type="button"
              variant={mode === "external_url" ? "default" : "outline"}
              onClick={() => setMode("external_url")}
            >
              External URL
            </Button>
            <Button
              type="button"
              variant={mode === "upload" ? "default" : "outline"}
              onClick={() => setMode("upload")}
            >
              <Upload className="mr-1.5 size-4" /> Upload file
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Asset key (unique)</Label>
              <Input
                value={assetKey}
                onChange={(e) => setAssetKey(e.target.value)}
                placeholder="fire_gate_invocation"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Fire Gate Invocation"
                required
              />
            </div>
          </div>
          {mode === "external_url" ? (
            <div className="space-y-1">
              <Label>Direct video URL</Label>
              <Input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://example.com/video.mp4"
                required
              />
            </div>
          ) : (
            <div className="space-y-1">
              <Label>Video file {initialAsset?.storage_path ? "(optional if keeping current)" : ""}</Label>
              <Input
                type="file"
                accept="video/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required={!initialAsset?.storage_path}
              />
              {initialAsset?.storage_path && !file && (
                <p className="text-xs text-muted-foreground italic">
                  Currently: {initialAsset.storage_path}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Up to 500 MB. mp4 / webm / mov / ogg / avi.
              </p>
            </div>
          )}
          <div className="space-y-1">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          {err ? <p className="text-sm text-red-500">{err}</p> : null}
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : initialAsset ? "Update asset" : "Create asset"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function MappingsTab() {
  const [mappings, setMappings] = useState<AssetMapping[] | null>(null);
  const [definitions, setDefinitions] = useState<RitualDefinition[]>([]);
  const [assets, setAssets] = useState<RitualAsset[]>([]);
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingMapping, setEditingMapping] = useState<AssetMapping | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    setError(null);
    const [m, d, a] = await Promise.all([
      fetch("/api/admin/ritual-asset-mappings").then((r) => r.json()),
      fetch("/api/admin/ritual-configurations").then((r) => r.json()),
      fetch("/api/admin/ritual-assets").then((r) => r.json()),
    ]);
    if (!Array.isArray(m)) {
      setError(m?.error ?? "Failed to load mappings");
      setMappings([]);
      return;
    }
    setMappings(m as AssetMapping[]);
    setDefinitions((d as RitualDefinition[]) ?? []);
    setAssets((a as RitualAsset[]) ?? []);
  }
  useEffect(() => {
    void loadAll();
  }, []);

  const filtered = useMemo(() => {
    if (!mappings) return [];
    if (scopeFilter === "all") return mappings;
    return mappings.filter((m) => m.mapping_scope === scopeFilter);
  }, [mappings, scopeFilter]);

  async function deleteMapping(id: string) {
    if (!confirm("Delete this mapping?")) return;
    await fetch(`/api/admin/ritual-asset-mappings/${id}`, { method: "DELETE" });
    void loadAll();
  }
  async function toggle(m: AssetMapping) {
    await fetch(`/api/admin/ritual-asset-mappings/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !m.is_active }),
    });
    void loadAll();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tag Mappings</h2>
          <p className="text-sm text-muted-foreground">
            Per-ritual mappings override global ones.
          </p>
        </div>
        <Button
          onClick={() => {
            if (editingMapping) {
              setEditingMapping(null);
              setShowForm(false);
            } else {
              setShowForm((s) => !s);
            }
          }}
        >
          {showForm || editingMapping ? (
            "Cancel"
          ) : (
            <>
              <Plus className="mr-1.5 size-4" />
              New Mapping
            </>
          )}
        </Button>
      </div>

      {showForm || editingMapping ? (
        <MappingForm
          definitions={definitions}
          assets={assets}
          initialMapping={editingMapping}
          onCompleted={() => {
            setShowForm(false);
            setEditingMapping(null);
            void loadAll();
          }}
        />
      ) : null}

      <div className="flex items-center gap-2">
        <Filter className="size-4 text-muted-foreground" />
        <Select value={scopeFilter} onValueChange={setScopeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Scope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All scopes</SelectItem>
            <SelectItem value="global">Global only</SelectItem>
            <SelectItem value="ritual_definition">Per-ritual only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4" /> {error}
        </div>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {!mappings ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              <RotateCw className="mx-auto mb-2 size-4 animate-spin" />
              Loading…
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No mappings.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scope</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => {
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {m.mapping_scope === "global"
                            ? "Global"
                            : "Per-ritual"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{m.tag_key}</code>
                      </TableCell>
                      <TableCell>
                        {m.asset?.title ?? (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
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
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingMapping(m);
                              setShowForm(false);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            title="Edit"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => toggle(m)}
                            title={m.is_active ? "Deactivate" : "Activate"}
                          >
                            <Power
                              className={`size-3.5 ${m.is_active ? "text-green-600" : "text-muted-foreground"}`}
                            />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteMapping(m.id)}
                            title="Delete"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MappingForm({
  definitions,
  assets,
  onCompleted,
  initialMapping,
}: {
  definitions: RitualDefinition[];
  assets: RitualAsset[];
  onCompleted: () => void;
  initialMapping?: AssetMapping | null;
}) {
  const [scope, setScope] = useState<"global" | "ritual_definition">(
    initialMapping?.mapping_scope ?? "global"
  );
  const [definitionId, setDefinitionId] = useState<string>(
    initialMapping?.ritual_definition_id ?? ""
  );
  const [tagKey, setTagKey] = useState(initialMapping?.tag_key ?? "");
  const [assetId, setAssetId] = useState<string>(initialMapping?.asset_id ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (initialMapping) {
      setScope(initialMapping.mapping_scope);
      setDefinitionId(initialMapping.ritual_definition_id ?? "");
      setTagKey(initialMapping.tag_key ?? "");
      setAssetId(initialMapping.asset_id);
    } else {
      setScope("global");
      setDefinitionId("");
      setTagKey("");
      setAssetId("");
    }
  }, [initialMapping]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);

    const method = initialMapping ? "PATCH" : "POST";
    const url = initialMapping
      ? `/api/admin/ritual-asset-mappings/${initialMapping.id}`
      : "/api/admin/ritual-asset-mappings";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mapping_scope: scope,
        tag_key: tagKey,
        asset_id: assetId,
        ritual_definition_id:
          scope === "ritual_definition" ? definitionId : null,
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(j.error ?? `Failed to ${initialMapping ? "update" : "create"} mapping`);
      setBusy(false);
      return;
    }
    onCompleted();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialMapping ? "Edit Mapping" : "New Mapping"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-end">
            <div className="space-y-1">
              <Label>Scope</Label>
              <Select
                value={scope}
                onValueChange={(v) =>
                  setScope(v as "global" | "ritual_definition")
                }
                disabled={!!initialMapping}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="ritual_definition">Per-ritual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scope === "ritual_definition" ? (
              <div className="space-y-1">
                <Label>Ritual configuration</Label>
                <Select
                  value={definitionId}
                  onValueChange={setDefinitionId}
                  disabled={!!initialMapping}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {definitions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="space-y-1">
              <Label>Tag</Label>
              <Input
                value={tagKey}
                onChange={(e) => setTagKey(e.target.value)}
                placeholder="Fire_Gate_Invocation_Ritual"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Asset</Label>
              <Select value={assetId} onValueChange={setAssetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2 sm:pt-0">
              <Button type="submit" className="w-full" disabled={busy || !assetId || !tagKey}>
                {busy
                  ? "Saving…"
                  : initialMapping
                    ? "Update mapping"
                    : "Create mapping"}
              </Button>
            </div>
          </div>
          {err ? <p className="mt-2 text-sm text-red-500">{err}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

function PlaybackSettingsTab() {
  const [settings, setSettings] = useState<{
    video_loop: boolean;
    video_autoplay: boolean;
    video_controls: boolean;
    video_muted: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/ritual-settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  async function save(updates: Partial<typeof settings>) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ritual-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      const data = await res.json();
      setSettings(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
  if (!settings) return <div className="p-8 text-center text-destructive">Error loading settings</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5 text-amber-500" />
            Global Video Playback Settings
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            These settings apply to all ritual videos platform-wide, including the Perennial Mandalism ritual.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
            <div className="space-y-0.5">
              <Label className="text-base">Auto Play</Label>
              <p className="text-sm text-muted-foreground">
                Videos will start playing automatically when loaded.
              </p>
            </div>
            <Switch
              checked={settings.video_autoplay}
              onCheckedChange={(v) => save({ video_autoplay: v })}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
            <div className="space-y-0.5">
              <Label className="text-base">Loop</Label>
              <p className="text-sm text-muted-foreground">
                Videos will restart from the beginning once they end.
              </p>
            </div>
            <Switch
              checked={settings.video_loop}
              onCheckedChange={(v) => save({ video_loop: v })}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
            <div className="space-y-0.5">
              <Label className="text-base">Show Controls</Label>
              <p className="text-sm text-muted-foreground">
                Enable native video player controls (Play/Pause, Volume, etc.).
              </p>
            </div>
            <Switch
              checked={settings.video_controls}
              onCheckedChange={(v) => save({ video_controls: v })}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
            <div className="space-y-0.5">
              <Label className="text-base">Start Muted</Label>
              <p className="text-sm text-muted-foreground">
                Videos will be muted by default when they start.
              </p>
            </div>
            <Switch
              checked={settings.video_muted}
              onCheckedChange={(v) => save({ video_muted: v })}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
