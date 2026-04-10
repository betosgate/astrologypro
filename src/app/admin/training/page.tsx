"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrainingEntityTable,
  StatusBadge,
  type EntityColumn,
  type EntityTableConfig,
} from "@/components/admin/training-entity-table";
import type { TrainingEntityRow } from "@/components/admin/training-entity-sheet";

// ─── Entity types ─────────────────────────────────────────────────────────

type Program = {
  id: string;
  name: string;
  description: string | null;
  priority: number;
  is_active: boolean;
  is_sequential?: boolean;
  allowed_roles: string[];
  created_at: string;
};

type Category = {
  id: string;
  training_id: string;
  name: string;
  description: string | null;
  priority: number;
  is_active: boolean;
  is_sequential?: boolean;
  created_at: string;
};

type Lesson = {
  id: string;
  category_id: string;
  title: string;
  // Name is required by the shared table type; we alias it to title below.
  name?: string;
  description: string | null;
  video_url: string | null;
  duration_mins: number | null;
  priority: number;
  is_active: boolean;
  created_at: string;
};

type Quiz = {
  id: string;
  lesson_id: string;
  title: string;
  name?: string;
  questions: unknown[];
  pass_score: number | null;
  is_active: boolean;
  created_at: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────

const fmt = (d: string) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

function formatRoleName(role: string) {
  return role
    .replace(/^is_/, "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ─── Page ─────────────────────────────────────────────────────────────────

// ── Shared table-state type ──────────────────────────────────────────────

interface TableState {
  page: number;
  pageSize: number;
  sortBy: string;
  sortDir: "asc" | "desc";
}

interface EntityData<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}

function buildUrl(
  base: string,
  state: TableState,
  search: string,
  status: "all" | "active" | "inactive",
): string {
  const params = new URLSearchParams();
  params.set("page", String(state.page));
  params.set("pageSize", String(state.pageSize));
  params.set("sortBy", state.sortBy);
  params.set("sortDir", state.sortDir);
  if (search) params.set("search", search);
  if (status !== "all") params.set("status", status);
  return `${base}?${params.toString()}`;
}

export default function TrainingPage() {
  // ── Per-entity state: rows + server total + table state + loading ──────
  const [programData, setProgramData] = useState<EntityData<Program>>({ rows: [], total: 0, page: 1, pageSize: 10 });
  const [categoryData, setCategoryData] = useState<EntityData<Category>>({ rows: [], total: 0, page: 1, pageSize: 10 });
  const [lessonData, setLessonData] = useState<EntityData<Lesson>>({ rows: [], total: 0, page: 1, pageSize: 10 });
  const [quizData, setQuizData] = useState<EntityData<Quiz>>({ rows: [], total: 0, page: 1, pageSize: 10 });

  const [programState, setProgramState] = useState<TableState>({ page: 1, pageSize: 10, sortBy: "priority", sortDir: "asc" });
  const [categoryState, setCategoryState] = useState<TableState>({ page: 1, pageSize: 10, sortBy: "priority", sortDir: "asc" });
  const [lessonState, setLessonState] = useState<TableState>({ page: 1, pageSize: 10, sortBy: "priority", sortDir: "asc" });
  const [quizState, setQuizState] = useState<TableState>({ page: 1, pageSize: 10, sortBy: "created_at", sortDir: "desc" });

  const [programsRefreshing, setProgramsRefreshing] = useState(false);
  const [categoriesRefreshing, setCategoriesRefreshing] = useState(false);
  const [lessonsRefreshing, setLessonsRefreshing] = useState(false);
  const [quizzesRefreshing, setQuizzesRefreshing] = useState(false);

  // Distinguish first load (show skeletons) from subsequent refreshes (show overlay).
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Shared filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // ── FK lookup maps ────────────────────────────────────────────────────
  // Built from UNPAGINATED fetches so every category/lesson label resolves
  // even when the related entity is on a different page. Lightweight — only
  // id + name/title selected. Refreshed on mount + after any mutation.
  const [programMap, setProgramMap] = useState<Record<string, string>>({});
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [lessonMap, setLessonMap] = useState<Record<string, string>>({});
  // Count of categories per program (needed for the "Categories" column on
  // the programs table). Built from the unpaginated category fetch.
  const [categoriesPerProgram, setCategoriesPerProgram] = useState<Record<string, number>>({});

  async function refreshLookupMaps() {
    const [progRes, catRes, lesRes] = await Promise.all([
      fetch("/api/admin/training/programs?pageSize=100"),
      fetch("/api/admin/training/categories?pageSize=100"),
      fetch("/api/admin/training/lessons?pageSize=100"),
    ]);
    const [progJson, catJson, lesJson] = await Promise.all([
      progRes.ok ? progRes.json() : { programs: [] },
      catRes.ok ? catRes.json() : { categories: [] },
      lesRes.ok ? lesRes.json() : { lessons: [] },
    ]);
    const pm: Record<string, string> = {};
    for (const p of progJson.programs ?? []) pm[p.id] = p.name;
    setProgramMap(pm);
    const cm: Record<string, string> = {};
    const cpp: Record<string, number> = {};
    for (const c of catJson.categories ?? []) {
      cm[c.id] = c.name;
      cpp[c.training_id] = (cpp[c.training_id] ?? 0) + 1;
    }
    setCategoryMap(cm);
    setCategoriesPerProgram(cpp);
    const lm: Record<string, string> = {};
    for (const l of lesJson.lessons ?? []) lm[l.id] = l.title;
    setLessonMap(lm);
  }

  // ── Server-driven fetch per entity ────────────────────────────────────
  async function loadPrograms(stateOverride?: TableState) {
    const st = stateOverride ?? programState;
    setProgramsRefreshing(true);
    try {
      const url = buildUrl("/api/admin/training/programs", st, searchTerm, statusFilter);
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setProgramData({
          rows: json.programs ?? [],
          total: json.total ?? 0,
          page: json.page ?? st.page,
          pageSize: json.pageSize ?? st.pageSize,
        });
      }
    } finally {
      setProgramsRefreshing(false);
    }
  }
  async function loadCategories(stateOverride?: TableState) {
    const st = stateOverride ?? categoryState;
    setCategoriesRefreshing(true);
    try {
      const url = buildUrl("/api/admin/training/categories", st, searchTerm, statusFilter);
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setCategoryData({
          rows: json.categories ?? [],
          total: json.total ?? 0,
          page: json.page ?? st.page,
          pageSize: json.pageSize ?? st.pageSize,
        });
      }
    } finally {
      setCategoriesRefreshing(false);
    }
  }
  async function loadLessons(stateOverride?: TableState) {
    const st = stateOverride ?? lessonState;
    setLessonsRefreshing(true);
    try {
      const url = buildUrl("/api/admin/training/lessons", st, searchTerm, statusFilter);
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setLessonData({
          rows: (json.lessons ?? []).map((l: Lesson) => ({ ...l, name: l.title })),
          total: json.total ?? 0,
          page: json.page ?? st.page,
          pageSize: json.pageSize ?? st.pageSize,
        });
      }
    } finally {
      setLessonsRefreshing(false);
    }
  }
  async function loadQuizzes(stateOverride?: TableState) {
    const st = stateOverride ?? quizState;
    setQuizzesRefreshing(true);
    try {
      const url = buildUrl("/api/admin/training/quizzes", st, searchTerm, statusFilter);
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setQuizData({
          rows: (json.quizzes ?? []).map((q: Quiz) => ({ ...q, name: q.title })),
          total: json.total ?? 0,
          page: json.page ?? st.page,
          pageSize: json.pageSize ?? st.pageSize,
        });
      }
    } finally {
      setQuizzesRefreshing(false);
    }
  }

  // ── Reload all on mount + when shared filters change ──────────────────
  useEffect(() => {
    async function init() {
      await Promise.all([
        loadPrograms(),
        loadCategories(),
        loadLessons(),
        loadQuizzes(),
        refreshLookupMaps(),
      ]);
      setInitialLoadDone(true);
    }
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter]);

  // Server-driven: filters are passed to the API, not applied client-side.
  const filtersActive = !!searchTerm.trim() || statusFilter !== "all";

  // ── Mutation handlers that also refresh lookup maps ──────────────────
  // After a mutation (edit/activate/deactivate/delete), refresh both the
  // affected table AND the lookup maps so FK labels stay correct.
  async function mutatePrograms() {
    await loadPrograms(programState);
    void refreshLookupMaps();
  }
  async function mutateCategories() {
    await loadCategories(categoryState);
    void refreshLookupMaps();
  }
  async function mutateLessons() {
    await loadLessons(lessonState);
    void refreshLookupMaps();
  }
  async function mutateQuizzes() {
    await loadQuizzes(quizState);
    void refreshLookupMaps();
  }

  // ── Per-entity configs ───────────────────────────────────────────────
  const programCols: EntityColumn<Program>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      sortValue: (p) => p.name,
      render: (p) => <span className="font-medium">{p.name}</span>,
    },
    {
      key: "roles",
      label: "Access",
      render: (p) =>
        !p.allowed_roles || p.allowed_roles.length === 0 ? (
          <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600">
            All
          </Badge>
        ) : (
          <div className="flex flex-wrap gap-1">
            {p.allowed_roles.map((r) => (
              <Badge key={r} variant="outline" className="text-xs">
                {formatRoleName(r)}
              </Badge>
            ))}
          </div>
        ),
    },
    {
      key: "categories",
      label: "Categories",
      sortable: true,
      sortValue: (p) => categoriesPerProgram[p.id] ?? 0,
      render: (p) => (
        <span className="text-sm">
          {categoriesPerProgram[p.id] ?? 0}
        </span>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      sortValue: (p) => p.priority,
      render: (p) => <span className="text-sm">{p.priority}</span>,
    },
    {
      key: "is_active",
      label: "Status",
      sortable: true,
      sortValue: (p) => (p.is_active ? 1 : 0),
      render: (p) => <StatusBadge active={p.is_active} />,
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      sortValue: (p) => p.created_at,
      render: (p) => (
        <span className="text-xs text-muted-foreground">{fmt(p.created_at)}</span>
      ),
    },
  ];

  const categoryCols: EntityColumn<Category>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      sortValue: (c) => c.name,
      render: (c) => <span className="font-medium">{c.name}</span>,
    },
    {
      key: "program",
      label: "Program",
      sortable: true,
      sortValue: (c) => programMap[c.training_id] ?? "",
      render: (c) => (
        <span className="text-sm text-muted-foreground">
          {programMap[c.training_id] ?? "Unknown program"}
        </span>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (c) => (
        <span className="block max-w-xs truncate text-xs text-muted-foreground">
          {c.description ?? "—"}
        </span>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      sortValue: (c) => c.priority ?? 0,
      render: (c) => <span className="text-sm">{c.priority ?? 0}</span>,
    },
    {
      key: "is_active",
      label: "Status",
      sortable: true,
      sortValue: (c) => (c.is_active ? 1 : 0),
      render: (c) => <StatusBadge active={c.is_active} />,
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      sortValue: (c) => c.created_at,
      render: (c) => (
        <span className="text-xs text-muted-foreground">{fmt(c.created_at)}</span>
      ),
    },
  ];

  const lessonCols: EntityColumn<Lesson>[] = [
    {
      key: "title",
      label: "Title",
      sortable: true,
      sortValue: (l) => l.title,
      render: (l) => <span className="font-medium">{l.title}</span>,
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      sortValue: (l) => categoryMap[l.category_id] ?? "",
      render: (l) => (
        <span className="text-sm text-muted-foreground">
          {categoryMap[l.category_id] ?? "Unknown category"}
        </span>
      ),
    },
    {
      key: "duration",
      label: "Duration",
      sortable: true,
      sortValue: (l) => l.duration_mins ?? -1,
      render: (l) => (
        <span className="text-sm">
          {l.duration_mins != null ? `${l.duration_mins} min` : "—"}
        </span>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      sortValue: (l) => l.priority ?? 0,
      render: (l) => <span className="text-sm">{l.priority ?? 0}</span>,
    },
    {
      key: "is_active",
      label: "Status",
      sortable: true,
      sortValue: (l) => (l.is_active ? 1 : 0),
      render: (l) => <StatusBadge active={l.is_active} />,
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      sortValue: (l) => l.created_at,
      render: (l) => (
        <span className="text-xs text-muted-foreground">{fmt(l.created_at)}</span>
      ),
    },
  ];

  const quizCols: EntityColumn<Quiz>[] = [
    {
      key: "title",
      label: "Title",
      sortable: true,
      sortValue: (q) => q.title,
      render: (q) => <span className="font-medium">{q.title}</span>,
    },
    {
      key: "lesson",
      label: "Lesson",
      sortable: true,
      sortValue: (q) => lessonMap[q.lesson_id] ?? "",
      render: (q) => (
        <span className="text-sm text-muted-foreground">
          {lessonMap[q.lesson_id] ?? "Unknown lesson"}
        </span>
      ),
    },
    {
      key: "pass_score",
      label: "Pass Score",
      sortable: true,
      sortValue: (q) => q.pass_score ?? 0,
      render: (q) => (
        <span className="text-sm">
          {q.pass_score != null ? `${q.pass_score}%` : "—"}
        </span>
      ),
    },
    {
      key: "questions",
      label: "Questions",
      sortable: true,
      sortValue: (q) => (Array.isArray(q.questions) ? q.questions.length : 0),
      render: (q) => (
        <span className="text-sm">
          {Array.isArray(q.questions) ? q.questions.length : "—"}
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      sortable: true,
      sortValue: (q) => (q.is_active ? 1 : 0),
      render: (q) => <StatusBadge active={q.is_active} />,
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      sortValue: (q) => q.created_at,
      render: (q) => (
        <span className="text-xs text-muted-foreground">{fmt(q.created_at)}</span>
      ),
    },
  ];

  // ── Overview builders (Sheet detail panel) ───────────────────────────
  const buildProgramOverview = (p: Program): TrainingEntityRow => ({
    id: p.id,
    name: p.name,
    description: p.description,
    is_active: p.is_active,
    created_at: p.created_at,
    editHref: `/admin/training/programs/${p.id}/edit`,
    overview: [
      { label: "Priority", value: p.priority },
      {
        label: "Sequential",
        value: p.is_sequential ? "Yes" : "No",
      },
      {
        label: "Categories",
        value: categoriesPerProgram[p.id] ?? 0,
      },
      {
        label: "Access",
        value:
          !p.allowed_roles || p.allowed_roles.length === 0
            ? "All authenticated users"
            : p.allowed_roles.map(formatRoleName).join(", "),
      },
      { label: "Created", value: fmt(p.created_at) },
    ],
  });

  const buildCategoryOverview = (c: Category): TrainingEntityRow => ({
    id: c.id,
    name: c.name,
    description: c.description,
    is_active: c.is_active,
    created_at: c.created_at,
    editHref: `/admin/training/categories/${c.id}/edit`,
    overview: [
      { label: "Program", value: programMap[c.training_id] ?? "—" },
      { label: "Priority", value: c.priority ?? 0 },
      { label: "Sequential", value: c.is_sequential ? "Yes" : "No" },
      { label: "Created", value: fmt(c.created_at) },
    ],
  });

  const buildLessonOverview = (l: Lesson): TrainingEntityRow => ({
    id: l.id,
    name: l.title,
    description: l.description,
    is_active: l.is_active,
    created_at: l.created_at,
    editHref: `/admin/training/lessons/${l.id}/edit`,
    overview: [
      { label: "Category", value: categoryMap[l.category_id] ?? "—" },
      {
        label: "Video URL",
        value: l.video_url ? (
          <a
            href={l.video_url}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline text-xs break-all"
          >
            {l.video_url}
          </a>
        ) : (
          "—"
        ),
      },
      {
        label: "Duration",
        value: l.duration_mins != null ? `${l.duration_mins} min` : "—",
      },
      { label: "Priority", value: l.priority ?? 0 },
      { label: "Created", value: fmt(l.created_at) },
    ],
  });

  const buildQuizOverview = (q: Quiz): TrainingEntityRow => ({
    id: q.id,
    name: q.title,
    description: null,
    is_active: q.is_active,
    created_at: q.created_at,
    editHref: `/admin/training/quizzes/${q.id}/edit`,
    overview: [
      { label: "Lesson", value: lessonMap[q.lesson_id] ?? "—" },
      {
        label: "Pass Score",
        value: q.pass_score != null ? `${q.pass_score}%` : "—",
      },
      {
        label: "Questions",
        value: Array.isArray(q.questions) ? q.questions.length : "—",
      },
      { label: "Created", value: fmt(q.created_at) },
    ],
  });

  const programConfig: EntityTableConfig<Program> = {
    entityType: "program",
    title: "Training Programs",
    addLabel: "Add Program",
    addHref: "/admin/training/programs/new",
    emptyText: "No programs yet. Add one before creating categories.",
    noMatchText: "No programs match the current filters.",
    columns: programCols,
    buildOverview: buildProgramOverview,
    defaultSortKey: "priority",
    defaultSortDir: "asc",
  };

  const categoryConfig: EntityTableConfig<Category> = {
    entityType: "category",
    title: "Categories",
    addLabel: "Add Category",
    addHref: "/admin/training/categories/new",
    emptyText: "No categories yet. Add one to get started.",
    noMatchText: "No categories match the current filters.",
    columns: categoryCols,
    buildOverview: buildCategoryOverview,
    defaultSortKey: "priority",
    defaultSortDir: "asc",
  };

  const lessonConfig: EntityTableConfig<Lesson> = {
    entityType: "lesson",
    title: "Lessons",
    addLabel: "Add Lesson",
    addHref: "/admin/training/lessons/new",
    emptyText: "No lessons yet. Add one to get started.",
    noMatchText: "No lessons match the current filters.",
    columns: lessonCols,
    buildOverview: buildLessonOverview,
    defaultSortKey: "priority",
    defaultSortDir: "asc",
  };

  const quizConfig: EntityTableConfig<Quiz> = {
    entityType: "quiz",
    title: "Quizzes",
    addLabel: "Add Quiz",
    addHref: "/admin/training/quizzes/new",
    secondaryAdd: {
      label: "✨ AI Generate",
      href: "/admin/training/quiz-generate",
    },
    emptyText: "No quizzes yet. Add one to get started.",
    noMatchText: "No quizzes match the current filters.",
    columns: quizCols,
    buildOverview: buildQuizOverview,
    defaultSortKey: "created_at",
    defaultSortDir: "desc",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Training Management</h1>
          <p className="text-muted-foreground">
            Manage training programs, categories, lessons, and quizzes.
          </p>
        </div>
      </div>

      {/* Shared filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] max-w-xs">
          <Label className="text-xs mb-1 block">Search</Label>
          <Input
            placeholder="Name, title, or description…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Status</Label>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "active" | "inactive")
            }
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        {filtersActive && (
          <div className="self-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
            >
              Reset
            </Button>
          </div>
        )}
      </div>

      {/* Initial loading skeleton — shown only on first load before data arrives */}
      {!initialLoadDone && (
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-6 space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-5 w-40 rounded bg-muted" />
                <div className="h-8 w-24 rounded bg-muted" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((r) => (
                  <div key={r} className="flex gap-4">
                    <div className="h-4 w-1/4 rounded bg-muted" />
                    <div className="h-4 w-1/3 rounded bg-muted" />
                    <div className="h-4 w-1/6 rounded bg-muted" />
                    <div className="h-4 w-1/6 rounded bg-muted" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {initialLoadDone && (
      <>
      <TrainingEntityTable
        config={programConfig}
        rows={programData.rows}
        serverTotal={programData.total}
        rawCount={programData.total}
        filtersActive={filtersActive}
        currentSearch={searchTerm}
        currentStatus={statusFilter}
        onMutated={mutatePrograms}
        onRefresh={() => loadPrograms(programState)}
        isRefreshing={programsRefreshing}
        serverPage={programData.page}
        serverPageSize={programData.pageSize}
        onTableStateChange={(st) => {
          setProgramState(st);
          void loadPrograms(st);
        }}
      />

      <TrainingEntityTable
        config={categoryConfig}
        rows={categoryData.rows}
        serverTotal={categoryData.total}
        rawCount={categoryData.total}
        filtersActive={filtersActive}
        currentSearch={searchTerm}
        currentStatus={statusFilter}
        onMutated={mutateCategories}
        onRefresh={() => loadCategories(categoryState)}
        isRefreshing={categoriesRefreshing}
        serverPage={categoryData.page}
        serverPageSize={categoryData.pageSize}
        onTableStateChange={(st) => {
          setCategoryState(st);
          void loadCategories(st);
        }}
      />

      <TrainingEntityTable
        config={lessonConfig}
        rows={lessonData.rows}
        serverTotal={lessonData.total}
        rawCount={lessonData.total}
        filtersActive={filtersActive}
        currentSearch={searchTerm}
        currentStatus={statusFilter}
        onMutated={mutateLessons}
        onRefresh={() => loadLessons(lessonState)}
        isRefreshing={lessonsRefreshing}
        serverPage={lessonData.page}
        serverPageSize={lessonData.pageSize}
        onTableStateChange={(st) => {
          setLessonState(st);
          void loadLessons(st);
        }}
      />

      <TrainingEntityTable
        config={quizConfig}
        rows={quizData.rows}
        serverTotal={quizData.total}
        rawCount={quizData.total}
        filtersActive={filtersActive}
        currentSearch={searchTerm}
        currentStatus={statusFilter}
        onMutated={mutateQuizzes}
        onRefresh={() => loadQuizzes(quizState)}
        isRefreshing={quizzesRefreshing}
        serverPage={quizData.page}
        serverPageSize={quizData.pageSize}
        onTableStateChange={(st) => {
          setQuizState(st);
          void loadQuizzes(st);
        }}
      />
      </>
      )}
    </div>
  );
}
