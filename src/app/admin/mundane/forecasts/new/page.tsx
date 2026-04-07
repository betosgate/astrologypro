"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

type EntityOption = { id: string; name: string; flag_emoji: string | null };

const CONFIDENCE_LEVELS = ["high", "medium", "low", "speculative"] as const;

const EVENT_CATEGORIES = [
  "political_instability",
  "elections",
  "conflict",
  "economic",
  "weather",
  "natural_disaster",
  "health",
  "technology",
  "social",
  "geopolitical",
  "market",
  "other",
] as const;

type ForecastForm = {
  title: string;
  entity_id: string;
  forecast_period_start: string;
  forecast_period_end: string;
  astrology_basis: string;
  narrative_summary: string;
  event_categories: string[];
  confidence_level: string;
  is_public: boolean;
};

const EMPTY_FORM: ForecastForm = {
  title: "",
  entity_id: "",
  forecast_period_start: "",
  forecast_period_end: "",
  astrology_basis: "",
  narrative_summary: "",
  event_categories: [],
  confidence_level: "",
  is_public: false,
};

export default function AdminForecastNewPage() {
  const router = useRouter();
  const [form, setForm] = useState<ForecastForm>(EMPTY_FORM);
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/mundane/entities?page=1")
      .then((r) => r.json())
      .then((json) => setEntities(json.entities ?? []))
      .catch(() => {});
  }, []);

  function toggleCategory(cat: string) {
    setForm((f) => ({
      ...f,
      event_categories: f.event_categories.includes(cat)
        ? f.event_categories.filter((c) => c !== cat)
        : [...f.event_categories, cat],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.forecast_period_start) { setError("Forecast start date is required."); return; }
    if (!form.astrology_basis.trim()) { setError("Astrology basis is required."); return; }
    if (!form.narrative_summary.trim()) { setError("Narrative summary is required."); return; }
    setSaving(true);
    setError("");

    const payload = {
      title: form.title.trim(),
      entity_id: form.entity_id || null,
      forecast_period_start: form.forecast_period_start,
      forecast_period_end: form.forecast_period_end || null,
      astrology_basis: form.astrology_basis.trim(),
      narrative_summary: form.narrative_summary.trim(),
      event_categories: form.event_categories,
      confidence_level: form.confidence_level || null,
      is_public: form.is_public,
    };

    const res = await fetch("/api/admin/mundane/forecasts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/admin/mundane/forecasts");
    } else {
      const json = await res.json();
      setError(json.detail ?? json.error ?? "Failed to create forecast.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <Link
        href="/admin/mundane/forecasts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Forecasts
      </Link>

      <div>
        <h1 className="text-2xl font-bold">New Forecast</h1>
        <p className="text-muted-foreground">Record a structured astrological prediction with outcome tracking.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Forecast Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Political instability in Europe — Jupiter square Pluto"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Related Entity</label>
              <select
                value={form.entity_id}
                onChange={(e) => setForm((f) => ({ ...f, entity_id: e.target.value }))}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">— None —</option>
                {entities.map((en) => (
                  <option key={en.id} value={en.id}>
                    {en.flag_emoji ? `${en.flag_emoji} ` : ""}{en.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Forecast Start *</label>
                <Input
                  type="date"
                  value={form.forecast_period_start}
                  onChange={(e) => setForm((f) => ({ ...f, forecast_period_start: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Forecast End</label>
                <Input
                  type="date"
                  value={form.forecast_period_end}
                  onChange={(e) => setForm((f) => ({ ...f, forecast_period_end: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Confidence Level</label>
              <select
                value={form.confidence_level}
                onChange={(e) => setForm((f) => ({ ...f, confidence_level: e.target.value }))}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">— Select —</option>
                {CONFIDENCE_LEVELS.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Astrological Basis *</label>
              <textarea
                value={form.astrology_basis}
                onChange={(e) => setForm((f) => ({ ...f, astrology_basis: e.target.value }))}
                placeholder="Which planetary indicators, transits, or ingresses trigger this forecast…"
                rows={3}
                className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Narrative Summary *</label>
              <textarea
                value={form.narrative_summary}
                onChange={(e) => setForm((f) => ({ ...f, narrative_summary: e.target.value }))}
                placeholder="Describe the predicted events or conditions…"
                rows={4}
                className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Event Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Select all categories that apply.</p>
            <div className="flex flex-wrap gap-2">
              {EVENT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    form.event_categories.includes(cat)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-input text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Visibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_public"
                checked={form.is_public}
                onChange={(e) => setForm((f) => ({ ...f, is_public: e.target.checked }))}
                className="rounded border-input"
              />
              <label htmlFor="is_public" className="text-sm font-medium">Publish to community members</label>
            </div>
            <p className="text-xs text-muted-foreground mt-1">When unchecked, forecast is admin-only.</p>
          </CardContent>
        </Card>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 mt-4">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create Forecast
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/mundane/forecasts">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
