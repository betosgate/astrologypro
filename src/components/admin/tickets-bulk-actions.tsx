"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Clock } from "lucide-react";
import Link from "next/link";

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
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface Queue {
  id: string;
  name: string;
}

interface Props {
  tickets: SupportTicket[];
  queueMap: Record<string, string>;
  queues: Queue[];
}

// ─── Color helpers ─────────────────────────────────────────────────────────────

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

function slaPosture(sla_due_at: string | null, sla_breached: boolean) {
  if (!sla_due_at) return null;
  if (sla_breached) return { label: "Breached", className: "bg-red-500/10 text-red-600 border-red-500/20" };
  const diffMs = new Date(sla_due_at).getTime() - Date.now();
  if (diffMs < 0) return { label: "Breached", className: "bg-red-500/10 text-red-600 border-red-500/20" };
  if (diffMs < 2 * 60 * 60 * 1000) return { label: "At Risk", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
  return { label: "On Track", className: "bg-green-500/10 text-green-600 border-green-500/20" };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TicketsBulkTable({ tickets, queueMap, queues }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkPriority, setBulkPriority] = useState("");
  const [bulkQueue, setBulkQueue] = useState("");
  const [applying, setApplying] = useState(false);

  const allIds = tickets.map((t) => t.id);
  const allSelected = selected.size === allIds.length && allIds.length > 0;
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function applyBulk() {
    if (selected.size === 0) {
      toast.error("Select at least one ticket.");
      return;
    }
    if (!bulkStatus && !bulkPriority && !bulkQueue) {
      toast.error("Choose an action to apply.");
      return;
    }

    setApplying(true);
    let successCount = 0;
    let errorCount = 0;

    const ids = Array.from(selected);
    await Promise.all(
      ids.map(async (id) => {
        const body: Record<string, unknown> = {};
        if (bulkStatus) body.status = bulkStatus;
        if (bulkPriority) body.priority = bulkPriority;
        if (bulkQueue) body.queue_id = bulkQueue;

        try {
          const res = await fetch(`/api/admin/tickets/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (res.ok) successCount++;
          else errorCount++;
        } catch {
          errorCount++;
        }
      })
    );

    setApplying(false);
    setSelected(new Set());
    setBulkStatus("");
    setBulkPriority("");
    setBulkQueue("");

    if (successCount > 0) {
      toast.success(`Updated ${successCount} ticket${successCount !== 1 ? "s" : ""}.`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} ticket${errorCount !== 1 ? "s" : ""} failed to update.`);
    }

    router.refresh();
  }

  return (
    <div className="space-y-3">
      {/* Bulk action bar — shown when tickets are selected */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/40 px-4 py-2.5">
          <span className="text-sm font-medium">
            {selected.size} ticket{selected.size !== 1 ? "s" : ""} selected
          </span>

          <Select value={bulkStatus} onValueChange={setBulkStatus}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="Set status…" />
            </SelectTrigger>
            <SelectContent>
              {["open", "in_progress", "waiting_requester", "waiting_internal", "escalated", "resolved", "closed", "cancelled"].map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {formatStatus(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={bulkPriority} onValueChange={setBulkPriority}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Set priority…" />
            </SelectTrigger>
            <SelectContent>
              {["low", "normal", "high", "urgent", "critical"].map((p) => (
                <SelectItem key={p} value={p} className="text-xs">
                  {formatStatus(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {queues.length > 0 && (
            <Select value={bulkQueue} onValueChange={setBulkQueue}>
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue placeholder="Assign to queue…" />
              </SelectTrigger>
              <SelectContent>
                {queues.map((q) => (
                  <SelectItem key={q.id} value={q.id} className="text-xs">
                    {q.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={applyBulk}
            disabled={applying || (!bulkStatus && !bulkPriority && !bulkQueue)}
          >
            {applying && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
            Apply to {selected.size}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs text-muted-foreground"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      {tickets.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p className="font-medium">No tickets found</p>
          <p className="text-sm mt-1">Try adjusting your filters.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Ticket #</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  SLA
                </span>
              </TableHead>
              <TableHead>Queue / Team</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id} data-selected={selected.has(ticket.id) ? "true" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(ticket.id)}
                    onCheckedChange={() => toggleOne(ticket.id)}
                    aria-label={`Select ticket ${ticket.ticket_number}`}
                  />
                </TableCell>
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
                <TableCell>
                  {(() => {
                    const posture = slaPosture(ticket.sla_due_at, ticket.sla_breached);
                    if (!posture) return <span className="text-xs text-muted-foreground">—</span>;
                    return (
                      <Badge variant="outline" className={`text-xs ${posture.className}`}>
                        {posture.label}
                      </Badge>
                    );
                  })()}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {ticket.queue_id
                    ? (queueMap[ticket.queue_id] ?? ticket.assigned_team ?? "Unassigned")
                    : (ticket.assigned_team ?? "Unassigned")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs">
                    {ticket.assigned_to ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-[11px] max-w-[150px] truncate text-foreground">
                          {ticket.metadata?.assignee_name || "Support Agent"}
                        </span>
                        {ticket.metadata?.assignee_email && (
                          <span className="text-[9px] text-muted-foreground max-w-[150px] truncate">
                            {ticket.metadata.assignee_email}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="italic text-muted-foreground text-[11px]">Unassigned</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(ticket.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
