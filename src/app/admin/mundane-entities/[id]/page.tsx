"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, MapPin, Star } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type EntityDetail = {
  id: string;
  name: string;
  entity_type: string;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  flag_emoji: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

type EntityChart = {
  id: string;
  entity_id: string;
  chart_title: string;
  chart_type: string;
  event_date: string;
  event_time: string | null;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  chart_url: string | null;
  is_primary: boolean;
  created_at: string;
};

type ChartForm = {
  chart_title: string;
  chart_type: string;
  event_date: string;
  event_time: string;
  timezone: string;
  latitude: string;
  longitude: string;
  notes: string;
  chart_url: string;
  is_primary: boolean;
};

const CHART_TYPES = [
  "independence", "constitution", "ingress", "lunation", "eclipse", "transit", "event", "other",
] as const;

const EMPTY_CHART_FORM: ChartForm = {
  chart_title: "",
  chart_type: "event",
  event_date: "",
  event_time: "",
  timezone: "",
  latitude: "",
  longitude: "",
  notes: "",
  chart_url: "",
  is_primary: false,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AdminMundaneEntityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [entity, setEntity] = useState<EntityDetail | null>(null);
  const [charts, setCharts] = useState<EntityChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChartId, setEditingChartId] = useState<string | null>(null);
  const [chartForm, setChartForm] = useState<ChartForm>(EMPTY_CHART_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadEntity() {
    setLoading(true);
    const res = await fetch(`/api/admin/mundane-entities/${id}`);
    if (res.status === 404) { setNotFound(true); setLoading(false); return; }
    if (res.ok) {
      const json = await res.json();
      setEntity(json.entity);
      setCharts(json.charts);
    }
    setLoading(false);
  }

  useEffect(() => { loadEntity(); }, [id]);

  function openAddChart() {
    setEditingChartId(null);
    setChartForm(EMPTY_CHART_FORM);
    setFormError("");
    setDialogOpen(true);
  }

  function openEditChart(c: EntityChart) {
    setEditingChartId(c.id);
    setChartForm({
      chart_title: c.chart_title,
      chart_type: c.chart_type,
      event_date: c.event_date,
      event_time: c.event_time ?? "",
      timezone: c.timezone ?? "",
      latitude: c.latitude != null ? String(c.latitude) : "",
      longitude: c.longitude != null ? String(c.longitude) : "",
      notes: c.notes ?? "",
      chart_url: c.chart_url ?? "",
      is_primary: c.is_primary,
    });
    setFormError("");
    setDialogOpen(true);
  }

  async function handleSaveChart() {
    if (!chartForm.chart_title.trim()) { setFormError("Chart title is required."); return; }
    if (!chartForm.event_date) { setFormError("Event date is required."); return; }
    setSaving(true);
    setFormError("");

    const payload = {
      entity_id: id,
      chart_title: chartForm.chart_title.trim(),
      chart_type: chartForm.chart_type,
      event_date: chartForm.event_date,
      event_time: chartForm.event_time || null,
      timezone: chartForm.timezone.trim() || null,
      latitude: chartForm.latitude ? parseFloat(chartForm.latitude) : null,
      longitude: chartForm.longitude ? parseFloat(chartForm.longitude) : null,
      notes: chartForm.notes.trim() || null,
      chart_url: chartForm.chart_url.trim() || null,
      is_primary: chartForm.is_primary,
    };

    const url = editingChartId
      ? `/api/admin/mundane-entity-charts/${editingChartId}`
      : "/api/admin/mundane-entity-charts";
    const method = editingChartId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setDialogOpen(false);
      loadEntity();
    } else {
      const json = await res.json();
      setFormError(json.error ?? "Failed to save.");
    }
    setSaving(false);
  }

  async function handleDeleteChart(chartId: string) {
    const res = await fetch(`/api/admin/mundane-entity-charts/${chartId}`, { method: "DELETE" });
    if (res.ok) setCharts((prev) => prev.filter((c) => c.id !== chartId));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !entity) {
    return (
      <div className="space-y-4">
        <Link href="/admin/mundane-entities" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back
        </Link>
        <p className="text-muted-foreground">Entity not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/admin/mundane-entities" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Entity Registry
      </Link>

      {/* Entity info card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              {entity.flag_emoji && <span className="text-3xl">{entity.flag_emoji}</span>}
              <div>
                <CardTitle className="text-xl">{entity.name}</CardTitle>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="outline" className="capitalize">{entity.entity_type}</Badge>
                  {!entity.is_active && <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
          {entity.region && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-3.5" />
              <span>{entity.region}</span>
            </div>
          )}
          {(entity.latitude != null && entity.longitude != null) && (
            <div className="text-muted-foreground">
              <span>{entity.latitude}, {entity.longitude}</span>
            </div>
          )}
          {entity.timezone && (
            <div className="text-muted-foreground">{entity.timezone}</div>
          )}
          {entity.notes && (
            <div className="sm:col-span-2 text-muted-foreground">{entity.notes}</div>
          )}
          <div className="text-xs text-muted-foreground sm:col-span-2">
            Added {formatDate(entity.created_at)}
          </div>
        </CardContent>
      </Card>

      {/* Associated Charts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Associated Charts</h2>
          <Button size="sm" onClick={openAddChart}>
            <Plus className="mr-1.5 size-4" /> Add Chart
          </Button>
        </div>

        {charts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="font-medium">No charts yet</p>
              <p className="text-sm text-muted-foreground">Add the foundation chart (e.g. independence, constitution) or ingress charts for this entity.</p>
              <Button size="sm" onClick={openAddChart}><Plus className="mr-1.5 size-4" /> Add Chart</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {charts.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3 shadow-sm">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {c.is_primary && <Star className="size-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                    <span className="font-medium">{c.chart_title}</span>
                    <Badge variant="outline" className="text-xs capitalize">{c.chart_type}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>{formatDate(c.event_date)}</span>
                    {c.event_time && <span>{c.event_time}</span>}
                    {c.timezone && <span>{c.timezone}</span>}
                    {c.chart_url && (
                      <a href={c.chart_url} target="_blank" rel="noreferrer" className="hover:underline text-primary">
                        View Chart
                      </a>
                    )}
                  </div>
                  {c.notes && <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => openEditChart(c)}>
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
                        <AlertDialogTitle>Delete chart?</AlertDialogTitle>
                        <AlertDialogDescription>
                          &ldquo;{c.chart_title}&rdquo; will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteChart(c.id)}
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
          </div>
        )}
      </div>

      {/* Add/Edit Chart Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingChartId ? "Edit Chart" : "Add Chart"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Chart Title *</label>
              <Input
                value={chartForm.chart_title}
                onChange={(e) => setChartForm((f) => ({ ...f, chart_title: e.target.value }))}
                placeholder="e.g. US Independence Chart"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Chart Type *</label>
              <select
                value={chartForm.chart_type}
                onChange={(e) => setChartForm((f) => ({ ...f, chart_type: e.target.value }))}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {CHART_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Event Date *</label>
                <Input
                  type="date"
                  value={chartForm.event_date}
                  onChange={(e) => setChartForm((f) => ({ ...f, event_date: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Event Time</label>
                <Input
                  type="time"
                  value={chartForm.event_time}
                  onChange={(e) => setChartForm((f) => ({ ...f, event_time: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Timezone</label>
              <Input
                value={chartForm.timezone}
                onChange={(e) => setChartForm((f) => ({ ...f, timezone: e.target.value }))}
                placeholder="e.g. America/New_York"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Latitude</label>
                <Input
                  value={chartForm.latitude}
                  onChange={(e) => setChartForm((f) => ({ ...f, latitude: e.target.value }))}
                  type="number"
                  step="any"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Longitude</label>
                <Input
                  value={chartForm.longitude}
                  onChange={(e) => setChartForm((f) => ({ ...f, longitude: e.target.value }))}
                  type="number"
                  step="any"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Chart URL</label>
              <Input
                value={chartForm.chart_url}
                onChange={(e) => setChartForm((f) => ({ ...f, chart_url: e.target.value }))}
                placeholder="https://…"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={chartForm.notes}
                onChange={(e) => setChartForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground resize-none"
                placeholder="Optional notes…"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="is_primary"
                type="checkbox"
                checked={chartForm.is_primary}
                onChange={(e) => setChartForm((f) => ({ ...f, is_primary: e.target.checked }))}
                className="size-4"
              />
              <label htmlFor="is_primary" className="text-sm font-medium cursor-pointer">
                Mark as primary chart
              </label>
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSaveChart} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editingChartId ? "Save Changes" : "Add Chart"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
