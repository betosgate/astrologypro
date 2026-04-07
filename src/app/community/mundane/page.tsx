import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, MapPin, ChevronRight, TrendingUp, Building2, CalendarDays, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mundane Astrology — Community" };

const SIGNAL_BADGE: Record<string, string> = {
  low: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  critical: "bg-red-100 text-red-700 border-red-200",
};

const IMPORTANCE_COLORS: Record<string, string> = {
  "High Impact": "bg-red-100 text-red-700 border-red-200",
  "Medium Impact": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Low Impact": "bg-green-100 text-green-700 border-green-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type IngressSummary = {
  id: string;
  title: string;
  ingress_type: string | null;
  importance: string | null;
  short_description: string | null;
  event_timestamp: string | null;
  validity_start: string | null;
  validity_end: string | null;
  location_name: string | null;
};

type ForecastSummary = {
  id: string;
  title: string;
  entity_id: string | null;
  forecast_type: string;
  forecast_period_start: string;
  forecast_period_end: string;
  signal_strength: string | null;
  mundane_entities: { name: string; flag_emoji: string | null } | null;
};

type EntitySummary = {
  id: string;
  name: string;
  entity_type: string;
  flag_emoji: string | null;
  region: string | null;
};

type AstroEvent = {
  id: string;
  title: string;
  event_type: string;
  planet_primary: string | null;
  planet_secondary: string | null;
  sign: string | null;
  event_datetime_utc: string;
  timezone_display: string | null;
  notes: string | null;
};

type MundaneForecastNew = {
  id: string;
  title: string;
  entity_id: string | null;
  forecast_period_start: string;
  forecast_period_end: string | null;
  event_categories: string[];
  confidence_level: string | null;
  outcome_status: string;
};

const OUTCOME_BADGE: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 border-blue-200",
  confirmed: "bg-green-100 text-green-700 border-green-200",
  partially_confirmed: "bg-teal-100 text-teal-700 border-teal-200",
  invalidated: "bg-red-100 text-red-700 border-red-200",
  expired: "bg-gray-100 text-gray-600 border-gray-200",
};

