import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TicketsFilter } from "@/components/admin/tickets-filter";
import { TicketsBulkTable } from "@/components/admin/tickets-bulk-actions";
import { TicketsPageActions } from "@/components/admin/tickets-page-actions";
import { TicketsPagination } from "@/components/admin/tickets-pagination";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tickets | Admin" };

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupportTicket {
  id: string;
  ticket_number: string;
  type: string;
  category: string;
  subject: string;
  status: string;
  priority: string;
  requester_name: string | null;
  requester_email: string | null;
  requester_role: string | null;
  assigned_to: string | null;
  assigned_team: string | null;
  queue_id: string | null;
  sla_due_at: string | null;
  sla_breached: boolean;
  created_at: string;
  updated_at: string;
}

interface TicketQueue {
  id: string;
  name: string;
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { key: "all", label: "All" },
  { key: "unassigned", label: "Unassigned" },
  { key: "sla_at_risk", label: "SLA At-Risk" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function utcDateStart(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(Date.UTC(year, month - 1, day)).toISOString();
}

function utcNextDateStart(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    type?: string;
    priority?: string;
    queue?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
    tab?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const user = await requireAdmin();
  if (!user) redirect("/login");

  const {
    status,
    type,
    priority,
    queue,
    search,
    date_from,
    date_to,
    tab: tabParam,
    page: pageParam,
    pageSize: pageSizeParam,
  } = await searchParams;

  const activeTab: TabKey =
    tabParam === "unassigned" || tabParam === "sla_at_risk"
      ? tabParam
      : "all";

  const parsedPage = parseInt(pageParam ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const parsedPageSize = parseInt(pageSizeParam ?? "10", 10);
  const limit = [10, 25, 50, 100].includes(parsedPageSize) ? parsedPageSize : 10;

  const admin = createAdminClient();

  // Load stats for cards
  const [
    { count: openCountTotal },
    { count: inProgressCountTotal },
    { count: waitingCountTotal },
    { count: resolvedCountTotal }
  ] = await Promise.all([
    admin.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
    admin.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
    admin.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "waiting_internal"),
    admin.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "resolved"),
  ]);

  // Load queues for filter dropdown
  const { data: queuesData } = await admin
    .from("ticket_queues")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });
  const queues: TicketQueue[] = (queuesData as TicketQueue[]) ?? [];
  const queueMap = Object.fromEntries(queues.map((q) => [q.id, q.name]));

  function buildTicketsQuery(pageNumber: number) {
    const skip = (pageNumber - 1) * limit;
    let query = admin
      .from("support_tickets")
      .select(
        "id, ticket_number, type, category, subject, status, priority, requester_name, requester_email, requester_role, assigned_to, assigned_team, queue_id, sla_due_at, sla_breached, metadata, created_at, updated_at",
        { count: "exact" }
      )
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(skip, skip + limit - 1);

    // Tab filters
    if (activeTab === "unassigned") {
      query = query.is("assigned_to", null);
      query = query.not("status", "in", '("resolved","closed","cancelled")');
    } else if (activeTab === "sla_at_risk") {
      const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      query = query
        .not("status", "in", '("resolved","closed","cancelled")')
        .not("sla_due_at", "is", null)
        .lte("sla_due_at", twoHoursFromNow);
    }

    // User-chosen filters
    if (status && status !== "all") query = query.eq("status", status);
    if (type && type !== "all") query = query.eq("type", type);
    if (priority && priority !== "all") query = query.eq("priority", priority);
    if (queue && queue !== "all") query = query.eq("queue_id", queue);
    if (date_from) {
      const fromStart = utcDateStart(date_from);
      if (fromStart) query = query.gte("created_at", fromStart);
    }
    if (date_to) {
      const toExclusive = utcNextDateStart(date_to);
      if (toExclusive) query = query.lt("created_at", toExclusive);
    }

    if (search && search.trim()) {
      const q = search.trim();
      query = query.or(
        `subject.ilike.%${q}%,requester_name.ilike.%${q}%,requester_email.ilike.%${q}%,ticket_number.ilike.%${q}%`
      );
    }

    return query;
  }

  const { data, count } = await buildTicketsQuery(page);

  let tickets = (data as SupportTicket[]) ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1;

  if (currentPage !== page) {
    const { data: currentPageData } = await buildTicketsQuery(currentPage);
    tickets = (currentPageData as SupportTicket[]) ?? [];
  }

  function tabUrl(key: string) {
    const params = new URLSearchParams();
    if (key !== "all") params.set("tab", key);
    if (limit !== 10) params.set("pageSize", String(limit));
    if (status && status !== "all") params.set("status", status);
    if (type && type !== "all") params.set("type", type);
    if (priority && priority !== "all") params.set("priority", priority);
    if (queue && queue !== "all") params.set("queue", queue);
    if (search) params.set("search", search);
    if (date_from) params.set("date_from", date_from);
    if (date_to) params.set("date_to", date_to);
    const qs = params.toString();
    return qs ? `/admin/tickets?${qs}` : "/admin/tickets";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} ticket{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <TicketsPageActions />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-500/5 border-blue-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-600 font-medium text-xs uppercase tracking-wider">Open</CardDescription>
            <CardTitle className="text-2xl">{openCountTotal ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-purple-500/5 border-purple-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-purple-600 font-medium text-xs uppercase tracking-wider">In Progress</CardDescription>
            <CardTitle className="text-2xl">{inProgressCountTotal ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-yellow-500/5 border-yellow-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-yellow-600 font-medium text-xs uppercase tracking-wider">Waiting on Us</CardDescription>
            <CardTitle className="text-2xl">{waitingCountTotal ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-green-600 font-medium text-xs uppercase tracking-wider">Resolved</CardDescription>
            <CardTitle className="text-2xl">{resolvedCountTotal ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={tabUrl(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Filters */}
      <TicketsFilter
        currentStatus={status ?? ""}
        currentType={type ?? ""}
        currentPriority={priority ?? ""}
        currentQueue={queue ?? ""}
        currentSearch={search ?? ""}
        currentDateFrom={date_from ?? ""}
        currentDateTo={date_to ?? ""}
        queues={queues}
      />

      {/* Table with bulk actions */}
      <Card>
        <CardHeader className="pb-3 border-b bg-muted/10">
          <CardTitle className="text-lg">
            {activeTab === "all" && "All Tickets"}
            {activeTab === "unassigned" && "Unassigned Tickets"}
            {activeTab === "sla_at_risk" && "SLA At-Risk Tickets"}
          </CardTitle>
          <CardDescription>
            Showing {tickets.length} of {total} ticket{total !== 1 ? "s" : ""}.
            Select rows to apply bulk actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <TicketsBulkTable tickets={tickets} queueMap={queueMap} queues={queues} />

          {/* Pagination */}
          {total > 0 && (
            <TicketsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              total={total}
              pageSize={limit}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
