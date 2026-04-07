"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

const CONFIDENCE_LEVELS = ["AA", "A", "B", "C", "X"] as const;

type EntityOption = { id: string; name: string; flag_emoji: string | null };

type LeaderForm = {
  full_name: string;
  office_title: string;
  country_entity_id: string;
  office_start_date: string;
  office_end_date: string;
  is_current: boolean;
  birth_date: string;
  birth_time: string;
  birth_location: string;
  birth_timezone: string;
  birth_data_source: string;
  birth_data_confidence: string;
  notes: string;
  tags: string;
  is_public: boolean;
};

const EMPTY_FORM: LeaderForm = {
  full_name: "",
  office_title: "",
  country_entity_id: "",
  office_start_date: "",
  office_end_date: "",
  is_current: true,
  birth_date: "",
  birth_time: "",
  birth_location: "",
  birth_timezone: "",
  birth_data_source: "",
  birth_data_confidence: "",
  notes: "",
  tags: "",
  is_public: true,
};

export default function AdminLeaderNewPage() {
  const router = useRouter();
  const [form, setForm] = useState<LeaderForm>(EMPTY_FORM);
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/mundane/entities?page=1")
      .then((r) => r.json())
      .then((json) => setEntities(json.entities ?? []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) { setError("Full name is required."); return; }
    setSaving(true);
    setError("");

    const tagsArray = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      full_name: form.full_name.trim(),
      office_title: form.office_title.trim() || null,
      country_entity_id: form.country_entity_id || null,
      office_start_date: form.office_start_date || null,
      office_end_date: form.office_end_date || null,
      is_current: form.is_current,
      birth_date: form.birth_date || null,
      birth_time: form.birth_time || null,
      birth_location: form.birth_location.trim() || null,
      birth_timezone: form.birth_timezone.trim() || null,
      birth_data_source: form.birth_data_source.trim() || null,
      birth_data_confidence: form.birth_data_confidence || null,
      notes: form.notes.trim() || null,
      tags: tagsArray,
      is_public: form.is_public,
    };

    const res = await fetch("/api/admin/mundane/leaders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/admin/mundane/leaders");
    } else {
      const json = await res.json();
      setError(json.detail ?? json.error ?? "Failed to create leader.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <Link
        href="/admin/mundane/leaders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Leaders
      </Link>

      <div>
        <h1 className="text-2xl font-bold">New Leader</h1>
        <p className="text-muted-foreground">Add a world leader or notable person to the mundane registry.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leader Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Full Name *</label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="e.g. Joe Biden, Xi Jinping"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Office / Title</label>
              <Input
                value={form.office_title}
                onChange={(e) => setForm((f) => ({ ...f, office_title: e.target.value }))}
                placeholder="e.g. President of the United States"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Country / Entity</label>
              <select
                value={form.country_entity_id}
                onChange={(e) => setForm((f) => ({ ...f, country_entity_id: e.target.value }))}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">— None —</option>
                {entities.map((en) => (
                  <option key={en.id} value={en.id}>
                    {en.flag_emoji ? `${en.flag_emoji} ` : ""}{en.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Office Start Date</label>
                <Input
                  type="date"
                  value={form.office_start_date}
                  onChange={(e) => setForm((f) => ({ ...f, office_start_date: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Office End Date</label>
                <Input
                  type="date"
                  value={form.office_end_date}
                  onChange={(e) => setForm((f) => ({ ...f, office_end_date: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_current"
                checked={form.is_current}
                onChange={(e) => setForm((f) => ({ ...f, is_current: e.target.checked }))}
                className="rounded border-input"
              />
              <label htmlFor="is_current" className="text-sm font-medium">Currently in office</label>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Birth Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Birth Date</label>
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
                placeholder="e.g. Scranton, Pennsylvania, USA"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Birth Timezone</label>
              <Input
                value={form.birth_timezone}
                onChange={(e) => setForm((f) => ({ ...f, birth_timezone: e.target.value }))}
                placeholder="e.g. America/New_York"
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
            <CardTitle className="text-base">Notes &amp; Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Internal research notes…"
                rows={3}
                className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tags</label>
              <Input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="comma-separated, e.g. nato, g7, president"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Separate tags with commas.</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_public"
                checked={form.is_public}
                onChange={(e) => setForm((f) => ({ ...f, is_public: e.target.checked }))}
                className="rounded border-input"
              />
              <label htmlFor="is_public" className="text-sm font-medium">Visible to authenticated users</label>
            </div>
          </CardContent>
        </Card>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 mt-4">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create Leader
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/mundane/leaders">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
