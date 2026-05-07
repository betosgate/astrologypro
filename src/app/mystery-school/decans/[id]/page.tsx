"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  Circle,
  ArrowLeft,
  Scroll,
  BookOpen,
  Eye,
  Star,
  Clock,
  Lock,
  AlertTriangle,
  PlayCircle,
  RotateCcw,
  User,
  Globe,
  Compass,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type RitualStep = {
  id: string;
  step_order: number;
  step_type: string;
  content: string;
  is_published: boolean;
};

type Progress = {
  status: string;
  ritual_done: boolean;
  scry_done: boolean;
  journal_done: boolean;
  unlocked_at: string | null;
  completed_at: string | null;
  window_open: string;
  window_close: string;
  grace_close: string;
  days_remaining: number | null;
  // Retry fields (set by cron after miss)
  retry_year: number | null;
  retry_window_open: string | null;
  retry_window_close: string | null;
  // Admin excuse fields
  admin_excused: boolean;
  excuse_reason: string | null;
  excused_at: string | null;
};

type RitualExecution = {
  id: string;
  current_step: number;
  total_steps: number;
  is_complete: boolean;
  completed_at: string | null;
};

type Decan = {
  id: string;
  decan_number: number;
  sign: string;
  planet: string;
  title: string;
  decan_name: string | null;
  tarot_card_ref: string | null;
  artwork_url: string | null;
  preview_text: string | null;
  start_month: number;
  start_day: number;
  end_month: number;
  end_day: number;
  description: string | null;
  astronomical_start: string | null;
  astronomical_end: string | null;
};

type ScryJournal = {
  id: string;
  assigned_card: string | null;
  alternate_card: string | null;
  experience_text: string | null;
  content: string;
  submitted_at: string;
  submission_count: number | null;
};

type MundaneJournal = {
  id: string;
  relationships_section: string | null;
  business_work_section: string | null;
  shifts_perception_section: string | null;
  content: string;
  submitted_at: string;
};

type DecanData = {
  decan: Decan;
  ritualSteps: RitualStep[];
  progress: Progress | null;
  scryJournal: ScryJournal | null;
  mundaneJournal: MundaneJournal | null;
  ritualExecution: RitualExecution | null;
  studentId: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PLANET_GLYPHS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀",
  Mars: "♂", Jupiter: "♃", Saturn: "♄",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CharCounter({ value, min }: { value: string; min: number }) {
  const len = value.trim().length;
  const ok = len >= min;
  return (
    <span className={`text-xs ${ok ? "text-green-600" : "text-muted-foreground"}`}>
      {len} / {min} min{ok ? " ✓" : ""}
    </span>
  );
}

// ─── (former STEP_TYPE_LABELS kept for reference — ritual runner page handles its own labels)

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Live countdown component ─────────────────────────────────────────────────

function LiveCountdown({ closeIso, label }: { closeIso: string; label: string }) {
  const [text, setText] = useState<string>("");

  useEffect(() => {
    function update() {
      const diff = new Date(closeIso).getTime() - Date.now();
      if (diff <= 0) { setText("Closing now"); return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      if (days > 0) setText(`${days}d ${hours}h remaining`);
      else setText(`${hours}h ${mins}m remaining`);
    }
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [closeIso]);

  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium">
      <Clock className="size-4" />
      {label}: {text}
    </span>
  );
}

// ─── Status banners ───────────────────────────────────────────────────────────

function GraceBanner({ progress }: { progress: Progress }) {
  return (
    <div className="rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 space-y-1">
      <div className="flex items-center gap-2 text-orange-800 font-semibold text-sm">
        <AlertTriangle className="size-4 shrink-0" />
        Grace Period
      </div>
      <p className="text-sm text-orange-700">
        The action window closed on{" "}
        <span className="font-medium">{formatShortDate(progress.window_close)}</span>.
        You have until{" "}
        <span className="font-medium">{formatDate(progress.grace_close)}</span> to complete
        this decan.
      </p>
      <LiveCountdown closeIso={progress.grace_close} label="Grace ends" />
    </div>
  );
}

function PreviewBanner({ progress }: { progress: Progress }) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 space-y-1">
      <div className="flex items-center gap-2 text-primary font-semibold text-sm">
        <Eye className="size-4 shrink-0" />
        Preview Mode
      </div>
      <p className="text-sm text-muted-foreground">
        This decan opens on{" "}
        <span className="font-medium text-foreground">{formatDate(progress.window_open)}</span>.
        Content is available for preview only — submission is not yet enabled.
      </p>
    </div>
  );
}

