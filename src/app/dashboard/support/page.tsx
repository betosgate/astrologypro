import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
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
import { Plus, LifeBuoy, Circle } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Support | Dashboard" };

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  updated_at: string;
  // unread = updated_at > last customer message timestamp; we derive from updated_at vs created_at heuristic
  _unread?: boolean;
}

// ─── Status badge styles ──────────────────────────────────────────────────────

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

export default async function SupportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: tickets } = await admin
    .from("support_tickets")
    .select(
      "id, ticket_number, subject, status, priority, category, created_at, updated_at"
    )
    .eq("requester_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const rawTickets = (tickets as SupportTicket[]) ?? [];

  // Derive unread indicator: a ticket is "unread" if it has a staff reply newer than the
  // ticket's updated_at as perceived by the customer — we use a simple heuristic:
  // status is "waiting_requester" (staff replied and waiting) and updated_at > created_at
  const ticketList = rawTickets.map((t) => ({
    ...t,
    _unread: t.status === "waiting_requester",
  }));
  const openCount = ticketList.filter((t) =>
    ["open", "in_progress", "waiting_requester", "waiting_internal", "escalated"].includes(t.status)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LifeBuoy className="size-6" />
            Support
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {openCount > 0
              ? `${openCount} open ticket${openCount !== 1 ? "s" : ""}`
              : "No open tickets"}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/support/new">
            <Plus className="size-4 mr-2" />
            New Ticket
          </Link>
        </Button>
      </div>

      {/* Tickets table */}
      <Card>
        <CardHeader>
          <CardTitle>My Tickets</CardTitle>
          <CardDescription>
            All support requests you have submitted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ticketList.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <LifeBuoy className="size-8 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No tickets yet</p>
              <p className="text-sm mt-1">
                Need help?{" "}
                <Link
                  href="/dashboard/support/new"
                  className="text-primary underline underline-offset-4"
                >
                  Submit a support request
                </Link>
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticketList.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-xs">
                      <Link
                        href={`/dashboard/support/${ticket.id}`}
                        className="text-primary hover:underline"
                      >
                        {ticket.ticket_number}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <span className="flex items-center gap-1.5">
                        {ticket._unread && (
                          <Circle className="size-2 fill-blue-500 text-blue-500 shrink-0" aria-label="New staff reply" />
                        )}
                        <Link
                          href={`/dashboard/support/${ticket.id}`}
                          className="hover:underline line-clamp-1"
                        >
                          {ticket.subject}
                        </Link>
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ticket.category}
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
                      {formatDate(ticket.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
