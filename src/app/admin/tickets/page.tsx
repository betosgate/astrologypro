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
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TicketsFilter } from "@/components/admin/tickets-filter";
import { TicketsBulkTable } from "@/components/admin/tickets-bulk-actions";

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
  } = await searchParams;

  const activeTab: TabKey =
    tabParam === "unassigned" || tabParam === "sla_at_risk"
      ? tabParam
      : "all";

  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const limit = 50;
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  // Load queues for filter dropdown
  const { data: queuesData } = await admin
    .from("ticket_queues")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });
  const queues: TicketQueue[] = (queuesData as TicketQueue[]) ?? [];
  const queueMap = Object.fromEntries(queues.map((q) => [q.id, q.name]));

  // Build query
  let query = admin
    .from("support_tickets")
    .select(
      "id, ticket_number, type, category, subject, status, priority, requester_name, requester_email, requester_role, assigned_to, assigned_team, queue_id, sla_due_at, sla_breached, created_at, updated_at",
      { count: "exact" }
    )
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  // Tab filters
  if (activeTab === "unassigned") {
    query = query.is("assigned_to", null);
    // Exclude terminal statuses for unassigned view
    query = query.not("status", "in", '("resolved","closed","cancelled")');
  } else if (activeTab === "sla_at_risk") {
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    // Tickets that are at-risk: sla_due_at exists, not yet breached, and due within 2h — or already breached
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
  if (date_from) query = query.gte("created_at", date_from);
  if (date_to) {
    // Include the full "to" day
    const toEnd = `${date_to}T23:59:59.999Z`;
    query = query.lte("created_at", toEnd);
  }

  // Text search: subject, requester name, ticket_number
  if (search && search.trim()) {
    const q = search.trim();
    query = query.or(
      `subject.ilike.%${q}%,requester_name.ilike.%${q}%,requester_email.ilike.%${q}%,ticket_number.ilike.%${q}%`
    );
  }

  const { data, count } = await query;

  const tickets = (data as SupportTicket[]) ?? [];
  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  // Summary counts for header
  const openCount = tickets.filter((t) =>
    ["open", "in_progress", "escalated", "waiting_requester", "waiting_internal"].includes(t.status)
  ).length;

  // Build tab URLs — preserve non-tab filters
  function tabUrl(key: string) {
    const params = new URLSearchParams();
    if (key !== "all") params.set("tab", key);
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
            {openCount > 0 && ` · ${openCount} open`}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/tickets/new">
            <Plus className="size-4 mr-2" />
            Create Job Ticket
          </Link>
        </Button>
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
        <CardHeader className="pb-3">
          <CardTitle>
            {activeTab === "all" && "All Tickets"}
            {activeTab === "unassigned" && "Unassigned Tickets"}
            {activeTab === "sla_at_risk" && "SLA At-Risk Tickets"}
          </CardTitle>
          <CardDescription>
            Showing {tickets.length} of {total} ticket{total !== 1 ? "s" : ""}.
            Select rows to apply bulk actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TicketsBulkTable tickets={tickets} queueMap={queueMap} queues={queues} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/admin/tickets?page=${page - 1}${activeTab !== "all" ? `&tab=${activeTab}` : ""}${status ? `&status=${status}` : ""}${type ? `&type=${type}` : ""}${priority ? `&priority=${priority}` : ""}${queue ? `&queue=${queue}` : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}${date_from ? `&date_from=${date_from}` : ""}${date_to ? `&date_to=${date_to}` : ""}`}
                    >
                      Previous
                    </Link>
                  </Button>
                )}
                {page < totalPages && (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/admin/tickets?page=${page + 1}${activeTab !== "all" ? `&tab=${activeTab}` : ""}${status ? `&status=${status}` : ""}${type ? `&type=${type}` : ""}${priority ? `&priority=${priority}` : ""}${queue ? `&queue=${queue}` : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}${date_from ? `&date_from=${date_from}` : ""}${date_to ? `&date_to=${date_to}` : ""}`}
                    >
                      Next
                    </Link>
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
