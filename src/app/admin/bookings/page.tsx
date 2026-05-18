import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookingsFilterForm } from "@/components/admin/bookings-filter-form";
import { BookingDetailSheet } from "@/components/dashboard/booking-detail-sheet";
import { getSessionLinkForBooking } from "@/lib/service-toolkit-mapping";
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
  Sparkles,
} from "lucide-react";

export const metadata = { title: "Bookings — Admin" };
export const dynamic = "force-dynamic";

interface BookingsSearchParams {
  view?: string;
  status?: string;
  diviner_id?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: string;
}

type BookingRow = {
  id: string;
  diviner_id: string | null;
  client_id: string | null;
  service_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  base_price: number | null;
  total_amount: number | null;
  status: string;
  stripe_payment_intent_id?: string | null;
  stripe_payment_status?: string | null;
  session_notes?: string | null;
  client_session_notes?: string | null;
  booking_notes?: string | null;
  metadata?: Record<string, unknown> | null;
  questionnaire_responses?: Record<string, string | undefined> | null;
  refund_amount?: number | null;
  refunded_at?: string | null;
  refund_reason?: string | null;
  cancellation_reason?: string | null;
};

type HydratedBookingRow = BookingRow & {
  diviners: { id: string; display_name: string; username: string } | null;
  clients: {
    id: string;
    full_name: string | null;
    email: string;
    birth_date?: string | null;
    birth_time?: string | null;
    birth_city?: string | null;
  } | null;
  services: { id: string; name: string; template_id?: string | null } | null;
};

type AdminCalendarBookingRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  timezone: string | null;
  status: string;
  client_name: string;
  client_email: string;
  client_note: string | null;
  google_calendar_event_id: string | null;
  created_at: string;
};

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
  confirmed: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
  canceled: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  no_show: "bg-red-500/10 text-red-700 dark:text-red-400",
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

const PAGE_SIZE = 25;

const SAFE_SELECT =
  "id, diviner_id, client_id, service_id, scheduled_at, status, duration_minutes, base_price, total_amount, stripe_payment_status, cancellation_reason";

const FULL_SELECT =
  "id, diviner_id, client_id, service_id, scheduled_at, duration_minutes, base_price, total_amount, status, stripe_payment_intent_id, stripe_payment_status, session_notes, client_session_notes, booking_notes, metadata, questionnaire_responses, refund_amount, refunded_at, refund_reason, cancellation_reason";

async function getBookings(params: BookingsSearchParams) {
  const admin = createAdminClient();
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  let matchingClientIds: string[] | null = null;
  if (params.search?.trim()) {
    const { data: clients } = await admin
      .from("clients")
      .select("id")
      .or(`full_name.ilike.%${params.search.trim()}%,email.ilike.%${params.search.trim()}%`)
      .limit(200);

    matchingClientIds = (clients ?? [])
      .map((client) => (typeof client.id === "string" ? client.id : null))
      .filter((value): value is string => Boolean(value));

    if (matchingClientIds.length === 0) {
      return { bookings: [] as BookingRow[], total: 0, page };
    }
  }

  async function runQuery(selectClause: string) {
    let query: any = admin
      .from("bookings")
      .select(selectClause, { count: "exact" })
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
    if (matchingClientIds) {
      query = query.in("client_id", matchingClientIds);
    }

    return query;
  }

  const fullResult = await runQuery(FULL_SELECT);
  if (fullResult.error) {
    console.warn("[admin/bookings page] full select failed, falling back:", fullResult.error.message);
    const safeResult = await runQuery(SAFE_SELECT);
    if (safeResult.error) {
      console.error("[admin/bookings page]", safeResult.error);
      return { bookings: [] as BookingRow[], total: 0, page };
    }
    return {
      bookings: (safeResult.data ?? []) as BookingRow[],
      total: safeResult.count ?? 0,
      page,
    };
  }

  return {
    bookings: (fullResult.data ?? []) as BookingRow[],
    total: fullResult.count ?? 0,
    page,
  };
}

