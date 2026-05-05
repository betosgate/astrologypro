"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Users, Search, GraduationCap, Zap, AlertTriangle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type StudentRow = {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  enrolled_at: string;
  start_quarter: string;
  training_status: "foundation" | "decans" | "graduated";
  graduated_at: string | null;
  membership_status: string;
  foundation_weeks_completed: number;
  /** Optional in v3 — Training-backed lesson count. */
  foundation_lessons_completed?: number;
  /** Optional in v3 — "training" or "legacy" depending on data source. */
  foundation_source?: "training" | "legacy";
  decans_completed: number;
  current_decan_status: string | null;
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

function trainingStatusBadge(status: string) {
  const map: Record<string, string> = {
    foundation: "bg-blue-100 text-blue-800",
    decans: "bg-amber-100 text-amber-800",
    graduated: "bg-green-100 text-green-800",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function membershipBadge(status: string) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    paused: "bg-yellow-100 text-yellow-800",
    expired: "bg-red-100 text-red-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

function decanStatusIcon(status: string | null) {
  if (!status) return null;
  if (status === "active") return <Zap className="size-3.5 text-amber-500" />;
  if (status === "grace") return <AlertTriangle className="size-3.5 text-orange-500" />;
  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminMysterySchoolStudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [foundationSource, setFoundationSource] = useState<
    "training" | "legacy" | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/mystery-school/students")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setStudents(d.students ?? []);
          setFoundationSource(d.foundation_source ?? null);
        }
      })
      .catch(() => setError("Failed to load students"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.email.toLowerCase().includes(q) ||
      (s.full_name ?? "").toLowerCase().includes(q) ||
      s.start_quarter.toLowerCase().includes(q) ||
      s.training_status.toLowerCase().includes(q)
    );
  });

  const summary = {
    total: students.length,
    active: students.filter((s) => s.membership_status === "active").length,
    inDecans: students.filter((s) => s.training_status === "decans").length,
    graduated: students.filter((s) => s.training_status === "graduated").length,
  };

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/admin/mystery-school"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Mystery School
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-xl font-bold">Students</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            All enrolled Mystery School students with progress overview.
          </p>
          {foundationSource && (
            <p className="text-[11px] text-muted-foreground mt-1">
              Foundation source:{" "}
              <span
                className={
                  foundationSource === "training"
                    ? "font-medium text-emerald-600"
                    : "font-medium text-amber-600"
                }
              >
                {foundationSource === "training"
                  ? "Admin Training (training_categories)"
                  : "Legacy student_foundation_progress"}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* ── Summary cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Enrolled", value: summary.total, icon: Users },
          { label: "Active Members", value: summary.active, icon: Users },
          { label: "In Decan Year", value: summary.inDecans, icon: Zap },
          { label: "Graduated", value: summary.graduated, icon: GraduationCap },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="py-4 px-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Icon className="size-3.5" />
                <span className="text-xs">{label}</span>
              </div>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Search ─────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or status…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* ── Table / list ───────────────────────────────────── */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-destructive/30">
          <CardContent className="py-8 text-center text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {search ? "No students match your search." : "No students enrolled yet."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => {
            const foundationPct = Math.round((s.foundation_weeks_completed / 12) * 100);
            const decanPct = Math.round((s.decans_completed / 36) * 100);

            return (
              <Card key={s.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="py-4 px-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    {/* Left: identity + progress */}
                    <div className="min-w-0 space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">
                          {s.full_name || <span className="text-muted-foreground italic">No name</span>}
                        </p>
                        {trainingStatusBadge(s.training_status)}
                        {membershipBadge(s.membership_status)}
                        {s.current_decan_status && (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-800">
                            {decanStatusIcon(s.current_decan_status)}
                            {s.current_decan_status === "grace" ? "Grace" : "Active Decan"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Enrolled {formatDate(s.enrolled_at)} ·{" "}
                        Quarter: <span className="capitalize">{s.start_quarter}</span>
                        {s.graduated_at && ` · Graduated ${formatDate(s.graduated_at)}`}
                      </p>

                      {/* Progress bars */}
                      <div className="grid gap-1.5 sm:grid-cols-2 max-w-sm mt-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>Foundation</span>
                            <span>{s.foundation_weeks_completed}/12 weeks</span>
                          </div>
                          <Progress value={foundationPct} className="h-1" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>Decans</span>
                            <span>{s.decans_completed}/36</span>
                          </div>
                          <Progress value={decanPct} className="h-1" />
                        </div>
                      </div>
                    </div>

                    {/* Right: action */}
                    <div className="shrink-0">
                      <Link
                        href={`/admin/mystery-school/students/${s.id}`}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        View Student →
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} of {students.length} student{students.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
