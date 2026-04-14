"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SectionContainer } from "@/components/shared/section-container";

const ENTITY_TYPES = [
  "country", "city", "institution", "market", "commodity", "organization", "other",
] as const;

const CONFIDENCE_LEVELS = ["AA", "A", "B", "C", "X"] as const;

type EntityForm = {
  name: string;
  entity_type: string;
  birth_date: string;
  birth_time: string;
  birth_location: string;
  description: string;
  tags: string;
  birth_data_confidence: string;
  birth_data_source: string;
  country_code: string;
  region: string;
  flag_emoji: string;
};

const EMPTY_FORM: EntityForm = {
  name: "",
  entity_type: "country",
  birth_date: "",
  birth_time: "",
  birth_location: "",
  description: "",
  tags: "",
  birth_data_confidence: "",
  birth_data_source: "",
  country_code: "",
  region: "",
  flag_emoji: "",
};

export default function AdminMundaneEntityNewPage() {
  const router = useRouter();
  const [form, setForm] = useState<EntityForm>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError("");

    const tagsArray = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      entity_type: form.entity_type,
      region: form.region.trim() || null,
      flag_emoji: form.flag_emoji.trim() || null,
      notes: form.description.trim() || null,
    };

    const res = await fetch("/api/admin/mundane/entities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, tags: tagsArray }),
    });

    if (res.ok) {
      const json = await res.json();
      router.push(`/admin/mundane/entities/${json.id}`);
    } else {
      const json = await res.json();
      setError(json.detail ?? json.error ?? "Failed to create entity.");
      setSaving(false);
    }
  }

  return (
    <SectionContainer verticalPadding="none" className="space-y-6">
      <Link href="/admin/mundane" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Mundane
      </Link>

      <div>
        <h1 className="text-2xl font-bold">New Entity</h1>
        <p className="text-muted-foreground">Add a country, city, leader, or institution to the mundane registry.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entity Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. United States, Vladimir Putin, Bank of England"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Entity Type *</label>
                <select
                  value={form.entity_type}
                  onChange={(e) => setForm((f) => ({ ...f, entity_type: e.target.value }))}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  {ENTITY_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Flag Emoji</label>
                <Input
                  value={form.flag_emoji}
                  onChange={(e) => setForm((f) => ({ ...f, flag_emoji: e.target.value }))}
                  placeholder="🇺🇸"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Region</label>
                <Input
                  value={form.region}
                  onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                  placeholder="e.g. North America"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Country Code</label>
                <Input
                  value={form.country_code}
                  onChange={(e) => setForm((f) => ({ ...f, country_code: e.target.value }))}
                  placeholder="e.g. US"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description or internal notes…"
                rows={3}
                className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Birth / Foundation Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Birth / Foundation Date</label>
                <Input
                  type="date"
                  value={form.birth_date}
                  onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Birth Time</label>
                <Input
                  type="time"
                  value={form.birth_time}
                  onChange={(e) => setForm((f) => ({ ...f, birth_time: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Birth Location</label>
              <Input
                value={form.birth_location}
                onChange={(e) => setForm((f) => ({ ...f, birth_location: e.target.value }))}
                placeholder="e.g. Philadelphia, Pennsylvania, USA"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Data Confidence</label>
                <select
                  value={form.birth_data_confidence}
                  onChange={(e) => setForm((f) => ({ ...f, birth_data_confidence: e.target.value }))}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">— Select —</option>
                  {CONFIDENCE_LEVELS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Data Source / Citation</label>
                <Input
                  value={form.birth_data_source}
                  onChange={(e) => setForm((f) => ({ ...f, birth_data_source: e.target.value }))}
                  placeholder="e.g. Astrodatabank, Wikipedia"
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="text-sm font-medium">Tags</label>
            <Input
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="comma-separated, e.g. nato, g7, nuclear"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Separate tags with commas.</p>
          </CardContent>
        </Card>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 mt-4">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create Entity
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/mundane">Cancel</Link>
          </Button>
        </div>
      </form>
    </SectionContainer>
  );
}
