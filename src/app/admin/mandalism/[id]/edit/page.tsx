"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

type ContentType = "live_stream" | "video" | "document" | "youtube" | "announcement";

interface ContentForm {
  content_type: ContentType;
  title: string;
  description: string;
  url: string;
  pdf_url: string;
  content_body: string;
  content_thumbnail_url: string;
  duration_label: string;
  start_at: string;
  end_at: string;
  access_control: string;
  priority: string;
  is_published: boolean;
}

const CONTENT_TYPE_OPTIONS: {
  value: ContentType;
  label: string;
  icon: string;
  description: string;
}[] = [
  { value: "live_stream", label: "Live Stream", icon: "📡", description: "Scheduled live broadcast" },
  { value: "video", label: "Video", icon: "🎬", description: "Recorded video session" },
  { value: "document", label: "Document", icon: "📄", description: "PDF guide or resource" },
  { value: "youtube", label: "YouTube", icon: "▶️", description: "YouTube video embed" },
  { value: "announcement", label: "Announcement", icon: "📢", description: "Community announcement" },
];

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function extractYouTubeId(input: string): string {
  if (!input) return "";
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim();
  try {
    const url = new URL(input);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1);
    if (url.searchParams.has("v")) return url.searchParams.get("v")!;
    const match = url.pathname.match(/\/embed\/([^/?]+)/);
    if (match) return match[1];
  } catch {
    // not a URL
  }
  return input.trim();
}