function ActiveDateBanner({ progress }: { progress: Progress }) {
  return (
    <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 space-y-1">
      <p className="text-sm font-semibold">
        Active{" "}
        <span className="text-primary">{formatShortDate(progress.window_open)}</span>
        {" "}–{" "}
        <span className="text-primary">{formatShortDate(progress.window_close)}</span>
      </p>
      <p className="text-xs text-muted-foreground">
        2-day grace period applies after {formatShortDate(progress.window_close)}.
      </p>
      <LiveCountdown closeIso={progress.window_close} label="Window closes" />
    </div>
  );
}

function MissedRetryBanner({ progress }: { progress: Progress }) {
  const retryDate = progress.retry_window_open
    ? new Date(progress.retry_window_open).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 space-y-1">
      <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
        <RotateCcw className="size-4 shrink-0" />
        Decan Missed — Retry Available
      </div>
      <p className="text-sm text-amber-700">
        The window for this decan has closed without completion.
        {retryDate && (
          <>
            {" "}This decan reopens on{" "}
            <span className="font-medium">{retryDate}</span>
            {progress.retry_year && (
              <span> (Year {progress.retry_year})</span>
            )}
            .
          </>
        )}
      </p>
      <p className="text-xs text-amber-600 mt-0.5">
        Contact your administrator if you believe this was in error.
      </p>
    </div>
  );
}

