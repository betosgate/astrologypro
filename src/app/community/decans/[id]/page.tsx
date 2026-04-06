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

  return (
    <div className="space-y-6">

      {/* ── Back ───────────────────────────────────────────────── */}
      <Link
        href="/community/decans"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to Decan Calendar
      </Link>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Artwork */}
        {decan.artwork_url && (
          <div className="relative h-40 w-full overflow-hidden rounded-lg border">
            <Image
              src={decan.artwork_url}
              alt={decan.decan_name ?? decan.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 640px"
            />
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-3xl">{PLANET_GLYPHS[decan.planet] ?? "●"}</span>
          <div>
            <h1 className="text-2xl font-bold">
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

        {/* Tarot card chip */}
        {decan.tarot_card_ref && (
          <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium bg-muted/40">
            <Star className="size-3 text-muted-foreground" />
            {decan.tarot_card_ref}
          </div>
        )}

        {/* Preview text */}
        {decan.preview_text && (
          <p className="text-sm text-muted-foreground italic">{decan.preview_text}</p>
        )}

        {/* Description */}
        {decan.description && (
          <p className="text-sm text-muted-foreground">{decan.description}</p>
        )}
      </div>

      {/* ── Status banners ──────────────────────────────────────── */}
      {isGrace && progress && <GraceBanner progress={progress} />}
      {isPreview && progress && <PreviewBanner progress={progress} />}
      {isActive && progress && <ActiveDateBanner progress={progress} />}

      {/* ── Locked state ────────────────────────────────────────── */}
      {isLocked && (
        <Card className="border-muted">
          <CardContent className="py-10 text-center space-y-2">
            <Lock className="mx-auto size-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">This decan is not yet unlocked.</p>
          </CardContent>
        </Card>
      )}

      {/* ── Missed state ────────────────────────────────────────── */}
      {isMissed && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-destructive">Decan missed</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  The action and grace windows for this decan have closed.
                  Contact your administrator if you need an excusal or retry.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Main content (visible for active, grace, preview, completed, missed) */}
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
                  {item.done ? (
                    <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="size-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={item.done ? "line-through text-muted-foreground" : ""}>
                    {item.label}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ── Ritual performer ─────────────────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Scroll className="size-4 text-muted-foreground" />
              <h2 className="font-semibold">Ritual</h2>
              {progress?.ritual_done && (
                <Badge className="bg-green-100 text-green-800 border-0 text-[10px]">Done</Badge>
              )}
            </div>

            {ritualSteps.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  Ritual content coming soon.
                </CardContent>
              </Card>
            ) : (
              <Card className="border-primary/20">
                <CardContent className="py-5 px-5 space-y-3">
                  {progress?.ritual_done ? (
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-5 text-green-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Ritual completed</p>
                        {ritualExecution?.completed_at && (
                          <p className="text-xs text-muted-foreground">
                            Completed{" "}
                            {new Date(ritualExecution.completed_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        This ritual has {ritualSteps.length} guided step
                        {ritualSteps.length !== 1 ? "s" : ""}.
                        {ritualInProgress &&
                          ` You are on step ${ritualExecution!.current_step + 1} of ${ritualExecution!.total_steps}.`}
                      </p>
                      {canSubmit ? (
                        <Link href={`/community/decans/${id}/ritual`}>
                          <Button size="sm" variant={ritualInProgress ? "default" : "outline"}>
                            <PlayCircle className="mr-1.5 size-3.5" />
                            {ritualInProgress ? "Continue Ritual" : "Begin Ritual"}
                          </Button>
                        </Link>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {isPreview
                            ? "Ritual available once the action window opens."
                            : "Ritual window is closed."}
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </section>

          {/* ── Scrying journal ──────────────────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="size-4 text-muted-foreground" />
              <h2 className="font-semibold">Scrying Journal</h2>
              {progress?.scry_done && (
                <Badge className="bg-green-100 text-green-800 border-0 text-[10px]">Submitted</Badge>
              )}
            </div>
            {scryJournal ? (
              /* Past entry — read-only */
              <Card>
                <CardHeader className="pb-1">
                  <CardDescription className="text-xs">
                    Submitted{" "}
                    {new Date(scryJournal.submitted_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {scryJournal.assigned_card && (
                    <p className="text-sm">
                      <span className="font-medium">Assigned card:</span>{" "}
                      {scryJournal.assigned_card}
                      {scryJournal.alternate_card && (
                        <span className="text-muted-foreground">
                          {" "}(you drew: {scryJournal.alternate_card})
                        </span>
                      )}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">
                    {scryJournal.experience_text ?? scryJournal.content}
                  </p>
                </CardContent>
              </Card>
            ) : canSubmit ? (
              <form onSubmit={handleScrySubmit} className="space-y-4">
                {/* Assigned card (read from decan) */}
                {decan.tarot_card_ref && (
                  <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                      Your assigned card for this decan
                    </p>
                    <p className="text-sm font-semibold">{decan.tarot_card_ref}</p>
                  </div>
                )}
                {/* Alternate card checkbox */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="scry-alt-card"
                    checked={scryHasAltCard}
                    onCheckedChange={(checked) => setScryHasAltCard(checked === true)}
                  />
                  <Label htmlFor="scry-alt-card" className="text-sm leading-snug cursor-pointer">
                    I drew a different card during this scrying session
                  </Label>
                </div>
                {scryHasAltCard && (
                  <div className="pl-6 space-y-1.5">
                    <Label htmlFor="scry-alt-card-input" className="text-xs">Card you drew</Label>
                    <Input
                      id="scry-alt-card-input"
                      value={scryAlternateCard}
                      onChange={(e) => setScryAlternateCard(e.target.value)}
                      placeholder="e.g. The Tower, 7 of Cups…"
                    />
                  </div>
                )}
                {/* Experience textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="scry-text" className="text-sm font-medium">
                      Describe your scrying experience
                    </Label>
                    <CharCounter value={scryExperienceText} min={50} />
                  </div>
                  <Textarea
                    id="scry-text"
                    placeholder="What images, symbols, or insights arose? What did the card reveal about this decan's energy?"
                    value={scryExperienceText}
                    onChange={(e) => setScryExperienceText(e.target.value)}
                    rows={5}
                    required
                  />
                </div>
                <Button type="submit" size="sm" disabled={submittingScry || !scryValid}>
                  {submittingScry ? "Submitting…" : "Submit Scrying Journal"}
                </Button>
              </form>
            ) : (
              <Card>
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  {isPreview
                    ? "Submission available once the action window opens."
                    : "Scrying journal not yet submitted."}
                </CardContent>
              </Card>
            )}
          </section>

          {/* ── Mundane impact journal ───────────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-muted-foreground" />
              <h2 className="font-semibold">Mundane Impact Journal</h2>
              {progress?.journal_done && (
                <Badge className="bg-green-100 text-green-800 border-0 text-[10px]">Submitted</Badge>
              )}
            </div>
            {mundaneJournal ? (
              /* Past entry — read-only */
              <Card>
                <CardHeader className="pb-1">
                  <CardDescription className="text-xs">
                    Submitted{" "}
                    {new Date(mundaneJournal.submitted_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  {mundaneJournal.relationships_section ? (
                    <>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                          Relationships &amp; Personal Connections
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{mundaneJournal.relationships_section}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                          Business &amp; Work
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{mundaneJournal.business_work_section}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                          Shifts in Perception
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{mundaneJournal.shifts_perception_section}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{mundaneJournal.content}</p>
                  )}
                </CardContent>
              </Card>
            ) : canSubmit ? (
              <form onSubmit={handleJournalSubmit} className="space-y-5">
                {/* Section progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{journalSectionsComplete} of 3 sections complete</span>
                    <span>{Math.round((journalSectionsComplete / 3) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${(journalSectionsComplete / 3) * 100}%` }}
                    />
                  </div>
                </div>
                {/* Relationships section */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="journal-rel" className="text-sm font-medium">
                      Relationships &amp; Personal Connections
                    </Label>
                    <CharCounter value={relSection} min={100} />
                  </div>
                  <Textarea
                    id="journal-rel"
                    placeholder="How has this decan's energy manifested in your personal relationships and connections?"
                    value={relSection}
                    onChange={(e) => setRelSection(e.target.value)}
                    rows={4}
                    required
                  />
                </div>
                {/* Business / Work section */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="journal-biz" className="text-sm font-medium">
                      Business &amp; Work
                    </Label>
                    <CharCounter value={bizSection} min={100} />
                  </div>
                  <Textarea
                    id="journal-biz"
                    placeholder="What shifts or events have you noticed in your professional life, work, or material affairs?"
                    value={bizSection}
                    onChange={(e) => setBizSection(e.target.value)}
                    rows={4}
                    required
                  />
                </div>
                {/* Shifts in perception section */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="journal-shift" className="text-sm font-medium">
                      Shifts in Perception
                    </Label>
                    <CharCounter value={shiftSection} min={100} />
                  </div>
                  <Textarea
                    id="journal-shift"
                    placeholder="How has your perception, worldview, or inner understanding shifted during this decan period?"
                    value={shiftSection}
                    onChange={(e) => setShiftSection(e.target.value)}
                    rows={4}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingJournal || journalSectionsComplete < 3}
                >
                  {submittingJournal ? "Submitting…" : "Submit Mundane Journal"}
                </Button>
              </form>
            ) : (
              <Card>
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  {isPreview
                    ? "Submission available once the action window opens."
                    : "Mundane journal not yet submitted."}
                </CardContent>
              </Card>
            )}
          </section>

          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}

          {/* ── Completed celebration ─────────────────────────────── */}
          {isCompleted && (
            <Card className="border-amber-400/30 bg-amber-50/20">
              <CardContent className="py-4 text-center">
                <Star className="mx-auto mb-2 size-6 text-amber-500" />
                <p className="text-sm font-semibold">
                  {decan.decan_name ?? decan.title} complete.
                </p>
                <Link
                  href="/community/decans"
                  className="text-xs text-primary hover:underline mt-1 block"
                >
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
