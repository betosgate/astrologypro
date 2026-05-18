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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, SendHorizonal, X, Clock, Star, Paperclip, FileText, Download, User, LifeBuoy, ExternalLink, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  assigned_to: string | null;
  assigned_team: string | null;
  attachments?: TicketAttachment[];
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
  author_user_id: string;
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

// ─── Attachment helpers ───────────────────────────────────────────────────────

function getAttachmentExtension(attachment: TicketAttachment) {
  const cleanName = attachment.name.split("?")[0] ?? "";
  const cleanUrl = attachment.url.split("?")[0] ?? "";
  return (cleanName.split(".").pop() || cleanUrl.split(".").pop() || "").toLowerCase();
}

function isPreviewableImage(attachment: TicketAttachment) {
  const ext = getAttachmentExtension(attachment);
  return attachment.type.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
}

function isPreviewablePdf(attachment: TicketAttachment) {
  return attachment.type === "application/pdf" || getAttachmentExtension(attachment) === "pdf";
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [selectedAttachment, setSelectedAttachment] = useState<TicketAttachment | null>(null);
  const [replyAttachments, setReplyAttachments] = useState<TicketAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [internalNoteBody, setInternalNoteBody] = useState("");
  const [sendingInternal, setSendingInternal] = useState(false);
  const [internalNoteAttachments, setInternalNoteAttachments] = useState<TicketAttachment[]>([]);
  const [uploadingInternal, setUploadingInternal] = useState(false);

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

      // Get current user if not already set
      if (!currentUser) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
      }
    } catch {
      toast.error("Failed to load ticket.");
    } finally {
      setLoading(false);
    }
  }, [ticketId, router, currentUser]);

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
          attachments: replyAttachments,
          is_internal: false
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
 
  async function handleAddInternalNote() {
    if (!internalNoteBody.trim()) return;
 
    setSendingInternal(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          body: internalNoteBody.trim(),
          is_internal: true,
          attachments: internalNoteAttachments
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Failed to save private note.");
      }
      setInternalNoteBody("");
      setInternalNoteAttachments([]);
      toast.success("Private note added.");
      await loadTicket();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save private note.");
    } finally {
      setSendingInternal(false);
    }
  }
 
  async function handleInternalFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
 
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }
 
    setUploadingInternal(true);
    const body = new FormData();
    body.append("file", file);
    body.append("kind", "ticket");
 
    try {
      const res = await fetch("/api/support/tickets/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
 
      setInternalNoteAttachments((prev) => [
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
      setUploadingInternal(false);
      e.target.value = "";
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
      const res = await fetch("/api/support/tickets/upload", { method: "POST", body });
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
      <div className="mt-2 flex flex-wrap gap-2">
        {attachments.map((att, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelectedAttachment(att)}
            className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1 text-[10px] hover:bg-muted/50 transition-colors"
          >
            <FileText className="size-3 text-muted-foreground" />
            <span className="max-w-[120px] truncate">{att.name}</span>
            <Download className="size-2.5 text-muted-foreground ml-1" />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const { ticket, messages } = data;
  // Find the last staff response (either public reply or internal note)
  const lastStaffMsg = messages.filter((m) => m.author_role === "staff").slice(-1)[0];
  const assigneeName = ticket.assigned_to 
    ? ((ticket as any).metadata?.assignee_name || "Support Agent")
    : (lastStaffMsg?.author_name ?? null);
  const assigneeEmail = ticket.assigned_to
    ? ((ticket as any).metadata?.assignee_email || null)
    : null;

  const isClosed = ticket.status === "closed" || ticket.status === "cancelled";
  const isResolved = ticket.status === "resolved";
  const showCsat = isResolved || isClosed;

  return (
    <>
    <div className="space-y-4">
      {/* Back */}
      <Link
        href="/community/support"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Support
      </Link>

      {/* Two-column layout */}
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
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{ticket.description}</p>
              </div>

              {renderAttachments(ticket.attachments)}

              {/* Resolution note */}
              {isResolved && ticket.resolution && (
                <div className="mt-4 rounded-md border border-green-500/20 bg-green-500/5 p-3">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                    Resolution
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{ticket.resolution}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader className="pb-3 border-b border-amber-500/10">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-600">
                <Lock className="size-4" />
                Internal Notes
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                  Owner Eyes Only
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1">
                {messages.filter((m) => m.is_internal).length === 0 ? (
                  <div className="text-sm text-muted-foreground italic text-center py-4">
                    No internal notes yet.
                  </div>
                ) : (
                  messages
                    .filter((m) => m.is_internal)
                    .map((note) => (
                      <div key={note.id} className="rounded-lg bg-background border border-amber-500/20 p-3">
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground mb-1.5">
                          <span className="font-semibold text-amber-600">{note.author_name}</span>
                          <span>{formatDateTime(note.created_at)}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{note.body}</p>
                        {renderAttachments(note.attachments)}
                      </div>
                    ))
                )}
              </div>
 
              {/* Dedicated Private Note Composer */}
              <div className="border-t border-amber-500/10 pt-4 mt-4 space-y-3">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Write a private note (only visible to you and support)..."
                    value={internalNoteBody}
                    onChange={(e) => setInternalNoteBody(e.target.value)}
                    rows={2}
                    className="resize-none bg-background border-amber-500/20 focus-visible:ring-amber-500 text-sm"
                    disabled={sendingInternal}
                  />

                  {internalNoteAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {internalNoteAttachments.map((att) => (
                        <div key={att.url} className="flex items-center gap-2 rounded-md border border-amber-500/20 bg-background px-2 py-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setSelectedAttachment(att)}
                            className="flex items-center gap-1.5 hover:text-amber-600 transition-colors"
                          >
                            <FileText className="size-3" />
                            <span className="max-w-[100px] truncate">{att.name}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setInternalNoteAttachments(prev => prev.filter(a => a.url !== att.url))}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="internal-file-upload"
                        className="hidden"
                        onChange={handleInternalFileUpload}
                        disabled={sendingInternal || uploadingInternal}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 border-amber-500/20 hover:bg-amber-500/10 text-amber-700"
                        onClick={() => document.getElementById("internal-file-upload")?.click()}
                        disabled={sendingInternal || uploadingInternal}
                      >
                        {uploadingInternal ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Paperclip className="size-3.5" />
                        )}
                        <span className="sr-only">Attach file</span>
                      </Button>
                    </div>

                    <Button
                      type="button"
                      onClick={handleAddInternalNote}
                      disabled={sendingInternal || (!internalNoteBody.trim() && internalNoteAttachments.length === 0)}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 px-3 flex items-center gap-1.5"
                    >
                      {sendingInternal ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Lock className="size-3.5" />
                          Save Private Note
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversation thread */}
          <Card className="flex flex-col h-[600px]">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <SendHorizonal className="size-4 text-primary" />
                Conversation
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">
                  No messages yet. Add a reply below.
                </div>
              ) : (
                <div className="space-y-4">
                  {messages
                    .filter((m) => !m.is_internal)
                    .map((msg) => {
                      const isMe = msg.author_user_id === currentUser?.id;
                      const isStaff = msg.author_role === "staff";
                      
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex flex-col max-w-[85%] sm:max-w-[75%]",
                            isMe ? "ml-auto items-end" : "mr-auto items-start"
                          )}
                        >
                          <div className={cn(
                            "flex items-center gap-2 mb-1 px-1",
                            isMe ? "flex-row-reverse" : "flex-row"
                          )}>
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {isMe ? "Me" : msg.author_name}
                            </span>
                            {isStaff && !isMe && (
                              <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-primary/10 text-primary border-primary/20">
                                Support
                              </Badge>
                            )}
                          </div>
                          
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-2 text-sm shadow-sm",
                              isMe 
                                ? "bg-primary text-primary-foreground rounded-tr-none" 
                                : "bg-muted border rounded-tl-none"
                            )}
                          >
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                            {renderAttachments(msg.attachments)}
                          </div>
                          
                          <span className="text-[9px] text-muted-foreground mt-1 px-1">
                            {formatDateTime(msg.created_at)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>

            {/* Reply form */}
            <div className="p-4 border-t bg-muted/10">
              {!isClosed ? (
                <form onSubmit={handleReply} className="space-y-3">
                  <div>
                    <Textarea
                      placeholder="Write a reply..."
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      rows={3}
                      className="resize-none bg-background"
                      disabled={sending}
                    />
                  </div>

                  {replyAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {replyAttachments.map((att) => (
                        <div key={att.url} className="flex items-center gap-2 rounded-md border bg-background px-2 py-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setSelectedAttachment(att)}
                            className="flex items-center gap-1.5 hover:text-primary transition-colors"
                          >
                            <FileText className="size-3" />
                            <span className="max-w-[100px] truncate">{att.name}</span>
                          </button>
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
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 p-0 text-muted-foreground hover:text-primary"
                        onClick={() => document.getElementById("file-upload")?.click()}
                        disabled={sending || uploading}
                      >
                        {uploading ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Paperclip className="size-4" />
                        )}
                      </Button>
                      {uploading && <span className="text-[10px] text-muted-foreground animate-pulse">Uploading...</span>}
                    </div>

                    <Button type="submit" size="sm" disabled={sending || (!replyBody.trim() && replyAttachments.length === 0)}>
                      {sending ? (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                      ) : (
                        <SendHorizonal className="size-4 mr-2" />
                      )}
                      Send Reply
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-2 text-xs text-muted-foreground italic border rounded-lg bg-muted/20">
                  This ticket is closed. No further replies can be added.
                </div>
              )}
            </div>
          </Card>

          {/* CSAT after resolution/close */}
          {showCsat && <CsatPanel ticketId={ticket.id} />}
        </div>

        {/* ── Right: context sidebar ───────────────────────────────────── */}
        <div className="space-y-4">
          {/* Ticket metadata */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ticket Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ticket #</span>
                <span className="font-mono text-xs">{ticket.ticket_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span>{ticket.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className={cn("text-[10px] h-5", statusColors[ticket.status] ?? "")}>
                  {formatStatus(ticket.status)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority</span>
                <Badge variant="outline" className={cn("text-[10px] h-5", priorityColors[ticket.priority] ?? "")}>
                  {formatStatus(ticket.priority)}
                </Badge>
              </div>
              <div className="flex justify-between items-start pt-1.5 border-t border-border mt-3">
                <span className="text-muted-foreground">Assignee</span>
                {assigneeName ? (
                  <div className="text-right">
                    <span className="font-semibold text-foreground text-xs block">
                      {assigneeName}
                    </span>
                    {assigneeEmail && (
                      <span className="text-[10px] text-muted-foreground block font-mono">
                        {assigneeEmail}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs italic text-muted-foreground">Unassigned</span>
                )}
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-3.5" />
                  <span>Opened</span>
                </div>
                <span className="text-xs">{formatDateTime(ticket.created_at)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-3.5" />
                  <span>Updated</span>
                </div>
                <span className="text-xs">{formatDateTime(ticket.updated_at)}</span>
              </div>
            </CardContent>
          </Card>

          {/* SLA clock */}
          {(ticket.sla_due_at || ticket.first_response_due_at) && (
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  SLA Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
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

          {/* Help card */}
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <LifeBuoy className="size-4" />
                <p className="text-xs font-bold">Support Guide</p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Our team usually replies within 24 hours. You will receive an email notification when a staff member replies to your ticket.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    {/* ── Attachment preview modal ─────────────────────────────────── */}
    <Dialog open={selectedAttachment !== null} onOpenChange={(open) => { if (!open) setSelectedAttachment(null); }}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-4xl">
        {selectedAttachment && (
          <div className="flex max-h-[90vh] flex-col">
            <DialogHeader className="border-b px-6 py-4 pr-12">
              <DialogTitle className="truncate text-base">
                {selectedAttachment.name}
              </DialogTitle>
              <DialogDescription>
                {(selectedAttachment.size / (1024 * 1024)).toFixed(2)} MB
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 bg-muted/20 p-4">
              {isPreviewableImage(selectedAttachment) ? (
                <div className="flex max-h-[70vh] items-center justify-center overflow-auto rounded-md border bg-background p-2">
                  <img
                    src={selectedAttachment.url}
                    alt={selectedAttachment.name}
                    className="max-h-[66vh] max-w-full rounded object-contain"
                  />
                </div>
              ) : isPreviewablePdf(selectedAttachment) ? (
                <div className="h-[70vh] overflow-hidden rounded-md border bg-background">
                  <iframe
                    src={selectedAttachment.url}
                    title={selectedAttachment.name}
                    className="h-full w-full"
                  />
                </div>
              ) : (
                <div className="flex min-h-[320px] flex-col items-center justify-center rounded-md border bg-background px-6 text-center">
                  <FileText className="mb-3 size-10 text-muted-foreground" />
                  <p className="text-sm font-medium">Preview is not available for this file type.</p>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Open the attachment in a new tab to view it with your browser or download it.
                  </p>
                  <Button className="mt-4" variant="secondary" asChild>
                    <a href={selectedAttachment.url} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 size-4" />
                      Open attachment
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
