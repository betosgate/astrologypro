"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye } from "lucide-react";

type MandalismContent = {
  id: string;
  title: string;
  content_type: string;
  access_control: string;
  is_published: boolean;
  priority: number | null;
  created_at: string;
  description: string | null;
  url: string | null;
  pdf_url: string | null;
  start_at: string | null;
  end_at: string | null;
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  live_stream: "Live Stream",
  video: "Video",
  document: "Document",
  youtube: "YouTube",
  announcement: "Announcement",
};

const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default function AdminMandalismPage() {
  const [content, setContent] = useState<MandalismContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [previewItem, setPreviewItem] = useState<MandalismContent | null>(null);

  async function loadContent(overrides?: { createdFrom?: string; createdTo?: string }) {
    setLoading(true);
    const params = new URLSearchParams();
    const cf = overrides?.createdFrom ?? createdFrom;
    const ct = overrides?.createdTo ?? createdTo;
    if (cf) params.set("created_from", cf);
    if (ct) params.set("created_to", ct);
    const res = await fetch(`/api/admin/mandalism?${params}`);
    if (res.ok) setContent(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadContent(); }, []);

  function handleSearch() { loadContent(); }
  function handleReset() { setCreatedFrom(""); setCreatedTo(""); loadContent({ createdFrom: "", createdTo: "" }); }

  return (
    <div className="space-y-6">
      {/* Preview modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewItem(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader><CardTitle>Content Preview</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="font-medium">Title:</span> {previewItem.title}</div>
              <div><span className="font-medium">Type:</span> {CONTENT_TYPE_LABELS[previewItem.content_type] ?? previewItem.content_type}</div>
              <div><span className="font-medium">Access:</span> <Badge variant="outline" className={previewItem.access_control === "free" ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-600"}>{previewItem.access_control === "free" ? "Free" : "Members only"}</Badge></div>
              {previewItem.description && <div><span className="font-medium">Description:</span> {previewItem.description}</div>}
              {previewItem.url && <div><span className="font-medium">URL:</span> <a href={previewItem.url} target="_blank" rel="noreferrer" className="text-blue-500 text-xs break-all hover:underline">{previewItem.url}</a></div>}
              {previewItem.pdf_url && <div><span className="font-medium">PDF URL:</span> <a href={previewItem.pdf_url} target="_blank" rel="noreferrer" className="text-blue-500 text-xs break-all hover:underline">{previewItem.pdf_url}</a></div>}
              {previewItem.start_at && <div><span className="font-medium">Start:</span> {fmt(previewItem.start_at)}</div>}
              {previewItem.end_at && <div><span className="font-medium">End:</span> {fmt(previewItem.end_at)}</div>}
              <div><span className="font-medium">Priority:</span> {previewItem.priority ?? 0}</div>
              <div><span className="font-medium">Published:</span> <Badge variant="outline" className={previewItem.is_published ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>{previewItem.is_published ? "Published" : "Draft"}</Badge></div>
              <div><span className="font-medium">Created:</span> {fmt(previewItem.created_at)}</div>
              <Button size="sm" className="mt-2" onClick={() => setPreviewItem(null)}>Close</Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mandalism Content</h1>
          <p className="text-muted-foreground">Manage Perennial Mandalism content library</p>
        </div>
        <Button asChild>
          <Link href="/admin/mandalism/new">New Content</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date filters */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Created from</Label>
              <Input type="date" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Created to</Label>
              <Input type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} className="w-40" />
            </div>
            <Button size="sm" onClick={handleSearch}>Search</Button>
            <Button size="sm" variant="outline" onClick={handleReset}>Reset</Button>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : !content || content.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No content yet. Create one above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {content.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {CONTENT_TYPE_LABELS[item.content_type] ?? item.content_type}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          item.access_control === "free"
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-amber-500/10 text-amber-600"
                        }
                      >
                        {item.access_control === "free" ? "Free" : "Members only"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.priority ?? 0}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fmt(item.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          item.is_published
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }
                      >
                        {item.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setPreviewItem(item)}><Eye className="size-3.5" /></Button>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/mandalism/${item.id}/edit`}>Edit</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
