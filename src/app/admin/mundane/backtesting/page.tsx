import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ArrowLeft, FlaskConical, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

type BacktestRun = {
  id: string;
  name: string;
  description: string | null;
  hypothesis: string;
  date_range_start: string;
  date_range_end: string;
  status: string;
  accuracy_score: number | null;
  total_forecasts_tested: number;
  correct_predictions: number;
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

export default async function AdminMundaneBacktestingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const statusFilter = sp.status ?? "";
  const limit = 20;
  const offset = (page - 1) * limit;

  const VALID_STATUS = ["pending", "running", "completed", "failed"];
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_backtest_runs")
    .select(
      "id, name, description, hypothesis, date_range_start, date_range_end, status, accuracy_score, total_forecasts_tested, correct_predictions, created_at",
      { count: "exact" }
    );

  if (statusFilter && VALID_STATUS.includes(statusFilter)) {
    query = query.eq("status", statusFilter);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return (
      <div className="text-destructive text-sm">
        Failed to load backtest runs: {error.message}
      </div>
    );
  }

  const runs = (data ?? []) as BacktestRun[];
  const total = count ?? 0;
  const hasMore = offset + limit < total;
  const hasPrev = page > 1;

  const STATUS_FILTERS = [
    { label: "All", value: "" },
    { label: "Pending", value: "pending" },
    { label: "Running", value: "running" },
    { label: "Completed", value: "completed" },
    { label: "Failed", value: "failed" },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/mundane"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Mundane
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FlaskConical className="size-6 text-violet-500" />
            Backtesting Engine
          </h1>
          <p className="text-muted-foreground">
            Test forecast hypotheses against historical outcomes.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/admin/mundane/backtesting/new">
            <Plus className="mr-1.5 size-4" /> New Backtest
          </Link>
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((opt) => (
          <Link
            key={opt.value}
            href={`/admin/mundane/backtesting?status=${opt.value}`}
          >
            <Badge
              variant={statusFilter === opt.value ? "default" : "outline"}
              className="cursor-pointer"
            >
              {opt.label}
            </Badge>
          </Link>
        ))}
      </div>

      {runs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <FlaskConical className="size-10 text-muted-foreground/40" />
            <p className="font-medium">No backtest runs found</p>
            <Button size="sm" asChild>
              <Link href="/admin/mundane/backtesting/new">
                <Plus className="mr-1.5 size-4" /> New Backtest
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {runs.map((run) => (
            <Link
              key={run.id}
              href={`/admin/mundane/backtesting/${run.id}`}
              className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3 shadow-sm hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{run.name}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(run.date_range_start)} – {formatDate(run.date_range_end)}
                  </span>
                  {run.status === "completed" && run.accuracy_score !== null && (
                    <Badge variant="outline" className="text-xs font-semibold text-violet-700 border-violet-200">
                      {run.accuracy_score.toFixed(1)}% accuracy
                    </Badge>
                  )}
                  {run.total_forecasts_tested > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {run.correct_predictions}/{run.total_forecasts_tested} correct
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(run.created_at)}
                  </span>
                </div>
              </div>
              <div className="shrink-0">
                <Badge
                  variant="outline"
                  className={`text-xs capitalize ${STATUS_BADGE[run.status] ?? ""}`}
                >
                  {run.status}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {(hasPrev || hasMore) && (
        <div className="flex gap-2 items-center text-sm text-muted-foreground">
          {hasPrev && (
            <Link
              href={`/admin/mundane/backtesting?page=${page - 1}&status=${statusFilter}`}
            >
              <Button variant="outline" size="sm">
                Previous
              </Button>
            </Link>
          )}
          <span>
            Page {page} of {Math.ceil(total / limit)}
          </span>
          {hasMore && (
            <Link
              href={`/admin/mundane/backtesting?page=${page + 1}&status=${statusFilter}`}
            >
              <Button variant="outline" size="sm">
                Next
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
