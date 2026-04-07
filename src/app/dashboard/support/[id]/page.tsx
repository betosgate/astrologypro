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
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, SendHorizonal, X } from "lucide-react";

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
  resolution: string | null;
  created_at: string;
  updated_at: string;
}

interface TicketMessage {
  id: string;
  author_name: string;
  author_role: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}

interface TicketData {
  ticket: Ticket;
  messages: TicketMessage[];
}

// ─── Status helpers ───────────────────────────────────────────────────────────

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

function formatStatus(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const ticketId = params.id;

  const [data, setData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);

  const loadTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`);
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail ?? "Failed to load ticket.");
        router.push("/dashboard/support");
        return;
      }
      const json: TicketData = await res.json();
      setData(json);
    } catch {
      toast.error("Failed to load ticket.");
    } finally {
      setLoading(false);
    }
  }, [ticketId, router]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Failed to send reply.");
      }
      setReplyBody("");
      toast.success("Reply sent.");
      await loadTicket();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reply.");
    } finally {
      setSending(false);
    }
  }

  async function handleClose() {
    setClosing(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Failed to close ticket.");
      }
      toast.success("Ticket closed.");
      await loadTicket();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to close ticket.");
    } finally {
      setClosing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const { ticket, messages } = data;
  const isClosed = ticket.status === "closed" || ticket.status === "cancelled";
  const isResolved = ticket.status === "resolved";

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/support"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Support
      </Link>

      {/* Ticket header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-muted-foreground mb-1">
                {ticket.ticket_number}
              </p>
              <CardTitle className="text-xl leading-tight">
                {ticket.subject}
              </CardTitle>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <Badge
                variant="outline"
                className={statusColors[ticket.status] ?? ""}
              >
                {formatStatus(ticket.status)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {ticket.priority}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span>Category: <strong className="text-foreground">{ticket.category}</strong></span>
            <span>Opened: <strong className="text-foreground">{formatDateTime(ticket.created_at)}</strong></span>
          </div>

          <Separator />

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
          </div>

          {/* Resolution note */}
          {isResolved && ticket.resolution && (
            <div className="rounded-md border border-green-500/20 bg-green-500/5 p-3">
              <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                Resolution
              </p>
              <p className="text-sm whitespace-pre-wrap">{ticket.resolution}</p>
            </div>
          )}

          {/* Close action */}
          {!isClosed && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={closing}
                className="text-muted-foreground"
              >
                {closing ? (
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                ) : (
                  <X className="size-3.5 mr-1.5" />
                )}
                Mark as Resolved &amp; Close
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message thread */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No messages yet. Add a reply below.
            </p>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isStaff = msg.author_role === "staff";
                return (
                  <div key={msg.id} className={isStaff ? "pl-4 border-l-2 border-primary/30" : ""}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{msg.author_name}</span>
                      {isStaff && (
                        <Badge variant="outline" className="text-xs py-0 px-1.5">
                          Support
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDateTime(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reply form */}
          {!isClosed && (
            <>
              <Separator />
              <form onSubmit={handleReply} className="space-y-3">
                <Textarea
                  placeholder="Write a reply..."
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows={4}
                  disabled={sending}
                />
                <Button type="submit" size="sm" disabled={sending || !replyBody.trim()}>
                  {sending ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <SendHorizonal className="size-4 mr-2" />
                  )}
                  Send Reply
                </Button>
              </form>
            </>
          )}

          {isClosed && (
            <p className="text-sm text-muted-foreground italic">
              This ticket is closed. No further replies can be added.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
