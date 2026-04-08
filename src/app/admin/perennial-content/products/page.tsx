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
import { Switch } from "@/components/ui/switch";
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

type Product = {
  id: string;
  name: string;
  description: string;
  mrp: number;
  offer_price: number;
  preorder_price: number;
  priority: number;
  category_id: string | null;
  status: string;
  main_image_url: string | null;
  details_image_url: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  perennial_product_categories: { id: string; title: string } | null;
};

const fmt = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "\u2014";

const fmtPrice = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);

export default function ProductsListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewItem, setPreviewItem] = useState<Product | null>(null);
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/perennial-content/products");
    if (res.ok) setProducts(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/admin/perennial-content/products/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
    setDeletingId(null);
  }

  async function toggleVisibility(id: string, current: boolean) {
    const res = await fetch(`/api/admin/perennial-content/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_visible: !current }),
    });
    if (res.ok) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_visible: !current } : p))
      );
    }
  }

  const filtered = useMemo(() => {
    let list = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter);
    }
    return list;
  }, [products, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Product Management
          </h1>
          <p className="text-muted-foreground">
            Manage perennial products
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/perennial-content/products/new">
            <Plus className="mr-2 size-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Products</span>
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
                placeholder="Search by product name..."
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
            <select
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>

          {loading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Loading...
            </p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <p className="text-muted-foreground">
                {products.length === 0
                  ? "No products yet."
                  : "No products match the current filters."}
              </p>
              {products.length === 0 && (
                <Button asChild>
                  <Link href="/admin/perennial-content/products/new">
                    <Plus className="mr-2 size-4" />
                    Create your first product
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Offer Price</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Preorder
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Visible</TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Created
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Updated
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((prod, idx) => (
                      <TableRow key={prod.id}>
                        <TableCell className="text-muted-foreground">
                          {(page - 1) * pageSize + idx + 1}
                        </TableCell>
                        <TableCell className="font-medium max-w-xs">
                          <div className="flex items-center gap-2">
                            {prod.main_image_url && (
                              <img
                                src={prod.main_image_url}
                                alt=""
                                className="size-8 rounded object-cover shrink-0"
                              />
                            )}
                            <div>
                              <span className="truncate block">
                                {prod.name}
                              </span>
                              {prod.perennial_product_categories && (
                                <span className="text-xs text-muted-foreground">
                                  {prod.perennial_product_categories.title}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {fmtPrice(prod.offer_price)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {fmtPrice(prod.preorder_price)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              prod.status === "active"
                                ? "bg-green-500/10 text-green-600"
                                : "bg-red-500/10 text-red-500"
                            }
                          >
                            {prod.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {prod.priority}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={prod.is_visible}
                            onCheckedChange={() =>
                              toggleVisibility(prod.id, prod.is_visible)
                            }
                          />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {fmt(prod.created_at)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {fmt(prod.updated_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setPreviewItem(prod)}
                            >
                              <Eye className="size-3.5" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button asChild size="sm" variant="ghost">
                              <Link
                                href={`/admin/perennial-content/products/${prod.id}`}
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
                                  disabled={deletingId === prod.id}
                                >
                                  <Trash2 className="size-3.5" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete product?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    <strong>{prod.name}</strong> will be
                                    permanently deleted. This action cannot be
                                    undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => handleDelete(prod.id)}
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
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1}-
                  {Math.min(page * pageSize, filtered.length)} of{" "}
                  {filtered.length}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Prev
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - page) <= 1
                    )
                    .map((p, i, arr) => (
                      <span key={p} className="contents">
                        {i > 0 && arr[i - 1] !== p - 1 && (
                          <span className="px-1 text-muted-foreground">
                            ...
                          </span>
                        )}
                        <Button
                          variant={p === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      </span>
                    ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View detail dialog */}
      <Dialog
        open={!!previewItem}
        onOpenChange={(open) => !open && setPreviewItem(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{previewItem?.name}</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Description: </span>
                {previewItem.description || "\u2014"}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-muted-foreground block text-xs">
                    MRP
                  </span>
                  {fmtPrice(previewItem.mrp)}
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">
                    Offer Price
                  </span>
                  {fmtPrice(previewItem.offer_price)}
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">
                    Preorder
                  </span>
                  {fmtPrice(previewItem.preorder_price)}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
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
                <Badge variant="outline">
                  Priority: {previewItem.priority}
                </Badge>
                <Badge variant="outline">
                  {previewItem.is_visible ? "Visible" : "Hidden"}
                </Badge>
                {previewItem.perennial_product_categories && (
                  <Badge variant="secondary">
                    {previewItem.perennial_product_categories.title}
                  </Badge>
                )}
              </div>
              {previewItem.main_image_url && (
                <div>
                  <span className="font-medium">Main Image:</span>
                  <img
                    src={previewItem.main_image_url}
                    alt="Main"
                    className="mt-1 max-h-40 rounded object-contain"
                  />
                </div>
              )}
              {previewItem.details_image_url && (
                <div>
                  <span className="font-medium">Details Image:</span>
                  <img
                    src={previewItem.details_image_url}
                    alt="Details"
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
