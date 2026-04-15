import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { callMundaneAI } from "@/lib/mundane-ai";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Clock,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Target,
  Layers,
  Globe,
  ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  completed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  archived: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── AI analysis shape ─────────────────────────────────────────────────────────

interface ProjectAnalysis {
  executive_summary: string;
  current_transits: Array<{ planet: string; aspect: string; significance: string }>;
  key_indicators: string[];
  risk_factors: string[];
  outlook: string;
  methodology_note: string;
}

async function generateAnalysis(
  title: string,
  description: string | null,
  projectType: string,
  entityNames: string[],
  existingNotes: string[]
): Promise<ProjectAnalysis | null> {
  const context = [
    `Project Type: ${projectType.replace(/_/g, " ")}`,
    entityNames.length > 0 ? `Focus Entities: ${entityNames.join(", ")}` : null,
    description ? `Description: ${description}` : null,
    existingNotes.length > 0
      ? `Research Notes:\n${existingNotes.slice(0, 3).map((n, i) => `${i + 1}. ${n}`).join("\n")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `Analyse the following mundane astrology research project and return a structured JSON object ONLY (no markdown, no prose outside the JSON).

Project Title: "${title}"
${context}

Return this exact JSON shape:
{
  "executive_summary": "2-3 sentence authoritative overview of the research focus and its astrological significance",
  "current_transits": [
    { "planet": "planet name", "aspect": "transit/aspect description", "significance": "why it matters for this project" }
  ],
  "key_indicators": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"],
  "risk_factors": ["risk 1", "risk 2", "risk 3"],
  "outlook": "A forward-looking paragraph (3-4 sentences) with a concrete astrological timeline and expected outcomes",
  "methodology_note": "1 sentence on which mundane astrology technique is most relevant here"
}

Rules:
- current_transits must have 3-4 items with real planet names and real transit descriptions
- key_indicators must have exactly 4 items
- risk_factors must have exactly 3 items
- All content must be specific to "${title}" — no generic boilerplate
- Return ONLY the JSON object`;

  try {
    const res = await callMundaneAI({
      prompt,
      subject_label: title,
      context,
      aspect_type: "forecast",
      max_tokens: 1200,
      skip_kb: true,
      confidence_threshold: 0,
    });

    // The lib may return JSON stringified or raw string
    let parsed: unknown;
    try {
      parsed = JSON.parse(res.text);
    } catch {
      // try to extract JSON object from text
      const match = res.text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    if (parsed && typeof parsed === "object" && "executive_summary" in (parsed as object)) {
      return parsed as ProjectAnalysis;
    }
    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export default async function DashboardMundaneResearchDetail({
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

  const { data: project, error } = await admin
    .from("mundane_research_projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !project) notFound();

  if (project.created_by !== user.id && !project.is_public) notFound();

  // Fetch notes + entities + AI analysis in parallel
  const [notesRes, entitiesRes, analysis] = await Promise.all([
    admin
      .from("mundane_project_notes")
      .select("id, title, body, note_type, created_at")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),

    (project.entity_ids?.length ?? 0) > 0
      ? admin
          .from("mundane_entities")
          .select("id, name, flag_emoji")
          .in("id", project.entity_ids)
      : Promise.resolve({ data: [] }),

    generateAnalysis(
      project.title,
      project.description,
      project.project_type,
      [], // entity names resolved below — pass empty, AI uses title + description
      []
    ),
  ]);

  const notes = notesRes.data ?? [];
  const entities = (entitiesRes.data ?? []) as Array<{ id: string; name: string; flag_emoji: string | null }>;

  // Re-generate with entity names if we have them and analysis failed first pass
  const entityNames = entities.map((e) => e.name);
  const noteSnippets = notes.slice(0, 3).map((n) => `${n.title ?? ""}: ${n.body.slice(0, 120)}`);

  const finalAnalysis =
    analysis ??
    (await generateAnalysis(
      project.title,
      project.description,
      project.project_type,
      entityNames,
      noteSnippets
    ));

  return (
    <div className="space-y-8">
      {/* ── Back ── */}
      <Link
        href="/dashboard/mundane/research"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" /> Back to research
      </Link>

      {/* ── Hero ── */}
      <div className="rounded-xl border bg-gradient-to-br from-rose-500/10 via-background to-violet-500/5 p-6 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="size-4 text-rose-400" />
          <span className="capitalize font-medium">{project.project_type.replace(/_/g, " ")}</span>
          <span>·</span>
          <Clock className="size-3.5" />
          <span>{formatDateTime(project.created_at)}</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>

        {project.description && (
          <p className="text-muted-foreground text-base leading-relaxed max-w-2xl">
            {project.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge
            variant="outline"
            className={`capitalize font-semibold px-3 py-1 ${STATUS_BADGE[project.status] ?? ""}`}
          >
            {project.status}
          </Badge>

          {entities.map((e) => (
            <Link
              key={e.id}
              href={`/dashboard/mundane/entities/${e.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm hover:bg-muted/50 transition-colors"
            >
              <span>{e.flag_emoji ?? "🌐"}</span>
              <span>{e.name}</span>
              <ChevronRight className="size-3 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── AI Analysis ── */}
      {finalAnalysis ? (
        <div className="space-y-5">

          {/* Executive Summary */}
          <Card className="border-violet-500/20 bg-violet-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="size-4 text-violet-400" />
                AI Research Analysis
                <Badge variant="outline" className="text-[10px] ml-auto bg-violet-500/10 text-violet-400 border-violet-500/20">
                  AI Generated
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm leading-relaxed">{finalAnalysis.executive_summary}</p>
            </CardContent>
          </Card>

          {/* Current Transits + Key Indicators side by side */}
          <div className="grid gap-5 md:grid-cols-2">

            {/* Current Transits */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="size-4 text-blue-400" />
                  Active Transits
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {finalAnalysis.current_transits.map((t, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {t.planet}
                        <span className="text-muted-foreground font-normal"> · {t.aspect}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.significance}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Key Indicators */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="size-4 text-emerald-400" />
                  Key Indicators
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {finalAnalysis.key_indicators.map((indicator, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-sm">{indicator}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Outlook + Risk side by side */}
          <div className="grid gap-5 md:grid-cols-2">

            {/* Outlook */}
            <Card className="border-blue-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="size-4 text-blue-400" />
                  Forecast Outlook
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm leading-relaxed">{finalAnalysis.outlook}</p>
              </CardContent>
            </Card>

            {/* Risk Factors */}
            <Card className="border-orange-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="size-4 text-orange-400" />
                  Risk Factors
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {finalAnalysis.risk_factors.map((risk, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-orange-400 shrink-0" />
                    <p className="text-sm text-muted-foreground">{risk}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Methodology note */}
          <div className="flex items-start gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
            <Layers className="size-4 shrink-0 mt-0.5 text-violet-400" />
            <span><span className="font-medium text-foreground">Methodology:</span> {finalAnalysis.methodology_note}</span>
          </div>

        </div>
      ) : (
        /* Fallback if AI fails */
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            AI analysis unavailable — showing raw project data below.
          </CardContent>
        </Card>
      )}

      {/* ── Research Notes ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="size-4 text-sky-400" />
            Research Notes
            <Badge variant="outline" className="ml-auto text-[10px]">{notes.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No notes yet.</p>
          ) : (
            <div className="space-y-4">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className="relative rounded-lg border bg-muted/20 p-4 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {n.title && (
                      <p className="font-semibold text-sm">{n.title}</p>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                      {n.note_type && (
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {n.note_type}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(n.created_at)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {n.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