function MissedExcusedBanner({ progress }: { progress: Progress }) {
  const excusedDate = progress.excused_at
    ? new Date(progress.excused_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 space-y-1">
      <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
        <CheckCircle2 className="size-4 shrink-0 text-slate-500" />
        Missed — Admin Excused
      </div>
      <p className="text-sm text-slate-600">
        This decan was missed but has been officially excused by an administrator.
        {excusedDate && (
          <span> Excused on {excusedDate}.</span>
        )}
      </p>
      {progress.excuse_reason && (
        <p className="text-xs text-slate-500 italic">"{progress.excuse_reason}"</p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DecanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<DecanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Scry form state
  const [scryExperienceText, setScryExperienceText] = useState("");
  const [scryAlternateCard, setScryAlternateCard] = useState("");
  const [scryHasAltCard, setScryHasAltCard] = useState(false);
  const [submittingScry, setSubmittingScry] = useState(false);

  // Mundane journal form state
  const [relSection, setRelSection] = useState("");
  const [bizSection, setBizSection] = useState("");
  const [shiftSection, setShiftSection] = useState("");
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

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleScrySubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!data) return;
    const assignedCard = data.decan.tarot_card_ref ?? "Unknown Card";
    setSubmittingScry(true);
    const res = await fetch(`/api/mystery-school/decan/${id}/scry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assigned_card: assignedCard,
        alternate_card: scryHasAltCard ? scryAlternateCard : undefined,
        experience_text: scryExperienceText,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setSubmitError(j.error ?? "Failed to submit scrying journal");
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
      body: JSON.stringify({
        relationships_section: relSection,
        business_work_section: bizSection,
        shifts_perception_section: shiftSection,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setSubmitError(j.error ?? "Failed to submit mundane journal");
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

  const { decan, ritualSteps, progress, scryJournal, mundaneJournal, ritualExecution } = data;
  const status = progress?.status ?? "locked";

  // Scry form validity
  const scryValid = scryExperienceText.trim().length >= 50;
  // Mundane journal validity
  const relValid = relSection.trim().length >= 100;
  const bizValid = bizSection.trim().length >= 100;
  const shiftValid = shiftSection.trim().length >= 100;
  const journalSectionsComplete = [relValid, bizValid, shiftValid].filter(Boolean).length;
  // Ritual runner state
  const ritualInProgress =
    ritualExecution && !ritualExecution.is_complete && ritualExecution.current_step > 0;
  const isCompleted = status === "completed";
  const isMissed = status === "missed";
  const isGrace = status === "grace";
  const isPreview = status === "preview";
  const isActive = status === "active";
  const isLocked = status === "locked" || (!progress && !isPreview);

  // Preview and locked: content visible but no submissions
  const canSubmit = isActive || isGrace;
  const requirementItems = [
    { done: progress?.ritual_done, label: "Ritual", detail: "Perform the guided working" },
    { done: progress?.scry_done, label: "Scrying", detail: "Submit the card reflection" },
    { done: progress?.journal_done, label: "Mundane journal", detail: "Complete all three impact sections" },
  ];
  const requirementCount = requirementItems.filter((item) => item.done).length;
  const requirementPercent = Math.round((requirementCount / requirementItems.length) * 100);

  return (
    <div className="mx-auto max-w-6xl space-y-4">

      {/* ── Back ───────────────────────────────────────────────── */}
      <Link
        href="/mystery-school"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to Decan Calendar
      </Link>

      {/* ── Header ─────────────────────────────────────────────── */}
      <section className="space-y-5 rounded-xl border border-amber-500/25 bg-[linear-gradient(135deg,rgba(234,179,8,0.12),rgba(15,23,42,0.78)_36%,rgba(15,23,42,0.96))] p-5 sm:p-7">
        {/* Artwork */}
        {decan.artwork_url && (
          <div className="relative h-48 w-full overflow-hidden rounded-lg border border-amber-500/20 sm:h-64">
            <Image
              src={decan.artwork_url}
              alt={decan.decan_name ?? decan.title}
              fill
              className="object-cover opacity-80"
              sizes="(max-width: 768px) 100vw, 1024px"
            />
          </div>
        )}

        <div className="flex items-start gap-4 flex-wrap">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-3xl text-amber-200">{PLANET_GLYPHS[decan.planet] ?? "●"}</span>
          <div>
            <h1 className="text-3xl font-bold tracking-normal">
              {decan.decan_name ?? decan.title}
            </h1>
            <p className="text-muted-foreground text-sm">{decan.sign} · {decan.planet}</p>
          </div>

          {/* Status badges */}
          {isCompleted && (
            <Badge className="bg-green-100 text-green-800 border-0">Completed</Badge>
          )}
          {isMissed && <Badge variant="destructive">Missed</Badge>}
          {isGrace && (
            <Badge className="bg-orange-100 text-orange-800 border-0">Grace Period</Badge>
          )}
          {isPreview && (
            <Badge className="bg-primary/10 text-primary border-0">Preview</Badge>
          )}
          {isActive && (
            <Badge className="bg-amber-100 text-amber-800 border-0">Active</Badge>
          )}
        </div>

        {/* Tarot card chip + library link */}
        {decan.tarot_card_ref && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/45 px-3 py-1 text-xs font-medium">
              <Star className="size-3 text-amber-300" />
              {decan.tarot_card_ref}
            </div>
            <Link
              href={`/community/tarot?card=${encodeURIComponent(decan.tarot_card_ref)}`}
              className="text-xs text-amber-300 hover:underline"
            >
              Open card in Tarot library →
            </Link>
          </div>
        )}

        <div className="max-w-3xl space-y-2 text-sm leading-6 text-muted-foreground">
          {decan.preview_text && <p className="text-foreground/90">{decan.preview_text}</p>}
          {decan.description && <p>{decan.description}</p>}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {requirementItems.map((item) => (
          <div
            key={item.label}
            className={[
              "rounded-lg border p-4",
              item.done
                ? "border-green-500/25 bg-green-500/10"
                : "border-border/60 bg-card/55",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              {item.done ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-400" />
              ) : (
                <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── Status banners ──────────────────────────────────────── */}
      {isGrace && progress && <GraceBanner progress={progress} />}
      {isPreview && progress && <PreviewBanner progress={progress} />}
      {isActive && progress && <ActiveDateBanner progress={progress} />}
      {/* Missed: show retry banner or excused banner depending on admin_excused flag */}
      {isMissed && progress && !progress.admin_excused && (
        <MissedRetryBanner progress={progress} />
      )}
      {isMissed && progress && progress.admin_excused && (
        <MissedExcusedBanner progress={progress} />
      )}

      {/* ── Locked state ────────────────────────────────────────── */}
      {isLocked && (
        <Card className="border-muted">
          <CardContent className="py-10 text-center space-y-2">
            <Lock className="mx-auto size-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">This decan is not yet unlocked.</p>
          </CardContent>
        </Card>
      )}

      {/* ── Missed state — hide all work sections, show retry info only ── */}
      {isMissed && (
        <Card className={progress?.admin_excused ? "border-slate-200" : "border-amber-200/60"}>
          <CardContent className="py-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className={`size-5 shrink-0 mt-0.5 ${progress?.admin_excused ? "text-slate-400" : "text-amber-600"}`} />
              <div>
                <p className={`text-sm font-semibold ${progress?.admin_excused ? "text-slate-600" : "text-amber-800"}`}>
                  {progress?.admin_excused ? "Decan excused" : "Decan missed"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {progress?.admin_excused
                    ? "This decan has been excused by an administrator and will not block your graduation."
                    : progress?.retry_window_open
                    ? "This decan did not reach completion. Your retry window is shown above."
                    : "The action and grace windows for this decan have closed. Contact your administrator if you need an excusal or retry."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Main content (visible for active, grace, preview, completed — hidden for missed) */}
      {!isLocked && !isMissed && (
        <>
          {/* ── Ritual performer ─────────────────────────────────── */}
          <section className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Scroll className="size-5 text-primary" />
                </div>
                <h2 className="font-bold tracking-tight text-xl">Ritual Practice</h2>
              </div>
              {progress?.ritual_done && (
                <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3 py-1 text-[10px] uppercase tracking-widest font-black">
                  Completed
                </Badge>
              )}
            </div>

            {ritualSteps.length === 0 ? (
              <Card className="border-border/60 shadow-sm overflow-hidden">
                <CardContent className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-4">
                  <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center">
                    <Scroll className="size-6 text-muted-foreground/50 opacity-50" />
                  </div>
                  <p className="font-medium">Ritual content coming soon.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/60 shadow-sm overflow-hidden">
                <CardContent className="p-6">
                  {progress?.ritual_done ? (
                    <div className="flex items-center gap-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-5">
                      <div className="size-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/20">
                        <CheckCircle2 className="size-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-emerald-800">Ritual successfully completed</p>
                        {ritualExecution?.completed_at && (
                          <p className="text-sm font-medium text-emerald-600/80 mt-0.5">
                            Recorded on{" "}
                            {new Date(ritualExecution.completed_at).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-muted/20 border border-border/40 rounded-xl p-6">
                      <div className="space-y-1.5 text-center sm:text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Guided Practice</p>
                        <p className="text-base font-medium text-foreground/90">
                          This ritual consists of {ritualSteps.length} sequence step{ritualSteps.length !== 1 ? "s" : ""}.
                        </p>
                        {ritualInProgress && (
                          <p className="text-sm font-bold text-amber-600 mt-2 flex items-center justify-center sm:justify-start gap-1.5">
                            <PlayCircle className="size-4" /> Resuming at step {ritualExecution!.current_step + 1} of {ritualExecution!.total_steps}
                          </p>
                        )}
                      </div>
                      {canSubmit ? (
                        <Link href={`/mystery-school/decans/${id}/ritual`} className="w-full sm:w-auto">
                          <Button size="lg" className="w-full sm:w-auto font-bold shadow-sm" variant={ritualInProgress ? "default" : "default"}>
                            <PlayCircle className="mr-2 size-5" />
                            {ritualInProgress ? "Continue Ritual" : "Begin Ritual"}
                          </Button>
                        </Link>
                      ) : (
                        <div className="px-4 py-3 bg-background border border-border/50 rounded-lg text-sm font-bold text-muted-foreground flex items-center justify-center gap-2">
                          <Lock className="size-4 text-muted-foreground/60" />
                          {isPreview
                            ? "Available when action window opens"
                            : "Ritual window is closed"}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </section>

          {/* ── Scrying journal ──────────────────────────────────── */}
          <section className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Eye className="size-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold tracking-tight text-xl">Scrying Journal</h2>
                  {decan.tarot_card_ref && (
                    <Link
                      href={`/community/tarot?card=${encodeURIComponent(decan.tarot_card_ref)}`}
                      className="text-xs text-primary/80 hover:text-primary transition-colors flex items-center gap-1.5 font-medium mt-0.5"
                    >
                      <Star className="size-3" /> Card Reference: {decan.tarot_card_ref}
                    </Link>
                  )}
                </div>
              </div>
              {progress?.scry_done && (
                <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3 py-1 text-[10px] uppercase tracking-widest font-black">
                  Submitted
                </Badge>
              )}
            </div>

            <Card className="border-border/60 shadow-sm overflow-hidden">
              <CardContent className="p-6">
                {scryJournal ? (
                  /* Past entry — read-only */
                  <div className="space-y-5">
                    <div className="flex items-center justify-between border-b border-border/50 pb-5">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</p>
                        <p className="text-sm font-bold">Recorded</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</p>
                        <p className="text-sm font-bold">
                          {new Date(scryJournal.submitted_at).toLocaleDateString("en-US", {
                            month: "long", day: "numeric", year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    {scryJournal.assigned_card && (
                      <div className="bg-muted/30 rounded-xl p-5 border border-border/40">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Assigned Card</p>
                        <p className="font-bold">{scryJournal.assigned_card}</p>
                        {scryJournal.alternate_card && (
                          <p className="text-sm text-muted-foreground mt-1.5">
                            Alternate drawn: <span className="font-bold text-foreground">{scryJournal.alternate_card}</span>
                          </p>
                        )}
                      </div>
                    )}
                    <div className="pt-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Experience</p>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
                        {scryJournal.experience_text ?? scryJournal.content}
                      </p>
                    </div>
                  </div>
                ) : canSubmit ? (
                  <form onSubmit={handleScrySubmit} className="space-y-6">
                    {/* Assigned card (read from decan) */}
                    {decan.tarot_card_ref && (
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
                        <p className="text-[10px] text-amber-600/80 uppercase tracking-widest font-black mb-1.5">
                          Assigned Card
                        </p>
                        <p className="text-base font-bold text-amber-600 flex items-center gap-2">
                          <Star className="size-4" /> {decan.tarot_card_ref}
                        </p>
                      </div>
                    )}
                    {/* Alternate card checkbox */}
                    <div className="rounded-xl border border-border/50 bg-muted/20 p-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="scry-alt-card"
                          className="mt-0.5"
                          checked={scryHasAltCard}
                          onCheckedChange={(checked) => setScryHasAltCard(checked === true)}
                        />
                        <Label htmlFor="scry-alt-card" className="text-sm leading-snug cursor-pointer font-bold">
                          I drew a different card during this scrying session
                        </Label>
                      </div>
                      {scryHasAltCard && (
                        <div className="pl-7 space-y-2">
                          <Label htmlFor="scry-alt-card-input" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Card drawn</Label>
                          <Input
                            id="scry-alt-card-input"
                            className="bg-background"
                            value={scryAlternateCard}
                            onChange={(e) => setScryAlternateCard(e.target.value)}
                            placeholder="e.g. The Tower, 7 of Cups…"
                          />
                        </div>
                      )}
                    </div>
                    {/* Experience textarea */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="scry-text" className="text-sm font-bold">
                          Describe your scrying experience
                        </Label>
                        <CharCounter value={scryExperienceText} min={50} />
                      </div>
                      <Textarea
                        id="scry-text"
                        className="resize-y min-h-[140px] bg-background/50 focus:bg-background"
                        placeholder="What images, symbols, or insights arose? What did the card reveal about this decan's energy?"
                        value={scryExperienceText}
                        onChange={(e) => setScryExperienceText(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full sm:w-auto" disabled={submittingScry || !scryValid}>
                      {submittingScry ? "Submitting…" : "Submit Scrying Journal"}
                    </Button>
                  </form>
                ) : (
                  <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-4">
                    <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center">
                      <Lock className="size-6 text-muted-foreground/50" />
                    </div>
                    <p className="font-medium">
                      {isPreview
                        ? "Submission available once the action window opens."
                        : "Scrying journal not yet submitted."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* ── Mundane impact journal ───────────────────────────── */}
          <section className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="size-5 text-primary" />
                </div>
                <h2 className="font-bold tracking-tight text-xl">Mundane Impact Journal</h2>
              </div>
              {progress?.journal_done && (
                <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3 py-1 text-[10px] uppercase tracking-widest font-black">
                  Submitted
                </Badge>
              )}
            </div>

            <Card className="border-border/60 shadow-sm overflow-hidden">
              <CardContent className="p-6">
                {mundaneJournal ? (
                  /* Past entry — read-only */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-border/50 pb-5">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</p>
                        <p className="text-sm font-bold">Recorded</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</p>
                        <p className="text-sm font-bold">
                          {new Date(mundaneJournal.submitted_at).toLocaleDateString("en-US", {
                            month: "long", day: "numeric", year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    {mundaneJournal.relationships_section ? (
                      <div className="space-y-4">
                        <div className="bg-muted/20 rounded-xl p-5 border border-border/40">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                            <User className="size-3" /> Relationships &amp; Personal Connections
                          </p>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">{mundaneJournal.relationships_section}</p>
                        </div>
                        <div className="bg-muted/20 rounded-xl p-5 border border-border/40">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                            <Globe className="size-3" /> Business &amp; Work
                          </p>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">{mundaneJournal.business_work_section}</p>
                        </div>
                        <div className="bg-muted/20 rounded-xl p-5 border border-border/40">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                            <Compass className="size-3" /> Shifts in Perception
                          </p>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">{mundaneJournal.shifts_perception_section}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Impact</p>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">{mundaneJournal.content}</p>
                      </div>
                    )}
                  </div>
                ) : canSubmit ? (
                  <form onSubmit={handleJournalSubmit} className="space-y-6">
                    {/* Section progress bar */}
                    <div className="bg-primary/5 rounded-xl p-5 border border-primary/10 mb-6">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-primary">
                          <span>{journalSectionsComplete} of 3 sections complete</span>
                          <span>{Math.round((journalSectionsComplete / 3) * 100)}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-primary/15 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${(journalSectionsComplete / 3) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    {/* Relationships section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="journal-rel" className="text-sm font-bold flex items-center gap-2">
                          <User className="size-4 text-muted-foreground" /> Relationships &amp; Personal Connections
                        </Label>
                        <CharCounter value={relSection} min={100} />
                      </div>
                      <Textarea
                        id="journal-rel"
                        className="resize-y min-h-[120px] bg-background/50 focus:bg-background"
                        placeholder="How has this decan's energy manifested in your personal relationships and connections?"
                        value={relSection}
                        onChange={(e) => setRelSection(e.target.value)}
                        required
                      />
                    </div>
                    {/* Business / Work section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="journal-biz" className="text-sm font-bold flex items-center gap-2">
                          <Globe className="size-4 text-muted-foreground" /> Business &amp; Work
                        </Label>
                        <CharCounter value={bizSection} min={100} />
                      </div>
                      <Textarea
                        id="journal-biz"
                        className="resize-y min-h-[120px] bg-background/50 focus:bg-background"
                        placeholder="What shifts or events have you noticed in your professional life, work, or material affairs?"
                        value={bizSection}
                        onChange={(e) => setBizSection(e.target.value)}
                        required
                      />
                    </div>
                    {/* Shifts in perception section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="journal-shift" className="text-sm font-bold flex items-center gap-2">
                          <Compass className="size-4 text-muted-foreground" /> Shifts in Perception
                        </Label>
                        <CharCounter value={shiftSection} min={100} />
                      </div>
                      <Textarea
                        id="journal-shift"
                        className="resize-y min-h-[120px] bg-background/50 focus:bg-background"
                        placeholder="How has your perception, worldview, or inner understanding shifted during this decan period?"
                        value={shiftSection}
                        onChange={(e) => setShiftSection(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full sm:w-auto mt-6"
                      disabled={submittingJournal || journalSectionsComplete < 3}
                    >
                      {submittingJournal ? "Submitting…" : "Submit Mundane Journal"}
                    </Button>
                  </form>
                ) : (
                  <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-4">
                    <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center">
                      <Lock className="size-6 text-muted-foreground/50" />
                    </div>
                    <p className="font-medium">
                      {isPreview
                        ? "Submission available once the action window opens."
                        : "Mundane journal not yet submitted."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {submitError && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive font-medium flex items-center gap-2">
              <AlertTriangle className="size-4" />
              {submitError}
            </div>
          )}

          {/* ── Completed celebration ─────────────────────────────── */}
          {isCompleted && (
            <div className="pt-8 pb-4">
              <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 shadow-md overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Star className="size-32" />
                </div>
                <CardContent className="py-10 flex flex-col items-center text-center relative z-10">
                  <div className="size-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-5 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <Star className="size-8 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-black text-emerald-700 mb-2 tracking-tight">
                    {decan.decan_name ?? decan.title} Complete
                  </h3>
                  <p className="text-sm text-emerald-600/90 max-w-sm mb-8 font-medium">
                    You have successfully performed the rituals and recorded your observations for this decan.
                  </p>
                  <Button asChild variant="outline" className="border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-700 font-bold">
                    <Link href="/mystery-school">
                      <ArrowLeft className="mr-2 size-4" /> Return to Calendar
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
