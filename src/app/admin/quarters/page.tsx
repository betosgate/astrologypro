"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";

type Quarter = {
  id: string;
  quarter_name: string;
  slug: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  priority: number;
  created_at: string;
  updated_at: string;
};

type FormState = {
  quarter_name: string;
  slug: string;
  description: string;
  start_date: string;
  end_date: string;
  priority: number;
  status: string;
};

const EMPTY_FORM: FormState = {
  quarter_name: "", slug: "", description: "", start_date: "", end_date: "", priority: 0, status: "draft",
};

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminQuartersPage() {
  const [items, setItems] = useState<Quarter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<Quarter | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);
    const res = await fetch(`/api/admin/quarters?${params}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [filterStatus, filterFrom, filterTo]); // eslint-disable-line react-hooks/exhaustive-deps

  function F(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const quarter_name = e.target.value;
    setForm((f) => ({ ...f, quarter_name, slug: editId ? f.slug : toSlug(quarter_name) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const url = editId ? `/api/admin/quarters/${editId}` : "/api/admin/quarters";
    const res = await fetch(url, {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        description: form.description || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
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
    const res = await fetch(`/api/admin/quarters/${id}`);
    if (!res.ok) return;
    const item = await res.json();
    setEditId(id);
    setForm({
      quarter_name: item.quarter_name,
      slug: item.slug,
      description: item.description ?? "",
      start_date: item.start_date ?? "",
      end_date: item.end_date ?? "",
      priority: item.priority ?? 0,
      status: item.status ?? "draft",
    });
    setPreviewItem(null);
    setShowForm(true);
  }

  async function openPreview(id: string) {
    const res = await fetch(`/api/admin/quarters/${id}`);
    if (!res.ok) return;
    setPreviewItem(await res.json());
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this quarter?")) return;
    await fetch(`/api/admin/quarters/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((q) => q.id !== id));
    if (previewItem?.id === id) setPreviewItem(null);
    setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
  }

  async function bulkAction(action: "activate" | "deactivate" | "delete") {
    if (selected.size === 0) return;
    if (action === "delete" && !confirm(`Delete ${selected.size} quarters?`)) return;
    const ids = Array.from(selected);
    await Promise.all(ids.map((id) => {
      if (action === "delete") return fetch(`/api/admin/quarters/${id}`, { method: "DELETE" });
      return fetch(`/api/admin/quarters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action === "activate" ? "active" : "inactive" }),
      });
    }));
    setSelected(new Set());
    await load();
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  }

  function toggleAll() {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quarters</h1>
          <p className="text-muted-foreground">{items.length} quarters</p>
        </div>
        <Button size="sm" onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); setPreviewItem(null); setShowForm(true); }}>
          <Plus className="mr-1.5 size-4" /> New Quarter
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
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
        {(filterStatus || filterFrom || filterTo) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterStatus(""); setFilterFrom(""); setFilterTo(""); }}>
            Clear
          </Button>
        )}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
          <span>{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => bulkAction("activate")}>Activate</Button>
          <Button size="sm" variant="outline" onClick={() => bulkAction("deactivate")}>Deactivate</Button>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => bulkAction("delete")}>Delete</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editId ? "Edit Quarter" : "New Quarter"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Quarter Name *</Label>
                  <Input value={form.quarter_name} onChange={handleNameChange} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={F("slug")} placeholder="auto-generated from name" />
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
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <Input type="date" value={form.start_date} onChange={F("start_date")} />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date</Label>
                  <Input type="date" value={form.end_date} onChange={F("end_date")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Input type="number" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={F("description")} rows={3} />
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
              <CardTitle className="text-base">Preview: {previewItem.quarter_name}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setPreviewItem(null)}>Close</Button>
            </div>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div><span className="font-medium">Slug: </span>{previewItem.slug}</div>
            <div><span className="font-medium">Status: </span><Badge variant="secondary">{previewItem.status}</Badge></div>
            <div><span className="font-medium">Dates: </span>{previewItem.start_date ?? "—"} → {previewItem.end_date ?? "—"}</div>
            <div><span className="font-medium">Description: </span>{previewItem.description ?? "—"}</div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No quarters found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
            <input type="checkbox" className="size-4" checked={selected.size === items.length && items.length > 0} onChange={toggleAll} />
            <span>Select all</span>
          </div>
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="size-4 mt-1" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{item.quarter_name}</span>
                        <Badge variant="secondary">{item.status}</Badge>
                        <span className="text-xs text-muted-foreground">Priority: {item.priority}</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{item.slug}</p>
                      <p className="text-xs text-muted-foreground">{item.start_date ?? "—"} → {item.end_date ?? "—"}</p>
                    </div>
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
