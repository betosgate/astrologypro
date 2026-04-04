"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";

const CONTENT_TYPES = ["text", "image", "video", "pdf", "youtube"];
const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];
const STATUS_OPTIONS = ["draft", "active", "inactive"];

type GeneralContent = {
  id: string;
  title: string;
  content_type: string;
  sign: string | null;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  pdf_url: string | null;
  youtube_url: string | null;
  status: string;
  priority: number;
  created_at: string;
  updated_at: string;
};

type FormState = {
  title: string;
  content_type: string;
  sign: string;
  description: string;
  image_url: string;
  video_url: string;
  pdf_url: string;
  youtube_url: string;
  priority: number;
  status: string;
};

const EMPTY_FORM: FormState = {
  title: "", content_type: "text", sign: "", description: "",
  image_url: "", video_url: "", pdf_url: "", youtube_url: "", priority: 0, status: "draft",
};

export default function AdminGeneralContentPage() {
  const [items, setItems] = useState<GeneralContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<GeneralContent | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterContentType, setFilterContentType] = useState("");
  const [filterSign, setFilterSign] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterContentType) params.set("content_type", filterContentType);
    if (filterSign) params.set("sign", filterSign);
    if (filterStatus) params.set("status", filterStatus);
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);
    const res = await fetch(`/api/admin/general-content?${params}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [filterContentType, filterSign, filterStatus, filterFrom, filterTo]); // eslint-disable-line react-hooks/exhaustive-deps

  function F(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const url = editId ? `/api/admin/general-content/${editId}` : "/api/admin/general-content";
    const res = await fetch(url, {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        sign: form.sign || null,
        description: form.description || null,
        image_url: form.image_url || null,
        video_url: form.video_url || null,
        pdf_url: form.pdf_url || null,
        youtube_url: form.youtube_url || null,
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
    const res = await fetch(`/api/admin/general-content/${id}`);
    if (!res.ok) return;
    const item = await res.json();
    setEditId(id);
    setForm({
      title: item.title,
      content_type: item.content_type ?? "text",
      sign: item.sign ?? "",
      description: item.description ?? "",
      image_url: item.image_url ?? "",
      video_url: item.video_url ?? "",
      pdf_url: item.pdf_url ?? "",
      youtube_url: item.youtube_url ?? "",
      priority: item.priority ?? 0,
      status: item.status ?? "draft",
    });
    setPreviewItem(null);
    setShowForm(true);
  }

  async function openPreview(id: string) {
    const res = await fetch(`/api/admin/general-content/${id}`);
    if (!res.ok) return;
    setPreviewItem(await res.json());
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this content?")) return;
    await fetch(`/api/admin/general-content/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((c) => c.id !== id));
    if (previewItem?.id === id) setPreviewItem(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">General Content</h1>
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
          value={filterSign}
          onChange={(e) => setFilterSign(e.target.value)}
        >
          <option value="">All signs</option>
          {ZODIAC_SIGNS.map((s) => <option key={s} value={s}>{s}</option>)}
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
        {(filterContentType || filterSign || filterStatus || filterFrom || filterTo) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterContentType(""); setFilterSign(""); setFilterStatus(""); setFilterFrom(""); setFilterTo(""); }}>
            Clear
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editId ? "Edit Content" : "New General Content"}</CardTitle>
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
                  <Label>Zodiac Sign</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={form.sign}
                    onChange={F("sign")}
                  >
                    <option value="">— None —</option>
                    {ZODIAC_SIGNS.map((s) => <option key={s} value={s}>{s}</option>)}
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
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Input type="number" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={F("description")} rows={3} />
                </div>

                {/* Conditional URL fields based on content_type */}
                {form.content_type === "image" && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Image URL</Label>
                    <Input value={form.image_url} onChange={F("image_url")} placeholder="https://…" />
                  </div>
                )}
                {form.content_type === "video" && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Video URL</Label>
                    <Input value={form.video_url} onChange={F("video_url")} placeholder="https://…" />
                  </div>
                )}
                {form.content_type === "pdf" && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>PDF URL</Label>
                    <Input value={form.pdf_url} onChange={F("pdf_url")} placeholder="https://…" />
                  </div>
                )}
                {form.content_type === "youtube" && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>YouTube URL</Label>
                    <Input value={form.youtube_url} onChange={F("youtube_url")} placeholder="https://youtu.be/…" />
                  </div>
                )}
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
              {previewItem.sign && <Badge variant="outline">{previewItem.sign}</Badge>}
              <Badge variant="outline">{previewItem.status}</Badge>
            </div>
            {previewItem.description && <div><span className="font-medium">Description: </span>{previewItem.description}</div>}
            {previewItem.image_url && <div><span className="font-medium">Image: </span><a href={previewItem.image_url} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">{previewItem.image_url}</a></div>}
            {previewItem.video_url && <div><span className="font-medium">Video: </span><a href={previewItem.video_url} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">{previewItem.video_url}</a></div>}
            {previewItem.pdf_url && <div><span className="font-medium">PDF: </span><a href={previewItem.pdf_url} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">{previewItem.pdf_url}</a></div>}
            {previewItem.youtube_url && <div><span className="font-medium">YouTube: </span><a href={previewItem.youtube_url} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">{previewItem.youtube_url}</a></div>}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No general content found.</p>
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
                      {item.sign && <Badge variant="outline">{item.sign}</Badge>}
                      <Badge variant="outline">{item.status}</Badge>
                      <span className="text-xs text-muted-foreground">Priority: {item.priority}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
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
