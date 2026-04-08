"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { createClient } from "@/lib/supabase/client";
import { TrainingNotes } from "@/components/admin/training-notes";

// ---- types for sub-resource sections ----

interface LessonVideo {
  id: string;
  lesson_id: string;
  title: string;
  video_url: string;
  duration_mins: number | null;
  priority: number;
}

interface LessonAsset {
  id: string;
  lesson_id: string;
  title: string;
  asset_type: string;
  url: string;
  file_size_bytes: number | null;
  is_downloadable: boolean;
  priority: number;
}

interface QuizQuestion {
  id: string;
  lesson_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  priority: number;
  // Module 04 — question-level remediation metadata. All optional; nulls
  // mean the runtime falls back to inline retry instead of video remediation.
  remediation_video_id?: string | null;
  remediation_video_index?: number | null;
  remediation_start_seconds?: number | null;
  remediation_replay_until_seconds?: number | null;
  remediation_message?: string | null;
}

const ASSET_TYPES = ["pdf", "doc", "image", "link", "other"] as const;
const OPTION_LABELS = ["A", "B", "C", "D"];

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

function detectVideoMode(url: string | null): VideoMode {
  if (!url) return "youtube";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  return "url";
}

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

export default function EditLessonPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLessons, setCategoryLessons] = useState<LessonOption[]>([]);
  const [videoMode, setVideoMode] = useState<VideoMode>("youtube");
  const [uploadProgress, setUploadProgress] = useState(false);
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

  // ---- lesson videos state ----
  const [videos, setVideos] = useState<LessonVideo[]>([]);
  const [videosOpen, setVideosOpen] = useState(false);
  const [videoForm, setVideoForm] = useState({
    title: "",
    video_url: "",
    duration_mins: "",
    priority: "0",
  });
  const [videoSaving, setVideoSaving] = useState(false);

  // ---- lesson assets state ----
  const [assets, setAssets] = useState<LessonAsset[]>([]);
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [assetForm, setAssetForm] = useState({
    title: "",
    asset_type: "pdf",
    url: "",
    file_size_bytes: "",
    is_downloadable: false,
    priority: "0",
  });
  const [assetSaving, setAssetSaving] = useState(false);

  // ---- quiz questions state ----
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [quizForm, setQuizForm] = useState({
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correct_answer: "0",
    explanation: "",
    priority: "0",
    // Module 04 / 05: per-question remediation. All optional.
    // When start/until are filled, the new stepwise quiz client will pause
    // the video on a wrong answer, seek to start_seconds, replay until
    // replay_until_seconds, then return focus to the quiz for retry.
    remediation_video_index: "",
    remediation_start_seconds: "",
    remediation_replay_until_seconds: "",
    remediation_message: "",
  });
  const [quizSaving, setQuizSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [lessonRes, catsRes] = await Promise.all([
          fetch(`/api/admin/training/lessons/${id}`),
          fetch("/api/admin/training/categories"),
        ]);

        if (!lessonRes.ok) {
          toast.error("Lesson not found.");
          router.push("/admin/training");
          return;
        }

        const lessonData = await lessonRes.json();
        const catsData = catsRes.ok ? await catsRes.json() : { categories: [] };

        setCategories(catsData.categories ?? []);

        const l = lessonData.lesson;
        setVideoMode(detectVideoMode(l.video_url));
        setForm({
          title: l.title ?? "",
          description: l.description ?? "",
          video_url: l.video_url ?? "",
          pdf_url: l.pdf_url ?? "",
          content: l.content ?? "",
          duration_mins: l.duration_mins != null ? String(l.duration_mins) : "",
          category_id: l.category_id ?? "",
          priority: String(l.priority ?? 0),
          previous_lesson_id: l.previous_lesson_id ?? "",
          is_active: l.is_active ?? true,
        });

        // Load sibling lessons for the "previous lesson" dropdown (exclude self)
        if (l.category_id) {
          const siblingsRes = await fetch(`/api/admin/training/lessons?category_id=${l.category_id}`);
          if (siblingsRes.ok) {
            const siblingsData = await siblingsRes.json();
            const sorted = (siblingsData.lessons ?? [])
              .filter((s: LessonOption) => s.id !== id)
              .sort((a: LessonOption, b: LessonOption) => a.priority - b.priority);
            setCategoryLessons(sorted);
          }
        }
      } catch {
        toast.error("Failed to load lesson.");
        router.push("/admin/training");
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [id, router]);

  // ---- load sub-resources ----
  const loadVideos = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/training/lessons/${id}/videos`);
      if (res.ok) {
        const data = await res.json();
        const list: LessonVideo[] = data.videos ?? [];
        setVideos(list);
        if (list.length > 0) setVideosOpen(true);
      }
    } catch {
      // non-fatal
    }
  }, [id]);

  const loadAssets = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/training/lessons/${id}/assets`);
      if (res.ok) {
        const data = await res.json();
        const list: LessonAsset[] = data.assets ?? [];
        setAssets(list);
        if (list.length > 0) setAssetsOpen(true);
      }
    } catch {
      // non-fatal
    }
  }, [id]);

  const loadQuestions = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/training/quiz/${id}`);
      if (res.ok) {
        const data = await res.json();
        const list: QuizQuestion[] = data.questions ?? [];
        setQuestions(list);
        if (list.length > 0) setQuestionsOpen(true);
      }
    } catch {
      // non-fatal
    }
  }, [id]);

  useEffect(() => {
    loadVideos();
    loadAssets();
    loadQuestions();
  }, [loadVideos, loadAssets, loadQuestions]);

  // ---- video handlers ----
  async function handleAddVideo(e: React.FormEvent) {
    e.preventDefault();
    if (!videoForm.title.trim()) {
      toast.error("Video title is required.");
      return;
    }
    if (!videoForm.video_url.trim()) {
      toast.error("Video URL is required.");
      return;
    }
    setVideoSaving(true);
    try {
      const res = await fetch(`/api/admin/training/lessons/${id}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: videoForm.title.trim(),
          video_url: videoForm.video_url.trim(),
          duration_mins: videoForm.duration_mins ? parseInt(videoForm.duration_mins, 10) : null,
          priority: parseInt(videoForm.priority, 10) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to add video.");
        return;
      }
      toast.success("Video added.");
      setVideoForm({ title: "", video_url: "", duration_mins: "", priority: "0" });
      await loadVideos();
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setVideoSaving(false);
    }
  }

  async function handleDeleteVideo(videoId: string) {
    if (!confirm("Delete this video?")) return;
    try {
      const res = await fetch(
        `/api/admin/training/lessons/${id}/videos?video_id=${videoId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to delete video.");
        return;
      }
      toast.success("Video deleted.");
      await loadVideos();
    } catch {
      toast.error("An unexpected error occurred.");
    }
  }

  // ---- asset handlers ----
  async function handleAddAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!assetForm.title.trim()) {
      toast.error("Asset title is required.");
      return;
    }
    if (!assetForm.url.trim()) {
      toast.error("Asset URL is required.");
      return;
    }
    setAssetSaving(true);
    try {
      const res = await fetch(`/api/admin/training/lessons/${id}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: assetForm.title.trim(),
          asset_type: assetForm.asset_type,
          url: assetForm.url.trim(),
          file_size_bytes: assetForm.file_size_bytes
            ? parseInt(assetForm.file_size_bytes, 10)
            : null,
          is_downloadable: assetForm.is_downloadable,
          priority: parseInt(assetForm.priority, 10) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to add asset.");
        return;
      }
      toast.success("Asset added.");
      setAssetForm({
        title: "",
        asset_type: "pdf",
        url: "",
        file_size_bytes: "",
        is_downloadable: false,
        priority: "0",
      });
      await loadAssets();
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setAssetSaving(false);
    }
  }

  async function handleDeleteAsset(assetId: string) {
    if (!confirm("Delete this asset?")) return;
    try {
      const res = await fetch(
        `/api/admin/training/lessons/${id}/assets?asset_id=${assetId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to delete asset.");
        return;
      }
      toast.success("Asset deleted.");
      await loadAssets();
    } catch {
      toast.error("An unexpected error occurred.");
    }
  }

  // ---- quiz handlers ----
  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!quizForm.question.trim()) {
      toast.error("Question text is required.");
      return;
    }
    const options = [
      quizForm.optionA.trim(),
      quizForm.optionB.trim(),
      quizForm.optionC.trim(),
      quizForm.optionD.trim(),
    ].filter(Boolean);
    if (options.length < 2) {
      toast.error("At least 2 options are required.");
      return;
    }
    const correctIdx = parseInt(quizForm.correct_answer, 10);
    if (correctIdx >= options.length) {
      toast.error("Correct answer index exceeds number of filled options.");
      return;
    }
    // Coerce remediation fields. Empty strings -> null.
    const parseIntOrNull = (s: string) => {
      if (!s.trim()) return null;
      const n = parseInt(s, 10);
      return Number.isFinite(n) && n >= 0 ? n : null;
    };
    const remStart = parseIntOrNull(quizForm.remediation_start_seconds);
    const remUntil = parseIntOrNull(quizForm.remediation_replay_until_seconds);
    const remIndex = parseIntOrNull(quizForm.remediation_video_index);
    if (remStart !== null && remUntil !== null && remUntil <= remStart) {
      toast.error(
        "Remediation replay-until seconds must be greater than start seconds.",
      );
      return;
    }

    setQuizSaving(true);
    try {
      const res = await fetch(`/api/admin/training/quiz/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: quizForm.question.trim(),
          options,
          correct_answer: correctIdx,
          explanation: quizForm.explanation.trim() || null,
          priority: parseInt(quizForm.priority, 10) || 0,
          remediation_video_index: remIndex,
          remediation_start_seconds: remStart,
          remediation_replay_until_seconds: remUntil,
          remediation_message: quizForm.remediation_message.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to add question.");
        return;
      }
      toast.success("Question added.");
      setQuizForm({
        question: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correct_answer: "0",
        explanation: "",
        priority: "0",
        remediation_video_index: "",
        remediation_start_seconds: "",
        remediation_replay_until_seconds: "",
        remediation_message: "",
      });
      await loadQuestions();
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setQuizSaving(false);
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!confirm("Delete this question?")) return;
    try {
      const res = await fetch(
        `/api/admin/training/quiz/${id}?question_id=${questionId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to delete question.");
        return;
      }
      toast.success("Question deleted.");
      await loadQuestions();
    } catch {
      toast.error("An unexpected error occurred.");
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
        // Reload siblings for new category, excluding self
        fetch(`/api/admin/training/lessons?category_id=${value}`)
          .then((r) => r.json())
          .then((data) => {
            const sorted = (data.lessons ?? [])
              .filter((s: LessonOption) => s.id !== id)
              .sort((a: LessonOption, b: LessonOption) => a.priority - b.priority);
            setCategoryLessons(sorted);
          })
          .catch(() => {});
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

    setUploadProgress(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `lessons/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("training-videos")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) {
        toast.error(`Upload failed: ${error.message}`);
        return;
      }

      const { data: publicData } = supabase.storage
        .from("training-videos")
        .getPublicUrl(path);

      setForm((prev) => ({ ...prev, video_url: publicData.publicUrl }));
      setUploadedFileName(file.name);
      toast.success("Video uploaded.");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploadProgress(false);
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
      const res = await fetch(`/api/admin/training/lessons/${id}`, {
        method: "PUT",
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
        toast.error(data.error ?? "Failed to update lesson.");
        return;
      }

      toast.success("Lesson updated.");
      router.push("/admin/training");
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this lesson? Associated quizzes will also be deleted.")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/training/lessons/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to delete lesson.");
        return;
      }
      toast.success("Lesson deleted.");
      router.push("/admin/training");
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/training">← Back</Link>
        </Button>
        <h1 className="text-xl font-bold tracking-tight">Edit Lesson</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update Training Lesson</CardTitle>
          <CardDescription>Edit the details for this lesson.</CardDescription>
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
                    disabled={uploadProgress}
                  />
                  {uploadProgress && (
                    <p className="text-xs text-muted-foreground">Uploading…</p>
                  )}
                  {uploadedFileName && !uploadProgress && (
                    <p className="text-xs text-green-600">
                      Uploaded: {uploadedFileName}
                    </p>
                  )}
                  {form.video_url && !uploadedFileName && (
                    <p className="text-xs text-muted-foreground break-all">
                      Current: {form.video_url}
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

            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving…" : "Save Changes"}
                </Button>
                <Button asChild type="button" variant="outline">
                  <Link href="/admin/training">Cancel</Link>
                </Button>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ---- Lesson Videos ---- */}
      <Card>
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setVideosOpen((o) => !o)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Lesson Videos</CardTitle>
            <span className="text-sm text-muted-foreground">
              {videos.length > 0 ? `${videos.length} video${videos.length !== 1 ? "s" : ""}` : "None"}{" "}
              {videosOpen ? "▲" : "▼"}
            </span>
          </div>
          <CardDescription>
            Additional video resources attached to this lesson.
          </CardDescription>
        </CardHeader>
        {videosOpen && (
          <CardContent className="space-y-4">
            {/* existing list */}
            {videos.length > 0 && (
              <div className="divide-y divide-border rounded-md border border-input overflow-hidden">
                {videos.map((v) => (
                  <div key={v.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-sm font-medium truncate">{v.title}</p>
                      <a
                        href={v.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline truncate block"
                      >
                        {v.video_url}
                      </a>
                      {v.duration_mins != null && (
                        <p className="text-xs text-muted-foreground">{v.duration_mins} min{v.duration_mins !== 1 ? "s" : ""}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteVideo(v.id)}
                      className="shrink-0"
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* add form */}
            <form onSubmit={handleAddVideo} className="space-y-3 border-t border-input pt-4">
              <p className="text-sm font-medium">Add Video</p>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="v-title">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="v-title"
                  type="text"
                  value={videoForm.title}
                  onChange={(e) => setVideoForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="e.g. Part 2 Deep Dive"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="v-url">
                  Video URL <span className="text-red-500">*</span>
                </label>
                <input
                  id="v-url"
                  type="url"
                  value={videoForm.video_url}
                  onChange={(e) => setVideoForm((p) => ({ ...p, video_url: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="v-duration">
                    Duration (mins)
                  </label>
                  <input
                    id="v-duration"
                    type="number"
                    min="0"
                    value={videoForm.duration_mins}
                    onChange={(e) => setVideoForm((p) => ({ ...p, duration_mins: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="e.g. 15"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="v-priority">
                    Priority
                  </label>
                  <input
                    id="v-priority"
                    type="number"
                    min="0"
                    value={videoForm.priority}
                    onChange={(e) => setVideoForm((p) => ({ ...p, priority: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
              <Button type="submit" size="sm" disabled={videoSaving}>
                {videoSaving ? "Adding…" : "Add Video"}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>

      {/* ---- Lesson Assets ---- */}
      <Card>
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setAssetsOpen((o) => !o)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Lesson Assets</CardTitle>
            <span className="text-sm text-muted-foreground">
              {assets.length > 0 ? `${assets.length} asset${assets.length !== 1 ? "s" : ""}` : "None"}{" "}
              {assetsOpen ? "▲" : "▼"}
            </span>
          </div>
          <CardDescription>
            Downloadable files, PDFs, links, and other resources for this lesson.
          </CardDescription>
        </CardHeader>
        {assetsOpen && (
          <CardContent className="space-y-4">
            {/* existing list */}
            {assets.length > 0 && (
              <div className="divide-y divide-border rounded-md border border-input overflow-hidden">
                {assets.map((a) => (
                  <div key={a.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{a.title}</p>
                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground uppercase">
                          {a.asset_type}
                        </span>
                        {a.is_downloadable && (
                          <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            Downloadable
                          </span>
                        )}
                      </div>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline truncate block"
                      >
                        {a.url}
                      </a>
                      {a.file_size_bytes != null && (
                        <p className="text-xs text-muted-foreground">
                          {(a.file_size_bytes / 1024).toFixed(1)} KB
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteAsset(a.id)}
                      className="shrink-0"
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* add form */}
            <form onSubmit={handleAddAsset} className="space-y-3 border-t border-input pt-4">
              <p className="text-sm font-medium">Add Asset</p>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="a-title">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="a-title"
                  type="text"
                  value={assetForm.title}
                  onChange={(e) => setAssetForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="e.g. Study Guide PDF"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="a-type">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="a-type"
                    value={assetForm.asset_type}
                    onChange={(e) => setAssetForm((p) => ({ ...p, asset_type: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {ASSET_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="a-size">
                    File Size (bytes)
                  </label>
                  <input
                    id="a-size"
                    type="number"
                    min="0"
                    value={assetForm.file_size_bytes}
                    onChange={(e) => setAssetForm((p) => ({ ...p, file_size_bytes: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="optional"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="a-url">
                  URL <span className="text-red-500">*</span>
                </label>
                <input
                  id="a-url"
                  type="url"
                  value={assetForm.url}
                  onChange={(e) => setAssetForm((p) => ({ ...p, url: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="a-priority">
                    Priority
                  </label>
                  <input
                    id="a-priority"
                    type="number"
                    min="0"
                    value={assetForm.priority}
                    onChange={(e) => setAssetForm((p) => ({ ...p, priority: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <div className="flex items-center gap-2">
                    <input
                      id="a-downloadable"
                      type="checkbox"
                      checked={assetForm.is_downloadable}
                      onChange={(e) => setAssetForm((p) => ({ ...p, is_downloadable: e.target.checked }))}
                      className="size-4 rounded border-input accent-primary"
                    />
                    <label className="text-sm font-medium" htmlFor="a-downloadable">
                      Downloadable
                    </label>
                  </div>
                </div>
              </div>
              <Button type="submit" size="sm" disabled={assetSaving}>
                {assetSaving ? "Adding…" : "Add Asset"}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>

      {/* ---- Quiz Questions ---- */}
      <Card>
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setQuestionsOpen((o) => !o)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Quiz Questions</CardTitle>
            <span className="text-sm text-muted-foreground">
              {questions.length > 0
                ? `${questions.length} question${questions.length !== 1 ? "s" : ""}`
                : "None"}{" "}
              {questionsOpen ? "▲" : "▼"}
            </span>
          </div>
          <CardDescription>
            Multiple-choice questions for the lesson quiz.
          </CardDescription>
        </CardHeader>
        {questionsOpen && (
          <CardContent className="space-y-4">
            {/* existing list */}
            {questions.length > 0 && (
              <div className="space-y-3">
                {questions.map((q, qi) => (
                  <div
                    key={q.id}
                    className="rounded-md border border-input bg-muted/30 p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium">
                        Q{qi + 1}. {q.question}
                      </p>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="shrink-0"
                      >
                        Delete
                      </Button>
                    </div>
                    <ul className="space-y-0.5">
                      {q.options.map((opt, i) => (
                        <li
                          key={i}
                          className={`text-xs px-2 py-1 rounded ${
                            i === q.correct_answer
                              ? "bg-green-100 text-green-800 font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          {OPTION_LABELS[i] ?? i}. {opt}
                          {i === q.correct_answer && " ✓"}
                        </li>
                      ))}
                    </ul>
                    {q.explanation && (
                      <p className="text-xs text-muted-foreground italic">
                        Explanation: {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* add form */}
            <form onSubmit={handleAddQuestion} className="space-y-3 border-t border-input pt-4">
              <p className="text-sm font-medium">Add Question</p>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="q-question">
                  Question <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="q-question"
                  value={quizForm.question}
                  onChange={(e) => setQuizForm((p) => ({ ...p, question: e.target.value }))}
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Enter the question text…"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(["optionA", "optionB", "optionC", "optionD"] as const).map((key, i) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-sm font-medium" htmlFor={`q-${key}`}>
                      Option {OPTION_LABELS[i]}{i < 2 && <span className="text-red-500"> *</span>}
                    </label>
                    <input
                      id={`q-${key}`}
                      type="text"
                      value={quizForm[key]}
                      onChange={(e) => setQuizForm((p) => ({ ...p, [key]: e.target.value }))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder={`Option ${OPTION_LABELS[i]}`}
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="q-correct">
                    Correct Answer <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="q-correct"
                    value={quizForm.correct_answer}
                    onChange={(e) => setQuizForm((p) => ({ ...p, correct_answer: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {OPTION_LABELS.map((label, i) => (
                      <option key={i} value={String(i)}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="q-priority">
                    Priority
                  </label>
                  <input
                    id="q-priority"
                    type="number"
                    min="0"
                    value={quizForm.priority}
                    onChange={(e) => setQuizForm((p) => ({ ...p, priority: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="q-explanation">
                  Explanation
                </label>
                <textarea
                  id="q-explanation"
                  value={quizForm.explanation}
                  onChange={(e) => setQuizForm((p) => ({ ...p, explanation: e.target.value }))}
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Optional explanation shown after answering…"
                />
              </div>

              {/* ── Module 04 / 05: question-level video remediation ─────── */}
              <div className="rounded-md border border-dashed bg-muted/20 p-3 space-y-3">
                <div>
                  <p className="text-sm font-semibold">
                    Wrong-answer video remediation{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    When a learner answers this question wrong, the stepwise
                    quiz client will pause the video, seek to the start time
                    below, replay until the replay-until time, then return
                    focus to the quiz for retry. Leave all fields blank to
                    use inline retry instead.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" htmlFor="q-rem-start">
                      Start (seconds)
                    </label>
                    <input
                      id="q-rem-start"
                      type="number"
                      min="0"
                      step="1"
                      value={quizForm.remediation_start_seconds}
                      onChange={(e) =>
                        setQuizForm((p) => ({
                          ...p,
                          remediation_start_seconds: e.target.value,
                        }))
                      }
                      placeholder="120"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      className="text-xs font-medium"
                      htmlFor="q-rem-until"
                    >
                      Replay until (seconds)
                    </label>
                    <input
                      id="q-rem-until"
                      type="number"
                      min="0"
                      step="1"
                      value={quizForm.remediation_replay_until_seconds}
                      onChange={(e) =>
                        setQuizForm((p) => ({
                          ...p,
                          remediation_replay_until_seconds: e.target.value,
                        }))
                      }
                      placeholder="180"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      className="text-xs font-medium"
                      htmlFor="q-rem-video-index"
                    >
                      Video index{" "}
                      <span className="font-normal text-muted-foreground">
                        (multi-video lessons)
                      </span>
                    </label>
                    <input
                      id="q-rem-video-index"
                      type="number"
                      min="0"
                      step="1"
                      value={quizForm.remediation_video_index}
                      onChange={(e) =>
                        setQuizForm((p) => ({
                          ...p,
                          remediation_video_index: e.target.value,
                        }))
                      }
                      placeholder="0"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium"
                    htmlFor="q-rem-message"
                  >
                    Wrong-answer message
                  </label>
                  <input
                    id="q-rem-message"
                    type="text"
                    value={quizForm.remediation_message}
                    onChange={(e) =>
                      setQuizForm((p) => ({
                        ...p,
                        remediation_message: e.target.value,
                      }))
                    }
                    placeholder="Let's review this part of the video, then try again."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <Button type="submit" size="sm" disabled={quizSaving}>
                {quizSaving ? "Adding…" : "Add Question"}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>

      <TrainingNotes entityType="lesson" entityId={id} />
    </div>
  );
}
