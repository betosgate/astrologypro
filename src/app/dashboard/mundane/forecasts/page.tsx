import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Forecasts — Mundane" };

type Forecast = {
  id: string;
  title: string;
  entity_id: string | null;
  forecast_type: string;
  forecast_period_start: string;
  forecast_period_end: string | null;
  confidence_level: string | null;
  outcome_status: string;
  narrative_summary: string | null;
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function DashboardMundaneForecastsPage({
  searchParams,
}: {
  searchParams: Promise<{ outcome_status?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const outcomeStatus = sp.outcome_status ?? "";

  const admin = createAdminClient();
  const VALID = ["open", "confirmed", "partially_confirmed", "invalidated", "expired"];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_forecasts")
    .select(
      "id, title, entity_id, forecast_type, forecast_period_start, forecast_period_end, confidence_level, outcome_status, narrative_summary"
    )
    .or(`is_public.eq.true,created_by.eq.${user.id}`);

  if (outcomeStatus && VALID.includes(outcomeStatus)) {
    query = query.eq("outcome_status", outcomeStatus);
  }

  const { data, error } = await query
    .order("forecast_period_start", { ascending: false })
    .order("id", { ascending: false })
    .limit(50);

  if (error) {
    return <div className="text-destructive text-sm">Failed to load forecasts: {error.message}</div>;
  }

  const forecasts = (data ?? []) as Forecast[];

  // Entity map
  const entityIds = Array.from(new Set(forecasts.map((f) => f.entity_id).filter(Boolean) as string[]));
  const entityMap: Record<string, { name: string; flag: string | null }> = {};
  if (entityIds.length > 0) {
    const { data: ents } = await admin
      .from("mundane_entities")
      .select("id, name, flag_emoji")
      .in("id", entityIds);
    for (const e of ents ?? []) entityMap[e.id] = { name: e.name, flag: e.flag_emoji };
  }

  const FILTERS = [
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
        href="/dashboard/mundane"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Mundane
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <TrendingUp className="size-6 text-blue-500" />
          Forecasts
        </h1>
        <p className="text-muted-foreground">Published mundane forecasts with outcome tracking.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((opt) => (
          <Link
            key={opt.value}
            href={`/dashboard/mundane/forecasts${opt.value ? `?outcome_status=${opt.value}` : ""}`}
          >
            <Badge variant={outcomeStatus === opt.value ? "default" : "outline"} className="cursor-pointer">
              {opt.label}
            </Badge>
          </Link>
        ))}
      </div>

      {forecasts.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center text-muted-foreground">
            No forecasts found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {forecasts.map((f) => (
            <Link
              key={f.id}
              href={`/dashboard/mundane/forecasts/${f.id}`}
              className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3 shadow-sm hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{f.title}</p>
                {f.narrative_summary && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {f.narrative_summary}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                  <span>
                    {formatDate(f.forecast_period_start)}
                    {f.forecast_period_end && ` – ${formatDate(f.forecast_period_end)}`}
                  </span>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {f.forecast_type}
                  </Badge>
                  {f.confidence_level && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${CONFIDENCE_BADGE[f.confidence_level] ?? ""}`}
                    >
                      {f.confidence_level}
                    </Badge>
                  )}
                  {f.entity_id && entityMap[f.entity_id] && (
                    <span>
                      {entityMap[f.entity_id].flag ?? "🌐"} {entityMap[f.entity_id].name}
                    </span>
                  )}
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] capitalize shrink-0 ${OUTCOME_BADGE[f.outcome_status] ?? ""}`}
              >
                {f.outcome_status.replace("_", " ")}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
