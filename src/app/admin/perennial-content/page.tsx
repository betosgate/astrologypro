"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";

const CONTENT_TYPES = ["text", "image", "video", "pdf", "youtube", "live_stream", "announcement"];
const STATUS_OPTIONS = ["draft", "active", "inactive"];

type PerennialContent = {
  id: string;
  title: string;
  content_type: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  pdf_url: string | null;
  youtube_url: string | null;
  live_stream_url: string | null;
  display_start_at: string | null;
  display_end_at: string | null;
  available_for_all: boolean;
  status: string;
  priority: number;
  created_at: string;
  updated_at: string;
};

type FormState = {
  title: string;
  content_type: string;
  description: string;
  image_url: string;
  video_url: string;
  pdf_url: string;
  youtube_url: string;
  live_stream_url: string;
  display_start_at: string;
  display_end_at: string;
  available_for_all: boolean;
  priority: number;
  status: string;
};

const EMPTY_FORM: FormState = {
  title: "", content_type: "text", description: "",
  image_url: "", video_url: "", pdf_url: "", youtube_url: "", live_stream_url: "",
  display_start_at: "", display_end_at: "", available_for_all: false, priority: 0, status: "draft",
};

export default function AdminPerennialContentPage() {
  const [items, setItems] = useState<PerennialContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<PerennialContent | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterContentType, setFilterContentType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterContentType) params.set("content_type", filterContentType);
    if (filterStatus) params.set("status", filterStatus);
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);
    const res = await fetch(`/api/admin/perennial-content?${params}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [filterContentType, filterStatus, filterFrom, filterTo]); // eslint-disable-line react-hooks/exhaustive-deps

  function F(field: keyof Pick<FormState, "title" | "content_type" | "description" | "image_url" | "video_url" | "pdf_url" | "youtube_url" | "live_stream_url" | "display_start_at" | "display_end_at" | "status">) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const url = editId ? `/api/admin/perennial-content/${editId}` : "/api/admin/perennial-content";
    const res = await fetch(url, {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        description: form.description || null,
        image_url: form.image_url || null,
        video_url: form.video_url || null,
        pdf_url: form.pdf_url || null,
        youtube_url: form.youtube_url || null,
        live_stream_url: form.live_stream_url || null,
        display_start_at: form.display_start_at || null,
        display_end_at: form.display_end_at || null,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed");
    } else {
      await load();
      setShowForm(false);
      setEditId(null);
      setForm({ ...EMPTY_FORM });
    }
    setSaving(false);
  }

  async function openEdit(id: string) {
    const res = await fetch(`/api/admin/perennial-content/${id}`);
    if (!res.ok) return;
    const item = await res.json();
    setEditId(id);
    setForm({
      title: item.title,
      content_type: item.content_type ?? "text",
      description: item.description ?? "",
      image_url: item.image_url ?? "",
      video_url: item.video_url ?? "",
      pdf_url: item.pdf_url ?? "",
      youtube_url: item.youtube_url ?? "",
      live_stream_url: item.live_stream_url ?? "",
      display_start_at: item.display_start_at ? item.display_start_at.slice(0, 16) : "",
      display_end_at: item.display_end_at ? item.display_end_at.slice(0, 16) : "",
      available_for_all: !!item.available_for_all,
      priority: item.priority ?? 0,
      status: item.status ?? "draft",
    });
    setPreviewItem(null);
    setShowForm(true);
  }

  async function openPreview(id: string) {
    const res = await fetch(`/api/admin/perennial-content/${id}`);
    if (!res.ok) return;
    setPreviewItem(await res.json());
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this perennial content?")) return;
    await fetch(`/api/admin/perennial-content/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((c) => c.id !== id));
    if (previewItem?.id === id) setPreviewItem(null);
  }

  // Determine which URL field to show based on content_type
  const showImage = form.content_type === "image";
  const showVideo = form.content_type === "video";
  const showPdf = form.content_type === "pdf";
  const showYoutube = form.content_type === "youtube";
  const showLiveStream = form.content_type === "live_stream";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Perennial Content</h1>
          <p className="text-muted-foreground">{items.length} items</p>
        </div>
        <Button size="sm" onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); setPreviewItem(null); setShowForm(true); }}>
          <Plus className="mr-1.5 size-4" /> New Content
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          value={filterContentType}
          onChange={(e) => setFilterContentType(e.target.value)}
        >
          <option value="">All types</option>
          {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="w-40" />
        <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="w-40" />
        {(filterContentType || filterStatus || filterFrom || filterTo) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterContentType(""); setFilterStatus(""); setFilterFrom(""); setFilterTo(""); }}>
            Clear
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editId ? "Edit Perennial Content" : "New Perennial Content"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={F("title")} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Content Type</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={form.content_type}
                    onChange={F("content_type")}
                  >
                    {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={form.status}
                    onChange={F("status")}
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={F("description")} rows={3} />
                </div>

                {/* Conditional URL fields */}
                {showImage && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Image URL</Label>
                    <Input value={form.image_url} onChange={F("image_url")} placeholder="https://…" />
                  </div>
                )}
                {showVideo && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Video URL</Label>
                    <Input value={form.video_url} onChange={F("video_url")} placeholder="https://…" />
                  </div>
                )}
                {showPdf && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>PDF URL</Label>
                    <Input value={form.pdf_url} onChange={F("pdf_url")} placeholder="https://…" />
                  </div>
                )}
                {showYoutube && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>YouTube URL</Label>
                    <Input value={form.youtube_url} onChange={F("youtube_url")} placeholder="https://youtu.be/…" />
                  </div>
                )}
                {showLiveStream && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Live Stream URL</Label>
                    <Input value={form.live_stream_url} onChange={F("live_stream_url")} placeholder="https://…" />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Display Start</Label>
                  <Input type="datetime-local" value={form.display_start_at} onChange={F("display_start_at")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Display End</Label>
                  <Input type="datetime-local" value={form.display_end_at} onChange={F("display_end_at")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Input type="number" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))} />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    checked={form.available_for_all}
                    onChange={(e) => setForm((f) => ({ ...f, available_for_all: e.target.checked }))}
                    className="size-4"
                  />
                  <Label>Available for All</Label>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={saving}>{saving ? "Saving…" : editId ? "Update" : "Create"}</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {previewItem && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base">Preview: {previewItem.title}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setPreviewItem(null)}>Close</Button>
            </div>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary">{previewItem.content_type}</Badge>
              <Badge variant="outline">{previewItem.status}</Badge>
              {previewItem.available_for_all && <Badge variant="default">Available for All</Badge>}
            </div>
            {previewItem.description && <div><span className="font-medium">Description: </span>{previewItem.description}</div>}
            {previewItem.display_start_at && <div><span className="font-medium">Display Start: </span>{new Date(previewItem.display_start_at).toLocaleString()}</div>}
            {previewItem.display_end_at && <div><span className="font-medium">Display End: </span>{new Date(previewItem.display_end_at).toLocaleString()}</div>}
            {previewItem.image_url && <div><span className="font-medium">Image: </span><a href={previewItem.image_url} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">{previewItem.image_url}</a></div>}
            {previewItem.video_url && <div><span className="font-medium">Video: </span><a href={previewItem.video_url} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">{previewItem.video_url}</a></div>}
            {previewItem.pdf_url && <div><span className="font-medium">PDF: </span><a href={previewItem.pdf_url} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">{previewItem.pdf_url}</a></div>}
            {previewItem.youtube_url && <div><span className="font-medium">YouTube: </span><a href={previewItem.youtube_url} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">{previewItem.youtube_url}</a></div>}
            {previewItem.live_stream_url && <div><span className="font-medium">Live Stream: </span><a href={previewItem.live_stream_url} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">{previewItem.live_stream_url}</a></div>}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No perennial content found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{item.title}</span>
                      <Badge variant="secondary">{item.content_type}</Badge>
                      <Badge variant="outline">{item.status}</Badge>
                      <span className="text-xs text-muted-foreground">Priority: {item.priority}</span>
                    </div>
                    {item.display_start_at && (
                      <p className="text-xs text-muted-foreground">Displays from: {new Date(item.display_start_at).toLocaleString()}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Created {new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => openPreview(item.id)}><Eye className="size-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(item.id)}><Pencil className="size-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
