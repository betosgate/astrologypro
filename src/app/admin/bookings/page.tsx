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
import {
  CalendarDays,
  Users,
  CheckCircle2,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const metadata = { title: "Bookings — Admin" };
export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingsSearchParams {
  status?: string;
  diviner_id?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: string;
}

type BookingRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  base_price: number | null;
  total_amount: number | null;
  status: string;
  stripe_payment_status: string | null;
  cancellation_reason: string | null;
  diviners: { id: string; display_name: string; username: string } | null;
  clients: { id: string; full_name: string | null; email: string } | null;
  services: { id: string; name: string } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtCurrency(amount: number | null) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

const STATUS_COLORS: Record<string, string> = {
  confirmed:   "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  pending:     "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  completed:   "bg-green-500/10 text-green-700 dark:text-green-400",
  canceled:    "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  no_show:     "bg-red-500/10 text-red-700 dark:text-red-400",
  in_progress: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status.replace("_", " ")}
    </span>
  );
}

// ─── Data fetch ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

async function getBookings(params: BookingsSearchParams) {
  const admin = createAdminClient();
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("bookings")
    .select(
      `id, scheduled_at, duration_minutes, base_price, total_amount, status,
       stripe_payment_status, cancellation_reason,
       diviners!inner(id, display_name, username),
       clients!inner(id, full_name, email),
       services!inner(id, name)`,
      { count: "exact" }
    )
    .order("scheduled_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params.diviner_id) {
    query = query.eq("diviner_id", params.diviner_id);
  }
  if (params.from) {
    query = query.gte("scheduled_at", new Date(params.from).toISOString());
  }
  if (params.to) {
    const toDate = new Date(params.to);
    toDate.setHours(23, 59, 59, 999);
    query = query.lte("scheduled_at", toDate.toISOString());
  }
  if (params.search) {
    // Filter on client email/name via ilike — acceptable for admin at this scale
    query = query.or(
      `clients.full_name.ilike.%${params.search}%,clients.email.ilike.%${params.search}%`
    );
  }

  const { data, count, error } = await query;
  if (error) {
    console.error("[admin/bookings page]", error);
  }
  return { bookings: (data ?? []) as BookingRow[], total: count ?? 0, page };
}

async function getDivinerOptions() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("diviners")
    .select("id, display_name")
    .order("display_name");
  return (data ?? []) as Array<{ id: string; display_name: string }>;
}

async function getMonthlyStats() {
  const admin = createAdminClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

  const { data } = await admin
    .from("bookings")
    .select("status, total_amount")
    .gte("scheduled_at", monthStart)
    .lte("scheduled_at", monthEnd);

  const rows = data ?? [];
  return {
    total: rows.length,
    confirmed: rows.filter((b) => b.status === "confirmed").length,
    completed: rows.filter((b) => b.status === "completed").length,
    revenue: rows
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0),
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<BookingsSearchParams>;
}) {
  const params = await searchParams;
  const [{ bookings, total, page }, divinerOptions, stats] = await Promise.all([
    getBookings(params),
    getDivinerOptions(),
    getMonthlyStats(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Build pagination URL helper
  function pageUrl(p: number) {
    const sp = new URLSearchParams({
      ...(params.status ? { status: params.status } : {}),
      ...(params.diviner_id ? { diviner_id: params.diviner_id } : {}),
      ...(params.from ? { from: params.from } : {}),
      ...(params.to ? { to: params.to } : {}),
      ...(params.search ? { search: params.search } : {}),
      page: String(p),
    });
    return `/admin/bookings?${sp.toString()}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-sm text-muted-foreground">All bookings across all diviners</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total This Month</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue (Month)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmtCurrency(stats.revenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <form method="GET" action="/admin/bookings" className="flex flex-wrap gap-3 items-end">
            {/* Search */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Client name / email</label>
              <input
                name="search"
                defaultValue={params.search ?? ""}
                placeholder="Search client..."
                className="h-9 w-48 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {/* Status */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Status</label>
              <select
                name="status"
                defaultValue={params.status ?? "all"}
                className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="canceled">Canceled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>
            {/* Diviner */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Diviner</label>
              <select
                name="diviner_id"
                defaultValue={params.diviner_id ?? ""}
                className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All diviners</option>
                {divinerOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.display_name}
                  </option>
                ))}
              </select>
            </div>
            {/* From */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">From</label>
              <input
                type="date"
                name="from"
                defaultValue={params.from ?? ""}
                className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {/* To */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">To</label>
              <input
                type="date"
                name="to"
                defaultValue={params.to ?? ""}
                className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button type="submit" size="sm">Filter</Button>
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link href="/admin/bookings">Clear</Link>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date / Time</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Diviner</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                      No bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((b) => {
                    const client = b.clients;
                    const diviner = b.diviners;
                    const service = b.services;
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {fmtDate(b.scheduled_at)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{client?.full_name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{client?.email ?? "—"}</div>
                        </TableCell>
                        <TableCell className="text-sm">{diviner?.display_name ?? "—"}</TableCell>
                        <TableCell className="text-sm">{service?.name ?? "—"}</TableCell>
                        <TableCell className="text-right text-sm">{b.duration_minutes}m</TableCell>
                        <TableCell className="text-right text-sm">
                          {fmtCurrency(b.total_amount ?? b.base_price)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={b.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/bookings/${b.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild disabled={page <= 1}>
              <Link href={pageUrl(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Link>
            </Button>
            <span className="px-2">
              Page {page} of {totalPages}
            </span>
            <Button variant="outline" size="sm" asChild disabled={page >= totalPages}>
              <Link href={pageUrl(page + 1)}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
