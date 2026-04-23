"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  FilterX,
  RefreshCw,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  AdminPagination,
  AdminTableSearch,
  AdminResetButton,
  useAdminTableParams,
} from "./admin-table-parts";

function SortHeader({
  label,
  column,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string;
  column: string;
  currentSort: string;
  currentDir: "asc" | "desc";
  onSort: (col: string) => void;
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
import type { TestimonialRequestRow } from "@/app/admin/testimonials/requests/page";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TestimonialRequestsTableClientProps {
  requests: TestimonialRequestRow[];
  total: number;
  searchParams: {
    q?: string;
    email?: string;
    status?: string;
    submittedFrom?: string;
    submittedTo?: string;
    updatedFrom?: string;
    updatedTo?: string;
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortDir?: string;
  };
  pageSize: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "sent", label: "Sent" },
  { value: "completed", label: "Completed" },
  { value: "declined", label: "Declined" },
];

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
    sent: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    completed: "bg-green-500/15 text-green-700 dark:text-green-400",
    declined: "bg-red-500/15 text-red-700 dark:text-red-400",
  };
  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-[10px] uppercase font-bold tracking-wider",
        variants[status] ?? "bg-gray-500/15 text-gray-700 dark:text-gray-400"
      )}
    >
      {status}
    </Badge>
  );
}

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

// ─── Component ────────────────────────────────────────────────────────────────

