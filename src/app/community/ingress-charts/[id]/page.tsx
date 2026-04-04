import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Globe, Tag, User } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SystemInterpretation = {
  title?: string;
  shortDescription?: string;
  htmlContent?: string;
  chartRuler?: string;
  primaryChallenge?: string;
  primaryStrength?: string;
};

type IngressChart = {
  id: string;
  title: string;
  ingress_type: string | null;
  importance: string | null;
  short_description: string | null;
  effective_time_period: string | null;
  event_time_period: string | null;
  event_timestamp: string | null;
  validity_start: string | null;
  validity_end: string | null;
  location_name: string | null;
  location_lat: number | null;
  location_lon: number | null;
  location_timezone: string | null;
  system_interpretation: SystemInterpretation | null;
  chart_data: Record<string, unknown> | null;
  sector_analysis: Record<string, unknown> | null;
  tags: string[];
  sector_focus: string[];
  author_name: string | null;
  is_social_advo: boolean;
  created_at: string;
};

const IMPORTANCE_COLORS: Record<string, string> = {
  "High Impact": "bg-red-100 text-red-700 border-red-200",
  "Medium Impact": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Low Impact": "bg-green-100 text-green-700 border-green-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default async function IngressChartDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const { data: chart, error } = await supabase
    .from("ingress_charts")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (error || !chart) notFound();

  const c = chart as unknown as IngressChart;
  const si = c.system_interpretation;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/community/ingress-charts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Ingress Charts
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-start gap-2">
          <h1 className="text-2xl font-bold tracking-tight flex-1">{c.title}</h1>
          {c.importance && (
            <Badge variant="outline" className={IMPORTANCE_COLORS[c.importance] ?? ""}>
              {c.importance}
            </Badge>
          )}
          {c.is_social_advo && (
            <Badge variant="secondary">Social Advocacy</Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {c.ingress_type && (
            <span className="flex items-center gap-1">
              <Globe className="size-4" /> {c.ingress_type}
            </span>
          )}
          {c.location_name && (
            <span className="flex items-center gap-1">
              <MapPin className="size-4" /> {c.location_name}
            </span>
          )}
          {c.event_timestamp && (
            <span className="flex items-center gap-1">
              <Calendar className="size-4" /> {formatDate(c.event_timestamp)}
            </span>
          )}
          {c.author_name && (
            <span className="flex items-center gap-1">
              <User className="size-4" /> {c.author_name}
            </span>
          )}
        </div>

        {c.effective_time_period && (
          <p className="text-sm text-muted-foreground">Effective period: {c.effective_time_period}</p>
        )}
      </div>

      {/* Short description */}
      {c.short_description && (
        <p className="text-base text-muted-foreground leading-relaxed">{c.short_description}</p>
      )}

      {/* System Interpretation */}
      {si && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{si.title ?? "System Interpretation"}</CardTitle>
            {si.shortDescription && (
              <p className="text-sm text-muted-foreground">{si.shortDescription}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {si.htmlContent && (
              <div
                className="prose prose-sm max-w-none text-foreground"
                dangerouslySetInnerHTML={{ __html: si.htmlContent }}
              />
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              {si.chartRuler && (
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Chart Ruler</p>
                  <p className="font-medium">{si.chartRuler}</p>
                </div>
              )}
              {si.primaryChallenge && (
                <div className="rounded-lg border border-red-200 bg-red-50/40 p-3 space-y-1">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Primary Challenge</p>
                  <p className="text-sm">{si.primaryChallenge}</p>
                </div>
              )}
              {si.primaryStrength && (
                <div className="rounded-lg border border-green-200 bg-green-50/40 p-3 space-y-1">
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Primary Strength</p>
                  <p className="text-sm">{si.primaryStrength}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validity period */}
      {(c.validity_start || c.validity_end) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Validity Period</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6 text-sm">
            {c.validity_start && (
              <div>
                <p className="text-xs text-muted-foreground">From</p>
                <p className="font-medium">{formatDate(c.validity_start)}</p>
              </div>
            )}
            {c.validity_end && (
              <div>
                <p className="text-xs text-muted-foreground">To</p>
                <p className="font-medium">{formatDate(c.validity_end)}</p>
              </div>
            )}
            {c.event_time_period && (
              <div>
                <p className="text-xs text-muted-foreground">Event Period</p>
                <p className="font-medium">{c.event_time_period}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tags & Sectors */}
      {(c.tags.length > 0 || c.sector_focus.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {c.sector_focus.map((s) => (
            <Badge key={s} variant="secondary">{s}</Badge>
          ))}
          {c.tags.map((tag) => (
            <span key={tag} className="flex items-center gap-0.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              <Tag className="size-3 mr-0.5" />{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
