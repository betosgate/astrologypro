"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Scroll,
  BookOpen,
  Eye,
  Star,
} from "lucide-react";

type RitualStep = {
  id: string;
  step_order: number;
  step_type: string;
  content: string;
};

type Progress = {
  status: string;
  ritual_done: boolean;
  scry_done: boolean;
  journal_done: boolean;
  unlocked_at: string | null;
  completed_at: string | null;
};

type Decan = {
  id: string;
  decan_number: number;
  sign: string;
  planet: string;
  title: string;
  start_month: number;
  start_day: number;
  end_month: number;
  end_day: number;
  description: string | null;
};

type DecanData = {
  decan: Decan;
  ritualSteps: RitualStep[];
  progress: Progress | null;
  scryJournal: { content: string; submitted_at: string } | null;
  mundaneJournal: { content: string; submitted_at: string } | null;
  studentId: string;
};

const PLANET_GLYPHS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀",
  Mars: "♂", Jupiter: "♃", Saturn: "♄",
};

const STEP_TYPE_LABELS: Record<string, string> = {
  invocation: "Invocation",
  gate: "Gate",
  instruction: "Instruction",
  affirmation: "Affirmation",
  closing: "Closing",
};

function formatDate(month: number, day: number) {
  return new Date(2000, month - 1, day).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

export default function DecanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<DecanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [ritualCompleting, setRitualCompleting] = useState(false);
  const [scryText, setScryText] = useState("");
  const [journalText, setJournalText] = useState("");
  const [submittingScry, setSubmittingScry] = useState(false);
  const [submittingJournal, setSubmittingJournal] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/mystery-school/decan/${id}`);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Failed to load decan");
    } else {
      setData(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function handleRitualComplete() {
    setRitualCompleting(true);
    await fetch(`/api/mystery-school/decan/${id}/ritual-complete`, { method: "POST" });
    await load();
    setRitualCompleting(false);
  }

  async function handleScrySubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmittingScry(true);
    const res = await fetch(`/api/mystery-school/decan/${id}/scry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: scryText }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setSubmitError(j.error ?? "Failed to submit");
    } else {
      await load();
    }
    setSubmittingScry(false);
  }

  async function handleJournalSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmittingJournal(true);
    const res = await fetch(`/api/mystery-school/decan/${id}/journal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: journalText }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setSubmitError(j.error ?? "Failed to submit");
    } else {
      await load();
    }
    setSubmittingJournal(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="py-8 text-center text-sm text-destructive">
          {error ?? "Decan not found."}
        </CardContent>
      </Card>
    );
  }

  const { decan, ritualSteps, progress, scryJournal, mundaneJournal } = data;
  const isCompleted = progress?.status === "completed";
  const isMissed = progress?.status === "missed";
  const isLocked = !progress || progress.status === "locked";

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/community/decans" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Back to Decan Calendar
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-3xl">{PLANET_GLYPHS[decan.planet] ?? "●"}</span>
          <div>
            <h1 className="text-2xl font-bold">{decan.title}</h1>
            <p className="text-muted-foreground">{decan.sign} · {decan.planet}</p>
          </div>
          {isCompleted && <Badge className="bg-green-100 text-green-800 border-0">Completed</Badge>}
          {isMissed && <Badge variant="destructive">Missed</Badge>}
        </div>

        {/* Date range (bold, prominent) */}
        <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
          <p className="text-sm font-semibold">
            Perform this ritual between{" "}
            <span className="text-primary">{formatDate(decan.start_month, decan.start_day)}</span>
            {" "}and{" "}
            <span className="text-primary">{formatDate(decan.end_month, decan.end_day)}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            2-day grace period applies after the end date.
          </p>
        </div>

        {decan.description && (
          <p className="text-sm text-muted-foreground">{decan.description}</p>
        )}
      </div>

      {isLocked && (
        <Card className="border-muted">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">This decan is not yet unlocked.</p>
          </CardContent>
        </Card>
      )}

      {!isLocked && (
        <>
          {/* Progress checklist */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Completion Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { done: progress?.ritual_done, label: "Ritual performed" },
                { done: progress?.scry_done, label: "Scrying journal submitted" },
                { done: progress?.journal_done, label: "Mundane impact journal submitted" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  {item.done
                    ? <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                    : <Circle className="size-4 text-muted-foreground shrink-0" />
                  }
                  <span className={item.done ? "line-through text-muted-foreground" : ""}>{item.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Ritual performer */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Scroll className="size-4 text-muted-foreground" />
              <h2 className="font-semibold">Ritual</h2>
              {progress?.ritual_done && <Badge className="bg-green-100 text-green-800 border-0 text-[10px]">Done</Badge>}
            </div>

            {ritualSteps.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  Ritual content coming soon.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {ritualSteps.map((step, idx) => (
                  <Card key={step.id} className={expandedStep === idx ? "border-primary/30" : undefined}>
                    <CardHeader className="py-3 px-4">
                      <button
                        className="flex items-center justify-between w-full text-left"
                        onClick={() => setExpandedStep(expandedStep === idx ? null : idx)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {step.step_order}
                          </span>
                          <span className="text-sm font-medium">
                            {STEP_TYPE_LABELS[step.step_type] ?? step.step_type}
                          </span>
                        </div>
                        {expandedStep === idx ? (
                          <ChevronUp className="size-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="size-4 text-muted-foreground" />
                        )}
                      </button>
                    </CardHeader>
                    {expandedStep === idx && (
                      <CardContent className="pt-0 pb-4 px-4">
                        <p className="text-sm whitespace-pre-wrap">{step.content}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {!progress?.ritual_done && (
              <Button
                onClick={handleRitualComplete}
                disabled={ritualCompleting}
                variant="outline"
                size="sm"
              >
                <CheckCircle2 className="mr-1.5 size-3.5" />
                {ritualCompleting ? "Saving…" : "Mark Ritual Complete"}
              </Button>
            )}
          </section>

          {/* Scrying journal */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="size-4 text-muted-foreground" />
              <h2 className="font-semibold">Scrying Journal</h2>
              {progress?.scry_done && <Badge className="bg-green-100 text-green-800 border-0 text-[10px]">Submitted</Badge>}
            </div>
            {scryJournal ? (
              <Card>
                <CardHeader className="pb-1">
                  <CardDescription className="text-xs">
                    Submitted {new Date(scryJournal.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm whitespace-pre-wrap">{scryJournal.content}</p>
                </CardContent>
              </Card>
            ) : (
              <form onSubmit={handleScrySubmit} className="space-y-3">
                <Textarea
                  placeholder="Describe your scrying experience — what images, symbols, or insights arose? What cards appeared?"
                  value={scryText}
                  onChange={(e) => setScryText(e.target.value)}
                  rows={5}
                  required
                />
                <Button type="submit" size="sm" disabled={submittingScry}>
                  {submittingScry ? "Submitting…" : "Submit Scrying Journal"}
                </Button>
              </form>
            )}
          </section>

          {/* Mundane impact journal */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-muted-foreground" />
              <h2 className="font-semibold">Mundane Impact Journal</h2>
              {progress?.journal_done && <Badge className="bg-green-100 text-green-800 border-0 text-[10px]">Submitted</Badge>}
            </div>
            {mundaneJournal ? (
              <Card>
                <CardHeader className="pb-1">
                  <CardDescription className="text-xs">
                    Submitted {new Date(mundaneJournal.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm whitespace-pre-wrap">{mundaneJournal.content}</p>
                </CardContent>
              </Card>
            ) : (
              <form onSubmit={handleJournalSubmit} className="space-y-3">
                <Textarea
                  placeholder="How has this decan's energy manifested in your daily life? Note shifts in relationships, business, health, or perception."
                  value={journalText}
                  onChange={(e) => setJournalText(e.target.value)}
                  rows={5}
                  required
                />
                <Button type="submit" size="sm" disabled={submittingJournal}>
                  {submittingJournal ? "Submitting…" : "Submit Mundane Journal"}
                </Button>
              </form>
            )}
          </section>

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          {isCompleted && (
            <Card className="border-amber-400/30 bg-amber-50/20">
              <CardContent className="py-4 text-center">
                <Star className="mx-auto mb-2 size-6 text-amber-500" />
                <p className="text-sm font-semibold">Decan {decan.title} complete.</p>
                <Link href="/community/decans" className="text-xs text-primary hover:underline mt-1 block">
                  Return to Decan Calendar →
                </Link>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
