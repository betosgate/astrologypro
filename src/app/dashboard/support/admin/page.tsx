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
import { LifeBuoy, Filter, Search, User, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Job Ticket Admin | Dashboard" };

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

export default async function SupportAdminPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  
  // Verify staff/admin status
  const { data: adminRow } = await admin
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) redirect("/dashboard");

  const statusFilter = (searchParams.status as string) || "all";
  const searchQuery = (searchParams.q as string) || "";
  
  let query = admin
    .from("support_tickets")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  if (searchQuery) {
    query = query.or(`subject.ilike.%${searchQuery}%,ticket_number.ilike.%${searchQuery}%,requester_email.ilike.%${searchQuery}%`);
  }

  const { data: tickets, count } = await query.limit(50);
  const ticketList = tickets ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LifeBuoy className="size-6 text-primary" />
            Global Ticket Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Managing {count ?? 0} total tickets across the platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              type="search"
              placeholder="Search tickets..."
              defaultValue={searchQuery}
              className="pl-9 w-[200px] lg:w-[300px]"
            />
          </form>
          <Button variant="outline" size="icon">
            <Filter className="size-4" />
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
        <Card className="bg-orange-500/5 border-orange-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-orange-600 font-medium text-xs uppercase tracking-wider">Waiting on Us</CardDescription>
            <CardTitle className="text-2xl">{ticketList.filter(t => t.status === 'waiting_internal').length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-green-600 font-medium text-xs uppercase tracking-wider">Resolved</CardDescription>
            <CardTitle className="text-2xl">{ticketList.filter(t => t.status === 'resolved').length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader className="border-b bg-muted/30 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">Ticket Queue</CardTitle>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
               <Link href="?status=all" className={`text-[11px] px-3 py-1 rounded-full font-medium transition-colors ${statusFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted border'}`}>All</Link>
               <Link href="?status=open" className={`text-[11px] px-3 py-1 rounded-full font-medium transition-colors ${statusFilter === 'open' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted border'}`}>Open</Link>
               <Link href="?status=in_progress" className={`text-[11px] px-3 py-1 rounded-full font-medium transition-colors ${statusFilter === 'in_progress' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted border'}`}>In Progress</Link>
               <Link href="?status=resolved" className={`text-[11px] px-3 py-1 rounded-full font-medium transition-colors ${statusFilter === 'resolved' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted border'}`}>Resolved</Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20">
                <TableHead className="w-[120px] text-xs uppercase font-bold tracking-wider">Ticket #</TableHead>
                <TableHead className="text-xs uppercase font-bold tracking-wider">Subject / Category</TableHead>
                <TableHead className="text-xs uppercase font-bold tracking-wider">Status</TableHead>
                <TableHead className="text-xs uppercase font-bold tracking-wider">Priority</TableHead>
                <TableHead className="text-xs uppercase font-bold tracking-wider">Assigned To</TableHead>
                <TableHead className="text-xs uppercase font-bold tracking-wider">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticketList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic text-sm">
                    No tickets found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                ticketList.map((ticket) => (
                  <TableRow key={ticket.id} className="group cursor-pointer hover:bg-muted/50 border-b transition-colors">
                    <TableCell className="font-mono text-[11px] font-medium text-muted-foreground">
                      <Link
                        href={`/dashboard/support/admin/${ticket.id}`}
                        className="text-primary hover:underline"
                      >
                        {ticket.ticket_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <Link
                          href={`/dashboard/support/admin/${ticket.id}`}
                          className="font-semibold text-sm hover:underline line-clamp-1"
                        >
                          {ticket.subject}
                        </Link>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                          {ticket.category}
                        </span>
                      </div>
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
                        <User className="size-3.5 text-muted-foreground shrink-0" />
                        {ticket.assigned_to ? (
                          <span className="text-[11px] font-medium truncate max-w-[120px]">Staff Member</span>
                        ) : (
                          <span className="text-[11px] italic text-muted-foreground">Unassigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {formatDate(ticket.created_at)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
