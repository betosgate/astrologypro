"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  ListChecks,
  ClipboardCheck,
  GraduationCap,
} from "lucide-react";

/**
 * /admin/mystery-school
 *
 * Spec: docs/tasks/2026-04-30/mystery-school-admin-training-unification-v3.md
 *   §4 De-emphasize legacy Foundation editing in /admin/mystery-school.
 *   §5 Ensure 12-week content exists.
 *
 * Prior to v3 this page was the legacy Foundation week/task editor backed
 * by /api/admin/mystery-school/foundation. In v3 the source of truth for
 * Foundation curriculum moves to Admin Training, so this page becomes a
 * status hub: it surfaces whether each of the 12 Foundation weeks has at
 * least one active lesson, and routes admins to the relevant Admin
 * Training surface for editing.
 *
 * Existing routes are preserved (no destructive changes), but the legacy
 * editor is no longer the primary surface here.
 */

type WeekStatus = {
  id: string;
  name: string;
  priority: number;
  is_active: boolean;
  active_lesson_count: number;
};

type StatusPayload = {
  program_name: string;
  program_present: boolean;
  program: { id: string; name: string } | null;
  expected_weeks: number;
  active_week_count: number;
  weeks_missing_lessons: number;
  weeks: WeekStatus[];
  links: {
    programs: string;
    categories: string;
    lessons: string;
    quizzes: string;
  };
};

function StatusPill({
  variant,
  children,
}: {
  variant: "ok" | "warn" | "muted";
  children: React.ReactNode;
}) {
  const tone =
    variant === "ok"
      ? "bg-emerald-100 text-emerald-800"
      : variant === "warn"
      ? "bg-amber-100 text-amber-800"
      : "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${tone}`}
    >
      {children}
    </span>
  );
}

export default function AdminMysterySchoolPage() {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/mystery-school/training-status")
      .then(async (r) => {
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error ?? "Failed to load status");
        }
        return r.json();
      })
      .then((d) => setStatus(d as StatusPayload))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Failed to load status")
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <BookOpen className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold">Mystery School</h1>
            <Link
              href="/admin/mystery-school/decans"
              className="text-sm text-primary hover:underline"
            >
              → Decan Rituals (36)
            </Link>
            <Link
              href="/admin/mystery-school/students"
              className="text-sm text-primary hover:underline"
            >
              → Students
            </Link>
            <Link
              href="/admin/mystery-school/journals"
              className="text-sm text-primary hover:underline"
            >
              → Student Journals
            </Link>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Foundation curriculum is now managed in Admin Training. Use the
            shortcuts below to edit programs, weeks, lessons, and quizzes.
            This page tracks whether every Foundation week has active lesson
            content.
          </p>
        </div>
      </div>

      {/* ── Admin Training shortcuts ─────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            href: status?.links.programs ?? "/admin/training/programs",
            label: "Programs",
            description: "Mystery School Foundation program record",
            icon: GraduationCap,
          },
          {
            href: status?.links.categories ?? "/admin/training/categories",
            label: "Weeks (Categories)",
            description: "Manage the 12 Foundation week categories",
            icon: Layers,
          },
          {
            href: status?.links.lessons ?? "/admin/training/lessons",
            label: "Lessons",
            description: "Audio, content, video, PDF per week",
            icon: ListChecks,
          },
          {
            href: status?.links.quizzes ?? "/admin/training/quizzes",
            label: "Quizzes",
            description: "Lesson and end-of-week assessments",
            icon: ClipboardCheck,
          },
        ].map((item) => (
          <Link key={item.label} href={item.href} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/40">
              <CardContent className="py-4 px-4 flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <item.icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{item.label}</p>
                    <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* ── Foundation lesson coverage ───────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-base">
                Foundation lesson coverage
              </CardTitle>
              <CardDescription className="text-xs">
                Status of the “{status?.program_name ?? "Mystery School Foundation"}”
                Training program. Each of the 12 Foundation weeks should have
                at least one active lesson before this is the only learner
                content source.
              </CardDescription>
            </div>
            {status && (
              <div className="flex items-center gap-2">
                {status.program_present ? (
                  <Badge variant="secondary" className="text-[10px]">
                    {status.active_week_count}/{status.expected_weeks} weeks
                  </Badge>
                ) : (
                  <StatusPill variant="warn">
                    <AlertTriangle className="size-3" />
                    Program missing
                  </StatusPill>
                )}
                {status.program_present &&
                  status.weeks_missing_lessons === 0 &&
                  status.active_week_count === status.expected_weeks && (
                    <StatusPill variant="ok">
                      <CheckCircle2 className="size-3" />
                      Ready
                    </StatusPill>
                  )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-muted" />
              ))}
            </div>
          )}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {status && !status.program_present && (
            <Card className="border-amber-300/40 bg-amber-50/40">
              <CardContent className="py-4 text-sm">
                The Training program{" "}
                <span className="font-medium">{status.program_name}</span>{" "}
                does not exist (or is inactive). Create or activate it in{" "}
                <Link
                  href={status.links.programs}
                  className="text-primary hover:underline"
                >
                  Admin Training → Programs
                </Link>
                , then run the Foundation seed to add the 12 week categories.
              </CardContent>
            </Card>
          )}
          {status && status.program_present && (
            <ul className="divide-y rounded-md border">
              {status.weeks.length === 0 ? (
                <li className="px-3 py-3 text-sm text-muted-foreground">
                  No active week categories. Add them in{" "}
                  <Link
                    href={status.links.categories}
                    className="text-primary hover:underline"
                  >
                    Admin Training → Categories
                  </Link>
                  .
                </li>
              ) : (
                status.weeks.map((week) => {
                  const hasLessons = week.active_lesson_count > 0;
                  return (
                    <li
                      key={week.id}
                      className="flex items-center justify-between gap-3 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs text-muted-foreground w-8 shrink-0">
                          W{week.priority}
                        </span>
                        <span className="text-sm font-medium truncate">
                          {week.name}
                        </span>
                        {hasLessons ? (
                          <StatusPill variant="ok">
                            {week.active_lesson_count} lesson
                            {week.active_lesson_count !== 1 ? "s" : ""}
                          </StatusPill>
                        ) : (
                          <StatusPill variant="warn">
                            <AlertTriangle className="size-3" />
                            No lessons
                          </StatusPill>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={hasLessons ? "outline" : "default"}
                        asChild
                        className="h-7"
                      >
                        <Link
                          href={`${status.links.lessons}?category_id=${week.id}`}
                        >
                          {hasLessons ? "Edit" : "Add lesson"}
                        </Link>
                      </Button>
                    </li>
                  );
                })
              )}
            </ul>
          )}
          {status && status.program_present && (
            <p className="text-[11px] text-muted-foreground">
              Coverage:{" "}
              <span className="font-medium">
                {status.active_week_count - status.weeks_missing_lessons}
              </span>{" "}
              of {status.expected_weeks} weeks have active lessons.
              {status.weeks_missing_lessons > 0 &&
                ` ${status.weeks_missing_lessons} week${
                  status.weeks_missing_lessons === 1 ? "" : "s"
                } still need lesson content before learners see Training rows.`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Legacy editor link (de-emphasized) ───────────────── */}
      <Card className="border-muted-foreground/15">
        <CardContent className="py-3 px-4 flex items-start gap-3 text-xs text-muted-foreground">
          <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
          <p className="flex-1">
            Looking for the legacy Foundation week/task editor? It still
            exists for historical reference but is no longer the active
            curriculum source. Foundation lesson content lives in Admin
            Training in v3.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
