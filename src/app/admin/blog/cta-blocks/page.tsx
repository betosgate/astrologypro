"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MousePointerClick, Pencil, Plus, Trash2 } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type CtaType = "course" | "service" | "newsletter" | "generic";

type CtaBlock = {
  id: string;
  name: string;
  title: string;
  body: string | null;
  text: string | null;
  cta_label: string;
  cta_url: string;
  type: CtaType;
  is_active: boolean;
  click_count: number;
  created_at: string;
};

// ─── Type badge ────────────────────────────────────────────────────────────────

const TYPE_CLASSES: Record<CtaType, string> = {
  course:     "bg-blue-100 text-blue-700",
  service:    "bg-purple-100 text-purple-700",
  newsletter: "bg-green-100 text-green-700",
  generic:    "bg-gray-100 text-gray-700",
};

function CtaTypeBadge({ type }: { type: CtaType }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_CLASSES[type] ?? TYPE_CLASSES.generic}`}>
      {type}
    </span>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CtaBlocksPage() {
  const [blocks, setBlocks] = useState<CtaBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/blog/cta-blocks");
    if (res.ok) {
      const json = await res.json();
      setBlocks(Array.isArray(json) ? json : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleToggleActive(block: CtaBlock) {
    setToggling(block.id);
    await fetch(`/api/admin/blog/cta-blocks/${block.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !block.is_active }),
    });
    setBlocks((prev) => prev.map((b) => b.id === block.id ? { ...b, is_active: !b.is_active } : b));
    setToggling(null);
  }

  async function handleDelete(block: CtaBlock) {
    if (!confirm(`Deactivate CTA block "${block.title}"?`)) return;
    setDeleting(block.id);
    await fetch(`/api/admin/blog/cta-blocks/${block.id}`, { method: "DELETE" });
    setBlocks((prev) => prev.map((b) => b.id === block.id ? { ...b, is_active: false } : b));
    setDeleting(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CTA Blocks</h1>
          <p className="text-muted-foreground">Reusable call-to-action blocks for blog posts</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/blog/cta-blocks/new">
            <Plus className="mr-1.5 size-4" />
            New CTA Block
          </Link>
        </Button>
      </div>

      {/* Nav breadcrumb */}
      <div className="flex gap-2 text-sm text-muted-foreground">
        <Link href="/admin/blog" className="hover:text-foreground transition-colors">Posts</Link>
        <span>·</span>
        <Link href="/admin/blog/analytics" className="hover:text-foreground transition-colors">Analytics</Link>
        <span>·</span>
        <span className="text-foreground font-medium">CTA Blocks</span>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MousePointerClick className="size-4" />
            All CTA Blocks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : blocks.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <MousePointerClick className="size-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">No CTA blocks yet.</p>
              <Button asChild size="sm">
                <Link href="/admin/blog/cta-blocks/new">
                  <Plus className="mr-1.5 size-4" /> Create first CTA block
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>CTA URL</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blocks.map((block) => (
                  <TableRow key={block.id} className={!block.is_active ? "opacity-50" : undefined}>
                    <TableCell className="max-w-[200px]">
                      <p className="font-medium truncate">{block.title}</p>
                      {block.body && (
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">{block.body}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <CtaTypeBadge type={block.type ?? "generic"} />
                    </TableCell>
                    <TableCell className="max-w-[160px]">
                      <a
                        href={block.cta_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-amber-600 truncate block transition-colors"
                      >
                        {block.cta_url}
                      </a>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {block.click_count.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleActive(block)}
                        disabled={toggling === block.id}
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer transition-colors ${
                          block.is_active
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {block.is_active ? "Active" : "Inactive"}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/admin/blog/cta-blocks/${block.id}`}>
                            <Pencil className="size-3.5" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                        {block.is_active && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(block)}
                            disabled={deleting === block.id}
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            title="Deactivate"
                          >
                            <Trash2 className="size-3.5" />
                            <span className="sr-only">Deactivate</span>
                          </Button>
                        )}
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
