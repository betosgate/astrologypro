"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, MousePointerClick } from "lucide-react";

const CTA_TYPES = [
  { value: "generic",    label: "Generic" },
  { value: "course",     label: "Course" },
  { value: "service",    label: "Service" },
  { value: "newsletter", label: "Newsletter" },
] as const;

type FormState = {
  title: string;
  body: string;
  cta_label: string;
  cta_url: string;
  type: "generic" | "course" | "service" | "newsletter";
  linked_entity_note: string;
  is_active: boolean;
};

export default function NewCtaBlockPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    title: "",
    body: "",
    cta_label: "",
    cta_url: "",
    type: "generic",
    linked_entity_note: "",
    is_active: true,
  });

  function set(field: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.cta_url.trim()) { setError("CTA URL is required."); return; }

    setSaving(true);
    const res = await fetch("/api/admin/blog/cta-blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        body: form.body.trim() || null,
        cta_label: form.cta_label.trim() || "Learn More",
        cta_url: form.cta_url.trim(),
        type: form.type,
        is_active: form.is_active,
      }),
    });

    if (res.ok) {
      router.push("/admin/blog/cta-blocks");
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.detail ?? json.error ?? "Failed to create CTA block.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button size="sm" variant="ghost" asChild>
          <Link href="/admin/blog/cta-blocks">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New CTA Block</h1>
          <p className="text-muted-foreground">Create a reusable call-to-action block for blog posts.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MousePointerClick className="size-4" />
            CTA Block Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Book Your Astrology Reading"
                required
              />
            </div>

            {/* Body text */}
            <div className="space-y-1.5">
              <Label htmlFor="body">Body Text</Label>
              <Textarea
                id="body"
                value={form.body}
                onChange={(e) => set("body", e.target.value)}
                placeholder="Supporting text shown below the title…"
                rows={3}
              />
            </div>

            {/* CTA label */}
            <div className="space-y-1.5">
              <Label htmlFor="cta_label">Button Label</Label>
              <Input
                id="cta_label"
                value={form.cta_label}
                onChange={(e) => set("cta_label", e.target.value)}
                placeholder="Learn More"
              />
            </div>

            {/* CTA URL */}
            <div className="space-y-1.5">
              <Label htmlFor="cta_url">Button URL <span className="text-red-500">*</span></Label>
              <Input
                id="cta_url"
                type="url"
                value={form.cta_url}
                onChange={(e) => set("cta_url", e.target.value)}
                placeholder="https://…"
                required
              />
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CTA_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Active */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => set("is_active", e.target.checked)}
                className="size-4 rounded border-input"
              />
              <Label htmlFor="is_active" className="cursor-pointer">Active (visible to the blog renderer)</Label>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                Create CTA Block
              </Button>
              <Button type="button" variant="ghost" asChild>
                <Link href="/admin/blog/cta-blocks">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
