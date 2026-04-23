"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FlaskConical, Loader2, X } from "lucide-react";

type EntityOption = { id: string; name: string; flag_emoji: string | null };

type BacktestForm = {
  name: string;
  hypothesis: string;
  description: string;
  date_range_start: string;
  date_range_end: string;
  entity_ids: string[];
};

const EMPTY_FORM: BacktestForm = {
  name: "",
  hypothesis: "",
  description: "",
  date_range_start: "",
  date_range_end: "",
  entity_ids: [],
};

export default function AdminMundaneBacktestNewPage() {
  const router = useRouter();
  const [form, setForm] = useState<BacktestForm>(EMPTY_FORM);
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [entitiesLoading, setEntitiesLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch entity list for multi-select
  useEffect(() => {
    async function loadEntities() {
      try {
        const res = await fetch("/api/mundane/entities?limit=200");
        if (res.ok) {
          const json = await res.json();
          setEntities(json.entities ?? []);
        }
      } catch {
        // non-fatal — user can proceed without entity filter
      } finally {
        setEntitiesLoading(false);
      }
    }
    loadEntities();
  }, []);

  function toggleEntity(id: string) {
    setForm((prev) => ({
      ...prev,
      entity_ids: prev.entity_ids.includes(id)
        ? prev.entity_ids.filter((e) => e !== id)
        : [...prev.entity_ids, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!form.hypothesis.trim()) { setError("Hypothesis is required."); return; }
    if (!form.date_range_start) { setError("Start date is required."); return; }
    if (!form.date_range_end) { setError("End date is required."); return; }
    if (form.date_range_start > form.date_range_end) {
      setError("Start date must be before end date.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/mundane/backtesting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          hypothesis: form.hypothesis.trim(),
          description: form.description.trim() || undefined,
          date_range_start: form.date_range_start,
          date_range_end: form.date_range_end,
          entity_ids: form.entity_ids.length > 0 ? form.entity_ids : undefined,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        router.push(`/admin/mundane/backtesting/${json.id}`);
      } else {
        setError(json.detail ?? json.error ?? "Failed to run backtest.");
        setSaving(false);
      }
    } catch {
      setError("Network error — please try again.");
      setSaving(false);
    }
  }

  const selectedEntityNames = entities
    .filter((e) => form.entity_ids.includes(e.id))
    .map((e) => e.name);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/mundane/backtesting"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Backtesting
      </Link>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FlaskConical className="size-6 text-violet-500" />
          New Backtest Run
        </h1>
        <p className="text-muted-foreground mt-1">
          Define a hypothesis and date range to test against historical forecast outcomes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Run Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium">
                Run Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. 2024 US Election Forecast Accuracy"
                maxLength={150}
                required
              />
            </div>

            {/* Hypothesis */}
            <div className="space-y-1.5">
              <label htmlFor="hypothesis" className="text-sm font-medium">
                Hypothesis <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="hypothesis"
                value={form.hypothesis}
                onChange={(e) => setForm((p) => ({ ...p, hypothesis: e.target.value }))}
                placeholder="State the research hypothesis being tested..."
                rows={3}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Additional notes about this backtest..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Date Range</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="date_range_start" className="text-sm font-medium">
                Start Date <span className="text-destructive">*</span>
              </label>
              <Input
                id="date_range_start"
                type="date"
                value={form.date_range_start}
                onChange={(e) => setForm((p) => ({ ...p, date_range_start: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="date_range_end" className="text-sm font-medium">
                End Date <span className="text-destructive">*</span>
              </label>
              <Input
                id="date_range_end"
                type="date"
                value={form.date_range_end}
                onChange={(e) => setForm((p) => ({ ...p, date_range_end: e.target.value }))}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Entity Filter{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (leave empty to test all entities)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Selected chips */}
            {form.entity_ids.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedEntityNames.map((name, i) => (
                  <Badge
                    key={form.entity_ids[i]}
                    variant="secondary"
                    className="gap-1 cursor-pointer"
                    onClick={() => toggleEntity(form.entity_ids[i])}
                  >
                    {name}
                    <X className="size-3" />
                  </Badge>
                ))}
              </div>
            )}

            {entitiesLoading ? (
              <p className="text-xs text-muted-foreground">Loading entities…</p>
            ) : (
              <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
                {entities.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3">No entities found.</p>
                ) : (
                  entities.map((entity) => {
                    const selected = form.entity_ids.includes(entity.id);
                    return (
                      <button
                        key={entity.id}
                        type="button"
                        onClick={() => toggleEntity(entity.id)}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          selected
                            ? "bg-violet-50 text-violet-700 font-medium"
                            : "hover:bg-muted/40"
                        }`}
                      >
                        {entity.flag_emoji && (
                          <span className="mr-1.5">{entity.flag_emoji}</span>
                        )}
                        {entity.name}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-destructive rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            {saving ? "Running Backtest…" : "Run Backtest"}
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/admin/mundane/backtesting">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
