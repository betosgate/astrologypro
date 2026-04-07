"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Video,
  Headphones,
  FileText,
  Link as LinkIcon,
  Image,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type MediaType = "video" | "audio" | "article" | "link" | "image";
type Platform = "youtube" | "spotify" | "apple_podcasts" | "instagram" | "tiktok" | "other";

interface Diviner {
  id: string;
  username: string;
  display_name: string;
}

interface DivinerRef {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface MediaItem {
  id: string;
  diviner_id: string;
  type: MediaType;
  url: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string | null;
  platform: string | null;
  duration_seconds: number | null;
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  diviner: DivinerRef | null;
}

interface MediaItemsClientProps {
  diviners: Diviner[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: Array<{ value: MediaType; label: string }> = [
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "article", label: "Article" },
  { value: "link", label: "Link" },
  { value: "image", label: "Image" },
];

const PLATFORM_OPTIONS: Array<{ value: Platform; label: string }> = [
  { value: "youtube", label: "YouTube" },
  { value: "spotify", label: "Spotify" },
  { value: "apple_podcasts", label: "Apple Podcasts" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "other", label: "Other" },
];

const TYPE_BADGE_CLASSES: Record<MediaType, string> = {
  video: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  audio: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  article: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  link: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  image: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

function TypeIcon({ type }: { type: MediaType }) {
  const cls = "size-3.5";
  switch (type) {
    case "video": return <Video className={cls} />;
    case "audio": return <Headphones className={cls} />;
    case "article": return <FileText className={cls} />;
    case "link": return <LinkIcon className={cls} />;
    case "image": return <Image className={cls} />;
  }
}

// ─── Duration helpers ─────────────────────────────────────────────────────────

function secondsToMmss(seconds: number | null): string {
  if (seconds == null) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function mmssToSeconds(value: string): number | null {
  const match = value.match(/^(\d+):(\d{1,2})$/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

// ─── Add/Edit Form ────────────────────────────────────────────────────────────

interface MediaFormData {
  diviner_id: string;
  type: MediaType | "";
  url: string;
  title: string;
  description: string;
  thumbnail_url: string;
  category: string;
  platform: Platform | "";
  duration: string; // MM:SS format
  sort_order: number;
  is_featured: boolean;
}

const EMPTY_FORM: MediaFormData = {
  diviner_id: "",
  type: "",
  url: "",
  title: "",
  description: "",
  thumbnail_url: "",
  category: "",
  platform: "",
  duration: "",
  sort_order: 0,
  is_featured: false,
};

interface MediaFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  diviners: Diviner[];
  editItem?: MediaItem | null;
}

function MediaForm({ open, onClose, onSaved, diviners, editItem }: MediaFormProps) {
  const isEdit = !!editItem;
  const [form, setForm] = useState<MediaFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when editItem changes
  useEffect(() => {
    if (editItem) {
      setForm({
        diviner_id: editItem.diviner_id,
        type: editItem.type,
        url: editItem.url,
        title: editItem.title,
        description: editItem.description ?? "",
        thumbnail_url: editItem.thumbnail_url ?? "",
        category: editItem.category ?? "",
        platform: (editItem.platform as Platform) ?? "",
        duration: secondsToMmss(editItem.duration_seconds),
        sort_order: editItem.sort_order,
        is_featured: editItem.is_featured,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError(null);
  }, [editItem, open]);

  function set<K extends keyof MediaFormData>(key: K, val: MediaFormData[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.type) { setError("Type is required"); return; }
    if (!form.url.trim()) { setError("URL is required"); return; }
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!isEdit && !form.diviner_id) { setError("Diviner is required"); return; }

    const duration_seconds = form.duration ? mmssToSeconds(form.duration) : null;

    const payload: Record<string, unknown> = {
      type: form.type,
      url: form.url.trim(),
      title: form.title.trim(),
      description: form.description.trim() || null,
      thumbnail_url: form.thumbnail_url.trim() || null,
      category: form.category.trim() || null,
      platform: form.platform || null,
      duration_seconds,
      sort_order: form.sort_order,
      is_featured: form.is_featured,
    };
    if (!isEdit) {
      payload.diviner_id = form.diviner_id;
    }

    setSaving(true);
    try {
      const res = isEdit
        ? await fetch(`/api/admin/media-items/${editItem!.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/media-items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.title ?? data.error ?? "Failed to save");
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Media Item" : "Add Media Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Diviner (only on create) */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="mi-diviner">Diviner *</Label>
              <Select value={form.diviner_id} onValueChange={(v) => set("diviner_id", v)}>
                <SelectTrigger id="mi-diviner">
                  <SelectValue placeholder="Select diviner" />
                </SelectTrigger>
                <SelectContent>
                  {diviners.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.display_name} (@{d.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* URL */}
          <div className="space-y-1.5">
            <Label htmlFor="mi-url">URL *</Label>
            <Input
              id="mi-url"
              type="url"
              placeholder="https://..."
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              required
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label htmlFor="mi-type">Type *</Label>
            <Select value={form.type} onValueChange={(v) => set("type", v as MediaType)}>
              <SelectTrigger id="mi-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="mi-title">Title *</Label>
            <Input
              id="mi-title"
              placeholder="Media title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="mi-desc">Description</Label>
            <Textarea
              id="mi-desc"
              placeholder="Optional description..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
            />
          </div>

          {/* Thumbnail URL */}
          <div className="space-y-1.5">
            <Label htmlFor="mi-thumb">Thumbnail URL</Label>
            <Input
              id="mi-thumb"
              type="url"
              placeholder="https://..."
              value={form.thumbnail_url}
              onChange={(e) => set("thumbnail_url", e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="mi-cat">Category</Label>
            <Input
              id="mi-cat"
              placeholder="e.g. astrology, tarot, general"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            />
          </div>

          {/* Platform */}
          <div className="space-y-1.5">
            <Label htmlFor="mi-platform">Platform</Label>
            <Select
              value={form.platform || "none"}
              onValueChange={(v) => set("platform", v === "none" ? "" : v as Platform)}
            >
              <SelectTrigger id="mi-platform">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {PLATFORM_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration (only for video/audio) */}
          {(form.type === "video" || form.type === "audio") && (
            <div className="space-y-1.5">
              <Label htmlFor="mi-dur">Duration (MM:SS)</Label>
              <Input
                id="mi-dur"
                placeholder="e.g. 32:15"
                value={form.duration}
                onChange={(e) => set("duration", e.target.value)}
                pattern="^\d+:[0-5]\d$"
              />
            </div>
          )}

          {/* Sort order */}
          <div className="space-y-1.5">
            <Label htmlFor="mi-sort">Sort Order</Label>
            <Input
              id="mi-sort"
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(e) => set("sort_order", parseInt(e.target.value, 10) || 0)}
            />
          </div>

          {/* Featured toggle */}
          <div className="flex items-center gap-3">
            <Switch
              id="mi-featured"
              checked={form.is_featured}
              onCheckedChange={(v) => set("is_featured", v)}
            />
            <Label htmlFor="mi-featured" className="cursor-pointer">Featured</Label>
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Media"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Inline sort order edit cell ──────────────────────────────────────────────

function SortOrderCell({
  item,
  onSaved,
}: {
  item: MediaItem;
  onSaved: (id: string, val: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(item.sort_order));
  const [saving, setSaving] = useState(false);

  async function save() {
    const num = parseInt(val, 10);
    if (isNaN(num) || num === item.sort_order) { setEditing(false); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/media-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: num }),
      });
      if (res.ok) onSaved(item.id, num);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <Input
        type="number"
        min={0}
        value={val}
        autoFocus
        className="h-7 w-20 text-xs"
        onChange={(e) => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
        aria-label="Edit sort order"
        disabled={saving}
      />
    );
  }

  return (
    <button
      className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      onClick={() => { setVal(String(item.sort_order)); setEditing(true); }}
      aria-label={`Sort order ${item.sort_order}, click to edit`}
    >
      {item.sort_order}
    </button>
  );
}

// ─── Toggle switch cell ───────────────────────────────────────────────────────

function ToggleCell({
  item,
  field,
  label,
  onToggled,
}: {
  item: MediaItem;
  field: "is_featured" | "is_active";
  label: string;
  onToggled: (id: string, field: "is_featured" | "is_active", val: boolean) => void;
}) {
  const [saving, setSaving] = useState(false);
  const checked = item[field];

  async function toggle() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/media-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !checked }),
      });
      if (res.ok) onToggled(item.id, field, !checked);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Switch
      checked={checked}
      onCheckedChange={toggle}
      disabled={saving}
      aria-label={label}
    />
  );
}

// ─── Main client component ────────────────────────────────────────────────────

const TYPE_TABS = [
  { value: "all", label: "All" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "article", label: "Article" },
  { value: "link", label: "Link" },
  { value: "image", label: "Image" },
] as const;

type TabValue = "all" | MediaType;

export function MediaItemsClient({ diviners }: MediaItemsClientProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeTab, setTypeTab] = useState<TabValue>("all");
  const [divinerFilter, setDivinerFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<MediaItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams({ limit: "100" });
      if (divinerFilter !== "all") sp.set("diviner_id", divinerFilter);
      if (typeTab !== "all") sp.set("type", typeTab);
      const res = await fetch(`/api/admin/media-items?${sp.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [divinerFilter, typeTab]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  function handleSortOrderSaved(id: string, val: number) {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, sort_order: val } : it));
  }

  function handleToggled(id: string, field: "is_featured" | "is_active", val: boolean) {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, [field]: val } : it));
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/media-items/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } finally {
      setDeleting(false);
    }
  }

  function openAdd() {
    setEditItem(null);
    setModalOpen(true);
  }

  function openEdit(item: MediaItem) {
    setEditItem(item);
    setModalOpen(true);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Media Items</h1>
          <p className="text-sm text-muted-foreground">
            Manage videos, audio, articles, and links for each diviner.
          </p>
        </div>
        <Button onClick={openAdd} size="sm" className="gap-1.5">
          <Plus className="size-4" />
          Add Media
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Diviner filter */}
        <Select value={divinerFilter} onValueChange={setDivinerFilter}>
          <SelectTrigger className="w-52" aria-label="Filter by diviner">
            <SelectValue placeholder="All diviners" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All diviners</SelectItem>
            {diviners.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.display_name} (@{d.username})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type tabs */}
        <div
          className="flex flex-wrap gap-1"
          role="tablist"
          aria-label="Filter by media type"
        >
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              role="tab"
              aria-selected={typeTab === tab.value}
              onClick={() => setTypeTab(tab.value as TabValue)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                typeTab === tab.value
                  ? "bg-amber-500/15 text-amber-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-muted-foreground">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 shrink-0">Thumb</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-28">Type</TableHead>
              <TableHead className="w-32">Platform</TableHead>
              <TableHead className="w-36">Diviner</TableHead>
              <TableHead className="w-20 text-center">Featured</TableHead>
              <TableHead className="w-20 text-center">Active</TableHead>
              <TableHead className="w-24">Sort</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No media items found.
                </TableCell>
              </TableRow>
            )}
            {!loading && items.map((item) => (
              <TableRow key={item.id}>
                {/* Thumbnail */}
                <TableCell>
                  <div className="size-10 rounded overflow-hidden bg-muted shrink-0">
                    {item.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnail_url}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center text-muted-foreground">
                        <TypeIcon type={item.type} />
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Title */}
                <TableCell>
                  <div className="flex items-start gap-2 max-w-xs">
                    <div>
                      <p className="text-sm font-medium line-clamp-2 leading-snug">
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label="Open media URL in new tab"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                </TableCell>

                {/* Type badge */}
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`gap-1 text-[11px] ${TYPE_BADGE_CLASSES[item.type]}`}
                  >
                    <TypeIcon type={item.type} />
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </Badge>
                </TableCell>

                {/* Platform */}
                <TableCell className="text-sm text-muted-foreground">
                  {item.platform
                    ? PLATFORM_OPTIONS.find((p) => p.value === item.platform)?.label ?? item.platform
                    : "—"}
                </TableCell>

                {/* Diviner */}
                <TableCell>
                  {item.diviner ? (
                    <div className="text-sm">
                      <p className="font-medium">{item.diviner.display_name}</p>
                      <p className="text-xs text-muted-foreground">@{item.diviner.username}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Featured toggle */}
                <TableCell className="text-center">
                  <ToggleCell
                    item={item}
                    field="is_featured"
                    label={`Toggle featured for ${item.title}`}
                    onToggled={handleToggled}
                  />
                </TableCell>

                {/* Active toggle */}
                <TableCell className="text-center">
                  <ToggleCell
                    item={item}
                    field="is_active"
                    label={`Toggle active for ${item.title}`}
                    onToggled={handleToggled}
                  />
                </TableCell>

                {/* Sort order */}
                <TableCell>
                  <SortOrderCell item={item} onSaved={handleSortOrderSaved} />
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => openEdit(item)}
                      aria-label={`Edit ${item.title}`}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => setDeleteTarget(item)}
                      aria-label={`Delete ${item.title}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit modal */}
      <MediaForm
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        onSaved={fetchItems}
        diviners={diviners}
        editItem={editItem}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete media item?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.title}&rdquo; will be hidden from the public profile (soft delete).
              You can re-activate it by toggling &ldquo;Active&rdquo; in the table.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