export function TestimonialRequestsTableClient({
  requests,
  total,
  searchParams,
  pageSize,
}: TestimonialRequestsTableClientProps) {
  const {
    pushParams,
    currentPage,
    currentSort,
    currentDir,
    currentQ,
    isPending,
  } = useAdminTableParams({ sort: "created_at", dir: "desc" });

  const currentStatus = searchParams.status ?? "all";
  const currentEmail = searchParams.email ?? "";
  const currentSubmittedFrom = searchParams.submittedFrom ?? "";
  const currentSubmittedTo = searchParams.submittedTo ?? "";
  const currentUpdatedFrom = searchParams.updatedFrom ?? "";
  const currentUpdatedTo = searchParams.updatedTo ?? "";
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const hasActiveFilters = !!(
    currentQ ||
    currentEmail ||
    currentStatus !== "all" ||
    currentSubmittedFrom ||
    currentSubmittedTo ||
    currentUpdatedFrom ||
    currentUpdatedTo
  );

  const fromRecord = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toRecord = Math.min(currentPage * pageSize, total);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteRow, setDeleteRow] = useState<TestimonialRequestRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const allPageIds = requests.map((r) => r.id);
  const allSelected =
    allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allPageIds.forEach((id) => next.add(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allPageIds.forEach((id) => next.delete(id));
        return next;
      });
    }
  }

  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  // ── Sort ────────────────────────────────────────────────────────────────────

  function handleSort(col: string) {
    if (currentSort === col) {
      pushParams({ sortBy: col, sortDir: currentDir === "asc" ? "desc" : "asc" });
    } else {
      pushParams({ sortBy: col, sortDir: "desc" });
    }
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteRow) return;
    try {
      setDeleteBusy(true);
      const res = await fetch(`/api/admin/testimonials/requests/${deleteRow.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Failed to delete.");
        return;
      }
      toast.success("Request deleted.");
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteRow.id);
        return next;
      });
      setDeleteRow(null);
      pushParams({ page: String(currentPage) });
    } catch {
      toast.error("Failed to delete.");
    } finally {
      setDeleteBusy(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (
      !window.confirm(
        `Delete ${selectedIds.size} request(s)? This cannot be undone.`,
      )
    )
      return;
    try {
      await Promise.all(
        [...selectedIds].map((id) =>
          fetch(`/api/admin/testimonials/requests/${id}`, { method: "DELETE" }),
        ),
      );
      toast.success(`${selectedIds.size} request(s) deleted.`);
      setSelectedIds(new Set());
      pushParams({ page: String(currentPage) });
    } catch {
      toast.error("Bulk delete failed.");
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <ConfirmDialog
        open={!!deleteRow}
        title="Delete Request"
        description="Are you sure you want to delete this request? This cannot be undone."
        confirmLabel="Delete"
        loading={deleteBusy}
        variant="destructive"
        onOpenChange={(open) => {
          if (!open && !deleteBusy) setDeleteRow(null);
        }}
        onConfirm={handleDelete}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="h-8 px-2">
            <Link href="/admin/testimonials">← Testimonials</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Testimonial Requests</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {total} result{total !== 1 ? "s" : ""} · page {currentPage} of {totalPages}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                pushParams({
                  q: "",
                  email: "",
                  status: "",
                  submittedFrom: "",
                  submittedTo: "",
                  updatedFrom: "",
                  updatedTo: "",
                  sortBy: "",
                  sortDir: "",
                })
              }
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <FilterX className="size-4" />
              Reset filters
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => pushParams({ page: String(currentPage) })}
            className="gap-1.5"
            disabled={isPending}
          >
            <RefreshCw className={cn("size-4", isPending && "animate-spin")} />
            {isPending ? "Refreshing…" : "Refresh"}
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/testimonials/requests/create">
              <Plus className="mr-2 size-4" />
              New Request
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Advanced Filters Block */}
        <div className="bg-muted/40 p-4 rounded-xl border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                defaultValue={currentQ}
                onChange={(e) => pushParams({ q: e.target.value })}
                placeholder="Search by Name"
                className="pl-9 bg-background"
                autoComplete="off"
              />
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                defaultValue={currentEmail}
                onChange={(e) => pushParams({ email: e.target.value })}
                placeholder="Search by Email"
                className="pl-9 bg-background"
                autoComplete="off"
              />
            </div>
            <div>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={currentStatus}
                onChange={(e) => pushParams({ status: e.target.value === "all" ? "" : e.target.value })}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label === "All Statuses" ? "Search By Status (All)" : opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-background border border-input rounded-md px-3 h-10 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap hidden lg:inline-block">Submitted Start </span>
              <input
                type="date"
                className="w-full bg-transparent outline-none text-sm text-foreground"
                value={currentSubmittedFrom}
                onChange={e => pushParams({ submittedFrom: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2 bg-background border border-input rounded-md px-3 h-10 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap hidden lg:inline-block">Submitted End </span>
              <input
                type="date"
                className="w-full bg-transparent outline-none text-sm text-foreground"
                value={currentSubmittedTo}
                onChange={e => pushParams({ submittedTo: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2 bg-background border border-input rounded-md px-3 h-10 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap hidden lg:inline-block">Updated Start </span>
              <input
                type="date"
                className="w-full bg-transparent outline-none text-sm text-foreground"
                value={currentUpdatedFrom}
                onChange={e => pushParams({ updatedFrom: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2 bg-background border border-input rounded-md px-3 h-10 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap hidden lg:inline-block">Updated End </span>
              <input
                type="date"
                className="w-full bg-transparent outline-none text-sm text-foreground"
                value={currentUpdatedTo}
                onChange={e => pushParams({ updatedTo: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 rounded-md border bg-muted/50 px-3 py-2">
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              className="gap-1.5"
            >
              <Trash2 className="size-3.5" />
              Delete Selected
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        )}

        {/* Table */}
        {requests.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No testimonial requests found.
          </p>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-8 pl-4 pr-2">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={(checked) =>
                            toggleAll(checked === true)
                          }
                          aria-label="Select all on this page"
                        />
                      </TableHead>
                      <TableHead className="w-8 text-muted-foreground">#</TableHead>
                      {/* ... Header columns handled above ... */}
                      <TableHead>
                        <SortHeader
                          label="Requested To Name"
                          column="requested_to_name"
                          currentSort={currentSort}
                          currentDir={currentDir as "asc" | "desc"}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortHeader
                          label="Email"
                          column="requested_to_email"
                          currentSort={currentSort}
                          currentDir={currentDir as "asc" | "desc"}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>
                        <SortHeader
                          label="Created On"
                          column="created_at"
                          currentSort={currentSort}
                          currentDir={currentDir as "asc" | "desc"}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortHeader
                          label="Updated On"
                          column="updated_at"
                          currentSort={currentSort}
                          currentDir={currentDir as "asc" | "desc"}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortHeader
                          label="Status"
                          column="status"
                          currentSort={currentSort}
                          currentDir={currentDir as "asc" | "desc"}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((r, idx) => (
                      <TableRow
                        key={r.id}
                        className={cn("group transition-colors hover:bg-muted/50", isPending && "opacity-60")}
                      >
                        <TableCell className="w-8 pl-4 pr-2">
                          <Checkbox
                            checked={selectedIds.has(r.id)}
                            onCheckedChange={(checked) =>
                              toggleOne(r.id, checked === true)
                            }
                            aria-label={`Select request ${r.id}`}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{r.requested_to_name}</div>
                          {r.diviners?.display_name && (
                            <div className="text-xs text-muted-foreground">
                              via {r.diviners.display_name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.requested_to_email}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <span
                            className="block truncate text-sm text-muted-foreground"
                            title={r.notes ?? ""}
                          >
                            {r.notes
                              ? r.notes.slice(0, 60) +
                              (r.notes.length > 60 ? "…" : "")
                              : "--"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {fmt(r.created_at)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {fmt(r.updated_at)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={r.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                              >
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/admin/testimonials/requests/${r.id}/edit`}
                                  className="flex items-center gap-2"
                                >
                                  <Pencil className="size-3.5" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/admin/testimonials/requests/${r.id}`}
                                  className="flex items-center gap-2"
                                >
                                  <Eye className="size-3.5" />
                                  Preview
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteRow(r)}
                                className="flex items-center gap-2 text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="size-3.5" />
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

              {/* Pagination footer */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-t text-sm">
                <div className="flex items-center gap-3">
                  <p className="text-muted-foreground whitespace-nowrap">
                    Showing {fromRecord}–{toRecord} of {total}
                    {selectedIds.size > 0 && (
                      <span className="ml-2 text-amber-600 font-medium">
                        ({selectedIds.size} selected)
                      </span>
                    )}
                  </p>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => pushParams({ pageSize: v, page: "1" })}
                  >
                    <SelectTrigger className="h-8 w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 25, 50, 100].map((n) => (
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
                      disabled={currentPage <= 1 || isPending}
                      onClick={() => pushParams({ page: String(currentPage - 1) })}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>

                    {/* Numeric page buttons logic */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
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
                            variant={p === currentPage ? "default" : "outline"}
                            size="sm"
                            className={cn("h-8 w-8 p-0", p === currentPage && "bg-yellow-600 text-white hover:bg-yellow-700")}
                            onClick={() => pushParams({ page: String(p) })}
                            disabled={isPending}
                          >
                            {p}
                          </Button>
                        )
                      )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled={currentPage >= totalPages || isPending}
                      onClick={() => pushParams({ page: String(currentPage + 1) })}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
