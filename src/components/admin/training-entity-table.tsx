"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  TrainingEntitySheet,
  type TrainingEntityRow,
  type TrainingEntityType,
} from "@/components/admin/training-entity-sheet";

/**
 * Config-driven admin table that matches the Users admin ergonomics for every
 * training entity type. Handles:
 *   - sortable column headers (click to sort, toggle direction)
 *   - row selection (checkbox + page-level select-all with indeterminate state)
 *   - sticky bulk action bar (activate / deactivate / export selected / delete)
 *   - three-dot per-row action menu
 *   - notes count column + click to open Notes tab in the detail sheet
 *   - row click opens the detail sheet on the Overview tab
 *
 * Intentional scope:
 *   - filter state (search / status) is owned by the PARENT client so all
 *     four tables on the page share the same filters. The parent passes in
 *     the already-filtered `rows` plus the raw `searchTerm` and `statusFilter`
 *     for the export query.
 */

export interface EntityColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  /** Return the value used for sorting. Strings sort case-insensitively. */
  sortValue?: (row: T) => string | number | null;
  render: (row: T) => React.ReactNode;
  /** Tailwind classes for the <th>/<td>. */
  className?: string;
  /** Hide on smaller breakpoints via responsive classes. */
  cellClassName?: string;
}

export interface EntityTableConfig<T extends { id: string; is_active: boolean }> {
  entityType: TrainingEntityType;
  /** Card title (plural). */
  title: string;
  /** Button on the top-right of the card. */
  addLabel: string;
  addHref: string;
  /** Secondary add button (e.g. "AI Generate" for quizzes). */
  secondaryAdd?: { label: string; href: string };
  /** Empty-state copy when the raw list is empty. */
  emptyText: string;
  /** Empty-state copy when filters hide every row. */
  noMatchText: string;
  columns: EntityColumn<T>[];
  /** Build the overview block that the detail sheet renders. */
  buildOverview: (row: T) => TrainingEntityRow;
  /** Default sort column key. */
  defaultSortKey?: string;
  /** "asc" | "desc" — default direction. */
  defaultSortDir?: "asc" | "desc";
}

interface TrainingEntityTableProps<T extends { id: string; is_active: boolean; name?: string; title?: string }> {
  config: EntityTableConfig<T>;
  /** The current page of rows returned by the server. */
  rows: T[];
  /** Server-reported total matching rows (across all pages). */
  serverTotal: number;
  rawCount: number;
  filtersActive: boolean;
  /** Filter state needed by the export query. */
  currentSearch: string;
  currentStatus: "all" | "active" | "inactive";
  /** Called after a successful mutation (activate/deactivate/delete) so the parent refetches. */
  onMutated: () => Promise<void>;
  /** Table-local refresh button handler. */
  onRefresh: () => Promise<void>;
  /** Users-style loading overlay state. */
  isRefreshing?: boolean;
  /** Called when the user changes page or pageSize so the parent can refetch. */
  onTableStateChange?: (state: {
    page: number;
    pageSize: number;
    sortBy: string;
    sortDir: "asc" | "desc";
  }) => void;
  /** Externally controlled page (from server response). */
  serverPage?: number;
  /** Externally controlled pageSize. */
  serverPageSize?: number;
}

function entityLabel(type: TrainingEntityType): string {
  switch (type) {
    case "program":
      return "Program";
    case "category":
      return "Category";
    case "lesson":
      return "Lesson";
    case "quiz":
      return "Quiz";
  }
}

const ENTITY_API_PATH: Record<TrainingEntityType, string> = {
  program: "programs",
  category: "categories",
  lesson: "lessons",
  quiz: "quizzes",
};

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export function TrainingEntityTable<
  T extends { id: string; is_active: boolean; name?: string; title?: string },
