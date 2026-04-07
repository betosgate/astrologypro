import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";

export const metadata = { title: "Orders — Admin" };

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-green-500/10 text-green-700 dark:text-green-400",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  refunded: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
  failed: "bg-red-500/10 text-red-700 dark:text-red-400",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtAmount(amountCents: number | null, currency?: string | null) {
  if (amountCents == null) return "—";
  return `$${(amountCents / 100).toFixed(2)}`;
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {status}
    </span>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrdersSearchParams {
  status?: string;
  q?: string;
  page?: string;
}

// ─── Data fetch ──────────────────────────────────────────────────────────────

async function getOrders(params: OrdersSearchParams) {
  const admin = createAdminClient();
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Build query with count
  let query = admin
    .from("orders")
    .select(
      "id, client_id, diviner_id, service_type, product_title, amount, amount_cents, currency, status, stripe_payment_intent_id, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (params.status) query = query.eq("status", params.status);
  if (params.q) {
    query = query.or(
      `product_title.ilike.%${params.q}%,stripe_payment_intent_id.ilike.%${params.q}%,id.ilike.%${params.q}%`
    );
  }

  const { data, count, error } = await query;
  if (error) return { orders: [], total: 0 };

  const orders = (data ?? []) as Array<Record<string, unknown>>;

  // Fetch client and diviner names in bulk
  const clientIds = [...new Set(orders.map((o) => o.client_id as string).filter(Boolean))];
  const divinerIds = [...new Set(orders.map((o) => o.diviner_id as string).filter(Boolean))];

  const [clientsRes, divinersRes] = await Promise.all([
    clientIds.length > 0
      ? admin.from("clients").select("id, full_name, email").in("id", clientIds)
      : Promise.resolve({ data: [] }),
    divinerIds.length > 0
      ? admin.from("diviners").select("id, display_name, username").in("id", divinerIds)
      : Promise.resolve({ data: [] }),
  ]);

  const clientMap = Object.fromEntries(
    ((clientsRes.data ?? []) as Array<Record<string, unknown>>).map((c) => [
      c.id,
      { name: (c.full_name as string) || (c.email as string) || "—" },
    ])
  );

  const divinerMap = Object.fromEntries(
    ((divinersRes.data ?? []) as Array<Record<string, unknown>>).map((d) => [
      d.id,
      { name: (d.display_name as string) || `@${d.username}` || "—" },
    ])
  );

  return {
    orders: orders.map((o) => ({
      id: o.id as string,
      clientName: clientMap[o.client_id as string]?.name ?? "—",
      divinerName: divinerMap[o.diviner_id as string]?.name ?? "—",
      service: (o.product_title as string) || (o.service_type as string) || "—",
      amountCents:
        (o.amount_cents as number) != null && (o.amount_cents as number) > 0
          ? (o.amount_cents as number)
          : o.amount != null
            ? Math.round(Number(o.amount) * 100)
            : null,
      currency: (o.currency as string) ?? "usd",
      status: o.status as string,
      createdAt: o.created_at as string,
    })),
    total: count ?? 0,
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<OrdersSearchParams>;
}) {
  const params = await searchParams;
  const { orders, total } = await getOrders(params);

  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const statusFilter = params.status ?? "";
  const searchQ = params.q ?? "";

  const STATUS_OPTIONS = ["", "paid", "completed", "pending", "refunded", "cancelled", "failed"];

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams();
    if (overrides.status !== undefined) {
      if (overrides.status) p.set("status", overrides.status);
    } else if (statusFilter) {
      p.set("status", statusFilter);
    }
    if (overrides.q !== undefined) {
      if (overrides.q) p.set("q", overrides.q);
    } else if (searchQ) {
      p.set("q", searchQ);
    }
    if (overrides.page !== undefined) {
      if (overrides.page !== "1") p.set("page", overrides.page);
    } else if (params.page && params.page !== "1") {
      p.set("page", params.page);
    }
    const qs = p.toString();
    return `/admin/orders${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">
          {total} order{total !== 1 ? "s" : ""} total
        </p>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        <form action="/admin/orders" method="get" className="contents">
          <input
            type="text"
            name="q"
            defaultValue={searchQ}
            placeholder="Search order ID, title, or Stripe PI..."
            className="flex h-9 w-64 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>

        <div className="flex gap-1">
          {STATUS_OPTIONS.map((s) => (
            <Link
              key={s || "all"}
              href={buildUrl({ status: s, page: "1" })}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {s || "All"}
            </Link>
          ))}
        </div>

        {(statusFilter || searchQ) && (
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm">
              Clear
            </Button>
          </Link>
        )}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingBag className="size-4" />
            Orders
            <Badge variant="secondary" className="ml-1">{total}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <ShoppingBag className="size-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">No orders found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Diviner</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="hover:underline"
                        >
                          {order.id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">{order.clientName}</TableCell>
                      <TableCell className="text-sm">{order.divinerName}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {order.service}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {fmtAmount(order.amountCents, order.currency)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {fmtDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="size-8" asChild>
                          <Link href={`/admin/orders/${order.id}`}>
                            <Eye className="size-3.5" />
                            <span className="sr-only">View</span>
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* ── Pagination ──────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                {currentPage > 1 ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={buildUrl({ page: String(currentPage - 1) })}>
                      <ChevronLeft className="mr-1 size-4" />
                      Prev
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    <ChevronLeft className="mr-1 size-4" />
                    Prev
                  </Button>
                )}
                {currentPage < totalPages ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={buildUrl({ page: String(currentPage + 1) })}>
                      Next
                      <ChevronRight className="ml-1 size-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Next
                    <ChevronRight className="ml-1 size-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
