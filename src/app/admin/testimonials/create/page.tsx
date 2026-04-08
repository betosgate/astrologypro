"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Diviner = { id: string; display_name: string };

type MediaItem = { url: string; name: string };

function StarSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`text-2xl transition-colors ${
            star <= (hover || value) ? "text-yellow-500" : "text-muted-foreground"
          }`}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
      {value > 0 && (
        <button
          type="button"
          className="ml-2 text-xs text-muted-foreground underline"
          onClick={() => onChange(0)}
        >
          Clear
        </button>
      )}
    </div>
  );
}

async function uploadFile(
  file: File,
  path: string
): Promise<{ url: string; name: string }> {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const filePath = `${path}${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("all-frontend-assets")
    .upload(filePath, file, { cacheControl: "3600", upsert: false });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage
    .from("all-frontend-assets")
    .getPublicUrl(filePath);

  return { url: data.publicUrl, name: file.name };
}

export default function CreateTestimonialPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [diviners, setDiviners] = useState<Diviner[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const INITIAL_FORM = {
    diviner_id: "",
    client_name: "",
    client_email: "",
    client_phone: "",
    rating: 0,
    text: "",
    service_type: "",
    title: "",
    is_featured: false,
    is_active: true,
    images: [] as MediaItem[],
    audio: [] as MediaItem[],
    video: [] as MediaItem[],
  };

  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    async function loadDiviners() {
      try {
        const res = await fetch("/api/admin/diviners");
        if (res.ok) {
          const data = await res.json();
          setDiviners(data.diviners ?? []);
        }
      } catch {
        toast.error("Failed to load diviners.");
      }
    }
    loadDiviners();
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

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingImages(true);
    try {
      const results = await Promise.all(
        files.map((f) => uploadFile(f, "testimonials/images/"))
      );
      setForm((prev) => ({ ...prev, images: [...prev.images, ...results] }));
      toast.success(`${results.length} image(s) uploaded.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  }

  async function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingAudio(true);
    try {
      const results = await Promise.all(
        files.map((f) => uploadFile(f, "testimonials/audio/"))
      );
      setForm((prev) => ({ ...prev, audio: [...prev.audio, ...results] }));
      toast.success(`${results.length} audio file(s) uploaded.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Audio upload failed.");
    } finally {
      setUploadingAudio(false);
      e.target.value = "";
    }
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const MAX_MB = 200;
    for (const f of files) {
      if (f.size > MAX_MB * 1024 * 1024) {
        toast.error(`${f.name} exceeds the 200 MB limit.`);
        e.target.value = "";
        return;
      }
    }
    setUploadingVideo(true);
    try {
      const results = await Promise.all(
        files.map((f) => uploadFile(f, "testimonials/video/"))
      );
      setForm((prev) => ({ ...prev, video: [...prev.video, ...results] }));
      toast.success(`${results.length} video(s) uploaded.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Video upload failed.");
    } finally {
      setUploadingVideo(false);
      e.target.value = "";
    }
  }

  function removeMedia(
    field: "images" | "audio" | "video",
    index: number
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  }

  function handleReset() {
    setForm({ ...INITIAL_FORM, images: [], audio: [], video: [] });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is Required.");
      return;
    }
    if (!form.client_name.trim()) {
      toast.error("Customer Name is Required.");
      return;
    }
    if (!form.text.trim()) {
      toast.error("Description is Required.");
      return;
    }
    if (!form.diviner_id) {
      toast.error("Select Astrologer Field.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diviner_id: form.diviner_id,
          client_name: form.client_name.trim() || null,
          rating: form.rating || null,
          text: form.text.trim(),
          service_type: form.service_type.trim() || null,
          title: form.title.trim(),
          is_featured: form.is_featured,
          status: form.is_active ? "approved" : "pending",
          requested_to_email: form.client_email.trim().toLowerCase() || null,
          requested_to_phone_no: form.client_phone.trim() || null,
          images: form.images,
          audio: form.audio,
          video: form.video,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create testimonial.");
        return;
      }

      toast.success("Testimonial created.");
      router.push("/admin/testimonials");
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
          <Link href="/admin/testimonials">← Back</Link>
        </Button>
        <h1 className="text-xl font-bold tracking-tight">Add Testimonial</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Testimonial Details</CardTitle>
          <CardDescription>
            Create a new testimonial for a diviner.
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
                placeholder="e.g. Life-changing reading"
              />
            </div>

            {/* Diviner */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="diviner_id">
                Diviner <span className="text-red-500">*</span>
              </label>
              <select
                id="diviner_id"
                name="diviner_id"
                value={form.diviner_id}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">— Select Diviner —</option>
                {diviners.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.display_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Client Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="client_name">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                id="client_name"
                name="client_name"
                type="text"
                value={form.client_name}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="e.g. Jane Doe"
              />
            </div>

            {/* Customer Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="client_email">
                Customer Email
              </label>
              <input
                id="client_email"
                name="client_email"
                type="email"
                value={form.client_email}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="e.g. jane@example.com"
              />
            </div>

            {/* Customer Phone */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="client_phone">
                Phone No
              </label>
              <input
                id="client_phone"
                name="client_phone"
                type="tel"
                value={form.client_phone}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="e.g. +1 555 000 1234"
              />
            </div>

            {/* Rating */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Rating</label>
              <StarSelector
                value={form.rating}
                onChange={(v) => setForm((prev) => ({ ...prev, rating: v }))}
              />
            </div>

            {/* Text */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="text">
                Testimonial Text <span className="text-red-500">*</span>
              </label>
              <textarea
                id="text"
                name="text"
                value={form.text}
                onChange={handleChange}
                required
                rows={5}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Write the testimonial content here…"
              />
            </div>

            {/* Service Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="service_type">
                Service Type
              </label>
              <input
                id="service_type"
                name="service_type"
                type="text"
                value={form.service_type}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="e.g. Natal Chart Reading"
              />
            </div>

            <div className="flex flex-wrap gap-6">
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
                  Active
                </label>
              </div>

              {/* Featured */}
              <div className="flex items-center gap-3">
                <input
                  id="is_featured"
                  name="is_featured"
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={handleChange}
                  className="size-4 rounded border-input accent-primary"
                />
                <label className="text-sm font-medium" htmlFor="is_featured">
                  Featured
                </label>
              </div>
            </div>

            {/* Images Upload */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Upload Images</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploadingImages}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary-foreground"
              />
              {uploadingImages && (
                <p className="text-xs text-muted-foreground">Uploading…</p>
              )}
              {form.images.length > 0 && (
                <ul className="space-y-1">
                  {form.images.map((img, i) => (
                    <li key={i} className="flex items-center justify-between text-xs">
                      <span className="truncate text-muted-foreground">{img.name}</span>
                      <button
                        type="button"
                        className="ml-2 text-red-500 hover:text-red-700"
                        onClick={() => removeMedia("images", i)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted-foreground">
                All image formats supported · multiple files allowed
              </p>
            </div>

            {/* Audio Upload */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Upload Audio</p>
              <input
                type="file"
                accept="audio/mpeg,audio/wav"
                multiple
                onChange={handleAudioUpload}
                disabled={uploadingAudio}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary-foreground"
              />
              {uploadingAudio && (
                <p className="text-xs text-muted-foreground">Uploading…</p>
              )}
              {form.audio.length > 0 && (
                <ul className="space-y-1">
                  {form.audio.map((a, i) => (
                    <li key={i} className="flex items-center justify-between text-xs">
                      <span className="truncate text-muted-foreground">{a.name}</span>
                      <button
                        type="button"
                        className="ml-2 text-red-500 hover:text-red-700"
                        onClick={() => removeMedia("audio", i)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted-foreground">MP3, WAV · multiple files allowed</p>
            </div>

            {/* Video Upload */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Upload Video</p>
              <input
                type="file"
                accept="video/mp4,video/webm"
                multiple
                onChange={handleVideoUpload}
                disabled={uploadingVideo}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary-foreground"
              />
              {uploadingVideo && (
                <p className="text-xs text-muted-foreground">Uploading…</p>
              )}
              {form.video.length > 0 && (
                <ul className="space-y-1">
                  {form.video.map((v, i) => (
                    <li key={i} className="flex items-center justify-between text-xs">
                      <span className="truncate text-muted-foreground">{v.name}</span>
                      <button
                        type="button"
                        className="ml-2 text-red-500 hover:text-red-700"
                        onClick={() => removeMedia("video", i)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted-foreground">
                MP4, WebM · max 200 MB per file · multiple files allowed
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading || uploadingImages || uploadingAudio || uploadingVideo}>
                {loading ? "Saving…" : "Create Testimonial"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={loading}
              >
                Reset
              </Button>
              <Button asChild type="button" variant="ghost">
                <Link href="/admin/testimonials">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
