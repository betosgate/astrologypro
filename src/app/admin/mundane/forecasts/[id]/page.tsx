"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, TrendingUp, Calendar, Globe, CheckCircle2,
  XCircle, AlertCircle, Clock, Loader2, Edit3, Save, X,
} from "lucide-react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Forecast = any;

const OUTCOME_OPTIONS = [
  { value: "open", label: "Open", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "confirmed", label: "Confirmed", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "partially_confirmed", label: "Partially Confirmed", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "invalidated", label: "Invalidated", color: "bg-red-100 text-red-700 border-red-200" },
  { value: "expired", label: "Expired", color: "bg-gray-100 text-gray-600 border-gray-200" },
];

const CONFIDENCE_MAP: Record<string, string> = {
  high: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-orange-100 text-orange-700 border-orange-200",
  speculative: "bg-gray-100 text-gray-600 border-gray-200",
};

const SIGNAL_MAP: Record<string, string> = {
  critical: "text-red-600 font-bold",
  high: "text-orange-500 font-semibold",
  medium: "text-yellow-600 font-semibold",
  low: "text-green-600",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function OutcomeIcon({ status }: { status: string }) {
  if (status === "confirmed") return <CheckCircle2 className="size-5 text-green-500" />;
  if (status === "invalidated") return <XCircle className="size-5 text-red-500" />;
  if (status === "partially_confirmed") return <AlertCircle className="size-5 text-yellow-500" />;
  if (status === "expired") return <Clock className="size-5 text-gray-400" />;
  return <Clock className="size-5 text-blue-400" />;
}

export default function ForecastDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Outcome editing state
  const [editingOutcome, setEditingOutcome] = useState(false);
  const [outcomeStatus, setOutcomeStatus] = useState("");
  const [outcomeNotes, setOutcomeNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/mundane/forecasts/${id}`);
      if (!res.ok) { router.push("/admin/mundane/forecasts"); return; }
      const data = await res.json();
      setForecast(data);
      setOutcomeStatus(data.outcome_status ?? "open");
      setOutcomeNotes(data.outcome_notes ?? "");
    } catch {
      toast.error("Failed to load forecast");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  async function saveOutcome() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/mundane/forecasts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcome_status: outcomeStatus,
          outcome_notes: outcomeNotes.trim() || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Failed to save");
      const updated = await res.json();
      setForecast(updated);
      setEditingOutcome(false);
      toast.success("Outcome updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save outcome");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!forecast) return null;

  const outcomeOption = OUTCOME_OPTIONS.find((o) => o.value === forecast.outcome_status);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back nav */}
      <div className="flex items-center gap-3">
        <Link href="/admin/mundane/forecasts">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="size-4" />Forecasts
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3">
        <TrendingUp className="size-6 text-amber-500 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold leading-tight">{forecast.title}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            {outcomeOption && (
              <Badge variant="outline" className={outcomeOption.color}>
                <OutcomeIcon status={forecast.outcome_status} />
                <span className="ml-1">{outcomeOption.label}</span>
              </Badge>
            )}
            {forecast.confidence_level && (
              <Badge variant="outline" className={CONFIDENCE_MAP[forecast.confidence_level] ?? ""}>
                {forecast.confidence_level} confidence
              </Badge>
            )}
            {forecast.signal_strength && (
              <span className={`text-xs uppercase ${SIGNAL_MAP[forecast.signal_strength] ?? ""}`}>
                ● {forecast.signal_strength} signal
              </span>
            )}
            {forecast.is_public && (
              <Badge variant="outline" className="text-violet-600 border-violet-200 bg-violet-50">Public</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Forecast window */}
      <Card>
        <CardContent className="flex items-center gap-3 py-4 px-5">
          <Calendar className="size-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-sm font-medium">Forecast Window</p>
            <p className="text-sm text-muted-foreground">
              {fmtDate(forecast.forecast_period_start)}
              {forecast.forecast_period_end ? ` → ${fmtDate(forecast.forecast_period_end)}` : " (open-ended)"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Astrological basis */}
        {forecast.astrology_basis && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Astrological Basis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{forecast.astrology_basis}</p>
            </CardContent>
          </Card>
        )}

        {/* Narrative summary */}
        {(forecast.narrative_summary || forecast.content) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Narrative Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {forecast.narrative_summary ?? forecast.content}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Event categories */}
      {Array.isArray(forecast.event_categories) && forecast.event_categories.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Event Categories</p>
          <div className="flex flex-wrap gap-2">
            {forecast.event_categories.map((cat: string) => (
              <Badge key={cat} variant="outline" className="capitalize text-xs">
                {cat.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Outcome tracking */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <OutcomeIcon status={forecast.outcome_status} />
            Outcome Tracking
          </CardTitle>
          {!editingOutcome && (
            <Button variant="outline" size="sm" onClick={() => setEditingOutcome(true)}>
              <Edit3 className="size-3.5 mr-1.5" />Update
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {editingOutcome ? (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium">Outcome Status</label>
                <Select value={outcomeStatus} onValueChange={setOutcomeStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTCOME_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Outcome Notes</label>
                <Textarea
                  rows={4}
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="What actually happened? How accurate was the forecast?"
                  maxLength={2000}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveOutcome} disabled={saving} size="sm">
                  {saving ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Save className="size-4 mr-1.5" />}
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  setEditingOutcome(false);
                  setOutcomeStatus(forecast.outcome_status ?? "open");
                  setOutcomeNotes(forecast.outcome_notes ?? "");
                }}>
                  <X className="size-4 mr-1" />Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                {outcomeOption && (
                  <Badge variant="outline" className={outcomeOption.color}>{outcomeOption.label}</Badge>
                )}
              </div>
              {forecast.outcome_notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Notes:</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{forecast.outcome_notes}</p>
                </div>
              )}
              {forecast.outcome_reviewed_at && (
                <p className="text-xs text-muted-foreground">
                  Reviewed: {fmtDate(forecast.outcome_reviewed_at)}
                </p>
              )}
              {!forecast.outcome_notes && forecast.outcome_status === "open" && (
                <p className="text-sm text-muted-foreground">No outcome recorded yet. Update when the forecast window closes.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Globe className="size-3.5" />
        <span>Created {fmtDate(forecast.created_at)}</span>
        {forecast.forecast_type && <span>· {forecast.forecast_type}</span>}
      </div>
    </div>
  );
}
