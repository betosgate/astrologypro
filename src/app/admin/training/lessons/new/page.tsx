"use client";

import { useState, useEffect, useRef } from "react";
import { LocalSearchAutocomplete } from "@/components/ui/local-search-autocomplete";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  uploadTrainingAudio,
  uploadTrainingPdf,
  uploadTrainingVideo,
} from "@/lib/training/upload-video";
import {
  getDurationMinsFromFile,
  getDurationMinsFromUrl,
} from "@/lib/training/video-duration";
import { FileText, X, Eye, Download, FilePlus } from "lucide-react";
import { PdfPreviewModal } from "@/components/trainee/pdf-preview-modal";
import { cn } from "@/lib/utils";

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
type PdfMode = "url" | "upload";
type AudioMode = "url" | "upload";

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
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLessons, setCategoryLessons] = useState<LessonOption[]>([]);
  const [videoMode, setVideoMode] = useState<VideoMode>("youtube");
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfMode, setPdfMode] = useState<PdfMode>("url");
  const [pdfUploadPercent, setPdfUploadPercent] = useState<number | null>(null);
  const [pdfUploadStatus, setPdfUploadStatus] = useState<string | null>(null);
  const [uploadedPdfFileName, setUploadedPdfFileName] = useState<string | null>(null);
  const pdfFileInputRef = useRef<HTMLInputElement>(null);
  const [pdfUrls, setPdfUrls] = useState<string[]>([]);
  const [pdfPreview, setPdfPreview] = useState<{ url: string; title: string } | null>(null);

  // Audio state — first-class lesson audio (Mystery School Foundation migration).
  const [audioMode, setAudioMode] = useState<AudioMode>("url");
  const [audioUploadPercent, setAudioUploadPercent] = useState<number | null>(null);
  const [audioUploadStatus, setAudioUploadStatus] = useState<string | null>(null);
  const [uploadedAudioFileName, setUploadedAudioFileName] = useState<string | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    video_url: "",
    pdf_url: "",
    audio_url: "",
    content: "",
    duration_mins: "",
    category_id: "",
    priority: "0",
    previous_lesson_id: "",
    is_active: true,
  });

  const [categoryLabel, setCategoryLabel] = useState("");

  useEffect(() => {
    async function loadCategories() {
      try {
        const requestedCategoryId = searchParams.get("category_id");
        // pageSize=1000 ensures all categories are loaded, not just the first 10
        const res = await fetch("/api/admin/training/categories?pageSize=1000");
        if (res.ok) {
          const data = await res.json();
          const loadedCategories = data.categories ?? [];
          setCategories(loadedCategories);
          if (loadedCategories.length > 0) {
            const selected =
              loadedCategories.find(
                (category: CategoryOption) =>
                  category.id === requestedCategoryId
              ) ?? loadedCategories[0];
            setForm((prev) => ({ ...prev, category_id: selected.id }));
            setCategoryLabel(selected.name);
            loadLessonsForCategory(selected.id);
          }
        }
      } catch {
        toast.error("Failed to load categories.");
      }
    }
    loadCategories();
  }, [searchParams]);

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
    setUploadStatus(null);
  }

  function handlePdfModeChange(mode: PdfMode) {
    setPdfMode(mode);
    setUploadedPdfFileName(null);
    setPdfUploadStatus(null);
    setPdfUploadPercent(null);
    // Keep pdfUrls if switching modes? No, usually mode switch clears previous input.
    // But if we want to support both, maybe we shouldn't clear.
    // However, the current logic is one OR the other.
    // I'll keep the pdfUrls if they were uploaded.
    if (mode === "url") {
      setForm((prev) => ({ ...prev, pdf_url: "" }));
    }
    if (pdfFileInputRef.current) {
      pdfFileInputRef.current.value = "";
    }
  }

  function handleAudioModeChange(mode: AudioMode) {
    setAudioMode(mode);
    setUploadedAudioFileName(null);
    setAudioUploadStatus(null);
    setAudioUploadPercent(null);
    setForm((prev) => ({ ...prev, audio_url: "" }));
    if (audioFileInputRef.current) {
      audioFileInputRef.current.value = "";
    }
  }

  async function handleAudioFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_MB = 50;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Audio file must be under ${MAX_MB} MB.`);
      e.target.value = "";
      return;
    }

    const allowed = [
      "audio/mpeg",
      "audio/mp3",
      "audio/mp4",
      "audio/x-m4a",
      "audio/aac",
      "audio/wav",
      "audio/x-wav",
      "audio/webm",
      "audio/ogg",
      "audio/flac",
    ];
    if (!allowed.includes(file.type)) {
      toast.error("Only MP3, M4A, AAC, WAV, OGG, WebM, or FLAC files are allowed.");
      e.target.value = "";
      return;
    }

    setAudioUploadPercent(0);
    setAudioUploadStatus("Preparing upload…");
    try {
      const { url } = await uploadTrainingAudio({
        file,
        onProgress: (percent) => setAudioUploadPercent(percent),
        onStatus: setAudioUploadStatus,
      });
      setForm((prev) => ({ ...prev, audio_url: url }));
      setUploadedAudioFileName(file.name);
      toast.success("Audio uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
      e.target.value = "";
    } finally {
      setAudioUploadPercent(null);
      setAudioUploadStatus(null);
    }
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
    setUploadStatus("Preparing upload…");
    try {
      const durationMins = await getDurationMinsFromFile(file);
      const { url } = await uploadTrainingVideo({
        file,
        onProgress: (percent) => setUploadPercent(percent),
        onStatus: setUploadStatus,
      });
      setForm((prev) => ({
        ...prev,
        video_url: url,
        duration_mins:
          durationMins != null ? String(durationMins) : prev.duration_mins,
      }));
      setUploadedFileName(file.name);
      toast.success("Video uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
      e.target.value = "";
    } finally {
      setUploadPercent(null);
      setUploadStatus(null);
    }
  }

  async function handleMainVideoUrlBlur(url: string) {
    const durationMins = await getDurationMinsFromUrl(url);
    if (durationMins == null) return;
    setForm((prev) => ({
      ...prev,
      duration_mins: String(durationMins),
    }));
  }

  async function handlePdfFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const MAX_MB = 50;
    const allowedType = "application/pdf";

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_MB * 1024 * 1024) {
        toast.error(`${file.name} is over ${MAX_MB} MB.`);
        continue;
      }
      if (file.type !== allowedType) {
        toast.error(`${file.name} is not a PDF.`);
        continue;
      }

      setPdfUploadPercent(0);
      setPdfUploadStatus(`Uploading ${file.name}…`);
      try {
        const { url } = await uploadTrainingPdf({
          file,
          onProgress: (percent) => setPdfUploadPercent(percent),
          onStatus: setPdfUploadStatus,
        });
        setPdfUrls((prev) => [...prev, url]);
        toast.success(`${file.name} uploaded.`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Upload failed for ${file.name}`);
      }
    }

    setPdfUploadPercent(null);
    setPdfUploadStatus(null);
    if (e.target) e.target.value = "";
  }

  function removePdf(index: number) {
    setPdfUrls((prev) => prev.filter((_, i) => i !== index));
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
          pdf_url: pdfMode === "url"
            ? (form.pdf_url.trim() || null)
            : (pdfUrls.length > 0 ? JSON.stringify(pdfUrls) : null),
          audio_url: form.audio_url.trim() || null,
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
    <div className="space-y-6">
      {pdfPreview && (
        <PdfPreviewModal
          url={pdfPreview.url}
          title={pdfPreview.title}
          open={true}
          onClose={() => setPdfPreview(null)}
        />
      )}
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
                className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="e.g. Introduction to Birth Charts"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Category <span className="text-red-500">*</span>
              </label>
              <LocalSearchAutocomplete
                placeholder={categories.length === 0 ? "Loading categories…" : "Search category…"}
                options={categories.map((c) => ({ id: c.id, label: c.name }))}
                defaultValue={categoryLabel}
                onSelect={(val) => {
                  const matched = categories.find((c) => c.name === val);
                  if (matched) {
                    setForm((prev) => ({ ...prev, category_id: matched.id, previous_lesson_id: "" }));
                    setCategoryLabel(matched.name);
                    loadLessonsForCategory(matched.id);
                  } else {
                    setCategoryLabel(val);
                  }
                }}
              />
              {!form.category_id && categoryLabel && (
                <p className="text-xs text-amber-500">Please select a valid category from the list.</p>
              )}
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
                className="w-full h-9 rounded-md border border-input px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
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
                className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
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
                    className={`flex-1 px-3 py-1.5 transition-colors ${videoMode === mode
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
                    className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste a YouTube watch URL. The ID will be normalised automatically. Duration stays manual for YouTube videos.
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
                  onBlur={(e) => void handleMainVideoUrlBlur(e.target.value)}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
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
                    className="w-full rounded-md border border-input px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary-foreground"
                    disabled={uploadPercent !== null}
                  />
                  {uploadPercent !== null && (
                    <div className="space-y-1">
                      <Progress value={uploadPercent} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {uploadStatus ?? "Uploading video…"} {uploadPercent}%
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

            {/* PDF */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">PDF</label>
              <div className="flex rounded-lg border bg-muted/30 p-1">
                {(["url", "upload"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handlePdfModeChange(mode)}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${pdfMode === mode
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {mode === "url" ? "PDF URL" : "Upload PDF"}
                  </button>
                ))}
              </div>

              {pdfMode === "url" && (
                <input
                  id="pdf_url"
                  name="pdf_url"
                  type="url"
                  value={form.pdf_url}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="https://..."
                />
              )}

              {pdfMode === "upload" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    {pdfUrls.map((url, idx) => {
                      const fileName = url.split("/").pop()?.split("-").slice(1).join("-") || "document.pdf";
                      return (
                        <div key={idx} className="group relative flex flex-col items-center gap-2 rounded-lg border bg-card p-3 w-32 shadow-sm transition-all hover:border-primary/50">
                          <div
                            className="flex size-12 items-center justify-center rounded-lg bg-red-500/10 text-red-500 cursor-pointer hover:bg-red-500/20"
                            onClick={() => setPdfPreview({ url, title: fileName })}
                          >
                            <FileText size={24} />
                          </div>
                          <p className="text-[10px] text-center font-medium line-clamp-2 w-full px-1">
                            {fileName}
                          </p>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => removePdf(idx)}
                            className="absolute -top-1.5 -right-1.5 size-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>

                          {/* Action overlay */}
                          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg pointer-events-none group-hover:pointer-events-auto">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 rounded-full bg-background/80"
                              onClick={() => setPdfPreview({ url, title: fileName })}
                            >
                              <Eye size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 rounded-full bg-background/80"
                              asChild
                            >
                              <a href={url} download target="_blank" rel="noopener noreferrer">
                                <Download size={14} />
                              </a>
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-3 w-32 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FilePlus size={24} />
                      </div>
                      <p className="text-[10px] font-medium text-muted-foreground">Add PDF</p>
                      <input
                        ref={pdfFileInputRef}
                        type="file"
                        accept="application/pdf"
                        multiple
                        onChange={handlePdfFileChange}
                        className="hidden"
                        disabled={pdfUploadPercent !== null}
                      />
                    </label>
                  </div>

                  {pdfUploadPercent !== null && (
                    <div className="space-y-1">
                      <Progress value={pdfUploadPercent} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {pdfUploadStatus ?? "Uploading PDF…"} {pdfUploadPercent}%
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    PDF only · max 50 MB per file
                  </p>
                </div>
              )}

              {pdfMode === "url" && form.pdf_url && (
                <p className="text-xs text-muted-foreground break-all">
                  Resource: {form.pdf_url}
                </p>
              )}
            </div>

            {/* Audio — first-class lesson audio (Mystery School Foundation migration). */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Audio</label>
              <div className="flex rounded-lg border bg-muted/30 p-1">
                {(["url", "upload"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleAudioModeChange(mode)}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${audioMode === mode
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {mode === "url" ? "Audio URL" : "Upload Audio"}
                  </button>
                ))}
              </div>

              {audioMode === "url" && (
                <input
                  id="audio_url"
                  name="audio_url"
                  type="url"
                  value={form.audio_url}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="https://..."
                />
              )}

              {audioMode === "upload" && (
                <div className="space-y-2">
                  <input
                    ref={audioFileInputRef}
                    type="file"
                    accept="audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/aac,audio/wav,audio/x-wav,audio/webm,audio/ogg,audio/flac"
                    onChange={handleAudioFileChange}
                    className="w-full rounded-md border border-input px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary-foreground"
                    disabled={audioUploadPercent !== null}
                  />
                  {audioUploadPercent !== null && (
                    <div className="space-y-1">
                      <Progress value={audioUploadPercent} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {audioUploadStatus ?? "Uploading audio…"} {audioUploadPercent}%
                      </p>
                    </div>
                  )}
                  {uploadedAudioFileName && audioUploadPercent === null && (
                    <p className="text-xs text-green-600">
                      Uploaded: {uploadedAudioFileName}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    MP3, M4A, AAC, WAV, OGG, WebM or FLAC · max 50 MB
                  </p>
                </div>
              )}

              {form.audio_url && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <audio
                    src={form.audio_url}
                    controls
                    preload="metadata"
                    className="w-full"
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
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
                className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
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
                  className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Auto-populated when video metadata is available"
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
                  className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
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
