"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  RefreshCcw,
  Eye,
} from "lucide-react";

type Category = {
  id: string;
  title: string;
  description: string;
  priority: number;
  status: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

const fmt = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "\u2014";

export default function CategoriesListPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewItem, setPreviewItem] = useState<Category | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/perennial-content/categories");
    if (res.ok) setCategories(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/admin/perennial-content/categories/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
    setDeletingId(null);
  }

  const filtered = useMemo(() => {
    let list = [...categories];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") {
      list = list.filter((c) => c.status === statusFilter);
    }
    return list;
  }, [categories, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Product Categories
          </h1>
          <p className="text-muted-foreground">
            Manage categories for perennial products
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/perennial-content/categories/new">
            <Plus className="mr-2 size-4" />
            Add Category
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Categories</span>
            <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
              <RefreshCcw className="size-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search + filter row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1">
              {(["all", "active", "inactive"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {s === "all"
                    ? "All"
                    : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Loading...
            </p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <p className="text-muted-foreground">
                {categories.length === 0
                  ? "No categories yet."
                  : "No categories match the current filters."}
              </p>
              {categories.length === 0 && (
                <Button asChild>
                  <Link href="/admin/perennial-content/categories/new">
                    <Plus className="mr-2 size-4" />
                    Create your first category
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Description
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Created
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((cat, idx) => (
                  <TableRow key={cat.id}>
                    <TableCell className="text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium max-w-xs">
                      <div className="flex items-center gap-2">
                        {cat.image_url && (
                          <img
                            src={cat.image_url}
                            alt=""
                            className="size-8 rounded object-cover shrink-0"
                          />
                        )}
                        <span className="truncate">{cat.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground max-w-xs">
                      <span className="truncate block">
                        {cat.description || "\u2014"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          cat.status === "active"
                            ? "bg-green-500/10 text-green-600"
                            : "bg-red-500/10 text-red-500"
                        }
                      >
                        {cat.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {cat.priority}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {fmt(cat.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPreviewItem(cat)}
                        >
                          <Eye className="size-3.5" />
                          <span className="sr-only">View</span>
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <Link
                            href={`/admin/perennial-content/categories/${cat.id}`}
                          >
                            <Pencil className="size-3.5" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:bg-red-50 hover:text-red-600"
                              disabled={deletingId === cat.id}
                            >
                              <Trash2 className="size-3.5" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete category?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                <strong>{cat.title}</strong> will be permanently
                                deleted. Products using this category will have
                                their category unset.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleDelete(cat.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && filtered.length > 0 && (
            <p className="text-xs text-muted-foreground text-right">
              Showing {filtered.length} of {categories.length} categories
            </p>
          )}
        </CardContent>
      </Card>

      {/* View detail dialog */}
      <Dialog
        open={!!previewItem}
        onOpenChange={(open) => !open && setPreviewItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{previewItem?.title}</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Description: </span>
                {previewItem.description || "\u2014"}
              </div>
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className={
                    previewItem.status === "active"
                      ? "bg-green-500/10 text-green-600"
                      : "bg-red-500/10 text-red-500"
                  }
                >
                  {previewItem.status}
                </Badge>
                <span className="text-muted-foreground">
                  Priority: {previewItem.priority}
                </span>
              </div>
              {previewItem.image_url && (
                <div>
                  <span className="font-medium">Image: </span>
                  <img
                    src={previewItem.image_url}
                    alt={previewItem.title}
                    className="mt-1 max-h-40 rounded object-contain"
                  />
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Created {fmt(previewItem.created_at)} | Updated{" "}
                {fmt(previewItem.updated_at)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
