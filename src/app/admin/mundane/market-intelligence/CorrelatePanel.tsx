"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, X, CheckCircle2, AlertCircle } from "lucide-react";

type DataSource = {
  id: string;
  name: string;
  source_type: string;
};

type CorrelationResult = {
  id: string;
  astro_event_type: string;
  planet: string | null;
  correlation_coefficient: number | null;
  sample_count: number | null;
  date_range_start: string | null;
  date_range_end: string | null;
  significance_level: number | null;
  notes: string | null;
  computed_at: string;
};

const ASTRO_EVENT_TYPES = [
  "historical",
  "forecast",
  "ingress",
  "eclipse",
  "return",
  "transit_hit",
  "election",
  "conflict",
  "economic",
  "weather",
  "other",
] as const;

const PLANETS = [
  "Sun", "Moon", "Mercury", "Venus", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
  "North Node", "South Node", "Chiron",
];

type Props = {
  sources: DataSource[];
  onClose: () => void;
  onSuccess: (result: CorrelationResult) => void;
};

export default function CorrelatePanel({ sources, onClose, onSuccess }: Props) {
  const [sourceId, setSourceId] = useState(sources[0]?.id ?? "");
  const [astroEventType, setAstroEventType] = useState<string>(ASTRO_EVENT_TYPES[0]);
  const [planet, setPlanet] = useState("");
  const [dateStart, setDateStart] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split("T")[0];
  });
  const [dateEnd, setDateEnd] = useState(() => new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CorrelationResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/mundane/market-intelligence/correlate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_id: sourceId,
          astro_event_type: astroEventType,
          planet: planet || undefined,
          date_range_start: dateStart,
          date_range_end: dateEnd,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.detail ?? json.title ?? "Computation failed");
        return;
      }

      const corr = json.correlation as CorrelationResult;
      setResult(corr);
      onSuccess(corr);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  function coeffColor(c: number | null): string {
    if (c === null) return "text-muted-foreground";
    if (c > 0.5) return "text-green-600 font-bold";
    if (c < -0.5) return "text-red-600 font-bold";
    return "text-gray-500";
  }

  return (
    <Card className="border-2 border-violet-200 bg-violet-50/30">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Compute Astrological Correlation</h3>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {result ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="size-4" />
              <span className="text-sm font-medium">Correlation computed</span>
            </div>
            <div className="rounded-lg border bg-white p-3 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coefficient</span>
                <span className={coeffColor(result.correlation_coefficient)}>
                  {result.correlation_coefficient?.toFixed(4) ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sample size</span>
                <span>{result.sample_count ?? 0} event dates with data</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coverage</span>
                <span>
                  {result.significance_level !== null
                    ? `${(result.significance_level * 100).toFixed(0)}%`
                    : "—"}
                </span>
              </div>
              {result.notes && (
                <p className="text-xs text-muted-foreground pt-1 border-t">{result.notes}</p>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setResult(null);
                setError(null);
              }}
              className="w-full"
            >
              Compute Another
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Data Source */}
            <div className="space-y-1">
              <Label htmlFor="cp-source" className="text-xs">
                Data Source
              </Label>
              <select
                id="cp-source"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Astro Event Type */}
            <div className="space-y-1">
              <Label htmlFor="cp-event-type" className="text-xs">
                Astro Event Type
              </Label>
              <select
                id="cp-event-type"
                value={astroEventType}
                onChange={(e) => setAstroEventType(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                {ASTRO_EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Planet (optional) */}
            <div className="space-y-1">
              <Label htmlFor="cp-planet" className="text-xs">
                Planet{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <select
                id="cp-planet"
                value={planet}
                onChange={(e) => setPlanet(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Any planet</option>
                {PLANETS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="cp-date-start" className="text-xs">
                  From
                </Label>
                <Input
                  id="cp-date-start"
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cp-date-end" className="text-xs">
                  To
                </Label>
                <Input
                  id="cp-date-end"
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="text-sm"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" size="sm" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Computing…
                </>
              ) : (
                "Compute Correlation"
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

// Re-export badge helper for use in parent
export function SourceTypeBadge({ type }: { type: string }) {
  const MAP: Record<string, string> = {
    market: "bg-blue-100 text-blue-700 border-blue-200",
    weather: "bg-sky-100 text-sky-700 border-sky-200",
    agriculture: "bg-green-100 text-green-700 border-green-200",
    social: "bg-orange-100 text-orange-700 border-orange-200",
    news: "bg-yellow-100 text-yellow-700 border-yellow-200",
    custom: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium capitalize ${MAP[type] ?? MAP.custom}`}
    >
      {type}
    </Badge>
  );
}
