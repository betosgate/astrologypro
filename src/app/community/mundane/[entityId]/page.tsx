import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Star } from "lucide-react";

export const dynamic = "force-dynamic";

const SIGNAL_BADGE: Record<string, string> = {
  low: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  critical: "bg-red-100 text-red-700 border-red-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type EntityRow = {
  id: string;
  name: string;
  entity_type: string;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  flag_emoji: string | null;
  notes: string | null;
};

type EntityChartRow = {
  id: string;
  chart_title: string;
  chart_type: string;
  event_date: string;
  event_time: string | null;
  timezone: string | null;
  notes: string | null;
  chart_url: string | null;
  is_primary: boolean;
};

type ForecastRow = {
  id: string;
  title: string;
  forecast_type: string;
  forecast_period_start: string;
  forecast_period_end: string;
  content: string;
  signal_strength: string | null;
};

export default async function CommunityEntityPage({
  params,
}: {
  params: Promise<{ entityId: string }>;
}) {
  const { entityId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/get-started");
  if (member.membership_status !== "active") redirect("/join/community/resubscribe");

  const today = new Date().toISOString().slice(0, 10);

  const { data: entity, error: entityError } = await supabase
    .from("mundane_entities")
    .select("id, name, entity_type, region, latitude, longitude, timezone, flag_emoji, notes")
    .eq("id", entityId)
    .eq("is_active", true)
    .single();

  if (entityError || !entity) notFound();

  const e = entity as EntityRow;

  const [chartsRes, forecastsRes] = await Promise.all([
    supabase
      .from("mundane_entity_charts")
      .select("id, chart_title, chart_type, event_date, event_time, timezone, notes, chart_url, is_primary")
      .eq("entity_id", entityId)
      .order("is_primary", { ascending: false })
      .order("event_date", { ascending: false }),

    supabase
      .from("mundane_forecasts")
      .select("id, title, forecast_type, forecast_period_start, forecast_period_end, content, signal_strength")
      .eq("entity_id", entityId)
      .eq("is_published", true)
      .gte("forecast_period_end", today)
      .order("forecast_period_start", { ascending: true }),
  ]);

  const charts = (chartsRes.data ?? []) as EntityChartRow[];
  const forecasts = (forecastsRes.data ?? []) as ForecastRow[];
  const primaryChart = charts.find((c) => c.is_primary);

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/community/mundane"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Mundane Astrology
      </Link>

      {/* Entity header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          {e.flag_emoji && <span className="text-4xl">{e.flag_emoji}</span>}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{e.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="outline" className="capitalize">{e.entity_type}</Badge>
              {e.region && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" /> {e.region}
                </span>
              )}
            </div>
          </div>
        </div>
        {e.notes && <p className="text-sm text-muted-foreground">{e.notes}</p>}
        {(e.latitude != null && e.longitude != null) && (
          <p className="text-xs text-muted-foreground">
            Coordinates: {e.latitude}, {e.longitude}
            {e.timezone && ` · ${e.timezone}`}
          </p>
        )}
      </div>

      {/* Primary chart info */}
      {primaryChart && (
        <Card className="border-amber-200 bg-amber-50/40 dark:bg-amber-950/10">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Star className="size-4 text-amber-500 fill-amber-500" />
              <CardTitle className="text-base">Foundation Chart</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{primaryChart.chart_title}</p>
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" />
                {formatDate(primaryChart.event_date)}
                {primaryChart.event_time && ` at ${primaryChart.event_time}`}
              </span>
              {primaryChart.timezone && <span>{primaryChart.timezone}</span>}
              <Badge variant="outline" className="text-xs capitalize">{primaryChart.chart_type}</Badge>
            </div>
            {primaryChart.notes && <p className="text-muted-foreground text-xs mt-1">{primaryChart.notes}</p>}
            {primaryChart.chart_url && (
              <a
                href={primaryChart.chart_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline"
              >
                View Chart
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Other charts */}
      {charts.filter((c) => !c.is_primary).length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Additional Charts</h2>
          <div className="space-y-2">
            {charts.filter((c) => !c.is_primary).map((c) => (
              <div key={c.id} className="rounded-lg border bg-card p-3 text-sm space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{c.chart_title}</span>
                  <Badge variant="outline" className="text-xs capitalize">{c.chart_type}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
                  <span>{formatDate(c.event_date)}</span>
                  {c.event_time && <span>{c.event_time}</span>}
                  {c.timezone && <span>{c.timezone}</span>}
                  {c.chart_url && (
                    <a href={c.chart_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      View
                    </a>
                  )}
                </div>
                {c.notes && <p className="text-xs text-muted-foreground">{c.notes}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related forecasts */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Active Forecasts</h2>
        {forecasts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active forecasts for this entity at this time.</p>
        ) : (
          <div className="space-y-3">
            {forecasts.map((forecast) => (
              <Card key={forecast.id}>
                <CardContent className="pt-4 pb-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{forecast.title}</p>
                    {forecast.signal_strength && (
                      <Badge
                        variant="outline"
                        className={`text-xs shrink-0 capitalize ${SIGNAL_BADGE[forecast.signal_strength] ?? ""}`}
                      >
                        {forecast.signal_strength}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">{forecast.forecast_type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(forecast.forecast_period_start)} – {formatDate(forecast.forecast_period_end)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{forecast.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
