"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, BookOpen, PlayCircle } from "lucide-react";

type Wisdom = {
  id: string;
  title: string;
  descriptive_title: string | null;
  content: string | null;
  image_url: string | null;
  youtube_url: string | null;
  type: "text" | "youtube";
  priority: number;
  is_active: boolean;
};

const EMPTY_FORM = { title: "", descriptive_title: "", content: "", image_url: "", youtube_url: "", type: "text", priority: "0", is_active: true };

export default function AdminSpiritualWisdomPage() {
  const [items, setItems] = useState<Wisdom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/spiritual-wisdom");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = { title: form.title, descriptive_title: form.descriptive_title || null, content: form.content || null, image_url: form.image_url || null, youtube_url: form.youtube_url || null, type: form.type, priority: parseInt(form.priority) || 0, is_active: form.is_active };
    const url = editId ? `/api/admin/spiritual-wisdom/${editId}` : "/api/admin/spiritual-wisdom";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); }
    else { await load(); setShowForm(false); setEditId(null); setForm({ ...EMPTY_FORM }); }
    setSaving(false);
  }

  function openEdit(item: Wisdom) {
    setEditId(item.id);
    setForm({ title: item.title, descriptive_title: item.descriptive_title ?? "", content: item.content ?? "", image_url: item.image_url ?? "", youtube_url: item.youtube_url ?? "", type: item.type, priority: String(item.priority), is_active: item.is_active });
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this wisdom entry?")) return;
    await fetch(`/api/admin/spiritual-wisdom/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function F(field: string) { return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [field]: e.target.value })); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Spiritual Wisdom</h1>
          <p className="text-muted-foreground">Manage spiritual wisdom content — articles and YouTube videos.</p>
        </div>
        <Button onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowForm(true); }} size="sm">
          <Plus className="mr-1.5 size-4" /> New Entry
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">{editId ? "Edit Entry" : "New Wisdom Entry"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={form.type} onChange={F("type")}>
                    <option value="text">Text / Document</option>
                    <option value="youtube">YouTube Video</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Input type="number" value={form.priority} onChange={F("priority")} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={F("title")} required />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Descriptive Title</Label>
                  <Input value={form.descriptive_title} onChange={F("descriptive_title")} />
                </div>
                {form.type === "text" && (
                  <>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Content (HTML / rich text)</Label>
                      <Textarea value={form.content} onChange={F("content")} rows={5} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Image URL</Label>
                      <Input value={form.image_url} onChange={F("image_url")} />
                    </div>
                  </>
                )}
                {form.type === "youtube" && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>YouTube URL</Label>
                    <Input value={form.youtube_url} onChange={F("youtube_url")} placeholder="https://www.youtube.com/watch?v=..." />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="size-4" />
                  <Label>Active</Label>
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

      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : items.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><BookOpen className="mx-auto mb-3 size-10 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No wisdom entries yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.type === "youtube" ? <PlayCircle className="size-4 text-red-500" /> : <BookOpen className="size-4 text-muted-foreground" />}
                      <span className="font-medium">{item.title}</span>
                      <Badge variant="outline" className="text-xs">P{item.priority}</Badge>
                      {item.is_active ? <Badge variant="default" className="text-xs">Active</Badge> : <Badge variant="outline" className="text-xs">Inactive</Badge>}
                    </div>
                    {item.descriptive_title && <p className="text-sm text-muted-foreground">{item.descriptive_title}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(item)}><Pencil className="size-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)} className="text-destructive hover:text-destructive"><Trash2 className="size-4" /></Button>
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