async function getAdminCalendarBookings(
  params: BookingsSearchParams,
  adminUserId: string | null,
) {
  const admin = createAdminClient();
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  if (!adminUserId) {
    return { bookings: [] as AdminCalendarBookingRow[], total: 0, page };
  }

  let query: any = admin
    .from("admin_bookings")
    .select(
      "id, scheduled_at, duration_minutes, timezone, status, client_name, client_email, client_note, google_calendar_event_id, created_at",
      { count: "exact" }
    )
    .eq("admin_user_id", adminUserId)
    .order("scheduled_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params.from) {
    query = query.gte("scheduled_at", new Date(params.from).toISOString());
  }
  if (params.to) {
    const toDate = new Date(params.to);
    toDate.setHours(23, 59, 59, 999);
    query = query.lte("scheduled_at", toDate.toISOString());
  }
  if (params.search?.trim()) {
    const search = params.search.trim();
    query = query.or(`client_name.ilike.%${search}%,client_email.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("[admin/bookings page] admin_bookings query failed:", error);
    return { bookings: [] as AdminCalendarBookingRow[], total: 0, page };
  }

  return {
    bookings: (data ?? []) as AdminCalendarBookingRow[],
    total: count ?? 0,
    page,
  };
}

async function getDivinerOptions() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("diviners")
    .select("id, display_name")
    .order("display_name");
  return (data ?? []) as Array<{ id: string; display_name: string }>;
}

async function getMonthlyStats(
  adminUserId: string | null,
  isMyView: boolean,
) {
  const admin = createAdminClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

  if (isMyView) {
    const { data } = adminUserId
      ? await admin
          .from("admin_bookings")
          .select("status")
          .eq("admin_user_id", adminUserId)
          .gte("scheduled_at", monthStart)
          .lte("scheduled_at", monthEnd)
      : { data: [] as Array<{ status: string }> };

    const rows = data ?? [];
    return {
      total: rows.length,
      confirmed: rows.filter((b) => b.status === "confirmed").length,
      completed: 0,
      revenue: 0,
    };
  }

  let query: any = admin
    .from("bookings")
    .select("status, total_amount")
    .gte("scheduled_at", monthStart)
    .lte("scheduled_at", monthEnd);

  const { data } = await query;

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

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<BookingsSearchParams>;
}) {
  const params = await searchParams;
  const view = params.view === "my" ? "my" : "all";
  const adminUser = await requireAdmin();
  const admin = createAdminClient();

  const { data: currentDiviner } = adminUser
    ? await admin
        .from("diviners")
        .select("id")
        .eq("user_id", adminUser.id)
        .maybeSingle()
    : { data: null };

  const currentDivinerId = (currentDiviner?.id as string | undefined) ?? null;
  const adminCalendarResultPromise =
    view === "my"
      ? getAdminCalendarBookings({ ...params, view }, adminUser?.id ?? null)
      : Promise.resolve(null);
  const legacyBookingsResultPromise =
    view === "all"
      ? getBookings({ ...params, view })
      : Promise.resolve(null);

  const [adminCalendarResult, legacyBookingsResult, divinerOptions, stats] =
    await Promise.all([
      adminCalendarResultPromise,
      legacyBookingsResultPromise,
      getDivinerOptions(),
      getMonthlyStats(adminUser?.id ?? null, view === "my"),
    ]);

  const adminCalendarBookings = adminCalendarResult?.bookings ?? [];
  const bookings = legacyBookingsResult?.bookings ?? [];
  const total = adminCalendarResult?.total ?? legacyBookingsResult?.total ?? 0;
  const page = adminCalendarResult?.page ?? legacyBookingsResult?.page ?? 1;

  const bookingIds = bookings.map((booking) => booking.id);
  const divinerIds = [...new Set(bookings.map((booking) => booking.diviner_id).filter(Boolean))] as string[];
  const clientIds = [...new Set(bookings.map((booking) => booking.client_id).filter(Boolean))] as string[];
  const serviceIds = [...new Set(bookings.map((booking) => booking.service_id).filter(Boolean))] as string[];

  const [clientsResult, divinersResult, servicesResult] = await Promise.all([
    clientIds.length > 0
      ? createAdminClient()
          .from("clients")
          .select("id, full_name, email, birth_date, birth_time, birth_city")
          .in("id", clientIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    divinerIds.length > 0
      ? createAdminClient()
          .from("diviners")
          .select("id, display_name, username")
          .in("id", divinerIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    serviceIds.length > 0
      ? createAdminClient()
          .from("services")
          .select("id, name, template_id")
          .in("id", serviceIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
  ]);

  const clientMap: Record<string, HydratedBookingRow["clients"]> = {};
  for (const client of clientsResult.data ?? []) {
    clientMap[client.id as string] = {
      id: client.id as string,
      full_name: (client.full_name as string | null) ?? null,
      email: (client.email as string) ?? "",
      birth_date: (client.birth_date as string | null | undefined) ?? null,
      birth_time: (client.birth_time as string | null | undefined) ?? null,
      birth_city: (client.birth_city as string | null | undefined) ?? null,
    };
  }

  const divinerMap: Record<string, HydratedBookingRow["diviners"]> = {};
  for (const diviner of divinersResult.data ?? []) {
    divinerMap[diviner.id as string] = {
      id: diviner.id as string,
      display_name: (diviner.display_name as string) ?? "",
      username: (diviner.username as string) ?? "",
    };
  }

  const serviceMap: Record<string, HydratedBookingRow["services"]> = {};
  for (const service of servicesResult.data ?? []) {
    serviceMap[service.id as string] = {
      id: service.id as string,
      name: (service.name as string) ?? "",
      template_id: (service.template_id as string | null | undefined) ?? null,
    };
  }

  const hydratedBookings: HydratedBookingRow[] = bookings.map((booking) => ({
    ...booking,
    clients: booking.client_id ? clientMap[booking.client_id] ?? null : null,
    diviners: booking.diviner_id ? divinerMap[booking.diviner_id] ?? null : null,
    services: booking.service_id ? serviceMap[booking.service_id] ?? null : null,
  }));

  const ordersByBookingId: Record<string, { id: string; amount: number; currency: string; status: string }> = {};
  if (bookingIds.length > 0) {
    const admin = createAdminClient();
    const { data: linkedOrders } = await admin
      .from("orders")
      .select("id, booking_id, amount, currency, status")
      .in("booking_id", bookingIds);

    for (const order of linkedOrders ?? []) {
      if (typeof order.booking_id === "string") {
        ordersByBookingId[order.booking_id] = {
          id: order.id as string,
          amount: Number(order.amount ?? 0),
          currency: (order.currency as string) ?? "usd",
          status: (order.status as string) ?? "unknown",
        };
      }
    }
  }

  const previousSessionsByClientId: Record<
    string,
    { count: number; lastDate: string | null; lastNotes: string | null }
  > = {};
  if (clientIds.length > 0) {
    const admin = createAdminClient();
    const { data: previousSessions } = await admin
      .from("bookings")
      .select("id, client_id, scheduled_at, session_notes")
      .eq("status", "completed")
      .in("client_id", clientIds)
      .order("scheduled_at", { ascending: false });

    for (const session of previousSessions ?? []) {
      if (typeof session.client_id !== "string") continue;
      const existing = previousSessionsByClientId[session.client_id];
      if (!existing) {
        previousSessionsByClientId[session.client_id] = {
          count: 1,
          lastDate: (session.scheduled_at as string) ?? null,
          lastNotes: (session.session_notes as string) ?? null,
        };
        continue;
      }
      existing.count += 1;
    }
  }

  const templateIds = [
    ...new Set(
      hydratedBookings
        .map((booking) => booking.services?.template_id ?? null)
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    ),
  ];

  const templateMap: Record<string, { slug: string; category: string }> = {};
  if (templateIds.length > 0) {
    const admin = createAdminClient();
    const { data: templates } = await admin
      .from("service_templates")
      .select("id, slug, category")
      .in("id", templateIds);

    for (const template of templates ?? []) {
      templateMap[template.id as string] = {
        slug: template.slug as string,
        category: template.category as string,
      };
    }
  }

  const sessionLinksByBookingId: Record<string, string | null> = {};
  for (const booking of hydratedBookings) {
    const templateId = booking.services?.template_id ?? null;
    const template = templateId ? templateMap[templateId] : null;
    sessionLinksByBookingId[booking.id] = getSessionLinkForBooking({
      bookingId: booking.id,
      templateSlug: template?.slug ?? null,
      category: template?.category ?? null,
    });
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function pageUrl(p: number) {
    const sp = new URLSearchParams({
      ...(view ? { view } : {}),
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            {view === "my"
              ? "Your bookings only"
              : "All bookings across all diviners"}
          </p>
        </div>
        <div className="inline-flex rounded-lg border bg-background p-1">
          <Button
            asChild
            size="sm"
            variant={view === "my" ? "default" : "ghost"}
          >
            <Link href="/admin/bookings?view=my">My Bookings</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant={view === "all" ? "default" : "ghost"}
          >
            <Link href="/admin/bookings?view=all">All Bookings</Link>
          </Button>
        </div>
      </div>

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

      <Card>
        <CardContent className="pt-4">
          <BookingsFilterForm
            key={`${view}-${params.status ?? "all"}-${params.diviner_id ?? "all"}-${params.search ?? ""}-${params.from ?? ""}-${params.to ?? ""}`}
            view={view}
            status={params.status}
            divinerId={params.diviner_id}
            search={params.search}
            from={params.from}
            to={params.to}
            divinerOptions={divinerOptions}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date / Time</TableHead>
                  <TableHead>Client</TableHead>
                  {view === "all" && <TableHead>Diviner</TableHead>}
                  <TableHead>Service</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {view === "my" ? (
                  adminCalendarBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                        No bookings found
                      </TableCell>
                    </TableRow>
                  ) : (
                    adminCalendarBookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="whitespace-nowrap text-sm">{fmtDate(b.scheduled_at)}</TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{b.client_name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{b.client_email || "—"}</div>
                        </TableCell>
                        <TableCell className="text-sm">Admin Calendar</TableCell>
                        <TableCell className="text-sm">{b.duration_minutes}m</TableCell>
                        <TableCell className="text-sm">—</TableCell>
                        <TableCell>
                          <StatusBadge status={b.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <BookingDetailSheet
                              detailsOnly
                              actionBasePath={`/api/admin/my-bookings/${b.id}`}
                              joinHref={`/api/admin/my-bookings/${b.id}/join`}
                              viewerRole="admin"
                              booking={{
                                id: b.id,
                                scheduled_at: b.scheduled_at,
                                status: b.status,
                                duration: b.duration_minutes,
                                amount: 0,
                                payment_intent_id: null,
                                notes: b.client_note ?? null,
                                booking_notes: null,
                                session_notes: null,
                                client_session_notes: null,
                                client_name: b.client_name || "Unknown",
                                client_email: b.client_email || "",
                                client_id: null,
                                service_name: "Admin Calendar",
                                refund_amount: null,
                                refunded_at: null,
                                refund_reason: null,
                                birth_date: null,
                                birth_time: null,
                                birth_city: null,
                                questionnaire_responses: null,
                                previous_session_count: 0,
                                last_session_date: null,
                                username: "admin",
                                metadata: {
                                  source_table: "admin_bookings",
                                  timezone: b.timezone,
                                  google_calendar_event_id: b.google_calendar_event_id,
                                  created_at: b.created_at,
                                },
                                stripe_payment_intent_id: null,
                                base_price: null,
                              }}
                              linkedOrder={null}
                              sessionLink={null}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )
                ) : hydratedBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                      No bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  hydratedBookings.map((b) => {
                    const client = b.clients;
                    const diviner = b.diviners;
                    const service = b.services;

                    return (
                      <TableRow key={b.id}>
                        <TableCell className="whitespace-nowrap text-sm">{fmtDate(b.scheduled_at)}</TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{client?.full_name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{client?.email ?? "—"}</div>
                        </TableCell>
                        <TableCell className="text-sm">{diviner?.display_name ?? "—"}</TableCell>
                        <TableCell className="text-sm">{service?.name ?? "—"}</TableCell>
                        <TableCell className="text-sm">{b.duration_minutes}m</TableCell>
                        <TableCell className="text-sm">{fmtCurrency(b.total_amount ?? b.base_price)}</TableCell>
                        <TableCell>
                          <StatusBadge status={b.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <BookingDetailSheet
                              booking={{
                                id: b.id,
                                scheduled_at: b.scheduled_at,
                                status: b.status,
                                duration: b.duration_minutes,
                                amount: b.base_price ?? 0,
                                payment_intent_id: b.stripe_payment_intent_id ?? null,
                                notes: b.session_notes ?? null,
                                session_notes: b.session_notes ?? null,
                                client_session_notes: b.client_session_notes ?? null,
                                booking_notes: b.booking_notes ?? null,
                                client_name: client?.full_name ?? "Unknown",
                                client_email: client?.email ?? "",
                                client_id: b.client_id,
                                service_name: service?.name ?? "Unknown",
                                refund_amount: b.refund_amount ?? null,
                                refunded_at: b.refunded_at ?? null,
                                refund_reason: b.refund_reason ?? null,
                                birth_date: client?.birth_date ?? null,
                                birth_time: client?.birth_time ?? null,
                                birth_city: client?.birth_city ?? null,
                                questionnaire_responses: b.questionnaire_responses ?? null,
                                previous_session_count: b.client_id ? previousSessionsByClientId[b.client_id]?.count ?? 0 : 0,
                                last_session_date: b.client_id ? previousSessionsByClientId[b.client_id]?.lastDate ?? null : null,
                                username: diviner?.username ?? "admin",
                                metadata: b.metadata ?? null,
                                stripe_payment_intent_id: b.stripe_payment_intent_id ?? null,
                                base_price: b.base_price ?? null,
                              }}
                              linkedOrder={ordersByBookingId[b.id] ?? null}
                              sessionLink={sessionLinksByBookingId[b.id] ?? null}
                            />
                            {sessionLinksByBookingId[b.id] ? (
                              <Button variant="outline" size="sm" asChild>
                                <Link
                                  href={sessionLinksByBookingId[b.id]!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                  Open Service
                                </Link>
                              </Button>
                            ) : null}
                          </div>
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
