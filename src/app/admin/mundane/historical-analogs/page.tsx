import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HistoricalAnalogsFinder } from "@/components/mundane/historical-analogs-finder";
import { Clock, CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

type HistoricalPeriod = {
  id: string;
  label: string;
  period_start: string;
  period_end: string;
  dominant_aspects: string[];
  dominant_planets: string[];
  notes: string | null;
  outcome_description: string | null;
  tags: string[];
  created_at: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtYear(d: string) {
  return new Date(d).getFullYear();
}

function fmtPeriod(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

const TAG_COLORS: Record<string, string> = {
  economic: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  war: "bg-red-500/10 text-red-400 border-red-500/20",
  geopolitics: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  collapse: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  pandemic: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  financial: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  nuclear: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  technology: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  energy: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

function tagColor(tag: string): string {
  for (const key of Object.keys(TAG_COLORS)) {
    if (tag.includes(key)) return TAG_COLORS[key];
  }
  return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
}

// ─── Period Card ──────────────────────────────────────────────────────────────

function PeriodCard({ period }: { period: HistoricalPeriod }) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/40 flex flex-col">
      <CardContent className="flex flex-col gap-3 p-4 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
              <Clock className="size-4 text-violet-400" />
            </div>
            <div>
              <p className="font-semibold text-sm leading-snug">{period.label}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <CalendarDays className="size-3" />
                {fmtPeriod(period.period_start, period.period_end)}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-zinc-500 shrink-0">
            {fmtYear(period.period_start)}
          </span>
        </div>

        {/* Dominant aspects */}
        {period.dominant_aspects.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Aspects</p>
            <div className="flex flex-wrap gap-1">
              {period.dominant_aspects.map((a) => (
                <Badge key={a} variant="outline" className="text-[10px] border-violet-500/20 text-violet-300">
                  {a}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Dominant planets */}
        {period.dominant_planets.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {period.dominant_planets.map((p) => (
              <Badge key={p} variant="outline" className="text-[10px] border-zinc-600 text-zinc-400">
                {p}
              </Badge>
            ))}
          </div>
        )}

        {/* Outcome */}
        {period.outcome_description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{period.outcome_description}</p>
        )}

        {/* Tags */}
        {period.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-1">
            {period.tags.map((tag) => (
              <Badge key={tag} variant="outline" className={`text-[10px] capitalize ${tagColor(tag)}`}>
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HistoricalAnalogsPage() {
  const user = await requireAdmin();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: rawPeriods } = await admin
    .from("mundane_historical_periods")
    .select("id, label, period_start, period_end, dominant_aspects, dominant_planets, notes, outcome_description, tags, created_at")
    .order("period_start", { ascending: false })
    .order("id", { ascending: true });

  const periods: HistoricalPeriod[] = (rawPeriods ?? []).map((p) => ({
    id: p.id as string,
    label: p.label as string,
    period_start: p.period_start as string,
    period_end: p.period_end as string,
    dominant_aspects: (p.dominant_aspects as string[]) ?? [],
    dominant_planets: (p.dominant_planets as string[]) ?? [],
    notes: (p.notes as string | null) ?? null,
    outcome_description: (p.outcome_description as string | null) ?? null,
    tags: (p.tags as string[]) ?? [],
    created_at: p.created_at as string,
  }));

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500/10">
          <Clock className="size-6 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Historical Analog Engine</h1>
          <p className="text-sm text-muted-foreground">
            Find historical periods whose planetary signatures resemble the current sky configuration
          </p>
        </div>
      </div>

      {/* Find Analogs — client island */}
      <Suspense fallback={<Skeleton className="h-56 rounded-xl" />}>
        <HistoricalAnalogsFinder />
      </Suspense>

      {/* Historical periods list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Historical Period Library</h2>
          <Badge variant="outline" className="text-xs">
            {periods.length} period{periods.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {periods.length === 0 ? (
          <Card className="border-zinc-800">
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
              <Clock className="size-10 text-muted-foreground/30" />
              <p className="font-medium">No historical periods found</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Run the database migration to seed the 8 key historical periods.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {periods.map((p) => (
              <PeriodCard key={p.id} period={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
