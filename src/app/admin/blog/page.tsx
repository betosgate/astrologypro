"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, FileText, Pencil, Copy, Archive, Search } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type BlogStatus = "draft" | "in_review" | "approved" | "scheduled" | "published" | "unpublished" | "archived";

type PostAuthor = { id: string; name: string; avatar_url: string | null } | null;

type PostCategory = {
  category_id: string;
  blog_categories: { id: string; name: string; slug: string };
};

type PostTag = {
  tag_id: string;
  blog_tags: { id: string; name: string; slug: string };
};

type Post = {
  id: string;
  title: string;
  slug: string;
  status: BlogStatus;
  excerpt: string | null;
  featured: boolean;
  hero: boolean;
  reading_time_minutes: number | null;
  published_at: string | null;
  scheduled_at: string | null;
  updated_at: string;
  author: PostAuthor;
  blog_post_categories: PostCategory[];
  blog_post_tags: PostTag[];
};

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_TABS: { value: BlogStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "in_review", label: "In Review" },
  { value: "approved", label: "Approved" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "unpublished", label: "Unpublished" },
  { value: "archived", label: "Archived" },
];

const STATUS_CLASSES: Record<BlogStatus, string> = {
  draft:       "bg-gray-100 text-gray-700",
  in_review:   "bg-yellow-100 text-yellow-700",
  approved:    "bg-blue-100 text-blue-700",
  scheduled:   "bg-purple-100 text-purple-700",
  published:   "bg-green-100 text-green-700",
  unpublished: "bg-orange-100 text-orange-700",
  archived:    "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<BlogStatus, string> = {
  draft:       "Draft",
  in_review:   "In Review",
  approved:    "Approved",
  scheduled:   "Scheduled",
  published:   "Published",
  unpublished: "Unpublished",
  archived:    "Archived",
};

function StatusBadge({ status }: { status: BlogStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<BlogStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);

  const load = useCallback(async (status: BlogStatus | "all", q: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (q) params.set("search", q);
    params.set("limit", "100");
    const res = await fetch(`/api/admin/blog?${params}`);
    if (res.ok) {
      const json = await res.json();
      setPosts(json.posts ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load(activeStatus, search);
  }, [activeStatus, search, load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
  }

  async function handleDuplicate(post: Post) {
    setDuplicating(post.id);
    const res = await fetch("/api/admin/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${post.title} (Copy)`,
        excerpt: post.excerpt,
        status: "draft",
        author_id: post.author?.id ?? null,
      }),
    });
    if (res.ok) {
      await load(activeStatus, search);
    }
    setDuplicating(null);
  }

  async function handleArchive(post: Post) {
    if (!confirm(`Archive "${post.title}"? It will be removed from the public site.`)) return;
    setArchiving(post.id);
    await fetch(`/api/admin/blog/${post.id}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    setArchiving(null);
  }

  const counts = posts.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-muted-foreground">{counts} post{counts !== 1 ? "s" : ""} shown</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/blog/new">
            <Plus className="mr-1.5 size-4" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-1 border-b pb-0">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveStatus(tab.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-t-md transition-colors ${
              activeStatus === tab.value
                ? "border-b-2 border-amber-500 text-amber-600"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title…"
            className="pl-8"
          />
        </div>
        <Button type="submit" size="sm" variant="outline">Search</Button>
        {search && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => { setSearch(""); setSearchInput(""); }}
          >
            Clear
          </Button>
        )}
      </form>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="size-4" />
            Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <FileText className="size-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">No posts found.</p>
              <Button asChild size="sm">
                <Link href="/admin/blog/new">
                  <Plus className="mr-1.5 size-4" /> Create your first post
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Read time</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="max-w-[240px]">
                      <div>
                        <p className="font-medium truncate">{post.title}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">/blog/{post.slug}</p>
                        <div className="flex gap-1 mt-0.5">
                          {post.featured && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0">Featured</Badge>
                          )}
                          {post.hero && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0">Hero</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {post.author?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {post.blog_post_categories.map((pc) => (
                          <Badge key={pc.category_id} variant="secondary" className="text-xs">
                            {pc.blog_categories.name}
                          </Badge>
                        ))}
                        {post.blog_post_categories.length === 0 && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={post.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {post.reading_time_minutes ? `${post.reading_time_minutes} min` : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {post.status === "scheduled" && post.scheduled_at
                        ? `Scheduled ${fmt(post.scheduled_at)}`
                        : fmt(post.published_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/admin/blog/${post.id}`}>
                            <Pencil className="size-3.5" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDuplicate(post)}
                          disabled={duplicating === post.id}
                          title="Duplicate as draft"
                        >
                          <Copy className="size-3.5" />
                          <span className="sr-only">Duplicate</span>
                        </Button>
                        {post.status !== "archived" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleArchive(post)}
                            disabled={archiving === post.id}
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            title="Archive"
                          >
                            <Archive className="size-3.5" />
                            <span className="sr-only">Archive</span>
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
