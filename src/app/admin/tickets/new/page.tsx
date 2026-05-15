"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ExternalLink, FileText, Loader2, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_ATTACHMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const ALLOWED_ATTACHMENT_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "csv",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
];

type RequesterSuggestion = {
  id: string;
  name: string;
  email: string;
};

type TicketAttachment = {
  url: string;
  name: string;
  type: string;
  size: number;
};

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

function RequesterAutocomplete({
  id,
  type = "text",
  placeholder,
  value,
  displayField,
  onChange,
  onSelect,
}: {
  id: string;
  type?: "text" | "email";
  placeholder: string;
  value: string;
  displayField: "name" | "email";
  onChange: (value: string) => void;
  onSelect: (user: RequesterSuggestion) => void;
}) {
  const [suggestions, setSuggestions] = useState<RequesterSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef(0);

  function fetchSuggestions(q: string) {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setFetching(true);

    const params = new URLSearchParams({ limit: "5" });
    if (q.trim()) params.set("q", q.trim());

    fetch(`/api/admin/tickets/requesters?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data) => {
        if (requestRef.current !== requestId) return;
        const users = Array.isArray(data.users) ? data.users : [];
        setSuggestions(users);
        setOpen(users.length > 0);
        setActiveSuggestion(-1);
      })
      .catch(() => {
        if (requestRef.current !== requestId) return;
        setSuggestions([]);
        setOpen(false);
      })
      .finally(() => {
        if (requestRef.current === requestId) setFetching(false);
      });
  }

  function handleChange(nextValue: string) {
    onChange(nextValue);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(nextValue), 250);
  }

  function handleSelect(user: RequesterSuggestion) {
    setSuggestions([]);
    setOpen(false);
    onSelect(user);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((i) => Math.min(i + 1, suggestions.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && activeSuggestion >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeSuggestion]);
    }
    if (e.key === "Escape") setOpen(false);
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        className={fetching ? "pr-9" : undefined}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => fetchSuggestions(value)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {fetching && (
        <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin rounded-full text-muted-foreground" />
      )}
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-md border bg-popover shadow-md">
          {suggestions.map((user, idx) => (
            <button
              key={user.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(user)}
              className={cn(
                "flex w-full flex-col px-3 py-2 text-left text-sm transition-colors",
                idx === activeSuggestion
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
            >
              <span className="truncate font-medium">{user[displayField]}</span>
              <span className="truncate text-xs text-muted-foreground">
                {displayField === "name" ? user.email : user.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CreateTicketPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<TicketAttachment | null>(null);

  const [formData, setFormData] = useState({
    type: "support",
    category: "General",
    subject: "",
    description: "",
    priority: "normal",
    requester_email: "",
    requester_name: "",
    requester_role: "staff",
  });

  async function handleAttachmentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

    if (
      !ALLOWED_ATTACHMENT_TYPES.includes(file.type) &&
      !ALLOWED_ATTACHMENT_EXTENSIONS.includes(ext)
    ) {
      toast.error("Invalid file type. Allowed: PDF, DOC, Excel, JPEG, PNG, WebP, GIF.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 10 MB.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const body = new FormData();
    body.append("file", file);
    body.append("kind", "ticket");

    try {
      const data = await new Promise<{
        url: string;
        name?: string;
        type?: string;
        size?: number;
        error?: string;
      }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/support/tickets/upload");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        };

        xhr.onload = () => {
          let data: {
            url: string;
            name?: string;
            type?: string;
            size?: number;
            error?: string;
          };

          try {
            data = JSON.parse(xhr.responseText);
          } catch {
            reject(new Error("Upload failed"));
            return;
          }

          if (xhr.status < 200 || xhr.status >= 300) {
            reject(new Error(data.error ?? "Upload failed"));
            return;
          }

          setUploadProgress(100);
          resolve(data);
        };

        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.onabort = () => reject(new Error("Upload cancelled"));
        xhr.send(body);
      });

      if (!data.url) {
        toast.error(data.error ?? "Upload failed");
        return;
      }
      setAttachments((prev) => [
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
      setUploadProgress(0);
      e.target.value = "";
    }
  }

  function removeAttachment(url: string) {
    setAttachments((prev) => prev.filter((attachment) => attachment.url !== url));
    setSelectedAttachment((current) => (current?.url === url ? null : current));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.subject || !formData.description) {
      toast.error("Please fill in the subject and description.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          attachments,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Failed to create ticket.");
      }

      const ticket = await res.json();
      toast.success("Ticket created successfully!");
      router.push(`/admin/tickets`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/tickets">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold italic tracking-tight">Create New Job Ticket</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="border-primary/10 shadow-sm">
              <CardHeader>
                <CardTitle>Ticket Essentials</CardTitle>
                <CardDescription>
                  Define the core issue or task that needs attention.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Fix broken login on mobile"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide full details, steps to reproduce, or task requirements..."
                    className="min-h-[200px]"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-sm">
              <CardHeader>
                <CardTitle>Requester Details</CardTitle>
                <CardDescription>
                  Who is reporting this or who is the primary contact?
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="req_name">Name</Label>
                  <RequesterAutocomplete
                    id="req_name"
                    placeholder="Internal Staff or Customer Name"
                    value={formData.requester_name}
                    displayField="name"
                    onChange={(value) => setFormData((prev) => ({ ...prev, requester_name: value }))}
                    onSelect={(user) =>
                      setFormData((prev) => ({
                        ...prev,
                        requester_name: user.name,
                        requester_email: user.email,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="req_email">Email</Label>
                  <RequesterAutocomplete
                    id="req_email"
                    type="email"
                    placeholder="contact@example.com"
                    value={formData.requester_email}
                    displayField="email"
                    onChange={(value) => setFormData((prev) => ({ ...prev, requester_email: value }))}
                    onSelect={(user) =>
                      setFormData((prev) => ({
                        ...prev,
                        requester_name: user.name,
                        requester_email: user.email,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-sm">
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
                <CardDescription>
                  Attach supporting documents, spreadsheets, PDFs, or images.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.url}
                        role="button"
                        tabIndex={0}
                        className="flex cursor-pointer items-center gap-3 rounded-md border bg-muted/20 px-3 py-2 text-left transition-colors hover:border-primary/30 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        onClick={() => setSelectedAttachment(attachment)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedAttachment(attachment);
                          }
                        }}
                      >
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{attachment.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(attachment.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAttachment(attachment.url);
                          }}
                        >
                          <X className="size-4" />
                          <span className="sr-only">Remove attachment</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select file
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    PDF, DOC, Excel, or images up to 10MB
                  </span>
                </div>
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Uploading attachment</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAttachmentChange}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-primary/10 shadow-sm bg-muted/30">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Classification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Ticket Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="job">Job / Task</SelectItem>
                      <SelectItem value="incident">Incident</SelectItem>
                      <SelectItem value="bug">Bug</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(v) => setFormData({ ...formData, priority: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    placeholder="e.g., Finance, Tech, Content"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button type="submit" className="w-full" disabled={loading || uploading}>
                  {loading ? (
                    <Loader2 className="size-4 animate-spin mr-2" />
                  ) : (
                    <Send className="size-4 mr-2" />
                  )}
                  Create Ticket
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>

      <Dialog
        open={selectedAttachment !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedAttachment(null);
        }}
      >
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
    </div>
  );
}