export default async function CommunityMundanePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/join/community");
  if (member.membership_status !== "active") redirect("/join/community?status=inactive");

  const today = new Date().toISOString().slice(0, 10);
  const ninetyDaysLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  const adminClient = createAdminClient();

  const [ingressRes, forecastsRes, entitiesRes, astroEventsRes, newForecastsRes] = await Promise.all([
    supabase
      .from("ingress_charts")
      .select("id, title, ingress_type, importance, short_description, event_timestamp, validity_start, validity_end, location_name")
      .eq("is_published", true)
      .order("event_timestamp", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false })
      .limit(3),

    supabase
      .from("mundane_forecasts")
      .select("id, title, entity_id, forecast_type, forecast_period_start, forecast_period_end, signal_strength, mundane_entities(name, flag_emoji)")
      .eq("is_published", true)
      .gte("forecast_period_end", today)
      .order("forecast_period_start", { ascending: true })
      .order("id", { ascending: true })
      .limit(6),

    supabase
      .from("mundane_entities")
      .select("id, name, entity_type, flag_emoji, region")
      .eq("is_active", true)
      .order("name", { ascending: true })
      .limit(20),

    adminClient
      .from("mundane_astro_events")
      .select("id, title, event_type, planet_primary, planet_secondary, sign, event_datetime_utc, timezone_display, notes")
      .eq("is_verified", true)
      .gte("event_datetime_utc", today)
      .lte("event_datetime_utc", ninetyDaysLater)
      .order("event_datetime_utc", { ascending: true })
      .limit(5),

    adminClient
      .from("mundane_forecasts")
      .select("id, title, entity_id, forecast_period_start, forecast_period_end, event_categories, confidence_level, outcome_status")
      .eq("is_public", true)
      .order("forecast_period_start", { ascending: false })
      .order("id", { ascending: false })
      .limit(5),
  ]);

  const ingressCharts = (ingressRes.data ?? []) as IngressSummary[];
  const forecasts = (forecastsRes.data ?? []) as unknown as ForecastSummary[];
  const entities = (entitiesRes.data ?? []) as EntitySummary[];
  const astroEvents = (astroEventsRes.data ?? []) as AstroEvent[];
  const newForecasts = (newForecastsRes.data ?? []) as MundaneForecastNew[];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Globe className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Mundane Astrology</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          World events through the lens of planetary cycles — ingress charts, forecasts, and country tracking.
        </p>
      </div>

      {/* Section 1: Current Ingress Charts */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Current Ingress Charts</h2>
          <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground text-xs">
            <Link href="/community/ingress-charts">
              View All <ChevronRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        {ingressCharts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No ingress charts available yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {ingressCharts.map((chart) => (
              <Link key={chart.id} href={`/community/ingress-charts/${chart.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm leading-snug">{chart.title}</CardTitle>
                      {chart.importance && (
                        <Badge
                          variant="outline"
                          className={`shrink-0 text-xs ${IMPORTANCE_COLORS[chart.importance] ?? ""}`}
                        >
                          {chart.importance.replace(" Impact", "")}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {chart.ingress_type && (
                        <span className="text-xs text-muted-foreground">{chart.ingress_type}</span>
                      )}
                      {chart.location_name && (
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                          <MapPin className="size-3" />{chart.location_name}
                        </span>
                      )}
                    </div>
                    {chart.event_timestamp && (
                      <CardDescription className="text-xs">{formatDate(chart.event_timestamp)}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {chart.short_description && (
                      <p className="text-xs text-muted-foreground line-clamp-3">{chart.short_description}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
        <div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/community/ingress-charts">
              View All Ingress Charts <ChevronRight className="ml-1.5 size-3.5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Section 2: Active Forecasts */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Active Forecasts</h2>
        {forecasts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active forecasts at this time.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {forecasts.map((forecast) => (
              <Card key={forecast.id} className="border-l-4 border-l-primary/30">
                <CardContent className="pt-4 pb-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-snug">{forecast.title}</p>
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
                    {forecast.mundane_entities && (
                      <span className="text-xs text-muted-foreground">
                        {forecast.mundane_entities.flag_emoji} {forecast.mundane_entities.name}
                      </span>
                    )}
                    <Badge variant="outline" className="text-xs capitalize">{forecast.forecast_type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(forecast.forecast_period_start)} – {formatDate(forecast.forecast_period_end)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Section 3: Upcoming Astronomical Events */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Upcoming Astronomical Events</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Ingresses, eclipses, lunations, and major planetary stations in the next 90 days.
        </p>
        {astroEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming events on the calendar.</p>
        ) : (
          <div className="space-y-2">
            {astroEvents.map((ev) => (
              <div key={ev.id} className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3 shadow-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{ev.title}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs capitalize">{ev.event_type.replace("_", " ")}</Badge>
                    {ev.planet_primary && (
                      <span className="text-xs text-muted-foreground">{ev.planet_primary}{ev.planet_secondary ? ` / ${ev.planet_secondary}` : ""}</span>
                    )}
                    {ev.sign && <span className="text-xs text-muted-foreground">in {ev.sign}</span>}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-muted-foreground">
                    {formatDate(ev.event_datetime_utc)}
                  </p>
                  {ev.timezone_display && ev.timezone_display !== "UTC" && (
                    <p className="text-xs text-muted-foreground">{ev.timezone_display}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 4: Active Forecasts (new structured journal) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Active Forecasts</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Astrological predictions with outcome tracking.
        </p>
        {newForecasts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No public forecasts available yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {newForecasts.map((forecast) => (
              <Card key={forecast.id} className="border-l-4 border-l-emerald-400/40">
                <CardContent className="pt-4 pb-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-snug">{forecast.title}</p>
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 capitalize ${OUTCOME_BADGE[forecast.outcome_status] ?? ""}`}
                    >
                      {forecast.outcome_status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {forecast.confidence_level && (
                      <Badge variant="outline" className="text-xs capitalize">{forecast.confidence_level}</Badge>
                    )}
                    {(forecast.event_categories ?? []).slice(0, 2).map((cat) => (
                      <Badge key={cat} variant="outline" className="text-xs capitalize">
                        {cat.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(forecast.forecast_period_start)}
                    {forecast.forecast_period_end && ` – ${formatDate(forecast.forecast_period_end)}`}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Section 6: Watched Entities */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Watched Entities</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Countries, markets, and institutions tracked in mundane astrology.
        </p>
        {entities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No entities tracked yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {entities.map((entity) => (
              <Link key={entity.id} href={`/community/mundane/${entity.id}`}>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-muted/50 transition-colors gap-1 px-3 py-1 text-sm"
                >
                  {entity.flag_emoji && <span>{entity.flag_emoji}</span>}
                  {entity.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
