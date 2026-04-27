"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Flame,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import { RitualVideoPlayer } from "@/components/community/ritual-video-player";

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

type Invocation = {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  priority: number;
  video_url: string | null;
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

// Canonical ordering: Opening -> Gate -> Invocation/Banishing -> Closing
function canonicalSort(invocations: Invocation[]): Invocation[] {
  const rank = (name: string): number => {
    if (name.includes("Opening")) return 0;
    if (name.includes("Gate")) return 1;
    if (name.includes("Closing")) return 3;
    return 2;
  };

  return [...invocations].sort((a, b) => {
    const diff = rank(a.name) - rank(b.name);
    if (diff !== 0) return diff;
    return (a.priority ?? 0) - (b.priority ?? 0);
  });
}

export default function RitualDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [ritual, setRitual] = useState<RitualConfig | null>(null);
  const [invocations, setInvocations] = useState<Invocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showSacredSpaceOverlay, setShowSacredSpaceOverlay] = useState(false);

  useEffect(() => {
    if (!id) return;

    void (async () => {
      const res = await fetch(`/api/community/rituals/${id}`);
      if (!res.ok) {
        setError("Ritual not found.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setRitual(data.ritual);
      setInvocations(canonicalSort(data.invocations ?? []));

      const nextRitual: RitualConfig = data.ritual;
      if (nextRitual.is_complete) {
        setStep((data.invocations?.length ?? 0) + 1);
      } else if (nextRitual.current_step > 0) {
        setStep(nextRitual.current_step);
      } else {
        setStep(0);
      }

      setLoading(false);
    })();
  }, [id]);

  async function patchStep(payload: {
    current_step?: number;
    is_complete?: boolean;
    reset?: boolean;
  }) {
    setSaving(true);
    const res = await fetch(`/api/community/rituals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      setRitual(data.ritual);
    }

    setSaving(false);
  }

  async function handleBegin() {
    if (invocations.length > 1) {
      setShowSacredSpaceOverlay(true);
      return;
    }

    setStep(1);
    await patchStep({ current_step: 1 });
  }

  async function handleBeginAfterOverlay() {
    setShowSacredSpaceOverlay(false);
    setStep(1);
    await patchStep({ current_step: 1 });
  }

  async function handleNext() {
    const nextStep = step + 1;
    setStep(nextStep);
    await patchStep({ current_step: nextStep });
  }

  async function handleComplete() {
    const completeStep = invocations.length + 1;
    setStep(completeStep);
    await patchStep({ current_step: completeStep, is_complete: true });
  }

  async function handleReset() {
    setStep(0);
    await patchStep({ reset: true });
  }

  function handlePrevious() {
    setStep((currentStep) => Math.max(0, currentStep - 1));
  }

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
      <div className="max-w-2xl space-y-4">
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

  if (showSacredSpaceOverlay) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-950/60 via-background to-purple-950/40" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(245,158,11,0.12),transparent_65%)]" />

        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className="size-72 animate-ping rounded-full border border-amber-500/10"
            style={{ animationDuration: "3s" }}
          />
        </div>
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className="size-96 animate-ping rounded-full border border-amber-500/5"
            style={{ animationDuration: "4.5s" }}
          />
        </div>

        <div className="relative z-10 flex max-w-lg flex-col items-center gap-8 px-6 text-center">
          <div className="flex size-24 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 ring-2 ring-amber-500/20 shadow-2xl shadow-amber-500/10">
            <Flame className="size-12 text-amber-300" aria-hidden="true" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Prepare Sacred Space
            </h2>
            <p className="mx-auto max-w-sm leading-relaxed text-muted-foreground">
              Take a moment to center yourself and prepare your space before
              beginning{" "}
              <span className="font-semibold text-amber-300">
                {ritual.ritual_name}
              </span>
              .
            </p>
            <p className="text-sm text-muted-foreground/60">
              This ritual has{" "}
              <span className="font-medium text-foreground/60">
                {invocations.length} step{invocations.length !== 1 ? "s" : ""}
              </span>
              . Complete them in sacred order.
            </p>
          </div>

          <div className="max-h-40 w-full space-y-2 overflow-y-auto rounded-2xl border border-amber-500/10 bg-white/5 p-4 backdrop-blur-md">
            {invocations.map((invocation, index) => (
              <div
                key={invocation.id}
                className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-left text-sm"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400">
                  {index + 1}
                </span>
                <span className="truncate text-white/70">
                  {invocation.name.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              onClick={handleBeginAfterOverlay}
              className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 text-base font-semibold text-white shadow-xl shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400"
            >
              <Flame className="mr-2 size-5" />
              Begin the Ritual
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setShowSacredSpaceOverlay(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              Not Yet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalSteps = invocations.length;
  const isComplete = step > totalSteps;
  const isActive = step > 0 && step <= totalSteps;
  const isPrep = step === 0;
  const currentInvocation = isActive ? invocations[step - 1] : null;
  const progressPct =
    totalSteps > 0 ? Math.round((step / totalSteps) * 100) : 0;
  const displayTags = getDisplayTags(ritual.ritual_name, ritual.ritual_tags);

  const ordinal = (value: number) => {
    const suffixes = ["th", "st", "nd", "rd"];
    const remainder = value % 100;
    return value + (suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0]);
  };

  if (isComplete) {
    const completionCount = ritual.execution_count;

    return (
      <div className="max-w-2xl space-y-6">
        <Link
          href="/community/rituals"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          My Rituals
        </Link>

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
                onClick={handleReset}
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

  if (isActive) {
    const isLastStep = step === totalSteps;

    return (
      <div className="max-w-2xl space-y-6">
        <Link
          href="/community/rituals"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          My Rituals
        </Link>

        <Card className="overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-950/10 to-card">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-amber-500/30 bg-amber-950/20 px-1.5 text-[10px] text-amber-400"
                >
                  Step {step} of {totalSteps}
                </Badge>
              </div>
              <span className="text-xs font-semibold text-amber-400/80">
                {progressPct}%
              </span>
            </div>
            <Progress
              value={progressPct}
              className="h-1.5 bg-muted/40 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500"
            />
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/20">
                  <Flame className="size-4 text-amber-400" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">
                  {currentInvocation?.name?.replace(/_/g, " ") ?? `Step ${step}`}
                </h2>
              </div>

              {currentInvocation?.description && (
                <p className="mt-3 pl-12 text-sm text-muted-foreground">
                  {currentInvocation.description}
                </p>
              )}
            </div>

            {currentInvocation?.video_url && (
              <RitualVideoPlayer
                videoUrl={currentInvocation.video_url}
                stepName={currentInvocation.name.replace(/_/g, " ")}
                isLastStep={isLastStep}
                onEnded={isLastStep ? handleComplete : handleNext}
              />
            )}

            {currentInvocation?.instructions && (
              <>
                <Separator className="bg-amber-500/10" />
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-400/60">
                    Instructions
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    {currentInvocation.instructions}
                  </p>
                </div>
              </>
            )}

            <Separator className="bg-amber-500/10" />

            <div className="flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                disabled={step <= 1}
                className="text-muted-foreground"
              >
                <ChevronLeft className="mr-1.5 size-4" />
                Previous
              </Button>

              {isLastStep ? (
                <Button
                  onClick={handleComplete}
                  disabled={saving}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md hover:from-green-500 hover:to-emerald-500"
                >
                  {saving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 size-4" />
                  )}
                  Complete Ritual
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={saving}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow hover:from-amber-500 hover:to-orange-500"
                >
                  {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Next Step
                  <ChevronRight className="ml-1.5 size-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  void isPrep;

  const lastPerformedLabel = ritual.last_executed_at
    ? formatDate(ritual.last_executed_at)
    : "Never";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/community/rituals"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          My Rituals
        </Link>
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

        {totalSteps > 0 && (
          <CardContent>
            <ol className="space-y-2">
              {invocations.map((invocation, index) => (
                <li
                  key={invocation.id}
                  className="flex items-start gap-3 rounded-xl border border-border/40 bg-muted/10 px-3 py-2.5 text-sm"
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-400 ring-1 ring-amber-500/20">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {invocation.name.replace(/_/g, " ")}
                    </p>
                    {invocation.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {invocation.description}
                      </p>
                    )}
                  </div>
                  {(invocation.name.includes("Opening") ||
                    invocation.name.includes("Closing")) && (
                    <Badge
                      variant="secondary"
                      className="ml-auto shrink-0 self-center bg-amber-500/10 text-[10px] text-amber-400/80"
                    >
                      {invocation.name.includes("Opening")
                        ? "Opening"
                        : "Closing"}
                    </Badge>
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        )}

        {totalSteps === 0 && (
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
