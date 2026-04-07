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
import { ArrowLeft, Pencil, Loader2, MapPin, Star, CalendarDays } from "lucide-react";

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const CONFIDENCE_BADGE: Record<string, string> = {
  high: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-orange-100 text-orange-700 border-orange-200",
  speculative: "bg-gray-100 text-gray-600 border-gray-200",
};

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
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  useEffect(() => { load(); }, [id]);

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

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/admin/mundane" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Mundane
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
            <Button size="sm" variant="outline" onClick={openEdit}>
              <Pencil className="mr-1.5 size-3.5" /> Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
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

      {/* Linked Events */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Linked Events</h2>
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
