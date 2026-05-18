"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { TrendingUp, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type EntityOption = { id: string; name: string; flag_emoji: string | null };

type Forecast = {
  id: string;
  title: string;
  entity_id: string | null;
  forecast_type: string;
  forecast_period_start: string;
  forecast_period_end: string;
  signal_strength: string | null;
  is_published: boolean;
  created_at: string;
  mundane_entities: { name: string; flag_emoji: string | null } | null;
};

type ForecastForm = {
  title: string;
  entity_id: string;
  forecast_type: string;
  forecast_period_start: string;
  forecast_period_end: string;
  content: string;
  signal_strength: string;
  is_published: boolean;
};

const FORECAST_TYPES = ["political", "economic", "weather", "social", "market", "general"] as const;
const SIGNAL_STRENGTHS = ["low", "medium", "high", "critical"] as const;

const SIGNAL_BADGE: Record<string, string> = {
  low: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  critical: "bg-red-100 text-red-700 border-red-200",
};

const EMPTY_FORM: ForecastForm = {
  title: "",
  entity_id: "",
  forecast_type: "general",
  forecast_period_start: "",
  forecast_period_end: "",
  content: "",
  signal_strength: "",
  is_published: false,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminMundaneForecastsPage() {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);

  const [entityOptions, setEntityOptions] = useState<EntityOption[]>([]);

  const [filterType, setFilterType] = useState("");
  const [filterPublished, setFilterPublished] = useState("");
  const filtersRef = useRef({ filterType, filterPublished });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ForecastForm>(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const fetchForecasts = useCallback(async (
    p: number,
    replace: boolean,
    overrides?: { filterType?: string; filterPublished?: string }
  ) => {
    if (p === 1) setLoading(true);
    else setLoadingMore(true);

    const ft = overrides?.filterType ?? filtersRef.current.filterType;
    const fp = overrides?.filterPublished ?? filtersRef.current.filterPublished;

    const params = new URLSearchParams({ page: String(p) });
    if (ft) params.set("forecast_type", ft);
    if (fp) params.set("published", fp);

    const res = await fetch(`/api/admin/mundane-forecasts?${params}`);
    if (res.ok) {
      const json = await res.json();
      setForecasts((prev) => replace ? json.forecasts : [...prev, ...json.forecasts]);
      setTotal(json.total);
      setHasMore(json.hasMore);
      setPage(p);
    }
    setLoading(false);
    setLoadingMore(false);
  }, []);

  const loadEntityOptions = useCallback(async () => {
    const res = await fetch("/api/admin/mundane-entities?page=1");
    if (res.ok) {
      const json = await res.json();
      setEntityOptions(json.entities.map((e: { id: string; name: string; flag_emoji: string | null }) => ({
        id: e.id,
        name: e.name,
        flag_emoji: e.flag_emoji,
      })));
    }
  }, []);

  useEffect(() => {
    filtersRef.current = { filterType, filterPublished };
  }, [filterType, filterPublished]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      fetchForecasts(1, true);
      loadEntityOptions();
    });
    return () => {
      active = false;
    };
  }, [fetchForecasts, loadEntityOptions]);

  function applyFilter(key: "filterType" | "filterPublished", value: string) {
    const nextFilters = { ...filtersRef.current, [key]: value };
    if (key === "filterType") setFilterType(value);
    if (key === "filterPublished") setFilterPublished(value);
    filtersRef.current = nextFilters;
    fetchForecasts(1, true, nextFilters);
  }

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(f: Forecast) {
    setEditingId(f.id);
    setForm({
      title: f.title,
      entity_id: f.entity_id ?? "",
      forecast_type: f.forecast_type,
      forecast_period_start: f.forecast_period_start,
      forecast_period_end: f.forecast_period_end,
      content: "",
      signal_strength: f.signal_strength ?? "",
      is_published: f.is_published,
    });
    setFormError("");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) { setFormError("Title is required."); return; }
    if (!form.forecast_type) { setFormError("Forecast type is required."); return; }
    if (!form.forecast_period_start) { setFormError("Period start is required."); return; }
    if (!form.forecast_period_end) { setFormError("Period end is required."); return; }
    if (!editingId && !form.content.trim()) { setFormError("Content is required."); return; }
    setSaving(true);
    setFormError("");

    const payload = {
      title: form.title.trim(),
      entity_id: form.entity_id || null,
      forecast_type: form.forecast_type,
      forecast_period_start: form.forecast_period_start,
      forecast_period_end: form.forecast_period_end,
      content: form.content.trim() || undefined,
      signal_strength: form.signal_strength || null,
      is_published: form.is_published,
    };

    const url = editingId
      ? `/api/admin/mundane-forecasts/${editingId}`
      : "/api/admin/mundane-forecasts";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setDialogOpen(false);
      fetchForecasts(1, true);
    } else {
      const json = await res.json();
      setFormError(json.error ?? "Failed to save.");
    }
    setSaving(false);
  }

  async function togglePublish(forecast: Forecast) {
    const res = await fetch(`/api/admin/mundane-forecasts/${forecast.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !forecast.is_published }),
    });
    if (res.ok) {
      setForecasts((prev) =>
        prev.map((f) => f.id === forecast.id ? { ...f, is_published: !f.is_published } : f)
      );
    }
  }

  async function handleDelete(forecastId: string) {
    const res = await fetch(`/api/admin/mundane-forecasts/${forecastId}`, { method: "DELETE" });
    if (res.ok) {
      setForecasts((prev) => prev.filter((f) => f.id !== forecastId));
      setTotal((t) => t - 1);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mundane Forecasts</h1>
          <p className="text-muted-foreground">Manage published and draft forecasts by entity and type.</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="mr-1.5 size-4" /> Add Forecast
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filterType || "all"}
          onValueChange={(value) =>
            applyFilter("filterType", value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="w-[var(--radix-select-trigger-width)]">
            <SelectItem value="all">All Types</SelectItem>
            {FORECAST_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filterPublished || "all"}
          onValueChange={(value) =>
            applyFilter("filterPublished", value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="w-[var(--radix-select-trigger-width)]">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Published</SelectItem>
            <SelectItem value="false">Drafts</SelectItem>
          </SelectContent>
        </Select>
        {total > 0 && (
          <span className="text-sm text-muted-foreground">{total} forecast{total !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : forecasts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <TrendingUp className="size-10 text-muted-foreground/40" />
            <p className="font-medium">No forecasts found</p>
            <p className="text-sm text-muted-foreground">Create your first mundane forecast.</p>
            <Button size="sm" onClick={openAdd}><Plus className="mr-1.5 size-4" /> Add Forecast</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {forecasts.map((forecast) => (
            <div key={forecast.id} className="flex items-start gap-3 rounded-lg border bg-card p-3 shadow-sm">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{forecast.title}</span>
                  {forecast.mundane_entities && (
                    <span className="text-sm text-muted-foreground">
                      {forecast.mundane_entities.flag_emoji} {forecast.mundane_entities.name}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs capitalize">{forecast.forecast_type}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(forecast.forecast_period_start)} – {formatDate(forecast.forecast_period_end)}
                  </span>
                  {forecast.signal_strength && (
                    <Badge variant="outline" className={`text-xs capitalize ${SIGNAL_BADGE[forecast.signal_strength] ?? ""}`}>
                      {forecast.signal_strength}
                    </Badge>
                  )}
                  {!forecast.is_published && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">Draft</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant={forecast.is_published ? "secondary" : "outline"}
                  onClick={() => togglePublish(forecast)}
                >
                  {forecast.is_published ? "Unpublish" : "Publish"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(forecast)}>
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
                      <AlertDialogTitle>Delete forecast?</AlertDialogTitle>
                      <AlertDialogDescription>
                        &ldquo;{forecast.title}&rdquo; will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(forecast.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={() => fetchForecasts(page + 1, false)} disabled={loadingMore}>
                {loadingMore && <Loader2 className="mr-2 size-4 animate-spin" />}
                Load More
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Forecast" : "Add Forecast"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. US Political Climate Q2 2026"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Entity</label>
              <Select
                value={form.entity_id || "none"}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, entity_id: value === "none" ? "" : value }))
                }
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="none">No specific entity</SelectItem>
                  {entityOptions.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.flag_emoji ? `${entity.flag_emoji} ` : ""}{entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Type *</label>
                <Select
                  value={form.forecast_type}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, forecast_type: value }))
                  }
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--radix-select-trigger-width)]">
                    {FORECAST_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Signal Strength</label>
                <Select
                  value={form.signal_strength || "none"}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, signal_strength: value === "none" ? "" : value }))
                  }
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--radix-select-trigger-width)]">
                    <SelectItem value="none">None</SelectItem>
                    {SIGNAL_STRENGTHS.map((strength) => (
                      <SelectItem key={strength} value={strength}>
                        {strength.charAt(0).toUpperCase() + strength.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Period Start *</label>
                <Input
                  type="date"
                  value={form.forecast_period_start}
                  onChange={(e) => setForm((f) => ({ ...f, forecast_period_start: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Period End *</label>
                <Input
                  type="date"
                  value={form.forecast_period_end}
                  onChange={(e) => setForm((f) => ({ ...f, forecast_period_end: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            {!editingId && (
              <div>
                <label className="text-sm font-medium">Content *</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  rows={5}
                  placeholder="Write the forecast content…"
                  className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground resize-y"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                id="forecast_publish"
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                className="size-4"
              />
              <label htmlFor="forecast_publish" className="text-sm font-medium cursor-pointer">
                Publish immediately
              </label>
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editingId ? "Save Changes" : "Add Forecast"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
