"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, FlaskConical, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";

type EntityResult = {
  entity_id: string;
  tested: number;
  correct: number;
  accuracy_score: number;
};

type BacktestResults = {
  accuracy_score: number;
  tested: number;
  correct: number;
  by_entity: EntityResult[];
};

type BacktestRun = {
  id: string;
  name: string;
  description: string | null;
  hypothesis: string;
  entity_ids: string[];
  date_range_start: string;
  date_range_end: string;
  status: string;
  accuracy_score: number | null;
  total_forecasts_tested: number;
  correct_predictions: number;
  error_message: string | null;
  results: BacktestResults | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600 border-gray-200",
  running: "bg-yellow-100 text-yellow-700 border-yellow-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  failed: "bg-red-100 text-red-700 border-red-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AccuracyMeter({ score }: { score: number }) {
  const color =
    score >= 70 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-600";
  return (
    <div className={`text-5xl font-bold tabular-nums ${color}`}>
      {score.toFixed(1)}%
    </div>
  );
}

export default function AdminMundaneBacktestDetailPage() {
  const params = useParams<{ id: string }>();
  const [run, setRun] = useState<BacktestRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/mundane/backtesting/${params.id}`);
        if (res.ok) {
          const json = await res.json();
          setRun(json);
        } else {
          const json = await res.json();
          setError(json.detail ?? "Failed to load backtest run.");
        }
      } catch {
        setError("Network error — please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Link
          href="/admin/mundane/backtesting"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to Backtesting
        </Link>
        <p className="text-destructive text-sm">{error || "Run not found."}</p>
      </div>
    );
  }

  const results = run.results as BacktestResults | null;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/admin/mundane/backtesting"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Backtesting
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold flex items-center gap-2 truncate">
            <FlaskConical className="size-6 text-violet-500 shrink-0" />
            {run.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDate(run.date_range_start)} – {formatDate(run.date_range_end)}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`text-sm capitalize shrink-0 ${STATUS_BADGE[run.status] ?? ""}`}
        >
          {run.status === "running" && (
            <Loader2 className="size-3 mr-1 animate-spin" />
          )}
          {run.status}
        </Badge>
      </div>

      {/* Metrics row */}
      {run.status === "completed" && run.accuracy_score !== null && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5 pb-5 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Accuracy
              </p>
              <AccuracyMeter score={run.accuracy_score} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-5 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Forecasts Tested
              </p>
              <div className="text-4xl font-bold tabular-nums text-foreground">
                {run.total_forecasts_tested}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-5 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Correct
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="text-4xl font-bold tabular-nums text-green-600">
                  {run.correct_predictions}
                </div>
                <CheckCircle2 className="size-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status info */}
      {run.status === "failed" && run.error_message && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4 pb-4 flex gap-2">
            <XCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{run.error_message}</p>
          </CardContent>
        </Card>
      )}

      {run.status === "running" && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4 pb-4 flex gap-2">
            <Clock className="size-4 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-700">Backtest is currently running…</p>
          </CardContent>
        </Card>
      )}

      {/* Hypothesis & meta */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Hypothesis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed">{run.hypothesis}</p>
          {run.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{run.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1 border-t">
            {run.started_at && (
              <span>Started: {formatDateTime(run.started_at)}</span>
            )}
            {run.completed_at && (
              <span>Completed: {formatDateTime(run.completed_at)}</span>
            )}
            <span>Created: {formatDateTime(run.created_at)}</span>
          </div>
        </CardContent>
      </Card>

      {/* By entity results */}
      {results && results.by_entity && results.by_entity.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Results by Entity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2 font-medium text-muted-foreground">
                      Entity ID
                    </th>
                    <th className="text-right pb-2 font-medium text-muted-foreground">
                      Tested
                    </th>
                    <th className="text-right pb-2 font-medium text-muted-foreground">
                      Correct
                    </th>
                    <th className="text-right pb-2 font-medium text-muted-foreground">
                      Accuracy
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {results.by_entity.map((row) => (
                    <tr key={row.entity_id} className="hover:bg-muted/30">
                      <td className="py-2 font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                        {row.entity_id === "__none__" ? "No entity" : row.entity_id}
                      </td>
                      <td className="py-2 text-right tabular-nums">{row.tested}</td>
                      <td className="py-2 text-right tabular-nums text-green-600">
                        {row.correct}
                      </td>
                      <td className="py-2 text-right tabular-nums font-medium">
                        <span
                          className={
                            row.accuracy_score >= 70
                              ? "text-green-600"
                              : row.accuracy_score >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                          }
                        >
                          {row.accuracy_score.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
