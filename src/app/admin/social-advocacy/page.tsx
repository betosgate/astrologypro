"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, Megaphone, Eye } from "lucide-react";

type SocialAdvo = {
  id: string;
  title: string;
  frequency: string;
  link: string | null;
  image_url: string | null;
  audio_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const EMPTY_FORM = { title: "", frequency: "Weekly", link: "", image_url: "", audio_url: "", is_active: true };
const FREQUENCIES = ["Daily", "Weekly", "Monthly", "Custom"];

export default function AdminSocialAdvocacyPage() {
  const [items, setItems] = useState<SocialAdvo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<SocialAdvo | null>(null);

  // Filters
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [updatedFrom, setUpdatedFrom] = useState("");
  const [updatedTo, setUpdatedTo] = useState("");

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  async function load(overrides?: { createdFrom?: string; createdTo?: string; updatedFrom?: string; updatedTo?: string }) {
    setLoading(true);
    const cf = overrides?.createdFrom ?? createdFrom;
    const ct = overrides?.createdTo ?? createdTo;
    const uf = overrides?.updatedFrom ?? updatedFrom;
    const ut = overrides?.updatedTo ?? updatedTo;
    const params = new URLSearchParams();
    if (cf) params.set("created_from", cf);
    if (ct) params.set("created_to", ct);
    if (uf) params.set("updated_from", uf);
    if (ut) params.set("updated_to", ut);
    const res = await fetch(`/api/admin/social-advocacy?${params}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  function resetFilters() {
    setCreatedFrom(""); setCreatedTo(""); setUpdatedFrom(""); setUpdatedTo("");
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = { ...form, link: form.link || null, image_url: form.image_url || null, audio_url: form.audio_url || null };
    const url = editId ? `/api/admin/social-advocacy/${editId}` : "/api/admin/social-advocacy";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); }
    else { await load(); setShowForm(false); setEditId(null); setForm({ ...EMPTY_FORM }); }
    setSaving(false);
  }

  function openEdit(item: SocialAdvo) {
    setEditId(item.id);
    setForm({ title: item.title, frequency: item.frequency, link: item.link ?? "", image_url: item.image_url ?? "", audio_url: item.audio_url ?? "", is_active: item.is_active });
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/admin/social-advocacy/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function toggleActive(item: SocialAdvo) {
    await fetch(`/api/admin/social-advocacy/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: !item.is_active }) });
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
  }

  function F(field: string) { return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [field]: e.target.value })); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Social Advocacy</h1>
          <p className="text-muted-foreground">Manage content for social advocacy auto-posting via Ayrshare.</p>
        </div>
        <Button onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowForm(true); }} size="sm">
          <Plus className="mr-1.5 size-4" /> New Item
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Created from</Label>
              <Input type="date" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Created to</Label>
              <Input type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Updated from</Label>
              <Input type="date" value={updatedFrom} onChange={(e) => setUpdatedFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Updated to</Label>
              <Input type="date" value={updatedTo} onChange={(e) => setUpdatedTo(e.target.value)} />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => load()}>Search</Button>
            <Button size="sm" variant="outline" onClick={() => { resetFilters(); load({ createdFrom: "", createdTo: "", updatedFrom: "", updatedTo: "" }); }}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewItem(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader><CardTitle>Social Advocacy Preview</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="font-medium">Title:</span> {previewItem.title}</div>
              <div><span className="font-medium">Frequency:</span> <Badge variant="secondary" className="text-xs">{previewItem.frequency}</Badge></div>
              <div><span className="font-medium">Status:</span> <Badge variant={previewItem.is_active ? "default" : "outline"}>{previewItem.is_active ? "Active" : "Inactive"}</Badge></div>
              {previewItem.link && <div><span className="font-medium">Link:</span> <a href={previewItem.link} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs break-all">{previewItem.link}</a></div>}
              {previewItem.image_url && <div><span className="font-medium">Image URL:</span> <span className="text-xs text-muted-foreground break-all">{previewItem.image_url}</span></div>}
              {previewItem.audio_url && <div><span className="font-medium">Audio URL:</span> <span className="text-xs text-muted-foreground break-all">{previewItem.audio_url}</span></div>}
              <div><span className="font-medium">Created:</span> {fmt(previewItem.created_at)}</div>
              <div><span className="font-medium">Updated:</span> {fmt(previewItem.updated_at)}</div>
              <Button size="sm" className="mt-2" onClick={() => setPreviewItem(null)}>Close</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">{editId ? "Edit Item" : "New Social Advocacy Item"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={F("title")} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Frequency</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={form.frequency} onChange={F("frequency")}>
                    {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Link URL</Label>
                  <Input value={form.link} onChange={F("link")} placeholder="https://..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Image URL</Label>
                  <Input value={form.image_url} onChange={F("image_url")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Audio URL</Label>
                  <Input value={form.audio_url} onChange={F("audio_url")} />
                </div>
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
        <Card><CardContent className="py-12 text-center"><Megaphone className="mx-auto mb-3 size-10 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No social advocacy items yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-base">{item.title}</span>
                      <Badge variant="secondary" className="text-xs">{item.frequency}</Badge>
                      {item.is_active ? <Badge variant="default" className="text-xs">Active</Badge> : <Badge variant="outline" className="text-xs">Inactive</Badge>}
                    </div>
                    {item.link && <p className="text-xs text-muted-foreground truncate max-w-xs">{item.link}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setPreviewItem(item)}><Eye className="size-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(item)}>{item.is_active ? "Deactivate" : "Activate"}</Button>
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
