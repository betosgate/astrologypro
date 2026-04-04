"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  Lock,
  BookOpen,
  Music,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

type FoundationWeek = {
  id: string;
  week_number: number;
  title: string;
  content: string | null;
  audio_url: string | null;
  beto_photo_url: string | null;
  completed: boolean;
  unlocked: boolean;
  completedAt: string | null;
};

type FoundationData = {
  student: {
    id: string;
    trainingStatus: string;
    enrolledAt: string;
    startQuarter: string;
  };
  weeks: FoundationWeek[];
  totalWeeks: number;
  completedCount: number;
};

function AudioPlayer({ url, betoPhoto }: { url: string; betoPhoto: string | null }) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-muted/60 p-4">
      {betoPhoto ? (
        <img
          src={betoPhoto}
          alt="Beto"
          className="size-12 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Music className="size-5 text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground mb-1">Weekly Audio Introduction</p>
        <audio controls className="w-full h-8" preload="none">
          <source src={url} />
          Your browser does not support audio playback.
        </audio>
      </div>
    </div>
  );
}

function WeekCard({
  week,
  onComplete,
  completing,
}: {
  week: FoundationWeek;
  onComplete: (weekNumber: number) => void;
  completing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      className={
        !week.unlocked ? "opacity-60" : week.completed ? "border-green-500/30 bg-green-50/20" : undefined
      }
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {week.completed ? (
              <CheckCircle2 className="size-5 text-green-500 shrink-0 mt-0.5" />
            ) : week.unlocked ? (
              <Circle className="size-5 text-muted-foreground shrink-0 mt-0.5" />
            ) : (
              <Lock className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            )}
            <div>
              <CardTitle className="text-sm">
                Week {week.week_number}
              </CardTitle>
              <CardDescription className="text-xs font-medium mt-0.5">
                {week.title.replace(/^Week \d+ — /, "")}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {week.completed && (
              <Badge variant="secondary" className="text-[10px]">
                Done
              </Badge>
            )}
            {week.unlocked && (week.content || week.audio_url) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? (
                  <ChevronUp className="size-3.5" />
                ) : (
                  <ChevronDown className="size-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && week.unlocked && (
        <CardContent className="pt-0 space-y-4">
          {week.audio_url && (
            <AudioPlayer url={week.audio_url} betoPhoto={week.beto_photo_url} />
          )}

          {week.content && (
            <div className="prose prose-sm max-w-none text-sm text-foreground/80 whitespace-pre-wrap">
              {week.content}
            </div>
          )}

          {!week.completed && (
            <Button
              size="sm"
              onClick={() => onComplete(week.week_number)}
              disabled={completing}
              className="w-full sm:w-auto"
            >
              {completing ? "Saving…" : "Mark Week Complete"}
            </Button>
          )}

          {week.completed && week.completedAt && (
            <p className="text-xs text-muted-foreground">
              Completed{" "}
              {new Date(week.completedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function MysterySchoolTrainingPage() {
  const [data, setData] = useState<FoundationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/mystery-school/foundation");
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Failed to load training content");
    } else {
      setData(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleComplete(weekNumber: number) {
    setCompleting(true);
    const res = await fetch("/api/mystery-school/foundation/complete-week", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekNumber }),
    });
    if (res.ok) {
      await load();
    }
    setCompleting(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Mystery School Training</h1>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const progressPct = data.totalWeeks > 0
    ? Math.round((data.completedCount / data.totalWeeks) * 100)
    : 0;

  const allDone = data.completedCount >= data.totalWeeks && data.weeks.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <BookOpen className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Foundation Training</h1>
        </div>
        <p className="text-muted-foreground">
          Your 12-week Mystery School foundation. Work through each week in sequence.
        </p>
      </div>

      {/* Progress summary */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {data.completedCount} of {data.totalWeeks} weeks completed
            </span>
            <span className="text-muted-foreground">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />
          {allDone && (
            <p className="text-sm font-medium text-green-600">
              🎉 Foundation complete — your decan year begins soon.
            </p>
          )}
        </CardContent>
      </Card>

      {data.weeks.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Foundation content is being prepared. Check back soon.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {data.weeks.map((week) => (
          <WeekCard
            key={week.week_number}
            week={week}
            onComplete={handleComplete}
            completing={completing}
          />
        ))}
      </div>
    </div>
  );
}
