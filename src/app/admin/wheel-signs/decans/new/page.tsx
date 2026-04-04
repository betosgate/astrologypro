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

interface WheelSign { id: string; title: string; }

export default function NewDecanPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signs, setSigns] = useState<WheelSign[]>([]);

  const [form, setForm] = useState({
    sign_id: "",
    sign_name: "",
    planet: "",
    tarot_name: "",
    greek_daemon: "",
    decan: "1",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    fetch("/api/admin/wheel-signs")
      .then((r) => r.json())
      .then((data) => setSigns(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/admin/astro-decans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sign_id: form.sign_id || null,
        sign_name: form.sign_name,
        planet: form.planet,
        tarot_name: form.tarot_name,
        greek_daemon: form.greek_daemon || null,
        decan: parseInt(form.decan),
        description: form.description || null,
        is_active: form.is_active,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to create decan");
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
        <h1 className="mt-2 text-2xl font-bold tracking-tight">New Astro Decan Info</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Decan Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sign_id">Wheel Sign</Label>
              <select
                id="sign_id"
                value={form.sign_id}
                onChange={(e) => setForm({ ...form, sign_id: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">— None —</option>
                {signs.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sign_name">Sign Name *</Label>
              <Input id="sign_name" value={form.sign_name} onChange={(e) => setForm({ ...form, sign_name: e.target.value })} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planet">Planet *</Label>
                <Input id="planet" value={form.planet} onChange={(e) => setForm({ ...form, planet: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="decan">Decan *</Label>
                <select
                  id="decan"
                  value={form.decan}
                  onChange={(e) => setForm({ ...form, decan: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tarot_name">Tarot Name *</Label>
              <Input id="tarot_name" value={form.tarot_name} onChange={(e) => setForm({ ...form, tarot_name: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="greek_daemon">Greek Daemon</Label>
              <Input id="greek_daemon" value={form.greek_daemon} onChange={(e) => setForm({ ...form, greek_daemon: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="is_active" checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: !!checked })} />
              <Label htmlFor="is_active">Active</Label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create Decan"}</Button>
              <Button type="button" variant="outline" onClick={() => router.push("/admin/wheel-signs")}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
