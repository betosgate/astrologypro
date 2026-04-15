import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Clock, Globe } from "lucide-react";

export const dynamic = "force-dynamic";

const ASTRO_TYPE_BADGE: Record<string, string> = {
  eclipse: "bg-purple-100 text-purple-700 border-purple-200",
  ingress: "bg-blue-100 text-blue-700 border-blue-200",
  lunation: "bg-indigo-100 text-indigo-700 border-indigo-200",
  conjunction: "bg-amber-100 text-amber-700 border-amber-200",
  opposition: "bg-orange-100 text-orange-700 border-orange-200",
  station: "bg-pink-100 text-pink-700 border-pink-200",
  retrograde: "bg-rose-100 text-rose-700 border-rose-200",
  direct: "bg-emerald-100 text-emerald-700 border-emerald-200",
  great_conjunction: "bg-violet-100 text-violet-700 border-violet-200",
  return: "bg-cyan-100 text-cyan-700 border-cyan-200",
  solar_arc: "bg-yellow-100 text-yellow-700 border-yellow-200",
  custom: "bg-gray-100 text-gray-700 border-gray-200",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

export default async function DashboardMundaneEventDetail({
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

  const { data: event, error } = await admin
    .from("mundane_astro_events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !event) notFound();

  // Fetch entity if linked
  let entity: { id: string; name: string; flag_emoji: string | null } | null = null;
  if (event.entity_id) {
    const { data: e } = await admin
      .from("mundane_entities")
      .select("id, name, flag_emoji")
      .eq("id", event.entity_id)
      .maybeSingle();
    entity = e;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/mundane/event-calendar"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to event calendar
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Sparkles className="size-4 text-violet-500" />
          <span className="capitalize">{event.event_type?.replace(/_/g, " ")}</span>
          {entity && (
            <>
              <span>·</span>
              <span>{entity.flag_emoji ?? "🌐"} {entity.name}</span>
            </>
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className={`capitalize ${ASTRO_TYPE_BADGE[event.event_type] ?? ""}`}
        >
          {event.event_type?.replace(/_/g, " ")}
        </Badge>
        <Badge variant="outline" className="gap-1.5">
          <Clock className="size-3" />
          {formatDateTime(event.event_datetime_utc)}
        </Badge>
      </div>

      {/* Planetary details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="size-4 text-violet-500" />
            Planetary Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2 text-sm">
          {event.planet_primary && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Primary Planet</span>
              <span className="font-medium">{event.planet_primary}</span>
            </div>
          )}
          {event.planet_secondary && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Secondary Planet</span>
              <span className="font-medium">{event.planet_secondary}</span>
            </div>
          )}
          {event.sign && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sign</span>
              <span className="font-medium">{event.sign}</span>
            </div>
          )}
          {event.degree && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Degree</span>
              <span className="font-medium">{event.degree}°</span>
            </div>
          )}
          {!event.planet_primary && !event.sign && !event.planet_secondary && (
            <p className="text-muted-foreground">No planetary details recorded.</p>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {event.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Interpretation Notes</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm whitespace-pre-wrap">{event.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Linked entity */}
      {entity && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Related Entity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Link
              href={`/dashboard/mundane/entities/${entity.id}`}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
            >
              <span className="text-xl">{entity.flag_emoji ?? "🌐"}</span>
              <span className="font-medium">{entity.name}</span>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
