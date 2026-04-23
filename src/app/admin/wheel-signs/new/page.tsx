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
import { Checkbox } from "@/components/ui/checkbox";

export default function NewWheelSignPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    start_date: "",
    end_date: "",
    theme_image: "",
    icon_image: "",
    priority: "",
    is_active: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/admin/wheel-signs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        theme_image: form.theme_image || null,
        icon_image: form.icon_image || null,
        priority: form.priority ? parseInt(form.priority) : 0,
        is_active: form.is_active,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to create wheel sign");
      setSaving(false);
      return;
    }

    router.push("/admin/wheel-signs");
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/wheel-signs" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Wheel Signs
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">New Wheel Sign</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wheel Sign Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input id="start_date" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input id="end_date" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme_image">Theme Image URL</Label>
              <Input id="theme_image" type="url" value={form.theme_image} onChange={(e) => setForm({ ...form, theme_image: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon_image">Icon Image URL</Label>
              <Input id="icon_image" type="url" value={form.icon_image} onChange={(e) => setForm({ ...form, icon_image: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input id="priority" type="number" min="0" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="is_active" checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: !!checked })} />
              <Label htmlFor="is_active">Active</Label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create Sign"}</Button>
              <Button type="button" variant="outline" onClick={() => router.push("/admin/wheel-signs")}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
