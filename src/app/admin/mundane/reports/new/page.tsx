"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, GripVertical, Loader2, Plus, Trash2, BookOpen } from "lucide-react";
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

type Entity = {
  id: string;
  name: string;
  entity_type: string;
  flag_emoji: string | null;
};

type ContentBlock = {
  id: string;
  type: string;
  title: string;
  content: string;
};

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function NewReportPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [reportType, setReportType] = useState("monthly_digest");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");

  const [entities, setEntities] = useState<Entity[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(true);
  const [selectedEntityIds, setSelectedEntityIds] = useState<Set<string>>(new Set());

  const [blocks, setBlocks] = useState<ContentBlock[]>([
    { id: genId(), type: "text", title: "", content: "" },
  ]);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchEntities() {
      try {
        const res = await fetch("/api/mundane/entities?limit=50");
        if (res.ok) {
          const json = await res.json();
          setEntities(json.entities ?? []);
        }
      } finally {
        setLoadingEntities(false);
      }
    }
    fetchEntities();
  }, []);

  function toggleEntity(id: string) {
    setSelectedEntityIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function addBlock() {
    setBlocks((prev) => [
      ...prev,
      { id: genId(), type: "text", title: "", content: "" },
    ]);
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  function updateBlock(id: string, field: keyof Omit<ContentBlock, "id">, value: string) {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (blocks.some((b) => !b.type)) { toast.error("All blocks must have a type"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/mundane/publications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          report_type: reportType,
          entity_ids: Array.from(selectedEntityIds),
          date_range_start: dateRangeStart || undefined,
          date_range_end: dateRangeEnd || undefined,
          content_blocks: blocks.map(({ id: _id, ...b }) => b),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail ?? "Failed to create report");
        return;
      }

      const pub = await res.json();
      toast.success("Report created");
      router.push(`/admin/mundane/reports/${pub.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2 text-muted-foreground">
          <Link href="/admin/mundane/reports">
            <ArrowLeft className="size-4 mr-1" />Back to Reports
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <BookOpen className="size-6 text-emerald-500" />
          <h1 className="text-2xl font-bold tracking-tight">New Report</h1>
        </div>
        <p className="text-muted-foreground mt-1">Fill in the details to create a new mundane astrology publication.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic fields */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Report Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Title *</label>
              <Input
                placeholder="e.g. April 2026 Mundane Digest"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Subtitle</label>
              <Input
                placeholder="Optional subtitle or tagline"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
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
          </CardContent>
        </Card>

        {/* Entity selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Entities
              {selectedEntityIds.size > 0 && (
                <Badge variant="outline" className="text-xs font-normal">
                  {selectedEntityIds.size} selected
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingEntities ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : entities.length === 0 ? (
              <p className="text-xs text-muted-foreground">No entities found.</p>
            ) : (
              <div className="grid gap-1.5 max-h-52 overflow-y-auto pr-1">
                {entities.map((e) => {
                  const checked = selectedEntityIds.has(e.id);
                  return (
                    <label
                      key={e.id}
                      className={`flex items-center gap-2.5 rounded-md px-3 py-2 cursor-pointer text-sm transition-colors ${
                        checked ? "bg-emerald-50 border border-emerald-200" : "border border-transparent hover:bg-muted/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleEntity(e.id)}
                        className="shrink-0"
                      />
                      {e.flag_emoji && <span>{e.flag_emoji}</span>}
                      <span className="flex-1 truncate">{e.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">{e.entity_type}</span>
                    </label>
                  );
                })}
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
                      disabled={blocks.length === 1}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Block Type</label>
                    <Select value={block.type} onValueChange={(v) => updateBlock(block.id, "type", v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
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

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <><Loader2 className="size-4 animate-spin mr-1.5" />Creating…</>
            ) : (
              <><Plus className="size-4 mr-1.5" />Create Report</>
            )}
          </Button>
          <Button type="button" variant="ghost" asChild>
            <Link href="/admin/mundane/reports">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
