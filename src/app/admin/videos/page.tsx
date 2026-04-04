"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";

type VideoItem = {
  video_type: "youtube" | "file";
  youtube_link: string;
  youtube_title: string;
  video_title: string;
};

type Video = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: number;
  videos: VideoItem[];
  updated_at: string;
  created_at: string;
};

type FormState = {
  title: string;
  description: string;
  priority: number;
  status: string;
  videos: VideoItem[];
};

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  priority: 0,
  status: "draft",
  videos: [],
};

const EMPTY_VIDEO_ITEM: VideoItem = {
  video_type: "youtube",
  youtube_link: "",
  youtube_title: "",
  video_title: "",
};

export default function AdminVideosPage() {
  const [items, setItems] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<Video | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterStatus) params.set("status", filterStatus);
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);
    const res = await fetch(`/api/admin/videos?${params}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [search, filterStatus, filterFrom, filterTo]); // eslint-disable-line react-hooks/exhaustive-deps

  function F(field: keyof Pick<FormState, "title" | "description" | "status">) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function updateVideoItem(index: number, field: keyof VideoItem, value: string) {
    setForm((f) => {
      const videos = [...f.videos];
      videos[index] = { ...videos[index], [field]: value };
      return { ...f, videos };
    });
  }

  function addVideoItem() {
    setForm((f) => ({ ...f, videos: [...f.videos, { ...EMPTY_VIDEO_ITEM }] }));
  }

  function removeVideoItem(index: number) {
    setForm((f) => ({ ...f, videos: f.videos.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const url = editId ? `/api/admin/videos/${editId}` : "/api/admin/videos";
    const res = await fetch(url, {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
    const res = await fetch(`/api/admin/videos/${id}`);
    if (!res.ok) return;
    const item = await res.json();
    setEditId(id);
    setForm({
      title: item.title,
      description: item.description ?? "",
      priority: item.priority ?? 0,
      status: item.status ?? "draft",
      videos: item.videos ?? [],
    });
    setPreviewItem(null);
    setShowForm(true);
  }

  async function openPreview(id: string) {
    const res = await fetch(`/api/admin/videos/${id}`);
    if (!res.ok) return;
    setPreviewItem(await res.json());
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this video entry?")) return;
    await fetch(`/api/admin/videos/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((v) => v.id !== id));
    if (previewItem?.id === id) setPreviewItem(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Video Management</h1>
          <p className="text-muted-foreground">{items.length} entries</p>
        </div>
        <Button size="sm" onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); setPreviewItem(null); setShowForm(true); }}>
          <Plus className="mr-1.5 size-4" /> New Video
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48"
        />
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="w-40" />
        <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="w-40" />
        {(search || filterStatus || filterFrom || filterTo) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilterStatus(""); setFilterFrom(""); setFilterTo(""); }}>
            Clear
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editId ? "Edit Video" : "New Video"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={F("title")} required />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Description *</Label>
                  <Textarea value={form.description} onChange={F("description")} rows={3} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Input
                    type="number"
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={form.status}
                    onChange={F("status")}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Videos array */}
                <div className="sm:col-span-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Videos</Label>
                    <Button type="button" size="sm" variant="outline" onClick={addVideoItem}>
                      <Plus className="mr-1 size-3" /> Add Video
                    </Button>
                  </div>
                  {form.videos.map((v, i) => (
                    <Card key={i} className="p-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Type</Label>
                          <select
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                            value={v.video_type}
                            onChange={(e) => updateVideoItem(i, "video_type", e.target.value)}
                          >
                            <option value="youtube">YouTube</option>
                            <option value="file">File</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Video Title</Label>
                          <Input value={v.video_title} onChange={(e) => updateVideoItem(i, "video_title", e.target.value)} placeholder="Video title" />
                        </div>
                        {v.video_type === "youtube" && (
                          <>
                            <div className="space-y-1.5">
                              <Label className="text-xs">YouTube Link</Label>
                              <Input value={v.youtube_link} onChange={(e) => updateVideoItem(i, "youtube_link", e.target.value)} placeholder="https://youtu.be/…" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">YouTube Title</Label>
                              <Input value={v.youtube_title} onChange={(e) => updateVideoItem(i, "youtube_title", e.target.value)} placeholder="YouTube title" />
                            </div>
                          </>
                        )}
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeVideoItem(i)}>
                          <Trash2 className="size-3.5 mr-1" /> Remove
                        </Button>
                      </div>
                    </Card>
                  ))}
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
          <CardContent className="space-y-3 text-sm">
            <div><span className="font-medium">Status: </span><Badge variant="secondary">{previewItem.status}</Badge></div>
            <div><span className="font-medium">Description: </span>{previewItem.description}</div>
            {previewItem.videos && previewItem.videos.length > 0 && (
              <div>
                <span className="font-medium">Videos ({previewItem.videos.length}):</span>
                <ul className="mt-1 space-y-1 list-disc list-inside text-muted-foreground">
                  {previewItem.videos.map((v, i) => (
                    <li key={i}>[{v.video_type}] {v.video_title || v.youtube_title || "Untitled"}{v.youtube_link && ` — ${v.youtube_link}`}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No video entries found.</p>
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
                      <Badge variant="secondary">{item.status}</Badge>
                      <span className="text-xs text-muted-foreground">Priority: {item.priority}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                    <p className="text-xs text-muted-foreground">{item.videos?.length ?? 0} video(s) · Updated {new Date(item.updated_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => openPreview(item.id)}>
                      <Eye className="size-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(item.id)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="size-4" />
                    </Button>
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
