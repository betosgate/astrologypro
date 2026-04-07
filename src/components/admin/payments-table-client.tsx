"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, MoreHorizontal, ExternalLink, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SortHeader,
  AdminPagination,
  AdminResetButton,
  useAdminTableParams,
} from "./admin-table-parts";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentRow = {
  id: string;
  client_name: string | null;
  client_email: string | null;
  service_name: string | null;
  scheduled_at: string | null;
  amount_charged: number;
  stripe_payment_id: string | null;
  status: string | null;
  created_at: string;
  diviner_id: string | null;
};

interface PaymentsTableClientProps {
  payments: PaymentRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortBy: string;
  sortDir: string;
  paymentFrom: string;
  paymentTo: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAmount(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function stripePaymentUrl(paymentId: string) {
  return `https://dashboard.stripe.com/payments/${paymentId}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PaymentsTableClient({
  payments,
  total,
  page,
  pageSize,
  totalPages,
  sortBy,
  sortDir,
  paymentFrom,
  paymentTo,
}: PaymentsTableClientProps) {
  const {
    pushParams,
    currentSort,
    currentDir,
    isPending,
  } = useAdminTableParams({ sort: sortBy, dir: sortDir });

  const hasActiveFilters = !!(paymentFrom || paymentTo);

  function handleSort(col: string) {
    const newDir = currentSort === col && currentDir === "desc" ? "asc" : "desc";
    pushParams({ sortBy: col, sortDir: newDir });
  }

  function handlePageChange(p: number) {
    pushParams({ page: String(p) });
  }

  function handlePageSizeChange(size: string) {
    pushParams({ pageSize: size, page: "1" });
  }

  function handleReset() {
    pushParams({
      paymentFrom: "",
      paymentTo: "",
      page: "1",
      sortBy: "",
      sortDir: "",
    });
  }

  async function handleCopyStripeId(id: string) {
    try {
      await navigator.clipboard.writeText(id);
    } catch {
      // Fallback: silently fail if clipboard not available
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <p className="text-sm text-muted-foreground">
          All completed booking payments.{" "}
          {total > 0 ? `${total} total.` : ""}
        </p>
      </div>

      {/* Date range filters */}
      <Card>
        <CardContent className="pt-4">
          <form
            method="GET"
            action="/admin/payments"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end"
          >
            {/* Preserve current sort in hidden inputs */}
            {sortBy && sortBy !== "created_at" && (
              <input type="hidden" name="sortBy" value={sortBy} />
            )}
            {sortDir && sortDir !== "desc" && (
              <input type="hidden" name="sortDir" value={sortDir} />
            )}

            <div className="space-y-1">
              <Label htmlFor="paymentFrom" className="text-xs">
                Payment from
              </Label>
              <Input
                id="paymentFrom"
                type="date"
                name="paymentFrom"
                defaultValue={paymentFrom}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="paymentTo" className="text-xs">
                Payment to
              </Label>
              <Input
                id="paymentTo"
                type="date"
                name="paymentTo"
                defaultValue={paymentTo}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button type="submit" size="sm">
                Search
              </Button>
              <AdminResetButton
                hasActiveFilters={hasActiveFilters}
                onReset={handleReset}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table or empty state */}
      {payments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No payment records found.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Page {page} — {payments.length} of {total} payments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-xs">
                      <th className="px-4 py-2 text-left">
                        <SortHeader
                          label="Date"
                          column="created_at"
                          currentSort={currentSort}
                          currentDir={currentDir}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="px-4 py-2 text-left">
                        <SortHeader
                          label="Client"
                          column="client_name"
                          currentSort={currentSort}
                          currentDir={currentDir}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="px-4 py-2 text-left">
                        <SortHeader
                          label="Service"
                          column="service_name"
                          currentSort={currentSort}
                          currentDir={currentDir}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="px-4 py-2 text-left">
                        <SortHeader
                          label="Amount"
                          column="amount_charged"
                          currentSort={currentSort}
                          currentDir={currentDir}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="px-4 py-2 text-left">
                        <SortHeader
                          label="Status"
                          column="status"
                          currentSort={currentSort}
                          currentDir={currentDir}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b last:border-0 hover:bg-muted/20"
                      >
                        <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                          {fmtDate(p.created_at)}
                        </td>
                        <td className="px-4 py-2">
                          <div className="font-medium">
                            {p.client_name ?? "\u2014"}
                          </div>
                          {p.client_email && (
                            <div className="text-xs text-muted-foreground">
                              {p.client_email}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {p.service_name ?? "\u2014"}
                        </td>
                        <td className="px-4 py-2 font-medium tabular-nums">
                          {fmtAmount(p.amount_charged)}
                        </td>
                        <td className="px-4 py-2">
                          <Badge
                            variant={
                              p.status === "confirmed" ||
                              p.status === "completed"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs capitalize"
                          >
                            {p.status ?? "\u2014"}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label="Payment actions"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {p.stripe_payment_id && (
                                <DropdownMenuItem asChild>
                                  <a
                                    href={stripePaymentUrl(p.stripe_payment_id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2"
                                  >
                                    <ExternalLink className="size-3.5" />
                                    View in Stripe
                                  </a>
                                </DropdownMenuItem>
                              )}
                              {p.stripe_payment_id && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleCopyStripeId(p.stripe_payment_id!)
                                  }
                                  className="flex items-center gap-2"
                                >
                                  <Copy className="size-3.5" />
                                  Copy Stripe ID
                                </DropdownMenuItem>
                              )}
                              {!p.stripe_payment_id && (
                                <DropdownMenuItem disabled>
                                  No Stripe ID
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            isPending={isPending}
          />
        </>
      )}
    </div>
  );
}
