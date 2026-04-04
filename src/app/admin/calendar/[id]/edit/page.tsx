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

interface EventForm {
  title: string;
  description: string;
  category: string;
  start_at: string;
  end_at: string;
  display_for: string;
  priority: string;
  is_active: boolean;
}

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditCalendarEventPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<EventForm>({
    title: "",
    description: "",
    category: "",
    start_at: "",
    end_at: "",
    display_for: "members",
    priority: "0",
    is_active: true,
  });

  useEffect(() => {
    fetch(`/api/admin/calendar/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          title: data.title ?? "",
          description: data.description ?? "",
          category: data.category ?? "",
          start_at: toDatetimeLocal(data.start_at),
          end_at: toDatetimeLocal(data.end_at),
          display_for: data.display_for ?? "members",
          priority: data.priority != null ? String(data.priority) : "0",
          is_active: data.is_active ?? true,
        });
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load event");
        setLoading(false);
      });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/admin/calendar/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description || null,
        category: form.category || null,
        start_at: form.start_at ? new Date(form.start_at).toISOString() : null,
        end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
        display_for: form.display_for,
        priority: parseInt(form.priority) || 0,
        is_active: form.is_active,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to update event");
      setSaving(false);
      return;
    }

    router.push("/admin/calendar");
  }

  async function handleDelete() {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/calendar/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/calendar");
    else setError("Failed to delete event");
  }

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/calendar"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Calendar
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Edit Event</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. New Moon, Live Class, Study Circle"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_at">Start *</Label>
                <Input
                  id="start_at"
                  type="datetime-local"
                  value={form.start_at}
                  onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_at">End</Label>
                <Input
                  id="end_at"
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_for">Audience *</Label>
              <select
                id="display_for"
                value={form.display_for}
                onChange={(e) => setForm({ ...form, display_for: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="public">Public</option>
                <option value="members">Members</option>
                <option value="students">Students (Mystery School)</option>
                <option value="members_and_guests">Members & Guests</option>
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
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: !!checked })}
              />
              <Label htmlFor="is_active">Active</Label>
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
                  onClick={() => router.push("/admin/calendar")}
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
