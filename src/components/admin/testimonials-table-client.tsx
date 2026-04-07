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
} from "lucide-react";
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
  SortHeader,
  AdminPagination,
  AdminTableSearch,
  AdminResetButton,
  useAdminTableParams,
} from "./admin-table-parts";

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
    submitted: "bg-blue-100 text-blue-800 border-blue-200",
    pending_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    hidden: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${variants[status] ?? "bg-gray-100 text-gray-800"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

const fmt = (d: string) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "--";

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Testimonials</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/testimonials/requests">Request Testimonial</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/testimonials/create">+ Add Testimonial</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Testimonials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search by title */}
            <div className="w-full max-w-[220px]">
              <AdminTableSearch
                defaultValue={currentQ}
                onSearch={(v) => pushParams({ q: v })}
                placeholder="Search by title…"
              />
            </div>

            {/* Search by client name */}
            <div className="w-full max-w-[220px]">
              <AdminTableSearch
                defaultValue={currentClient}
                onSearch={(v) => pushParams({ client: v })}
                placeholder="Search by client name…"
              />
            </div>

            {/* Status */}
            <Select
              value={currentStatus}
              onValueChange={(v) =>
                pushParams({ status: v === "all" ? "" : v })
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Created From */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-muted-foreground whitespace-nowrap">
                From
              </label>
              <input
                type="date"
                value={currentCreatedFrom}
                onChange={(e) => pushParams({ createdFrom: e.target.value })}
                className="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* Created To */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-muted-foreground whitespace-nowrap">
                To
              </label>
              <input
                type="date"
                value={currentCreatedTo}
                onChange={(e) => pushParams({ createdTo: e.target.value })}
                className="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <AdminResetButton
              hasActiveFilters={hasActiveFilters}
              onReset={() =>
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
            />
          </div>

          {/* Table */}
          {testimonials.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No testimonials found.
            </p>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
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
                          currentDir={currentDir}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortHeader
                          label="Client Email"
                          column="requested_to_email"
                          currentSort={currentSort}
                          currentDir={currentDir}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>Added By</TableHead>
                      <TableHead>
                        <SortHeader
                          label="Client Name"
                          column="client_name"
                          currentSort={currentSort}
                          currentDir={currentDir}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>
                        <SortHeader
                          label="Status"
                          column="status"
                          currentSort={currentSort}
                          currentDir={currentDir}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortHeader
                          label="Created On"
                          column="created_at"
                          currentSort={currentSort}
                          currentDir={currentDir}
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
                        className={isPending ? "opacity-60" : undefined}
                      >
                        <TableCell>
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
                        <TableCell>
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

              {/* Showing X to Y of Z + pagination */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {fromRecord} to {toRecord} of {total} records
                  {selectedIds.size > 0 && (
                    <span className="ml-2 text-amber-600 font-medium">
                      ({selectedIds.size} selected)
                    </span>
                  )}
                </p>
              </div>

              <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                onPageChange={(p) => pushParams({ page: String(p) })}
                onPageSizeChange={(s) => pushParams({ pageSize: s })}
                isPending={isPending}
              />
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
