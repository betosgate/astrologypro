"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lock, CheckCircle2, Circle, AlertTriangle, Zap, Star } from "lucide-react";

type DecanItem = {
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
  status: string;
  ritualDone: boolean;
  scryDone: boolean;
  journalDone: boolean;
  completedAt: string | null;
  dateRange: { start: string; end: string; graceEnd: string };
};

type PageData = {
  student: { trainingStatus: string; startQuarter: string };
  decans: DecanItem[];
  completedCount: number;
  totalDecans: number;
};

const SIGN_COLORS: Record<string, string> = {
  Aries: "text-red-500", Taurus: "text-green-600", Gemini: "text-yellow-500",
  Cancer: "text-sky-400", Leo: "text-orange-500", Virgo: "text-emerald-500",
  Libra: "text-pink-400", Scorpio: "text-purple-600", Sagittarius: "text-blue-500",
  Capricorn: "text-stone-500", Aquarius: "text-cyan-500", Pisces: "text-indigo-400",
};

const PLANET_GLYPHS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀",
  Mars: "♂", Jupiter: "♃", Saturn: "♄",
};

function statusIcon(status: string) {
  switch (status) {
    case "completed": return <CheckCircle2 className="size-4 text-green-500" />;
    case "active": return <Zap className="size-4 text-amber-500" />;
    case "upcoming": return <Circle className="size-4 text-primary" />;
    case "missed": return <AlertTriangle className="size-4 text-destructive" />;
    default: return <Lock className="size-3.5 text-muted-foreground/50" />;
  }
}

function statusBadge(status: string) {
  const variants: Record<string, string> = {
    completed: "bg-green-100 text-green-800",
    active: "bg-amber-100 text-amber-800",
    upcoming: "bg-blue-100 text-blue-800",
    missed: "bg-red-100 text-red-800",
    locked: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${variants[status] ?? variants.locked}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function formatShortDate(month: number, day: number) {
  return new Date(2000, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const SIGNS_ORDER = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];

export default function DecansProgressPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/mystery-school/decans")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-muted" />
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

  const progressPct = Math.round((data.completedCount / data.totalDecans) * 100);

  // Group by sign
  const bySign: Record<string, DecanItem[]> = {};
  for (const d of data.decans) {
    if (!bySign[d.sign]) bySign[d.sign] = [];
    bySign[d.sign].push(d);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Star className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Decan Calendar</h1>
        </div>
        <p className="text-muted-foreground">
          Your year-long Mystery School practice — 36 decans, 3 per sign.
        </p>
      </div>

      {/* Progress summary */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{data.completedCount} of 36 decans completed</span>
            <span className="text-muted-foreground">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />
          {data.completedCount === 36 && (
            <p className="text-sm font-semibold text-amber-600">
              ✨ All 36 decans complete — congratulations, Priest/Priestess.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sign-by-sign grid */}
      <div className="space-y-5">
        {SIGNS_ORDER.map((sign) => {
          const signDecans = bySign[sign] ?? [];
          if (signDecans.length === 0) return null;
          const colorClass = SIGN_COLORS[sign] ?? "text-foreground";

          return (
            <div key={sign} className="space-y-2">
              <h2 className={`text-sm font-semibold uppercase tracking-wider ${colorClass}`}>
                {sign}
              </h2>
              <div className="grid gap-2 sm:grid-cols-3">
                {signDecans.map((decan) => (
                  <Link
                    key={decan.id}
                    href={decan.status === "locked" ? "#" : `/community/decans/${decan.id}`}
                    className={
                      decan.status === "locked"
                        ? "pointer-events-none"
                        : "group"
                    }
                  >
                    <Card
                      className={`transition-colors ${
                        decan.status === "active"
                          ? "border-amber-400/50 bg-amber-50/30"
                          : decan.status === "completed"
                          ? "border-green-400/30 bg-green-50/20"
                          : decan.status === "missed"
                          ? "border-destructive/30 bg-destructive/5"
                          : decan.status === "locked"
                          ? "opacity-50"
                          : "group-hover:border-primary/30"
                      }`}
                    >
                      <CardContent className="py-3 px-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {statusIcon(decan.status)}
                              <span className="text-sm font-medium truncate">
                                {PLANET_GLYPHS[decan.planet] ?? "●"} {decan.title}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatShortDate(decan.start_month, decan.start_day)} – {formatShortDate(decan.end_month, decan.end_day)}
                            </p>
                            {decan.status !== "locked" && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <span className={`text-[10px] ${decan.ritualDone ? "text-green-600" : "text-muted-foreground"}`}>
                                  {decan.ritualDone ? "✓" : "○"} Ritual
                                </span>
                                <span className={`text-[10px] ${decan.scryDone ? "text-green-600" : "text-muted-foreground"}`}>
                                  {decan.scryDone ? "✓" : "○"} Scry
                                </span>
                                <span className={`text-[10px] ${decan.journalDone ? "text-green-600" : "text-muted-foreground"}`}>
                                  {decan.journalDone ? "✓" : "○"} Journal
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="shrink-0">
                            {statusBadge(decan.status)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
