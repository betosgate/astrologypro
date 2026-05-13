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

export const dynamic = "force-dynamic";
export const metadata = { title: "Job Ticket Admin | Dashboard" };

const statusColors: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  in_progress: "bg-purple-500/10 text-purple-600 border-purple-500/20",
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
    hour: "2-digit",
    minute: "2-digit",
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
  
  let query = admin
    .from("support_tickets")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
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
            Managing {count ?? 0} total job tickets across the platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tickets..."
              className="pl-9 w-[200px] lg:w-[300px]"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="size-4" />
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-600 font-medium">New / Open</CardDescription>
            <CardTitle className="text-2xl">{ticketList.filter(t => t.status === 'open').length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-purple-500/5 border-purple-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-purple-600 font-medium">In Progress</CardDescription>
            <CardTitle className="text-2xl">{ticketList.filter(t => t.status === 'in_progress').length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-orange-600 font-medium">High Priority</CardDescription>
            <CardTitle className="text-2xl">{ticketList.filter(t => ['high', 'urgent', 'critical'].includes(t.priority)).length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-green-600 font-medium">Resolved (Total)</CardDescription>
            <CardTitle className="text-2xl">{ticketList.filter(t => t.status === 'resolved').length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle>Ticket Queue</CardTitle>
            <div className="flex items-center gap-2">
               <Link href="?status=all" className={`text-xs px-2 py-1 rounded-md ${statusFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted border'}`}>All</Link>
               <Link href="?status=open" className={`text-xs px-2 py-1 rounded-md ${statusFilter === 'open' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted border'}`}>Open</Link>
               <Link href="?status=in_progress" className={`text-xs px-2 py-1 rounded-md ${statusFilter === 'in_progress' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted border'}`}>In Progress</Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Ticket #</TableHead>
                <TableHead>Subject / Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticketList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No tickets found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                ticketList.map((ticket) => (
                  <TableRow key={ticket.id} className="group cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">
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
                          className="font-medium hover:underline line-clamp-1"
                        >
                          {ticket.subject}
                        </Link>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                          {ticket.category}
                        </span>
                      </div>
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
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="size-3 text-muted-foreground" />
                        {ticket.assigned_to ? (
                          <span className="text-xs">Staff Member</span>
                        ) : (
                          <span className="text-xs italic text-muted-foreground">Unassigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="size-3" />
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
