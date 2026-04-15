"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Loader2 } from "lucide-react";

const TRADITIONS = [
  { value: "western", label: "Western" },
  { value: "vedic", label: "Vedic" },
  { value: "hybrid", label: "Hybrid" },
] as const;

export default function NewWorkspacePage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", description: "", tradition: "western" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Workspace name is required.");
      return;
    }

    setSaving(true);
    setError("");

    const res = await fetch("/api/mundane/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        description: form.description.trim() || null,
        tradition: form.tradition,
      }),
    });

    if (res.ok) {
      const ws = await res.json();
      router.push(`/admin/mundane/workspaces/${ws.id}`);
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.detail ?? "Failed to create workspace.");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="size-6 text-indigo-500" />
          New Workspace
        </h1>
        <p className="text-muted-foreground">Create a team workspace for collaborative mundane research.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Mundane Research Team"
                required
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="What is this workspace for?"
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {/* Tradition */}
            <div className="space-y-1.5">
              <label htmlFor="tradition" className="text-sm font-medium">Tradition</label>
              <select
                id="tradition"
                value={form.tradition}
                onChange={(e) => setForm((f) => ({ ...f, tradition: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {TRADITIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/mundane/workspaces">Cancel</Link>
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                Create Workspace
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
