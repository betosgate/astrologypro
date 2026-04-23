"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function NewBlogPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTitleChange(v: string) {
    setTitle(v);
    setSlug(toSlug(v));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setCreating(true);
    setError(null);

    const res = await fetch("/api/admin/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        slug: slug.trim() || toSlug(title.trim()),
        status: "draft",
        content_blocks: [],
      }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to create post");
      setCreating(false);
      return;
    }

    const post = await res.json();
    router.push(`/admin/blog/${post.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/blog"><ArrowLeft className="size-4" /></Link>
        </Button>
        <h1 className="text-xl font-bold">New Blog Post</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create post</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Post title…"
                autoFocus
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">/blog/</span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="post-slug"
                  className="font-mono text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">Auto-derived from title. Can be edited.</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={creating || !title.trim()}>
                {creating ? "Creating…" : "Create &amp; Edit"}
              </Button>
              <Button type="button" variant="ghost" asChild>
                <Link href="/admin/blog">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
