"use client";

import Link from "next/link";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
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
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    sent: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    declined: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${variants[status] ?? "bg-gray-100 text-gray-800"}`}
    >
      {status}
    </span>
  );
}

const fmt = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "--";

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

  // ── Sort ────────────────────────────────────────────────────────────────────

  function handleSort(col: string) {
    if (currentSort === col) {
      pushParams({ sortBy: col, sortDir: currentDir === "asc" ? "desc" : "asc" });
    } else {
      pushParams({ sortBy: col, sortDir: "desc" });
    }
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this request? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/testimonials/requests/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Failed to delete.");
        return;
      }
      toast.success("Request deleted.");
      pushParams({ page: String(currentPage) });
    } catch {
      toast.error("Failed to delete.");
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/testimonials">← Testimonials</Link>
          </Button>
          <h1 className="text-xl font-bold tracking-tight">Testimonial Requests</h1>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/testimonials/requests/create">+ New Request</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search by name */}
            <div className="w-full max-w-[220px]">
              <AdminTableSearch
                defaultValue={currentQ}
                onSearch={(v) => pushParams({ q: v })}
                placeholder="Search by name…"
              />
            </div>

            {/* Search by email */}
            <div className="w-full max-w-[220px]">
              <AdminTableSearch
                defaultValue={currentEmail}
                onSearch={(v) => pushParams({ email: v })}
                placeholder="Search by email…"
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

            {/* Submitted date range */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-muted-foreground whitespace-nowrap">
                Submitted From
              </label>
              <input
                type="date"
                value={currentSubmittedFrom}
                onChange={(e) => pushParams({ submittedFrom: e.target.value })}
                className="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-muted-foreground whitespace-nowrap">
                To
              </label>
              <input
                type="date"
                value={currentSubmittedTo}
                onChange={(e) => pushParams({ submittedTo: e.target.value })}
                className="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* Updated date range */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-muted-foreground whitespace-nowrap">
                Updated From
              </label>
              <input
                type="date"
                value={currentUpdatedFrom}
                onChange={(e) => pushParams({ updatedFrom: e.target.value })}
                className="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-muted-foreground whitespace-nowrap">
                To
              </label>
              <input
                type="date"
                value={currentUpdatedTo}
                onChange={(e) => pushParams({ updatedTo: e.target.value })}
                className="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <AdminResetButton
              hasActiveFilters={hasActiveFilters}
              onReset={() =>
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
            />
          </div>

          {/* Table */}
          {requests.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No testimonial requests found.
            </p>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 text-muted-foreground">#</TableHead>
                      <TableHead>
                        <SortHeader
                          label="Requested To Name"
                          column="requested_to_name"
                          currentSort={currentSort}
                          currentDir={currentDir}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortHeader
                          label="Email"
                          column="requested_to_email"
                          currentSort={currentSort}
                          currentDir={currentDir}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>
                        <SortHeader
                          label="Created On"
                          column="created_at"
                          currentSort={currentSort}
                          currentDir={currentDir}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortHeader
                          label="Updated On"
                          column="updated_at"
                          currentSort={currentSort}
                          currentDir={currentDir}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortHeader
                          label="Status"
                          column="status"
                          currentSort={currentSort}
                          currentDir={currentDir}
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
                        className={isPending ? "opacity-60" : undefined}
                      >
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
                                onClick={() => handleDelete(r.id)}
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

              {/* Showing X to Y of Z */}
              <p className="text-sm text-muted-foreground">
                Showing {fromRecord} to {toRecord} of {total} records
              </p>

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
