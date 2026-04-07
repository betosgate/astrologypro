import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { BookOpen, Plus, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

type Forecast = {
  id: string;
  title: string;
  entity_id: string | null;
  forecast_period_start: string;
  forecast_period_end: string | null;
  event_categories: string[];
  confidence_level: string | null;
  outcome_status: string;
  is_public: boolean;
  created_at: string;
};

const OUTCOME_BADGE: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 border-blue-200",
  confirmed: "bg-green-100 text-green-700 border-green-200",
  partially_confirmed: "bg-teal-100 text-teal-700 border-teal-200",
  invalidated: "bg-red-100 text-red-700 border-red-200",
  expired: "bg-gray-100 text-gray-600 border-gray-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function AdminMundaneForecastsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; outcome_status?: string }>;
}) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const outcomeStatus = sp.outcome_status ?? "";
  const limit = 20;
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  const VALID_OUTCOME_STATUS = ["open", "confirmed", "partially_confirmed", "invalidated", "expired"];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_forecasts")
    .select(
      "id, title, entity_id, forecast_period_start, forecast_period_end, event_categories, confidence_level, outcome_status, is_public, created_at",
      { count: "exact" }
    );

  if (outcomeStatus && VALID_OUTCOME_STATUS.includes(outcomeStatus)) {
    query = query.eq("outcome_status", outcomeStatus);
  }

  const { data, error, count } = await query
    .order("forecast_period_start", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return (
      <div className="text-destructive text-sm">Failed to load forecasts: {error.message}</div>
    );
  }

  const forecasts = (data ?? []) as Forecast[];
  const total = count ?? 0;
  const hasMore = offset + limit < total;
  const hasPrev = page > 1;

  const STATUS_FILTERS = [
    { label: "All", value: "" },
    { label: "Open", value: "open" },
    { label: "Confirmed", value: "confirmed" },
    { label: "Partial", value: "partially_confirmed" },
    { label: "Invalidated", value: "invalidated" },
    { label: "Expired", value: "expired" },
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
            <BookOpen className="size-6 text-emerald-500" />
            Forecast Journal
          </h1>
          <p className="text-muted-foreground">Structured predictions with outcome tracking.</p>
        </div>
        <Button size="sm" asChild>
          <Link href="/admin/mundane/forecasts/new">
            <Plus className="mr-1.5 size-4" /> New Forecast
          </Link>
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((opt) => (
          <Link
            key={opt.value}
            href={`/admin/mundane/forecasts?outcome_status=${opt.value}`}
          >
            <Badge
              variant={outcomeStatus === opt.value ? "default" : "outline"}
              className="cursor-pointer"
            >
              {opt.label}
            </Badge>
          </Link>
        ))}
      </div>

      {forecasts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <BookOpen className="size-10 text-muted-foreground/40" />
            <p className="font-medium">No forecasts found</p>
            <Button size="sm" asChild>
              <Link href="/admin/mundane/forecasts/new">
                <Plus className="mr-1.5 size-4" /> New Forecast
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {forecasts.map((forecast) => (
            <div
              key={forecast.id}
              className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3 shadow-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{forecast.title}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(forecast.forecast_period_start)}
                    {forecast.forecast_period_end && ` – ${formatDate(forecast.forecast_period_end)}`}
                  </span>
                  {forecast.confidence_level && (
                    <Badge variant="outline" className="text-xs capitalize">{forecast.confidence_level}</Badge>
                  )}
                  {(forecast.event_categories ?? []).slice(0, 2).map((cat) => (
                    <Badge key={cat} variant="outline" className="text-xs capitalize">
                      {cat.replace("_", " ")}
                    </Badge>
                  ))}
                  {!forecast.is_public && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">Private</Badge>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                <Badge
                  variant="outline"
                  className={`text-xs capitalize ${OUTCOME_BADGE[forecast.outcome_status] ?? ""}`}
                >
                  {forecast.outcome_status.replace("_", " ")}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {(hasPrev || hasMore) && (
        <div className="flex gap-2 items-center text-sm text-muted-foreground">
          {hasPrev && (
            <Link href={`/admin/mundane/forecasts?page=${page - 1}&outcome_status=${outcomeStatus}`}>
              <Button variant="outline" size="sm">Previous</Button>
            </Link>
          )}
          <span>Page {page} of {Math.ceil(total / limit)}</span>
          {hasMore && (
            <Link href={`/admin/mundane/forecasts?page=${page + 1}&outcome_status=${outcomeStatus}`}>
              <Button variant="outline" size="sm">Next</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
