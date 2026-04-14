"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, User, Calendar, MapPin, Star, Edit3, Save, X, Loader2, Globe,
} from "lucide-react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Leader = any;

const CONFIDENCE_OPTIONS = [
  { value: "AA", label: "AA — Birth certificate / official record" },
  { value: "A", label: "A — Reliable source" },
  { value: "B", label: "B — Secondary source" },
  { value: "C", label: "C — Uncertain, multiple versions" },
  { value: "X", label: "X — No birth time known" },
];

const CONFIDENCE_BADGE: Record<string, string> = {
  AA: "bg-green-100 text-green-700 border-green-200",
  A: "bg-blue-100 text-blue-700 border-blue-200",
  B: "bg-yellow-100 text-yellow-700 border-yellow-200",
  C: "bg-orange-100 text-orange-700 border-orange-200",
  X: "bg-gray-100 text-gray-500 border-gray-200",
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function LeaderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [leader, setLeader] = useState<Leader | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Leader>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/mundane/leaders/${id}`);
      if (!res.ok) { router.push("/admin/mundane/leaders"); return; }
      const data = await res.json();
      setLeader(data);
      setForm(data);
    } catch {
      toast.error("Failed to load leader");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  function handleField(key: string, value: string | boolean | null) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const patch = {
        full_name: form.full_name,
        office_title: form.office_title ?? null,
        office_start_date: form.office_start_date ?? null,
        office_end_date: form.office_end_date ?? null,
        is_current: form.is_current ?? true,
        birth_date: form.birth_date ?? null,
        birth_time: form.birth_time ?? null,
        birth_location: form.birth_location ?? null,
        birth_timezone: form.birth_timezone ?? null,
        birth_data_source: form.birth_data_source ?? null,
        birth_data_confidence: form.birth_data_confidence ?? null,
        notes: form.notes ?? null,
        tags: typeof form.tags === "string"
          ? (form.tags as string).split(",").map((t: string) => t.trim()).filter(Boolean)
          : form.tags ?? [],
        is_public: form.is_public ?? true,
      };
      const res = await fetch(`/api/admin/mundane/leaders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Failed to save");
      const updated = await res.json();
      setLeader(updated);
      setForm(updated);
      setEditing(false);
      toast.success("Leader updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!leader) return null;

  const tags: string[] = Array.isArray(leader.tags) ? leader.tags : [];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back nav */}
      <div className="flex items-center justify-between">
        <Link href="/admin/mundane/leaders">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="size-4" />Leaders
          </Button>
        </Link>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Edit3 className="size-3.5 mr-1.5" />Edit
          </Button>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start gap-3">
        <User className="size-6 text-blue-500 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">{leader.full_name}</h1>
          {leader.office_title && (
            <p className="text-muted-foreground text-sm">{leader.office_title}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {leader.is_current ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Current</Badge>
            ) : (
              <Badge variant="outline" className="text-gray-500">Former</Badge>
            )}
            {leader.birth_data_confidence && (
              <Badge variant="outline" className={CONFIDENCE_BADGE[leader.birth_data_confidence] ?? ""}>
                Data {leader.birth_data_confidence}
              </Badge>
            )}
            {leader.is_public ? (
              <Badge variant="outline" className="text-violet-600 border-violet-200 bg-violet-50">Public</Badge>
            ) : (
              <Badge variant="outline" className="text-gray-400">Private</Badge>
            )}
          </div>
        </div>
      </div>

      {editing ? (
        /* ---- Edit Form ---- */
        <Card>
          <CardHeader><CardTitle className="text-base">Edit Leader</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Full Name *</label>
                <Input value={form.full_name ?? ""} onChange={(e) => handleField("full_name", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Office / Title</label>
                <Input value={form.office_title ?? ""} onChange={(e) => handleField("office_title", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Office Start Date</label>
                <Input type="date" value={form.office_start_date ?? ""} onChange={(e) => handleField("office_start_date", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Office End Date</label>
                <Input type="date" value={form.office_end_date ?? ""} onChange={(e) => handleField("office_end_date", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Birth Date</label>
                <Input type="date" value={form.birth_date ?? ""} onChange={(e) => handleField("birth_date", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Birth Time</label>
                <Input type="time" value={form.birth_time ?? ""} onChange={(e) => handleField("birth_time", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Birth Location</label>
                <Input value={form.birth_location ?? ""} onChange={(e) => handleField("birth_location", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Birth Timezone</label>
                <Input placeholder="e.g. America/New_York" value={form.birth_timezone ?? ""} onChange={(e) => handleField("birth_timezone", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Data Confidence</label>
                <Select value={form.birth_data_confidence ?? ""} onValueChange={(v) => handleField("birth_data_confidence", v)}>
                  <SelectTrigger><SelectValue placeholder="Select confidence" /></SelectTrigger>
                  <SelectContent>
                    {CONFIDENCE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Data Source</label>
                <Input placeholder="Source citation" value={form.birth_data_source ?? ""} onChange={(e) => handleField("birth_data_source", e.target.value)} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  value={Array.isArray(form.tags) ? form.tags.join(", ") : (form.tags ?? "")}
                  onChange={(e) => handleField("tags", e.target.value)}
                  placeholder="political, usa, nato"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea rows={3} value={form.notes ?? ""} onChange={(e) => handleField("notes", e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_current ?? true} onChange={(e) => handleField("is_current", e.target.checked)} />
                Currently in office
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_public ?? true} onChange={(e) => handleField("is_public", e.target.checked)} />
                Public
              </label>
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving} size="sm">
                {saving ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Save className="size-4 mr-1.5" />}
                Save Changes
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setForm(leader); }}>
                <X className="size-4 mr-1" />Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ---- Read View ---- */
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Office info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wide">
                <Globe className="size-4" />Office
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {leader.office_title && <p><span className="text-muted-foreground">Title: </span>{leader.office_title}</p>}
              {leader.office_start_date && (
                <p><span className="text-muted-foreground">From: </span>{fmtDate(leader.office_start_date)}</p>
              )}
              {leader.office_end_date && (
                <p><span className="text-muted-foreground">To: </span>{fmtDate(leader.office_end_date)}</p>
              )}
              {!leader.office_start_date && !leader.office_end_date && (
                <p className="text-muted-foreground">No office dates recorded.</p>
              )}
            </CardContent>
          </Card>

          {/* Birth data */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wide">
                <Calendar className="size-4" />Birth Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {leader.birth_date && (
                <p><span className="text-muted-foreground">Date: </span>{fmtDate(leader.birth_date)}</p>
              )}
              {leader.birth_time && (
                <p><span className="text-muted-foreground">Time: </span>{leader.birth_time}</p>
              )}
              {leader.birth_location && (
                <p className="flex items-center gap-1">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  {leader.birth_location}
                </p>
              )}
              {leader.birth_timezone && (
                <p><span className="text-muted-foreground">TZ: </span>{leader.birth_timezone}</p>
              )}
              {leader.birth_data_source && (
                <p className="text-xs text-muted-foreground">Source: {leader.birth_data_source}</p>
              )}
              {!leader.birth_date && <p className="text-muted-foreground">No birth data recorded.</p>}
            </CardContent>
          </Card>

          {/* Notes */}
          {leader.notes && (
            <Card className="sm:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wide">
                  <Star className="size-4" />Research Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{leader.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="sm:col-span-2 space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Tags</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((t: string) => (
                  <Badge key={t} variant="outline" className="capitalize text-xs">{t}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Link to chart studio */}
      <div className="flex gap-2 pt-2">
        <Link href={`/admin/mundane/chart-studio?entity_id=${leader.country_entity_id ?? ""}`}>
          <Button variant="outline" size="sm" disabled={!leader.country_entity_id}>
            <Star className="size-3.5 mr-1.5" />Open in Chart Studio
          </Button>
        </Link>
      </div>
    </div>
  );
}
