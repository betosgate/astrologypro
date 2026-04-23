"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

const EVENT_TYPES = [
  "historical", "forecast", "ingress", "eclipse", "return", "transit_hit",
  "election", "conflict", "economic", "weather", "other",
] as const;

const CONFIDENCE_LEVELS = ["high", "medium", "low", "speculative"] as const;

type EntityOption = { id: string; name: string; flag_emoji: string | null };

type EventForm = {
  title: string;
  event_type: string;
  event_date: string;
  event_time: string;
  description: string;
  location: string;
  primary_entity_id: string;
  is_forecast: boolean;
  forecast_confidence: string;
  source: string;
  tags: string;
  is_public: boolean;
};

const EMPTY_FORM: EventForm = {
  title: "",
  event_type: "historical",
  event_date: "",
  event_time: "",
  description: "",
  location: "",
  primary_entity_id: "",
  is_forecast: false,
  forecast_confidence: "",
  source: "",
  tags: "",
  is_public: false,
};

function NewEventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedEntityId = searchParams.get("entity_id") ?? "";

  const [form, setForm] = useState<EventForm>({ ...EMPTY_FORM, primary_entity_id: preselectedEntityId });
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/mundane/entities?page=1").then((r) => {
      if (r.ok) r.json().then((j) => setEntities(j.entities ?? []));
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.event_date) { setError("Event date is required."); return; }
    setSaving(true);
    setError("");

    const tagsArray = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: form.title.trim(),
      event_type: form.event_type,
      description: form.description.trim() || null,
      event_date: form.event_date,
      event_time: form.event_time || null,
      location: form.location.trim() || null,
      primary_entity_id: form.primary_entity_id || null,
      is_forecast: form.is_forecast,
      forecast_confidence: form.is_forecast ? (form.forecast_confidence || null) : null,
      source: form.source.trim() || null,
      tags: tagsArray,
      is_public: form.is_public,
    };

    const res = await fetch("/api/admin/mundane/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/admin/mundane?tab=events");
    } else {
      const json = await res.json();
      setError(json.detail ?? json.error ?? "Failed to create event.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/mundane" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Mundane
      </Link>

      <div>
        <h1 className="text-2xl font-bold">New Mundane Event</h1>
        <p className="text-muted-foreground">Add a historical event, forecast, ingress, eclipse, or transit hit.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Saturn Ingress Aries 2026"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Event Type *</label>
              <select
                value={form.event_type}
                onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value }))}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace("_", " ")}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Event Date *</label>
                <Input
                  type="date"
                  value={form.event_date}
                  onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Event Time</label>
                <Input
                  type="time"
                  value={form.event_time}
                  onChange={(e) => setForm((f) => ({ ...f, event_time: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What happened or what is predicted…"
                rows={3}
                className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Location</label>
              <Input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Washington DC, USA"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Primary Entity</label>
              <select
                value={form.primary_entity_id}
                onChange={(e) => setForm((f) => ({ ...f, primary_entity_id: e.target.value }))}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">— No specific entity —</option>
                {entities.map((en) => (
                  <option key={en.id} value={en.id}>
                    {en.flag_emoji ? `${en.flag_emoji} ` : ""}{en.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Forecast Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                id="is_forecast"
                type="checkbox"
                checked={form.is_forecast}
                onChange={(e) => setForm((f) => ({ ...f, is_forecast: e.target.checked }))}
                className="size-4"
              />
              <label htmlFor="is_forecast" className="text-sm font-medium cursor-pointer">
                This is a forecast (not a historical event)
              </label>
            </div>

            {form.is_forecast && (
              <div>
                <label className="text-sm font-medium">Forecast Confidence</label>
                <select
                  value={form.forecast_confidence}
                  onChange={(e) => setForm((f) => ({ ...f, forecast_confidence: e.target.value }))}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">— Select —</option>
                  {CONFIDENCE_LEVELS.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Source</label>
              <Input
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                placeholder="e.g. Skyscript, Astrodatabank, personal research"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Tags</label>
              <Input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="comma-separated, e.g. eclipse, saturn, war"
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="is_public"
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => setForm((f) => ({ ...f, is_public: e.target.checked }))}
                className="size-4"
              />
              <label htmlFor="is_public" className="text-sm font-medium cursor-pointer">
                Publish publicly
              </label>
            </div>
          </CardContent>
        </Card>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 mt-4">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create Event
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/mundane">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function AdminMundaneEventNewPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <NewEventForm />
    </Suspense>
  );
}
