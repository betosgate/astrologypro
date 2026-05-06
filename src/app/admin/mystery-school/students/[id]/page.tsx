"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  GraduationCap,
  XCircle,
  RotateCcw,
  Sparkles,
  Leaf,
  Compass,
  Globe,
  Moon,
  Home,
  Layers,
  Infinity,
  RefreshCw,
  User,
  Sun,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type StudentDetail = {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  membership_status: string;
  enrolled_at: string;
  start_quarter: string;
  training_status: string;
  graduated_at: string | null;
};

type DecanProgressRow = {
  id: string;
  decan_id: string;
  status: string;
  ritual_done: boolean;
  scry_done: boolean;
  journal_done: boolean;
  unlocked_at: string | null;
  completed_at: string | null;
  missed_at: string | null;
  window_open: string | null;
  window_close: string | null;
  grace_close: string | null;
  retry_year: number | null;
  retry_window_open: string | null;
  retry_window_close: string | null;
  admin_excused: boolean;
  admin_excused_at: string | null;
  excuse_reason: string | null;
  excused_at: string | null;
  excused_by: string | null;
  excused_by_email: string | null;
};

type FoundationProgress = {
  /**
   * Where the counters below come from.
   *  - "training" → Mystery School Foundation Training program
   *                 (training_categories + category_completions).
   *  - "legacy"   → Falls back to student_foundation_progress only when
   *                 the Training program is not yet seeded.
   */
  source: "training" | "legacy";
  weeks_completed: number;
  total_weeks: number;
  lessons_completed: number;
  /** Backward-compat alias rendered as "Total tasks completed". */
  total_tasks_completed: number;
  /** Per-week breakdown from Training (empty if source === "legacy"). */
  weeks?: Array<{
    category_id: string;
    week_number: number;
    title: string;
    active_lesson_count: number;
    lessons_completed: number;
    category_completed_at: string | null;
    completed: boolean;
  }>;
  /** Legacy student_foundation_progress rows (kept for historical view). */
  rows: Array<{
    id: string;
    week_number: number;
    completed_at: string | null;
    week_completed_at: string | null;
  }>;
};

type Graduation = {
  eligible: boolean;
  completed_count: number;
  unexcused_missed_count: number;
};

type DecanInfo = {
  id: string;
  decan_number: number;
  sign: string;
  planet: string;
  title: string;
  decan_name: string | null;
};

type PageData = {
  student: StudentDetail;
  decan_progress: DecanProgressRow[];
  foundation_progress: FoundationProgress;
  graduation: Graduation;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status, adminExcused }: { status: string; adminExcused: boolean }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-800">
        Completed
      </span>
    );
  }
  if (status === "missed" && adminExcused) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600">
        Excused
      </span>
    );
  }
  if (status === "missed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-red-100 text-red-700">
        <XCircle className="size-2.5" />
        Missed
      </span>
    );
  }
  if (status === "grace") {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-orange-100 text-orange-800">
        Grace
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-800">
        Active
      </span>
    );
  }
  if (status === "preview") {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary">
        Preview
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
      {status}
    </span>
  );
}

// ─── Excuse Dialog ─────────────────────────────────────────────────────────────

