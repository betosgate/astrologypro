"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";

type Role = {
  id: string;
  role_name: string;
  slug: string;
  description: string;
  priority: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};

type FormState = {
  role_name: string;
  slug: string;
  description: string;
  priority: number;
  status: "active" | "inactive";
};

const EMPTY_FORM: FormState = { role_name: "", slug: "", description: "", priority: 0, status: "active" };

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [previewRole, setPreviewRole] = useState<Role | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [updatedFrom, setUpdatedFrom] = useState("");
  const [updatedTo, setUpdatedTo] = useState("");

  async function load(overrides?: { search?: string; statusFilter?: string; createdFrom?: string; createdTo?: string; updatedFrom?: string; updatedTo?: string }) {
    setLoading(true);
    const s = overrides?.search ?? search;
    const sf = overrides?.statusFilter ?? statusFilter;
    const cf = overrides?.createdFrom ?? createdFrom;
    const ct = overrides?.createdTo ?? createdTo;
    const uf = overrides?.updatedFrom ?? updatedFrom;
    const ut = overrides?.updatedTo ?? updatedTo;
    const params = new URLSearchParams();
    if (s) params.set("search", s);
    if (sf) params.set("status", sf);
    if (cf) params.set("created_from", cf);
    if (ct) params.set("created_to", ct);
    if (uf) params.set("updated_from", uf);
    if (ut) params.set("updated_to", ut);
    const res = await fetch(`/api/admin/roles?${params}`);
    if (res.ok) {
      const json = await res.json();
      setRoles(json.data ?? []);
      setCount(json.count ?? 0);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function handleRoleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const role_name = e.target.value;
    setForm((f) => ({ ...f, role_name, slug: editId ? f.slug : toSlug(role_name) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const url = editId ? `/api/admin/roles/${editId}` : "/api/admin/roles";
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
    const res = await fetch(`/api/admin/roles/${id}`);
    if (!res.ok) return;
    const role = await res.json();
    setEditId(id);
    setForm({ role_name: role.role_name, slug: role.slug, description: role.description, priority: role.priority, status: role.status });
    setShowForm(true);
  }

  async function toggleStatus(role: Role) {
    await fetch(`/api/admin/roles/${role.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: role.status === "active" ? "inactive" : "active" }),
    });
    setRoles((prev) => prev.map((r) => r.id === role.id ? { ...r, status: r.status === "active" ? "inactive" : "active" } : r));
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this role?")) return;
    await fetch(`/api/admin/roles/${id}`, { method: "DELETE" });
    setRoles((prev) => prev.filter((r) => r.id !== id));
    setCount((c) => c - 1);
    setSelected((s) => { const n = new Set(s); n.delete(id); return n; });
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selected.size} selected role(s)?`)) return;
    await Promise.all([...selected].map((id) => fetch(`/api/admin/roles/${id}`, { method: "DELETE" })));
    setSelected(new Set());
    await load();
  }

  async function bulkStatus(status: "active" | "inactive") {
    await Promise.all([...selected].map((id) =>
      fetch(`/api/admin/roles/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
    ));
    setSelected(new Set());
    await load();
  }

  function toggleSelect(id: string) {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleSelectAll() {
    if (selected.size === roles.length) setSelected(new Set());
    else setSelected(new Set(roles.map((r) => r.id)));
  }

  function resetFilters() {
    setSearch(""); setStatusFilter(""); setCreatedFrom(""); setCreatedTo(""); setUpdatedFrom(""); setUpdatedTo("");
  }

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Role Management</h1>
          <p className="text-muted-foreground">{count} total · {roles.filter((r) => r.status === "active").length} active</p>
        </div>
        <Button size="sm" onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowForm(true); }}>
          <Plus className="mr-1.5 size-4" /> New Role
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Search role name</Label>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Role name..." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
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
            <Button size="sm" variant="outline" onClick={() => { resetFilters(); load({ search: "", statusFilter: "", createdFrom: "", createdTo: "", updatedFrom: "", updatedTo: "" }); }}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-4 py-2 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => bulkStatus("active")}>Set Active</Button>
          <Button size="sm" variant="outline" onClick={() => bulkStatus("inactive")}>Set Inactive</Button>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={bulkDelete}>Delete Selected</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">{editId ? "Edit Role" : "New Role"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Role Name *</Label>
                  <Input value={form.role_name} onChange={handleRoleNameChange} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug *</Label>
                  <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} required placeholder="role_slug" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Description *</Label>
                  <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required rows={3} />
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Input type="number" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "active" | "inactive" }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
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

      {/* Preview modal */}
      {previewRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewRole(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader><CardTitle>Role Preview</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="font-medium">Name:</span> {previewRole.role_name}</div>
              <div><span className="font-medium">Slug:</span> <code className="text-xs bg-muted px-1 rounded">{previewRole.slug}</code></div>
              <div><span className="font-medium">Description:</span> {previewRole.description}</div>
              <div><span className="font-medium">Priority:</span> {previewRole.priority}</div>
              <div><span className="font-medium">Status:</span> <Badge variant={previewRole.status === "active" ? "default" : "outline"}>{previewRole.status}</Badge></div>
              <div><span className="font-medium">Created:</span> {fmt(previewRole.created_at)}</div>
              <div><span className="font-medium">Updated:</span> {fmt(previewRole.updated_at)}</div>
              <Button size="sm" className="mt-2" onClick={() => setPreviewRole(null)}>Close</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : roles.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><p className="text-sm text-muted-foreground">No roles found.</p></CardContent></Card>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left w-8">
                  <input type="checkbox" checked={selected.size === roles.length && roles.length > 0} onChange={toggleSelectAll} className="size-4" />
                </th>
                <th className="px-3 py-2 text-left font-medium">Role Name</th>
                <th className="px-3 py-2 text-left font-medium">Slug</th>
                <th className="px-3 py-2 text-left font-medium">Priority</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Created</th>
                <th className="px-3 py-2 text-left font-medium">Updated</th>
                <th className="px-3 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={selected.has(role.id)} onChange={() => toggleSelect(role.id)} className="size-4" />
                  </td>
                  <td className="px-3 py-2 font-medium">{role.role_name}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{role.slug}</td>
                  <td className="px-3 py-2">{role.priority}</td>
                  <td className="px-3 py-2">
                    <Badge variant={role.status === "active" ? "default" : "outline"} className="text-xs">{role.status}</Badge>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{fmt(role.created_at)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{fmt(role.updated_at)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setPreviewRole(role)}><Eye className="size-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleStatus(role)}>{role.status === "active" ? "Deactivate" : "Activate"}</Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(role.id)}><Pencil className="size-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(role.id)}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
