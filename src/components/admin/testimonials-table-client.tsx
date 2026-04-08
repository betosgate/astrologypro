"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Pencil,
  Check,
  X,
  EyeOff,
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
  Power,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

// ─── Types ────────────────────────────────────────────────────────────────────

export type TestimonialRow = {
  id: string;
  diviner_id: string;
  client_name: string | null;
  display_alias: string | null;
  rating: number | null;
  text: string;
  service_type: string | null;
  service_name: string | null;
  title: string | null;
  status:
  | "submitted"
  | "pending_review"
  | "approved"
  | "rejected"
  | "hidden"
  | "pending";
  is_featured: boolean;
  spam_score: number | null;
  created_at: string;
  requested_to_email: string | null;
  requested_to_phone_no: string | null;
  added_by_name: string | null;
  added_by_id: string | null;
  diviners: { display_name: string } | null;
};

interface TestimonialsTableClientProps {
  testimonials: TestimonialRow[];
  total: number;
  searchParams: {
    q?: string;
    client?: string;
    status?: string;
    createdFrom?: string;
    createdTo?: string;
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortDir?: string;
  };
  pageSize: number;
}

// ─── Inline helpers ───────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "pending_review", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "hidden", label: "Hidden" },
];

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    submitted: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    pending_review: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
    pending: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
    approved: "bg-green-500/15 text-green-700 dark:text-green-400",
    rejected: "bg-red-500/15 text-red-700 dark:text-red-400",
    hidden: "bg-gray-500/15 text-gray-700 dark:text-gray-400",
  };
  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-[10px] uppercase font-bold tracking-wider",
        variants[status] ?? "bg-gray-500/15 text-gray-700 dark:text-gray-400"
      )}
    >
      {status.replace("_", " ")}
    </Badge>
  );
}

