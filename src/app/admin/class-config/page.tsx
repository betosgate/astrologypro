"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";

type ClassConfig = {
  id: string;
  class_name: string;
  description: string | null;
  session_type: string;
  max_participants: number | null;
  duration_minutes: number | null;
  quarter_id: string | null;
  status: string;
  priority: number;
  created_at: string;
  updated_at: string;
};

type FormState = {
  class_name: string;
  description: string;
  session_type: string;
  max_participants: string;
  duration_minutes: string;
  quarter_id: string;
  priority: number;
  status: string;
};

const EMPTY_FORM: FormState = {
  class_name: "", description: "", session_type: "live", max_participants: "", duration_minutes: "", quarter_id: "", priority: 0, status: "draft",
};

export default function AdminClassConfigPage() {
  const [items, setItems] = useState<ClassConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<ClassConfig | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSessionType, setFilterSessionType] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterSessionType) params.set("session_type", filterSessionType);
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);
    const res = await fetch(`/api/admin/class-config?${params}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [filterStatus, filterSessionType, filterFrom, filterTo]); // eslint-disable-line react-hooks/exhaustive-deps

  function F(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const url = editId ? `/api/admin/class-config/${editId}` : "/api/admin/class-config";
    const res = await fetch(url, {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        max_participants: form.max_participants ? Number(form.max_participants) : null,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
        quarter_id: form.quarter_id || null,
        description: form.description || null,
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
    const res = await fetch(`/api/admin/class-config/${id}`);
    if (!res.ok) return;
    const item = await res.json();
    setEditId(id);
    setForm({
      class_name: item.class_name,
      description: item.description ?? "",
      session_type: item.session_type ?? "live",
      max_participants: item.max_participants != null ? String(item.max_participants) : "",
      duration_minutes: item.duration_minutes != null ? String(item.duration_minutes) : "",
      quarter_id: item.quarter_id ?? "",
      priority: item.priority ?? 0,
      status: item.status ?? "draft",
    });
    setPreviewItem(null);
    setShowForm(true);
  }

  async function openPreview(id: string) {
    const res = await fetch(`/api/admin/class-config/${id}`);
    if (!res.ok) return;
    setPreviewItem(await res.json());
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this class configuration?")) return;
    await fetch(`/api/admin/class-config/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((c) => c.id !== id));
    if (previewItem?.id === id) setPreviewItem(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Class Configurations</h1>
          <p className="text-muted-foreground">{items.length} configurations</p>
        </div>
        <Button size="sm" onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); setPreviewItem(null); setShowForm(true); }}>
          <Plus className="mr-1.5 size-4" /> New Class
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
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          value={filterSessionType}
          onChange={(e) => setFilterSessionType(e.target.value)}
        >
          <option value="">All session types</option>
          <option value="live">Live</option>
          <option value="recorded">Recorded</option>
          <option value="hybrid">Hybrid</option>
        </select>
        <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="w-40" />
        <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="w-40" />
        {(filterStatus || filterSessionType || filterFrom || filterTo) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterStatus(""); setFilterSessionType(""); setFilterFrom(""); setFilterTo(""); }}>
            Clear
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editId ? "Edit Class" : "New Class Configuration"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Class Name *</Label>
                  <Input value={form.class_name} onChange={F("class_name")} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Session Type</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={form.session_type}
                    onChange={F("session_type")}
                  >
                    <option value="live">Live</option>
                    <option value="recorded">Recorded</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
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
                  <Label>Max Participants</Label>
                  <Input type="number" value={form.max_participants} onChange={F("max_participants")} min={1} />
                </div>
                <div className="space-y-1.5">
                  <Label>Duration (minutes)</Label>
                  <Input type="number" value={form.duration_minutes} onChange={F("duration_minutes")} min={1} />
                </div>
                <div className="space-y-1.5">
                  <Label>Quarter ID</Label>
                  <Input value={form.quarter_id} onChange={F("quarter_id")} placeholder="Optional quarter UUID" />
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
              <CardTitle className="text-base">Preview: {previewItem.class_name}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setPreviewItem(null)}>Close</Button>
            </div>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div><span className="font-medium">Session Type: </span><Badge variant="secondary">{previewItem.session_type}</Badge></div>
            <div><span className="font-medium">Status: </span><Badge variant="outline">{previewItem.status}</Badge></div>
            <div><span className="font-medium">Max Participants: </span>{previewItem.max_participants ?? "—"}</div>
            <div><span className="font-medium">Duration: </span>{previewItem.duration_minutes != null ? `${previewItem.duration_minutes} min` : "—"}</div>
            <div><span className="font-medium">Quarter ID: </span>{previewItem.quarter_id ?? "—"}</div>
            <div><span className="font-medium">Description: </span>{previewItem.description ?? "—"}</div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No class configurations found.</p>
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
                      <span className="font-medium">{item.class_name}</span>
                      <Badge variant="secondary">{item.session_type}</Badge>
                      <Badge variant="outline">{item.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.max_participants != null ? `${item.max_participants} participants` : "Unlimited"}
                      {item.duration_minutes != null && ` · ${item.duration_minutes} min`}
                      {" · "}Created {new Date(item.created_at).toLocaleDateString()}
                    </p>
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
