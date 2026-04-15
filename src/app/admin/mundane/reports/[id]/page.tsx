"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, BookOpen, Check, Copy, GripVertical, Loader2,
  Plus, Save, Trash2, Globe, EyeOff,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const REPORT_TYPES = [
  { value: "monthly_digest", label: "Monthly Digest" },
  { value: "eclipse_report", label: "Eclipse Report" },
  { value: "ingress_report", label: "Ingress Report" },
  { value: "leader_watch", label: "Leader Watch" },
  { value: "custom", label: "Custom" },
];

const BLOCK_TYPES = [
  { value: "text", label: "Text" },
  { value: "forecast_summary", label: "Forecast Summary" },
  { value: "astro_events", label: "Astro Events" },
  { value: "leader_watch", label: "Leader Watch" },
];

const REPORT_TYPE_META: Record<string, { label: string; color: string }> = {
  monthly_digest: { label: "Monthly Digest", color: "bg-blue-100 text-blue-700 border-blue-200" },
  eclipse_report: { label: "Eclipse Report", color: "bg-purple-100 text-purple-700 border-purple-200" },
  ingress_report: { label: "Ingress Report", color: "bg-amber-100 text-amber-700 border-amber-200" },
  leader_watch: { label: "Leader Watch", color: "bg-rose-100 text-rose-700 border-rose-200" },
  custom: { label: "Custom", color: "bg-gray-100 text-gray-600 border-gray-200" },
};

type ContentBlock = {
  id: string;
  type: string;
  title: string;
  content: string;
};

