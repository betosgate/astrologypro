import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

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

export default async function DashboardMundaneForecastDetail({
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

  const { data: f, error } = await admin
    .from("mundane_forecasts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !f) notFound();

  // Object-level authorization: must be public OR created by this user
  if (!f.is_public && f.created_by !== user.id) notFound();

  let entity: { name: string; flag_emoji: string | null } | null = null;
  if (f.entity_id) {
    const { data: e } = await admin
      .from("mundane_entities")
      .select("name, flag_emoji")
      .eq("id", f.entity_id)
      .maybeSingle();
    entity = e;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/mundane/forecasts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to forecasts
      </Link>

      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <TrendingUp className="size-4" />
          <span className="capitalize">{f.forecast_type}</span>
          {entity && (
            <>
              <span>·</span>
              <span>
                {entity.flag_emoji ?? "🌐"} {entity.name}
              </span>
            </>
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{f.title}</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className={`capitalize ${OUTCOME_BADGE[f.outcome_status] ?? ""}`}
        >
          {f.outcome_status.replace("_", " ")}
        </Badge>
        {f.confidence_level && (
          <Badge
            variant="outline"
            className={`capitalize ${CONFIDENCE_BADGE[f.confidence_level] ?? ""}`}
          >
            Confidence: {f.confidence_level}
          </Badge>
        )}
        <Badge variant="outline" className="gap-1">
          <Calendar className="size-3" />
          {formatDate(f.forecast_period_start)}
          {f.forecast_period_end && ` – ${formatDate(f.forecast_period_end)}`}
        </Badge>
      </div>

      {f.narrative_summary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Narrative Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm whitespace-pre-wrap">{f.narrative_summary}</p>
          </CardContent>
        </Card>
      )}

      {f.astrology_basis && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Astrological Basis</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm whitespace-pre-wrap">{f.astrology_basis}</p>
          </CardContent>
        </Card>
      )}

      {f.content && f.content !== f.narrative_summary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Full Content</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm whitespace-pre-wrap">{f.content}</p>
          </CardContent>
        </Card>
      )}

      {f.outcome_notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Outcome Notes</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm whitespace-pre-wrap">{f.outcome_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
