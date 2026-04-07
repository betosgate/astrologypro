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
import { ArrowLeft, Pencil, Loader2, MapPin, Star, CalendarDays, BarChart2, FileText, StickyNote, BookOpen, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { MundaneNatalChart } from "@/components/admin/mundane-natal-chart";

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
  natal_chart_data: Record<string, unknown> | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_lat: number | null;
  birth_lon: number | null;
  birth_data_confidence: string | null;
};

type EntityChart = {
  id: string;
  chart_title: string;
  chart_type: string;
  event_date: string;
  event_time: string | null;
  timezone: string | null;
  is_primary: boolean;
  chart_url: string | null;
};

type MundaneEvent = {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
  is_forecast: boolean;
  forecast_confidence: string | null;
};

type MundaneForecast = {
  id: string;
  title: string;
  forecast_period_start: string;
  forecast_period_end: string | null;
  outcome_status: string;
  confidence_level: string | null;
};

type EditForm = {
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

// entity_type badge colors
const ENTITY_TYPE_BADGE: Record<string, string> = {
  country: "bg-blue-100 text-blue-700 border-blue-200",
  leader: "bg-purple-100 text-purple-700 border-purple-200",
  market: "bg-green-100 text-green-700 border-green-200",
  city: "bg-sky-100 text-sky-700 border-sky-200",
  institution: "bg-indigo-100 text-indigo-700 border-indigo-200",
  commodity: "bg-amber-100 text-amber-700 border-amber-200",
  organization: "bg-violet-100 text-violet-700 border-violet-200",
};

// Birth confidence badge colors
const BIRTH_CONFIDENCE_BADGE: Record<string, string> = {
  AA: "bg-green-100 text-green-700 border-green-200",
  A: "bg-teal-100 text-teal-700 border-teal-200",
  B: "bg-yellow-100 text-yellow-700 border-yellow-200",
  C: "bg-orange-100 text-orange-700 border-orange-200",
  X: "bg-red-100 text-red-700 border-red-200",
};

const OUTCOME_BADGE: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 border-blue-200",
  confirmed: "bg-green-100 text-green-700 border-green-200",
  partially_confirmed: "bg-teal-100 text-teal-700 border-teal-200",
  invalidated: "bg-red-100 text-red-700 border-red-200",
  expired: "bg-gray-100 text-gray-600 border-gray-200",
};

const CONFIDENCE_BADGE: Record<string, string> = {
  high: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-orange-100 text-orange-700 border-orange-200",
  speculative: "bg-gray-100 text-gray-600 border-gray-200",
};

