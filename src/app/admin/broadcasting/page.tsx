"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";

type Broadcast = {
  id: string;
  title: string;
  short_description: string;
  description: string;
  priority: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};

type FormState = {
  title: string;
  short_description: string;
  description: string;
  priority: number;
  status: "active" | "inactive";
};

const EMPTY: FormState = { title: "", short_description: "", description: "", priority: 0, status: "active" };

export default function AdminBroadcastingPage() {
  const [items, setItems] = useState<Broadcast[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Broadcast | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<Broadcast | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updatedFrom, setUpdatedFrom] = useState("");
  const [updatedTo, setUpdatedTo] = useState("");

  const load = useCallback(async (overrides?: { search?: string; status?: string; updatedFrom?: string; updatedTo?: string }) => {
    setLoading(true);
    const s = overrides?.search ?? "";
    const st = overrides?.status ?? "";
    const uf = overrides?.updatedFrom ?? "";
    const ut = overrides?.updatedTo ?? "";
    const params = new URLSearchParams();
    if (s) params.set("search", s);
    if (st) params.set("status", st);
    if (uf) params.set("updated_from", uf);
    if (ut) params.set("updated_to", ut);
    const res = await fetch(`/api/admin/broadcasting?${params}`);
    if (res.ok) {
      const json = await res.json();
      setItems(json.data ?? []);
      setCount(json.count ?? 0);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() =>
      load({ search: "", status: "", updatedFrom: "", updatedTo: "" })
    );
  }, [load]);

  function F(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const url = editId ? `/api/admin/broadcasting/${editId}` : "/api/admin/broadcasting";
    const res = await fetch(url, {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed");
    } else {
      await load({ search, status: statusFilter, updatedFrom, updatedTo });
      setShowForm(false);
      setEditId(null);
      setForm({ ...EMPTY });
    }
    setSaving(false);
  }

  async function openEdit(id: string) {
    const res = await fetch(`/api/admin/broadcasting/${id}`);
    if (!res.ok) return;
    const item = await res.json();
    setEditId(id);
    setForm({ title: item.title, short_description: item.short_description, description: item.description, priority: item.priority, status: item.status });
    setShowForm(true);
  }

  async function toggleStatus(item: Broadcast) {
    const newStatus = item.status === "active" ? "inactive" : "active";
    await fetch(`/api/admin/broadcasting/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setItems((prev) => prev.map((b) => b.id === item.id ? { ...b, status: newStatus } : b));
  }

  async function handleDelete() {
    if (!deleteItem) return;
    setDeleting(true);
    await fetch(`/api/admin/broadcasting/${deleteItem.id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((b) => b.id !== deleteItem.id));
    setCount((c) => c - 1);
    setDeleteItem(null);
    setDeleting(false);
  }

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Broadcasting</h1>
          <p className="text-muted-foreground">{count} total</p>
        </div>
        <Button size="sm" onClick={() => { setEditId(null); setForm({ ...EMPTY }); setShowForm(true); }}>
          <Plus className="mr-1.5 size-4" /> New Broadcast
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Search title</Label>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title..." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select
                value={statusFilter || "all"}
                onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
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
            <Button size="sm" onClick={() => load({ search, status: statusFilter, updatedFrom, updatedTo })}>Search</Button>
            <Button size="sm" variant="outline" onClick={() => { setSearch(""); setStatusFilter(""); setUpdatedFrom(""); setUpdatedTo(""); load({ search: "", status: "", updatedFrom: "", updatedTo: "" }); }}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">{editId ? "Edit Broadcast" : "New Broadcast"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={F("title")} required />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Short Description *</Label>
                  <Textarea value={form.short_description} onChange={F("short_description")} required rows={2} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Description *</Label>
                  <Textarea value={form.description} onChange={F("description")} required rows={5} />
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Input type="number" value={form.priority} onChange={F("priority")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        status: value as FormState["status"],
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="w-[var(--radix-select-trigger-width)]">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
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

      {/* Preview */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreview(null)}>
          <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CardHeader><CardTitle>{preview.title}</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><span className="font-medium">Short Description:</span><p className="mt-1 text-muted-foreground">{preview.short_description}</p></div>
              <div><span className="font-medium">Description:</span><p className="mt-1 text-muted-foreground">{preview.description}</p></div>
              <div className="flex gap-4">
                <div><span className="font-medium">Priority:</span> {preview.priority}</div>
                <div><span className="font-medium">Status:</span> <Badge variant={preview.status === "active" ? "default" : "outline"}>{preview.status}</Badge></div>
              </div>
              <div><span className="font-medium">Updated:</span> {fmt(preview.updated_at)}</div>
              <Button size="sm" onClick={() => setPreview(null)}>Close</Button>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteItem}
        title="Delete Broadcast"
        description="Are you sure you want to delete this broadcast?"
        confirmLabel="Delete"
        loading={deleting}
        variant="destructive"
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteItem(null);
        }}
        onConfirm={handleDelete}
      />

      {/* List */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><p className="text-sm text-muted-foreground">No broadcasts yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="py-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.title}</span>
                      <Badge variant={item.status === "active" ? "default" : "outline"} className="text-xs">{item.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{item.short_description}</p>
                    <p className="text-xs text-muted-foreground">Updated: {fmt(item.updated_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setPreview(item)}><Eye className="size-3.5" /></Button>
                    <Button size="sm" variant="outline" onClick={() => toggleStatus(item)}>{item.status === "active" ? "Deactivate" : "Activate"}</Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(item.id)}><Pencil className="size-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteItem(item)}><Trash2 className="size-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
