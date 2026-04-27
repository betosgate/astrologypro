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

export default function NewWebinarPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    host_name: "",
    scheduled_at: "",
    duration_mins: "",
    join_url: "",
    recording_url: "",
    is_free: true,
    price: "",
    is_active: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/admin/webinars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        host_name: form.host_name,
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
        duration_mins: form.duration_mins ? parseInt(form.duration_mins) : null,
        join_url: form.join_url || null,
        recording_url: form.recording_url || null,
        is_free: form.is_free,
        price: form.is_free ? null : (parseFloat(form.price) || 0),
        is_active: form.is_active,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to create webinar");
      setSaving(false);
      return;
    }

    router.push("/admin/webinars");
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/webinars" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Webinars
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">New Webinar</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Webinar Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="host_name">Host Name *</Label>
              <Input id="host_name" value={form.host_name} onChange={(e) => setForm({ ...form, host_name: e.target.value })} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled_at">Scheduled At *</Label>
                <Input
                  id="scheduled_at"
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_mins">Duration (mins)</Label>
                <Input
                  id="duration_mins"
                  type="number"
                  min="1"
                  value={form.duration_mins}
                  onChange={(e) => setForm({ ...form, duration_mins: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="join_url">Join URL</Label>
              <Input id="join_url" type="url" value={form.join_url} onChange={(e) => setForm({ ...form, join_url: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recording_url">Recording URL</Label>
              <Input id="recording_url" type="url" value={form.recording_url} onChange={(e) => setForm({ ...form, recording_url: e.target.value })} />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="is_free"
                checked={form.is_free}
                onCheckedChange={(checked) => setForm({ ...form, is_free: !!checked })}
              />
              <Label htmlFor="is_free">Free Webinar</Label>
            </div>

            {!form.is_free && (
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: !!checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create Webinar"}</Button>
              <Button type="button" variant="outline" onClick={() => router.push("/admin/webinars")}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
