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
import { ArrowLeft, AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "SLA Dashboard | Admin" };

// ─── Types ────────────────────────────────────────────────────────────────────

interface SlaTicket {
  id: string;
  ticket_number: string;
  subject: string;
  priority: string;
  status: string;
  assigned_team: string | null;
  queue_id: string | null;
  sla_due_at: string | null;
  sla_breached: boolean;
  sla_breached_at: string | null;
  first_response_at: string | null;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function minutesUntilDue(due: string): number {
  return Math.floor((new Date(due).getTime() - Date.now()) / 60000);
}

function formatMinutes(mins: number): string {
  if (Math.abs(mins) < 60) return `${Math.abs(mins)}m`;
  const h = Math.floor(Math.abs(mins) / 60);
  const m = Math.abs(mins) % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SlaDashboardPage() {
  const user = await requireAdmin();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Active (non-terminal) statuses
  const activeStatuses = ["open", "in_progress", "waiting_internal", "escalated", "triaged", "assigned"];

  // Fetch all active tickets with SLA data
  const { data: allActive } = await admin
    .from("support_tickets")
    .select(
      "id, ticket_number, subject, priority, status, assigned_team, queue_id, sla_due_at, sla_breached, sla_breached_at, first_response_at, created_at"
    )
    .in("status", activeStatuses)
    .order("priority", { ascending: true })
    .order("sla_due_at", { ascending: true })
    .limit(500);

  const tickets: SlaTicket[] = (allActive as SlaTicket[]) ?? [];

  // Categorise
  const breached = tickets.filter(
    (t) => t.sla_breached || (t.sla_due_at && new Date(t.sla_due_at) < new Date(now))
  );
  const atRisk = tickets.filter((t) => {
    if (t.sla_breached) return false;
    if (!t.sla_due_at) return false;
    const minsLeft = minutesUntilDue(t.sla_due_at);
    return minsLeft >= 0 && minsLeft < 120; // < 2 hours
  });
  const onTrack = tickets.filter((t) => {
    if (t.sla_breached || !t.sla_due_at) return false;
    return minutesUntilDue(t.sla_due_at) >= 120;
  });
  const noSla = tickets.filter((t) => !t.sla_due_at);

  // Stats
  const totalActive = tickets.length;
  const breachedCount = breached.length;
  const atRiskCount = atRisk.length;
  const slaCompliance =
    totalActive > 0
      ? Math.round(((totalActive - breachedCount) / totalActive) * 100)
      : 100;

  // Fetch queues for name lookup
  const { data: queuesData } = await admin
    .from("ticket_queues")
    .select("id, name")
    .eq("is_active", true);
  const queueMap = Object.fromEntries((queuesData ?? []).map((q: { id: string; name: string }) => [q.id, q.name]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Link
        href="/admin/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Tickets
      </Link>

      <div>
        <h1 className="text-2xl font-bold">SLA Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time SLA posture for all active tickets.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wide">Active Tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalActive}</p>
          </CardContent>
        </Card>

        <Card className={breachedCount > 0 ? "border-red-500/30" : ""}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs uppercase tracking-wide">
              <XCircle className="size-3.5 text-red-500" />
              SLA Breached
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${breachedCount > 0 ? "text-red-600" : ""}`}>
              {breachedCount}
            </p>
          </CardContent>
        </Card>

        <Card className={atRiskCount > 0 ? "border-amber-500/30" : ""}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs uppercase tracking-wide">
              <AlertTriangle className="size-3.5 text-amber-500" />
              At Risk (&lt;2h)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${atRiskCount > 0 ? "text-amber-600" : ""}`}>
              {atRiskCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs uppercase tracking-wide">
              <CheckCircle2 className="size-3.5 text-green-500" />
              SLA Compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${slaCompliance < 80 ? "text-red-600" : slaCompliance < 95 ? "text-amber-600" : "text-green-600"}`}>
              {slaCompliance}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breached tickets */}
      {breached.length > 0 && (
        <Card className="border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="size-5" />
              Breached SLA ({breached.length})
            </CardTitle>
            <CardDescription>
              These tickets have exceeded their resolution target. Immediate action required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SlaTable tickets={breached} queueMap={queueMap} variant="breached" />
          </CardContent>
        </Card>
      )}

      {/* At-risk tickets */}
      {atRisk.length > 0 && (
        <Card className="border-amber-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="size-5" />
              At Risk — Under 2 Hours ({atRisk.length})
            </CardTitle>
            <CardDescription>
              These tickets will breach their SLA within 2 hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SlaTable tickets={atRisk} queueMap={queueMap} variant="at_risk" />
          </CardContent>
        </Card>
      )}

      {/* On-track tickets */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="size-5" />
            On Track ({onTrack.length})
          </CardTitle>
          <CardDescription>
            Tickets within SLA with more than 2 hours remaining.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {onTrack.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No tickets currently on track with SLA.</p>
          ) : (
            <SlaTable tickets={onTrack} queueMap={queueMap} variant="on_track" />
          )}
        </CardContent>
      </Card>

      {/* No-SLA tickets */}
      {noSla.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Clock className="size-5" />
              No SLA Configured ({noSla.length})
            </CardTitle>
            <CardDescription>
              Active tickets without an SLA deadline. Consider assigning SLA policies to their queues.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SlaTable tickets={noSla} queueMap={queueMap} variant="no_sla" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── SLA table sub-component ──────────────────────────────────────────────────

function SlaTable({
  tickets,
  queueMap,
  variant,
}: {
  tickets: SlaTicket[];
  queueMap: Record<string, string>;
  variant: "breached" | "at_risk" | "on_track" | "no_sla";
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticket #</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Queue / Team</TableHead>
          {variant !== "no_sla" && (
            <TableHead>
              {variant === "breached" ? "Breached At" : "Due At"}
            </TableHead>
          )}
          {variant !== "no_sla" && (
            <TableHead>Time {variant === "breached" ? "Overdue" : "Left"}</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((t) => {
          const minsLeft = t.sla_due_at ? minutesUntilDue(t.sla_due_at) : null;
          return (
            <TableRow key={t.id}>
              <TableCell className="font-mono text-xs">
                <Link
                  href={`/admin/tickets/${t.id}`}
                  className="text-primary hover:underline"
                >
                  {t.ticket_number}
                </Link>
              </TableCell>
              <TableCell className="max-w-xs">
                <Link href={`/admin/tickets/${t.id}`} className="hover:underline line-clamp-1 text-sm">
                  {t.subject}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`text-xs ${priorityColors[t.priority] ?? ""}`}>
                  {formatStatus(t.priority)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{formatStatus(t.status)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {t.queue_id ? queueMap[t.queue_id] ?? t.assigned_team ?? "—" : t.assigned_team ?? "—"}
              </TableCell>
              {variant !== "no_sla" && (
                <TableCell className="text-sm text-muted-foreground">
                  {variant === "breached" && t.sla_breached_at
                    ? formatDateTime(t.sla_breached_at)
                    : t.sla_due_at
                    ? formatDateTime(t.sla_due_at)
                    : "—"}
                </TableCell>
              )}
              {variant !== "no_sla" && minsLeft !== null && (
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      minsLeft < 0
                        ? "bg-red-500/10 text-red-600 border-red-500/20 text-xs"
                        : minsLeft < 120
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs"
                        : "bg-green-500/10 text-green-600 border-green-500/20 text-xs"
                    }
                  >
                    {minsLeft < 0 ? `${formatMinutes(minsLeft)} ago` : formatMinutes(minsLeft)}
                  </Badge>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
