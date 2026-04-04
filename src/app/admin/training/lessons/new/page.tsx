"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
}

export default function NewLessonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    video_url: "",
    pdf_url: "",
    content: "",
    duration_mins: "",
    category_id: "",
    priority: "0",
    is_active: true,
  });

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/admin/training/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories ?? []);
          if (data.categories?.length > 0) {
            setForm((prev) => ({ ...prev, category_id: data.categories[0].id }));
          }
        }
      } catch {
        toast.error("Failed to load categories.");
      }
    }
    loadCategories();
  }, []);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!form.category_id) {
      toast.error("Category is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/training/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          video_url: form.video_url.trim() || null,
          pdf_url: form.pdf_url.trim() || null,
          content: form.content.trim() || null,
          duration_mins: form.duration_mins ? parseInt(form.duration_mins, 10) : null,
          category_id: form.category_id,
          priority: parseInt(form.priority, 10) || 0,
          is_active: form.is_active,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create lesson.");
        return;
      }

      toast.success("Lesson created.");
      router.push("/admin/training");
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/training">← Back</Link>
        </Button>
        <h1 className="text-xl font-bold tracking-tight">New Lesson</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Training Lesson</CardTitle>
          <CardDescription>
            Add a new lesson to a training category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="title">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="e.g. Introduction to Birth Charts"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="category_id">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category_id"
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                {categories.length === 0 ? (
                  <option value="">No categories available</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Brief description of this lesson"
              />
            </div>

            {/* Video URL */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="video_url">
                Video URL
              </label>
              <input
                id="video_url"
                name="video_url"
                type="url"
                value={form.video_url}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="https://..."
              />
            </div>

            {/* PDF URL */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="pdf_url">
                PDF URL
              </label>
              <input
                id="pdf_url"
                name="pdf_url"
                type="url"
                value={form.pdf_url}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="https://..."
              />
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="content">
                Content
              </label>
              <textarea
                id="content"
                name="content"
                value={form.content}
                onChange={handleChange}
                rows={6}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Lesson body text or notes…"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Duration */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="duration_mins">
                  Duration (mins)
                </label>
                <input
                  id="duration_mins"
                  name="duration_mins"
                  type="number"
                  min="0"
                  value={form.duration_mins}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="e.g. 30"
                />
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="priority">
                  Priority
                </label>
                <input
                  id="priority"
                  name="priority"
                  type="number"
                  min="0"
                  value={form.priority}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            {/* Active */}
            <div className="flex items-center gap-3">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={handleChange}
                className="size-4 rounded border-input accent-primary"
              />
              <label className="text-sm font-medium" htmlFor="is_active">
                Active (visible to trainees)
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Create Lesson"}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/admin/training">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
