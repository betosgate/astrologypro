"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilterX } from "lucide-react";
import {
  TrainingEntityTable,
  StatusBadge,
  type EntityColumn,
  type EntityTableConfig,
} from "@/components/admin/training-entity-table";
import type { TrainingEntityRow } from "@/components/admin/training-entity-sheet";
import { SearchableSelect } from "@/components/ui/searchable-select";

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
  is_active: boolean;
  created_at: string;
};

type Role = { id: string; role_name: string; slug: string };

type ProgramOption = { id: string; name: string };

type CategoryOption = { id: string; name: string };

type LessonOption = { id: string; title: string };

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
  extra?: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  params.set("page", String(state.page));
  params.set("pageSize", String(state.pageSize));
  params.set("sortBy", state.sortBy);
  params.set("sortDir", state.sortDir);
  if (search) params.set("search", search);
  if (status !== "all") params.set("status", status);
  for (const [key, value] of Object.entries(extra ?? {})) {
    if (value) params.set(key, value);
  }
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

  // Table-specific filters. More tables will get their own filters as needed.
  const [programSearchTerm, setProgramSearchTerm] = useState("");
  const [debouncedProgramSearchTerm, setDebouncedProgramSearchTerm] = useState("");
  const [programStatusFilter, setProgramStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [programCreatedFrom, setProgramCreatedFrom] = useState("");
  const [programCreatedTo, setProgramCreatedTo] = useState("");
  const [programAccessFilter, setProgramAccessFilter] = useState("all");
  const [roles, setRoles] = useState<Role[]>([]);

  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [debouncedCategorySearchTerm, setDebouncedCategorySearchTerm] = useState("");
  const [categoryProgramFilter, setCategoryProgramFilter] = useState("all");
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [categoryCreatedFrom, setCategoryCreatedFrom] = useState("");
  const [categoryCreatedTo, setCategoryCreatedTo] = useState("");

  const [lessonSearchTerm, setLessonSearchTerm] = useState("");
  const [debouncedLessonSearchTerm, setDebouncedLessonSearchTerm] = useState("");
  const [lessonCategoryFilter, setLessonCategoryFilter] = useState("all");
  const [lessonStatusFilter, setLessonStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [lessonCreatedFrom, setLessonCreatedFrom] = useState("");
  const [lessonCreatedTo, setLessonCreatedTo] = useState("");

  const [quizSearchTerm, setQuizSearchTerm] = useState("");
  const [debouncedQuizSearchTerm, setDebouncedQuizSearchTerm] = useState("");
  const [quizLessonFilter, setQuizLessonFilter] = useState("all");
  const [quizStatusFilter, setQuizStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [quizCreatedFrom, setQuizCreatedFrom] = useState("");
  const [quizCreatedTo, setQuizCreatedTo] = useState("");

  const programHasDateRange = !!programCreatedFrom && !!programCreatedTo;
  const categoryHasDateRange = !!categoryCreatedFrom && !!categoryCreatedTo;
  const lessonHasDateRange = !!lessonCreatedFrom && !!lessonCreatedTo;
  const quizHasDateRange = !!quizCreatedFrom && !!quizCreatedTo;

  const programEffectiveCreatedFrom = programHasDateRange ? programCreatedFrom : "";
  const programEffectiveCreatedTo = programHasDateRange ? programCreatedTo : "";
  const categoryEffectiveCreatedFrom = categoryHasDateRange ? categoryCreatedFrom : "";
  const categoryEffectiveCreatedTo = categoryHasDateRange ? categoryCreatedTo : "";
  const lessonEffectiveCreatedFrom = lessonHasDateRange ? lessonCreatedFrom : "";
  const lessonEffectiveCreatedTo = lessonHasDateRange ? lessonCreatedTo : "";
  const quizEffectiveCreatedFrom = quizHasDateRange ? quizCreatedFrom : "";
  const quizEffectiveCreatedTo = quizHasDateRange ? quizCreatedTo : "";

  // ── FK lookup maps ────────────────────────────────────────────────────
  // Built from UNPAGINATED fetches so every category/lesson label resolves
  // even when the related entity is on a different page. Lightweight — only
  // id + name/title selected. Refreshed on mount + after any mutation.
  const [programMap, setProgramMap] = useState<Record<string, string>>({});
  const [programOptions, setProgramOptions] = useState<ProgramOption[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [lessonMap, setLessonMap] = useState<Record<string, string>>({});
  const [lessonOptions, setLessonOptions] = useState<LessonOption[]>([]);
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
    const po: ProgramOption[] = [];
    for (const p of progJson.programs ?? []) {
      pm[p.id] = p.name;
      po.push({ id: p.id, name: p.name });
    }
    setProgramMap(pm);
    setProgramOptions(po);
    const cm: Record<string, string> = {};
    const co: CategoryOption[] = [];
    const cpp: Record<string, number> = {};
    for (const c of catJson.categories ?? []) {
      cm[c.id] = c.name;
      co.push({ id: c.id, name: c.name });
      cpp[c.training_id] = (cpp[c.training_id] ?? 0) + 1;
    }
    setCategoryMap(cm);
    setCategoryOptions(co);
    setCategoriesPerProgram(cpp);
    const lm: Record<string, string> = {};
    const lo: LessonOption[] = [];
    for (const l of lesJson.lessons ?? []) {
      lm[l.id] = l.title;
      lo.push({ id: l.id, title: l.title });
    }
    setLessonMap(lm);
    setLessonOptions(lo);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProgramSearchTerm(programSearchTerm.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [programSearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCategorySearchTerm(categorySearchTerm.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [categorySearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLessonSearchTerm(lessonSearchTerm.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [lessonSearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuizSearchTerm(quizSearchTerm.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [quizSearchTerm]);

  useEffect(() => {
    fetch("/api/admin/roles")
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => setRoles(json.data ?? []))
      .catch(() => setRoles([]));
  }, []);

  // ── Server-driven fetch per entity ────────────────────────────────────
  async function loadPrograms(stateOverride?: TableState) {
    const st = stateOverride ?? programState;
    setProgramsRefreshing(true);
    try {
      const url = buildUrl(
        "/api/admin/training/programs",
        st,
        debouncedProgramSearchTerm,
        programStatusFilter,
        {
          created_from: programEffectiveCreatedFrom,
          created_to: programEffectiveCreatedTo,
          access: programAccessFilter !== "all" ? programAccessFilter : undefined,
        },
      );
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
      const url = buildUrl(
        "/api/admin/training/categories",
        st,
        debouncedCategorySearchTerm,
        categoryStatusFilter,
        {
          program_id: categoryProgramFilter !== "all" ? categoryProgramFilter : undefined,
          created_from: categoryEffectiveCreatedFrom,
          created_to: categoryEffectiveCreatedTo,
        },
      );
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
      const url = buildUrl(
        "/api/admin/training/lessons",
        st,
        debouncedLessonSearchTerm,
        lessonStatusFilter,
        {
          category_id: lessonCategoryFilter !== "all" ? lessonCategoryFilter : undefined,
          created_from: lessonEffectiveCreatedFrom,
          created_to: lessonEffectiveCreatedTo,
        },
      );
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
      const url = buildUrl(
        "/api/admin/training/quizzes",
        st,
        debouncedQuizSearchTerm,
        quizStatusFilter,
        {
          lesson_id: quizLessonFilter !== "all" ? quizLessonFilter : undefined,
          created_from: quizEffectiveCreatedFrom,
          created_to: quizEffectiveCreatedTo,
        },
      );
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
  }, []);

  // Server-driven: filters are passed to the API, not applied client-side.
  const programFiltersActive =
    !!programSearchTerm.trim() ||
    programStatusFilter !== "all" ||
    programHasDateRange ||
    programAccessFilter !== "all";
  const programFilterInputsActive =
    programFiltersActive || !!programCreatedFrom || !!programCreatedTo;

  const categoryFiltersActive =
    !!categorySearchTerm.trim() ||
    categoryProgramFilter !== "all" ||
    categoryStatusFilter !== "all" ||
    categoryHasDateRange;
  const categoryFilterInputsActive =
    categoryFiltersActive || !!categoryCreatedFrom || !!categoryCreatedTo;

  const lessonFiltersActive =
    !!lessonSearchTerm.trim() ||
    lessonCategoryFilter !== "all" ||
    lessonStatusFilter !== "all" ||
    lessonHasDateRange;
  const lessonFilterInputsActive =
    lessonFiltersActive || !!lessonCreatedFrom || !!lessonCreatedTo;

  const quizFiltersActive =
    !!quizSearchTerm.trim() ||
    quizLessonFilter !== "all" ||
    quizStatusFilter !== "all" ||
    quizHasDateRange;
  const quizFilterInputsActive =
    quizFiltersActive || !!quizCreatedFrom || !!quizCreatedTo;

  useEffect(() => {
    if (!initialLoadDone) return;
    const nextState = { ...programState, page: 1 };
    setProgramState(nextState);
    void loadPrograms(nextState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedProgramSearchTerm,
    programStatusFilter,
    programEffectiveCreatedFrom,
    programEffectiveCreatedTo,
    programAccessFilter,
  ]);

  useEffect(() => {
    if (!initialLoadDone) return;
    const nextState = { ...lessonState, page: 1 };
    setLessonState(nextState);
    void loadLessons(nextState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedLessonSearchTerm,
    lessonCategoryFilter,
    lessonStatusFilter,
    lessonEffectiveCreatedFrom,
    lessonEffectiveCreatedTo,
  ]);

  useEffect(() => {
    if (!initialLoadDone) return;
    const nextState = { ...quizState, page: 1 };
    setQuizState(nextState);
    void loadQuizzes(nextState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedQuizSearchTerm,
    quizLessonFilter,
    quizStatusFilter,
    quizEffectiveCreatedFrom,
    quizEffectiveCreatedTo,
  ]);

  useEffect(() => {
    if (!initialLoadDone) return;
    const nextState = { ...categoryState, page: 1 };
    setCategoryState(nextState);
    void loadCategories(nextState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedCategorySearchTerm,
    categoryProgramFilter,
    categoryStatusFilter,
    categoryEffectiveCreatedFrom,
    categoryEffectiveCreatedTo,
  ]);

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

  const programFiltersSlot = (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_160px_160px_150px_190px_auto] md:items-end">
        <div>
          <Label className="mb-1 block text-xs">Search by Name</Label>
          <Input
            placeholder="Program name..."
            value={programSearchTerm}
            onChange={(e) => setProgramSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs">Created From</Label>
          <Input
            type="date"
            value={programCreatedFrom}
            onChange={(e) => setProgramCreatedFrom(e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs">Created To</Label>
          <Input
            type="date"
            value={programCreatedTo}
            onChange={(e) => setProgramCreatedTo(e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs">Status</Label>
          <select
            value={programStatusFilter}
            onChange={(e) =>
              setProgramStatusFilter(e.target.value as "all" | "active" | "inactive")
            }
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <Label className="mb-1 block text-xs">Access</Label>
          <select
            value={programAccessFilter}
            onChange={(e) => setProgramAccessFilter(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="all">All access types</option>
            <option value="all_access">All authenticated users</option>
            {roles.map((role) => (
              <option key={role.slug} value={role.slug}>
                {role.role_name}
              </option>
            ))}
          </select>
        </div>
        {programFilterInputsActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setProgramSearchTerm("");
              setProgramCreatedFrom("");
              setProgramCreatedTo("");
              setProgramStatusFilter("all");
              setProgramAccessFilter("all");
            }}
            className="gap-1.5"
          >
            <FilterX className="size-3.5" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );

  const categoryFiltersSlot = (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_220px_150px_160px_160px_auto] md:items-end">
        <div>
          <Label className="mb-1 block text-xs">Search by Category</Label>
          <Input
            placeholder="Category name..."
            value={categorySearchTerm}
            onChange={(e) => setCategorySearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs">Program</Label>
          <SearchableSelect
            value={categoryProgramFilter}
            onValueChange={setCategoryProgramFilter}
            placeholder="All programs"
            searchPlaceholder="Search programs..."
            maxInitialDisplay={5}
            className="h-9 w-full"
            options={[
              { value: "all", label: "All programs" },
              ...programOptions.map((program) => ({
                value: program.id,
                label: program.name,
              })),
            ]}
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs">Status</Label>
          <select
            value={categoryStatusFilter}
            onChange={(e) =>
              setCategoryStatusFilter(e.target.value as "all" | "active" | "inactive")
            }
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <Label className="mb-1 block text-xs">Created From</Label>
          <Input
            type="date"
            value={categoryCreatedFrom}
            onChange={(e) => setCategoryCreatedFrom(e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs">Created To</Label>
          <Input
            type="date"
            value={categoryCreatedTo}
            onChange={(e) => setCategoryCreatedTo(e.target.value)}
          />
        </div>
        {categoryFilterInputsActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCategorySearchTerm("");
              setCategoryProgramFilter("all");
              setCategoryStatusFilter("all");
              setCategoryCreatedFrom("");
              setCategoryCreatedTo("");
            }}
            className="gap-1.5"
          >
            <FilterX className="size-3.5" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );

  const lessonFiltersSlot = (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_220px_150px_160px_160px_auto] md:items-end">
        <div>
          <Label className="mb-1 block text-xs">Search by Title</Label>
          <Input
            placeholder="Lesson title..."
            value={lessonSearchTerm}
            onChange={(e) => setLessonSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs">Category</Label>
          <SearchableSelect
            value={lessonCategoryFilter}
            onValueChange={setLessonCategoryFilter}
            placeholder="All categories"
            searchPlaceholder="Search categories..."
            maxInitialDisplay={5}
            className="h-9 w-full"
            options={[
              { value: "all", label: "All categories" },
              ...categoryOptions.map((category) => ({
                value: category.id,
                label: category.name,
              })),
            ]}
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs">Status</Label>
          <select
            value={lessonStatusFilter}
            onChange={(e) =>
              setLessonStatusFilter(e.target.value as "all" | "active" | "inactive")
            }
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <Label className="mb-1 block text-xs">Created From</Label>
          <Input
            type="date"
            value={lessonCreatedFrom}
            onChange={(e) => setLessonCreatedFrom(e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs">Created To</Label>
          <Input
            type="date"
            value={lessonCreatedTo}
            onChange={(e) => setLessonCreatedTo(e.target.value)}
          />
        </div>
        {lessonFilterInputsActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLessonSearchTerm("");
              setLessonCategoryFilter("all");
              setLessonStatusFilter("all");
              setLessonCreatedFrom("");
              setLessonCreatedTo("");
            }}
            className="gap-1.5"
          >
            <FilterX className="size-3.5" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );

  const quizFiltersSlot = (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_220px_150px_160px_160px_auto] md:items-end">
        <div>
          <Label className="mb-1 block text-xs">Search by Title</Label>
          <Input
            placeholder="Quiz title..."
            value={quizSearchTerm}
            onChange={(e) => setQuizSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs">Lesson</Label>
          <SearchableSelect
            value={quizLessonFilter}
            onValueChange={setQuizLessonFilter}
            placeholder="All lessons"
            searchPlaceholder="Search lessons..."
            maxInitialDisplay={5}
            className="h-9 w-full"
            options={[
              { value: "all", label: "All lessons" },
              ...lessonOptions.map((lesson) => ({
                value: lesson.id,
                label: lesson.title,
              })),
            ]}
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs">Status</Label>
          <select
            value={quizStatusFilter}
            onChange={(e) =>
              setQuizStatusFilter(e.target.value as "all" | "active" | "inactive")
            }
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <Label className="mb-1 block text-xs">Created From</Label>
          <Input
            type="date"
            value={quizCreatedFrom}
            onChange={(e) => setQuizCreatedFrom(e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs">Created To</Label>
          <Input
            type="date"
            value={quizCreatedTo}
            onChange={(e) => setQuizCreatedTo(e.target.value)}
          />
        </div>
        {quizFilterInputsActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setQuizSearchTerm("");
              setQuizLessonFilter("all");
              setQuizStatusFilter("all");
              setQuizCreatedFrom("");
              setQuizCreatedTo("");
            }}
            className="gap-1.5"
          >
            <FilterX className="size-3.5" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );

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
            filtersActive={programFiltersActive}
            currentSearch={debouncedProgramSearchTerm}
            currentStatus={programStatusFilter}
            currentExtraQuery={{
              created_from: programEffectiveCreatedFrom,
              created_to: programEffectiveCreatedTo,
              access: programAccessFilter !== "all" ? programAccessFilter : undefined,
            }}
            filtersSlot={programFiltersSlot}
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
            filtersActive={categoryFiltersActive}
            currentSearch={debouncedCategorySearchTerm}
            currentStatus={categoryStatusFilter}
            currentExtraQuery={{
              program_id: categoryProgramFilter !== "all" ? categoryProgramFilter : undefined,
              created_from: categoryEffectiveCreatedFrom,
              created_to: categoryEffectiveCreatedTo,
            }}
            filtersSlot={categoryFiltersSlot}
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
            filtersActive={lessonFiltersActive}
            currentSearch={debouncedLessonSearchTerm}
            currentStatus={lessonStatusFilter}
            currentExtraQuery={{
              category_id: lessonCategoryFilter !== "all" ? lessonCategoryFilter : undefined,
              created_from: lessonEffectiveCreatedFrom,
              created_to: lessonEffectiveCreatedTo,
            }}
            filtersSlot={lessonFiltersSlot}
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
            filtersActive={quizFiltersActive}
            currentSearch={debouncedQuizSearchTerm}
            currentStatus={quizStatusFilter}
            currentExtraQuery={{
              lesson_id: quizLessonFilter !== "all" ? quizLessonFilter : undefined,
              created_from: quizEffectiveCreatedFrom,
              created_to: quizEffectiveCreatedTo,
            }}
            filtersSlot={quizFiltersSlot}
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
