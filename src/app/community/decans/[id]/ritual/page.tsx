"use client";

import { useEffect, useState, use, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";

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

  // Local state mirroring execution current_step so we can update optimistically
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  // Timer: disable "Continue" button until user has read for 3 seconds
  const [canContinue, setCanContinue] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [advancing, setAdvancing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [started, setStarted] = useState(false);

  async function load() {
    const res = await fetch(`/api/mystery-school/decan/${id}/ritual`);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Failed to load ritual");
      setLoading(false);
      return;
    }
    const d: RitualData = await res.json();
    setData(d);
    if (d.execution) {
      setCurrentStep(d.execution.current_step);
      setIsComplete(d.execution.is_complete);
      setCompletedAt(d.execution.completed_at);
      setStarted(true);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [id]);

  // Start read timer whenever current step changes (and we're in progress)
  useEffect(() => {
    if (!started || isComplete) return;
    setCanContinue(false);
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
    setCurrentStep(result.current_step);
    if (result.is_complete) {
      setIsComplete(true);
      setCompletedAt(result.completed_at);
    }
    setAdvancing(false);
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-3 w-full max-w-md">
          <div className="h-4 w-48 animate-pulse rounded bg-muted mx-auto" />
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive text-sm">{error}</p>
          <Link href={`/community/decans/${id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-1.5 size-3.5" /> Back to Decan
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const steps = data?.steps ?? [];
  const totalSteps = steps.length;

  // ── Complete state ────────────────────────────────────────────────────────
  if (isComplete) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="size-9 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Ritual Complete</h1>
            {completedAt && (
              <p className="text-sm text-muted-foreground">
                Completed{" "}
                {new Date(completedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              You completed all {totalSteps} ritual steps.
            </p>
          </div>
          <div className="flex flex-col gap-2 items-center">
            <Link href={`/community/decans/${id}`}>
              <Button>Return to Decan</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Not started state ─────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-lg space-y-6">
          {/* Back */}
          <Link
            href={`/community/decans/${id}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Back to Decan
          </Link>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Ritual</h1>
            <p className="text-sm text-muted-foreground">
              This ritual contains {totalSteps} step{totalSteps !== 1 ? "s" : ""}. You will move
              through them in order. Prepare yourself before beginning.
            </p>
          </div>

          {/* Preview list — dimmed */}
          <div className="space-y-2">
            {steps.map((step, idx) => (
              <div
                key={step.id}
                className="flex items-center gap-3 rounded-lg border border-border/50 px-4 py-3 opacity-50"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  {step.step_order}
                </span>
                <span className="text-sm text-muted-foreground">
                  {STEP_TYPE_LABELS[step.step_type] ?? step.step_type}
                </span>
                <Lock className="ml-auto size-3 text-muted-foreground/40" />
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={handleBegin}
            disabled={starting || totalSteps === 0}
            size="lg"
            className="w-full"
          >
            {starting ? "Preparing…" : "Begin Ritual"}
          </Button>
        </div>
      </div>
    );
  }

  // ── In-progress state ─────────────────────────────────────────────────────
  const currentStepObj = steps[currentStep] ?? null;
  const progressPercent =
    totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Back */}
        <Link
          href={`/community/decans/${id}`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to Decan
        </Link>

        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span className="text-muted-foreground">{progressPercent}% complete</span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {/* Breadcrumb dots */}
          <div className="flex items-center gap-1 flex-wrap">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={[
                  "size-2 rounded-full transition-colors",
                  idx < currentStep
                    ? "bg-green-500"
                    : idx === currentStep
                    ? "bg-primary ring-2 ring-primary/30"
                    : "bg-muted",
                ].join(" ")}
              />
            ))}
          </div>
        </div>

        {/* Current step card */}
        {currentStepObj && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-6 py-6 space-y-3">
            <Badge variant="secondary" className="text-[10px]">
              {STEP_TYPE_LABELS[currentStepObj.step_type] ?? currentStepObj.step_type}
            </Badge>
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {currentStepObj.content}
            </p>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Continue / Complete button */}
        <Button
          onClick={handleAdvance}
          disabled={!canContinue || advancing}
          className="w-full"
          size="lg"
        >
          {advancing
            ? "Saving…"
            : !canContinue
            ? "Read the step above…"
            : currentStep + 1 === totalSteps
            ? "Complete Ritual"
            : "Continue to Next Step"}
        </Button>

        {!canContinue && !advancing && (
          <p className="text-center text-xs text-muted-foreground">
            Take a moment to read and reflect before continuing.
          </p>
        )}
      </div>
    </div>
  );
}
