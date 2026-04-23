"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type {
  DashboardAudienceScope,
  DashboardContentCategory,
  DashboardContentItemRow,
  DashboardContentMode,
  DashboardContentPayload,
  DashboardContentSourceOption,
  DashboardPublicationState,
} from "@/lib/dashboard-content";

const CATEGORY_OPTIONS: Array<{ value: DashboardContentCategory; label: string }> = [
  { value: "blog", label: "Blog" },
  { value: "announcement", label: "Announcement" },
  { value: "calendar_event", label: "Calendar Event" },
  { value: "system_video", label: "System Video" },
  { value: "youtube_video", label: "YouTube Video" },
  { value: "document", label: "Document" },
];

const AUDIENCE_OPTIONS: Array<{ value: DashboardAudienceScope; label: string }> = [
  { value: "perennial_mandalism", label: "Perennial Mandalism" },
  { value: "all_members", label: "All Members" },
  { value: "mystery_school", label: "Mystery School" },
];

const STATE_OPTIONS: Array<{ value: DashboardPublicationState; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

type FormState = {
  category: DashboardContentCategory;
  item_mode: DashboardContentMode;
  title: string;
  description: string;
  thumbnail_url: string;
  cta_label: string;
  cta_url: string;
  source_key: string;
  publish_at: string;
  expire_at: string;
  is_active: boolean;
  is_pinned: boolean;
  manual_sort_weight: number;
  audience_scope: DashboardAudienceScope;
  publication_state: DashboardPublicationState;
};

const EMPTY_FORM: FormState = {
  category: "announcement",
  item_mode: "native",
  title: "",
  description: "",
  thumbnail_url: "",
  cta_label: "",
  cta_url: "",
  source_key: "",
  publish_at: new Date().toISOString().slice(0, 16),
  expire_at: "",
  is_active: true,
  is_pinned: false,
  manual_sort_weight: 0,
  audience_scope: "perennial_mandalism",
  publication_state: "draft",
};

function categoryLabel(value: DashboardContentCategory) {
  return CATEGORY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DashboardContentClient({
  initialItems,
  sourceOptions,
}: {
  initialItems: DashboardContentItemRow[];
  sourceOptions: DashboardContentSourceOption[];
}) {
  const [items, setItems] = useState(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteItem, setDeleteItem] = useState<DashboardContentItemRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const availableSources = useMemo(() => {
    return sourceOptions.filter((option) => option.category === form.category);
  }, [form.category, sourceOptions]);

  function resetForm() {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      publish_at: new Date().toISOString().slice(0, 16),
    });
  }

  function loadFormFromItem(item: DashboardContentItemRow) {
    const sourceKey =
      item.source_table && item.source_id ? `${item.source_table}:${item.source_id}` : "";
    setEditingId(item.id);
    setForm({
      category: item.category,
      item_mode: item.item_mode,
      title: item.title,
      description: item.description ?? "",
      thumbnail_url: item.thumbnail_url ?? "",
      cta_label: item.cta_label ?? "",
      cta_url: item.cta_url ?? "",
      source_key: sourceKey,
      publish_at: item.publish_at.slice(0, 16),
      expire_at: item.expire_at ? item.expire_at.slice(0, 16) : "",
      is_active: item.is_active,
      is_pinned: item.is_pinned,
      manual_sort_weight: item.manual_sort_weight,
      audience_scope: item.audience_scope,
      publication_state: item.publication_state === "expired" ? "published" : item.publication_state,
    });
  }

  function buildPayload(): DashboardContentPayload {
    const [source_table, source_id] = form.source_key.split(":");

    return {
      category: form.category,
      item_mode: form.item_mode,
      title: form.title,
      description: form.description,
      thumbnail_url: form.thumbnail_url,
      cta_label: form.cta_label,
      cta_url: form.cta_url,
      source_table: form.item_mode === "source_linked" ? (source_table as DashboardContentPayload["source_table"]) : null,
      source_id: form.item_mode === "source_linked" ? source_id : null,
      publish_at: form.publish_at ? new Date(form.publish_at).toISOString() : null,
      expire_at: form.expire_at ? new Date(form.expire_at).toISOString() : null,
      is_active: form.is_active,
      is_pinned: form.is_pinned,
      manual_sort_weight: Number(form.manual_sort_weight) || 0,
      audience_scope: form.audience_scope,
      publication_state: form.publication_state,
      metadata: form.category === "youtube_video" ? { youtube_url: form.cta_url } : {},
    };
  }

  async function refreshItems() {
    const res = await fetch("/api/admin/dashboard-content", { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Failed to refresh dashboard content");
    }
    const data = (await res.json()) as { items: DashboardContentItemRow[] };
    setItems(data.items);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(
        editingId ? `/api/admin/dashboard-content/${editingId}` : "/api/admin/dashboard-content",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload()),
        },
      );

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Save failed");
      }

      await refreshItems();
      resetForm();
      toast.success(editingId ? "Dashboard item updated" : "Dashboard item created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/dashboard-content/${deleteItem.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Delete failed");
      }

      setItems((current) => current.filter((item) => item.id !== deleteItem.id));
      if (editingId === deleteItem.id) {
        resetForm();
      }
      setDeleteItem(null);
      toast.success("Dashboard item deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  function onCategoryChange(category: DashboardContentCategory) {
    const item_mode: DashboardContentMode =
      category === "announcement" || category === "youtube_video"
        ? "native"
        : "source_linked";
    setForm((current) => ({
      ...current,
      category,
      item_mode,
      source_key: "",
    }));
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Perennial Dashboard Publishing</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Schedule dashboard cards for blogs, announcements, events, videos, YouTube, and documents.
            </p>
          </div>
          <Button variant="outline" onClick={resetForm}>
            New Item
          </Button>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="dashboard-category">Category</Label>
                <select
                  id="dashboard-category"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={form.category}
                  onChange={(event) => onCategoryChange(event.target.value as DashboardContentCategory)}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dashboard-mode">Mode</Label>
                <Input
                  id="dashboard-mode"
                  value={form.item_mode === "native" ? "Native" : "Source-linked"}
                  readOnly
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dashboard-audience">Audience</Label>
                <select
                  id="dashboard-audience"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={form.audience_scope}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      audience_scope: event.target.value as DashboardAudienceScope,
                    }))
                  }
                >
                  {AUDIENCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dashboard-state">Publication State</Label>
                <select
                  id="dashboard-state"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={form.publication_state}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      publication_state: event.target.value as DashboardPublicationState,
                    }))
                  }
                >
                  {STATE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dashboard-title">Title</Label>
                <Input
                  id="dashboard-title"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  required
                />
              </div>
              {form.item_mode === "source_linked" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="dashboard-source">Source Record</Label>
                  <select
                    id="dashboard-source"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={form.source_key}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, source_key: event.target.value }))
                    }
                    required
                  >
                    <option value="">Select a source record</option>
                    {availableSources.map((option) => (
                      <option
                        key={`${option.sourceTable}:${option.id}`}
                        value={`${option.sourceTable}:${option.id}`}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="dashboard-cta-url">CTA URL</Label>
                  <Input
                    id="dashboard-cta-url"
                    value={form.cta_url}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, cta_url: event.target.value }))
                    }
                    placeholder={form.category === "youtube_video" ? "https://www.youtube.com/watch?v=..." : "/community"}
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dashboard-description">Description</Label>
              <Textarea
                id="dashboard-description"
                rows={3}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="dashboard-thumbnail">Thumbnail URL</Label>
                <Input
                  id="dashboard-thumbnail"
                  value={form.thumbnail_url}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, thumbnail_url: event.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dashboard-cta-label">CTA Label</Label>
                <Input
                  id="dashboard-cta-label"
                  value={form.cta_label}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, cta_label: event.target.value }))
                  }
                  placeholder="Read Article"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dashboard-publish-at">Publish At</Label>
                <Input
                  id="dashboard-publish-at"
                  type="datetime-local"
                  value={form.publish_at}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, publish_at: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dashboard-expire-at">Expire At</Label>
                <Input
                  id="dashboard-expire-at"
                  type="datetime-local"
                  value={form.expire_at}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, expire_at: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="dashboard-sort-weight">Manual Sort Weight</Label>
                <Input
                  id="dashboard-sort-weight"
                  type="number"
                  value={form.manual_sort_weight}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      manual_sort_weight: Number(event.target.value) || 0,
                    }))
                  }
                />
              </div>
              <label className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                Active
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({ ...current, is_active: checked }))
                  }
                />
              </label>
              <label className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                Pinned
                <Switch
                  checked={form.is_pinned}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({ ...current, is_pinned: checked }))
                  }
                />
              </label>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Item" : "Create Item"}
              </Button>
              {editingId ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel Edit
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <ConfirmDialog
            open={!!deleteItem}
            title="Delete Dashboard Item"
            description="Are you sure you want to delete this dashboard item?"
            confirmLabel="Delete"
            loading={deleting}
            variant="destructive"
            onOpenChange={(open) => {
              if (!open && !deleting) setDeleteItem(null);
            }}
            onConfirm={handleDelete}
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Publish</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="align-top">
                    <div className="space-y-1">
                      <div className="font-medium">{item.title}</div>
                      {item.description ? (
                        <div className="line-clamp-2 text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant="secondary">{categoryLabel(item.category)}</Badge>
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant="outline">{item.publication_state}</Badge>
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    <div>{formatDateTime(item.publish_at)}</div>
                    <div>{item.expire_at ? `Until ${formatDateTime(item.expire_at)}` : "No expiry"}</div>
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {item.audience_scope}
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex flex-wrap gap-2">
                      {item.is_active ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                      {item.is_pinned ? <Badge variant="outline">Pinned</Badge> : null}
                      <Badge variant="outline">{item.item_mode}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right align-top">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => loadFormFromItem(item)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteItem(item)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
