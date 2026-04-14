"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

type MatchResult = {
  historical_period_id: string;
  label: string;
  period_start: string;
  period_end: string;
  dominant_aspects: string[];
  dominant_planets: string[];
  outcome_description: string | null;
  tags: string[];
  similarity_score: number;
  matching_factors: string[];
};

// ─── Planet options ────────────────────────────────────────────────────────────

const PLANETS = [
  "Sun", "Moon", "Mercury", "Venus", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 0.6) return "bg-red-100 text-red-700 border-red-200";
  if (score >= 0.35) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-green-100 text-green-700 border-green-200";
}

function scoreBarColor(score: number): string {
  if (score >= 0.6) return "bg-red-500";
  if (score >= 0.35) return "bg-amber-500";
  return "bg-green-500";
}

function fmtPeriod(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HistoricalAnalogsFinder() {
  const [referenceDate, setReferenceDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [selectedPlanets, setSelectedPlanets] = useState<Set<string>>(
    () => new Set<string>(["Saturn", "Pluto"])
  );
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<MatchResult[] | null>(null);

  function togglePlanet(p: string) {
    setSelectedPlanets((prev) => {
      const next = new Set(prev);
      if (next.has(p)) {
        next.delete(p);
      } else {
        next.add(p);
      }
      return next;
    });
  }

  async function runSearch() {
    if (selectedPlanets.size === 0) {
      toast.error("Select at least one planet");
      return;
    }
    setLoading(true);
    setMatches(null);
    try {
      const res = await fetch("/api/mundane/historical-analogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference_date: referenceDate,
          planet_list: Array.from(selectedPlanets),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail ?? "Search failed");
        return;
      }
      const json = await res.json();
      setMatches(json.matches ?? []);
      if ((json.matches ?? []).length === 0) {
        toast.info("No analog matches found");
      }
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Input panel */}
      <Card className="border-violet-500/20 bg-violet-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Search className="size-4 text-violet-400" />
            Find Historical Analogs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Reference Date</label>
              <Input
                type="date"
                value={referenceDate}
                onChange={(e) => setReferenceDate(e.target.value)}
                className="w-44"
              />
            </div>
          </div>

          {/* Planet checkboxes */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Active Planets</p>
            <div className="flex flex-wrap gap-2">
              {PLANETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlanet(p)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                    selectedPlanets.has(p)
                      ? "border-violet-500 bg-violet-500/20 text-violet-300"
                      : "border-zinc-700 bg-transparent text-zinc-500 hover:border-zinc-500"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {selectedPlanets.size} planet{selectedPlanets.size !== 1 ? "s" : ""} selected
            </p>
          </div>

          <Button
            onClick={runSearch}
            disabled={loading || selectedPlanets.size === 0}
            size="sm"
            className="w-full sm:w-auto"
          >
            {loading ? (
              <><Loader2 className="size-4 animate-spin mr-1.5" />Searching…</>
            ) : (
              <><Search className="size-4 mr-1.5" />Find Analogs</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {matches !== null && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            Top Analog Matches
            <Badge variant="outline" className="text-xs">{matches.length} result{matches.length !== 1 ? "s" : ""}</Badge>
          </h3>

          {matches.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No historical periods matched the selected planets.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {matches.map((m, idx) => (
                <Card key={m.historical_period_id} className="border-zinc-800">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Rank badge */}
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <p className="font-semibold text-sm leading-tight">{m.label}</p>
                          <p className="text-xs text-muted-foreground">{fmtPeriod(m.period_start, m.period_end)}</p>

                          {/* Similarity bar */}
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-28 rounded-full bg-zinc-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${scoreBarColor(m.similarity_score)}`}
                                style={{ width: `${m.similarity_score * 100}%` }}
                              />
                            </div>
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {(m.similarity_score * 100).toFixed(0)}%
                            </span>
                          </div>

                          {/* Matching planets */}
                          {m.matching_factors.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {m.matching_factors.map((f) => (
                                <Badge key={f} variant="outline" className="text-[10px] capitalize border-violet-500/30 text-violet-400">
                                  {f}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Outcome */}
                          {m.outcome_description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{m.outcome_description}</p>
                          )}

                          {/* Tags */}
                          {m.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {m.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[10px] text-zinc-500">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Score badge */}
                      <Badge variant="outline" className={`shrink-0 text-xs font-semibold ${scoreColor(m.similarity_score)}`}>
                        {(m.similarity_score * 100).toFixed(0)}% match
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