>(props: TrainingEntityTableProps<T>) {
  const {
    config,
    rows,
    serverTotal,
    rawCount,
    filtersActive,
    currentSearch,
    currentStatus,
    onMutated,
    onRefresh,
    isRefreshing = false,
    onTableStateChange,
    serverPage,
    serverPageSize,
  } = props;

  const label = entityLabel(config.entityType);

  // Server-driven mode: sorting, pagination, and filtering happen on the
  // server. The table receives pre-sorted, pre-paged rows from the parent.
  const isServerDriven = !!onTableStateChange;

  // ── Sorting ────────────────────────────────────────────────────────────
  const [sortKey, setSortKey] = useState<string>(config.defaultSortKey ?? "priority");
  const [sortDir, setSortDir] = useState<"asc" | "desc">(
    config.defaultSortDir ?? "asc",
  );

  function toggleSort(key: string) {
    let nextDir: "asc" | "desc";
    if (sortKey === key) {
      nextDir = sortDir === "asc" ? "desc" : "asc";
    } else {
      const col = config.columns.find((c) => c.key === key);
      nextDir = col?.key.includes("name") || col?.key.includes("title") ? "asc" : "desc";
    }
    setSortKey(key);
    setSortDir(nextDir);
    if (isServerDriven) {
      // Reset to page 1 on sort change and delegate to server
      setCurrentPage(1);
      onTableStateChange?.({
        page: 1,
        pageSize,
        sortBy: key,
        sortDir: nextDir,
      });
    }
  }

  // When server-driven, rows arrive pre-sorted — skip client sort.
  // When client-driven (fallback), sort in memory as before.
  const displayRows = useMemo(() => {
    if (isServerDriven) return rows; // already sorted + paged by server
    const col = config.columns.find((c) => c.key === sortKey);
    if (!col || !col.sortable || !col.sortValue) return rows;
    const arr = [...rows];
    arr.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else {
        cmp = String(av).toLowerCase().localeCompare(String(bv).toLowerCase());
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [rows, sortKey, sortDir, config.columns, isServerDriven]);

  // ── Pagination ─────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(serverPage ?? 1);
  const [pageSize, setPageSize] = useState<number>(serverPageSize ?? 10);

  // In server-driven mode, total comes from the server response.
  // In client-driven mode, total is the filtered array length.
  const totalRows = isServerDriven ? serverTotal : displayRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  // In server-driven mode, rows are already one page — no slicing needed.
  // In client-driven mode, slice the sorted array.
  const pagedRows = useMemo(() => {
    if (isServerDriven) return displayRows;
    const start = (currentPage - 1) * pageSize;
    return displayRows.slice(start, start + pageSize);
  }, [displayRows, currentPage, pageSize, isServerDriven]);

  // ── Row selection ──────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Whenever the underlying rows change (filter, refresh), drop any stale
  // selection that no longer matches a visible row.
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const visible = new Set(rows.map((r) => r.id));
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (visible.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [rows]);

  const pageIds = pagedRows.map((r) => r.id);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const someOnPageSelected = pageIds.some((id) => selectedIds.has(id));

  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = !allOnPageSelected && someOnPageSelected;
    }
  }, [allOnPageSelected, someOnPageSelected]);

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        for (const id of pageIds) next.delete(id);
      } else {
        for (const id of pageIds) next.add(id);
      }
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handlePage(page: number) {
    const clamped = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(clamped);
    if (isServerDriven) {
      onTableStateChange?.({
        page: clamped,
        pageSize,
        sortBy: sortKey,
        sortDir,
      });
    }
  }

  function handlePageSizeChange(value: string) {
    const newSize = Number(value);
    setPageSize(newSize);
    setCurrentPage(1);
    if (isServerDriven) {
      onTableStateChange?.({
        page: 1,
        pageSize: newSize,
        sortBy: sortKey,
        sortDir,
      });
    }
  }

  // ── Notes counts ───────────────────────────────────────────────────────
  const [notesCounts, setNotesCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (rows.length === 0) {
      setNotesCounts({});
      return;
    }
    const ids = rows.map((r) => r.id);
    let cancelled = false;
    const url = `/api/admin/training/notes/counts?entity_type=${config.entityType}&ids=${encodeURIComponent(ids.join(","))}`;
    fetch(url)
      .then((res) => (res.ok ? res.json() : { counts: {} }))
      .then((json) => {
        if (!cancelled && json.counts) setNotesCounts(json.counts);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [rows, config.entityType]);

  // ── Detail sheet ───────────────────────────────────────────────────────
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetRow, setSheetRow] = useState<T | null>(null);
  const [sheetTab, setSheetTab] = useState<"overview" | "notes">("overview");

  function openSheet(row: T, tab: "overview" | "notes" = "overview") {
    setSheetRow(row);
    setSheetTab(tab);
    setSheetOpen(true);
  }

  const sheetEntityRow: TrainingEntityRow | null = useMemo(() => {
    if (!sheetRow) return null;
    return config.buildOverview(sheetRow);
  }, [sheetRow, config]);

  // ── Bulk actions ───────────────────────────────────────────────────────
  const [bulkBusy, setBulkBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);

  async function runBulk(action: "activate" | "deactivate" | "delete") {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    try {
      const res = await fetch("/api/admin/training/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: config.entityType,
          ids: Array.from(selectedIds),
          action,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);

      if (action === "delete") {
        const d = body.deleted ?? 0;
        const skipped = Array.isArray(body.skipped) ? body.skipped.length : 0;
        toast.success(
          `Deleted ${d} ${label.toLowerCase()}${d === 1 ? "" : "s"}.${skipped ? ` ${skipped} blocked by related data.` : ""}`,
        );
      } else {
        const n = body.updated ?? 0;
        toast.success(
          `${action === "activate" ? "Activated" : "Deactivated"} ${n} ${label.toLowerCase()}${n === 1 ? "" : "s"}.`,
        );
      }
      setSelectedIds(new Set());
      await onMutated();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : `Bulk ${action} failed.`,
      );
    } finally {
      setBulkBusy(false);
    }
  }

  async function exportSelected() {
    if (selectedIds.size === 0) return;
    setExportBusy(true);
    try {
      const res = await fetch("/api/admin/training/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: config.entityType,
          ids: Array.from(selectedIds),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `training-${config.entityType}s-selected.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(
        `Exported ${selectedIds.size} ${label.toLowerCase()}${selectedIds.size === 1 ? "" : "s"}.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExportBusy(false);
    }
  }

  function exportAll() {
    const params = new URLSearchParams();
    params.set("entity_type", config.entityType);
    if (currentSearch) params.set("search", currentSearch);
    if (currentStatus !== "all") params.set("status", currentStatus);
    window.location.href = `/api/admin/training/export?${params.toString()}`;
  }

  // ── Row delete (single) ────────────────────────────────────────────────
  async function deleteRow(row: T) {
    const rowLabel = row.name ?? row.title ?? "this row";
    if (!confirm(`Delete ${label.toLowerCase()} "${rowLabel}"? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(
        `/api/admin/training/${ENTITY_API_PATH[config.entityType]}/${row.id}`,
        { method: "DELETE" },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      toast.success(`${label} deleted.`);
      await onMutated();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : `Failed to delete ${label}.`,
      );
    }
  }

  async function toggleRowActive(row: T) {
    try {
      const res = await fetch("/api/admin/training/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: config.entityType,
          ids: [row.id],
          action: row.is_active ? "deactivate" : "activate",
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      toast.success(`${label} ${row.is_active ? "deactivated" : "activated"}.`);
      await onMutated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed.");
    }
  }

  const filteredCount = rows.length;

  return (
    <Card className="relative">
      {isRefreshing && (
        <div className="absolute inset-0 z-10 rounded-lg bg-background/60 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 rounded-full bg-background/90 border px-4 py-2 shadow-md text-sm text-muted-foreground">
            <RefreshCw className="size-4 animate-spin text-amber-500" />
            Loading…
          </div>
        </div>
      )}
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{config.title}</CardTitle>
          <CardDescription>
            {filteredCount} {label.toLowerCase()}
            {filteredCount === 1 ? "" : "s"}
            {filtersActive ? ` (of ${rawCount})` : ""}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => void onRefresh()} disabled={isRefreshing}>
            <RefreshCw className={cn("size-3.5 mr-1.5", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={exportAll}>
            <Download className="size-3.5 mr-1.5" />
            Export
          </Button>
          {config.secondaryAdd && (
            <Button asChild size="sm" variant="outline">
              <Link href={config.secondaryAdd.href}>{config.secondaryAdd.label}</Link>
            </Button>
          )}
          <Button asChild size="sm">
            <Link href={config.addHref}>+ {config.addLabel}</Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* ── Bulk action bar ─────────────────────────────────────────── */}
        {selectedIds.size > 0 && (
          <div className="sticky top-2 z-10 flex flex-wrap items-center gap-2 rounded-lg border bg-background/95 px-3 py-2 shadow-sm backdrop-blur">
            <span className="text-sm font-medium">
              {selectedIds.size} {label.toLowerCase()}
              {selectedIds.size === 1 ? "" : "s"} selected
            </span>
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                disabled={exportBusy}
                onClick={exportSelected}
              >
                {exportBusy ? (
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Download className="size-3.5 mr-1.5" />
                )}
                Export Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={bulkBusy}
                onClick={() => runBulk("activate")}
              >
                <ShieldCheck className="size-3.5 mr-1.5 text-green-500" />
                Activate
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={bulkBusy}
                onClick={() => runBulk("deactivate")}
              >
                <ShieldOff className="size-3.5 mr-1.5 text-amber-500" />
                Deactivate
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={bulkBusy}
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (
                    confirm(
                      `Delete ${selectedIds.size} ${label.toLowerCase()}${selectedIds.size === 1 ? "" : "s"}? This cannot be undone.`,
                    )
                  ) {
                    runBulk("delete");
                  }
                }}
              >
                <Trash2 className="size-3.5 mr-1.5" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => setSelectedIds(new Set())}
              >
                <X className="size-3.5 mr-1.5" />
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* ── Table ───────────────────────────────────────────────────── */}
        {pagedRows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {rawCount === 0 ? config.emptyText : config.noMatchText}
          </p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="pl-3 pr-2 py-2 w-8">
                    <input
                      type="checkbox"
                      aria-label={`Select all ${label.toLowerCase()}s on this page`}
                      ref={selectAllRef}
                      checked={allOnPageSelected}
                      onChange={toggleSelectAll}
                      className="size-4 cursor-pointer accent-primary"
                    />
                  </th>
                  {config.columns.map((col) => {
                    const active = sortKey === col.key;
                    return (
                      <th
                        key={col.key}
                        className={cn(
                          "px-3 py-2 text-left font-medium",
                          col.className,
                          col.cellClassName,
                        )}
                      >
                        {col.sortable && col.sortValue ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(col.key)}
                            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                          >
                            {col.label}
                            {active ? (
                              sortDir === "asc" ? (
                                <ArrowUp className="size-3" />
                              ) : (
                                <ArrowDown className="size-3" />
                              )
                            ) : (
                              <ArrowUpDown className="size-3 opacity-40" />
                            )}
                          </button>
                        ) : (
                          col.label
                        )}
                      </th>
                    );
                  })}
                  <th className="px-3 py-2 text-left font-medium w-10">
                    <span title="Notes">
                      <StickyNote className="size-3.5" />
                    </span>
                  </th>
                  <th className="px-3 py-2 text-right font-medium w-10">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row) => {
                  const isSelected = selectedIds.has(row.id);
                  const noteCount = notesCounts[row.id] ?? 0;
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "border-b last:border-0 cursor-pointer hover:bg-muted/30 transition-colors",
                        isSelected && "bg-primary/5",
                      )}
                      onClick={() => openSheet(row)}
                    >
                      <td
                        className="pl-3 pr-2 py-2 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          aria-label={`Select ${label.toLowerCase()}`}
                          checked={isSelected}
                          onChange={() => toggleSelect(row.id)}
                          className="size-4 cursor-pointer accent-primary"
                        />
                      </td>
                      {config.columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn("px-3 py-2 align-top", col.cellClassName)}
                        >
                          {col.render(row)}
                        </td>
                      ))}
                      <td
                        className="px-3 py-2 w-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          openSheet(row, "notes");
                        }}
                      >
                        {noteCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <StickyNote className="size-3" />
                            {noteCount}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">
                            —
                          </span>
                        )}
                      </td>
                      <td
                        className="px-3 py-2 text-right w-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Row actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openSheet(row)}>
                              <Eye className="mr-2 size-3.5" />
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={config.buildOverview(row).editHref}>
                                <Pencil className="mr-2 size-3.5" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleRowActive(row)}>
                              {row.is_active ? (
                                <>
                                  <ShieldOff className="mr-2 size-3.5 text-amber-500" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="mr-2 size-3.5 text-green-500" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deleteRow(row)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 size-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div
          className={cn(
            "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm",
            isRefreshing && "opacity-50 pointer-events-none",
          )}
        >
          <div className="flex items-center gap-3">
            <p className="text-muted-foreground">
              Showing {totalRows === 0 ? 0 : Math.min((currentPage - 1) * pageSize + 1, totalRows)}–
              {Math.min(currentPage * pageSize, totalRows)} of {totalRows}
            </p>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-8 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={currentPage <= 1}
                onClick={() => handlePage(currentPage - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "…" ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === currentPage ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handlePage(p as number)}
                    >
                      {p}
                    </Button>
                  ),
                )}

              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={currentPage >= totalPages}
                onClick={() => handlePage(currentPage + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      <TrainingEntitySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        entityType={config.entityType}
        row={sheetEntityRow}
        onMutated={onMutated}
        initialTab={sheetTab}
        onNotesCountChange={(id, n) =>
          setNotesCounts((prev) => ({ ...prev, [id]: n }))
        }
      />
    </Card>
  );
}

// ─── Helpers exposed for callers ──────────────────────────────────────────

/** Shared active/inactive badge renderer. */
export function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        active
          ? "bg-green-500/10 text-green-500 border-green-500/30"
          : "bg-red-500/10 text-red-500 border-red-500/30"
      }
    >
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

/** Shared chevron used next to sheet-opening row labels. */
export function SheetChevron() {
  return <ChevronRight className="size-3.5 text-muted-foreground/50 inline ml-1 align-middle" />;
}
