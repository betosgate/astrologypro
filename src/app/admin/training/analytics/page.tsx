"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, RefreshCw, FilterX, Search } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { LocalSearchAutocomplete } from "@/components/ui/local-search-autocomplete";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtTime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtPct = (n: number) => `${n.toFixed(1)}%`;

function passRateCls(rate: number) {
  if (rate >= 70) return "bg-green-100 text-green-800";
  if (rate >= 50) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function toCSV(rows: Record<string, unknown>[], headers: string[]): string {
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map(r => headers.map(h => escape(r[h])).join(","))
  ].join("\n");
}

function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type OverviewData = {
  total_trainees: number;
  active_trainees: number;
  total_programs: number;
  total_lessons: number;
  total_quiz_attempts: number;
  overall_quiz_pass_rate: number;
  avg_attempts_to_pass: number;
  total_lesson_completions: number;
  avg_time_per_lesson_mins: number;
  top_programs: {
    id: string;
    title: string;
    started: number;
    completed: number;
    completion_rate: number;
    avg_progress_pct: number;
  }[];
};

type UserRow = {
  user_id: string;
  display_name: string;
  email: string;
  training_status: string;
  enrolled_programs: number;
  completed_lessons: number;
  total_lessons: number;
  progress_pct: number;
  quiz_pass_rate: number;
  avg_attempts_to_pass: number;
  time_spent_seconds: number;
  last_active_at: string | null;
};

type ProgramRow = {
  id: string;
  title: string;
  is_active: boolean;
  total_categories: number;
  total_lessons: number;
  enrolled_count: number;
  completed_count: number;
  completion_rate: number;
  avg_time_spent_seconds: number;
  mean_completion_time_seconds: number;
  median_completion_time_seconds: number;
  avg_quiz_pass_rate: number;
};

type CategoryRow = {
  id: string;
  title: string;
  program_id: string;
  program_title: string;
  total_lessons: number;
  user_completions: number;
  unique_users_started: number;
  completion_rate: number;
  avg_time_spent_seconds: number;
  mean_completion_time_seconds: number;
  median_completion_time_seconds: number;
};

type LessonRow = {
  id: string;
  title: string;
  category_id: string;
  category_title: string;
  program_title: string;
  total_completions: number;
  unique_users_started: number;
  completion_rate: number;
  avg_time_spent_seconds: number;
  quiz_pass_rate: number;
};

type QuizRow = {
  lesson_id: string;
  lesson_title: string;
  category_title: string;
  program_title: string;
  total_questions: number;
  total_attempts: number;
  unique_users_attempted: number;
  pass_rate: number;
  avg_score_pct: number;
  avg_attempts_to_pass: number;
  avg_time_taken_seconds: number;
  first_attempt_pass_rate: number;
};

type ProgramOption = { id: string; name: string };
type CategoryOption = { id: string; name: string; training_id: string };

