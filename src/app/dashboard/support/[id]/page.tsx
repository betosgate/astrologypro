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
import { ArrowLeft, Loader2, SendHorizonal, X, Clock, Star, Paperclip, FileText, Download } from "lucide-react";

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
  sla_due_at: string | null;
  sla_breached: boolean;
  first_response_due_at: string | null;
  assigned_team: string | null;
  created_at: string;
  updated_at: string;
}

interface TicketAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

interface TicketMessage {
  id: string;
  author_name: string;
  author_role: string;
  body: string;
  is_internal: boolean;
  attachments?: TicketAttachment[];
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
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── SLA clock helper ─────────────────────────────────────────────────────────

function SlaBlock({ sla_due_at, sla_breached }: { sla_due_at: string | null; sla_breached: boolean }) {
  if (!sla_due_at) return null;
  const due = new Date(sla_due_at);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const overdue = diffMs < 0 || sla_breached;
  const diffHours = Math.abs(diffMs) / (1000 * 60 * 60);
  const nearBreach = !overdue && diffHours < 2;

  const slaPill = overdue
    ? "bg-red-500/10 text-red-600 border-red-500/20"
    : nearBreach
    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
    : "bg-green-500/10 text-green-600 border-green-500/20";

  const slaLabel = overdue
    ? "SLA Breached"
    : nearBreach
    ? "Near Breach"
    : "On Track";

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground font-medium">Response SLA</p>
      <Badge variant="outline" className={`${slaPill} flex items-center gap-1.5 w-fit`}>
        <Clock className="size-3" />
        {slaLabel}
      </Badge>
      <p className="text-xs text-muted-foreground">
        Due: {formatDateTime(sla_due_at)}
      </p>
    </div>
  );
}

// ─── CSAT component ───────────────────────────────────────────────────────────

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
      toast.success("Thank you for your feedback!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit rating.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card className="border-green-500/20">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-green-600 font-medium text-center">
            Thank you for your feedback!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
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
              className="p-1 hover:scale-110 transition-transform"
              aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
            >
              <Star
                className={`size-6 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
              />
            </button>
          ))}
        </div>
        <Textarea
          placeholder="Leave a comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          disabled={submitting}
        />
        <Button size="sm" onClick={handleSubmit} disabled={submitting || !rating}>
          {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
          Submit Rating
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const ticketId = params.id;

  const [data, setData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<TicketAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
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
    if (!replyBody.trim() && replyAttachments.length === 0) return;

    setSending(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          body: replyBody.trim(),
          attachments: replyAttachments
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Failed to send reply.");
      }
      setReplyBody("");
      setReplyAttachments([]);
      toast.success("Reply sent.");
      await loadTicket();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reply.");
    } finally {
      setSending(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }

    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    body.append("kind", "ticket");

    try {
      const res = await fetch("/api/admin/tickets/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      setReplyAttachments((prev) => [
        ...prev,
        {
          url: data.url,
          name: data.name ?? file.name,
          type: data.type ?? file.type,
          size: data.size ?? file.size,
        },
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const renderAttachments = (attachments?: TicketAttachment[]) => {
    if (!attachments || attachments.length === 0) return null;
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {attachments.map((att, i) => (
          <a
            key={i}
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs hover:bg-muted/50 transition-colors"
          >
            <FileText className="size-3.5 text-muted-foreground" />
            <span className="max-w-[150px] truncate">{att.name}</span>
            <Download className="size-3 text-muted-foreground ml-1" />
          </a>
        ))}
      </div>
    );
  };

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
  const showCsat = isResolved || isClosed;

  return (
    <div className="space-y-4">
      {/* Back */}
      <Link
        href="/dashboard/support"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Support
      </Link>

      {/* Two-column layout: conversation left, context sidebar right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: main conversation ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
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
                  <Badge
                    variant="outline"
                    className={priorityColors[ticket.priority] ?? ""}
                  >
                    {formatStatus(ticket.priority)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
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
              {!isClosed && !isResolved && (
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

          {/* Conversation thread */}
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
                  {messages
                    .filter((m) => !m.is_internal)
                    .map((msg) => {
                      const isStaff = msg.author_role === "staff";
                      return (
                        <div
                          key={msg.id}
                          className={`rounded-md p-3 ${isStaff ? "bg-primary/5 border border-primary/10" : "bg-muted/40 border border-border"}`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm font-medium">{msg.author_name}</span>
                            {isStaff && (
                              <Badge variant="outline" className="text-xs py-0 px-1.5 bg-primary/10 text-primary border-primary/20">
                                Support
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {formatDateTime(msg.created_at)}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                          {renderAttachments(msg.attachments)}
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

                    {replyAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {replyAttachments.map((att) => (
                          <div key={att.url} className="flex items-center gap-2 rounded-md border bg-muted/50 px-2 py-1 text-xs">
                            <FileText className="size-3" />
                            <span className="max-w-[100px] truncate">{att.name}</span>
                            <button
                              type="button"
                              onClick={() => setReplyAttachments(prev => prev.filter(a => a.url !== att.url))}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <Button type="submit" size="sm" disabled={sending || (!replyBody.trim() && replyAttachments.length === 0)}>
                        {sending ? (
                          <Loader2 className="size-4 mr-2 animate-spin" />
                        ) : (
                          <SendHorizonal className="size-4 mr-2" />
                        )}
                        Send Reply
                      </Button>

                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => document.getElementById("file-upload")?.click()}
                          disabled={sending || uploading}
                          className="text-muted-foreground"
                        >
                          {uploading ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Paperclip className="size-3.5 mr-1.5" />
                          )}
                          Attach File
                        </Button>
                      </div>
                    </div>
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

          {/* CSAT after resolution/close */}
          {showCsat && <CsatPanel ticketId={ticket.id} />}
        </div>

        {/* ── Right: context sidebar ───────────────────────────────────── */}
        <div className="space-y-4">
          {/* Ticket metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Ticket Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ticket #</span>
                <span className="font-mono text-xs">{ticket.ticket_number}</span>
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
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className={`text-xs ${statusColors[ticket.status] ?? ""}`}>
                  {formatStatus(ticket.status)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority</span>
                <Badge variant="outline" className={`text-xs ${priorityColors[ticket.priority] ?? ""}`}>
                  {formatStatus(ticket.priority)}
                </Badge>
              </div>
              {ticket.assigned_team && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team</span>
                  <span>{formatStatus(ticket.assigned_team)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Opened</span>
                <span className="text-xs">{formatDateTime(ticket.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span className="text-xs">{formatDateTime(ticket.updated_at)}</span>
              </div>
            </CardContent>
          </Card>

          {/* SLA clock */}
          {(ticket.sla_due_at || ticket.first_response_due_at) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  SLA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticket.first_response_due_at && (
                  <SlaBlock
                    sla_due_at={ticket.first_response_due_at}
                    sla_breached={ticket.sla_breached}
                  />
                )}
                {ticket.sla_due_at && (
                  <SlaBlock
                    sla_due_at={ticket.sla_due_at}
                    sla_breached={ticket.sla_breached}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Help text */}
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="pt-4 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">What happens next?</p>
              <p className="text-xs text-muted-foreground">
                Our support team will review your ticket and reply as soon as possible. You will see their
                response in the Conversation panel on the left.
              </p>
              <p className="text-xs text-muted-foreground">
                Once your issue is resolved, you can close the ticket or leave a satisfaction rating.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
