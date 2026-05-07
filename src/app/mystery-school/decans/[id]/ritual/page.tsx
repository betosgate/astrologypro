"use client";

import { useEffect, useRef, useState, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  Lock,
  Scroll,
  Sparkles,
} from "lucide-react";

type RitualStep = {
  id: string;
  step_order: number;
  step_type: string;
  content: string;
  is_published: boolean;
};

type Execution = {
  id: string | null;
  current_step: number;
  total_steps: number;
  started_at: string | null;
  completed_at: string | null;
  is_complete: boolean;
};

type RitualData = {
  decan_id: string;
  steps: RitualStep[];
  execution: Execution | null;
};

const STEP_TYPE_LABELS: Record<string, string> = {
  invocation: "Invocation",
  gate: "Gate",
  instruction: "Instruction",
  affirmation: "Affirmation",
  closing: "Closing",
};

const STEP_TYPE_STYLES: Record<string, string> = {
  invocation: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  gate: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  instruction: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  affirmation: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  closing: "border-rose-400/30 bg-rose-400/10 text-rose-200",
};

const STEP_READ_DELAY_MS = 3000;

export default function RitualRunnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<RitualData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [canContinue, setCanContinue] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [started, setStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRitual() {
      const res = await fetch(`/api/mystery-school/decan/${id}/ritual`);
      if (cancelled) return;

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        if (!cancelled) {
          setError(j.error ?? "Failed to load ritual");
          setLoading(false);
        }
        return;
      }

      const nextData: RitualData = await res.json();
      if (cancelled) return;

      setData(nextData);
      if (nextData.execution) {
        setCurrentStep(nextData.execution.current_step);
        setIsComplete(nextData.execution.is_complete);
        setCompletedAt(nextData.execution.completed_at);
        setStarted(true);
      }
      setLoading(false);
    }

    void fetchRitual();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [id]);

  useEffect(() => {
    if (!started || isComplete) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCanContinue(true);
    }, STEP_READ_DELAY_MS);
  }, [currentStep, started, isComplete]);

  async function handleBegin() {
    setStarting(true);
    setError(null);
    const res = await fetch(`/api/mystery-school/decan/${id}/ritual/start`, {
      method: "POST",
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Failed to start ritual");
      setStarting(false);
      return;
    }
    const exec = await res.json();
    setCanContinue(false);
    setCurrentStep(exec.current_step ?? 0);
    setIsComplete(exec.is_complete ?? false);
    setStarted(true);
    setStarting(false);
  }

  async function handleAdvance() {
    if (!data || advancing || !canContinue) return;
    const nextStep = currentStep + 1;
    setAdvancing(true);
    setError(null);
    const res = await fetch(`/api/mystery-school/decan/${id}/ritual/step`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step_index: nextStep }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Failed to advance step");
      setAdvancing(false);
      return;
    }
    const result = await res.json();
    setCanContinue(false);
    setCurrentStep(result.current_step);
    if (result.is_complete) {
      setIsComplete(true);
      setCompletedAt(result.completed_at);
    }
    setAdvancing(false);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="space-y-6">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="rounded-3xl border border-border/60 bg-card/50 p-6">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="mt-6 h-3 w-full animate-pulse rounded bg-muted" />
            <div className="mt-4 flex gap-2">
              <div className="size-3 animate-pulse rounded-full bg-muted" />
              <div className="size-3 animate-pulse rounded-full bg-muted" />
              <div className="size-3 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
          <div className="h-72 animate-pulse rounded-3xl bg-muted" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-destructive/15">
              <AlertTriangle className="size-7 text-destructive" />
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-lg font-bold">Unable to load ritual</p>
                <p className="mt-1 text-sm text-destructive/90">{error}</p>
              </div>
              <Link href={`/mystery-school/decans/${id}`}>
                <Button variant="outline" size="lg">
                  <ArrowLeft className="mr-2 size-4" />
                  Back to Decan
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const steps = data?.steps ?? [];
  const totalSteps = steps.length;
  const currentStepObj = steps[currentStep] ?? null;
  const progressPercent =
    totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;
  const currentStepLabel = currentStepObj
    ? STEP_TYPE_LABELS[currentStepObj.step_type] ?? currentStepObj.step_type
    : "";
  const currentStepTone = currentStepObj
    ? STEP_TYPE_STYLES[currentStepObj.step_type] ?? "border-primary/30 bg-primary/10 text-primary"
    : "border-primary/30 bg-primary/10 text-primary";

  if (isComplete) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-3xl border border-emerald-500/25 bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(15,23,42,0.84)_36%,rgba(15,23,42,0.96))] p-8 sm:p-10">
          <div className="space-y-8">
            <div className="flex size-24 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.18)]">
              <CheckCircle2 className="size-12 text-emerald-300" />
            </div>
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-300">
                Ritual Recorded
              </p>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                The working is complete
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                You moved through all {totalSteps} ritual step{totalSteps !== 1 ? "s" : ""} in sequence.
                Your ritual progress for this decan has been recorded.
              </p>
              {completedAt && (
                <p className="pt-2 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-300/70">
                  Completed on{" "}
                  {new Date(completedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
            <Link href={`/mystery-school/decans/${id}`}>
              <Button size="lg" variant="outline" className="border-emerald-500/35 bg-background/40">
                <ArrowLeft className="mr-2 size-4" />
                Return to Decan
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="space-y-8">
          <Link
            href={`/mystery-school/decans/${id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Decan
          </Link>

          <section className="rounded-3xl border border-amber-500/20 bg-[linear-gradient(135deg,rgba(234,179,8,0.10),rgba(15,23,42,0.78)_34%,rgba(15,23,42,0.96))] p-6 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
              <div className="space-y-4">
                <div className="inline-flex size-12 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
                  <Scroll className="size-6 text-amber-300" />
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300">
                    Ritual Preparation
                  </p>
                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                    Enter the working with focus
                  </h1>
                </div>
                <p className="max-w-2xl text-base font-medium leading-relaxed text-muted-foreground/90">
                  This guided ritual contains {totalSteps} ordered step{totalSteps !== 1 ? "s" : ""}.
                  Settle into a quiet space, read each movement slowly, and let the sequence carry you through the decan intentionally.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/45 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300">
                  Before you begin
                </p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <CircleDashed className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">Move through every step in sequence.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CircleDashed className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">Each step pauses briefly before you can continue.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CircleDashed className="mt-0.5 size-4 shrink-0 text-muted-foreground"> </CircleDashed>
                    <span className="text-muted-foreground">Completion records the ritual for this decan.</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300">
                  Ritual Sequence
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Preview the structure before you begin.
                </p>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {totalSteps} step{totalSteps !== 1 ? "s" : ""}
              </Badge>
            </div>

            <div className="relative space-y-3">
              <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-transparent via-background/60 to-background" />
              {steps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-center gap-4 rounded-xl border border-border/40 bg-card/40 px-5 py-4"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10 text-xs font-black text-amber-300">
                    {step.step_order}
                  </div>
                  <span className="text-sm font-bold uppercase tracking-widest text-foreground/70">
                    {STEP_TYPE_LABELS[step.step_type] ?? step.step_type}
                  </span>
                  <Lock className="ml-auto size-4 text-muted-foreground/30" />
                </div>
              ))}
            </div>
          </section>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
              <AlertTriangle className="size-4" />
              {error}
            </div>
          )}

          <div className="pt-2">
            <Button
              onClick={handleBegin}
              disabled={starting || totalSteps === 0}
              size="lg"
              className="w-full px-8 font-bold shadow-md sm:w-auto"
            >
              {starting ? "Preparing..." : "Begin Ritual"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="space-y-8">
        <Link
          href={`/mystery-school/decans/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Decan
        </Link>

        <section className="rounded-3xl border border-amber-500/20 bg-[linear-gradient(135deg,rgba(234,179,8,0.08),rgba(15,23,42,0.76)_34%,rgba(15,23,42,0.96))] p-6 sm:p-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4 text-[11px] font-black uppercase tracking-[0.22em] text-amber-300">
                <span>
                  Step {currentStep + 1} of {totalSteps}
                </span>
                <span>{progressPercent}% complete</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-amber-500/10">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-700 ease-in-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={[
                      "size-2.5 rounded-full transition-all duration-500",
                      idx < currentStep
                        ? "bg-amber-400"
                        : idx === currentStep
                          ? "scale-125 bg-amber-300 ring-4 ring-amber-300/15"
                          : "border border-border/50 bg-muted",
                    ].join(" ")}
                  />
                ))}
              </div>

              {currentStepObj && (
                <div className="relative overflow-hidden rounded-3xl border border-amber-500/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] px-6 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:px-10 sm:py-12">
                  <Scroll className="pointer-events-none absolute -right-8 -top-8 size-48 rotate-12 text-amber-300/[0.04]" />
                  <div className="relative z-10 space-y-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className={`border ${currentStepTone} px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.22em]`}>
                        {currentStepLabel}
                      </Badge>
                      <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                        Guided step {currentStep + 1}
                      </div>
                    </div>

                    <p className="max-w-5xl text-md font-normal leading-10 text-foreground/92 sm:text-[1.18rem]">
                      {currentStepObj.content}
                    </p>

                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      <Sparkles className="size-3.5 text-amber-300" />
                      Allow the step to settle before continuing
                    </div>
                  </div>
                </div>
              )}
            </div>

            <aside className="rounded-2xl border border-border/60 bg-background/45 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300">
                Ritual Guidance
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-xl border border-border/50 bg-card/45 p-3">
                  <p className="font-medium">Current movement</p>
                  <p className="mt-1 text-muted-foreground">{currentStepLabel}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/45 p-3">
                  <p className="font-medium">Pacing</p>
                  <p className="mt-1 text-muted-foreground">A short pause is enforced so each step can be read and received.</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/45 p-3">
                  <p className="font-medium">Completion</p>
                  <p className="mt-1 text-muted-foreground">Finishing the final step records the ritual for this decan automatically.</p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
            <AlertTriangle className="size-4" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Button
            onClick={handleAdvance}
            disabled={!canContinue || advancing}
            className="w-full py-6 text-base font-bold shadow-md transition-all duration-300"
            size="lg"
          >
            {advancing
              ? "Saving..."
              : !canContinue
                ? "Take a moment to read..."
                : currentStep + 1 === totalSteps
                  ? "Complete Ritual"
                  : "Continue to Next Step"}
          </Button>

          <div className="min-h-4">
            {!canContinue && !advancing && (
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                Reflecting on this step...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