const fmt = (d: string | undefined | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

// ─── Component ────────────────────────────────────────────────────────────────

export function TestimonialsTableClient({
  testimonials,
  total,
  searchParams,
  pageSize,
}: TestimonialsTableClientProps) {
  const {
    pushParams,
    currentPage,
    currentSort,
    currentDir,
    currentQ,
    isPending,
  } = useAdminTableParams({ sort: "created_at", dir: "desc" });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewRow, setPreviewRow] = useState<TestimonialRow | null>(null);

  const currentStatus = searchParams.status ?? "all";
  const currentClient = searchParams.client ?? "";
  const currentCreatedFrom = searchParams.createdFrom ?? "";
  const currentCreatedTo = searchParams.createdTo ?? "";
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const hasActiveFilters = !!(
    currentQ ||
    currentClient ||
    currentStatus !== "all" ||
    currentCreatedFrom ||
    currentCreatedTo
  );

  // Showing X to Y of Z
  const fromRecord = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toRecord = Math.min(currentPage * pageSize, total);

  // ── Bulk selection ──────────────────────────────────────────────────────────

  const allPageIds = testimonials.map((t) => t.id);
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

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Failed to update status.");
        return;
      }
      toast.success(`Testimonial ${newStatus}.`);
      pushParams({ page: String(currentPage) });
    } catch {
      toast.error("Failed to update status.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this testimonial? This cannot be undone."))
      return;
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Failed to delete.");
        return;
      }
      toast.success("Testimonial deleted.");
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      pushParams({ page: String(currentPage) });
    } catch {
      toast.error("Failed to delete.");
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (
      !window.confirm(
        `Delete ${selectedIds.size} testimonial(s)? This cannot be undone.`,
      )
    )
      return;
    try {
      await Promise.all(
        [...selectedIds].map((id) =>
          fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" }),
        ),
      );
      toast.success(`${selectedIds.size} testimonial(s) deleted.`);
      setSelectedIds(new Set());
      pushParams({ page: String(currentPage) });
    } catch {
      toast.error("Bulk delete failed.");
    }
  }

  // ── Sort handler ────────────────────────────────────────────────────────────

  function handleSort(col: string) {
    if (currentSort === col) {
      pushParams({ sortBy: col, sortDir: currentDir === "asc" ? "desc" : "asc" });
    } else {
      pushParams({ sortBy: col, sortDir: "desc" });
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Preview Dialog */}
      <Dialog open={!!previewRow} onOpenChange={(o) => !o && setPreviewRow(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Testimonial Preview</DialogTitle>
          </DialogHeader>
          {previewRow && (
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Title: </span>
                {previewRow.title ?? "--"}
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Feedback: </span>
                <p className="mt-1 whitespace-pre-wrap">{previewRow.text || "--"}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Added By: </span>
                {previewRow.added_by_name ?? "--"}
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Added For: </span>
                {previewRow.client_name ?? "--"}
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Phone: </span>
                {previewRow.requested_to_phone_no ?? "--"}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Testimonials</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {total} result{total !== 1 ? "s" : ""} · page {currentPage} of {totalPages}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                pushParams({
                  q: "",
                  client: "",
                  status: "",
                  createdFrom: "",
                  createdTo: "",
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
            <Link href="/admin/testimonials/create">
              <Plus className="mr-2 size-4" />
              Add Testimonial
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
                placeholder="Search by Title"
                className="pl-9 bg-background"
                autoComplete="off"
              />
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                defaultValue={currentClient}
                onChange={(e) => pushParams({ client: e.target.value })}
                placeholder="Search by Client Name"
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
              <span className="text-xs text-muted-foreground whitespace-nowrap hidden lg:inline-block">Created Start </span>
              <input
                type="date"
                className="w-full bg-transparent outline-none text-sm text-foreground"
                value={currentCreatedFrom}
                onChange={e => pushParams({ createdFrom: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2 bg-background border border-input rounded-md px-3 h-10 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap hidden lg:inline-block">Created End </span>
              <input
                type="date"
                className="w-full bg-transparent outline-none text-sm text-foreground"
                value={currentCreatedTo}
                onChange={e => pushParams({ createdTo: e.target.value })}
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
        {testimonials.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No testimonials found.
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
                      <TableHead className="w-10 text-muted-foreground">#</TableHead>
                      <TableHead>
                        <SortHeader
                          label="Title"
                          column="title"
                          currentSort={currentSort}
                          currentDir={currentDir as "asc" | "desc"}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortHeader
                          label="Client Email"
                          column="requested_to_email"
                          currentSort={currentSort}
                          currentDir={currentDir as "asc" | "desc"}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>Added By</TableHead>
                      <TableHead>
                        <SortHeader
                          label="Client Name"
                          column="client_name"
                          currentSort={currentSort}
                          currentDir={currentDir as "asc" | "desc"}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>
                        <SortHeader
                          label="Status"
                          column="status"
                          currentSort={currentSort}
                          currentDir={currentDir as "asc" | "desc"}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortHeader
                          label="Created On"
                          column="created_at"
                          currentSort={currentSort}
                          currentDir={currentDir as "asc" | "desc"}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testimonials.map((t, idx) => (
                      <TableRow
                        key={t.id}
                        className={cn("group transition-colors hover:bg-muted/50", isPending && "opacity-60")}
                      >
                        <TableCell className="w-8 pl-4 pr-2">
                          <Checkbox
                            checked={selectedIds.has(t.id)}
                            onCheckedChange={(checked) =>
                              toggleOne(t.id, checked === true)
                            }
                            aria-label={`Select testimonial ${t.id}`}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </TableCell>
                        <TableCell className="font-medium max-w-[160px]">
                          <span
                            className="block truncate"
                            title={t.title ?? undefined}
                          >
                            {t.title ?? "--"}
                          </span>
                          {t.spam_score != null && t.spam_score > 0.5 && (
                            <span
                              title={`Spam score: ${t.spam_score}`}
                              className="text-xs text-red-500"
                              aria-label="High spam score"
                            >
                              SPAM
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {t.requested_to_email ?? "--"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {t.added_by_name ?? t.diviners?.display_name ?? "--"}
                        </TableCell>
                        <TableCell>
                          {t.client_name ?? "--"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {t.requested_to_phone_no ?? "--"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={t.status} />
                          {t.is_featured && (
                            <span className="ml-1.5 text-xs font-medium text-amber-600">
                              Featured
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {fmt(t.created_at)}
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
                              <DropdownMenuItem
                                onClick={() => setPreviewRow(t)}
                                className="flex items-center gap-2"
                              >
                                <Eye className="size-3.5" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/admin/testimonials/${t.id}/edit`}
                                  className="flex items-center gap-2"
                                >
                                  <Pencil className="size-3.5" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {t.status !== "approved" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(t.id, "approved")
                                  }
                                  className="flex items-center gap-2 text-green-600"
                                >
                                  <Check className="size-3.5" />
                                  Approve
                                </DropdownMenuItem>
                              )}
                              {t.status !== "rejected" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(t.id, "rejected")
                                  }
                                  className="flex items-center gap-2 text-yellow-600"
                                >
                                  <X className="size-3.5" />
                                  Reject
                                </DropdownMenuItem>
                              )}
                              {t.status !== "hidden" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(t.id, "hidden")
                                  }
                                  className="flex items-center gap-2"
                                >
                                  <EyeOff className="size-3.5" />
                                  Hide
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(t.id)}
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
