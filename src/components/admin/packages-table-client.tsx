"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Plus, MoreHorizontal, Eye, Pencil, Package } from "lucide-react";
import {
  SortHeader,
  AdminPagination,
  AdminResetButton,
  useAdminTableParams,
} from "./admin-table-parts";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PackageRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  features: string[] | null;
  is_active: boolean;
  created_at: string;
}

interface PackagesTableClientProps {
  packages: PackageRow[];
  total: number;
  searchParams: {
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortDir?: string;
    createdFrom?: string;
    createdTo?: string;
  };
  pageSize: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtPrice(price: number) {
  return `$${Number(price).toFixed(2)}`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function PackagesTableClient({
  packages,
  total,
  searchParams,
  pageSize,
}: PackagesTableClientProps) {
  const {
    pushParams,
    currentPage,
    currentSort,
    currentDir,
    isPending,
  } = useAdminTableParams({ sort: "created_at", dir: "desc" });

  const [sheetPkg, setSheetPkg] = useState<PackageRow | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Date filter values from URL
  const createdFrom = searchParams.createdFrom ?? "";
  const createdTo = searchParams.createdTo ?? "";
  const hasActiveFilters = !!(createdFrom || createdTo);

  // ── Sort handler ──────────────────────────────────────────────────────────

  function handleSort(col: string) {
    const newDir = currentSort === col && currentDir === "asc" ? "desc" : "asc";
    pushParams({ sortBy: col, sortDir: newDir });
  }

  // ── Date filter handlers ──────────────────────────────────────────────────

  function handleDateFilter(key: string, value: string) {
    pushParams({ [key]: value });
  }

  function handleReset() {
    pushParams({ createdFrom: "", createdTo: "", sortBy: "", sortDir: "", page: "1" });
  }

  // ── Pagination handlers ───────────────────────────────────────────────────

  function handlePageChange(p: number) {
    pushParams({ page: String(p) });
  }

  function handlePageSizeChange(size: string) {
    pushParams({ pageSize: size, page: "1" });
  }

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Packages</h1>
          <p className="text-sm text-muted-foreground">
            Manage subscription packages
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/packages/new">
            <Plus className="mr-1.5 size-4" />
            New Package
          </Link>
        </Button>
      </div>

      {/* ── Date Filters ────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="createdFrom" className="text-xs">
                Created from
              </Label>
              <Input
                id="createdFrom"
                type="date"
                defaultValue={createdFrom}
                onChange={(e) => handleDateFilter("createdFrom", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="createdTo" className="text-xs">
                Created to
              </Label>
              <Input
                id="createdTo"
                type="date"
                defaultValue={createdTo}
                onChange={(e) => handleDateFilter("createdTo", e.target.value)}
              />
            </div>
          </div>
          <div className="mt-3">
            <AdminResetButton
              hasActiveFilters={hasActiveFilters}
              onReset={handleReset}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="size-4" />
            All Packages
            <Badge variant="secondary" className="ml-1">
              {total}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {packages.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <Package className="size-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">No packages found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">
                      <SortHeader
                        label="Name"
                        column="name"
                        currentSort={currentSort}
                        currentDir={currentDir}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-3 py-2 text-left">
                      <SortHeader
                        label="Price"
                        column="price"
                        currentSort={currentSort}
                        currentDir={currentDir}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-3 py-2 text-left">
                      <SortHeader
                        label="Status"
                        column="is_active"
                        currentSort={currentSort}
                        currentDir={currentDir}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-3 py-2 text-left">
                      <SortHeader
                        label="Created"
                        column="created_at"
                        currentSort={currentSort}
                        currentDir={currentDir}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={isPending ? "opacity-50" : undefined}>
                  {packages.map((pkg) => (
                    <tr
                      key={pkg.id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-3 py-2 font-medium">{pkg.name}</td>
                      <td className="px-3 py-2">{fmtPrice(pkg.price)}</td>
                      <td className="px-3 py-2">
                        <Badge
                          variant="outline"
                          className={
                            pkg.is_active
                              ? "bg-green-500/10 text-green-500"
                              : "bg-red-500/10 text-red-500"
                          }
                        >
                          {pkg.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {fmtDate(pkg.created_at)}
                      </td>
                      <td className="px-3 py-2 text-right">
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
                              onClick={() => setSheetPkg(pkg)}
                            >
                              <Eye className="mr-2 size-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/packages/${pkg.id}/edit`}>
                                <Pencil className="mr-2 size-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="border-t pt-4 mt-4">
              <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                isPending={isPending}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Detail Sheet ────────────────────────────────────────────────── */}
      <Sheet open={!!sheetPkg} onOpenChange={(open) => !open && setSheetPkg(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {sheetPkg && (
            <>
              <SheetHeader>
                <SheetTitle>{sheetPkg.name}</SheetTitle>
                <SheetDescription>Package details</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4 text-sm">
                {/* Price */}
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-muted-foreground">Price</span>
                  <span className="font-semibold">{fmtPrice(sheetPkg.price)}</span>
                </div>

                {/* Status */}
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-muted-foreground">Status</span>
                  <Badge
                    variant="outline"
                    className={
                      sheetPkg.is_active
                        ? "bg-green-500/10 text-green-500"
                        : "bg-red-500/10 text-red-500"
                    }
                  >
                    {sheetPkg.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {/* Created */}
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-muted-foreground">Created</span>
                  <span>{fmtDate(sheetPkg.created_at)}</span>
                </div>

                {/* Description */}
                {sheetPkg.description && (
                  <div className="space-y-1 border-b pb-2">
                    <span className="font-medium text-muted-foreground">Description</span>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {sheetPkg.description}
                    </p>
                  </div>
                )}

                {/* Features */}
                {sheetPkg.features && sheetPkg.features.length > 0 && (
                  <div className="space-y-1">
                    <span className="font-medium text-muted-foreground">Features</span>
                    <ul className="ml-4 mt-1 list-disc space-y-0.5 text-muted-foreground">
                      {sheetPkg.features.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Edit link */}
                <div className="pt-4">
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link href={`/admin/packages/${sheetPkg.id}/edit`}>
                      <Pencil className="mr-1.5 size-4" />
                      Edit Package
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