export default function EditMandalismContentPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ContentForm>({
    content_type: "announcement",
    title: "",
    description: "",
    url: "",
    pdf_url: "",
    content_body: "",
    content_thumbnail_url: "",
    duration_label: "",
    start_at: "",
    end_at: "",
    access_control: "members",
    priority: "0",
    is_published: false,
  });

  // For youtube type: the input field may hold an ID or full URL
  const [youtubeInput, setYoutubeInput] = useState("");

  useEffect(() => {
    fetch(`/api/admin/mandalism/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        const ct: ContentType = data.content_type ?? "announcement";
        setForm({
          content_type: ct,
          title: data.title ?? "",
          description: data.description ?? "",
          url: ct !== "youtube" ? (data.url ?? "") : "",
          pdf_url: data.pdf_url ?? "",
          content_body: data.content_body ?? "",
          content_thumbnail_url: data.content_thumbnail_url ?? "",
          duration_label: data.duration_label ?? "",
          start_at: toDatetimeLocal(data.start_at),
          end_at: toDatetimeLocal(data.end_at),
          access_control: data.access_control ?? "members",
          priority: data.priority != null ? String(data.priority) : "0",
          is_published: data.is_published ?? false,
        });
        if (ct === "youtube") setYoutubeInput(data.url ?? "");
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load content");
        setLoading(false);
      });
  }, [id]);

  const showStreamUrl = form.content_type === "live_stream";
  const showVideoUrl = form.content_type === "video";
  const showYoutube = form.content_type === "youtube";
  const showPdfUrl = form.content_type === "document";
  const showContentBody = form.content_type === "announcement";
  const showDates = form.content_type === "live_stream";
  const showThumbnail = form.content_type === "video" || form.content_type === "document";
  const showDuration = form.content_type === "video";

  const youtubeId = extractYouTubeId(youtubeInput);
  const youtubePreviewUrl = youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : null;

  function validate(): string | null {
    if (!form.title.trim()) return "Title is required.";
    if (showStreamUrl && !form.url.trim()) return "Stream URL is required.";
    if (showVideoUrl && !form.url.trim()) return "Video URL is required.";
    if (showYoutube && !youtubeInput.trim()) return "YouTube video ID or URL is required.";
    if (showContentBody && !form.content_body.trim()) return "Announcement text is required.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    const resolvedUrl = showYoutube
      ? youtubeId || null
      : showStreamUrl || showVideoUrl
      ? form.url || null
      : null;

    const res = await fetch(`/api/admin/mandalism/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content_type: form.content_type,
        title: form.title.trim(),
        description: form.description.trim() || null,
        url: resolvedUrl,
        pdf_url: showPdfUrl ? (form.pdf_url.trim() || null) : null,
        content_body: showContentBody ? (form.content_body.trim() || null) : null,
        content_thumbnail_url: showThumbnail
          ? (form.content_thumbnail_url.trim() || null)
          : null,
        duration_label: showDuration ? (form.duration_label.trim() || null) : null,
        start_at: showDates && form.start_at ? new Date(form.start_at).toISOString() : null,
        end_at: showDates && form.end_at ? new Date(form.end_at).toISOString() : null,
        access_control: form.access_control,
        priority: parseInt(form.priority, 10) || 0,
        is_published: form.is_published,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to update content");
      setSaving(false);
      return;
    }

    router.push("/admin/mandalism");
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/admin/mandalism/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/mandalism");
    } else {
      setError("Failed to delete content");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/mandalism"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Mandalism Content
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Edit Content</h1>
        <p className="text-muted-foreground">Update content details for the Mandalism library.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type selector cards */}
        <Card>
          <CardHeader>
            <CardTitle>Content Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {CONTENT_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, content_type: opt.value })}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-colors ${
                    form.content_type === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-muted-foreground/40"
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-xs text-muted-foreground leading-snug">{opt.description}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Core fields */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Content Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Enter content title"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional short description"
              />
            </div>

            {/* Live stream URL */}
            {showStreamUrl && (
              <div className="space-y-2">
                <Label htmlFor="url">Stream URL *</Label>
                <Input
                  id="url"
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://stream.example.com/…"
                />
              </div>
            )}

            {/* Video URL */}
            {showVideoUrl && (
              <div className="space-y-2">
                <Label htmlFor="url">Video URL *</Label>
                <Input
                  id="url"
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://…"
                />
              </div>
            )}

            {/* Thumbnail (video + document) */}
            {showThumbnail && (
              <div className="space-y-2">
                <Label htmlFor="content_thumbnail_url">
                  {form.content_type === "document" ? "Cover Image URL" : "Thumbnail URL"}
                </Label>
                <Input
                  id="content_thumbnail_url"
                  type="url"
                  value={form.content_thumbnail_url}
                  onChange={(e) =>
                    setForm({ ...form, content_thumbnail_url: e.target.value })
                  }
                  placeholder="https://…"
                />
                {form.content_thumbnail_url && (
                  <img
                    src={form.content_thumbnail_url}
                    alt="Thumbnail preview"
                    className="mt-2 h-24 rounded object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
              </div>
            )}

            {/* Duration (video only) */}
            {showDuration && (
              <div className="space-y-2">
                <Label htmlFor="duration_label">Duration</Label>
                <Input
                  id="duration_label"
                  value={form.duration_label}
                  onChange={(e) => setForm({ ...form, duration_label: e.target.value })}
                  placeholder="e.g. 45 min"
                  maxLength={20}
                />
              </div>
            )}

            {/* PDF URL */}
            {showPdfUrl && (
              <div className="space-y-2">
                <Label htmlFor="pdf_url">PDF URL</Label>
                <Input
                  id="pdf_url"
                  type="url"
                  value={form.pdf_url}
                  onChange={(e) => setForm({ ...form, pdf_url: e.target.value })}
                  placeholder="https://…"
                />
              </div>
            )}

            {/* YouTube */}
            {showYoutube && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="youtube_input">YouTube Video ID or URL *</Label>
                  <Input
                    id="youtube_input"
                    value={youtubeInput}
                    onChange={(e) => setYoutubeInput(e.target.value)}
                    placeholder="dQw4w9WgXcQ or https://youtube.com/watch?v=…"
                  />
                  {youtubeId && (
                    <p className="text-xs text-muted-foreground">
                      Resolved ID: <code className="font-mono">{youtubeId}</code>
                    </p>
                  )}
                </div>
                {youtubePreviewUrl && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Preview</p>
                    <div className="aspect-video w-full overflow-hidden rounded-lg border">
                      <iframe
                        src={youtubePreviewUrl}
                        title="YouTube preview"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Announcement body */}
            {showContentBody && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content_body">Announcement Text *</Label>
                  <span className="text-xs text-muted-foreground">
                    {form.content_body.length} chars
                  </span>
                </div>
                <Textarea
                  id="content_body"
                  rows={8}
                  value={form.content_body}
                  onChange={(e) => setForm({ ...form, content_body: e.target.value })}
                  placeholder="Write the announcement body…"
                />
              </div>
            )}

            {/* Scheduled dates (live stream) */}
            {showDates && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_at">Scheduled Start</Label>
                  <Input
                    id="start_at"
                    type="datetime-local"
                    value={form.start_at}
                    onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_at">Scheduled End</Label>
                  <Input
                    id="end_at"
                    type="datetime-local"
                    value={form.end_at}
                    onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Access */}
            <div className="space-y-2">
              <Label>Access Control</Label>
              <div className="flex gap-3">
                {(["free", "members"] as const).map((a) => (
                  <label
                    key={a}
                    className={`flex flex-1 cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 transition-colors ${
                      form.access_control === a
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name="access_control"
                      value={a}
                      checked={form.access_control === a}
                      onChange={() => setForm({ ...form, access_control: a })}
                      className="sr-only"
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {a === "free" ? "Free" : "Members Only"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a === "free"
                          ? "Visible to all visitors"
                          : "Requires active Mandalism subscription"}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">
                Priority{" "}
                <span className="text-xs text-muted-foreground font-normal">(0–100, higher = shown first)</span>
              </Label>
              <Input
                id="priority"
                type="number"
                min="0"
                max="100"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-28"
              />
            </div>

            {/* Published toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Published</p>
                <p className="text-xs text-muted-foreground">
                  Published content is visible to eligible members
                </p>
              </div>
              <Switch
                checked={form.is_published}
                onCheckedChange={(checked) => setForm({ ...form, is_published: checked })}
              />
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-3">
                <Button type="submit" disabled={saving || deleting}>
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/mandalism")}
                  disabled={saving || deleting}
                >
                  Cancel
                </Button>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={saving || deleting}
                  >
                    <Trash2 className="mr-2 size-4" />
                    {deleting ? "Deleting…" : "Delete"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this content?</AlertDialogTitle>
                    <AlertDialogDescription>
                      <strong>{form.title}</strong> will be permanently deleted. This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={handleDelete}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
