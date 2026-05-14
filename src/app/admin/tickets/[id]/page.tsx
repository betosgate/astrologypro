"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2, SendHorizonal, Lock, CheckSquare, Square, Plus } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ticket {
  id: string;
  ticket_number: string;
  type: string;
  category: string;
  subcategory: string | null;
  subject: string;
  description: string;
  status: string;
  priority: string;
  requester_name: string | null;
  requester_email: string | null;
  requester_role: string | null;
  assigned_to: string | null;
  assigned_team: string | null;
  queue_id: string | null;
  resolution: string | null;
  sla_due_at: string | null;
  sla_breached: boolean;
  sla_breached_at: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface TicketQueue {
  id: string;
  name: string;
}

interface TicketMessage {
  id: string;
  author_name: string;
  author_role: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}

interface HistoryEntry {
  id: string;
  actor_user_id: string | null;
  event_type: string;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
  created_at: string;
}

interface TicketTask {
  id: string;
  ticket_id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "done" | "blocked";
  sort_order: number;
  completed_at: string | null;
  created_at: string;
}

interface TicketData {
  ticket: Ticket;
  messages: TicketMessage[];
  history: HistoryEntry[];
}

const EMPTY_QUEUES: TicketQueue[] = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatStatus(s: string | null | undefined) {
  if (!s) return "Unknown";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDateTime(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "Invalid Date";
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const ticketId = params.id;

  const [data, setData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  // Checklist state
  const [tasks, setTasks] = useState<TicketTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);

  // Queue list for selector
  const [queues, setQueues] = useState<TicketQueue[]>(EMPTY_QUEUES);

  // Edit state
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignedTeam, setAssignedTeam] = useState("");
  const [queueId, setQueueId] = useState<string>("");
  const [resolution, setResolution] = useState("");

  // Message compose
  const [messageBody, setMessageBody] = useState("");
  const [isInternal, setIsInternal] = useState(true);

  const loadTicket = useCallback(async () => {
    if (!ticketId) return;
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }));
        toast.error(err.detail ?? "Failed to load ticket.");
        router.push("/admin/tickets");
        return;
      }
      const json: TicketData = await res.json();
      
      // Safety: Ensure messages and history are arrays
      json.messages = json.messages || [];
      json.history = json.history || [];
      
      setData(json);
      setStatus(json.ticket?.status || "open");
      setPriority(json.ticket?.priority || "normal");
      setAssignedTeam(json.ticket?.assigned_team ?? "");
      setQueueId(json.ticket?.queue_id ?? "");
      setResolution(json.ticket?.resolution ?? "");
    } catch (error) {
      console.error("Ticket Load Error:", error);
      toast.error("Failed to load ticket.");
    } finally {
      setLoading(false);
    }
  }, [ticketId, router]);

  const loadTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/tasks`);
      if (res.ok) {
        const json = await res.json();
        setTasks(json.tasks ?? []);
      }
    } catch {
      // Non-fatal: checklist load failure doesn't break the page
    } finally {
      setTasksLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  useEffect(() => {
    // Load tasks for job tickets after main data loads
    if (data?.ticket.type === "job") {
      loadTasks();
    }
  }, [data?.ticket.type, loadTasks]);

  useEffect(() => {
    // Load queue list for the queue selector
    fetch("/api/admin/ticket-queues?active_only=true")
      .then((r) => r.ok ? r.json() : { queues: [] })
      .then((j) => setQueues(j.queues ?? []))
      .catch(() => {});
  }, []);

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setAddingTask(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTaskTitle.trim(), sort_order: tasks.length }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Failed to add task.");
      }
      setNewTaskTitle("");
      setShowAddTask(false);
      await loadTasks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add task.");
    } finally {
      setAddingTask(false);
    }
  }

  async function handleToggleTask(task: TicketTask) {
    const nextStatus = task.status === "done" ? "pending" : "done";
    try {
      const res = await fetch(`/api/admin/ticket-tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Failed to update task.");
      }
      await loadTasks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update task.");
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          priority,
          assigned_team: assignedTeam || null,
          queue_id: queueId || null,
          resolution: resolution || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Failed to save changes.");
      }
      toast.success("Ticket updated.");
      await loadTicket();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageBody.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageBody.trim(),
          is_internal: isInternal,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Failed to send message.");
      }
      setMessageBody("");
      toast.success(isInternal ? "Internal note added." : "Reply sent.");
      await loadTicket();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || !data.ticket) {
    console.log("Ticket Detail: Data is missing or incomplete", data);
    return null;
  }

  // Safety first: log the data to help debug in F12 console
  console.log("Ticket Detail Data:", data);

  const { ticket, messages = [], history = [] } = data;
  
  // Safe filtering
  const publicMessages = Array.isArray(messages) ? messages.filter((m) => m && !m.is_internal) : [];
  const internalNotes = Array.isArray(messages) ? messages.filter((m) => m && m.is_internal) : [];
  const safeHistory = Array.isArray(history) ? history : [];

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/admin/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Tickets
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket header */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-muted-foreground mb-1">
                    {ticket.ticket_number}
                  </p>
                  <CardTitle className="text-xl leading-tight">
                    {ticket.subject}
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className={statusColors[ticket.status] ?? ""}
                >
                  {formatStatus(ticket.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>

              {ticket.resolution && (
                <div className="mt-4 rounded-md border border-green-500/20 bg-green-500/5 p-3">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                    Resolution
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{ticket.resolution}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Public thread */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Public Conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {publicMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No public messages yet.</p>
              ) : (
                publicMessages.map((msg) => (
                  <div key={msg.id} className={msg.author_role === "staff" ? "pl-4 border-l-2 border-primary/30" : ""}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{msg.author_name}</span>
                      <Badge variant="outline" className="text-xs py-0 px-1.5">
                        {formatStatus(msg.author_role)}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDateTime(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Internal notes */}
          <Card className="border-amber-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="size-4 text-amber-500" />
                Internal Notes
                <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                  Staff Only
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {internalNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No internal notes yet.</p>
              ) : (
                internalNotes.map((msg) => (
                  <div key={msg.id} className="rounded-md bg-amber-500/5 border border-amber-500/10 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{msg.author_name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDateTime(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Checklist — job tickets only */}
          {ticket.type === "job" && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Checklist</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddTask((v) => !v)}
                    className="h-7 px-2 text-xs"
                  >
                    <Plus className="size-3.5 mr-1" />
                    Add Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {tasksLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="size-4 animate-spin" />
                    Loading checklist…
                  </div>
                ) : tasks.length === 0 && !showAddTask ? (
                  <p className="text-sm text-muted-foreground">
                    No tasks yet. Click &quot;Add Task&quot; to create the first one.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {tasks.map((task) => (
                      <li key={task.id} className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task)}
                          className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={task.status === "done" ? "Mark as pending" : "Mark as done"}
                        >
                          {task.status === "done" ? (
                            <CheckSquare className="size-4 text-green-500" />
                          ) : (
                            <Square className="size-4" />
                          )}
                        </button>
                        <span className={`text-sm leading-tight ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                          {task.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {showAddTask && (
                  <form onSubmit={handleAddTask} className="flex items-center gap-2 pt-1">
                    <Input
                      autoFocus
                      placeholder="Task title…"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="h-8 text-sm"
                      disabled={addingTask}
                    />
                    <Button type="submit" size="sm" className="h-8 px-3" disabled={addingTask || !newTaskTitle.trim()}>
                      {addingTask ? <Loader2 className="size-3.5 animate-spin" /> : "Add"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => { setShowAddTask(false); setNewTaskTitle(""); }}
                    >
                      Cancel
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {/* Compose */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {isInternal ? "Add Internal Note" : "Add Public Reply"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendMessage} className="space-y-3">
                <div className="flex items-center gap-3">
                  <Switch
                    id="is-internal"
                    checked={isInternal}
                    onCheckedChange={setIsInternal}
                  />
                  <Label htmlFor="is-internal" className="cursor-pointer">
                    {isInternal ? (
                      <span className="flex items-center gap-1.5 text-amber-600">
                        <Lock className="size-3.5" /> Internal note (staff only)
                      </span>
                    ) : (
                      <span>Public reply (visible to requester)</span>
                    )}
                  </Label>
                </div>
                <Textarea
                  placeholder={isInternal ? "Internal note..." : "Reply to requester..."}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  rows={4}
                  disabled={sending}
                />
                <Button type="submit" size="sm" disabled={sending || !messageBody.trim()}>
                  {sending ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <SendHorizonal className="size-4 mr-2" />
                  )}
                  {isInternal ? "Add Note" : "Send Reply"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* History / audit */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {safeHistory.map((entry) => (
                  <div key={entry.id} className="flex gap-3 text-sm">
                    <span className="text-muted-foreground shrink-0 text-xs mt-0.5">
                      {formatDateTime(entry.created_at)}
                    </span>
                    <div>
                      <span className="font-medium capitalize">
                        {entry.event_type.replace(/_/g, " ")}
                      </span>
                      {entry.old_value && entry.new_value && (
                        <span className="text-muted-foreground">
                          {" "}
                          {entry.old_value} → {entry.new_value}
                        </span>
                      )}
                      {entry.note && (
                        <span className="text-muted-foreground"> · {entry.note}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Requester info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Requester
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{ticket.requester_name ?? "Unknown"}</p>
              <p className="text-muted-foreground">{ticket.requester_email ?? "—"}</p>
              <Badge variant="outline" className="text-xs">
                {ticket.requester_role ?? "customer"}
              </Badge>
            </CardContent>
          </Card>

          {/* Ticket metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span>{formatStatus(ticket.type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span>{ticket.category}</span>
              </div>
              {ticket.subcategory && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subcategory</span>
                  <span>{ticket.subcategory}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDateTime(ticket.created_at)}</span>
              </div>
              {ticket.sla_due_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SLA Due</span>
                  <span>{formatDateTime(ticket.sla_due_at)}</span>
                </div>
              )}
              {ticket.resolved_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolved</span>
                  <span>{formatDateTime(ticket.resolved_at)}</span>
                </div>
              )}
              {ticket.sla_breached_at && (
                <Badge
                  variant="outline"
                  className="w-full justify-center bg-red-500/10 text-red-600 border-red-500/20"
                >
                  SLA BREACHED · {formatDateTime(ticket.sla_breached_at)}
                </Badge>
              )}
              {ticket.sla_breached && !ticket.sla_breached_at && (
                <Badge
                  variant="outline"
                  className="w-full justify-center bg-red-500/10 text-red-600 border-red-500/20"
                >
                  SLA Breached
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Admin actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["open", "in_progress", "waiting_requester", "waiting_internal", "escalated", "resolved", "closed", "cancelled"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {formatStatus(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["low", "normal", "high", "urgent", "critical"].map((p) => (
                      <SelectItem key={p} value={p}>
                        {formatStatus(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Queue</Label>
                <Select value={queueId || "_none"} onValueChange={(v) => setQueueId(v === "_none" ? "" : v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No queue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">No queue</SelectItem>
                    {queues.map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        {q.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Assigned Team</Label>
                <Select value={assignedTeam || "_none"} onValueChange={(v) => setAssignedTeam(v === "_none" ? "" : v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Unassigned</SelectItem>
                    {["support", "finance", "tech", "ops", "content", "moderation"].map((t) => (
                      <SelectItem key={t} value={t}>
                        {formatStatus(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-1.5">
                <Label className="text-xs">Resolution Note</Label>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Resolution summary..."
                  rows={3}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleSave}
                disabled={saving}
              >
                {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
