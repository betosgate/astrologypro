"use client";

import { useState, useEffect, useRef } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Loader2, ImagePlus, Music, Video, Plus, X, Trash2, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Diviner = { id: string; display_name: string };
type MediaItem = { url: string; name: string };

const BUCKET = "all-frontend-assets";

function StarSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="transition-transform active:scale-90"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              "size-6 transition-colors",
              star <= (hover || value) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground opacity-30"
            )}
          />
        </button>
      ))}
      {value > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-2 h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onChange(0)}
        >
          Clear
        </Button>
      )}
    </div>
  );
}

export default function CreateTestimonialPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [diviners, setDiviners] = useState<Diviner[]>([]);
  const [uploading, setUploading] = useState<Record<string, boolean>>({
    images: false,
    audio: false,
    video: false,
  });

  const [form, setForm] = useState({
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
  });

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

  async function uploadFile(
    file: File,
    path: string
  ): Promise<{ url: string; name: string }> {
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const filePath = `${path}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return { url: data.publicUrl, name: file.name };
  }

  async function handleMediaUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    type: "images" | "audio" | "video"
  ) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    if (type === "video") {
      const MAX_MB = 200;
      for (const f of files) {
        if (f.size > MAX_MB * 1024 * 1024) {
          toast.error(`${f.name} exceeds the 200 MB limit.`);
          e.target.value = "";
          return;
        }
      }
    }

    setUploading((prev) => ({ ...prev, [type]: true }));
    try {
      const path = `testimonials/${type}/`;
      const results = await Promise.all(files.map((f) => uploadFile(f, path)));
      setForm((prev) => ({ ...prev, [type]: [...prev[type], ...results] }));
      toast.success(`${results.length} ${type.slice(0, -1)}(s) uploaded.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
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
    if (!form.title.trim() || !form.client_name.trim() || !form.text.trim() || !form.diviner_id) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diviner_id: form.diviner_id,
          client_name: form.client_name.trim(),
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

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to create testimonial.");
        return;
      }

      toast.success("Testimonial created successfully.");
      router.push("/admin/testimonials");
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/testimonials">
            <ArrowLeft className="size-5" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Testimonial</h1>
          <p className="text-muted-foreground text-sm">Create a new testimonial record for a diviner.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Testimonial Content</CardTitle>
            <CardDescription>Enter the feedback and rating from the customer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Life-changing reading"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Rating</Label>
                <StarSelector
                  value={form.rating}
                  onChange={(v) => setForm({ ...form, rating: v })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text">Feedback Content <span className="text-destructive">*</span></Label>
              <Textarea
                id="text"
                rows={5}
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                placeholder="Paste or write the customer's feedback here..."
                className="resize-none"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer & Service Info</CardTitle>
            <CardDescription>Attribute the testimonial to a customer and service.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="client_name">Customer Name <span className="text-destructive">*</span></Label>
                <Input
                  id="client_name"
                  value={form.client_name}
                  onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                  placeholder="e.g. Jane Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diviner_id">Assigned Diviner <span className="text-destructive">*</span></Label>
                <select
                  id="diviner_id"
                  value={form.diviner_id}
                  onChange={(e) => setForm({ ...form, diviner_id: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="">— Select Diviner —</option>
                  {diviners.map((d) => (
                    <option key={d.id} value={d.id}>{d.display_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_email">Customer Email (Optional)</Label>
                <Input
                  id="client_email"
                  type="email"
                  value={form.client_email}
                  onChange={(e) => setForm({ ...form, client_email: e.target.value })}
                  placeholder="jane@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_phone">Customer Phone (Optional)</Label>
                <Input
                  id="client_phone"
                  value={form.client_phone}
                  onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
                  placeholder="+1 555 000 1234"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_type">Service Type (Optional)</Label>
                <Input
                  id="service_type"
                  value={form.service_type}
                  onChange={(e) => setForm({ ...form, service_type: e.target.value })}
                  placeholder="e.g. Natal Chart Reading"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: !!checked })}
                />
                <Label htmlFor="is_active" className="cursor-pointer">Published & Active</Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_featured"
                  checked={form.is_featured}
                  onCheckedChange={(checked) => setForm({ ...form, is_featured: !!checked })}
                />
                <Label htmlFor="is_featured" className="cursor-pointer">Featured (Top of list)</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Media Assets</CardTitle>
            <CardDescription>Upload supporting images, audio feedback, or video testimonials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Images */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Support Images</Label>
                  <p className="text-xs text-muted-foreground">Photos of the customer or relevant imagery.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("img-upload")?.click()}
                  disabled={uploading.images}
                >
                  {uploading.images ? <Loader2 className="mr-2 size-3 animate-spin" /> : <ImagePlus className="mr-2 size-3" />}
                  Add Images
                </Button>
                <input id="img-upload" type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleMediaUpload(e, "images")} />
              </div>

              {form.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {form.images.map((img, i) => (
                    <div key={i} className="group relative aspect-square rounded-md overflow-hidden border bg-muted">
                      <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeMedia("images", i)}
                        className="absolute top-1 right-1 size-6 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-sm"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audio */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Audio Recordings</Label>
                  <p className="text-xs text-muted-foreground">Voice testimonials (MP3, WAV).</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("audio-upload")?.click()}
                  disabled={uploading.audio}
                >
                  {uploading.audio ? <Loader2 className="mr-2 size-3 animate-spin" /> : <Music className="mr-2 size-3" />}
                  Add Audio
                </Button>
                <input id="audio-upload" type="file" accept="audio/*" multiple className="hidden" onChange={(e) => handleMediaUpload(e, "audio")} />
              </div>

              {form.audio.length > 0 && (
                <div className="space-y-2">
                  {form.audio.map((a, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-md border bg-muted/30">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Music className="size-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm truncate">{a.name}</span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeMedia("audio", i)} className="text-destructive h-8 px-2 hover:bg-destructive/10">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Video Testimonials</Label>
                  <p className="text-xs text-muted-foreground">Video clips up to 200MB (MP4, WebM).</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("video-upload")?.click()}
                  disabled={uploading.video}
                >
                  {uploading.video ? <Loader2 className="mr-2 size-3 animate-spin" /> : <Video className="mr-2 size-3" />}
                  Add Video
                </Button>
                <input id="video-upload" type="file" accept="video/*" multiple className="hidden" onChange={(e) => handleMediaUpload(e, "video")} />
              </div>

              {form.video.length > 0 && (
                <div className="space-y-2">
                  {form.video.map((v, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-md border bg-muted/30">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Video className="size-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm truncate">{v.name}</span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeMedia("video", i)} className="text-destructive h-8 px-2 hover:bg-destructive/10">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            asChild
            type="button"
            variant="ghost"
            disabled={loading}
          >
            <Link href="/admin/testimonials">Cancel</Link>
          </Button>
          <Button
            type="submit"
            size="lg"
            className="px-8 shadow-sm"
            disabled={loading || Object.values(uploading).some(Boolean)}
          >
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save Testimonial
          </Button>
        </div>
      </form>
    </div>
  );
}
