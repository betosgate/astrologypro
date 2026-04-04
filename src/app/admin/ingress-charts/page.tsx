"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Globe, Eye, EyeOff, Pencil } from "lucide-react";

type IngressChart = {
  id: string;
  title: string;
  ingress_type: string | null;
  importance: string | null;
  is_published: boolean;
  is_social_advo: boolean;
  validity_start: string | null;
  validity_end: string | null;
  location_name: string | null;
  author_name: string | null;
  created_at: string;
};

type FormState = {
  title: string;
  ingress_type: string;
  importance: string;
  short_description: string;
  effective_time_period: string;
  event_time_period: string;
  event_timestamp: string;
  validity_start: string;
  validity_end: string;
  location_name: string;
  location_lat: string;
  location_lon: string;
  location_timezone: string;
  tags: string;
  sector_focus: string;
  is_social_advo: boolean;
  is_published: boolean;
  author_name: string;
  author_email: string;
};

const EMPTY_FORM: FormState = {
  title: "", ingress_type: "", importance: "High Impact",
  short_description: "", effective_time_period: "", event_time_period: "",
  event_timestamp: "", validity_start: "", validity_end: "",
  location_name: "", location_lat: "", location_lon: "", location_timezone: "",
  tags: "", sector_focus: "",
  is_social_advo: false, is_published: false,
  author_name: "", author_email: "",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminIngressChartsPage() {
  const [charts, setCharts] = useState<IngressChart[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadCharts(p: number, replace: boolean) {
    setLoading(true);
    const res = await fetch(`/api/admin/ingress-charts?page=${p}`);
    if (res.ok) {
      const json = await res.json();
      setCharts((prev) => replace ? json.charts : [...prev, ...json.charts]);
      setTotal(json.total);
      setHasMore(json.hasMore);
      setPage(p);
    }
    setLoading(false);
  }

  useEffect(() => { loadCharts(1, true); }, []);

  function openNew() {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setError(null);
    setShowForm(true);
  }

  async function openEdit(id: string) {
    const res = await fetch(`/api/admin/ingress-charts/${id}`);
    if (!res.ok) return;
    const c = await res.json();
    setEditId(id);
    setForm({
      title: c.title ?? "",
      ingress_type: c.ingress_type ?? "",
      importance: c.importance ?? "High Impact",
      short_description: c.short_description ?? "",
      effective_time_period: c.effective_time_period ?? "",
      event_time_period: c.event_time_period ?? "",
      event_timestamp: c.event_timestamp ? c.event_timestamp.slice(0, 16) : "",
      validity_start: c.validity_start ?? "",
      validity_end: c.validity_end ?? "",
      location_name: c.location_name ?? "",
      location_lat: c.location_lat != null ? String(c.location_lat) : "",
      location_lon: c.location_lon != null ? String(c.location_lon) : "",
      location_timezone: c.location_timezone ?? "",
      tags: (c.tags ?? []).join(", "),
      sector_focus: (c.sector_focus ?? []).join(", "),
      is_social_advo: c.is_social_advo ?? false,
      is_published: c.is_published ?? false,
      author_name: c.author_name ?? "",
      author_email: c.author_email ?? "",
    });
    setError(null);
    setShowForm(true);
  }

  function buildPayload() {
    return {
      title: form.title,
      ingress_type: form.ingress_type || null,
      importance: form.importance || "High Impact",
      short_description: form.short_description || null,
      effective_time_period: form.effective_time_period || null,
      event_time_period: form.event_time_period || null,
      event_timestamp: form.event_timestamp ? new Date(form.event_timestamp).toISOString() : null,
      validity_start: form.validity_start || null,
      validity_end: form.validity_end || null,
      location_name: form.location_name || null,
      location_lat: form.location_lat ? parseFloat(form.location_lat) : null,
      location_lon: form.location_lon ? parseFloat(form.location_lon) : null,
      location_timezone: form.location_timezone || null,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      sector_focus: form.sector_focus ? form.sector_focus.split(",").map((s) => s.trim()).filter(Boolean) : [],
      is_social_advo: form.is_social_advo,
      is_published: form.is_published,
      author_name: form.author_name || null,
      author_email: form.author_email || null,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = buildPayload();
      const url = editId ? `/api/admin/ingress-charts/${editId}` : "/api/admin/ingress-charts";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to save");
      }
      await loadCharts(1, true);
      setShowForm(false);
      setEditId(null);
      setForm({ ...EMPTY_FORM });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(chart: IngressChart) {
    const res = await fetch(`/api/admin/ingress-charts/${chart.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !chart.is_published }),
    });
    if (res.ok) {
      setCharts((prev) => prev.map((c) => c.id === chart.id ? { ...c, is_published: !c.is_published } : c));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this ingress chart?")) return;
    const res = await fetch(`/api/admin/ingress-charts/${id}`, { method: "DELETE" });
    if (res.ok) setCharts((prev) => prev.filter((c) => c.id !== id));
  }

  function F(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
    };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ingress Charts</h1>
          <p className="text-muted-foreground">Manage planetary ingress chart publications. {total > 0 && `${total} total.`}</p>
        </div>
        <Button onClick={openNew} size="sm">
          <Plus className="mr-1.5 size-4" /> New Chart
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editId ? "Edit Chart" : "New Ingress Chart"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={F("title")} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Ingress Type</Label>
                  <Input value={form.ingress_type} onChange={F("ingress_type")} placeholder="e.g. Solar Ingress" />
                </div>
                <div className="space-y-1.5">
                  <Label>Importance</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={form.importance}
                    onChange={F("importance")}
                  >
                    <option>High Impact</option>
                    <option>Medium Impact</option>
                    <option>Low Impact</option>
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Short Description</Label>
                  <Textarea value={form.short_description} onChange={F("short_description")} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label>Event Timestamp</Label>
                  <Input type="datetime-local" value={form.event_timestamp} onChange={F("event_timestamp")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Effective Time Period</Label>
                  <Input value={form.effective_time_period} onChange={F("effective_time_period")} placeholder="e.g. Jan 2026 – Mar 2026" />
                </div>
                <div className="space-y-1.5">
                  <Label>Validity Start</Label>
                  <Input type="date" value={form.validity_start} onChange={F("validity_start")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Validity End</Label>
                  <Input type="date" value={form.validity_end} onChange={F("validity_end")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Location Name</Label>
                  <Input value={form.location_name} onChange={F("location_name")} placeholder="e.g. New York, NY" />
                </div>
                <div className="space-y-1.5">
                  <Label>Timezone</Label>
                  <Input value={form.location_timezone} onChange={F("location_timezone")} placeholder="America/New_York" />
                </div>
                <div className="space-y-1.5">
                  <Label>Latitude</Label>
                  <Input type="number" step="0.0001" value={form.location_lat} onChange={F("location_lat")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Longitude</Label>
                  <Input type="number" step="0.0001" value={form.location_lon} onChange={F("location_lon")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Author Name</Label>
                  <Input value={form.author_name} onChange={F("author_name")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Author Email</Label>
                  <Input type="email" value={form.author_email} onChange={F("author_email")} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input value={form.tags} onChange={F("tags")} placeholder="e.g. Aries, Spring Equinox, New Beginnings" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Sector Focus (comma-separated)</Label>
                  <Input value={form.sector_focus} onChange={F("sector_focus")} placeholder="e.g. Finance, Relationships, Health" />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.is_published}
                      onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                      className="size-4"
                    />
                    Published
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.is_social_advo}
                      onChange={(e) => setForm((f) => ({ ...f, is_social_advo: e.target.checked }))}
                      className="size-4"
                    />
                    Social Advocacy
                  </label>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? "Saving…" : editId ? "Update Chart" : "Create Chart"}
                </Button>
                <Button
                  type="button" variant="ghost" size="sm"
                  onClick={() => { setShowForm(false); setEditId(null); setError(null); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && charts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : charts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No ingress charts yet. Create one above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {charts.map((chart) => (
            <Card key={chart.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex flex-wrap items-center gap-2">
                      {chart.title}
                      {chart.is_published ? (
                        <Badge variant="default" className="text-xs">Published</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Draft</Badge>
                      )}
                      {chart.importance && (
                        <Badge variant="secondary" className="text-xs">{chart.importance}</Badge>
                      )}
                      {chart.is_social_advo && (
                        <Badge variant="secondary" className="text-xs">Social Advo</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {chart.ingress_type && <span>{chart.ingress_type} · </span>}
                      {chart.location_name && <span>{chart.location_name} · </span>}
                      {chart.validity_start && <span>{formatDate(chart.validity_start)}</span>}
                      {chart.validity_end && <span> – {formatDate(chart.validity_end)}</span>}
                      {chart.author_name && <span> · by {chart.author_name}</span>}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => togglePublish(chart)}>
                      {chart.is_published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      {chart.is_published ? "Unpublish" : "Publish"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(chart.id)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      onClick={() => handleDelete(chart.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={() => loadCharts(page + 1, false)} disabled={loading}>
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
