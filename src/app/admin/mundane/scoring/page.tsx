"use client";

import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Loader2, Plus, RefreshCw, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

type Entity = {
  id: string;
  name: string;
  entity_type: string;
  flag_emoji: string | null;
};

type StressScore = {
  id: string;
  entity_id: string;
  scoring_model_id: string;
  score_date: string;
  stress_score: number;
  contributing_factors: Array<{
    event_id: string;
    title: string;
    event_type: string;
    event_date: string;
    weight: number;
  }>;
  computed_at: string;
};

function scoreColor(score: number): string {
  if (score <= 3) return "bg-green-100 text-green-700 border-green-200";
  if (score <= 6) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
}

function scoreLabel(score: number): string {
  if (score <= 3) return "Low";
  if (score <= 6) return "Moderate";
  return "High";
}

function scoreBarColor(score: number): string {
  if (score <= 3) return "bg-green-500";
  if (score <= 6) return "bg-amber-500";
  return "bg-red-500";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ScoringPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [entitiesLoaded, setEntitiesLoaded] = useState(false);
  const [loadingEntities, setLoadingEntities] = useState(false);

  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [scores, setScores] = useState<StressScore[]>([]);
  const [loadingScores, setLoadingScores] = useState(false);
  const [computing, setComputing] = useState(false);

  // Compute form state
  const [computeDate, setComputeDate] = useState("");

  const loadEntities = useCallback(async () => {
    if (entitiesLoaded) return;
    setLoadingEntities(true);
    try {
      const res = await fetch("/api/mundane/entities?limit=50");
      if (res.ok) {
        const json = await res.json();
        setEntities(json.entities ?? []);
        setEntitiesLoaded(true);
      }
    } finally {
      setLoadingEntities(false);
    }
  }, [entitiesLoaded]);

  async function loadScores() {
    if (!selectedEntityId) {
      toast.error("Select an entity first");
      return;
    }
    setLoadingScores(true);
    try {
      const params = new URLSearchParams({ entity_id: selectedEntityId });
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/mundane/scoring?${params}`);
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail ?? "Failed to load scores");
        return;
      }
      const json = await res.json();
      setScores(json.scores ?? []);
    } finally {
      setLoadingScores(false);
    }
  }

  async function computeScore() {
    if (!selectedEntityId) { toast.error("Select an entity first"); return; }
    if (!computeDate) { toast.error("Enter a date to compute"); return; }
    setComputing(true);
    try {
      const res = await fetch("/api/mundane/scoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity_id: selectedEntityId, score_date: computeDate }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail ?? "Failed to compute score");
        return;
      }
      const newScore: StressScore = await res.json();
      toast.success(`Score computed: ${newScore.stress_score} for ${fmtDate(newScore.score_date)}`);
      // Refresh the list
      await loadScores();
    } finally {
      setComputing(false);
    }
  }

  const selectedEntity = entities.find((e) => e.id === selectedEntityId);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <BarChart3 className="size-6 text-violet-500" />
          <h1 className="text-2xl font-bold tracking-tight">Forecast Scoring Engine</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Compute and view stress scores for mundane entities based on nearby astrological events.
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Score Query</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {/* Entity selector */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Entity *</label>
              <Select
                value={selectedEntityId}
                onValueChange={setSelectedEntityId}
                onOpenChange={(open) => { if (open) loadEntities(); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingEntities ? "Loading…" : "Select entity"} />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.flag_emoji ? `${e.flag_emoji} ` : ""}{e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Date range */}
            <div className="space-y-1">
              <label className="text-xs font-medium">From date</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">To date</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadScores} disabled={loadingScores || !selectedEntityId} size="sm">
              {loadingScores ? (
                <><Loader2 className="size-4 animate-spin mr-1.5" />Loading…</>
              ) : (
                <><RefreshCw className="size-4 mr-1.5" />Load Scores</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Compute new score */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
            <Plus className="size-4 text-violet-500" />
            Compute Score for a Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="space-y-1 flex-1 max-w-xs">
              <label className="text-xs font-medium">Score date *</label>
              <Input
                type="date"
                value={computeDate}
                onChange={(e) => setComputeDate(e.target.value)}
              />
            </div>
            <Button
              onClick={computeScore}
              disabled={computing || !selectedEntityId || !computeDate}
              size="sm"
            >
              {computing ? (
                <><Loader2 className="size-4 animate-spin mr-1.5" />Computing…</>
              ) : (
                <><TrendingUp className="size-4 mr-1.5" />Compute Score</>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Counts astrological events within ±7 days of the selected date and applies model weights. Scores are capped at 10.
          </p>
        </CardContent>
      </Card>

      {/* Results table */}
      {scores.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              Score Timeline
              {selectedEntity && (
                <span className="text-muted-foreground font-normal ml-2 text-sm">
                  — {selectedEntity.flag_emoji ?? ""} {selectedEntity.name}
                </span>
              )}
            </h2>
            <Badge variant="outline" className="text-xs">{scores.length} score{scores.length !== 1 ? "s" : ""}</Badge>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b text-xs text-muted-foreground">
                  <th className="text-left px-4 py-2.5 font-medium">Date</th>
                  <th className="text-left px-4 py-2.5 font-medium">Score</th>
                  <th className="text-left px-4 py-2.5 font-medium">Level</th>
                  <th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell">Contributing Factors</th>
                  <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">Computed At</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {scores.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium tabular-nums">
                      {fmtDate(s.score_date)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${scoreBarColor(s.stress_score)}`}
                            style={{ width: `${(s.stress_score / 10) * 100}%` }}
                          />
                        </div>
                        <span className="tabular-nums font-semibold">{s.stress_score.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs ${scoreColor(s.stress_score)}`}>
                        {scoreLabel(s.stress_score)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {s.contributing_factors.length === 0 ? (
                        <span className="text-muted-foreground text-xs">No nearby events</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {s.contributing_factors.slice(0, 3).map((f, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] capitalize">
                              {f.event_type} (+{f.weight})
                            </Badge>
                          ))}
                          {s.contributing_factors.length > 3 && (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              +{s.contributing_factors.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                      {fmtDateTime(s.computed_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {scores.length === 0 && !loadingScores && selectedEntityId && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <BarChart3 className="size-10 text-muted-foreground/30" />
            <p className="font-medium">No scores found</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Use the form above to compute a stress score for a specific date, or adjust the date range filter.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
