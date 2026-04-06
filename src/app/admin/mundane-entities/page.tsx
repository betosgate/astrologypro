"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Building2, Plus, Pencil, Trash2, Loader2, ChevronRight } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type MundaneEntity = {
  id: string;
  name: string;
  entity_type: string;
  region: string | null;
  flag_emoji: string | null;
  is_active: boolean;
  created_at: string;
  chart_count: number;
};

type Stats = {
  totalEntities: number;
  activeCount: number;
  typeCounts: Record<string, number>;
};

type EntityForm = {
  name: string;
  entity_type: string;
  region: string;
  latitude: string;
  longitude: string;
  timezone: string;
  flag_emoji: string;
  notes: string;
};

const ENTITY_TYPES = [
  "country", "city", "institution", "market", "commodity", "organization", "other",
] as const;

const EMPTY_FORM: EntityForm = {
  name: "",
  entity_type: "country",
  region: "",
  latitude: "",
  longitude: "",
  timezone: "",
  flag_emoji: "",
  notes: "",
};

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-2xl font-bold">{value}</p>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AdminMundaneEntitiesPage() {
  const [entities, setEntities] = useState<MundaneEntity[]>([]);
  const [stats, setStats] = useState<Stats>({ totalEntities: 0, activeCount: 0, typeCounts: {} });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EntityForm>(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  async function fetchEntities(p: number, replace: boolean, overrides?: { search?: string; entityType?: string }) {
    if (p === 1) setLoading(true);
    else setLoadingMore(true);

    const s = overrides?.search ?? search;
    const et = overrides?.entityType ?? entityType;

    const params = new URLSearchParams({ page: String(p) });
    if (s) params.set("search", s);
    if (et) params.set("entity_type", et);

    const res = await fetch(`/api/admin/mundane-entities?${params}`);
    if (res.ok) {
      const json = await res.json();
      setEntities((prev) => replace ? json.entities : [...prev, ...json.entities]);
      setHasMore(json.hasMore);
      setPage(p);
      if (p === 1) setStats(json.stats);
    }
    setLoading(false);
    setLoadingMore(false);
  }

  useEffect(() => { fetchEntities(1, true); }, []);

  function applyFilter(key: "search" | "entityType", value: string) {
    if (key === "entityType") setEntityType(value);
    fetchEntities(1, true, { search, entityType, [key]: value });
  }

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(e: MundaneEntity) {
    setEditingId(e.id);
    setForm({
      name: e.name,
      entity_type: e.entity_type,
      region: e.region ?? "",
      latitude: "",
      longitude: "",
      timezone: "",
      flag_emoji: e.flag_emoji ?? "",
      notes: "",
    });
    setFormError("");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { setFormError("Name is required."); return; }
    setSaving(true);
    setFormError("");

    const payload = {
      name: form.name.trim(),
      entity_type: form.entity_type,
      region: form.region.trim() || null,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      timezone: form.timezone.trim() || null,
      flag_emoji: form.flag_emoji.trim() || null,
      notes: form.notes.trim() || null,
    };

    const url = editingId
      ? `/api/admin/mundane-entities/${editingId}`
      : "/api/admin/mundane-entities";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setDialogOpen(false);
      fetchEntities(1, true);
    } else {
      const json = await res.json();
      setFormError(json.error ?? "Failed to save.");
    }
    setSaving(false);
  }

  async function handleSoftDelete(id: string) {
    const res = await fetch(`/api/admin/mundane-entities/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEntities((prev) => prev.filter((e) => e.id !== id));
      setStats((s) => ({ ...s, totalEntities: s.totalEntities - 1, activeCount: s.activeCount - 1 }));
    }
  }

  const topTypes = Object.entries(stats.typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Entity Registry</h1>
          <p className="text-muted-foreground">Countries, cities, markets, and institutions under mundane watch.</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="mr-1.5 size-4" /> Add Entity
        </Button>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3">
        <StatCard label="Total Entities" value={stats.totalEntities} />
        <StatCard label="Active" value={stats.activeCount} />
        {topTypes.map(([type, cnt]) => (
          <StatCard key={type} label={type.charAt(0).toUpperCase() + type.slice(1)} value={cnt} />
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Input
            placeholder="Search name or region…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") fetchEntities(1, true); }}
          />
        </div>
        <select
          value={entityType}
          onChange={(e) => applyFilter("entityType", e.target.value)}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="">All Types</option>
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <Button size="sm" variant="outline" onClick={() => fetchEntities(1, true)}>
          Search
        </Button>
      </div>

      {/* Entity list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : entities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Building2 className="size-10 text-muted-foreground/40" />
            <p className="font-medium">No entities found</p>
            <p className="text-sm text-muted-foreground">Add countries, markets, and institutions to track.</p>
            <Button size="sm" onClick={openAdd}><Plus className="mr-1.5 size-4" /> Add Entity</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {entities.map((entity) => (
            <div key={entity.id} className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
              {entity.flag_emoji && (
                <span className="text-2xl shrink-0">{entity.flag_emoji}</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/mundane-entities/${entity.id}`} className="font-semibold hover:underline">
                    {entity.name}
                  </Link>
                  <Badge variant="outline" className="text-xs capitalize">{entity.entity_type}</Badge>
                  {!entity.is_active && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  {entity.region && <span>{entity.region}</span>}
                  <span>{entity.chart_count} chart{entity.chart_count !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/admin/mundane-entities/${entity.id}`}>
                    <ChevronRight className="size-3.5" />
                    <span className="sr-only">View</span>
                  </Link>
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(entity)}>
                  <Pencil className="size-3.5" />
                  <span className="sr-only">Edit</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                      <Trash2 className="size-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Deactivate entity?</AlertDialogTitle>
                      <AlertDialogDescription>
                        &ldquo;{entity.name}&rdquo; will be marked inactive. Associated charts are preserved.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleSoftDelete(entity.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Deactivate
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={() => fetchEntities(page + 1, false)} disabled={loadingMore}>
                {loadingMore && <Loader2 className="mr-2 size-4 animate-spin" />}
                Load More
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Entity" : "Add Entity"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. United States"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Type *</label>
              <select
                value={form.entity_type}
                onChange={(e) => setForm((f) => ({ ...f, entity_type: e.target.value }))}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {ENTITY_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Region</label>
              <Input
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                placeholder="e.g. North America"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Latitude</label>
                <Input
                  value={form.latitude}
                  onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                  placeholder="e.g. 38.9072"
                  type="number"
                  step="any"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Longitude</label>
                <Input
                  value={form.longitude}
                  onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                  placeholder="e.g. -77.0369"
                  type="number"
                  step="any"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Timezone</label>
              <Input
                value={form.timezone}
                onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                placeholder="e.g. America/New_York"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Flag Emoji</label>
              <Input
                value={form.flag_emoji}
                onChange={(e) => setForm((f) => ({ ...f, flag_emoji: e.target.value }))}
                placeholder="e.g. 🇺🇸"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Internal notes…"
                rows={2}
                className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground resize-none"
              />
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editingId ? "Save Changes" : "Add Entity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
