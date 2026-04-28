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

interface RitualForm {
  name: string;
  description: string;
  instructions: string;
  priority: string;
  is_active: boolean;
  video_url: string;
}

export default function EditRitualPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<RitualForm>({
    name: "",
    description: "",
    instructions: "",
    priority: "",
    is_active: true,
    video_url: "",
  });

  useEffect(() => {
    fetch(`/api/admin/rituals/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name: data.name ?? "",
          description: data.description ?? "",
          instructions: data.instructions ?? "",
          priority: data.priority != null ? String(data.priority) : "",
          is_active: data.is_active ?? true,
          video_url: data.video_url ?? "",
        });
        setLoading(false);
      })
      .catch(() => { setError("Failed to load ritual"); setLoading(false); });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/admin/rituals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        instructions: form.instructions,
        priority: form.priority ? parseInt(form.priority) : 0,
        is_active: form.is_active,
        video_url: form.video_url || null,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to update ritual");
      setSaving(false);
      return;
    }
    router.push("/admin/rituals");
  }

  async function handleDelete() {
    if (!confirm("Delete this ritual? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/rituals/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/rituals");
    else setError("Failed to delete ritual");
  }

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/rituals/legacy-invocations" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Legacy Invocations
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Edit Legacy Ritual Invocation</h1>
        <p className="text-xs text-muted-foreground mt-1">
          This screen edits a row in the legacy <code>ritual_invocations</code> table.
          New configuration work should happen on the Ritual Configurations module.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Ritual Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea id="instructions" rows={6} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input id="priority" type="number" min="0" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video_url">Video URL</Label>
              <Input
                id="video_url"
                type="url"
                placeholder="https://example.com/ritual-step.mp4"
                value={form.video_url}
                onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Optional. Direct video URL (mp4/webm). When present, shown to the practitioner with auto-advance on completion.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="is_active" checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: !!checked })} />
              <Label htmlFor="is_active">Active</Label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
                <Button type="button" variant="outline" onClick={() => router.push("/admin/rituals")}>Cancel</Button>
              </div>
              <Button type="button" variant="destructive" onClick={handleDelete}>Delete</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