function ExcuseDialog({
  progressId,
  decanLabel,
  onExcused,
}: {
  progressId: string;
  decanLabel: string;
  onExcused: () => void;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleExcuse() {
    if (!reason.trim()) {
      setError("Excuse reason is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/mystery-school/excuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_decan_progress_id: progressId,
          excuse_reason: reason.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to excuse decan.");
        return;
      }
      setOpen(false);
      setReason("");
      onExcused();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-6 text-[10px] px-2">
          Excuse
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excuse Missed Decan</AlertDialogTitle>
          <AlertDialogDescription>
            You are excusing <span className="font-medium">{decanLabel}</span> for this student.
            This action is audited and cannot be undone. Provide a clear reason.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="excuse-reason" className="text-sm font-medium">
            Excuse Reason <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="excuse-reason"
            placeholder="e.g. Student was hospitalised during the decan window. Verified via documentation."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => { setReason(""); setError(null); }}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleExcuse}
            disabled={submitting || !reason.trim()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {submitting ? "Saving…" : "Confirm Excusal"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEK_THEMES: Record<number, { color: string; icon: React.ReactNode }> = {
  1: { color: "from-purple-500/20 to-indigo-500/10", icon: <Sparkles className="size-3.5" /> }, // Awakening
  2: { color: "from-emerald-500/20 to-teal-500/10", icon: <Leaf className="size-3.5" /> },      // Elements
  3: { color: "from-amber-500/20 to-orange-500/10", icon: <Compass className="size-3.5" /> },   // Celestial
  4: { color: "from-blue-500/20 to-cyan-500/10", icon: <Globe className="size-3.5" /> },      // Zodiacal
  5: { color: "from-rose-500/20 to-pink-500/10", icon: <Moon className="size-3.5" /> },       // Decans
  6: { color: "from-violet-500/20 to-purple-500/10", icon: <Home className="size-3.5" /> },     // Houses
  7: { color: "from-sky-500/20 to-blue-500/10", icon: <Layers className="size-3.5" /> },      // Aspects
  8: { color: "from-fuchsia-500/20 to-purple-500/10", icon: <Infinity className="size-3.5" /> }, // Nodes
  9: { color: "from-indigo-500/20 to-blue-500/10", icon: <RefreshCw className="size-3.5" /> },  // Transits
  10: { color: "from-rose-500/20 to-amber-500/10", icon: <User className="size-3.5" /> },      // Inner Planets
  11: { color: "from-amber-500/20 to-emerald-500/10", icon: <Sun className="size-3.5" /> },    // Synthesis
  12: { color: "from-indigo-500/20 to-purple-500/10", icon: <GraduationCap className="size-3.5" /> }, // Graduation
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<PageData | null>(null);
  const [decans, setDecans] = useState<DecanInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [studentRes, decansRes] = await Promise.all([
        fetch(`/api/admin/mystery-school/students/${id}`),
        fetch("/api/admin/mystery-school/decans"),
      ]);

      const studentJson = await studentRes.json();
      if (!studentRes.ok) {
        setError(studentJson.error ?? "Failed to load student");
        return;
      }
      setData(studentJson);

      // Decans list for label lookup — fall back gracefully if endpoint unavailable
      if (decansRes.ok) {
        const decansJson = await decansRes.json();
        // /api/admin/mystery-school/decans returns a plain array
        setDecans(Array.isArray(decansJson) ? decansJson : (decansJson.decans ?? []));
      }
    } catch {
      setError("Failed to load student data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

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
          {error ?? "Student not found."}
        </CardContent>
      </Card>
    );
  }

  const { student, decan_progress, foundation_progress, graduation } = data;

  // Build lookup: decan_id → decan info
  const decanMap = new Map<string, DecanInfo>(decans.map((d) => [d.id, d]));

  // Build a merged timeline: decan_progress rows keyed by decan_id
  const progressByDecanId = new Map<string, DecanProgressRow>(
    decan_progress.map((p) => [p.decan_id, p])
  );

  // All decan IDs from progress rows (may not have all 36 if cron hasn't touched some)
  const allProgressRows = decan_progress.slice().sort((a, b) => {
    const aNum = decanMap.get(a.decan_id)?.decan_number ?? 999;
    const bNum = decanMap.get(b.decan_id)?.decan_number ?? 999;
    return aNum - bNum;
  });

  const missedUnexcused = decan_progress.filter(
    (p) => p.status === "missed" && !p.admin_excused
  );

  return (
    <div className="space-y-6">

      {/* ── Breadcrumb ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1 flex-wrap">
          <Link href="/admin/mystery-school" className="hover:text-foreground">Mystery School</Link>
          <span>/</span>
          <Link href="/admin/mystery-school/students" className="hover:text-foreground">Students</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{student.full_name || student.email}</span>
        </div>
        <h1 className="text-xl font-bold">Student Detail</h1>
      </div>

      {/* ── Student Info ───────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Student Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-medium">{student.full_name || <span className="italic text-muted-foreground">No name</span>}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p>{student.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Enrolled</p>
              <p>{formatDate(student.enrolled_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Quarter</p>
              <p className="capitalize">{student.start_quarter}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Training Status</p>
              <p className="capitalize">{student.training_status}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Membership</p>
              <p className="capitalize">{student.membership_status}</p>
            </div>
            {student.graduated_at && (
              <div>
                <p className="text-xs text-muted-foreground">Graduated</p>
                <p>{formatDate(student.graduated_at)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Graduation Eligibility ─────────────────────────────── */}
      <Card className={graduation.eligible ? "border-green-300" : "border-amber-300"}>
        <CardContent className="py-4 px-4">
          <div className="flex items-center gap-3">
            <GraduationCap
              className={`size-5 shrink-0 ${graduation.eligible ? "text-green-600" : "text-amber-600"}`}
            />
            <div>
              <p className="text-sm font-semibold">
                {graduation.eligible ? "Eligible for Graduation" : "Not Yet Eligible"}
              </p>
              <p className="text-xs text-muted-foreground">
                {graduation.completed_count}/36 decans completed
                {graduation.unexcused_missed_count > 0
                  ? ` · Blocked by ${graduation.unexcused_missed_count} unexcused missed decan${graduation.unexcused_missed_count !== 1 ? "s" : ""}`
                  : graduation.completed_count === 36
                  ? " · All decans resolved"
                  : ""}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Foundation Progress (Training-backed in v3) ────────── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm">Q1 Foundation Progress</CardTitle>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                foundation_progress.source === "training"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
              title={
                foundation_progress.source === "training"
                  ? "Sourced from Admin Training (training_categories / lesson_completions)"
                  : "Training program not yet seeded — falling back to legacy student_foundation_progress"
              }
            >
              {foundation_progress.source === "training"
                ? "Source: Admin Training"
                : "Source: Legacy"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {(() => {
            const totalWeeks = foundation_progress.total_weeks || 12;
            const pct = totalWeeks
              ? Math.round(
                  (foundation_progress.weeks_completed / totalWeeks) * 100
                )
              : 0;
            return (
              <>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Weeks completed</span>
                    <span>
                      {foundation_progress.weeks_completed}/{totalWeeks}
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {foundation_progress.source === "training"
                    ? `Lessons completed: ${foundation_progress.lessons_completed}`
                    : `Total tasks completed: ${foundation_progress.total_tasks_completed}`}
                </p>
                {foundation_progress.source === "training" &&
                  foundation_progress.weeks &&
                  foundation_progress.weeks.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                      {foundation_progress.weeks.map((w) => {
                        const theme = WEEK_THEMES[w.week_number] || {
                          color: "from-slate-500/10 to-slate-500/5",
                          icon: <Circle className="size-3.5" />,
                        };
                        const pct = w.active_lesson_count
                          ? (w.lessons_completed / w.active_lesson_count) * 100
                          : 0;
                        const isStarted = pct > 0 && !w.completed;

                        return (
                          <div
                            key={w.category_id}
                            className={cn(
                              "relative group overflow-hidden rounded-lg border transition-all hover:shadow-md",
                              w.completed
                                ? "bg-gradient-to-br border-emerald-500/30"
                                : isStarted 
                                ? "bg-gradient-to-br border-yellow-500/30"
                                : "bg-gradient-to-br border-border/50",
                              theme.color
                            )}
                          >
                            <div className="p-3 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    "flex size-7 items-center justify-center rounded-full bg-background/50 backdrop-blur-sm shadow-sm",
                                    w.completed ? "text-emerald-600" : isStarted ? "text-yellow-600" : "text-muted-foreground"
                                  )}>
                                    {theme.icon}
                                  </div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Week {w.week_number}
                                  </span>
                                </div>
                                {w.completed && (
                                  <Badge variant="secondary" className="h-4 px-1.5 text-[8px] bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 border-none">
                                    DONE
                                  </Badge>
                                )}
                              </div>
                              
                              <h3 className="text-xs font-semibold leading-tight line-clamp-2 min-h-[2rem]">
                                {w.title}
                              </h3>

                              <div className="flex items-center justify-between pt-1">
                                <div className="flex-1 mr-3">
                                  <div className="h-1.5 w-full bg-primary/20 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-primary transition-all"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="text-[10px] font-medium tabular-nums text-primary">
                                  {w.lessons_completed}/{w.active_lesson_count}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* ── Decan Timeline ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Decan Timeline ({allProgressRows.length} tracked)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {allProgressRows.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center text-muted-foreground">
              No decan progress records yet.
            </p>
          ) : (
            <div className="divide-y">
              {allProgressRows.map((row) => {
                const decanInfo = decanMap.get(row.decan_id);
                const label = decanInfo
                  ? `${decanInfo.decan_name ?? decanInfo.title} (Decan ${decanInfo.decan_number})`
                  : `Decan ${row.decan_id.slice(0, 8)}…`;

                return (
                  <div key={row.id} className="px-4 py-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">{label}</span>
                          <StatusBadge status={row.status} adminExcused={row.admin_excused} />
                        </div>

                        {/* Task completion icons */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {[
                            { done: row.ritual_done, label: "Ritual" },
                            { done: row.scry_done, label: "Scry" },
                            { done: row.journal_done, label: "Journal" },
                          ].map((task) => (
                            <span key={task.label} className="flex items-center gap-0.5">
                              {task.done ? (
                                <CheckCircle2 className="size-3 text-green-500" />
                              ) : (
                                <Circle className="size-3 text-muted-foreground/40" />
                              )}
                              {task.label}
                            </span>
                          ))}
                        </div>

                        {/* Window dates */}
                        {row.window_open && (
                          <p className="text-[10px] text-muted-foreground">
                            Window: {formatDate(row.window_open)} – {formatDate(row.window_close)}
                            {row.grace_close && ` · Grace: ${formatDate(row.grace_close)}`}
                          </p>
                        )}

                        {/* Retry info */}
                        {row.status === "missed" && !row.admin_excused && row.retry_window_open && (
                          <div className="flex items-center gap-1.5 text-[10px] text-amber-700">
                            <RotateCcw className="size-2.5 shrink-0" />
                            Retry opens {formatDate(row.retry_window_open)}
                            {row.retry_year && ` (${row.retry_year})`}
                          </div>
                        )}

                        {/* Excuse info */}
                        {row.admin_excused && (
                          <div className="text-[10px] text-muted-foreground space-y-0.5">
                            <p>
                              Excused on {formatDate(row.excused_at ?? row.admin_excused_at)}
                              {row.excused_by_email && ` by ${row.excused_by_email}`}
                            </p>
                            {row.excuse_reason && (
                              <p className="italic">"{row.excuse_reason}"</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Excuse action */}
                      {row.status === "missed" && !row.admin_excused && (
                        <ExcuseDialog
                          progressId={row.id}
                          decanLabel={label}
                          onExcused={() => {
                            setLoading(true);
                            load();
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Missed Decans Summary ──────────────────────────────── */}
      {missedUnexcused.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 px-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-destructive">
                  {missedUnexcused.length} Unexcused Missed Decan{missedUnexcused.length !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  These block graduation. Use the Excuse button on each decan row to resolve with an audit reason.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
