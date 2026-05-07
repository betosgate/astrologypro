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

interface PackageForm {
  name: string;
  description: string;
  price: string;
  features: string;
  is_active: boolean;
}

export default function EditPackagePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<PackageForm>({
    name: "",
    description: "",
    price: "",
    features: "",
    is_active: true,
  });

  useEffect(() => {
    fetch(`/api/admin/packages/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name: data.name ?? "",
          description: data.description ?? "",
          price: String(data.price ?? ""),
          features: Array.isArray(data.features) ? data.features.join("\n") : "",
          is_active: data.is_active ?? true,
        });
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load package");
        setLoading(false);
      });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const features = form.features
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const res = await fetch(`/api/admin/packages/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        price: parseFloat(form.price) || 0,
        features,
        is_active: form.is_active,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to update package");
      setSaving(false);
      return;
    }

    router.push("/admin/packages");
  }

  async function handleDelete() {
    if (!confirm("Delete this package? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/packages/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/packages");
    } else {
      setError("Failed to delete package");
    }
  }

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/packages" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Packages
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Edit Package</h1>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Package Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
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
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Features (one per line)</Label>
              <Textarea
                id="features"
                rows={5}
                value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
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
                <Button type="button" variant="outline" onClick={() => router.push("/admin/packages")}>
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