// ─── Skeleton helpers ─────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton({ cols = 5, rows = 5 }: { cols?: number; rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TrainingAnalyticsPage() {
  // Overview
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Users tab
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState("");
  const [usersSort, setUsersSort] = useState("name");
  const [usersLoading, setUsersLoading] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Programs tab
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [programsFetched, setProgramsFetched] = useState(false);

  // Categories tab
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesFetched, setCategoriesFetched] = useState(false);
  const [programOptions, setProgramOptions] = useState<ProgramOption[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>("all");

  // Lessons tab
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonsFetched, setLessonsFetched] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Quizzes tab
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [quizzesFetched, setQuizzesFetched] = useState(false);

  const [programsSearch, setProgramsSearch] = useState("");
  const [categoriesSearch, setCategoriesSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleReset = () => {
    setUsersSearch(""); setUsersSort("name"); setUsersPage(1);
    setProgramsSearch(""); setCategoriesSearch(""); setSelectedProgram("all"); setSelectedCategory("all");
    fetchUsers(1, "", "name");
    fetchPrograms();
    fetchCategories("all");
    fetchLessons("all");
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetch("/api/admin/training/analytics/overview")
      .then(r => r.json())
      .then(d => { if (d && typeof d.total_trainees === "number") setOverview(d); });

    // Re-fetch data depending on tabs
    fetchUsers(usersPage, usersSearch, usersSort);
    fetchPrograms();
    fetchCategories(selectedProgram);
    fetchLessons(selectedCategory);
    fetchQuizzes();

    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredPrograms = programs.filter(p =>
    p.title.toLowerCase().includes(programsSearch.toLowerCase())
  );

  const filteredCategories = categories.filter(c =>
    c.title.toLowerCase().includes(categoriesSearch.toLowerCase())
  );

  const USERS_LIMIT = 25;

  // ── Fetch overview (always on mount) ────────────────────────────────────────
  useEffect(() => {
    fetch("/api/admin/training/analytics/overview")
      .then((r) => r.json())
      .then((d) => {
        // Guard: only set if the response looks like valid overview data
        if (d && typeof d.total_trainees === "number") {
          setOverview(d);
        }
      })
      .catch(() => {/* silently ignore network/parse errors */ })
      .finally(() => setOverviewLoading(false));
  }, []);

  // ── Fetch users ──────────────────────────────────────────────────────────────
  const fetchUsers = (page: number, search: string, sort: string) => {
    setUsersLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(USERS_LIMIT),
      search,
      sort,
    });
    fetch(`/api/admin/training/analytics/users?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setUsers(Array.isArray(d?.users) ? d.users : []);
        setUsersTotal(typeof d?.total === "number" ? d.total : 0);
      })
      .catch(() => { setUsers([]); setUsersTotal(0); })
      .finally(() => setUsersLoading(false));
  };

  // ── Fetch programs ────────────────────────────────────────────────────────────
  const fetchPrograms = () => {
    setProgramsLoading(true);
    fetch("/api/admin/training/analytics/programs")
      .then((r) => r.json())
      .then((d) => setPrograms(Array.isArray(d?.programs) ? d.programs : []))
      .catch(() => setPrograms([]))
      .finally(() => {
        setProgramsLoading(false);
        setProgramsFetched(true);
      });
  };

  // ── Fetch program options for dropdowns ───────────────────────────────────────
  const fetchProgramOptions = () => {
    fetch("/api/admin/training/programs")
      .then((r) => r.json())
      .then((d) => setProgramOptions(d.programs ?? []));
  };

  // ── Fetch categories ──────────────────────────────────────────────────────────
  const fetchCategories = (programId?: string) => {
    setCategoriesLoading(true);
    const params = new URLSearchParams();
    const pid = programId ?? selectedProgram;
    if (pid && pid !== "all") params.set("program_id", pid);
    fetch(`/api/admin/training/analytics/categories?${params}`)
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d?.categories) ? d.categories : []))
      .catch(() => setCategories([]))
      .finally(() => {
        setCategoriesLoading(false);
        setCategoriesFetched(true);
      });
  };

  // ── Fetch category options for lessons dropdown ───────────────────────────────
  const fetchCategoryOptions = () => {
    fetch("/api/admin/training/categories")
      .then((r) => r.json())
      .then((d) => setCategoryOptions(d.categories ?? []));
  };

  // ── Fetch lessons ─────────────────────────────────────────────────────────────
  const fetchLessons = (categoryId?: string) => {
    setLessonsLoading(true);
    const params = new URLSearchParams();
    const cid = categoryId ?? selectedCategory;
    if (cid && cid !== "all") params.set("category_id", cid);
    fetch(`/api/admin/training/analytics/lessons?${params}`)
      .then((r) => r.json())
      .then((d) => setLessons(Array.isArray(d?.lessons) ? d.lessons : []))
      .catch(() => setLessons([]))
      .finally(() => {
        setLessonsLoading(false);
        setLessonsFetched(true);
      });
  };

  // ── Fetch quizzes ─────────────────────────────────────────────────────────────
  const fetchQuizzes = () => {
    if (quizzesFetched) return;
    setQuizzesLoading(true);
    fetch("/api/admin/training/analytics/quizzes")
      .then((r) => r.json())
      .then((d) => setQuizzes(Array.isArray(d?.quizzes) ? d.quizzes : []))
      .catch(() => setQuizzes([]))
      .finally(() => {
        setQuizzesLoading(false);
        setQuizzesFetched(true);
      });
  };

  // ── Debounced search for users ────────────────────────────────────────────────
  const handleSearchChange = (value: string) => {
    setUsersSearch(value);
    setUsersPage(1);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      fetchUsers(1, value, usersSort);
    }, 400);
  };

  const handleSortChange = (value: string) => {
    setUsersSort(value);
    setUsersPage(1);
    fetchUsers(1, usersSearch, value);
  };

  const handlePageChange = (newPage: number) => {
    setUsersPage(newPage);
    fetchUsers(newPage, usersSearch, usersSort);
  };

  // ── Tab change handler ────────────────────────────────────────────────────────
  const handleTabChange = (value: string) => {
    if (value === "users" && users.length === 0 && !usersLoading) {
      fetchUsers(1, "", "name");
    }
    if (value === "programs") {
      fetchPrograms();
    }
    if (value === "categories") {
      if (!categoriesFetched) fetchCategories();
      if (programOptions.length === 0) fetchProgramOptions();
    }
    if (value === "lessons") {
      if (!lessonsFetched) fetchLessons();
      if (categoryOptions.length === 0) fetchCategoryOptions();
    }
    if (value === "quizzes") {
      fetchQuizzes();
    }
  };

  // ── Stat cards data ───────────────────────────────────────────────────────────
  const statCards = overview
    ? [
      {
        label: "Total Trainees",
        value: overview.total_trainees.toLocaleString(),
        sub: `${overview.active_trainees} active`,
      },
      {
        label: "Quiz Pass Rate",
        value: fmtPct(overview.overall_quiz_pass_rate),
        sub: `${overview.total_quiz_attempts} attempts`,
      },
      {
        label: "Avg Attempts to Pass",
        value: overview.avg_attempts_to_pass > 0 ? String(overview.avg_attempts_to_pass) : "—",
        sub: "per lesson",
      },
      {
        label: "Total Completions",
        value: overview.total_lesson_completions.toLocaleString(),
        sub: "lessons completed",
      },
      {
        label: "Avg Time / Lesson",
        value: overview.avg_time_per_lesson_mins > 0
          ? `${overview.avg_time_per_lesson_mins} min`
          : "—",
        sub: "average",
      },
      {
        label: "Active Programs",
        value: overview.total_programs.toLocaleString(),
        sub: `${overview.total_lessons} lessons`,
      },
    ]
    : null;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Training Analytics</h1>
          <p className="text-muted-foreground text-sm">Platform-wide learning performance insights</p>
        </div>
      </div>

      {/* Overview stat cards — always visible */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {overviewLoading
          ? Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards?.map((card) => (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.sub}</p>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="overview" onValueChange={handleTabChange}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
        </TabsList>

        {/* ── Overview tab ──────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Programs</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {overviewLoading ? (
                <div className="px-6 py-4">
                  <TableSkeleton cols={4} rows={4} />
                </div>
              ) : !overview?.top_programs?.length ? (
                <p className="px-6 py-4 text-sm text-muted-foreground">
                  No started program data yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Program</TableHead>
                        <TableHead className="text-right">Started</TableHead>
                        <TableHead className="text-right">Completed</TableHead>
                        <TableHead className="text-right">Completion Rate</TableHead>
                        <TableHead className="text-right">Avg Progress</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overview.top_programs.map((p) => {
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.title}</TableCell>
                            <TableCell className="text-right tabular-nums">{p.started}</TableCell>
                            <TableCell className="text-right tabular-nums">{p.completed}</TableCell>
                            <TableCell className="text-right">
                              <span className="tabular-nums text-sm">{fmtPct(p.completion_rate)}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="tabular-nums text-sm">{fmtPct(p.avg_progress_pct)}</span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Users tab ─────────────────────────────────────────────────────── */}
        <TabsContent value="users" className="space-y-4 mt-6">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search name or email…"
              value={usersSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="max-w-xs"
            />
            <Select value={usersSort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="quiz_pass_rate">Quiz Pass Rate</SelectItem>
                <SelectItem value="lessons_completed">Lessons Completed</SelectItem>
                <SelectItem value="time_spent">Time Spent</SelectItem>
              </SelectContent>
            </Select>
            {/* Export current view — client-side CSV from loaded data */}
            <Button
              variant="outline"
              size="sm"
              className="ml-auto gap-1.5"
              disabled={users.length === 0}
              onClick={() => {
                const headers = [
                  "Name", "Email", "Status", "Lessons Done",
                  "Total", "Progress %", "Quiz Pass Rate", "Avg Attempts", "Time Spent (mins)",
                ];
                const rows = users.map((u) => ({
                  "Name": u.display_name || "",
                  "Email": u.email || "",
                  "Status": u.training_status,
                  "Lessons Done": u.completed_lessons,
                  "Total": u.total_lessons,
                  "Progress %": u.progress_pct,
                  "Quiz Pass Rate": u.quiz_pass_rate,
                  "Avg Attempts": u.avg_attempts_to_pass,
                  "Time Spent (mins)": Math.round(u.time_spent_seconds / 60),
                }));
                downloadCSV(
                  toCSV(rows as unknown as Record<string, unknown>[], headers),
                  `analytics-users-${new Date().toISOString().slice(0, 10)}.csv`
                );
              }}
            >
              <Download className="size-4" />
              Export Current View
            </Button>
            {/* Export full dataset from server */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => { window.location.href = "/api/admin/export/analytics"; }}
            >
              <Download className="size-4" />
              Export CSV
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {usersLoading ? (
                <div className="px-6 py-4">
                  <TableSkeleton cols={8} rows={6} />
                </div>
              ) : users.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">No users found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Programs</TableHead>
                        <TableHead>Lessons</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead className="text-right">Quiz Pass Rate</TableHead>
                        <TableHead className="text-right">Avg Attempts</TableHead>
                        <TableHead className="text-right">Time Spent</TableHead>
                        <TableHead>Last Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.user_id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {u.display_name || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {u.email || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs ${u.training_status === "active"
                                ? "bg-green-500/10 text-green-600"
                                : u.training_status === "graduated"
                                  ? "bg-blue-500/10 text-blue-600"
                                  : "bg-muted text-muted-foreground"
                                }`}
                            >
                              {u.training_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {u.enrolled_programs}
                          </TableCell>
                          <TableCell className="tabular-nums text-sm whitespace-nowrap">
                            {u.completed_lessons}/{u.total_lessons}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-[80px]">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${Math.min(100, u.progress_pct)}%` }}
                                />
                              </div>
                              <span className="text-xs tabular-nums text-muted-foreground">
                                {fmtPct(u.progress_pct)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {u.quiz_pass_rate > 0 ? fmtPct(u.quiz_pass_rate) : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {u.avg_attempts_to_pass > 0 ? u.avg_attempts_to_pass : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums whitespace-nowrap">
                            {u.time_spent_seconds > 0 ? fmtTime(u.time_spent_seconds) : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {u.last_active_at
                              ? new Date(u.last_active_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {usersTotal > USERS_LIMIT && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {(usersPage - 1) * USERS_LIMIT + 1}–
                {Math.min(usersPage * USERS_LIMIT, usersTotal)} of {usersTotal}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={usersPage <= 1 || usersLoading}
                  onClick={() => handlePageChange(usersPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={usersPage * USERS_LIMIT >= usersTotal || usersLoading}
                  onClick={() => handlePageChange(usersPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Programs tab ──────────────────────────────────────────────────── */}
        <TabsContent value="programs" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <LocalSearchAutocomplete
              placeholder="Search programs..."
              options={programs.map(p => ({ id: p.id, label: p.title }))}
              defaultValue={programsSearch}
              onSelect={(val) => setProgramsSearch(val)}
              className="w-64"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1.5 ml-auto text-muted-foreground hover:text-foreground"
            >
              <FilterX className="size-4" />
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-1.5"
            >
              <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {programsLoading ? (
                <div className="px-6 py-4">
                  <TableSkeleton cols={7} rows={5} />
                </div>
              ) : filteredPrograms.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">No program data yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Program</TableHead>
                        <TableHead className="text-right">Categories</TableHead>
                        <TableHead className="text-right">Lessons</TableHead>
                        <TableHead className="text-right">Enrolled</TableHead>
                        <TableHead className="text-right">Completed</TableHead>
                        <TableHead className="text-right">Completion Rate</TableHead>
                        <TableHead className="text-right">Mean Time</TableHead>
                        <TableHead className="text-right">Median Time</TableHead>
                        <TableHead className="text-right">Quiz Pass Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPrograms.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div className="font-medium">{p.title}</div>
                            <div>
                              <Badge
                                variant="outline"
                                className={`text-xs mt-0.5 ${p.is_active
                                  ? "bg-green-500/10 text-green-600"
                                  : "bg-red-500/10 text-red-600"
                                  }`}
                              >
                                {p.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{p.total_categories}</TableCell>
                          <TableCell className="text-right tabular-nums">{p.total_lessons}</TableCell>
                          <TableCell className="text-right tabular-nums">{p.enrolled_count}</TableCell>
                          <TableCell className="text-right tabular-nums">{p.completed_count}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {fmtPct(p.completion_rate)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums whitespace-nowrap">
                            {(p.mean_completion_time_seconds ?? p.avg_time_spent_seconds) > 0
                              ? fmtTime(p.mean_completion_time_seconds ?? p.avg_time_spent_seconds)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums whitespace-nowrap">
                            {(p.median_completion_time_seconds ?? 0) > 0
                              ? fmtTime(p.median_completion_time_seconds)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {p.avg_quiz_pass_rate > 0 ? (
                              <span
                                className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${passRateCls(p.avg_quiz_pass_rate)}`}
                              >
                                {fmtPct(p.avg_quiz_pass_rate)}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Categories tab ────────────────────────────────────────────────── */}
        <TabsContent value="categories" className="space-y-4 mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <SearchableSelect
              value={selectedProgram}
              onValueChange={(v) => {
                setSelectedProgram(v);
                fetchCategories(v);
              }}
              options={[
                { value: "all", label: "All Programs" },
                ...programOptions.map(p => ({ value: p.id, label: p.name }))
              ]}
              placeholder="All Programs"
            />

            <LocalSearchAutocomplete
              placeholder="Search by category..."
              options={categories.map(c => ({ id: c.id, label: c.title }))}
              defaultValue={categoriesSearch}
              onSelect={(val) => setCategoriesSearch(val)}
              className="w-64"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1.5 ml-auto text-muted-foreground hover:text-foreground"
            >
              <FilterX className="size-4" />
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-1.5"
            >
              <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {categoriesLoading ? (
                <div className="px-6 py-4">
                  <TableSkeleton cols={6} rows={5} />
                </div>
              ) : filteredCategories.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">No category data found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead className="text-right">Lessons</TableHead>
                        <TableHead className="text-right">Users Started</TableHead>
                        <TableHead className="text-right">Completions</TableHead>
                        <TableHead className="text-right">Completion Rate</TableHead>
                        <TableHead className="text-right">Mean Time</TableHead>
                        <TableHead className="text-right">Median Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCategories.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.title}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {c.program_title || "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{c.total_lessons}</TableCell>
                          <TableCell className="text-right tabular-nums">{c.unique_users_started}</TableCell>
                          <TableCell className="text-right tabular-nums">{c.user_completions}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {fmtPct(c.completion_rate)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums whitespace-nowrap">
                            {(c.mean_completion_time_seconds ?? c.avg_time_spent_seconds) > 0
                              ? fmtTime(c.mean_completion_time_seconds ?? c.avg_time_spent_seconds)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums whitespace-nowrap">
                            {(c.median_completion_time_seconds ?? 0) > 0
                              ? fmtTime(c.median_completion_time_seconds)
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Lessons tab ───────────────────────────────────────────────────── */}
        <TabsContent value="lessons" className="space-y-4 mt-6">
          <div className="flex items-center gap-3">
            <SearchableSelect
              value={selectedCategory}
              onValueChange={(v) => {
                setSelectedCategory(v);
                fetchLessons(v);
              }}
              options={[
                { value: "all", label: "All Categories" },
                ...categoryOptions.map(c => ({ value: c.id, label: c.name }))
              ]}
              placeholder="All Categories"
            />
          </div>

          <Card>
            <CardContent className="p-0">
              {lessonsLoading ? (
                <div className="px-6 py-4">
                  <TableSkeleton cols={7} rows={5} />
                </div>
              ) : lessons.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">No lesson data found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lesson</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead className="text-right">Completions</TableHead>
                        <TableHead className="text-right">Users Started</TableHead>
                        <TableHead className="text-right">Completion Rate</TableHead>
                        <TableHead className="text-right">Avg Time</TableHead>
                        <TableHead className="text-right">Quiz Pass Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lessons.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="font-medium">{l.title}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {l.category_title || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {l.program_title || "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{l.total_completions}</TableCell>
                          <TableCell className="text-right tabular-nums">{l.unique_users_started}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {fmtPct(l.completion_rate)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums whitespace-nowrap">
                            {l.avg_time_spent_seconds > 0 ? fmtTime(l.avg_time_spent_seconds) : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {l.quiz_pass_rate > 0 ? (
                              <span
                                className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${passRateCls(l.quiz_pass_rate)}`}
                              >
                                {fmtPct(l.quiz_pass_rate)}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Quizzes tab ───────────────────────────────────────────────────── */}
        <TabsContent value="quizzes" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {quizzesLoading ? (
                <div className="px-6 py-4">
                  <TableSkeleton cols={9} rows={5} />
                </div>
              ) : quizzes.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">No quiz data yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lesson</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead className="text-right">Questions</TableHead>
                        <TableHead className="text-right">Attempts</TableHead>
                        <TableHead className="text-right">Unique Users</TableHead>
                        <TableHead className="text-right">Pass Rate</TableHead>
                        <TableHead className="text-right">Avg Score</TableHead>
                        <TableHead className="text-right">Avg Attempts to Pass</TableHead>
                        <TableHead className="text-right">1st-Attempt Pass</TableHead>
                        <TableHead className="text-right">Avg Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quizzes.map((q) => (
                        <TableRow key={q.lesson_id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {q.lesson_title || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {q.category_title || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {q.program_title || "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{q.total_questions}</TableCell>
                          <TableCell className="text-right tabular-nums">{q.total_attempts}</TableCell>
                          <TableCell className="text-right tabular-nums">{q.unique_users_attempted}</TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${passRateCls(q.pass_rate)}`}
                            >
                              {fmtPct(q.pass_rate)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {q.avg_score_pct > 0 ? fmtPct(q.avg_score_pct) : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {q.avg_attempts_to_pass > 0 ? q.avg_attempts_to_pass : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {fmtPct(q.first_attempt_pass_rate)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums whitespace-nowrap">
                            {q.avg_time_taken_seconds > 0 ? fmtTime(q.avg_time_taken_seconds) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
