"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import {
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  FilterX,
  RefreshCw,
  Power,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldOff,
  Loader2,
  X,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type TarotSpread = {
  id: string;
  name: string;
  card_count: number | null;
  priority: number | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

const fmt = (d: string | undefined) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

type SortKey = "name" | "card_count" | "priority" | "created_at" | "updated_at";

function SortHeader({
  label,
  column,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string;
  column: SortKey;
  currentSort: string;
  currentDir: "asc" | "desc";
  onSort: (col: SortKey) => void;
}) {
  const active = currentSort === column;
  const Icon = active ? (currentDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <button
      onClick={() => onSort(column)}
      className={`flex items-center gap-1 font-medium transition-colors hover:text-foreground ${active ? "text-foreground" : "text-muted-foreground"
        }`}
    >
      {label}
      <Icon className={`size-3 ${active ? "opacity-100" : "opacity-40"}`} />
    </button>
  );
}

export default function TarotSpreadsListPage() {
  const router = useRouter();
  const [allSpreads, setAllSpreads] = useState<TarotSpread[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, startRefreshing] = useTransition();
  const [previewSpread, setPreviewSpread] = useState<TarotSpread | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusSearch, setStatusSearch] = useState("all");
  const [createStart, setCreateStart] = useState("");
  const [createEnd, setCreateEnd] = useState("");
  const [updateStart, setUpdateStart] = useState("");
  const [updateEnd, setUpdateEnd] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  async function loadSpreads() {
    setLoading(true);
    const res = await fetch("/api/admin/tarot/spreads");
    if (res.ok) setAllSpreads(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadSpreads(); }, []);

  function handleRefresh() {
    startRefreshing(async () => {
      await loadSpreads();
      router.refresh();
    });
  }

  function handleReset() {
    setSearch("");
    setStatusSearch("all");
    setCreateStart("");
    setCreateEnd("");
    setUpdateStart("");
    setUpdateEnd("");
    setSortBy("created_at");
    setSortDir("desc");
    setPage(1);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/tarot/spreads/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json();
      toast.error(body.error ?? "Failed to delete spread");
      return;
    }
    toast.success("Spread deleted");
    setAllSpreads((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleToggleStatus(spread: TarotSpread) {
    const next = !spread.is_active;
    // Optimistic update
    setAllSpreads((prev) => prev.map((s) => s.id === spread.id ? { ...s, is_active: next } : s));
    const res = await fetch(`/api/admin/tarot/spreads/${spread.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: next }),
    });
    if (!res.ok) {
      // Revert
      setAllSpreads((prev) => prev.map((s) => s.id === spread.id ? { ...s, is_active: spread.is_active } : s));
      toast.error("Failed to update status");
    } else {
      toast.success(`Spread marked ${next ? "active" : "inactive"}`);
    }
  }

  function handleSort(col: SortKey) {
    if (sortBy === col) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir(col === "name" ? "asc" : "desc");
    }
  }

  const filtered = allSpreads.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;

    if (statusSearch !== "all") {
      const isSearchActive = statusSearch === "active";
      if (s.is_active !== isSearchActive) return false;
    }

    const cDate = new Date(s.created_at);
    if (createStart && cDate < new Date(createStart)) return false;
    if (createEnd && cDate > new Date(createEnd + "T23:59:59")) return false;

    if (updateStart || updateEnd) {
      const uDateRaw = s.updated_at || s.created_at;
      const uDate = new Date(uDateRaw);
      if (updateStart && uDate < new Date(updateStart)) return false;
      if (updateEnd && uDate > new Date(updateEnd + "T23:59:59")) return false;
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let valA: string | number = "";
    let valB: string | number = "";
    if (sortBy === "name") {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
    } else if (sortBy === "card_count") {
      valA = a.card_count ?? 0;
      valB = b.card_count ?? 0;
    } else if (sortBy === "priority") {
      valA = a.priority ?? 0;
      valB = b.priority ?? 0;
    } else if (sortBy === "created_at") {
      valA = new Date(a.created_at).getTime();
      valB = new Date(b.created_at).getTime();
    } else if (sortBy === "updated_at") {
      valA = new Date(a.updated_at || a.created_at).getTime();
      valB = new Date(b.updated_at || b.created_at).getTime();
    }

    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalFiltered = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState<"active" | "inactive">("active");
  const [bulkStatusLoading, setBulkStatusLoading] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const allPageIds = paged.map((s) => s.id);
    const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of allPageIds) next.delete(id);
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of allPageIds) next.add(id);
        return next;
      });
    }
  }

  const allOnPageSelected = paged.length > 0 && paged.every((s) => selectedIds.has(s.id));

  async function handleBulkStatus() {
    setBulkStatusLoading(true);
    let updated = 0;
    for (const id of selectedIds) {
      const res = await fetch(`/api/admin/tarot/spreads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: bulkStatusValue === "active" }),
      });
      if (res.ok) updated++;
    }
    toast.success(`Updated ${updated} spread(s)`);
    setBulkStatusOpen(false);
    setSelectedIds(new Set());
    loadSpreads();
    setBulkStatusLoading(false);
  }

  async function handleBulkDelete() {
    setBulkDeleteLoading(true);
    let deleted = 0;
    for (const id of selectedIds) {
      const res = await fetch(`/api/admin/tarot/spreads/${id}`, { method: "DELETE" });
      if (res.ok) deleted++;
    }
    toast.success(`Deleted ${deleted} spread(s)`);
    setBulkDeleteOpen(false);
    setSelectedIds(new Set());
    loadSpreads();
    setBulkDeleteLoading(false);
  }

  const hasActiveFilters = search.length > 0 || statusSearch !== "all" || createStart || createEnd || updateStart || updateEnd || sortBy !== "created_at" || sortDir !== "desc";

  return (
    <div className="space-y-6">
      {/* Preview Dialog */}
      <Dialog open={!!previewSpread} onOpenChange={(o) => !o && setPreviewSpread(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Spread Preview</DialogTitle>
          </DialogHeader>
          {previewSpread && (
            <div className="space-y-2 text-sm">
              <div><span className="font-medium text-muted-foreground">Name: </span>{previewSpread.name}</div>
              <div><span className="font-medium text-muted-foreground">Card Count: </span>{previewSpread.card_count ?? "—"}</div>
              <div><span className="font-medium text-muted-foreground">Priority: </span>{previewSpread.priority ?? "—"}</div>
              <div><span className="font-medium text-muted-foreground">Status: </span>{previewSpread.is_active ? "Active" : "Inactive"}</div>
              <div><span className="font-medium text-muted-foreground">Created: </span>{fmt(previewSpread.created_at)}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tarot Spreads</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalFiltered} result{totalFiltered !== 1 ? "s" : ""} · page {page} of {totalPages}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <FilterX className="size-4" />
              Reset filters
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-1.5"
          >
            <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/tarot/spreads/new">
              <Plus className="mr-2 size-4" />
              Add Spread
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Advanced Filters Block like legacy desktop system */}
        <div className="bg-muted/40 p-4 rounded-xl border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search By Spread Name"
                className="pl-9 bg-background"
                autoComplete="off"
              />
            </div>
            <div>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={statusSearch}
                onChange={(e) => { setStatusSearch(e.target.value); setPage(1); }}
              >
                <option value="all">Search By Status (All)</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-background border border-input rounded-md px-3 h-10 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap hidden lg:inline-block">Created Start </span>
              <input
                type="date"
                className="w-full bg-transparent outline-none text-sm text-foreground"
                value={createStart}
                onChange={e => { setCreateStart(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex items-center space-x-2 bg-background border border-input rounded-md px-3 h-10 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap hidden lg:inline-block">Created End </span>
              <input
                type="date"
                className="w-full bg-transparent outline-none text-sm text-foreground"
                value={createEnd}
                onChange={e => { setCreateEnd(e.target.value); setPage(1); }}
              />
            </div>

            <div className="flex items-center space-x-2 bg-background border border-input rounded-md px-3 h-10 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap hidden lg:inline-block">Updated Start </span>
              <input
                type="date"
                className="w-full bg-transparent outline-none text-sm text-foreground"
                value={updateStart}
                onChange={e => { setUpdateStart(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex items-center space-x-2 bg-background border border-input rounded-md px-3 h-10 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap hidden lg:inline-block">Updated End </span>
              <input
                type="date"
                className="w-full bg-transparent outline-none text-sm text-foreground"
                value={updateEnd}
                onChange={e => { setUpdateEnd(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-background/95 px-4 py-2.5 shadow-sm">
            <span className="text-sm font-medium text-foreground">
              {selectedIds.size} spread{selectedIds.size !== 1 ? "s" : ""} selected
            </span>
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    Change Status
                    <ArrowDown className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setBulkStatusValue("active"); setBulkStatusOpen(true); }}>
                    <ShieldCheck className="mr-2 size-4 text-green-500" />
                    Set Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setBulkStatusValue("inactive"); setBulkStatusOpen(true); }}>
                    <ShieldOff className="mr-2 size-4 text-destructive" />
                    Set Inactive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => setSelectedIds(new Set())}
              >
                <X className="size-4" />
                Clear
              </Button>
            </div>
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-md" />
                ))}
              </div>
            ) : paged.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No spreads found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-8 pl-4 pr-2">
                        <Checkbox
                          checked={allOnPageSelected}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all on page"
                        />
                      </TableHead>
                      <TableHead>
                        <SortHeader label="Spread Name" column="name" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                      </TableHead>
                      <TableHead>
                        <SortHeader label="Priority" column="priority" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        <SortHeader label="Updated On" column="updated_at" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                      </TableHead>
                      <TableHead>
                        <SortHeader label="Created On" column="created_at" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                      </TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((s) => (
                      <TableRow key={s.id} className="group transition-colors hover:bg-muted/50">
                        <TableCell className="w-8 pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(s.id)}
                            onCheckedChange={() => toggleSelect(s.id)}
                            aria-label={`Select ${s.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                        <TableCell className="text-muted-foreground">{s.priority ?? "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px] uppercase font-bold tracking-wider",
                              s.is_active ? "bg-green-500/15 text-green-700 dark:text-green-400" : "bg-red-500/15 text-red-700 dark:text-red-400"
                            )}
                          >
                            {s.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmt(s.updated_at || s.created_at)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmt(s.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                              <DropdownMenuItem onClick={() => setPreviewSpread(s)}>
                                <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/admin/tarot/spreads/${s.id}/edit`)}>
                                <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(s)}>
                                <Power className={cn("mr-2 h-4 w-4", s.is_active ? "text-amber-500" : "text-green-500")} />
                                {s.is_active ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(s.id, s.name)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination footer */}
            {!loading && paged.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-t text-sm">
                <div className="flex items-center gap-3">
                  <p className="text-muted-foreground whitespace-nowrap">
                    Showing {Math.min((page - 1) * pageSize + 1, totalFiltered)}–{Math.min(page * pageSize, totalFiltered)} of {totalFiltered}
                  </p>
                  <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                    <SelectTrigger className="h-8 w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
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
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>

                    {/* Page number buttons */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                      .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                        if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, idx) =>
                        p === "…" ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                        ) : (
                          <Button
                            key={p}
                            variant={p === page ? "default" : "outline"}
                            size="sm"
                            className={cn("h-8 w-8 p-0", p === page && "bg-yellow-600 text-white hover:bg-yellow-700")}
                            onClick={() => setPage(p as number)}
                          >
                            {p}
                          </Button>
                        )
                      )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bulk Status Dialog */}
      <Dialog open={bulkStatusOpen} onOpenChange={(v) => { if (!v) setBulkStatusOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkStatusValue === "active" ? "Set Active" : "Set Inactive"} {selectedIds.size} Spread{selectedIds.size !== 1 ? "s" : ""}?
            </DialogTitle>
            <DialogDescription>
              {bulkStatusValue === "active"
                ? `This will mark the spread(s) as active so they can be assigned.`
                : `This will mark the spread(s) as inactive and block future assignment.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkStatusOpen(false)} disabled={bulkStatusLoading}>
              Cancel
            </Button>
            <Button
              variant={bulkStatusValue === "inactive" ? "destructive" : "default"}
              onClick={handleBulkStatus}
              disabled={bulkStatusLoading}
            >
              {bulkStatusLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {bulkStatusValue === "active" ? "Activate" : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteOpen} onOpenChange={(v) => { if (!v) setBulkDeleteOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} Spread{selectedIds.size !== 1 ? "s" : ""}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the selected spreads? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleteLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleteLoading}>
              {bulkDeleteLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
