"use client";

import { useState, useEffect, useRef } from "react";
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
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { uploadTrainingVideo } from "@/lib/training/upload-video";

interface Category {
  id: string;
  name: string;
}

interface LessonOption {
  id: string;
  title: string;
  priority: number;
}

type VideoMode = "youtube" | "url" | "upload";

function normalizeYouTubeUrl(input: string): string {
  try {
    const url = new URL(input);
    let videoId: string | null = null;
    if (url.hostname === "youtu.be") {
      videoId = url.pathname.slice(1).split("?")[0];
    } else if (url.hostname.includes("youtube.com")) {
      videoId = url.searchParams.get("v");
    }
    if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
  } catch {
    // not a valid URL — return as-is
  }
  return input;
}

export default function NewLessonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLessons, setCategoryLessons] = useState<LessonOption[]>([]);
  const [videoMode, setVideoMode] = useState<VideoMode>("youtube");
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    video_url: "",
    pdf_url: "",
    content: "",
    duration_mins: "",
    category_id: "",
    priority: "0",
    previous_lesson_id: "",
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
            const firstId = data.categories[0].id;
            setForm((prev) => ({ ...prev, category_id: firstId }));
            loadLessonsForCategory(firstId);
          }
        }
      } catch {
        toast.error("Failed to load categories.");
      }
    }
    loadCategories();
  }, []);

  async function loadLessonsForCategory(categoryId: string) {
    if (!categoryId) {
      setCategoryLessons([]);
      return;
    }
    try {
      const res = await fetch(`/api/admin/training/lessons?category_id=${categoryId}`);
      if (res.ok) {
        const data = await res.json();
        const sorted = (data.lessons ?? []).sort((a: LessonOption, b: LessonOption) => a.priority - b.priority);
        setCategoryLessons(sorted);
      }
    } catch {
      // non-fatal
    }
  }

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
      if (name === "category_id") {
        setForm((prev) => ({ ...prev, category_id: value, previous_lesson_id: "" }));
        loadLessonsForCategory(value);
      }
    }
  }

  function handlePreviousLessonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const prevId = e.target.value;
    setForm((prev) => ({ ...prev, previous_lesson_id: prevId }));
    if (prevId) {
      const prevLesson = categoryLessons.find((l) => l.id === prevId);
      if (prevLesson) {
        setForm((prev) => ({
          ...prev,
          previous_lesson_id: prevId,
          priority: String(prevLesson.priority + 1),
        }));
      }
    }
  }

  function handleVideoModeChange(mode: VideoMode) {
    setVideoMode(mode);
    setForm((prev) => ({ ...prev, video_url: "" }));
    setUploadedFileName(null);
  }

  async function handleVideoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_MB = 500;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_MB} MB.`);
      e.target.value = "";
      return;
    }

    const allowed = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo"];
    if (!allowed.includes(file.type)) {
      toast.error("Only MP4, WebM, OGG, MOV, and AVI files are allowed.");
      e.target.value = "";
      return;
    }

    setUploadPercent(0);
    try {
      const { url } = await uploadTrainingVideo({
        file,
        onProgress: (percent) => setUploadPercent(percent),
      });
      setForm((prev) => ({ ...prev, video_url: url }));
      setUploadedFileName(file.name);
      toast.success("Video uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploadPercent(null);
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
          previous_lesson_id: form.previous_lesson_id || null,
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

            {/* Previous Lesson */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="previous_lesson_id">
                Previous Lesson
              </label>
              <select
                id="previous_lesson_id"
                value={form.previous_lesson_id}
                onChange={handlePreviousLessonChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">— None (first lesson) —</option>
                {categoryLessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    [{l.priority}] {l.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Selecting a previous lesson sets priority to prev + 1 automatically.
              </p>
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

            {/* Video — 3-mode selector */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Video</p>
              {/* Mode tabs */}
              <div className="flex rounded-md border border-input overflow-hidden text-sm">
                {(["youtube", "url", "upload"] as VideoMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleVideoModeChange(mode)}
                    className={`flex-1 px-3 py-1.5 transition-colors ${
                      videoMode === mode
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {mode === "youtube" ? "YouTube" : mode === "url" ? "Direct URL" : "Upload"}
                  </button>
                ))}
              </div>

              {videoMode === "youtube" && (
                <div className="space-y-1">
                  <input
                    type="url"
                    value={form.video_url}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        video_url: normalizeYouTubeUrl(e.target.value),
                      }))
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste a YouTube watch URL. The ID will be normalised automatically.
                  </p>
                </div>
              )}

              {videoMode === "url" && (
                <input
                  type="url"
                  value={form.video_url}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, video_url: e.target.value }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="https://example.com/video.mp4"
                />
              )}

              {videoMode === "upload" && (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo"
                    onChange={handleVideoFileChange}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary-foreground"
                    disabled={uploadPercent !== null}
                  />
                  {uploadPercent !== null && (
                    <div className="space-y-1">
                      <Progress value={uploadPercent} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Uploading… {uploadPercent}%
                      </p>
                    </div>
                  )}
                  {uploadedFileName && uploadPercent === null && (
                    <p className="text-xs text-green-600">
                      Uploaded: {uploadedFileName}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    MP4, WebM, OGG, MOV or AVI · max 500 MB
                  </p>
                </div>
              )}
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
