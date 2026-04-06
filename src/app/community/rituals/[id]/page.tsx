"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { formatDate } from "@/lib/format";

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
};

export default function RitualDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [ritual, setRitual] = useState<RitualConfig | null>(null);
  const [invocations, setInvocations] = useState<Invocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0); // 0 = preparation, 1..N = active step, N+1 = complete
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await fetch(`/api/community/rituals/${id}`);
      if (!res.ok) {
        setError("Ritual not found.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setRitual(data.ritual);
      setInvocations(data.invocations ?? []);

      // Restore persisted step. If previously complete, stay at complete phase.
      const r: RitualConfig = data.ritual;
      if (r.is_complete) {
        setStep((data.invocations?.length ?? 0) + 1);
      } else if (r.current_step > 0) {
        setStep(r.current_step);
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
    // Going back is local-only — don't save backward navigation
    setStep((s) => Math.max(0, s - 1));
  }

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !ritual) {
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {error ?? "Ritual not found."}
        </div>
        <Button variant="outline" asChild>
          <Link href="/community/rituals">← Back to My Rituals</Link>
        </Button>
      </div>
    );
  }

  const totalSteps = invocations.length;
  const isComplete = step > totalSteps;
  const isActive = step > 0 && step <= totalSteps;
  const isPrep = step === 0;

  const currentInvocation = isActive ? invocations[step - 1] : null;
  const progressPct = totalSteps > 0 ? Math.round((step / totalSteps) * 100) : 0;

  const ordinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  // ── Phase: Complete ────────────────────────────────────────────────────────

  if (isComplete) {
    const completionCount = ritual.execution_count;
    return (
      <div className="space-y-6 max-w-2xl">
        <Link
          href="/community/rituals"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← My Rituals
        </Link>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="flex flex-col items-center gap-6 py-12 text-center">
            <div className="text-5xl">✨</div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Ritual Complete</h2>
              <p className="mt-2 text-muted-foreground">
                You have completed <span className="font-semibold">{ritual.ritual_name}</span>
              </p>
              {completionCount > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  This is your {ordinal(completionCount)} completion.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button onClick={handleReset} disabled={saving} variant="outline">
                {saving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 size-4" />
                )}
                Perform Again
              </Button>
              <Button asChild>
                <Link href="/community/rituals">Back to My Rituals</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Phase: Active step ─────────────────────────────────────────────────────

  if (isActive) {
    const isLastStep = step === totalSteps;
    return (
      <div className="space-y-6 max-w-2xl">
        <Link
          href="/community/rituals"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← My Rituals
        </Link>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Step {step} of {totalSteps}
              </CardTitle>
              <span className="text-xs text-muted-foreground">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🌟</span>
                <h2 className="text-xl font-bold tracking-tight">
                  {currentInvocation?.name?.replace(/_/g, " ") ?? `Step ${step}`}
                </h2>
              </div>

              {currentInvocation?.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {currentInvocation.description}
                </p>
              )}
            </div>

            {currentInvocation?.instructions && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Instructions
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {currentInvocation.instructions}
                  </p>
                </div>
              </>
            )}

            <Separator />

            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={step <= 1}
              >
                <ChevronLeft className="mr-1.5 size-4" />
                Previous
              </Button>

              {isLastStep ? (
                <Button onClick={handleComplete} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 size-4" />
                  )}
                  Complete
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={saving}>
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

  // ── Phase: Preparation (step === 0) ───────────────────────────────────────

  const lastPerformedLabel = ritual.last_executed_at
    ? formatDate(ritual.last_executed_at)
    : "Never";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/community/rituals"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← My Rituals
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <h1 className="text-2xl font-bold tracking-tight">{ritual.ritual_name}</h1>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>{totalSteps} component{totalSteps !== 1 ? "s" : ""}</span>
          <span>·</span>
          <span>Last performed: {lastPerformedLabel}</span>
          {ritual.execution_count > 0 && (
            <>
              <span>·</span>
              <span>Performed {ritual.execution_count} time{ritual.execution_count !== 1 ? "s" : ""}</span>
            </>
          )}
        </div>
      </div>

      {/* Ritual sequence preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ritual Sequence</CardTitle>
          {totalSteps === 0 ? (
            <p className="text-sm text-muted-foreground mt-1">
              Ritual instructions are being prepared by your guide.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              This ritual has {totalSteps} step{totalSteps !== 1 ? "s" : ""}. Complete them in order:
            </p>
          )}
        </CardHeader>

        {totalSteps > 0 && (
          <CardContent>
            <ol className="space-y-2">
              {invocations.map((inv, i) => (
                <li
                  key={inv.id}
                  className="flex items-start gap-3 rounded-md border px-3 py-2.5 text-sm"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary mt-0.5">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{inv.name.replace(/_/g, " ")}</p>
                    {inv.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {inv.description}
                      </p>
                    )}
                  </div>
                  {(inv.name.includes("Opening") || inv.name.includes("Closing")) && (
                    <Badge variant="secondary" className="ml-auto text-[10px] shrink-0 self-center">
                      {inv.name.includes("Opening") ? "Opening" : "Closing"}
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
              {ritual.ritual_tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      <Button size="lg" onClick={handleBegin} disabled={saving}>
        {saving ? (
          <Loader2 className="mr-2 size-5 animate-spin" />
        ) : (
          <span className="mr-2">🔥</span>
        )}
        Begin the Ritual
      </Button>
    </div>
  );
}
