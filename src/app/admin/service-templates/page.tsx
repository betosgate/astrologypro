"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { APP_URL } from "@/lib/constants";
import {
  getServiceTemplatePublicPath,
  isGeneralServiceTemplateSlug,
} from "@/lib/service-template-public";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Copy,
  ExternalLink,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import {
  AdminPagination,
  AdminTableSearch,
  AdminResetButton,
  useAdminTableParams,
} from "@/components/admin/admin-table-parts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Types ────────────────────────────────────────────────────────────────────

interface ServiceTemplateRow {
  id: string;
  name: string;
  slug: string;
  category: "astrology" | "tarot";
  description: string | null;
  base_price: number;
  duration_minutes: number;
  is_primary: boolean;
  is_active: boolean;
  display_order: number;
  icon_name: string | null;
  diviner_count: number;
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ServiceTemplatesPage() {
  const router = useRouter();
  const {
    pushParams,
    currentPage,
    currentSort,
    currentDir,
    currentQ,
    isPending,
  } = useAdminTableParams({ sort: "display_order", dir: "asc" });

  const [templates, setTemplates] = useState<ServiceTemplateRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatus] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [pageSize, setPageSize] = useState(25);

  const [deleteTarget, setDeleteTarget] = useState<ServiceTemplateRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentQ) params.set("search", currentQ);
      if (category !== "all") params.set("category", category);
      if (statusFilter !== "all") params.set("is_active", statusFilter === "active" ? "true" : "false");
      if (scopeFilter !== "all") params.set("scope", scopeFilter);
      params.set("sort_by", currentSort);
      params.set("sort_dir", currentDir);
      params.set("page", String(currentPage));
      params.set("limit", String(pageSize));

      const res = await fetch(`/api/admin/service-templates?${params}`);
      if (!res.ok) throw new Error("Failed to load templates");
      const json = await res.json();
      setTemplates(json.templates ?? []);
      setTotal(json.total ?? 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error loading templates");
    } finally {
      setLoading(false);
    }
  }, [currentQ, category, statusFilter, scopeFilter, currentSort, currentDir, currentPage, pageSize]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  function handleSort(col: string) {
    if (currentSort === col) {
      pushParams({ sortDir: currentDir === "asc" ? "desc" : "asc" });
    } else {
      pushParams({ sortBy: col, sortDir: "asc" });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/service-templates/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (res.status === 409) {
        const names = (json.affected_diviners ?? [])
          .map((d: { display_name: string }) => d.display_name)
          .join(", ");
        toast.error(
          `Cannot deactivate — ${json.count} diviner(s) are using this template: ${names}`
        );
        return;
      }
      if (!res.ok) throw new Error(json.error ?? "Delete failed");

      toast.success(`"${deleteTarget.name}" deactivated`);
      setDeleteTarget(null);
      fetchTemplates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  function handleReset() {
    setCategory("all");
    setStatus("all");
    setScopeFilter("all");
    pushParams({ q: "", sortBy: "display_order", sortDir: "asc", page: "1" });
  }

  async function handleCopyPublicUrl(template: ServiceTemplateRow) {
    try {
      const publicUrl = `${APP_URL}${getServiceTemplatePublicPath(template.slug)}`;
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Public URL copied");
    } catch {
      toast.error("Failed to copy public URL");
    }
  }

  function handleOpenPublicUrl(template: ServiceTemplateRow) {
    window.open(`${APP_URL}${getServiceTemplatePublicPath(template.slug)}`, "_blank", "noopener,noreferrer");
  }

  const hasActiveFilters =
    currentQ !== "" ||
    category !== "all" ||
    statusFilter !== "all" ||
    scopeFilter !== "all" ||
    currentSort !== "display_order" ||
    currentDir !== "asc";

  function SortIcon({ col }: { col: string }) {
    if (currentSort !== col) return null;
    return currentDir === "asc" ? (
      <ChevronUp className="inline h-3 w-3 ml-1" />
    ) : (
      <ChevronDown className="inline h-3 w-3 ml-1" />
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Service Templates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} result{total !== 1 ? "s" : ""} · page {currentPage} of {totalPages}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/service-template-intakes">Intake Submissions</Link>
          </Button>
          <AdminResetButton hasActiveFilters={hasActiveFilters} onReset={handleReset} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTemplates()}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading && "animate-spin"}`} />
            Refresh
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/service-templates/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="w-full sm:w-auto flex-1 min-w-[220px] max-w-sm">
          <AdminTableSearch
            defaultValue={currentQ}
            onSearch={(val) => pushParams({ q: val })}
            placeholder="Search templates by name..."
          />
        </div>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="astrology">Astrology</SelectItem>
            <SelectItem value="tarot">Tarot</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={scopeFilter} onValueChange={setScopeFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Template Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Templates</SelectItem>
            <SelectItem value="general">General Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="w-12 cursor-pointer select-none"
                onClick={() => handleSort("display_order")}
              >
                #<SortIcon col="display_order" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("name")}
              >
                Name<SortIcon col="name" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("category")}
              >
                Category<SortIcon col="category" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right"
                onClick={() => handleSort("duration_minutes")}
              >
                Duration<SortIcon col="duration_minutes" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right"
                onClick={() => handleSort("base_price")}
              >
                Price<SortIcon col="base_price" />
              </TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead className="text-center">Diviners</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-muted animate-pulse rounded w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No service templates found.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((t, idx) => (
                <TableRow
                  key={t.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/admin/service-templates/${t.id}`)}
                >
                  <TableCell className="text-muted-foreground text-sm">
                    {(currentPage - 1) * pageSize + idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{t.slug}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        t.category === "astrology"
                          ? "border-amber-500 text-amber-700 dark:text-amber-400"
                          : "border-violet-500 text-violet-700 dark:text-violet-400"
                      }
                    >
                      {t.category === "astrology" ? "⭐ Astrology" : "🃏 Tarot"}
                    </Badge>
                    {t.is_primary && (
                      <Badge variant="secondary" className="ml-1 text-xs">Primary</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{t.duration_minutes} min</TableCell>
                  <TableCell className="text-right">${t.base_price}</TableCell>
                  <TableCell className="text-center">
                    {t.is_active ? (
                      <span className="text-emerald-600 font-medium text-sm">Yes</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm font-medium">{t.diviner_count}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className="flex justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isGeneralServiceTemplateSlug(t.slug) && (
                            <DropdownMenuItem
                              onClick={() => handleCopyPublicUrl(t)}
                              disabled={!t.is_active}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy public URL
                            </DropdownMenuItem>
                          )}
                          {isGeneralServiceTemplateSlug(t.slug) && (
                            <DropdownMenuItem
                              onClick={() => handleOpenPublicUrl(t)}
                              disabled={!t.is_active}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Open public page
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/service-templates/${t.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit template
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(t)}
                            disabled={t.diviner_count > 0}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Deactivate template
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && total > 0 && (
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={(p) => pushParams({ page: String(p) })}
          onPageSizeChange={(s) => {
            setPageSize(parseInt(s, 10));
            pushParams({ page: "1" });
          }}
          isPending={isPending}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate &ldquo;{deleteTarget?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide the template from onboarding and service selection. It will not delete
              any existing diviner services. You can reactivate it later by creating a template with
              the same slug.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deactivating…" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