type Publication = {
  id: string;
  title: string;
  subtitle: string | null;
  report_type: string;
  entity_ids: string[];
  date_range_start: string | null;
  date_range_end: string | null;
  content_blocks: Array<{ type: string; title: string; content: string }>;
  is_published: boolean;
  published_at: string | null;
  share_token: string | null;
  created_at: string;
  updated_at: string;
};

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function blocksWithIds(raw: Array<{ type: string; title: string; content: string }>): ContentBlock[] {
  return raw.map((b) => ({ id: genId(), ...b }));
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function PublicationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [pub, setPub] = useState<Publication | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Edit state
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [reportType, setReportType] = useState("monthly_digest");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadPub = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mundane/publications/${id}`);
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) { toast.error("Failed to load publication"); return; }
      const data: Publication = await res.json();
      setPub(data);
      setTitle(data.title);
      setSubtitle(data.subtitle ?? "");
      setReportType(data.report_type);
      setDateRangeStart(data.date_range_start ?? "");
      setDateRangeEnd(data.date_range_end ?? "");
      setBlocks(blocksWithIds(data.content_blocks ?? []));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPub();
  }, [loadPub]);

  async function saveChanges() {
    if (!title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/mundane/publications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          report_type: reportType,
          date_range_start: dateRangeStart || null,
          date_range_end: dateRangeEnd || null,
          content_blocks: blocks.map(({ id: _id, ...b }) => b),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail ?? "Failed to save");
        return;
      }
      const updated: Publication = await res.json();
      setPub(updated);
      toast.success("Changes saved");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish() {
    if (!pub) return;
    setToggling(true);
    try {
      const res = await fetch(`/api/mundane/publications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !pub.is_published }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail ?? "Failed to toggle publish status");
        return;
      }
      const updated: Publication = await res.json();
      setPub(updated);
      toast.success(updated.is_published ? "Report published" : "Report unpublished");
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this report permanently? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/mundane/publications/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const err = await res.json();
        toast.error(err.detail ?? "Failed to delete");
        return;
      }
      toast.success("Report deleted");
      router.push("/admin/mundane/reports");
    } finally {
      setDeleting(false);
    }
  }

  function addBlock() {
    setBlocks((prev) => [...prev, { id: genId(), type: "text", title: "", content: "" }]);
  }

  function removeBlock(blockId: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  }

  function updateBlock(blockId: string, field: keyof Omit<ContentBlock, "id">, value: string) {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, [field]: value } : b)));
  }

  function moveBlock(index: number, direction: "up" | "down") {
    setBlocks((prev) => {
      const next = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function copyShareLink() {
    if (!pub?.share_token) return;
    const url = `${window.location.origin}/mundane/reports/${pub.share_token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Share link copied");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !pub) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
          <Link href="/admin/mundane/reports"><ArrowLeft className="size-4 mr-1" />Back</Link>
        </Button>
        <p className="text-muted-foreground">Publication not found.</p>
      </div>
    );
  }

  const meta = REPORT_TYPE_META[pub.report_type] ?? REPORT_TYPE_META.custom;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2 text-muted-foreground">
          <Link href="/admin/mundane/reports"><ArrowLeft className="size-4 mr-1" />Back to Reports</Link>
        </Button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <BookOpen className="size-5 text-emerald-500" />
              <Badge variant="outline" className={`text-xs ${meta.color}`}>{meta.label}</Badge>
              <Badge
                variant="outline"
                className={`text-xs ${pub.is_published ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}
              >
                {pub.is_published ? "Published" : "Draft"}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight truncate">{pub.title}</h1>
            {pub.subtitle && <p className="text-muted-foreground text-sm mt-0.5">{pub.subtitle}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              Created {fmtDate(pub.created_at)} · Updated {fmtDateTime(pub.updated_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={saveChanges} disabled={saving} size="sm">
          {saving ? <><Loader2 className="size-4 animate-spin mr-1.5" />Saving…</> : <><Save className="size-4 mr-1.5" />Save Changes</>}
        </Button>
        <Button
          onClick={togglePublish}
          disabled={toggling}
          size="sm"
          variant={pub.is_published ? "outline" : "secondary"}
        >
          {toggling ? (
            <><Loader2 className="size-4 animate-spin mr-1.5" />{pub.is_published ? "Unpublishing…" : "Publishing…"}</>
          ) : pub.is_published ? (
            <><EyeOff className="size-4 mr-1.5" />Unpublish</>
          ) : (
            <><Globe className="size-4 mr-1.5" />Publish</>
          )}
        </Button>
        {pub.is_published && pub.share_token && (
          <Button onClick={copyShareLink} variant="outline" size="sm">
            {copied ? <><Check className="size-4 mr-1.5 text-green-600" />Copied!</> : <><Copy className="size-4 mr-1.5" />Copy Share Link</>}
          </Button>
        )}
        <Button
          onClick={handleDelete}
          disabled={deleting}
          size="sm"
          variant="ghost"
          className="text-destructive/70 hover:text-destructive ml-auto"
        >
          {deleting ? <><Loader2 className="size-4 animate-spin mr-1.5" />Deleting…</> : <><Trash2 className="size-4 mr-1.5" />Delete</>}
        </Button>
      </div>

      {/* Edit fields */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Report Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Subtitle</label>
            <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Optional subtitle" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Report Type</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Date Range Start</label>
              <Input type="date" value={dateRangeStart} onChange={(e) => setDateRangeStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Date Range End</label>
              <Input type="date" value={dateRangeEnd} onChange={(e) => setDateRangeEnd(e.target.value)} />
            </div>
          </div>
          {pub.entity_ids.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Linked Entities ({pub.entity_ids.length})</label>
              <p className="text-xs text-muted-foreground">
                Entity associations were set at creation. To change them, delete and recreate the report.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content blocks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            Content Blocks
            <Button type="button" size="sm" variant="outline" onClick={addBlock}>
              <Plus className="size-3.5 mr-1" />Add Block
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {blocks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No content blocks yet. Click &quot;Add Block&quot; to add content sections.
            </p>
          )}
          {blocks.map((block, idx) => (
            <div key={block.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <GripVertical className="size-4 text-muted-foreground/40 shrink-0" />
                <Badge variant="outline" className="text-xs">Block {idx + 1}</Badge>
                <div className="flex gap-1 ml-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={idx === 0}
                    onClick={() => moveBlock(idx, "up")}
                    title="Move up"
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={idx === blocks.length - 1}
                    onClick={() => moveBlock(idx, "down")}
                    title="Move down"
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive/70 hover:text-destructive"
                    onClick={() => removeBlock(block.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Block Type</label>
                  <Select value={block.type} onValueChange={(v) => updateBlock(block.id, "type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BLOCK_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Block Title</label>
                  <Input
                    placeholder="Section heading"
                    value={block.title}
                    onChange={(e) => updateBlock(block.id, "title", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Content</label>
                <Textarea
                  placeholder="Write the block content here…"
                  value={block.content}
                  onChange={(e) => updateBlock(block.id, "content", e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bottom save */}
      <div className="flex gap-3 pb-6">
        <Button onClick={saveChanges} disabled={saving}>
          {saving ? <><Loader2 className="size-4 animate-spin mr-1.5" />Saving…</> : <><Save className="size-4 mr-1.5" />Save Changes</>}
        </Button>
      </div>
    </div>
  );
}
