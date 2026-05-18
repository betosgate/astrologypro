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
import { Input } from "@/components/ui/input";
import { Plus, LifeBuoy, Circle, Search, Clock, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
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

export default async function SupportPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  const { data: adminRow } = await adminClient
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const isAdmin = adminRow?.role === "admin";
  const isSupportStaff = adminRow?.role === "support_staff";
  const canSeeAll = isAdmin || isSupportStaff;

  const statusFilter = (searchParams.status as string) || "all";
  const searchQuery = (searchParams.q as string) || "";

  let query = adminClient
    .from("support_tickets")
    .select(
      "id, ticket_number, subject, status, priority, category, assigned_to, metadata, created_at, updated_at",
      { count: "exact" }
    );

  if (!canSeeAll) {
    query = query.eq("requester_user_id", user.id);
  }

  query = query.order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  if (searchQuery) {
    query = query.or(`subject.ilike.%${searchQuery}%,ticket_number.ilike.%${searchQuery}%`);
  }

  const { data: tickets, count } = await query.limit(50);
  const rawTickets = (tickets as SupportTicket[]) ?? [];

  // Derive unread indicator
  const ticketList = rawTickets.map((t) => ({
    ...t,
    _unread: t.status === "waiting_requester",
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LifeBuoy className="size-6 text-primary" />
            {canSeeAll ? "Support Queue" : "Support"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {count ?? 0} total ticket{count !== 1 ? "s" : ""} {canSeeAll ? "in queue" : "found"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              type="search"
              placeholder={canSeeAll ? "Search all tickets..." : "Search my tickets..."}
              defaultValue={searchQuery}
              className="pl-9 w-[200px] lg:w-[300px]"
            />
          </form>
          <Button asChild>
            <Link href="/dashboard/support/new">
              <Plus className="size-4 mr-2" />
              New Ticket
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-500/5 border-blue-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-600 font-medium text-xs uppercase tracking-wider">Open</CardDescription>
            <CardTitle className="text-2xl">{ticketList.filter(t => t.status === 'open').length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-purple-500/5 border-purple-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-purple-600 font-medium text-xs uppercase tracking-wider">In Progress</CardDescription>
            <CardTitle className="text-2xl">{ticketList.filter(t => t.status === 'in_progress').length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-yellow-500/5 border-yellow-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-yellow-600 font-medium text-xs uppercase tracking-wider">{canSeeAll ? "Waiting on User" : "Waiting on Me"}</CardDescription>
            <CardTitle className="text-2xl">{ticketList.filter(t => t.status === 'waiting_requester').length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-green-600 font-medium text-xs uppercase tracking-wider">Resolved</CardDescription>
            <CardTitle className="text-2xl">{ticketList.filter(t => t.status === 'resolved').length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tickets table */}
      <Card>
        <CardHeader className="border-b bg-muted/30 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">{canSeeAll ? "Global Queue" : "My Tickets"}</CardTitle>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
               <Link href="?status=all" className={`text-[11px] px-3 py-1 rounded-full font-medium transition-colors ${statusFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted border'}`}>All</Link>
               <Link href="?status=open" className={`text-[11px] px-3 py-1 rounded-full font-medium transition-colors ${statusFilter === 'open' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted border'}`}>Open</Link>
               <Link href="?status=in_progress" className={`text-[11px] px-3 py-1 rounded-full font-medium transition-colors ${statusFilter === 'in_progress' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted border'}`}>In Progress</Link>
               <Link href="?status=resolved" className={`text-[11px] px-3 py-1 rounded-full font-medium transition-colors ${statusFilter === 'resolved' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted border'}`}>Resolved</Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {ticketList.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <LifeBuoy className="size-8 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No tickets found</p>
              <p className="text-sm mt-1">
                {searchQuery ? "Try a different search term" : "Need help? Submit a support request"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead className="w-[120px] text-xs uppercase font-bold tracking-wider">Ticket #</TableHead>
                  <TableHead className="text-xs uppercase font-bold tracking-wider">Subject</TableHead>
                  <TableHead className="text-xs uppercase font-bold tracking-wider">Category</TableHead>
                  <TableHead className="text-xs uppercase font-bold tracking-wider">Status</TableHead>
                  <TableHead className="text-xs uppercase font-bold tracking-wider">Priority</TableHead>
                  <TableHead className="text-xs uppercase font-bold tracking-wider">Assignee</TableHead>
                  <TableHead className="text-xs uppercase font-bold tracking-wider">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticketList.map((ticket) => (
                  <TableRow key={ticket.id} className="group cursor-pointer hover:bg-muted/50 border-b">
                    <TableCell className="font-mono text-[11px] font-medium text-muted-foreground">
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
                          className="font-semibold text-sm hover:underline line-clamp-1"
                        >
                          {ticket.subject}
                        </Link>
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">
                      {ticket.category}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] h-5 px-2", statusColors[ticket.status] ?? "")}
                      >
                        {formatStatus(ticket.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] h-5 px-2", priorityColors[ticket.priority] ?? "")}
                      >
                        {formatStatus(ticket.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2 text-xs">
                        <UserIcon className="size-3 text-muted-foreground shrink-0" />
                        {ticket.assigned_to ? (
                          <div className="flex flex-col">
                            <span className="text-[11px] font-medium truncate max-w-[150px]">
                              {(ticket as any).metadata?.assignee_name || "Support Agent"}
                            </span>
                            {(ticket as any).metadata?.assignee_email && (
                              <span className="text-[9px] text-muted-foreground truncate max-w-[150px]">
                                {(ticket as any).metadata.assignee_email}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] italic text-muted-foreground">Unassigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                       <div className="flex items-center gap-1.5">
                        <Clock className="size-3" />
                        {formatDate(ticket.created_at)}
                      </div>
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
