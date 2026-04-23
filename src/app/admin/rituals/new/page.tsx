"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function NewRitualPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    instructions: "",
    priority: "",
    is_active: true,
    video_url: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/admin/rituals", {
      method: "POST",
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
      setError(body.error ?? "Failed to create ritual");
      setSaving(false);
      return;
    }

    router.push("/admin/rituals");
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/rituals" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Rituals
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">New Ritual Invocation</h1>
      </div>

      <Card>
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

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create Ritual"}</Button>
              <Button type="button" variant="outline" onClick={() => router.push("/admin/rituals")}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
