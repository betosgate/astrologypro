"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Search } from "lucide-react";
import { toast } from "sonner";

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

  const [templates, setTemplates] = useState<ServiceTemplateRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [category, setCategory]   = useState("all");
  const [statusFilter, setStatus] = useState("all");
  const [sortBy, setSortBy]       = useState("display_order");
  const [sortDir, setSortDir]     = useState<"asc" | "desc">("asc");
  const [deleteTarget, setDeleteTarget] = useState<ServiceTemplateRow | null>(null);
  const [deleting, setDeleting]   = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)   params.set("search", search);
      if (category !== "all") params.set("category", category);
      if (statusFilter !== "all") params.set("is_active", statusFilter === "active" ? "true" : "false");
      params.set("sort_by", sortBy);
      params.set("sort_dir", sortDir);

      const res = await fetch(`/api/admin/service-templates?${params}`);
      if (!res.ok) throw new Error("Failed to load templates");
      const json = await res.json();
      setTemplates(json.templates ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error loading templates");
    } finally {
      setLoading(false);
    }
  }, [search, category, statusFilter, sortBy, sortDir]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  function handleSort(col: string) {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("asc");
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

  function SortIcon({ col }: { col: string }) {
    if (sortBy !== col) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="inline h-3 w-3 ml-1" />
    ) : (
      <ChevronDown className="inline h-3 w-3 ml-1" />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Service Templates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage the master service catalog available to diviners
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/service-templates/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="astrology">Astrology</SelectItem>
            <SelectItem value="tarot">Tarot</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
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
                  <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
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
                      className="flex justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link href={`/admin/service-templates/${t.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(t)}
                        disabled={t.diviner_count > 0}
                        title={t.diviner_count > 0 ? "Cannot deactivate — diviners are using this template" : "Deactivate template"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      {!loading && templates.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {templates.length} template{templates.length !== 1 ? "s" : ""}
        </p>
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
