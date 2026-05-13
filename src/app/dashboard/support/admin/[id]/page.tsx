import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
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
import { ArrowLeft, User, Calendar, MessageSquare, Shield, CheckCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  in_progress: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  resolved: "bg-green-500/10 text-green-600 border-green-500/20",
  closed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  cancelled: "bg-gray-400/10 text-gray-400 border-gray-400/20",
};

function formatStatus(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function TicketDetailsAdminPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
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

  const { data: ticket } = await admin
    .from("support_tickets")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!ticket) notFound();

  const { data: comments } = await admin
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  // Fetch creator info
  const { data: creator } = await admin.auth.admin.getUserById(ticket.requester_user_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/support/admin"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Queue
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Assign to Me</Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="size-4 mr-2" />
            Resolve Ticket
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Ticket Content & Comments */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                  {ticket.ticket_number}
                </span>
                <Badge variant="outline" className={statusColors[ticket.status]}>
                  {formatStatus(ticket.status)}
                </Badge>
              </div>
              <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
              <CardDescription className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1">
                  <User className="size-3" />
                  {creator?.user?.email ?? "Unknown User"}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {new Date(ticket.created_at).toLocaleString()}
                </span>
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap text-foreground/90">
                  {ticket.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 px-1">
              <MessageSquare className="size-5 text-primary" />
              Activity & Comments
            </h3>
            
            {(comments ?? []).map((comment) => (
              <Card key={comment.id} className={comment.is_internal ? "border-amber-200 bg-amber-50/30 dark:bg-amber-900/10 dark:border-amber-900/30" : ""}>
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {comment.author_id === user.id ? "You" : "User"}
                    </span>
                    {comment.is_internal && (
                      <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 uppercase px-1 py-0 h-4">
                        <Shield className="size-2.5 mr-1" />
                        Internal Note
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                </CardContent>
              </Card>
            ))}

            {/* Comment Form Placeholder */}
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Add a reply to the user or an internal note for staff.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button variant="outline">Internal Note</Button>
                  <Button>Public Reply</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column: Sidebar Stats & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ticket Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Priority</label>
                <div className="mt-1 font-medium capitalize">{ticket.priority}</div>
              </div>
              <Separator />
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Category</label>
                <div className="mt-1 font-medium">{ticket.category}</div>
              </div>
              <Separator />
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Related Entity</label>
                <div className="mt-1 text-sm font-mono break-all">
                  {ticket.related_entity_id ?? "None"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-[10px] bg-muted p-2 rounded overflow-auto">
                {JSON.stringify(ticket.metadata, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
