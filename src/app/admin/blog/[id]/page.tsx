"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ArrowLeft,
  History,
  Clock,
  Hash,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type BlogStatus = "draft" | "in_review" | "approved" | "scheduled" | "published" | "unpublished" | "archived";

type BlockType = "paragraph" | "heading" | "image" | "quote" | "callout" | "divider" | "cta";

type ContentBlock = {
  type: BlockType;
  content?: unknown;
};

type Author = { id: string; name: string };
type Category = { id: string; name: string; slug: string };
type Tag = { id: string; name: string; slug: string };
type Series = { id: string; name: string };
type Revision = {
  id: string;
  changed_by: string | null;
  previous_title: string | null;
  previous_status: string | null;
  change_summary: string | null;
  created_at: string;
};

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  cover_image_alt: string | null;
  status: BlogStatus;
  featured: boolean;
  hero: boolean;
  author_id: string | null;
  series_id: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  reading_time_minutes: number | null;
  word_count: number | null;
  content_blocks: ContentBlock[];
  scheduled_at: string | null;
  published_at: string | null;
  blog_post_categories: Array<{ category_id: string; blog_categories: Category }>;
  blog_post_tags: Array<{ tag_id: string; blog_tags: Tag }>;
  blog_post_revisions: Revision[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_STATUSES: BlogStatus[] = [
  "draft", "in_review", "approved", "scheduled", "published", "unpublished", "archived",
];

const STATUS_LABELS: Record<BlogStatus, string> = {
  draft:       "Draft",
  in_review:   "In Review",
  approved:    "Approved",
  scheduled:   "Scheduled",
  published:   "Published",
  unpublished: "Unpublished",
  archived:    "Archived",
};

const BLOCK_TYPES: BlockType[] = ["paragraph", "heading", "image", "quote", "callout", "divider", "cta"];

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

// ─── Block Editor ─────────────────────────────────────────────────────────────

function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}) {
  function addBlock(type: BlockType) {
    onChange([...blocks, { type, content: type === "divider" ? null : "" }]);
  }

  function removeBlock(idx: number) {
    onChange(blocks.filter((_, i) => i !== idx));
  }

  function moveBlock(idx: number, dir: "up" | "down") {
    const next = [...blocks];
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange(next);
  }

  function updateBlock(idx: number, content: string) {
    const next = [...blocks];
    try {
      next[idx] = { ...next[idx], content: JSON.parse(content) };
    } catch {
      next[idx] = { ...next[idx], content };
    }
    onChange(next);
  }

  function updateBlockType(idx: number, type: BlockType) {
    const next = [...blocks];
    next[idx] = { ...next[idx], type };
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, idx) => (
        <div key={idx} className="border rounded-lg p-3 space-y-2 bg-muted/30">
          <div className="flex items-center gap-2">
            <select
              value={block.type}
              onChange={(e) => updateBlockType(idx, e.target.value as BlockType)}
              className="flex h-7 rounded-md border border-input bg-background px-2 text-xs shadow-sm"
            >
              {BLOCK_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveBlock(idx, "up")}
                disabled={idx === 0}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronUp className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => moveBlock(idx, "down")}
                disabled={idx === blocks.length - 1}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronDown className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => removeBlock(idx)}
                className="rounded p-0.5 text-red-500 hover:text-red-600"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
          {block.type !== "divider" && (
            <Textarea
              value={
                typeof block.content === "string"
                  ? block.content
                  : JSON.stringify(block.content, null, 2)
              }
              onChange={(e) => updateBlock(idx, e.target.value)}
              rows={block.type === "paragraph" ? 4 : 2}
              placeholder={`${block.type} content…`}
              className="font-mono text-xs resize-y"
            />
          )}
          {block.type === "divider" && (
            <div className="border-t my-1 opacity-40" />
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-1.5 pt-1">
        {BLOCK_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => addBlock(type)}
            className="inline-flex items-center gap-1 rounded border border-dashed px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-solid transition-colors"
          >
            <Plus className="size-3" /> {type}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BlogEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [status, setStatus] = useState<BlogStatus>("draft");
  const [authorId, setAuthorId] = useState("");
  const [seriesId, setSeriesId] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [featured, setFeatured] = useState(false);
  const [hero, setHero] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [coverImageAlt, setCoverImageAlt] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [changeSummary, setChangeSummary] = useState("");

  const loadMeta = useCallback(async () => {
    const [authorsRes, catsRes, seriesRes] = await Promise.all([
      fetch("/api/admin/blog/authors"),
      fetch("/api/admin/blog/categories"),
      fetch("/api/admin/blog/series"),
    ]);
    if (authorsRes.ok) setAuthors(await authorsRes.json());
    if (catsRes.ok) setCategories(await catsRes.json());
    if (seriesRes.ok) setSeriesList(await seriesRes.json());
  }, []);

  const loadPost = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const res = await fetch(`/api/admin/blog/${id}`);
    if (!res.ok) {
      setError("Post not found");
      setLoading(false);
      return;
    }
    const data: Post = await res.json();
    setPost(data);
    // Populate form
    setTitle(data.title);
    setSlug(data.slug);
    setExcerpt(data.excerpt ?? "");
    setContentBlocks(Array.isArray(data.content_blocks) ? data.content_blocks : []);
    setStatus(data.status);
    setAuthorId(data.author_id ?? "");
    setSeriesId(data.series_id ?? "");
    setSelectedCategoryIds(data.blog_post_categories.map((pc) => pc.category_id));
    setTagInput(data.blog_post_tags.map((pt) => pt.blog_tags.name).join(", "));
    setFeatured(data.featured);
    setHero(data.hero);
    setScheduledAt(data.scheduled_at ? data.scheduled_at.slice(0, 16) : "");
    setImageUrl(data.image_url ?? "");
    setCoverImageAlt(data.cover_image_alt ?? "");
    setOgTitle(data.og_title ?? "");
    setOgDescription(data.og_description ?? "");
    setOgImageUrl(data.og_image_url ?? "");
    setSeoTitle(data.seo_title ?? "");
    setSeoDescription(data.seo_description ?? "");
    setCanonicalUrl(data.canonical_url ?? "");
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadMeta();
    loadPost();
  }, [loadMeta, loadPost]);

  function handleTitleChange(v: string) {
    setTitle(v);
    if (post && post.slug === slug) return; // slug was customised, leave it
    setSlug(toSlug(v));
  }

  function toggleCategory(catId: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  }

  async function handleSave(nextStatus?: BlogStatus) {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    const tagNames = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: Record<string, unknown> = {
      title: title.trim(),
      slug: slug.trim() || toSlug(title),
      excerpt: excerpt || null,
      image_url: imageUrl || null,
      cover_image_alt: coverImageAlt || null,
      status: nextStatus ?? status,
      author_id: authorId || null,
      series_id: seriesId || null,
      featured,
      hero,
      og_title: ogTitle || null,
      og_description: ogDescription || null,
      og_image_url: ogImageUrl || null,
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      canonical_url: canonicalUrl || null,
      content_blocks: contentBlocks,
      category_ids: selectedCategoryIds,
      tag_names: tagNames,
      change_summary: changeSummary || null,
    };

    if ((nextStatus ?? status) === "scheduled" && scheduledAt) {
      payload.scheduled_at = new Date(scheduledAt).toISOString();
    }

    try {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to save");
      }

      const updated: Post = await res.json();
      setPost(updated);
      setStatus(updated.status);
      setChangeSummary("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  // ── Computed reading time from current blocks ─────────────────────────────
  const estimatedWords = contentBlocks.reduce((acc, block) => {
    if (["paragraph", "heading", "quote", "callout"].includes(block.type)) {
      const text = typeof block.content === "string" ? block.content : JSON.stringify(block.content ?? "");
      return acc + text.split(/\s+/).filter(Boolean).length;
    }
    return acc;
  }, 0);
  const estimatedReadTime = Math.max(1, Math.ceil(estimatedWords / 200));

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (error && !post) {
    return (
      <div className="py-12 text-center">
        <p className="text-destructive">{error}</p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="/admin/blog"><ArrowLeft className="mr-1.5 size-4" /> Back to posts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/blog"><ArrowLeft className="size-4" /></Link>
          </Button>
          <h1 className="text-xl font-bold">{post ? "Edit Post" : "New Post"}</h1>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            status === "published" ? "bg-green-100 text-green-700" :
            status === "draft" ? "bg-gray-100 text-gray-700" :
            status === "in_review" ? "bg-yellow-100 text-yellow-700" :
            status === "approved" ? "bg-blue-100 text-blue-700" :
            status === "scheduled" ? "bg-purple-100 text-purple-700" :
            status === "unpublished" ? "bg-orange-100 text-orange-700" :
            "bg-red-100 text-red-700"
          }`}>
            {STATUS_LABELS[status]}
          </span>
        </div>
        {saveSuccess && <span className="text-sm text-green-600">Saved!</span>}
        {error && <span className="text-sm text-destructive">{error}</span>}
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => handleSave()} disabled={saving}>
            {saving ? "Saving…" : "Save Draft"}
          </Button>
          {status === "draft" && (
            <Button size="sm" variant="outline" onClick={() => handleSave("in_review")} disabled={saving}>
              Submit for Review
            </Button>
          )}
          {status === "in_review" && (
            <Button size="sm" variant="outline" onClick={() => handleSave("approved")} disabled={saving}>
              Approve
            </Button>
          )}
          {(status === "approved" || status === "unpublished") && (
            <Button size="sm" onClick={() => handleSave("published")} disabled={saving}>
              Publish
            </Button>
          )}
          {status === "approved" && (
            <Button size="sm" variant="outline" onClick={() => handleSave("scheduled")} disabled={saving}>
              Schedule
            </Button>
          )}
          {status === "published" && (
            <Button size="sm" variant="outline" onClick={() => handleSave("unpublished")} disabled={saving}>
              Unpublish
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* ── Left panel ─────────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Post title…"
              className="text-lg font-medium"
            />
          </div>

          {/* Slug */}
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
          </div>

          {/* Content blocks */}
          <div className="space-y-2">
            <Label>Content Blocks</Label>
            <BlockEditor blocks={contentBlocks} onChange={setContentBlocks} />
          </div>

          {/* Excerpt */}
          <div className="space-y-1.5">
            <Label>Excerpt</Label>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              placeholder="Short description shown on blog listing…"
            />
          </div>

          {/* Change summary */}
          <div className="space-y-1.5">
            <Label>Change Summary <span className="text-xs text-muted-foreground">(for revision history)</span></Label>
            <Input
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder="What changed in this save?"
            />
          </div>
        </div>

        {/* ── Right panel ────────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Status */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BlogStatus)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                >
                  {VALID_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              {status === "scheduled" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Schedule date/time</Label>
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </div>
              )}
              {post?.published_at && (
                <p className="text-xs text-muted-foreground">
                  Published: {fmtDate(post.published_at)}
                </p>
              )}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="size-4"
                  />
                  Featured
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hero}
                    onChange={(e) => setHero(e.target.checked)}
                    className="size-4"
                  />
                  Hero
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Author + Series */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Author &amp; Series</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Author</Label>
                <select
                  value={authorId}
                  onChange={(e) => setAuthorId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">— None —</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Series</Label>
                <select
                  value={seriesId}
                  onChange={(e) => setSeriesId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">— None —</option>
                  {seriesList.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Categories</CardTitle></CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No categories yet.{" "}
                  <Link href="/admin/blog/categories" className="underline">Add one</Link>.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                        className="size-4"
                      />
                      {cat.name}
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Hash className="size-3.5" /> Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="astrology, moon, tarot"
              />
              <p className="text-xs text-muted-foreground">Comma-separated. New tags are auto-created.</p>
            </CardContent>
          </Card>

          {/* Cover image */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Cover Image</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Image URL</Label>
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Alt text</Label>
                <Input value={coverImageAlt} onChange={(e) => setCoverImageAlt(e.target.value)} placeholder="Describe the image…" />
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader><CardTitle className="text-sm">SEO</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">SEO Title</Label>
                <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Override title for search…" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">SEO Description</Label>
                <Textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={2} placeholder="Meta description…" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">OG Title</Label>
                <Input value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} placeholder="Social share title…" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">OG Description</Label>
                <Textarea value={ogDescription} onChange={(e) => setOgDescription(e.target.value)} rows={2} placeholder="Social share description…" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">OG Image URL</Label>
                <Input value={ogImageUrl} onChange={(e) => setOgImageUrl(e.target.value)} placeholder="https://…" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Canonical URL</Label>
                <Input value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} placeholder="https://…" />
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          {(estimatedWords > 0 || post?.reading_time_minutes) && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    ~{estimatedReadTime} min read
                  </span>
                  <span>{estimatedWords} words</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Revision history */}
      {post && post.blog_post_revisions && post.blog_post_revisions.length > 0 && (
        <Card>
          <CardHeader>
            <button
              type="button"
              onClick={() => setShowRevisions((v) => !v)}
              className="flex items-center gap-2 text-sm font-semibold hover:text-foreground text-muted-foreground"
            >
              <History className="size-4" />
              Revision History ({post.blog_post_revisions.length})
              {showRevisions ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
          </CardHeader>
          {showRevisions && (
            <CardContent>
              <div className="space-y-2">
                {post.blog_post_revisions.map((rev) => (
                  <div key={rev.id} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0">
                    <div className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(rev.created_at)}</div>
                    <div className="flex-1">
                      {rev.previous_title && (
                        <p className="text-muted-foreground">Title was: <em>{rev.previous_title}</em></p>
                      )}
                      {rev.previous_status && (
                        <Badge variant="outline" className="text-xs mr-1">{rev.previous_status}</Badge>
                      )}
                      {rev.change_summary && (
                        <p className="mt-0.5">{rev.change_summary}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
