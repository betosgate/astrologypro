"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, BookMarked } from "lucide-react";

const ZODIAC_SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];

type Journal = {
  id: string;
  sign: string;
  decan: number;
  title: string;
  description: string | null;
  content: string | null;
  is_active: boolean;
};

const EMPTY_FORM = { sign: "Aries", decan: "1", title: "", description: "", content: "", is_active: true };

export default function AdminDecanJournalsPage() {
  const [items, setItems] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterSign, setFilterSign] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/decan-journals");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = { sign: form.sign, decan: parseInt(form.decan), title: form.title, description: form.description || null, content: form.content || null, is_active: form.is_active };
    const url = editId ? `/api/admin/decan-journals/${editId}` : "/api/admin/decan-journals";
    const res = await fetch(url, { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); }
    else { await load(); setShowForm(false); setEditId(null); setForm({ ...EMPTY_FORM }); }
    setSaving(false);
  }

  function openEdit(item: Journal) {
    setEditId(item.id);
    setForm({ sign: item.sign, decan: String(item.decan), title: item.title, description: item.description ?? "", content: item.content ?? "", is_active: item.is_active });
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this journal entry?")) return;
    await fetch(`/api/admin/decan-journals/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function F(field: string) { return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [field]: e.target.value })); }

  const filtered = filterSign ? items.filter((i) => i.sign === filterSign) : items;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Decan Journals</h1>
          <p className="text-muted-foreground">General content entries per zodiac sign and decan. {items.length} total.</p>
        </div>
        <Button onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowForm(true); }} size="sm">
          <Plus className="mr-1.5 size-4" /> New Entry
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">{editId ? "Edit Entry" : "New Journal Entry"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Sign *</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={form.sign} onChange={F("sign")}>
                    {ZODIAC_SIGNS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Decan *</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={form.decan} onChange={F("decan")}>
                    <option value="1">Decan 1</option>
                    <option value="2">Decan 2</option>
                    <option value="3">Decan 3</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="invisible">Active</Label>
                  <div className="flex items-center gap-2 h-9">
                    <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="size-4" />
                    <Label>Active</Label>
                  </div>
                </div>
                <div className="space-y-1.5 sm:col-span-3">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={F("title")} required />
                </div>
                <div className="space-y-1.5 sm:col-span-3">
                  <Label>Description</Label>
                  <Input value={form.description} onChange={F("description")} />
                </div>
                <div className="space-y-1.5 sm:col-span-3">
                  <Label>Content (HTML / rich text)</Label>
                  <Textarea value={form.content} onChange={F("content")} rows={5} />
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

      <div className="flex items-center gap-2">
        <select className="flex h-8 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm w-40" value={filterSign} onChange={(e) => setFilterSign(e.target.value)}>
          <option value="">All Signs</option>
          {ZODIAC_SIGNS.map((s) => <option key={s}>{s}</option>)}
        </select>
        {filterSign && <Button variant="ghost" size="sm" onClick={() => setFilterSign("")}>Clear</Button>}
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><BookMarked className="mx-auto mb-3 size-10 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No journal entries yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{item.title}</span>
                      <Badge variant="secondary" className="text-xs">{item.sign} · Decan {item.decan}</Badge>
                      {item.is_active ? <Badge variant="default" className="text-xs">Active</Badge> : <Badge variant="outline" className="text-xs">Inactive</Badge>}
                    </div>
                    {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
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
