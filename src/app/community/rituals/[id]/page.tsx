"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Flame,
  Loader2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Play,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import { buildRitualPlaylist } from "@/lib/community/ritual-video-map";

type RitualConfig = {
  id: string;
  ritual_name: string;
  ritual_tags: string[];
  created_at: string;
  updated_at: string;
  last_executed_at: string | null;
  execution_count: number;
  current_step: number;
  is_complete: boolean;
};

function getDisplayTags(ritualName: string, tags: string[]): string[] {
  if (ritualName === "Planetary Zodiacal Invocation Ritual of the Pentagram") {
    return tags;
  }

  const primaryTags = tags.filter(
    (tag) => !tag.startsWith("Ritual_") && !tag.includes("_Gate_")
  );

  return primaryTags.length > 0 ? primaryTags : tags;
}

export default function RitualDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [ritual, setRitual] = useState<RitualConfig | null>(null);
  const [resolvedAssets, setResolvedAssets] = useState<Record<string, { title: string | null; url: string | null }> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    void (async () => {
      const response = await fetch(`/api/community/rituals/${id}`);
      if (!response.ok) {
        setError("Ritual not found.");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setRitual(data.ritual);
      setResolvedAssets(data.resolvedAssets || null);
      setLoading(false);
    })();
  }, [id]);

  async function patchStep(payload: {
    current_step?: number;
    is_complete?: boolean;
    reset?: boolean;
  }): Promise<RitualConfig | null> {
    setSaving(true);
    const response = await fetch(`/api/community/rituals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      setRitual(data.ritual);
      setSaving(false);
      return data.ritual as RitualConfig;
    }

    setSaving(false);
    return null;
  }

  function handleBegin() {
    router.push(`/community/rituals/${id}/playback`);
  }

  async function handlePerformAgain() {
    const updatedRitual = await patchStep({ reset: true });
    if (!updatedRitual) return;
    router.push(`/community/rituals/${id}/playback`);
  }

  const playlist = useMemo(
    () => (ritual ? buildRitualPlaylist(ritual.ritual_tags, { resolvedAssets: resolvedAssets || undefined }) : []),
    [ritual, resolvedAssets]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <Loader2 className="size-8 animate-spin text-amber-400/60" />
        <p className="text-sm text-muted-foreground">Loading ritual...</p>
      </div>
    );
  }

  if (error || !ritual) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {error ?? "Ritual not found."}
        </div>
        <Button variant="outline" asChild>
          <Link href="/community/rituals">Back to My Rituals</Link>
        </Button>
      </div>
    );
  }

  const totalSteps = playlist.length;
  const isInProgress = ritual.current_step > 0 && !ritual.is_complete;
  const isComplete = ritual.is_complete;
  const completedSteps = isComplete
    ? totalSteps
    : Math.max(ritual.current_step - 1, 0);
  const nextStepNumber =
    totalSteps === 0
      ? 0
      : Math.min(Math.max(ritual.current_step, 1), totalSteps);
  const progressPct =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const displayTags = getDisplayTags(ritual.ritual_name, ritual.ritual_tags);
  const lastPerformedLabel = ritual.last_executed_at
    ? formatDate(ritual.last_executed_at)
    : "Never";

  const ordinal = (value: number) => {
    const suffixes = ["th", "st", "nd", "rd"];
    const remainder = value % 100;
    return value + (suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0]);
  };

  if (isComplete) {
    const completionCount = ritual.execution_count;

    return (
      <div className="mx-auto max-w-5xl space-y-6">
        {/* <Link
          href="/community/rituals"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          My Rituals
        </Link> */}

        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 via-background to-purple-950/20 px-8 py-14 text-center shadow-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(245,158,11,0.1),transparent_70%)]" />
          <div className="relative flex flex-col items-center gap-6">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 ring-2 ring-amber-500/20">
              <Sparkles className="size-9 text-amber-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Ritual Complete
              </h2>
              <p className="mt-2 text-muted-foreground">
                You have completed{" "}
                <span className="font-semibold text-foreground">
                  {ritual.ritual_name}
                </span>
              </p>
              {completionCount > 0 && (
                <p className="mt-1.5 text-sm text-muted-foreground">
                  This is your{" "}
                  <span className="font-semibold text-amber-400">
                    {ordinal(completionCount)}
                  </span>{" "}
                  completion.
                </p>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                onClick={handlePerformAgain}
                disabled={saving}
                variant="outline"
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                {saving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 size-4" />
                )}
                Perform Again
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500"
              >
                <Link href="/community/rituals">Back to My Rituals</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isInProgress) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        {/* <Link
          href="/community/rituals"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          My Rituals
        </Link> */}

        <div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/25 to-orange-500/15 ring-1 ring-amber-500/20">
              <Flame className="size-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {ritual.ritual_name}
              </h1>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {completedSteps} of {totalSteps} completed
                </span>
                <span>&middot;</span>
                <span>Next step: {nextStepNumber}</span>
                {ritual.execution_count > 0 && (
                  <>
                    <span>&middot;</span>
                    <span>{ritual.execution_count}x performed</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-950/10 to-card">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-950/20 px-1.5 text-[10px] text-amber-400"
              >
                In Progress - {completedSteps} of {totalSteps} completed
              </Badge>
              <span className="text-xs font-semibold text-amber-400/80">
                {progressPct}%
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Continue your ritual from the next unfinished video. Playback will
              reopen directly at step {nextStepNumber}.
            </p>

            <div className="space-y-2">
              {playlist.map((item, index) => {
                const completed = index < completedSteps;
                const current = index === completedSteps;

                return (
                  <div
                    key={`${item.tag}-${index}`}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                      completed
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : current
                        ? "border-amber-500/30 bg-amber-500/10"
                        : "border-border/40 bg-muted/10"
                    }`}
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-400 ring-1 ring-amber-500/20">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{item.title}</p>
                    </div>
                    {completed ? (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/10 text-[10px] text-emerald-400"
                      >
                        Completed
                      </Badge>
                    ) : current ? (
                      <Badge
                        variant="secondary"
                        className="bg-amber-500/10 text-[10px] text-amber-400"
                      >
                        Next
                      </Badge>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => router.push(`/community/rituals/${id}/playback`)}
                className="bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md hover:from-amber-500 hover:to-orange-500"
              >
                <Play className="mr-2 size-4" />
                Continue
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                <Link href="/community/rituals">Back to My Rituals</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        {/* <Link
          href="/community/rituals"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          My Rituals
        </Link> */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/25 to-orange-500/15 ring-1 ring-amber-500/20">
            <Flame className="size-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {ritual.ritual_name}
            </h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>
                {totalSteps} component{totalSteps !== 1 ? "s" : ""}
              </span>
              <span>&middot;</span>
              <span>Last performed: {lastPerformedLabel}</span>
              {ritual.execution_count > 0 && (
                <>
                  <span>&middot;</span>
                  <span>{ritual.execution_count}x performed</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ritual Sequence</CardTitle>
          {totalSteps === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Ritual instructions are being prepared by your guide.
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              {totalSteps} step{totalSteps !== 1 ? "s" : ""} - complete them in
              order:
            </p>
          )}
        </CardHeader>

        {totalSteps > 0 ? (
          <CardContent>
            <ol className="space-y-2">
              {playlist.map((item, index) => (
                <li
                  key={`${item.tag}-${index}`}
                  className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/10 px-3 py-2.5 text-sm"
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-400 ring-1 ring-amber-500/20">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.title}</p>
                  </div>
                  {item.kind === "opening" || item.kind === "closing" ? (
                    <Badge
                      variant="secondary"
                      className="ml-auto shrink-0 self-center bg-amber-500/10 text-[10px] text-amber-400/80"
                    >
                      {item.kind === "opening" ? "Opening" : "Closing"}
                    </Badge>
                  ) : null}
                </li>
              ))}
            </ol>
          </CardContent>
        ) : (
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {displayTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="border-amber-500/20 bg-amber-500/5 text-xs text-amber-300/70"
                >
                  {tag.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      <Button
        size="lg"
        onClick={handleBegin}
        disabled={saving}
        className="bg-gradient-to-r from-amber-600 to-orange-600 px-8 text-base font-semibold text-white shadow-xl shadow-amber-500/15 hover:from-amber-500 hover:to-orange-500"
      >
        {saving ? (
          <Loader2 className="mr-2 size-5 animate-spin" />
        ) : (
          <Flame className="mr-2 size-5" />
        )}
        Begin the Ritual
      </Button>
    </div>
  );
}
