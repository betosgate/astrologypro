import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Plus } from "lucide-react";
import { TicketsFilter } from "@/components/admin/tickets-filter";

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
  created_at: string;
  updated_at: string;
}

// ─── Color helpers ────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  in_progress: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  waiting_requester: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  waiting_internal: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  escalated: "bg-red-500/10 text-red-600 border-red-500/20",
  resolved: "bg-green-500/10 text-green-600 border-green-500/20",
  closed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  cancelled: "bg-gray-400/10 text-gray-400 border-gray-400/20",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  normal: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  high: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  urgent: "bg-red-500/10 text-red-600 border-red-500/20",
  critical: "bg-red-700/10 text-red-700 border-red-700/20",
};

function formatStatus(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    type?: string;
    priority?: string;
    page?: string;
  }>;
}) {
  const user = await requireAdmin();
  if (!user) redirect("/login");

  const { status, type, priority, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const limit = 50;
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  let query = admin
    .from("support_tickets")
    .select(
      "id, ticket_number, type, category, subject, status, priority, requester_name, requester_email, requester_role, assigned_to, assigned_team, created_at, updated_at",
      { count: "exact" }
    )
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== "all") query = query.eq("status", status);
  if (type && type !== "all") query = query.eq("type", type);
  if (priority && priority !== "all") query = query.eq("priority", priority);

  const { data, count } = await query;

  const tickets = (data as SupportTicket[]) ?? [];
  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  // Summary counts for open/escalated
  const openCount = tickets.filter((t) =>
    ["open", "in_progress", "escalated", "waiting_requester", "waiting_internal"].includes(t.status)
  ).length;

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

      {/* Filters */}
      <TicketsFilter
        currentStatus={status ?? ""}
        currentType={type ?? ""}
        currentPriority={priority ?? ""}
      />

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Tickets</CardTitle>
          <CardDescription>
            Showing {tickets.length} of {total} tickets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="font-medium">No tickets found</p>
              <p className="text-sm mt-1">Try adjusting your filters.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-xs">
                      <Link
                        href={`/admin/tickets/${ticket.id}`}
                        className="text-primary hover:underline"
                      >
                        {ticket.ticket_number}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <Link
                        href={`/admin/tickets/${ticket.id}`}
                        className="hover:underline line-clamp-1"
                      >
                        {ticket.subject}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ticket.category}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatStatus(ticket.type)}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{ticket.requester_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.requester_email ?? ticket.requester_role ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[ticket.status] ?? ""}
                      >
                        {formatStatus(ticket.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={priorityColors[ticket.priority] ?? ""}
                      >
                        {formatStatus(ticket.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ticket.assigned_team ?? "Unassigned"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(ticket.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`?page=${page - 1}${status ? `&status=${status}` : ""}${type ? `&type=${type}` : ""}${priority ? `&priority=${priority}` : ""}`}>
                      Previous
                    </Link>
                  </Button>
                )}
                {page < totalPages && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`?page=${page + 1}${status ? `&status=${status}` : ""}${type ? `&type=${type}` : ""}${priority ? `&priority=${priority}` : ""}`}>
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
