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
import { Checkbox } from "@/components/ui/checkbox";

type ContentType = "live_stream" | "video" | "document" | "youtube" | "announcement";

interface ContentForm {
  content_type: ContentType;
  title: string;
  description: string;
  url: string;
  pdf_url: string;
  content_body: string;
  start_at: string;
  end_at: string;
  access_control: string;
  priority: string;
  is_published: boolean;
}

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditMandalismContentPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ContentForm>({
    content_type: "announcement",
    title: "",
    description: "",
    url: "",
    pdf_url: "",
    content_body: "",
    start_at: "",
    end_at: "",
    access_control: "members",
    priority: "0",
    is_published: false,
  });

  useEffect(() => {
    fetch(`/api/admin/mandalism/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          content_type: data.content_type ?? "announcement",
          title: data.title ?? "",
          description: data.description ?? "",
          url: data.url ?? "",
          pdf_url: data.pdf_url ?? "",
          content_body: data.content_body ?? "",
          start_at: toDatetimeLocal(data.start_at),
          end_at: toDatetimeLocal(data.end_at),
          access_control: data.access_control ?? "members",
          priority: data.priority != null ? String(data.priority) : "0",
          is_published: data.is_published ?? false,
        });
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load content");
        setLoading(false);
      });
  }, [id]);

  const showUrl = ["live_stream", "video", "youtube"].includes(form.content_type);
  const showPdfUrl = form.content_type === "document";
  const showContentBody = form.content_type === "announcement";
  const showDates = form.content_type === "live_stream";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/admin/mandalism/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content_type: form.content_type,
        title: form.title,
        description: form.description || null,
        url: showUrl ? (form.url || null) : null,
        pdf_url: showPdfUrl ? (form.pdf_url || null) : null,
        content_body: showContentBody ? (form.content_body || null) : null,
        start_at: showDates && form.start_at ? new Date(form.start_at).toISOString() : null,
        end_at: showDates && form.end_at ? new Date(form.end_at).toISOString() : null,
        access_control: form.access_control,
        priority: parseInt(form.priority) || 0,
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
    if (!confirm("Delete this content? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/mandalism/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/mandalism");
    else setError("Failed to delete content");
  }

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading…</div>;

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
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Content Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content_type">Content Type *</Label>
              <select
                id="content_type"
                value={form.content_type}
                onChange={(e) => setForm({ ...form, content_type: e.target.value as ContentType })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="live_stream">Live Stream</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
                <option value="youtube">YouTube</option>
                <option value="announcement">Announcement</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {showUrl && (
              <div className="space-y-2">
                <Label htmlFor="url">
                  {form.content_type === "live_stream" ? "Stream URL" : "Video URL"}
                </Label>
                <Input
                  id="url"
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://"
                />
              </div>
            )}

            {showPdfUrl && (
              <div className="space-y-2">
                <Label htmlFor="pdf_url">PDF URL</Label>
                <Input
                  id="pdf_url"
                  type="url"
                  value={form.pdf_url}
                  onChange={(e) => setForm({ ...form, pdf_url: e.target.value })}
                  placeholder="https://"
                />
              </div>
            )}

            {showContentBody && (
              <div className="space-y-2">
                <Label htmlFor="content_body">Announcement Text</Label>
                <Textarea
                  id="content_body"
                  rows={6}
                  value={form.content_body}
                  onChange={(e) => setForm({ ...form, content_body: e.target.value })}
                />
              </div>
            )}

            {showDates && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_at">Start Time</Label>
                  <Input
                    id="start_at"
                    type="datetime-local"
                    value={form.start_at}
                    onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_at">End Time</Label>
                  <Input
                    id="end_at"
                    type="datetime-local"
                    value={form.end_at}
                    onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="access_control">Access</Label>
              <select
                id="access_control"
                value={form.access_control}
                onChange={(e) => setForm({ ...form, access_control: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="free">Free (visible to all)</option>
                <option value="members">Members only</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                min="0"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="is_published"
                checked={form.is_published}
                onCheckedChange={(checked) => setForm({ ...form, is_published: !!checked })}
              />
              <Label htmlFor="is_published">Published</Label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/mandalism")}
                >
                  Cancel
                </Button>
              </div>
              <Button type="button" variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
