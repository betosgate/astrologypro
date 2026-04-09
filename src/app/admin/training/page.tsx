"use client";

import { useEffect, useState, useMemo } from "react";
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

export default function TrainingPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [programsRefreshing, setProgramsRefreshing] = useState(true);
  const [categoriesRefreshing, setCategoriesRefreshing] = useState(true);
  const [lessonsRefreshing, setLessonsRefreshing] = useState(true);
  const [quizzesRefreshing, setQuizzesRefreshing] = useState(true);

  // Shared filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  async function loadPrograms() {
    setProgramsRefreshing(true);
    try {
      const res = await fetch("/api/admin/training/programs");
      if (res.ok) setPrograms((await res.json()).programs ?? []);
    } finally {
      setProgramsRefreshing(false);
    }
  }
  async function loadCategories() {
    setCategoriesRefreshing(true);
    try {
      const res = await fetch("/api/admin/training/categories");
      if (res.ok) setCategories((await res.json()).categories ?? []);
    } finally {
      setCategoriesRefreshing(false);
    }
  }
  async function loadLessons() {
    setLessonsRefreshing(true);
    try {
      const res = await fetch("/api/admin/training/lessons");
      if (res.ok) setLessons((await res.json()).lessons ?? []);
    } finally {
      setLessonsRefreshing(false);
    }
  }
  async function loadQuizzes() {
    setQuizzesRefreshing(true);
    try {
      const res = await fetch("/api/admin/training/quizzes");
      if (res.ok) setQuizzes((await res.json()).quizzes ?? []);
    } finally {
      setQuizzesRefreshing(false);
    }
  }

  useEffect(() => {
    void Promise.all([loadPrograms(), loadCategories(), loadLessons(), loadQuizzes()]);
  }, []);

  // ── Lookup maps ──────────────────────────────────────────────────────
  const programMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of programs) m[p.id] = p.name;
    return m;
  }, [programs]);

  const categoryMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of categories) m[c.id] = c.name;
    return m;
  }, [categories]);

  const lessonMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const l of lessons) m[l.id] = l.title;
    return m;
  }, [lessons]);

  // ── Shared filter predicate ──────────────────────────────────────────
  const search = searchTerm.trim().toLowerCase();
  const matchStatus = (active: boolean) =>
    statusFilter === "all" || (statusFilter === "active" ? active : !active);

  const filtersActive = !!search || statusFilter !== "all";

  const filteredPrograms = programs.filter(
    (p) =>
      matchStatus(p.is_active) &&
      (!search ||
        p.name.toLowerCase().includes(search) ||
        (p.description ?? "").toLowerCase().includes(search)),
  );
  const filteredCategories = categories.filter(
    (c) =>
      matchStatus(c.is_active) &&
      (!search ||
        c.name.toLowerCase().includes(search) ||
        (c.description ?? "").toLowerCase().includes(search)),
  );
  const filteredLessons: Lesson[] = lessons
    .filter(
      (l) =>
        matchStatus(l.is_active) &&
        (!search ||
          l.title.toLowerCase().includes(search) ||
          (l.description ?? "").toLowerCase().includes(search)),
    )
    .map((l) => ({ ...l, name: l.title }));
  const filteredQuizzes: Quiz[] = quizzes
    .filter(
      (q) => matchStatus(q.is_active) && (!search || q.title.toLowerCase().includes(search)),
    )
    .map((q) => ({ ...q, name: q.title }));

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
      sortValue: (p) => categories.filter((c) => c.training_id === p.id).length,
      render: (p) => (
        <span className="text-sm">
          {categories.filter((c) => c.training_id === p.id).length}
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
          {programMap[c.training_id] ?? "—"}
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
          {categoryMap[l.category_id] ?? "—"}
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
          {lessonMap[q.lesson_id] ?? "—"}
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
        value: categories.filter((c) => c.training_id === p.id).length,
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

      <TrainingEntityTable
        config={programConfig}
        rows={filteredPrograms}
        rawCount={programs.length}
        filtersActive={filtersActive}
        currentSearch={searchTerm}
        currentStatus={statusFilter}
        onMutated={loadPrograms}
        onRefresh={loadPrograms}
        isRefreshing={programsRefreshing}
      />

      <TrainingEntityTable
        config={categoryConfig}
        rows={filteredCategories}
        rawCount={categories.length}
        filtersActive={filtersActive}
        currentSearch={searchTerm}
        currentStatus={statusFilter}
        onMutated={loadCategories}
        onRefresh={loadCategories}
        isRefreshing={categoriesRefreshing}
      />

      <TrainingEntityTable
        config={lessonConfig}
        rows={filteredLessons}
        rawCount={lessons.length}
        filtersActive={filtersActive}
        currentSearch={searchTerm}
        currentStatus={statusFilter}
        onMutated={loadLessons}
        onRefresh={loadLessons}
        isRefreshing={lessonsRefreshing}
      />

      <TrainingEntityTable
        config={quizConfig}
        rows={filteredQuizzes}
        rawCount={quizzes.length}
        filtersActive={filtersActive}
        currentSearch={searchTerm}
        currentStatus={statusFilter}
        onMutated={loadQuizzes}
        onRefresh={loadQuizzes}
        isRefreshing={quizzesRefreshing}
      />
    </div>
  );
}
