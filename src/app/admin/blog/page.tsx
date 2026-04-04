"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, FileText } from "lucide-react";

const CATEGORIES = ["Business", "Astrology", "Tarot", "Spirituality", "General"];

type Post = {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string | null;
  image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
};

type FormState = {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  image_url: string;
  is_published: boolean;
};

const EMPTY_FORM: FormState = {
  title: "", slug: "", category: "General", excerpt: "", content: "", image_url: "", is_published: false,
};

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/blog");
    if (res.ok) setPosts(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function F(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const title = e.target.value;
    setForm((f) => ({ ...f, title, slug: editId ? f.slug : toSlug(title) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const url = editId ? `/api/admin/blog/${editId}` : "/api/admin/blog";
    const res = await fetch(url, {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        excerpt: form.excerpt || null,
        content: form.content || null,
        image_url: form.image_url || null,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed");
    } else {
      await load();
      setShowForm(false);
      setEditId(null);
      setForm({ ...EMPTY_FORM });
    }
    setSaving(false);
  }

  async function openEdit(id: string) {
    const res = await fetch(`/api/admin/blog/${id}`);
    if (!res.ok) return;
    const post = await res.json();
    setEditId(id);
    setForm({
      title: post.title,
      slug: post.slug,
      category: post.category,
      excerpt: post.excerpt ?? "",
      content: post.content ?? "",
      image_url: post.image_url ?? "",
      is_published: post.is_published,
    });
    setShowForm(true);
  }

  async function togglePublish(post: Post) {
    await fetch(`/api/admin/blog/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !post.is_published }),
    });
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, is_published: !p.is_published } : p));
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  const published = posts.filter((p) => p.is_published).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground">{posts.length} total · {published} published</p>
        </div>
        <Button size="sm" onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowForm(true); }}>
          <Plus className="mr-1.5 size-4" /> New Post
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editId ? "Edit Post" : "New Blog Post"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={handleTitleChange} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug *</Label>
                  <Input value={form.slug} onChange={F("slug")} required placeholder="my-post-slug" />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={form.category}
                    onChange={F("category")}
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Excerpt</Label>
                  <Textarea value={form.excerpt} onChange={F("excerpt")} rows={2} placeholder="Short description shown on blog listing…" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Content (HTML)</Label>
                  <Textarea value={form.content} onChange={F("content")} rows={10} placeholder="<p>Your article content here…</p>" className="font-mono text-xs" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Image URL</Label>
                  <Input value={form.image_url} onChange={F("image_url")} placeholder="https://…" />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                    className="size-4"
                  />
                  <Label>Publish immediately</Label>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={saving}>{saving ? "Saving…" : editId ? "Update" : "Create"}</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No blog posts yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{post.title}</span>
                      <Badge variant="secondary" className="text-xs">{post.category}</Badge>
                      {post.is_published
                        ? <Badge variant="default" className="text-xs">Published</Badge>
                        : <Badge variant="outline" className="text-xs">Draft</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">/blog/{post.slug}</p>
                    {post.excerpt && <p className="text-sm text-muted-foreground">{post.excerpt}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => togglePublish(post)}>
                      {post.is_published ? "Unpublish" : "Publish"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(post.id)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(post.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
