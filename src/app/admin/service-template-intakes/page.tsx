"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Archive, CheckCircle2, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminPagination,
  AdminResetButton,
  AdminTableSearch,
  SortHeader,
  useAdminTableParams,
} from "@/components/admin/admin-table-parts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const dynamic = "force-dynamic";

type SubmissionStatus = "new" | "reviewed" | "archived";

interface IntakeSubmissionRow {
  id: string;
  template_name: string;
  template_slug: string;
  category: "astrology" | "tarot";
  toolkit_tab_slug: string | null;
  form_mode: "single" | "couple";
  primary_birth_city: string | null;
  secondary_birth_city: string | null;
  area_of_inquiry: string | null;
  question: string | null;
  future_week: string | null;
  future_month: string | null;
  payload: Record<string, unknown>;
  submission_status: SubmissionStatus;
  submitted_at: string;
}

const STATUS_CLASS: Record<SubmissionStatus, string> = {
  new: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  reviewed: "bg-green-500/10 text-green-700 dark:text-green-400",
  archived: "bg-muted text-muted-foreground",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function SubmissionSheet({
  row,
  open,
  onOpenChange,
  busy,
  onReview,
  onArchive,
  onDelete,
}: {
  row: IntakeSubmissionRow | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  busy: boolean;
  onReview: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [tab, setTab] = useState<"overview" | "payload">("overview");

  if (!row) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="truncate text-lg">{row.template_name}</SheetTitle>
              <SheetDescription className="mt-1 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {row.category === "astrology" ? "Astrology" : "Tarot"}
                </Badge>
                <Badge variant="outline" className={`text-xs ${STATUS_CLASS[row.submission_status]}`}>
                  {row.submission_status}
                </Badge>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Tabs
          key={row.id}
          value={tab}
          onValueChange={(value) => setTab(value as "overview" | "payload")}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="border-b px-5 pt-3">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="payload">Payload</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-sm">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <div className="contents">
                <dt className="pt-0.5 text-xs text-muted-foreground">Submitted</dt>
                <dd>{fmtDate(row.submitted_at)}</dd>
              </div>
              <div className="contents">
                <dt className="pt-0.5 text-xs text-muted-foreground">Template Slug</dt>
                <dd className="font-mono text-xs">{row.template_slug}</dd>
              </div>
              <div className="contents">
                <dt className="pt-0.5 text-xs text-muted-foreground">Form Mode</dt>
                <dd className="capitalize">{row.form_mode}</dd>
              </div>
              <div className="contents">
                <dt className="pt-0.5 text-xs text-muted-foreground">Toolkit Tab</dt>
                <dd className="font-mono text-xs">{row.toolkit_tab_slug ?? "—"}</dd>
              </div>
              <div className="contents">
                <dt className="pt-0.5 text-xs text-muted-foreground">Primary City</dt>
                <dd>{row.primary_birth_city ?? "—"}</dd>
              </div>
              <div className="contents">
                <dt className="pt-0.5 text-xs text-muted-foreground">Secondary City</dt>
                <dd>{row.secondary_birth_city ?? "—"}</dd>
              </div>
              <div className="contents">
                <dt className="pt-0.5 text-xs text-muted-foreground">Future Week</dt>
                <dd>{row.future_week ?? "—"}</dd>
              </div>
              <div className="contents">
                <dt className="pt-0.5 text-xs text-muted-foreground">Future Month</dt>
                <dd>{row.future_month ?? "—"}</dd>
              </div>
            </dl>

            {row.area_of_inquiry && (
              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <p className="text-xs text-muted-foreground">Area of Inquiry</p>
                <p className="mt-1 whitespace-pre-wrap">{row.area_of_inquiry}</p>
              </div>
            )}

            {row.question && (
              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <p className="text-xs text-muted-foreground">Question</p>
                <p className="mt-1 whitespace-pre-wrap">{row.question}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="payload" className="flex-1 overflow-y-auto px-5 py-4">
            <pre className="max-h-[70vh] overflow-auto rounded-md border bg-muted p-3 text-xs">
              {JSON.stringify(row.payload, null, 2)}
            </pre>
          </TabsContent>
        </Tabs>

        <div className="border-t px-5 py-3 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy || row.submission_status === "reviewed"}
            onClick={onReview}
          >
            <CheckCircle2 className="size-3.5 mr-1.5" />
            Mark Reviewed
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy || row.submission_status === "archived"}
            onClick={onArchive}
          >
            <Archive className="size-3.5 mr-1.5" />
            Archive
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-destructive hover:text-destructive"
            disabled={busy}
            onClick={onDelete}
          >
            <Trash2 className="size-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function ServiceTemplateIntakesPage() {
  const {
    pushParams,
    currentPage,
    currentSort,
    currentDir,
    currentQ,
    isPending,
  } = useAdminTableParams({ sort: "submitted_at", dir: "desc" });

  const [submissions, setSubmissions] = useState<IntakeSubmissionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<IntakeSubmissionRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IntakeSubmissionRow | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentQ) params.set("search", currentQ);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      params.set("sort_by", currentSort);
      params.set("sort_dir", currentDir);
      params.set("page", String(currentPage));
      params.set("limit", String(pageSize));

      const res = await fetch(`/api/admin/service-template-intakes?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load intake submissions");

      setSubmissions((json.submissions ?? []) as IntakeSubmissionRow[]);
      setTotal(json.total ?? 0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load intake submissions");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, currentDir, currentPage, currentQ, currentSort, pageSize, statusFilter]);

  useEffect(() => {
    void fetchSubmissions();
  }, [fetchSubmissions]);

  async function patchStatus(id: string, submission_status: SubmissionStatus) {
    setMutatingId(id);
    try {
      const res = await fetch(`/api/admin/service-template-intakes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update submission");
      toast.success(`Submission marked as ${submission_status}`);
      await fetchSubmissions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update submission");
    } finally {
      setMutatingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setMutatingId(deleteTarget.id);
    try {
      const res = await fetch(`/api/admin/service-template-intakes/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to delete submission");
      toast.success("Submission deleted");
      setDeleteTarget(null);
      setSelected(null);
      await fetchSubmissions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete submission");
    } finally {
      setMutatingId(null);
    }
  }

  function handleSort(column: string) {
    if (currentSort === column) {
      pushParams({ sortDir: currentDir === "asc" ? "desc" : "asc" });
      return;
    }
    pushParams({ sortBy: column, sortDir: "asc" });
  }

  function handleReset() {
    setStatusFilter("all");
    setCategoryFilter("all");
    pushParams({ q: "", sortBy: "submitted_at", sortDir: "desc", page: "1" });
  }

  const hasActiveFilters =
    currentQ !== "" ||
    currentSort !== "submitted_at" ||
    currentDir !== "desc" ||
    statusFilter !== "all" ||
    categoryFilter !== "all";

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Template Intake Submissions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} result{total !== 1 ? "s" : ""} · page {currentPage} of {totalPages}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/service-templates">Back to Templates</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => void fetchSubmissions()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="w-full sm:w-auto flex-1 min-w-[220px] max-w-sm">
          <AdminTableSearch
            defaultValue={currentQ}
            onSearch={(val) => pushParams({ q: val })}
            placeholder="Search template, city, question..."
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            pushParams({ page: "1" });
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={categoryFilter}
          onValueChange={(value) => {
            setCategoryFilter(value);
            pushParams({ page: "1" });
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="astrology">Astrology</SelectItem>
            <SelectItem value="tarot">Tarot</SelectItem>
          </SelectContent>
        </Select>

        <AdminResetButton hasActiveFilters={hasActiveFilters} onReset={handleReset} />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortHeader
                  label="Submitted"
                  column="submitted_at"
                  currentSort={currentSort}
                  currentDir={currentDir}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortHeader
                  label="Template"
                  column="template_name"
                  currentSort={currentSort}
                  currentDir={currentDir}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortHeader
                  label="Category"
                  column="category"
                  currentSort={currentSort}
                  currentDir={currentDir}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>
                <SortHeader
                  label="Primary City"
                  column="primary_birth_city"
                  currentSort={currentSort}
                  currentDir={currentDir}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortHeader
                  label="Status"
                  column="submission_status"
                  currentSort={currentSort}
                  currentDir={currentDir}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <TableRow key={idx}>
                  {Array.from({ length: 7 }).map((__, cellIdx) => (
                    <TableCell key={cellIdx}>
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No intake submissions found.
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((submission) => (
                <TableRow
                  key={submission.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelected(submission)}
                >
                  <TableCell className="text-sm text-muted-foreground">
                    {fmtDate(submission.submitted_at)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{submission.template_name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{submission.template_slug}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {submission.category === "astrology" ? "Astrology" : "Tarot"}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{submission.form_mode}</TableCell>
                  <TableCell>{submission.primary_birth_city ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_CLASS[submission.submission_status]}>
                      {submission.submission_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => setSelected(submission)} title="View details">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={mutatingId === submission.id || submission.submission_status === "reviewed"}
                        onClick={() => void patchStatus(submission.id, "reviewed")}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={mutatingId === submission.id || submission.submission_status === "archived"}
                        onClick={() => void patchStatus(submission.id, "archived")}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={mutatingId === submission.id}
                        onClick={() => setDeleteTarget(submission)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && total > 0 && (
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={(page) => pushParams({ page: String(page) })}
          onPageSizeChange={(size) => {
            setPageSize(Number.parseInt(size, 10));
            pushParams({ page: "1" });
          }}
          isPending={isPending}
        />
      )}

      <SubmissionSheet
        row={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        busy={mutatingId === selected?.id}
        onReview={() => selected && void patchStatus(selected.id, "reviewed")}
        onArchive={() => selected && void patchStatus(selected.id, "archived")}
        onDelete={() => selected && setDeleteTarget(selected)}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete intake submission?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the captured intake submission permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleDelete()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
