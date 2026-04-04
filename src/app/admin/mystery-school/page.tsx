"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Save, Eye, EyeOff } from "lucide-react";

type FoundationWeek = {
  id: string;
  week_number: number;
  title: string;
  content: string | null;
  audio_url: string | null;
  beto_photo_url: string | null;
  is_published: boolean;
};

export default function AdminMysterySchoolPage() {
  const [weeks, setWeeks] = useState<FoundationWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<FoundationWeek>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/mystery-school/foundation")
      .then((r) => r.json())
      .then((d) => setWeeks(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  function startEdit(week: FoundationWeek) {
    setEditingId(week.id);
    setForm({
      title: week.title,
      content: week.content ?? "",
      audio_url: week.audio_url ?? "",
      beto_photo_url: week.beto_photo_url ?? "",
      is_published: week.is_published,
    });
    setError(null);
  }

  async function handleSave(id: string) {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        audio_url: form.audio_url || null,
        beto_photo_url: form.beto_photo_url || null,
        content: form.content || null,
      };
      const res = await fetch(`/api/admin/mystery-school/foundation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      const updated = await res.json();
      setWeeks((prev) => prev.map((w) => (w.id === id ? updated : w)));
      setEditingId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(week: FoundationWeek) {
    const res = await fetch(`/api/admin/mystery-school/foundation/${week.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !week.is_published }),
    });
    if (res.ok) {
      const updated = await res.json();
      setWeeks((prev) => prev.map((w) => (w.id === week.id ? updated : w)));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">Mystery School</h1>
            <a href="/admin/mystery-school/decans" className="text-sm text-primary hover:underline">
              → Decan Rituals (36)
            </a>
          </div>
          <p className="text-muted-foreground">Foundation Weeks — manage week content and audio.</p>
        </div>
        <Badge variant="secondary">
          {weeks.filter((w) => w.is_published).length} / {weeks.length} published
        </Badge>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-4">
          {weeks.map((week) => (
            <Card key={week.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {week.week_number}
                    </div>
                    <div>
                      <CardTitle className="text-sm">{week.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {week.audio_url ? "Audio set" : "No audio"} ·{" "}
                        {week.content ? "Content set" : "No content"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={week.is_published ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {week.is_published ? "Published" : "Draft"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => togglePublish(week)}
                      title={week.is_published ? "Unpublish" : "Publish"}
                    >
                      {week.is_published ? (
                        <EyeOff className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7"
                      onClick={() =>
                        editingId === week.id ? setEditingId(null) : startEdit(week)
                      }
                    >
                      {editingId === week.id ? "Cancel" : "Edit"}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {editingId === week.id && (
                <CardContent className="space-y-4 pt-0">
                  <div className="space-y-1.5">
                    <Label>Title</Label>
                    <Input
                      value={form.title ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Audio URL (mp3 / storage URL)</Label>
                    <Input
                      value={form.audio_url ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, audio_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Beto Photo URL (optional)</Label>
                    <Input
                      value={form.beto_photo_url ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, beto_photo_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Week Content (reading / instructions)</Label>
                    <Textarea
                      value={form.content ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                      rows={8}
                      placeholder="Enter the week's reading material, instructions, and reflection questions…"
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button
                    size="sm"
                    onClick={() => handleSave(week.id)}
                    disabled={saving}
                  >
                    <Save className="mr-1.5 size-3.5" />
                    {saving ? "Saving…" : "Save Changes"}
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
