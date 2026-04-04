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

export default function NewTarotSpreadPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    card_count: "",
    priority: "",
    is_active: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/admin/tarot/spreads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        card_count: parseInt(form.card_count) || 0,
        priority: form.priority ? parseInt(form.priority) : 0,
        is_active: form.is_active,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to create spread");
      setSaving(false);
      return;
    }

    router.push("/admin/tarot");
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/tarot" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Tarot
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">New Tarot Spread</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Spread Details</CardTitle>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="card_count">Card Count *</Label>
                <Input id="card_count" type="number" min="1" value={form.card_count} onChange={(e) => setForm({ ...form, card_count: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input id="priority" type="number" min="0" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="is_active" checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: !!checked })} />
              <Label htmlFor="is_active">Active</Label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create Spread"}</Button>
              <Button type="button" variant="outline" onClick={() => router.push("/admin/tarot")}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
