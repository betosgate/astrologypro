"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Clock, Loader2, SendHorizonal, Star, X } from "lucide-react";

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
  sla_due_at: string | null;
  sla_breached: boolean;
  first_response_due_at: string | null;
  assigned_team: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
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

function formatStatus(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function CsatPanel({ ticketId }: { ticketId: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!rating) {
      toast.error("Please select a star rating.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/csat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        if (res.status === 409) {
          setSubmitted(true);
          return;
        }
        throw new Error(err.detail ?? "Failed to submit rating.");
      }
      setSubmitted(true);
      toast.success("Thank you for your feedback.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit rating.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card className="border-green-500/20">
        <CardContent className="py-4">
          <p className="text-center text-sm font-medium text-green-600">Thank you for your feedback.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Star className="size-4 text-amber-500" />
          Rate your experience
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="p-1 transition-transform hover:scale-110"
              aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
            >
              <Star className={`size-6 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
            </button>
          ))}
        </div>
        <Textarea
          placeholder="Leave a comment (optional)"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={2}
          disabled={submitting}
        />
        <Button size="sm" onClick={handleSubmit} disabled={submitting || !rating}>
          {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          Submit Rating
        </Button>
      </CardContent>
    </Card>
  );
}

export default function CommunityTicketDetailPage() {
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
        router.push("/community/support");
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

  async function handleReply(event: React.FormEvent) {
    event.preventDefault();
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
  const canReply = !isClosed;
  const canClose = !isClosed && !isResolved;
  const showCsat = isClosed || isResolved;

  return (
    <div className="space-y-4">
      <Link href="/community/support" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Back to Support
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="mb-1 font-mono text-xs text-muted-foreground">{ticket.ticket_number}</p>
                  <CardTitle className="text-xl leading-tight">{ticket.subject}</CardTitle>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Badge variant="outline" className={statusColors[ticket.status] ?? ""}>
                    {formatStatus(ticket.status)}
                  </Badge>
                  <Badge variant="outline" className={priorityColors[ticket.priority] ?? ""}>
                    {formatStatus(ticket.priority)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
              {isResolved && ticket.resolution && (
                <div className="rounded-md border border-green-500/20 bg-green-500/5 p-3">
                  <p className="mb-1 text-xs font-semibold text-green-700 dark:text-green-400">Resolution</p>
                  <p className="whitespace-pre-wrap text-sm">{ticket.resolution}</p>
                </div>
              )}
              {canClose && (
                <div className="pt-2">
                  <Button variant="outline" size="sm" onClick={handleClose} disabled={closing} className="text-muted-foreground">
                    {closing ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <X className="mr-1.5 size-3.5" />}
                    Mark as Resolved &amp; Close
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages yet. Add a reply below.</p>
              ) : (
                <div className="space-y-4">
                  {messages
                    .filter((message) => !message.is_internal)
                    .map((message) => {
                      const isStaff = message.author_role === "staff";
                      return (
                        <div
                          key={message.id}
                          className={`rounded-md border p-3 ${isStaff ? "border-primary/10 bg-primary/5" : "border-border bg-muted/40"}`}
                        >
                          <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">{message.author_name}</span>
                            {isStaff && (
                              <Badge variant="outline" className="border-primary/20 bg-primary/10 px-1.5 py-0 text-xs text-primary">
                                Support
                              </Badge>
                            )}
                            <span className="ml-auto text-xs text-muted-foreground">{formatDateTime(message.created_at)}</span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm">{message.body}</p>
                        </div>
                      );
                    })}
                </div>
              )}

              {canReply ? (
                <>
                  <Separator />
                  <form onSubmit={handleReply} className="space-y-3">
                    <Textarea
                      placeholder="Write a reply..."
                      value={replyBody}
                      onChange={(event) => setReplyBody(event.target.value)}
                      rows={4}
                      disabled={sending}
                    />
                    <Button type="submit" size="sm" disabled={sending || !replyBody.trim()}>
                      {sending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <SendHorizonal className="mr-2 size-4" />}
                      Send Reply
                    </Button>
                  </form>
                </>
              ) : (
                <p className="text-sm italic text-muted-foreground">This ticket is closed. No further replies can be added.</p>
              )}
            </CardContent>
          </Card>

          {showCsat && <CsatPanel ticketId={ticket.id} />}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Ticket #</span>
                <span className="font-mono text-xs">{ticket.ticket_number}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Category</span>
                <span className="text-right">{ticket.category}</span>
              </div>
              {ticket.subcategory && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Subcategory</span>
                  <span className="text-right">{ticket.subcategory}</span>
                </div>
              )}
              {ticket.related_entity_type && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Related</span>
                  <span className="text-right">
                    {formatStatus(ticket.related_entity_type)}
                    {ticket.related_entity_id ? `: ${ticket.related_entity_id}` : ""}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Opened</span>
                <span className="text-right text-xs">{formatDateTime(ticket.created_at)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Updated</span>
                <span className="text-right text-xs">{formatDateTime(ticket.updated_at)}</span>
              </div>
            </CardContent>
          </Card>

          {(ticket.sla_due_at || ticket.first_response_due_at) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <Clock className="size-3.5" />
                  SLA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                {ticket.first_response_due_at && <p>First response due: {formatDateTime(ticket.first_response_due_at)}</p>}
                {ticket.sla_due_at && <p>Resolution due: {formatDateTime(ticket.sla_due_at)}</p>}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
