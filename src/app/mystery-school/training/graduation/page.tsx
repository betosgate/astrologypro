/**
 * Mystery School Graduation Page
 * /mystery-school/training/graduation
 *
 * Server component. Protected by the /mystery-school/training layout
 * (requireMysterySchoolAccess already verified).
 *
 * Shows:
 *   - Certificate-style panel for graduated students (Priest/Priestess of the Mystery School)
 *   - Progress summary + encouragement for students not yet graduated
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { requireMysterySchoolAccess } from "@/lib/mystery-school/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFoundationWeekTimelineForUser } from "@/lib/mystery-school/foundation-progress";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Lock, Star, BookOpen, Layers, Sparkles, Flag, ChevronRight, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getStudentGraduationData(admin: SupabaseClient, userId: string, studentId: string) {
  const [foundationResult, decansResult, missedResult] = await Promise.all([
    getFoundationWeekTimelineForUser(admin, userId),
    admin
      .from("student_decan_progress")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("status", "completed"),
    admin
      .from("student_decan_progress")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("status", "missed")
      .eq("admin_excused", false),
  ]);

  const foundationWeeksCompleted = foundationResult.weeks.filter((w) => w.completed).length;

  return {
    foundationComplete: foundationWeeksCompleted,
    decansComplete: decansResult.count ?? 0,
    unexcusedMissed: missedResult.count ?? 0,
  };
}

export default async function GraduationPage() {
  const result = await requireMysterySchoolAccess();
  if (!result) redirect("/mystery-school/enroll");

  const { student } = result;
  const isGraduated = !!(student as unknown as { graduated_at?: string | null }).graduated_at;
  const graduatedAt = (student as unknown as { graduated_at?: string | null }).graduated_at;

  const admin = createAdminClient();
  const stats = await getStudentGraduationData(admin, student.user_id, student.id);

  const q1Complete = stats.foundationComplete >= 12;
  const allDecansComplete = stats.decansComplete >= 36;
  const noBlockers = stats.unexcusedMissed === 0;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const graduationPageUrl = `${appUrl}/mystery-school/training/graduation`;

  // ── Graduated view ──────────────────────────────────────────────────────────

  if (isGraduated && graduatedAt) {
    const graduationDate = new Date(graduatedAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    return (
      <div className="space-y-8 max-w-2xl">
        {/* Certificate card */}
        <div className="relative rounded-2xl border border-yellow-500/30 bg-gradient-to-b from-yellow-950/20 to-background p-8 text-center shadow-xl">
          {/* Star badge */}
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full border border-yellow-500/40 bg-yellow-500/10">
            <Star className="size-8 text-yellow-400 fill-yellow-400/30" />
          </div>

          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-yellow-500/80">
            Mystery School
          </p>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-yellow-300">
            Priest / Priestess of the Mystery School
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            This certifies the completion of the full Mystery School curriculum
          </p>

          {/* Completion summary */}
          <div className="mb-6 flex justify-center gap-6 text-sm">
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-yellow-300">36</span>
              <span className="text-xs text-muted-foreground">Decans Complete</span>
            </div>
            <div className="w-px bg-border" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-yellow-300">12</span>
              <span className="text-xs text-muted-foreground">Foundation Weeks</span>
            </div>
          </div>

          <p className="mb-6 text-sm text-muted-foreground">
            Graduated on <strong className="text-foreground">{graduationDate}</strong>
          </p>

          {/* Share section */}
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-left">
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Share Your Graduation
            </p>
            <p className="mb-3 text-xs text-muted-foreground break-all">
              {graduationPageUrl}
            </p>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <a
                  href={`https://twitter.com/intent/tweet?text=I%20graduated%20from%20the%20Mystery%20School!%20All%2036%20decans%20complete.&url=${encodeURIComponent(graduationPageUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Share on X
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Post-grad ritual builder CTA */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Layers className="size-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="mb-1 text-base font-semibold">
                  Post-Graduation Ritual Builder
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Design and save your own personal rituals using the full
                  component library — planetary invocations, decan workings,
                  seasonal rites, and more.
                </p>
                <Button asChild>
                  <Link href="/mystery-school/training/ritual-builder">
                    Access Your Ritual Builder
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Not yet graduated view ─────────────────────────────────────────────────

  const blockers = [
    !q1Complete && `Foundation: ${stats.foundationComplete}/12 weeks complete`,
    !allDecansComplete && `Decans: ${stats.decansComplete}/36 complete`,
    stats.unexcusedMissed > 0 &&
      `${stats.unexcusedMissed} unresolved missed decan${stats.unexcusedMissed > 1 ? "s" : ""}`,
  ].filter(Boolean) as string[];

  const progressPct = Math.round(
    ((stats.foundationComplete / 12) * 0.5 + (stats.decansComplete / 36) * 0.5) * 100
  );

  return (
    <div className="space-y-8 w-full pr-4 pb-12">
      {/* ── Journey Overview ── */}
      <div className="overflow-hidden rounded-2xl border border-yellow-500/20 bg-card/35 shadow-xl">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px]">
          <div className="space-y-7 border-b border-border/50 bg-gradient-to-br from-yellow-950/30 via-background to-background px-8 py-9 xl:border-b-0 xl:border-r">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg border border-yellow-500/30 bg-yellow-500/10">
                <Sparkles className="size-4 text-yellow-500" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-yellow-500">
                  Mystery School Graduation
                </p>
                <p className="text-xs text-muted-foreground">
                  Foundation, decans, and graduation eligibility
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
                Your Path to <span className="text-yellow-400">Mastery</span>
              </h1>
              <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
                Complete the Foundation curriculum and the full Decan year to receive the
                title of <span className="font-bold text-yellow-400">Priest / Priestess</span>
                {" "}of the Mystery School.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Journey completion
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Weighted evenly between Foundation and Decan work.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black tabular-nums text-yellow-400">
                    {progressPct}
                  </span>
                  <span className="ml-1 text-lg font-bold text-yellow-400">%</span>
                </div>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-emerald-400 transition-all duration-1000"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 divide-y divide-border/50 bg-muted/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0 xl:grid-cols-1 xl:divide-x-0 xl:divide-y">
            {[
              {
                label: "Foundation",
                value: `${stats.foundationComplete}/12`,
                helper: q1Complete ? "Complete" : "Weeks complete",
                icon: BookOpen,
                complete: q1Complete,
              },
              {
                label: "Decans",
                value: `${stats.decansComplete}/36`,
                helper: allDecansComplete ? "Complete" : "Decans complete",
                icon: Layers,
                complete: allDecansComplete,
              },
              {
                label: "Blockers",
                value: `${stats.unexcusedMissed}`,
                helper: noBlockers ? "None unresolved" : "Need admin resolution",
                icon: noBlockers ? CheckCircle2 : AlertCircle,
                complete: noBlockers,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-4 px-6 py-6">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-lg border",
                      item.complete
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-yellow-500/25 bg-yellow-500/10 text-yellow-400"
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-1 text-2xl font-black tabular-nums text-foreground">
                      {item.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.helper}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* ── Left Side: Detailed Progress ── */}
        <div className="xl:col-span-8 space-y-8">
          <Card className="overflow-hidden border-border/50 shadow-2xl bg-card/30 backdrop-blur-sm">
            <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                  <Flag className="size-5 text-primary" />
                  Detailed Training Status
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/50">
              {/* Foundation Q1 */}
              <div className="p-8 transition-all hover:bg-muted/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-black text-xl tracking-tight">Foundation Q1</h3>
                      <Badge 
                        variant={q1Complete ? "default" : "secondary"}
                        className={cn(
                          "px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none rounded-full",
                          q1Complete ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {q1Complete ? "COMPLETE" : "IN PROGRESS"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-md">The core curriculum of the Mystery School foundation training.</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Weeks Completed</span>
                    <span className={cn("text-3xl font-black tabular-nums", q1Complete ? "text-emerald-500" : "text-primary")}>
                      {stats.foundationComplete} <span className="text-sm text-muted-foreground font-bold">/ 12</span>
                    </span>
                  </div>
                </div>
                
                <div className="h-3 rounded-full bg-muted/50 overflow-hidden shadow-inner">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000 shadow-sm",
                      q1Complete ? "bg-emerald-500" : "bg-primary"
                    )}
                    style={{ width: `${(stats.foundationComplete / 12) * 100}%` }}
                  />
                </div>
              </div>

              {/* 36 Decans */}
              <div className="p-8 transition-all hover:bg-muted/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-black text-xl tracking-tight">36 Decans</h3>
                      <Badge 
                        variant={allDecansComplete ? "default" : "secondary"}
                        className={cn(
                          "px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none rounded-full",
                          allDecansComplete ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {allDecansComplete ? "COMPLETE" : "IN PROGRESS"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-md">Planetary rites, seasonal alignments, and the path of the decans.</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Decans Concluded</span>
                    <span className={cn("text-3xl font-black tabular-nums", allDecansComplete ? "text-emerald-500" : "text-primary")}>
                      {stats.decansComplete} <span className="text-sm text-muted-foreground font-bold">/ 36</span>
                    </span>
                  </div>
                </div>
                
                <div className="h-3 rounded-full bg-muted/50 overflow-hidden shadow-inner">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000 shadow-sm",
                      allDecansComplete ? "bg-emerald-500" : "bg-primary"
                    )}
                    style={{ width: `${(stats.decansComplete / 36) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation shortcuts - Now more expansive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Button asChild variant="outline" className="h-auto p-0 overflow-hidden group border-border/50 hover:border-primary/50 transition-all shadow-lg hover:shadow-primary/5">
              <Link href="/mystery-school/training" className="flex items-stretch w-full">
                <div className="w-20 bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <BookOpen className="size-6 text-primary" />
                </div>
                <div className="flex-1 p-6 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-black tracking-tight">Foundation Academy</p>
                    <p className="text-xs text-muted-foreground font-medium">Continue your curriculum training</p>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto p-0 overflow-hidden group border-border/50 hover:border-primary/50 transition-all shadow-lg hover:shadow-primary/5">
              <Link href="/mystery-school" className="flex items-stretch w-full">
                <div className="w-20 bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Layers className="size-6 text-primary" />
                </div>
                <div className="flex-1 p-6 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-black tracking-tight">Decan Temple</p>
                    <p className="text-xs text-muted-foreground font-medium">Perform your planetary rituals</p>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Right Side: Requirements & Status ── */}
        <div className="xl:col-span-4 space-y-8">
          <Card className="border-border/50 shadow-2xl bg-card/30 backdrop-blur-sm sticky top-8">
            <CardHeader className="pb-4 border-b border-border/50 bg-muted/10">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                <Lock className="size-4 text-muted-foreground" />
                Graduation Roadmap
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
              {blockers.length > 0 ? (
                <ul className="space-y-6">
                  {blockers.map((reason) => (
                    <li key={reason} className="flex items-start gap-4 group">
                      <div className="mt-1 size-6 rounded-full border-2 border-primary/20 flex items-center justify-center shrink-0 bg-primary/5 transition-colors group-hover:border-primary/40">
                        <div className="size-2 rounded-full bg-primary" />
                      </div>
                      <span className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">{reason}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center py-6 text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                    <div className="relative size-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <CheckCircle2 className="size-8 text-emerald-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-black text-emerald-600">All Requirements Met</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Your graduation is being processed. You will receive your title within 24 hours.
                    </p>
                  </div>
                </div>
              )}

              {stats.unexcusedMissed > 0 && (
                <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/20 space-y-3 shadow-sm shadow-destructive/5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="size-4 text-destructive" />
                    <p className="text-xs font-black text-destructive uppercase tracking-[0.15em]">Urgent Action</p>
                  </div>
                  <p className="text-xs text-destructive/80 leading-relaxed font-medium">
                    You have unresolved missed decans that act as graduation blockers. Please contact your administrator to discuss resolution options.
                  </p>
                </div>
              )}

              <Separator className="bg-border/50" />

              {/* Post-grad Locked Teaser */}
              <div className="relative group p-6 rounded-2xl border border-dashed border-border/50 bg-muted/10 opacity-70 transition-all hover:opacity-100 overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Lock className="size-16" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
                      <Layers className="size-4 text-muted-foreground" />
                    </div>
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                      Ritual Builder
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Design and save personal rituals using the full planetary component library. Unlocks upon graduation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
