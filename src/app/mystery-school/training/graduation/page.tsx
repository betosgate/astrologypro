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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Lock, Star, BookOpen, Layers, Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

async function getStudentGraduationData(studentId: string) {
  const admin = createAdminClient();

  const [foundationResult, decansResult, missedResult] = await Promise.all([
    admin
      .from("student_foundation_progress")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId),
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

  return {
    foundationComplete: (foundationResult.count ?? 0),
    decansComplete: (decansResult.count ?? 0),
    unexcusedMissed: (missedResult.count ?? 0),
  };
}

export default async function GraduationPage() {
  const result = await requireMysterySchoolAccess();
  if (!result) redirect("/mystery-school/enroll");

  const { student } = result;
  const isGraduated = !!(student as unknown as { graduated_at?: string | null }).graduated_at;
  const graduatedAt = (student as unknown as { graduated_at?: string | null }).graduated_at;

  const stats = await getStudentGraduationData(student.id);

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
    <div className="space-y-6 max-w-2xl">
      {/* Gold-on-dark hero */}
      <div className="relative rounded-xl overflow-hidden border border-yellow-500/20 bg-gradient-to-br from-yellow-950/30 via-background to-background px-6 py-8 shadow-sm">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 60% at 10% 20%, rgba(234,179,8,0.07) 0%, transparent 70%)",
          }}
        />
        <div className="relative space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-500 uppercase tracking-wider">
              <Sparkles className="size-3" />
              Mystery School
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">Graduation</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete all 12 foundation weeks and all 36 decans to receive your
              Priest / Priestess title.
            </p>
          </div>

          <Separator className="opacity-20" />

          {/* Combined progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Overall completion</span>
              <span className="font-semibold text-yellow-500/80">{progressPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-yellow-500/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Progress summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Foundation */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              {q1Complete ? (
                <CheckCircle2 className="size-4 text-green-500 shrink-0" />
              ) : (
                <div className="size-4 rounded-full border-2 border-muted-foreground shrink-0" />
              )}
              <div>
                <span className="font-medium">Foundation Q1</span>
                <span className="ml-2 text-muted-foreground">
                  {stats.foundationComplete} of 12 weeks
                </span>
              </div>
            </div>
            <Badge variant={q1Complete ? "default" : "secondary"}>
              {q1Complete ? "Complete" : `${stats.foundationComplete}/12`}
            </Badge>
          </div>

          {/* Decans */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              {allDecansComplete ? (
                <CheckCircle2 className="size-4 text-green-500 shrink-0" />
              ) : (
                <div className="size-4 rounded-full border-2 border-muted-foreground shrink-0" />
              )}
              <div>
                <span className="font-medium">36 Decans</span>
                <span className="ml-2 text-muted-foreground">
                  {stats.decansComplete} of 36 completed
                </span>
              </div>
            </div>
            <Badge variant={allDecansComplete ? "default" : "secondary"}>
              {allDecansComplete ? "Complete" : `${stats.decansComplete}/36`}
            </Badge>
          </div>

          {/* Missed decans */}
          {stats.unexcusedMissed > 0 && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="size-4 rounded-full border-2 border-destructive shrink-0" />
                <div>
                  <span className="font-medium text-destructive">
                    Unresolved missed decans
                  </span>
                  <span className="ml-2 text-muted-foreground">
                    Contact your admin to resolve
                  </span>
                </div>
              </div>
              <Badge variant="destructive">{stats.unexcusedMissed}</Badge>
            </div>
          )}

          {noBlockers && q1Complete && allDecansComplete && (
            <p className="text-sm font-medium text-green-600">
              All requirements met — graduation will be processed automatically within 24 hours.
            </p>
          )}
        </CardContent>
      </Card>

      {/* What is blocking */}
      {blockers.length > 0 && (
        <Card className="border-muted">
          <CardContent className="py-4">
            <p className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Remaining Requirements
            </p>
            <ul className="space-y-2">
              {blockers.map((reason) => (
                <li key={reason} className="flex items-start gap-2 text-sm">
                  <Lock className="size-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Navigation shortcuts */}
      <div className="flex flex-wrap gap-3">
        {!q1Complete && (
          <Button asChild variant="outline" size="sm">
            <Link href="/mystery-school/training">
              <BookOpen className="size-3.5 mr-1.5" />
              Foundation Training
            </Link>
          </Button>
        )}
        {!allDecansComplete && (
          <Button asChild variant="outline" size="sm">
            <Link href="/mystery-school">
              <Layers className="size-3.5 mr-1.5" />
              Decan Training
            </Link>
          </Button>
        )}
      </div>

      {/* Locked post-grad teaser */}
      <Card className="border-dashed border-muted opacity-70">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Lock className="size-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="mb-1 text-base font-semibold text-muted-foreground">
                Post-Graduation Ritual Builder
              </h2>
              <p className="text-sm text-muted-foreground">
                Unlocks when you graduate — design personal rituals using the
                full component library: planetary invocations, decan workings,
                seasonal rites, and custom steps.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
