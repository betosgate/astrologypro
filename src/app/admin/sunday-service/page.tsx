"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Radio, Tv } from "lucide-react";

type Session = {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  recorded_at: string;
  is_live: boolean;
  live_starts_at: string | null;
};

const EMPTY_FORM = {
  title: "",
  description: "",
  video_url: "",
  thumbnail_url: "",
  recorded_at: new Date().toISOString().slice(0, 16),
  is_live: false,
  live_starts_at: "",
};

export default function AdminSundayServicePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/sunday-service")
      .then((r) => r.json())
      .then((d) => setSessions(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        ...form,
        recorded_at: form.recorded_at ? new Date(form.recorded_at).toISOString() : new Date().toISOString(),
        live_starts_at: form.live_starts_at ? new Date(form.live_starts_at).toISOString() : null,
        thumbnail_url: form.thumbnail_url || null,
        description: form.description || null,
      };
      const res = await fetch("/api/admin/sunday-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      const created = await res.json();
      setSessions((prev) => [created, ...prev]);
      setForm({ ...EMPTY_FORM });
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetLive(session: Session) {
    // First clear any existing live sessions, then mark this one live
    await Promise.all(
      sessions.filter((s) => s.is_live && s.id !== session.id).map((s) =>
        fetch(`/api/admin/sunday-service/${s.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_live: false }),
        })
      )
    );
    const res = await fetch(`/api/admin/sunday-service/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_live: !session.is_live }),
    });
    if (res.ok) {
      setSessions((prev) =>
        prev.map((s) => ({
          ...s,
          is_live: s.id === session.id ? !session.is_live : false,
        }))
      );
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this session?")) return;
    const res = await fetch(`/api/admin/sunday-service/${id}`, { method: "DELETE" });
    if (res.ok) setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sunday Service</h1>
          <p className="text-muted-foreground">Manage live streams and archived sessions.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} size="sm">
          <Plus className="mr-1.5 size-4" />
          Add Session
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Session</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Video URL * (YouTube, Vimeo, or embed URL)</Label>
                <Input
                  value={form.video_url}
                  onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Date / Time</Label>
                  <Input
                    type="datetime-local"
                    value={form.recorded_at}
                    onChange={(e) => setForm((f) => ({ ...f, recorded_at: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Thumbnail URL (optional)</Label>
                  <Input
                    value={form.thumbnail_url}
                    onChange={(e) => setForm((f) => ({ ...f, thumbnail_url: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_live"
                  checked={form.is_live}
                  onChange={(e) => setForm((f) => ({ ...f, is_live: e.target.checked }))}
                  className="size-4"
                />
                <Label htmlFor="is_live">Mark as LIVE now</Label>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? "Saving…" : "Save Session"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowForm(false); setError(null); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Tv className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No sessions yet. Add one above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Card key={s.id} className={s.is_live ? "border-red-400/40" : undefined}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {s.title}
                      {s.is_live && <Badge variant="destructive">LIVE</Badge>}
                    </CardTitle>
                    <CardDescription>
                      {new Date(s.recorded_at).toLocaleDateString("en-US", {
                        weekday: "short", year: "numeric", month: "short", day: "numeric",
                      })}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={s.is_live ? "destructive" : "outline"}
                      onClick={() => handleSetLive(s)}
                    >
                      <Radio className="mr-1.5 size-3.5" />
                      {s.is_live ? "End Live" : "Set Live"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(s.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {s.description && (
                <CardContent className="pt-0 pb-3">
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
