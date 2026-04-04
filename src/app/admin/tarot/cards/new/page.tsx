"use client";

import { useEffect, useState } from "react";
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

interface Spread { id: string; name: string; }

export default function NewTarotCardPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spreads, setSpreads] = useState<Spread[]>([]);

  const [form, setForm] = useState({
    name: "",
    arcana: "major",
    suit: "",
    number: "",
    upright_meaning: "",
    reversed_meaning: "",
    image_url: "",
    spread_id: "",
    is_active: true,
  });

  useEffect(() => {
    fetch("/api/admin/tarot/spreads")
      .then((r) => r.json())
      .then((data) => setSpreads(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/admin/tarot/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        arcana: form.arcana,
        suit: form.arcana === "minor" ? (form.suit || null) : null,
        number: form.number ? parseInt(form.number) : null,
        upright_meaning: form.upright_meaning || null,
        reversed_meaning: form.reversed_meaning || null,
        image_url: form.image_url || null,
        spread_id: form.spread_id || null,
        is_active: form.is_active,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to create card");
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
        <h1 className="mt-2 text-2xl font-bold tracking-tight">New Tarot Card</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Card Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="arcana">Arcana *</Label>
                <select
                  id="arcana"
                  value={form.arcana}
                  onChange={(e) => setForm({ ...form, arcana: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="major">Major</option>
                  <option value="minor">Minor</option>
                </select>
              </div>
              {form.arcana === "minor" && (
                <div className="space-y-2">
                  <Label htmlFor="suit">Suit</Label>
                  <Input id="suit" placeholder="e.g. Wands, Cups" value={form.suit} onChange={(e) => setForm({ ...form, suit: e.target.value })} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">Number</Label>
              <Input id="number" type="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="upright_meaning">Upright Meaning</Label>
              <Textarea id="upright_meaning" rows={3} value={form.upright_meaning} onChange={(e) => setForm({ ...form, upright_meaning: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reversed_meaning">Reversed Meaning</Label>
              <Textarea id="reversed_meaning" rows={3} value={form.reversed_meaning} onChange={(e) => setForm({ ...form, reversed_meaning: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input id="image_url" type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="spread_id">Spread</Label>
              <select
                id="spread_id"
                value={form.spread_id}
                onChange={(e) => setForm({ ...form, spread_id: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">— None —</option>
                {spreads.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="is_active" checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: !!checked })} />
              <Label htmlFor="is_active">Active</Label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create Card"}</Button>
              <Button type="button" variant="outline" onClick={() => router.push("/admin/tarot")}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
