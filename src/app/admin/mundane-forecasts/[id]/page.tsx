"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Loader2, ArrowLeft, Save } from "lucide-react";

export const dynamic = "force-dynamic";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Forecast = {
  id: string;
  title: string;
  entity_id: string | null;
  leader_id: string | null;
  forecast_period_start: string;
  forecast_period_end: string | null;
  astrology_basis: string | null;
  narrative_summary: string | null;
  event_categories: string[];
  confidence_level: string | null;
  outcome_status: string;
  outcome_notes: string | null;
  outcome_reviewed_at: string | null;
  is_public: boolean;
  created_at: string;
  created_by: string | null;
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

const VALID_OUTCOME_STATUSES = ["open", "confirmed", "partially_confirmed", "invalidated", "expired"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ForecastDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  // Editable outcome fields
  const [outcomeStatus, setOutcomeStatus] = useState("");
  const [outcomeNotes, setOutcomeNotes] = useState("");

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/mundane/forecasts/${id}`);
    if (res.ok) {
      const data = await res.json();
      setForecast(data);
      setOutcomeStatus(data.outcome_status ?? "open");
      setOutcomeNotes(data.outcome_notes ?? "");
    } else {
      setError("Failed to load forecast.");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  async function handleSaveOutcome() {
    setSaving(true);
    setSaveMsg("");
    const res = await fetch(`/api/admin/mundane/forecasts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outcome_status: outcomeStatus,
        outcome_notes: outcomeNotes.trim() || null,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setForecast(data);
      setSaveMsg("Saved successfully.");
      setTimeout(() => setSaveMsg(""), 3000);
    } else {
      const json = await res.json();
      setSaveMsg(json.detail ?? "Failed to save.");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !forecast) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error || "Forecast not found."}</p>
        <Button size="sm" variant="outline" asChild>
          <Link href="/admin/mundane"><ArrowLeft className="mr-1.5 size-4" /> Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button size="sm" variant="ghost" asChild className="px-2">
              <Link href="/admin/mundane"><ArrowLeft className="size-4" /></Link>
            </Button>
            <TrendingUp className="size-5 text-emerald-500" />
            <h1 className="text-2xl font-bold tracking-tight">{forecast.title}</h1>
          </div>
          <div className="flex items-center gap-2 ml-14">
            <Badge variant="outline" className={`capitalize ${OUTCOME_BADGE[forecast.outcome_status] ?? ""}`}>
              {forecast.outcome_status.replace("_", " ")}
            </Badge>
            {forecast.confidence_level && (
              <Badge variant="outline" className={`capitalize ${CONFIDENCE_BADGE[forecast.confidence_level] ?? ""}`}>
                {forecast.confidence_level} confidence
              </Badge>
            )}
            {forecast.is_public && (
              <Badge variant="outline" className="text-xs">Public</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Forecast window */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <h3 className="font-semibold text-sm">Forecast Window</h3>
              <div className="text-sm">
                <span className="font-medium">Period:</span>{" "}
                {formatDate(forecast.forecast_period_start)}
                {forecast.forecast_period_end && ` -- ${formatDate(forecast.forecast_period_end)}`}
              </div>
              <div className="text-sm">
                <span className="font-medium">Created:</span> {formatDate(forecast.created_at)}
              </div>
              {forecast.event_categories && forecast.event_categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {forecast.event_categories.map((cat) => (
                    <Badge key={cat} variant="outline" className="text-xs capitalize">{cat}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Narrative summary */}
          {forecast.narrative_summary && (
            <Card>
              <CardContent className="pt-4 space-y-2">
                <h3 className="font-semibold text-sm">Narrative Summary</h3>
                <p className="text-sm whitespace-pre-wrap">{forecast.narrative_summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Astrological basis */}
          {forecast.astrology_basis && (
            <Card>
              <CardContent className="pt-4 space-y-2">
                <h3 className="font-semibold text-sm">Astrological Basis / Evidence</h3>
                <p className="text-sm whitespace-pre-wrap">{forecast.astrology_basis}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Outcome panel */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <h3 className="font-semibold text-sm">Outcome / Review</h3>

              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  value={outcomeStatus}
                  onChange={(e) => setOutcomeStatus(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  {VALID_OUTCOME_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Outcome Notes</label>
                <textarea
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  rows={5}
                  placeholder="Add review notes, verification details..."
                  className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground resize-y"
                />
              </div>

              {forecast.outcome_reviewed_at && (
                <div className="text-xs text-muted-foreground">
                  Last reviewed: {formatDate(forecast.outcome_reviewed_at)}
                </div>
              )}

              <Button size="sm" onClick={handleSaveOutcome} disabled={saving} className="w-full">
                {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                Save Outcome
              </Button>

              {saveMsg && (
                <p className={`text-sm ${saveMsg.includes("success") ? "text-green-600" : "text-destructive"}`}>
                  {saveMsg}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
