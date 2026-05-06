"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Lock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Zap,
  Eye,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ManageSubscriptionButton } from "@/components/mystery-school/manage-subscription-button";

// ─── Types ────────────────────────────────────────────────────────────────────

type DecanStatus =
  | "locked"
  | "upcoming"
  | "preview"
  | "active"
  | "grace"
  | "completed"
  | "missed";

type DecanItem = {
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
  astronomical_start: string | null;
  astronomical_end: string | null;
  status: DecanStatus;
  window_open: string;
  window_close: string;
  grace_close: string;
  unlocked_at: string | null;
  completed_at: string | null;
  ritual_done: boolean;
  scry_done: boolean;
  journal_done: boolean;
  days_remaining: number | null;
  is_current: boolean;
};

type PageData = {
  student: { id: string; trainingStatus: string; startQuarter: string };
  subscription: {
    status: string;
    enrolled_at: string | null;
    entry_quarter: string | null;
    entry_year: number | null;
    recurring_amount: number | null;
    recurring_currency: string;
    one_time_fee_amount: number | null;
    renewal_date: string | null;
    access_end_date: string | null;
  } | null;
  decans: DecanItem[];
  completedCount: number;
  totalDecans: number;
  current_decan_number: number | null;
  q1_complete: boolean;
  decan_access_locked?: boolean;
  lock_reason?: string;
  foundation?: {
    completedWeeks: number;
    totalWeeks: number;
    completedLessons: number;
    totalLessons: number;
  };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SIGN_COLORS: Record<string, string> = {
  Aries: "text-red-500",
  Taurus: "text-green-600",
  Gemini: "text-yellow-500",
  Cancer: "text-sky-400",
  Leo: "text-orange-500",
  Virgo: "text-emerald-500",
  Libra: "text-pink-400",
  Scorpio: "text-purple-600",
  Sagittarius: "text-blue-500",
  Capricorn: "text-stone-500",
  Aquarius: "text-cyan-500",
  Pisces: "text-indigo-400",
};

const PLANET_GLYPHS: Record<string, string> = {
  Sun: "☉",
  Moon: "☽",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
};

const SIGNS_ORDER = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatShortDate(isoOrMonthDay: string | { month: number; day: number }): string {
  if (typeof isoOrMonthDay === "string") {
    return new Date(isoOrMonthDay).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
  return new Date(2000, isoOrMonthDay.month - 1, isoOrMonthDay.day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount);
}

// ─── Grid cell status icon ────────────────────────────────────────────────────

function GridIcon({ status }: { status: DecanStatus }) {
  switch (status) {
    case "completed":
      return (
        <span className="flex size-6 items-center justify-center rounded-full bg-green-500 text-white">
          <CheckCircle2 className="size-3.5" />
        </span>
      );
    case "active":
      return (
        <span className="flex size-6 items-center justify-center rounded-full bg-amber-400 text-white">
          <Zap className="size-3.5" />
        </span>
      );
    case "grace":
      return (
        <span className="flex size-6 items-center justify-center rounded-full bg-orange-400 text-white text-[9px] font-bold">
          G
        </span>
      );
    case "preview":
      return (
        <span className="flex size-6 items-center justify-center rounded-full border-2 border-primary text-primary">
          <Eye className="size-3" />
        </span>
      );
    case "upcoming":
      return (
        <span className="flex size-6 items-center justify-center rounded-full border-2 border-blue-400">
          <Circle className="size-3 text-blue-400" />
        </span>
      );
    case "missed":
      return (
        <span className="flex size-6 items-center justify-center rounded-full bg-red-500 text-white">
          <AlertTriangle className="size-3.5" />
        </span>
      );
    default:
      return (
        <span className="flex size-6 items-center justify-center rounded-full bg-muted">
          <Lock className="size-3 text-muted-foreground/40" />
        </span>
      );
  }
}

// ─── Compact status badge ─────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DecanStatus }) {
  const map: Record<DecanStatus, string> = {
    completed: "bg-green-100 text-green-800",
    active: "bg-amber-100 text-amber-800",
    grace: "bg-orange-100 text-orange-800",
    preview: "bg-primary/10 text-primary",
    upcoming: "bg-blue-100 text-blue-800",
    missed: "bg-red-100 text-red-800",
    locked: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${map[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Completion pips ─────────────────────────────────────────────────────────

function CompletionPips({
  ritual,
  scry,
  journal,
}: {
  ritual: boolean;
  scry: boolean;
  journal: boolean;
}) {
  const pip = (done: boolean, label: string) => (
    <span className={`text-[10px] ${done ? "text-green-600" : "text-muted-foreground"}`}>
      {done ? "✓" : "○"} {label}
    </span>
  );
  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      {pip(ritual, "Ritual")}
      {pip(scry, "Scry")}
      {pip(journal, "Journal")}
    </div>
  );
}

// ─── Countdown component (client-side live timer) ────────────────────────────

function CountdownBadge({ closeIso }: { closeIso: string }) {
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    function update() {
      const diff = new Date(closeIso).getTime() - Date.now();
      if (diff <= 0) { setLabel("Closing"); return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      if (days > 0) setLabel(`${days}d ${hours}h remaining`);
      else {
        const mins = Math.floor((diff % 3600000) / 60000);
        setLabel(`${hours}h ${mins}m remaining`);
      }
    }
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [closeIso]);

  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
      <Clock className="size-3" />
      {label}
    </span>
  );
}

// ─── Current decan hero card ──────────────────────────────────────────────────

function CurrentDecanCard({ decan }: { decan: DecanItem }) {
  const colorClass = SIGN_COLORS[decan.sign] ?? "text-foreground";
  return (
    <Link href={`/mystery-school/decans/${decan.id}`} className="group block">
      <Card className="border-amber-400/60 bg-gradient-to-br from-amber-50/40 to-amber-100/20 shadow-sm transition-shadow group-hover:shadow-md">
        <CardContent className="py-5 px-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{PLANET_GLYPHS[decan.planet] ?? "●"}</span>
                <div>
                  <h2 className="text-base font-bold leading-tight">
                    {decan.decan_name ?? decan.title}
                  </h2>
                  <p className={`text-xs font-medium ${colorClass}`}>
                    {decan.sign} · {decan.planet}
                    {decan.tarot_card_ref && (
                      <Link
                        href="/community/tarot"
                        className="ml-2 text-muted-foreground hover:text-primary underline-offset-2 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        · {decan.tarot_card_ref}
                      </Link>
                    )}
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Active{" "}
                <span className="font-medium text-foreground">
                  {formatShortDate(decan.window_open)}
                </span>{" "}
                –{" "}
                <span className="font-medium text-foreground">
                  {formatShortDate(decan.window_close)}
                </span>
              </p>

              <CountdownBadge closeIso={decan.window_close} />

              <CompletionPips
                ritual={decan.ritual_done}
                scry={decan.scry_done}
                journal={decan.journal_done}
              />
            </div>

            <div className="flex flex-col items-end gap-2">
              <StatusBadge status="active" />
              <span className="flex items-center gap-1 text-xs text-primary font-medium">
                Continue Work <ArrowRight className="size-3" />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Upcoming decan card (smaller) ───────────────────────────────────────────

function UpcomingDecanCard({ decan }: { decan: DecanItem }) {
  const colorClass = SIGN_COLORS[decan.sign] ?? "text-foreground";
  const isPreview = decan.status === "preview";
  return (
    <Link
      href={isPreview ? `/mystery-school/decans/${decan.id}` : "#"}
      className={isPreview ? "group block" : "pointer-events-none block"}
    >
      <Card className="transition-colors group-hover:border-primary/30 opacity-80">
        <CardContent className="py-3 px-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Lock className="size-3 text-muted-foreground/50 shrink-0" />
                <span className={`text-xs font-semibold ${colorClass}`}>{decan.sign}</span>
              </div>
              <p className="text-sm font-medium truncate">{decan.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isPreview ? "Preview" : "Unlocks"}{" "}
                {formatShortDate(decan.window_open)}
              </p>
            </div>
            <StatusBadge status={decan.status as DecanStatus} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Compact grid cell (36-cell overview) ─────────────────────────────────────

function DecanCell({ decan }: { decan: DecanItem }) {
  const canClick =
    decan.status !== "locked" && decan.status !== "upcoming";
  const colorClass = SIGN_COLORS[decan.sign] ?? "text-muted-foreground";

  return (
    <Link
      href={canClick ? `/mystery-school/decans/${decan.id}` : "#"}
      className={canClick ? "group block" : "pointer-events-none block"}
      title={`${decan.title} — ${decan.status}`}
    >
      <div
        className={`flex flex-col items-center justify-center rounded-md border py-2 px-1 text-center transition-colors ${
          decan.status === "active"
            ? "border-amber-400/60 bg-amber-50/30"
            : decan.status === "completed"
            ? "border-green-400/30 bg-green-50/20"
            : decan.status === "missed"
            ? "border-red-400/30 bg-red-50/20"
            : decan.status === "grace"
            ? "border-orange-400/30 bg-orange-50/20"
            : decan.status === "preview"
            ? "border-primary/30 group-hover:bg-primary/5"
            : "opacity-50"
        }`}
      >
        <GridIcon status={decan.status} />
        <span className={`mt-1 text-[9px] font-medium ${colorClass} leading-none`}>
          {decan.decan_number}
        </span>
        <span className="text-[8px] text-muted-foreground leading-none truncate w-full px-0.5">
          {decan.sign.slice(0, 3)}
        </span>
      </div>
    </Link>
  );
}

// ─── Status legend ────────────────────────────────────────────────────────────

function StatusLegend() {
  const items: { status: DecanStatus; label: string }[] = [
    { status: "active", label: "Active" },
    { status: "grace", label: "Grace" },
    { status: "preview", label: "Preview" },
    { status: "upcoming", label: "Upcoming" },
    { status: "completed", label: "Completed" },
    { status: "missed", label: "Missed" },
    { status: "locked", label: "Locked" },
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
      {items.map(({ status, label }) => (
        <span key={status} className="flex items-center gap-1.5">
          <GridIcon status={status} />
          {label}
        </span>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DecansProgressPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPageData(showLoader: boolean) {
      if (showLoader) {
        setLoading(true);
      }

      try {
        const response = await fetch("/api/mystery-school/decans", {
          cache: "no-store",
        });
        const payload = await response.json();

        if (cancelled) return;

        if (payload.error) {
          setError(payload.error);
          setData(null);
          return;
        }

        setError(null);
        setData(payload);
      } catch {
        if (!cancelled) {
          setError("Failed to load");
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    function handlePageShow() {
      void loadPageData(false);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void loadPageData(false);
      }
    }

    void loadPageData(true);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-28 animate-pulse rounded-lg bg-muted" />
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="py-8 text-center text-sm text-destructive">
          {error ?? "Could not load decans."}
        </CardContent>
      </Card>
    );
  }

  if (data.decan_access_locked) {
    const foundation = data.foundation;
    const totalWeeks = foundation?.totalWeeks ?? 12;
    const completedWeeks = foundation?.completedWeeks ?? 0;
    const foundationPct =
      totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0;

    return (
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-xl border border-yellow-500/20 bg-gradient-to-br from-yellow-950/30 via-background to-background px-6 py-8 shadow-sm">
          <div className="relative space-y-5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-500">
                <Sparkles className="size-3" />
                Mystery School
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                <Lock className="size-3" />
                Foundation In Progress
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Complete Foundation Training First
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Your Decan year unlocks after all Foundation Q1 weeks are complete.
                Continue your Foundation lessons, then return here for the
                time-based Decan curriculum.
              </p>
            </div>

            <Separator className="opacity-20" />

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {completedWeeks} of {totalWeeks} Foundation weeks completed
                </span>
                <span className="font-semibold text-yellow-500/80">
                  {foundationPct}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-yellow-500/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-700"
                  style={{ width: `${foundationPct}%` }}
                />
              </div>
              {foundation && (
                <p className="text-xs text-muted-foreground">
                  {foundation.completedLessons} of {foundation.totalLessons} Foundation lessons completed
                </p>
              )}
            </div>

            <Link
              href="/mystery-school/training"
              className="inline-flex items-center gap-2 rounded-md bg-yellow-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-yellow-400"
            >
              Continue Foundation Training
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="flex items-start gap-3 py-5 text-sm text-muted-foreground">
            <Lock className="mt-0.5 size-4 shrink-0 text-blue-400" />
            <div>
              <p className="font-medium text-foreground">Decans are locked for now.</p>
              <p className="mt-1">
                This prevents calendar-based Decan windows from opening before
                your Foundation preparation is complete.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPct = Math.round((data.completedCount / data.totalDecans) * 100);
  const weekNumber = data.current_decan_number ?? data.completedCount + 1;

  const currentDecan = data.decans.find((d) => d.is_current) ?? null;
  const upcoming = data.decans
    .filter((d) => d.status === "upcoming" || d.status === "preview")
    .slice(0, 3);
  const subscription = data.subscription;
  const subscriptionEntryLabel =
    subscription?.entry_quarter && subscription?.entry_year
      ? `${subscription.entry_quarter.charAt(0).toUpperCase()}${subscription.entry_quarter.slice(1)} ${subscription.entry_year}`
      : "Seasonal Entry";
  const subscriptionBillingLabel =
    subscription?.recurring_amount != null
      ? `${formatCurrency(subscription.recurring_amount, subscription.recurring_currency)}/month`
      : "Managed in Stripe";

  // Group by sign for compact grid
  const bySign: Record<string, DecanItem[]> = {};
  for (const d of data.decans) {
    if (!bySign[d.sign]) bySign[d.sign] = [];
    bySign[d.sign].push(d);
  }

  return (
    <div className="space-y-8">

      {/* ── Gold-on-dark hero header ──────────────────────────────── */}
      <div className="relative rounded-xl overflow-hidden border border-yellow-500/20 bg-gradient-to-br from-yellow-950/30 via-background to-background px-6 py-8 shadow-sm">
        {/* Radial glow overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 60% at 10% 20%, rgba(234,179,8,0.07) 0%, transparent 70%)",
          }}
        />
        <div className="relative space-y-4">
          {/* Branding badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-500 uppercase tracking-wider">
              <Sparkles className="size-3" />
              Mystery School
            </span>
            {data.q1_complete && (
              <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-[10px] font-semibold text-green-500 uppercase tracking-wider">
                <CheckCircle2 className="size-3" />
                Foundation Complete
              </span>
            )}
          </div>

          {/* Title + sub-title */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Your Decan Journey
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.completedCount === 36
                ? "All 36 decans complete — your year of practice is fulfilled."
                : `Decan ${weekNumber} of 36 · ${data.completedCount} completed`}
            </p>
          </div>

          <Separator className="opacity-20" />

          {/* Inline progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{data.completedCount} of {data.totalDecans} decans completed</span>
              <span className="font-semibold text-yellow-500/80">{progressPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-yellow-500/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {data.completedCount === 36 && (
            <p className="text-sm font-semibold text-yellow-400">
              Congratulations, Priest/Priestess — graduation awaits.
            </p>
          )}

          {subscription ? (
            <>
              <Separator className="opacity-20" />
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-500/80">
                    Subscription
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Keep your Mystery School billing and cohort details in view while you work through the decan curriculum.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <Card className="border-yellow-500/20 bg-black/10">
                    <CardContent className="px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-500/70">Status</p>
                      <p className="mt-1 text-sm font-semibold capitalize">
                        {subscription.status === "cancelled" && subscription.access_end_date
                          ? "Cancelled · Access Active"
                          : subscription.status}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-yellow-500/20 bg-black/10">
                    <CardContent className="px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-500/70">Enrolled</p>
                      <p className="mt-1 text-sm font-semibold">
                        {subscription.enrolled_at ? formatFullDate(subscription.enrolled_at) : "Recently"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-yellow-500/20 bg-black/10">
                    <CardContent className="px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-500/70">Billing</p>
                      <p className="mt-1 text-sm font-semibold">{subscriptionBillingLabel}</p>
                      {typeof subscription.one_time_fee_amount === "number" ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Enrollment paid {formatCurrency(subscription.one_time_fee_amount)}
                        </p>
                      ) : null}
                    </CardContent>
                  </Card>
                  <Card className="border-yellow-500/20 bg-black/10">
                    <CardContent className="px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-500/70">
                        {subscription.status === "cancelled" ? "Access Until" : "Next Renewal"}
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {subscription.status === "cancelled"
                          ? subscription.access_end_date
                            ? formatFullDate(subscription.access_end_date)
                            : "Managed in Stripe"
                          : subscription.renewal_date
                            ? formatFullDate(subscription.renewal_date)
                            : "Managed in Stripe"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-yellow-500/20 bg-black/10">
                    <CardContent className="px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-500/70">Cohort</p>
                      <p className="mt-1 text-sm font-semibold">{subscriptionEntryLabel}</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <ManageSubscriptionButton
                    variant="outline"
                    className="border-yellow-500/30 bg-black/10 text-yellow-50 hover:bg-yellow-500/10"
                  />
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>


      {/* ── Current decan (hero, full-width) ─────────────────────── */}
      {currentDecan && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Current Decan
          </h2>
          <CurrentDecanCard decan={currentDecan} />
        </section>
      )}

      {/* ── Next 3 upcoming / preview ─────────────────────────────── */}
      {upcoming.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Coming Up
          </h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {upcoming.map((d) => (
              <UpcomingDecanCard key={d.id} decan={d} />
            ))}
          </div>
        </section>
      )}

      {/* ── All 36 decans compact grid ───────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          All 36 Decans
        </h2>

        <div className="space-y-4">
          {SIGNS_ORDER.map((sign) => {
            const signDecans = bySign[sign] ?? [];
            if (signDecans.length === 0) return null;
            const colorClass = SIGN_COLORS[sign] ?? "text-foreground";

            return (
              <div key={sign} className="space-y-1.5">
                <h3 className={`text-xs font-semibold uppercase tracking-wide ${colorClass}`}>
                  {sign}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {signDecans.map((decan) => (
                    <DecanCell key={decan.id} decan={decan} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Status legend ────────────────────────────────────────── */}
      <section className="space-y-2 pt-2 border-t">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Legend
        </p>
        <StatusLegend />
      </section>
    </div>
  );
}
