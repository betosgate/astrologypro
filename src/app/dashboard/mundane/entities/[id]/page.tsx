import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Globe, TrendingUp, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const OUTCOME_BADGE: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 border-blue-200",
  confirmed: "bg-green-100 text-green-700 border-green-200",
  partially_confirmed: "bg-teal-100 text-teal-700 border-teal-200",
  invalidated: "bg-red-100 text-red-700 border-red-200",
  expired: "bg-gray-100 text-gray-600 border-gray-200",
};

export default async function DashboardMundaneEntityDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch entity
  const { data: entity, error } = await admin
    .from("mundane_entities")
    .select("id, name, entity_type, region, flag_emoji, notes, timezone, latitude, longitude")
    .eq("id", id)
    .maybeSingle();

  if (error || !entity) notFound();

  // Fetch related data in parallel
  const [watchRes, forecastsRes, eventsRes] = await Promise.all([
    admin
      .from("mundane_watchlist")
      .select("id")
      .eq("user_id", user.id)
      .eq("entity_id", id)
      .maybeSingle(),
    admin
      .from("mundane_forecasts")
      .select("id, title, forecast_type, forecast_period_start, forecast_period_end, outcome_status, confidence_level")
      .eq("entity_id", id)
      .or(`is_public.eq.true,created_by.eq.${user.id}`)
      .order("forecast_period_start", { ascending: false })
      .limit(10),
    admin
      .from("mundane_astro_events")
      .select("id, title, event_type, event_datetime_utc, planet_primary, sign")
      .eq("entity_id", id)
      .order("event_datetime_utc", { ascending: false })
      .limit(10),
  ]);

  const isWatched = !!watchRes.data;
  const forecasts = forecastsRes.data ?? [];
  const events = eventsRes.data ?? [];

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/mundane/entities"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to entities
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{entity.flag_emoji ?? "🌐"}</span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{entity.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
              <Globe className="size-3.5" />
              <span className="capitalize">{entity.entity_type?.replace(/_/g, " ") ?? "Entity"}</span>
              {entity.region && (
                <>
                  <span>·</span>
                  <MapPin className="size-3.5" />
                  <span>{entity.region}</span>
                </>
              )}
              {isWatched && (
                <>
                  <span>·</span>
                  <Eye className="size-3.5 text-sky-500" />
                  <span className="text-sky-600">Watching</span>
                </>
              )}
            </div>
          </div>
        </div>

        {entity.timezone && (
          <p className="text-xs text-muted-foreground">Timezone: {entity.timezone}</p>
        )}
        {entity.notes && (
          <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{entity.notes}</p>
        )}
      </div>

      {/* Forecasts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="size-4 text-blue-500" />
            Forecasts ({forecasts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {forecasts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No forecasts for this entity yet.</p>
          ) : (
            <div className="space-y-2">
              {forecasts.map((f) => (
                <Link
                  key={f.id}
                  href={`/dashboard/mundane/forecasts/${f.id}`}
                  className="flex items-start justify-between gap-3 rounded-lg border bg-card p-2.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{f.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(f.forecast_period_start)}
                      {f.forecast_period_end && ` – ${formatDate(f.forecast_period_end)}`}
                      <span className="ml-2 capitalize">{f.forecast_type}</span>
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] capitalize shrink-0 ${OUTCOME_BADGE[f.outcome_status] ?? ""}`}
                  >
                    {f.outcome_status?.replace("_", " ")}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Related Astro Events */}
      {events.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Related Astro Events</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {events.map((ev) => (
                <Link
                  key={ev.id}
                  href={`/dashboard/mundane/event-calendar/${ev.id}`}
                  className="flex items-start justify-between gap-3 rounded-lg border bg-card p-2.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{ev.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(ev.event_datetime_utc)}
                      {ev.planet_primary && ` · ${ev.planet_primary}`}
                      {ev.sign && ` in ${ev.sign}`}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                    {ev.event_type}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
