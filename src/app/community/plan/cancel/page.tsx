"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  X,
  BookOpen,
  Star,
  Users,
  Flame,
} from "lucide-react";

// ─── Benefits lost on cancellation ───────────────────────────────────────────

const BENEFITS_LOST = [
  {
    icon: Star,
    title: "Natal Charts & Astrology",
    description: "Access to your birth chart, transits, and cosmic insights",
  },
  {
    icon: Flame,
    title: "Sacred Rituals",
    description: "All saved ritual configurations and spiritual practices",
  },
  {
    icon: BookOpen,
    title: "Sacred Library",
    description: "Mandalism content, wisdom resources, and sacred texts",
  },
  {
    icon: Users,
    title: "Family Circle",
    description: "Relationship charts and family member profiles",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CancelMembershipPage() {
  const router = useRouter();

  const [step, setStep] = useState<"confirm" | "processing" | "done" | "error">(
    "confirm"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);

  async function handleConfirmCancel() {
    setStep("processing");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/community/plan/cancel", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ??
            "Failed to schedule cancellation. Please try again."
        );
      }

      const result = data as { current_period_end?: string };
      setPeriodEnd(result.current_period_end ?? null);
      setStep("done");
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
      setStep("error");
    }
  }

  function formatDate(iso: string | null): string {
    if (!iso) return "the end of your billing period";
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  // ── Done state ────────────────────────────────────────────────────────────

  if (step === "done") {
    return (
      <div className="max-w-lg mx-auto space-y-6 px-4 py-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="size-8 text-emerald-600" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Cancellation Scheduled</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Your membership will remain active until{" "}
              <strong>{formatDate(periodEnd)}</strong>. After that date, your
              access will end automatically.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="py-4 space-y-2">
            <p className="text-sm font-medium">What happens next:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>You keep full access until your billing period ends.</li>
              <li>No further charges will be made.</li>
              <li>You can reactivate at any time from your plan page.</li>
            </ul>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href="/community/plan">Back to My Plan</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/community">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (step === "error") {
    return (
      <div className="max-w-lg mx-auto space-y-6 px-4 py-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-red-500/10">
            <X className="size-8 text-red-600" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Cancellation Failed</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {errorMessage}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="flex-1"
            onClick={() => setStep("confirm")}
          >
            Try Again
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/community/plan">Back to My Plan</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── Confirm step (+ processing overlay) ──────────────────────────────────

  return (
    <div className="max-w-lg mx-auto space-y-6 px-4 py-8">
      {/* Back link */}
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/community/plan">
          <ArrowLeft className="mr-1.5 size-4" />
          Back to My Plan
        </Link>
      </Button>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Cancel Membership</h1>
        <p className="text-muted-foreground text-sm">
          Are you sure you want to cancel? Review what you'll lose before
          confirming.
        </p>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
        <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Your membership will remain active until the end of your current
          billing period. You will not be charged again after cancelling.
        </p>
      </div>

      {/* Benefits you'll lose */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">You'll lose access to:</CardTitle>
          <CardDescription>
            These features will no longer be available after your billing period
            ends.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {BENEFITS_LOST.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div key={benefit.title} className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{benefit.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {benefit.description}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 text-[10px] px-1.5 py-0 border-red-400/40 text-red-600"
                >
                  Lost
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="outline" className="flex-1" disabled={step === "processing"}>
          <Link href="/community/plan">Keep My Membership</Link>
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          disabled={step === "processing"}
          onClick={handleConfirmCancel}
        >
          {step === "processing" ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Cancelling…
            </>
          ) : (
            "Yes, Cancel My Membership"
          )}
        </Button>
      </div>
    </div>
  );
}
