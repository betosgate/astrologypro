"use client";

import { useState, useEffect, use } from "react";
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

export default function EditTestimonialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [diviners, setDiviners] = useState<Diviner[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const [form, setForm] = useState({
    diviner_id: "",
    client_name: "",
    rating: 0,
    text: "",
    service_type: "",
    title: "",
    is_featured: false,
    status: "pending" as string,
    images: [] as MediaItem[],
    audio: [] as MediaItem[],
    video: [] as MediaItem[],
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [divRes, testRes] = await Promise.all([
          fetch("/api/admin/diviners"),
          fetch(`/api/admin/testimonials/${id}`),
        ]);

        if (divRes.ok) {
          const d = await divRes.json();
          setDiviners(d.diviners ?? []);
        }

        if (!testRes.ok) {
          toast.error("Testimonial not found.");
          router.push("/admin/testimonials");
          return;
        }

        const t = await testRes.json();
        const testimonial = t.testimonial;
        setForm({
          diviner_id: testimonial.diviner_id ?? "",
          client_name: testimonial.client_name ?? "",
          rating: testimonial.rating ?? 0,
          text: testimonial.text ?? "",
          service_type: testimonial.service_type ?? "",
          title: testimonial.title ?? "",
          is_featured: testimonial.is_featured ?? false,
          status: testimonial.status ?? "pending",
          images: testimonial.images ?? [],
          audio: testimonial.audio ?? [],
          video: testimonial.video ?? [],
        });
      } catch {
        toast.error("Failed to load testimonial.");
      } finally {
        setFetching(false);
      }
    }
    loadData();
  }, [id, router]);

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

  function removeMedia(field: "images" | "audio" | "video", index: number) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.text.trim()) {
      toast.error("Testimonial text is required.");
      return;
    }
    if (!form.diviner_id) {
      toast.error("Please select a diviner.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diviner_id: form.diviner_id,
          client_name: form.client_name.trim() || null,
          rating: form.rating || null,
          text: form.text.trim(),
          service_type: form.service_type.trim() || null,
          title: form.title.trim() || null,
          is_featured: form.is_featured,
          status: form.status,
          images: form.images,
          audio: form.audio,
          video: form.video,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update testimonial.");
        return;
      }

      toast.success("Testimonial updated.");
      router.push("/admin/testimonials");
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this testimonial? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Failed to delete.");
        return;
      }
      toast.success("Testimonial deleted.");
      router.push("/admin/testimonials");
    } catch {
      toast.error("Failed to delete.");
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/testimonials">← Back</Link>
          </Button>
          <h1 className="text-xl font-bold tracking-tight">Edit Testimonial</h1>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
        >
          Delete
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Testimonial Details</CardTitle>
          <CardDescription>Update this testimonial.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
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
                Client Name
              </label>
              <input
                id="client_name"
                name="client_name"
                type="text"
                value={form.client_name}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="e.g. Jane Doe"
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

            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Featured */}
              <div className="flex items-end pb-2">
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
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={
                  loading || uploadingImages || uploadingAudio || uploadingVideo
                }
              >
                {loading ? "Saving…" : "Save Changes"}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/admin/testimonials">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