type DetailTab = "overview" | "chart_data" | "events" | "forecasts" | "notes";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
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
  const [events, setEvents] = useState<MundaneEvent[]>([]);
  const [forecasts, setForecasts] = useState<MundaneForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [calculating, setCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "", entity_type: "country", region: "", latitude: "", longitude: "", timezone: "", flag_emoji: "", notes: "",
  });
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/mundane/entities/${id}`);
    if (res.status === 404) { setNotFound(true); setLoading(false); return; }
    if (res.ok) {
      const json = await res.json();
      setEntity(json.entity);
      setCharts(json.charts ?? []);
      setEvents(json.events ?? []);
    }
    setLoading(false);
  }

  async function loadForecasts() {
    const res = await fetch(`/api/admin/mundane/forecasts?entity_id=${id}&page=1`);
    if (res.ok) {
      const json = await res.json();
      setForecasts(json.forecasts ?? []);
    }
  }

  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    if (activeTab === "forecasts") loadForecasts();
  }, [activeTab]);

  function openEdit() {
    if (!entity) return;
    setEditForm({
      name: entity.name,
      entity_type: entity.entity_type,
      region: entity.region ?? "",
      latitude: entity.latitude != null ? String(entity.latitude) : "",
      longitude: entity.longitude != null ? String(entity.longitude) : "",
      timezone: entity.timezone ?? "",
      flag_emoji: entity.flag_emoji ?? "",
      notes: entity.notes ?? "",
    });
    setEditError("");
    setEditOpen(true);
  }

  async function handleSave() {
    if (!editForm.name.trim()) { setEditError("Name is required."); return; }
    setSaving(true);
    setEditError("");

    const payload = {
      name: editForm.name.trim(),
      entity_type: editForm.entity_type,
      region: editForm.region.trim() || null,
      latitude: editForm.latitude ? parseFloat(editForm.latitude) : null,
      longitude: editForm.longitude ? parseFloat(editForm.longitude) : null,
      timezone: editForm.timezone.trim() || null,
      flag_emoji: editForm.flag_emoji.trim() || null,
      notes: editForm.notes.trim() || null,
    };

    const res = await fetch(`/api/admin/mundane/entities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setEditOpen(false);
      load();
    } else {
      const json = await res.json();
      setEditError(json.detail ?? json.error ?? "Failed to save.");
    }
    setSaving(false);
  }

  async function handleCalculateChart() {
    setCalculating(true);
    try {
      const res = await fetch(`/api/admin/mundane/entities/${id}/calculate-chart`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Chart calculated successfully");
        load();
        setActiveTab("chart_data");
      } else {
        const json = await res.json();
        toast.error(json.detail ?? json.title ?? "Chart calculation failed");
      }
    } catch {
      toast.error("Network error — could not calculate chart");
    } finally {
      setCalculating(false);
    }
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
        <Link href="/admin/mundane" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back
        </Link>
        <p className="text-muted-foreground">Entity not found.</p>
      </div>
    );
  }

  const DETAIL_TABS: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <FileText className="size-3.5" /> },
    { id: "chart_data", label: "Chart Data", icon: <BarChart2 className="size-3.5" /> },
    { id: "events", label: `Events${events.length > 0 ? ` (${events.length})` : ""}`, icon: <CalendarDays className="size-3.5" /> },
    { id: "forecasts", label: "Forecasts", icon: <BookOpen className="size-3.5" /> },
    { id: "notes", label: "Notes", icon: <StickyNote className="size-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/admin/mundane" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Mundane
      </Link>

      {/* Entity header card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              {entity.flag_emoji && <span className="text-3xl">{entity.flag_emoji}</span>}
              <div>
                <CardTitle className="text-xl">{entity.name}</CardTitle>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className={`capitalize ${ENTITY_TYPE_BADGE[entity.entity_type] ?? ""}`}
                  >
                    {entity.entity_type}
                  </Badge>
                  {entity.birth_data_confidence && (
                    <Badge
                      variant="outline"
                      className={`font-semibold ${BIRTH_CONFIDENCE_BADGE[entity.birth_data_confidence] ?? ""}`}
                    >
                      {entity.birth_data_confidence}
                    </Badge>
                  )}
                  {/* Natal chart indicator */}
                  {entity.natal_chart_data ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle2 className="size-3.5" /> Chart calculated
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">No chart yet</span>
                  )}
                  {!entity.is_active && <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>}
                </div>
              </div>
            </div>
            {/* Prominent Calculate Chart button */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleCalculateChart}
                disabled={calculating}
                className={entity.natal_chart_data ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
              >
                {calculating ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <BarChart2 className="mr-1.5 size-3.5" />
                )}
                {entity.natal_chart_data ? "Recalculate Chart" : "Calculate Chart"}
              </Button>
              <Button size="sm" variant="outline" onClick={openEdit}>
                <Pencil className="mr-1.5 size-3.5" /> Edit
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tab navigation */}
      <div className="border-b">
        <div className="flex gap-0 flex-wrap">
          {DETAIL_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.id
                  ? "border-amber-500 text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2 text-sm pt-4">
            {entity.region && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-3.5" />
                <span>{entity.region}</span>
              </div>
            )}
            {entity.latitude != null && entity.longitude != null && (
              <div className="text-muted-foreground">
                {entity.latitude}, {entity.longitude}
              </div>
            )}
            {entity.timezone && (
              <div className="text-muted-foreground">{entity.timezone}</div>
            )}
            {entity.birth_date && (
              <div className="text-muted-foreground">
                Founded / Birth date: {formatDate(entity.birth_date)}
                {entity.birth_time ? ` at ${entity.birth_time}` : ""}
              </div>
            )}
            <div className="text-xs text-muted-foreground sm:col-span-2">
              Added {formatDate(entity.created_at)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart Data tab */}
      {activeTab === "chart_data" && (
        <div className="space-y-4">
          {/* Natal chart visualization */}
          <MundaneNatalChart natalChartData={entity.natal_chart_data ?? null} />

          {/* Associated Charts list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Associated Charts</h3>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/admin/mundane-entities/${id}`}>Manage in Registry</Link>
              </Button>
            </div>
            {charts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No charts associated yet.</p>
            ) : (
              <div className="space-y-2">
                {charts.map((c) => (
                  <div key={c.id} className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3 text-sm">
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Events tab */}
      {activeTab === "events" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Linked Events</h3>
            <Button size="sm" asChild>
              <Link href={`/admin/mundane/events/new?entity_id=${id}`}>
                <CalendarDays className="mr-1.5 size-3.5" /> Add Event
              </Link>
            </Button>
          </div>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events linked yet.</p>
          ) : (
            <div className="space-y-2">
              {events.map((ev) => (
                <div key={ev.id} className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{ev.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">{ev.event_type}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(ev.event_date)}</span>
                      {ev.is_forecast && (
                        <Badge variant="outline" className="text-xs text-violet-600 border-violet-200 bg-violet-50">Forecast</Badge>
                      )}
                      {ev.forecast_confidence && (
                        <Badge variant="outline" className={`text-xs capitalize ${CONFIDENCE_BADGE[ev.forecast_confidence] ?? ""}`}>
                          {ev.forecast_confidence}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Forecasts tab */}
      {activeTab === "forecasts" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Entity Forecasts</h3>
            <Button size="sm" asChild>
              <Link href={`/admin/mundane/forecasts/new?entity_id=${id}`}>
                <BookOpen className="mr-1.5 size-3.5" /> New Forecast
              </Link>
            </Button>
          </div>
          {forecasts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No forecasts for this entity yet.</p>
          ) : (
            <div className="space-y-2">
              {forecasts.map((fc) => (
                <div key={fc.id} className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{fc.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(fc.forecast_period_start)}
                        {fc.forecast_period_end && ` – ${formatDate(fc.forecast_period_end)}`}
                      </span>
                      {fc.confidence_level && (
                        <Badge variant="outline" className={`text-xs capitalize ${CONFIDENCE_BADGE[fc.confidence_level] ?? ""}`}>
                          {fc.confidence_level}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs capitalize shrink-0 ${OUTCOME_BADGE[fc.outcome_status] ?? ""}`}
                  >
                    {fc.outcome_status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes tab */}
      {activeTab === "notes" && (
        <Card>
          <CardContent className="pt-4">
            {entity.notes ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{entity.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No notes for this entity.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Entity</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Type *</label>
              <select
                value={editForm.entity_type}
                onChange={(e) => setEditForm((f) => ({ ...f, entity_type: e.target.value }))}
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
                value={editForm.region}
                onChange={(e) => setEditForm((f) => ({ ...f, region: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Latitude</label>
                <Input
                  type="number"
                  step="any"
                  value={editForm.latitude}
                  onChange={(e) => setEditForm((f) => ({ ...f, latitude: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Longitude</label>
                <Input
                  type="number"
                  step="any"
                  value={editForm.longitude}
                  onChange={(e) => setEditForm((f) => ({ ...f, longitude: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Timezone</label>
              <Input
                value={editForm.timezone}
                onChange={(e) => setEditForm((f) => ({ ...f, timezone: e.target.value }))}
                placeholder="e.g. America/New_York"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Flag Emoji</label>
              <Input
                value={editForm.flag_emoji}
                onChange={(e) => setEditForm((f) => ({ ...f, flag_emoji: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground resize-none"
              />
            </div>
            {editError && <p className="text-sm text-destructive">{editError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
