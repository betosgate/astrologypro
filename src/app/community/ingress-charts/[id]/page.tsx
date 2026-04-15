import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Globe, Tag, User, AlertTriangle, Zap } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ChartRulerItem = {
  icon: string;
  text: string;
};

type ChallengeStrengthItem = {
  type: "challenge" | "strength";
  text: string;
};

type SystemInterpretation = {
  intro?: string;
  body?: string[];
  chartRuler?: ChartRulerItem[];
  challengesAndStrengths?: ChallengeStrengthItem[];
  // Legacy fields (kept for backward compat)
  title?: string;
  shortDescription?: string;
  htmlContent?: string;
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

const SECTOR_DISPLAY: Record<string, string> = {
  governmentAndLeadership: "Government & Leadership",
  socialClimateAndPublicMood: "Social Climate & Public Mood",
  weatherAndAgriculture: "Weather & Agriculture",
  potentialConflictsAndAlliances: "Potential Conflicts & Alliances",
  publicHealthAndWorkforce: "Public Health & Workforce",
  communicationsAndTransportation: "Communications & Transportation",
  justiceLawAndForeignTrade: "Justice, Law & Foreign Trade",
  naturalDisasters: "Natural Disasters",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function displaySector(val: string): string {
  return SECTOR_DISPLAY[val] ?? val;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

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

  if (!member) redirect("/get-started");
  if (member.membership_status !== "active") redirect("/join/community/resubscribe");

  const { data: chart, error } = await supabase
    .from("ingress_charts")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (error || !chart) notFound();

  const c = chart as unknown as IngressChart;
  const si = c.system_interpretation;

  // Separate challenges and strengths
  const challenges = si?.challengesAndStrengths?.filter((i) => i.type === "challenge") ?? [];
  const strengths  = si?.challengesAndStrengths?.filter((i) => i.type === "strength") ?? [];

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
          <p className="text-sm text-muted-foreground">
            Effective period: {c.effective_time_period}
          </p>
        )}
      </div>

      {/* Short description */}
      {c.short_description && (
        <p className="text-base text-muted-foreground leading-relaxed">{c.short_description}</p>
      )}

      {/* ── System Interpretation (new structured format) ────────────────────── */}
      {si && (
        <div className="space-y-6">
          {/* Interpretation section */}
          {(si.intro || (si.body && si.body.length > 0) || si.htmlContent) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {si.title ?? "Interpretation"}
                </CardTitle>
                {si.shortDescription && (
                  <p className="text-sm text-muted-foreground">{si.shortDescription}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Intro */}
                {si.intro && (
                  <p className="leading-relaxed text-foreground/90">{si.intro}</p>
                )}

                {/* Body paragraphs */}
                {si.body && si.body.length > 0 && (
                  <div className="space-y-3">
                    {si.body.map((para, idx) => (
                      <p key={idx} className="leading-relaxed text-muted-foreground">
                        {para}
                      </p>
                    ))}
                  </div>
                )}

                {/* Legacy htmlContent */}
                {si.htmlContent && !si.intro && (
                  <div
                    className="prose prose-sm max-w-none text-foreground"
                    dangerouslySetInnerHTML={{ __html: si.htmlContent }}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Chart Ruler section */}
          {si.chartRuler && si.chartRuler.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chart Ruler</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {si.chartRuler.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 rounded-lg border p-3">
                      {item.icon && (
                        <span className="shrink-0 text-lg leading-none">{item.icon}</span>
                      )}
                      <span className="text-sm text-foreground/90">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Legacy single chart ruler */}
          {!si.chartRuler?.length && si.primaryChallenge === undefined && (
            // old format only had string chartRuler
            null
          )}

          {/* Challenges & Strengths section */}
          {(challenges.length > 0 || strengths.length > 0 || si.primaryChallenge || si.primaryStrength) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Challenges &amp; Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Challenges column */}
                  <div className="space-y-2">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-red-600">
                      <AlertTriangle className="size-3.5" /> Challenges
                    </p>
                    {challenges.length > 0 ? (
                      <ul className="space-y-2">
                        {challenges.map((item, idx) => (
                          <li
                            key={idx}
                            className="rounded-lg border border-red-200 bg-red-50/40 px-3 py-2 text-sm dark:bg-red-950/20"
                          >
                            {item.text}
                          </li>
                        ))}
                      </ul>
                    ) : si.primaryChallenge ? (
                      <div className="rounded-lg border border-red-200 bg-red-50/40 px-3 py-2 text-sm dark:bg-red-950/20">
                        {si.primaryChallenge}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">None listed.</p>
                    )}
                  </div>

                  {/* Strengths column */}
                  <div className="space-y-2">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-green-600">
                      <Zap className="size-3.5" /> Strengths
                    </p>
                    {strengths.length > 0 ? (
                      <ul className="space-y-2">
                        {strengths.map((item, idx) => (
                          <li
                            key={idx}
                            className="rounded-lg border border-green-200 bg-green-50/40 px-3 py-2 text-sm dark:bg-green-950/20"
                          >
                            {item.text}
                          </li>
                        ))}
                      </ul>
                    ) : si.primaryStrength ? (
                      <div className="rounded-lg border border-green-200 bg-green-50/40 px-3 py-2 text-sm dark:bg-green-950/20">
                        {si.primaryStrength}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">None listed.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
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

      {/* Sector Focus section */}
      {c.sector_focus.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Sector Focus</p>
          <div className="flex flex-wrap gap-2">
            {c.sector_focus.map((s) => (
              <Link
                key={s}
                href={`/community/ingress-charts?sector=${encodeURIComponent(s)}`}
                className="inline-flex"
              >
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80 transition-colors"
                >
                  {displaySector(s)}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tags section */}
      {c.tags.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Tags</p>
          <div className="flex flex-wrap gap-2">
            {c.tags.map((tag) => (
              <Link
                key={tag}
                href={`/community/ingress-charts?tag=${encodeURIComponent(tag)}`}
                className="inline-flex"
              >
                <span className="flex items-center gap-0.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer">
                  <Tag className="size-3 mr-0.5" />{tag}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
