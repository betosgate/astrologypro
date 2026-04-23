"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Link2,
  Music,
  Video,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { MAX_MEDIA_IMAGES } from "@/lib/media-gallery";

type MediaType = "video" | "audio" | "image" | "article" | "link";

const TYPES: { value: MediaType; label: string; icon: React.ElementType; description: string }[] =
  [
    { value: "video", label: "Video", icon: Video, description: "Upload MP4 or link" },
    { value: "audio", label: "Audio", icon: Music, description: "Upload MP3 or link" },
    { value: "image", label: "Image", icon: ImageIcon, description: "Photo gallery image" },
    { value: "article", label: "Article", icon: FileText, description: "Upload PDF or link" },
    { value: "link", label: "Link", icon: Link2, description: "Any external link" },
  ];

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const FILE_ACCEPT: Partial<Record<MediaType, string>> = {
  video: "video/mp4,video/webm,video/quicktime,video/x-msvideo",
  audio: "audio/mpeg,audio/wav,audio/mp4,audio/ogg,audio/aac,audio/x-m4a",
  image: "image/jpeg,image/png,image/webp,image/gif",
  article: "application/pdf",
};

const UPLOAD_FOLDER: Partial<Record<MediaType, string>> = {
  video: "media-video",
  audio: "media-audio",
  image: "media-gallery",
  article: "media-articles",
};

type InitialItem = {
  id: string;
  type: MediaType;
  url: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  album_name: string | null;
  is_featured: boolean;
  is_active: boolean;
};

function sanitizeFileName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
}

function deriveTitleFromFilename(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function MediaItemForm({
  mode,
  divinerId,
  existingAlbumNames,
  currentImageCount,
  initialItem,
}: {
  mode: "create" | "edit";
  divinerId: string;
  existingAlbumNames: string[];
  currentImageCount: number;
  initialItem?: InitialItem;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [title, setTitle] = useState(initialItem?.title ?? "");
  const [mediaType, setMediaType] = useState<MediaType>(initialItem?.type ?? "image");
  const [url, setUrl] = useState(initialItem?.url ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initialItem?.thumbnail_url ?? "");
  const [albumName, setAlbumName] = useState(initialItem?.album_name ?? "");
  const [description, setDescription] = useState(initialItem?.description ?? "");
  const [featured, setFeatured] = useState(initialItem?.is_featured ?? false);
  const [isActive, setIsActive] = useState(initialItem?.is_active ?? true);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isImage = mediaType === "image";
  const isUploadable = mediaType === "image" || mediaType === "audio" || mediaType === "video" || mediaType === "article";

  const remainingImageSlots = useMemo(() => {
    if (mode === "edit" && initialItem?.type === "image") {
      return Math.max(0, MAX_MEDIA_IMAGES - currentImageCount);
    }
    return Math.max(0, MAX_MEDIA_IMAGES - currentImageCount);
  }, [currentImageCount, initialItem?.type, mode]);

  // Manage object URLs for local image previews to avoid memory leaks
  useEffect(() => {
    if (!isImage || files.length === 0) {
      setPreviews([]);
      return;
    }

    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files, isImage]);

  function validate(): boolean {
    const errs: Record<string, string> = {};

    // Title required unless bulk image upload
    if (!isImage || files.length <= 1) {
      if (!title.trim() && !(isImage && files.length > 0)) {
        errs.title = "Title is required.";
      }
    }

    // File size check
    const oversized = files.find((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized) {
      errs.files = `"${oversized.name}" exceeds the ${MAX_FILE_SIZE_MB} MB limit.`;
    }

    if (isImage) {
      if (mode === "create" && files.length === 0 && !url.trim()) {
        errs.url = "Choose image files or provide an image URL.";
      }
      if (files.length > remainingImageSlots) {
        errs.files = `You can add ${remainingImageSlots} more image${remainingImageSlots === 1 ? "" : "s"} before reaching the ${MAX_MEDIA_IMAGES}-image limit.`;
      }
    } else if (isUploadable) {
      // audio / video / article: URL required only if no file selected
      if (files.length === 0 && !url.trim()) {
        errs.url = "Upload a file or provide a URL.";
      }
    } else if (!url.trim()) {
      errs.url = "URL is required.";
    }

    if (url.trim()) {
      try {
        new URL(url.trim());
      } catch {
        errs.url = "Please enter a valid URL.";
      }
    }

    if (thumbnailUrl.trim()) {
      try {
        new URL(thumbnailUrl.trim());
      } catch {
        errs.thumbnailUrl = "Please enter a valid thumbnail URL.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function uploadFile(file: File, index: number, type: MediaType): Promise<string> {
    const supabase = createClient();
    const folder = UPLOAD_FOLDER[type] ?? "media-gallery";
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${folder}/${divinerId}/${Date.now()}-${index}-${sanitizeFileName(file.name || `file.${ext}`)}`;

    setUploadStatus(`Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)…`);

    const { error: uploadError } = await supabase.storage
      .from("all-frontend-assets")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("all-frontend-assets").getPublicUrl(path);
    setUploadStatus(null);
    return data.publicUrl;
  }

  async function createMediaItem(payload: Record<string, unknown>) {
    const res = await fetch("/api/dashboard/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail ?? "Failed to create media item.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === "create") {
        if (isImage && files.length > 0) {
          // Bulk image upload
          for (const [index, file] of files.entries()) {
            const publicUrl = await uploadFile(file, index, "image");
            const derivedTitle =
              files.length === 1 && title.trim()
                ? title.trim()
                : deriveTitleFromFilename(file.name) || `Image ${index + 1}`;

            await createMediaItem({
              title: derivedTitle,
              media_type: "image",
              url: publicUrl,
              thumbnail_url: publicUrl,
              description: description.trim() || undefined,
              album_name: albumName.trim() || undefined,
              featured: featured && index === 0,
              is_active: isActive,
              sort_order: 0,
            });
          }

          toast.success(
            files.length === 1
              ? "Image added."
              : `${files.length} images added to your gallery.`
          );
        } else if (isUploadable && !isImage && files.length === 1) {
          // Single file upload for audio / video / article (PDF)
          const publicUrl = await uploadFile(files[0], 0, mediaType);
          await createMediaItem({
            title: title.trim() || deriveTitleFromFilename(files[0].name),
            media_type: mediaType,
            url: publicUrl,
            thumbnail_url: thumbnailUrl.trim() || undefined,
            description: description.trim() || undefined,
            featured,
            is_active: isActive,
          });
          toast.success("Media item added.");
        } else {
          // URL-only submission
          await createMediaItem({
            title: title.trim(),
            media_type: mediaType,
            url: url.trim(),
            thumbnail_url:
              isImage && !thumbnailUrl.trim()
                ? url.trim()
                : thumbnailUrl.trim() || undefined,
            description: description.trim() || undefined,
            album_name: isImage ? albumName.trim() || undefined : undefined,
            featured,
            is_active: isActive,
          });
          toast.success("Media item added.");
        }
      } else if (initialItem) {
        let nextUrl = url.trim();
        let nextThumbnailUrl = thumbnailUrl.trim();

        if (isUploadable && files.length === 1) {
          const publicUrl = await uploadFile(files[0], 0, mediaType);
          nextUrl = publicUrl;
          if (isImage) nextThumbnailUrl = publicUrl;
        }

        const res = await fetch(`/api/dashboard/media/${initialItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            media_type: mediaType,
            url: nextUrl,
            thumbnail_url: isImage ? nextThumbnailUrl || nextUrl : nextThumbnailUrl || null,
            description: description.trim() || null,
            album_name: isImage ? albumName.trim() || null : null,
            featured,
            is_active: isActive,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail ?? "Failed to update media item.");
        }

        toast.success("Media item updated.");
      }

      router.push("/dashboard/media");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save media item.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/media">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "create" ? "Add Media" : "Edit Media"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "create"
              ? "Add links, videos, audio, or build image albums for your public profile."
              : "Update how this media item appears on your public profile."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Media Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {TYPES.map(({ value, label, icon: Icon, description }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMediaType(value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors",
                    mediaType === value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-muted-foreground/20 hover:border-primary/50"
                  )}
                  aria-pressed={mediaType === value}
                >
                  <Icon className="size-5" />
                  <span className="text-xs font-medium">{label}</span>
                  <span className="hidden text-[10px] text-muted-foreground sm:block">
                    {description}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title{!isImage || files.length <= 1 ? " *" : ""}
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  isImage && files.length > 1
                    ? "Optional for bulk upload. File names will be used."
                    : "e.g. Lunar Ceremony Highlights"
                }
                aria-invalid={!!errors.title}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="A short description shown with this media."
              />
            </div>

            {isImage && (
              <div className="space-y-2">
                <Label htmlFor="albumName">Album</Label>
                <Input
                  id="albumName"
                  value={albumName}
                  onChange={(e) => setAlbumName(e.target.value)}
                  placeholder="e.g. Retreat 2026"
                  list="media-album-names"
                />
                <datalist id="media-album-names">
                  {existingAlbumNames.map((album) => (
                    <option key={album} value={album} />
                  ))}
                </datalist>
                <p className="text-xs text-muted-foreground">
                  Organize images into albums. You can store up to {MAX_MEDIA_IMAGES} images total across all albums.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* ── File upload — image / audio / video / article ── */}
            {isUploadable && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mediaFile">
                    {isImage ? "Upload image files" : `Upload ${mediaType} file`}
                  </Label>
                  {isImage ? (
                    <span className="text-xs text-muted-foreground">
                      {remainingImageSlots} / {MAX_MEDIA_IMAGES} slots available
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Max {MAX_FILE_SIZE_MB} MB
                    </span>
                  )}
                </div>

                {/* Drop zone / file picker / Previews */}
                {files.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex flex-col gap-2">
                      {files.map((f, i) => (
                        <div key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-2">
                          <div className="flex items-center gap-3 min-w-0">
                            {isImage && previews[i] ? (
                              <div className="h-12 w-16 md:w-20 rounded overflow-hidden border shrink-0 bg-black/40">
                                <img
                                  src={previews[i]}
                                  alt={f.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded border bg-background shrink-0">
                                <Upload className="size-4 text-primary" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{f.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {(f.size / 1024 / 1024).toFixed(1)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newFiles = [...files];
                              newFiles.splice(i, 1);
                              setFiles(newFiles);
                              if (newFiles.length === 0 && fileRef.current) fileRef.current.value = "";
                            }}
                            className="shrink-0 text-muted-foreground hover:text-destructive p-2"
                            aria-label="Remove file"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {isImage && mode === "create" && files.length < remainingImageSlots && (
                      <label
                        htmlFor="mediaFile"
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                      >
                        <Upload className="size-4" />
                        Add more images
                      </label>
                    )}
                  </div>
                ) : (
                  <label
                    htmlFor="mediaFile"
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-6 text-center hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    <Upload className="size-6 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Click to browse</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {mediaType === "video" && "MP4, WebM, MOV — up to 100 MB"}
                        {mediaType === "audio" && "MP3, WAV, M4A, OGG — up to 100 MB"}
                        {mediaType === "image" && "JPEG, PNG, WebP, GIF — up to 100 MB"}
                        {mediaType === "article" && "PDF — up to 100 MB"}
                      </p>
                    </div>
                  </label>
                )}

                <Input
                  ref={fileRef}
                  id="mediaFile"
                  type="file"
                  className="sr-only"
                  accept={FILE_ACCEPT[mediaType]}
                  multiple={isImage && mode === "create"}
                  onChange={(e) => {
                    const selected = Array.from(e.target.files ?? []);
                    if (isImage && mode === "create") {
                      // Append new files to existing ones when "Add more images" is clicked
                      const newFiles = [...files, ...selected];
                      // unique by name and size to avoid duplicates easily
                      const uniqueFiles = newFiles.filter((v, i, a) => a.findIndex(t => (t.name === v.name && t.size === v.size)) === i);
                      setFiles(uniqueFiles.slice(0, remainingImageSlots));
                    } else {
                      setFiles(selected);
                    }
                    // Auto-fill title from filename for non-image types
                    if (!isImage && selected.length === 1 && !title.trim()) {
                      setTitle(deriveTitleFromFilename(selected[0].name));
                    }
                    // Clear URL when file is chosen (non-image)
                    if (!isImage && selected.length > 0) setUrl("");
                  }}
                />

                {errors.files && <p className="text-sm text-destructive">{errors.files}</p>}

                {uploadStatus && (
                  <div className="flex items-center gap-2 rounded-md bg-primary/5 border border-primary/20 px-3 py-2 text-xs text-primary">
                    <Upload className="size-3 animate-pulse" />
                    {uploadStatus}
                  </div>
                )}

                {isUploadable && !isImage && (
                  <p className="text-xs text-muted-foreground">
                    Or leave the file picker empty and enter a URL below (e.g. Spotify, SoundCloud, YouTube, external PDF link).
                  </p>
                )}
              </div>
            )}

            {/* URL field — we now show it consistently but clearly labeled */}
            {(mediaType === "link" || (!isImage && files.length === 0) || isImage) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="url">
                    {isImage ? "Or use an Image URL" : mediaType === "link" ? "URL *" : "URL"}
                    {isUploadable && !isImage && files.length === 0 ? " *" : ""}
                  </Label>
                </div>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  disabled={isImage && files.length > 0}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={
                    mediaType === "audio" ? "https://open.spotify.com/... or https://soundcloud.com/..." :
                      mediaType === "video" ? "https://www.youtube.com/... or https://vimeo.com/..." :
                        mediaType === "article" ? "https://your-blog.com/post or PDF URL..." :
                          "https://..."
                  }
                  aria-invalid={!!errors.url}
                />
                {isImage && url.trim() && !errors.url && (
                  <div className="mt-2 h-24 sm:h-32 w-auto max-w-sm rounded-lg border overflow-hidden bg-black/40 inline-flex">
                    <img
                      src={url.trim()}
                      alt="URL preview"
                      className="h-full object-contain"
                      onError={() => {
                        // don't completely crash the url field to error if they're typing it, but show an error text
                      }}
                    />
                  </div>
                )}
                {errors.url && <p className="text-sm text-destructive">{errors.url}</p>}
              </div>
            )}

            {/* Thumbnail URL — for video / audio / article only (images auto-generate) */}
            {!isImage && (
              <div className="space-y-2">
                <Label htmlFor="thumbnailUrl">Thumbnail URL (optional)</Label>
                <Input
                  id="thumbnailUrl"
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder={
                    mediaType === "video" ? "https://img.youtube.com/vi/{VIDEO_ID}/maxresdefault.jpg" : "https://..."
                  }
                  aria-invalid={!!errors.thumbnailUrl}
                />
                {errors.thumbnailUrl && (
                  <p className="text-sm text-destructive">{errors.thumbnailUrl}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Shown as a preview card. For YouTube videos, use the auto-generated thumbnail URL above.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="featured" className="cursor-pointer">
                  Featured
                </Label>
                <p className="text-xs text-muted-foreground">
                  Highlight this item on your public profile.
                </p>
              </div>
              <Switch id="featured" checked={featured} onCheckedChange={setFeatured} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active
                </Label>
                <p className="text-xs text-muted-foreground">
                  Show this item publicly.
                </p>
              </div>
              <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/media">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading
              ? mode === "create"
                ? "Saving..."
                : "Updating..."
              : mode === "create"
                ? "Save Media"
                : "Update Media"}
          </Button>
        </div>
      </form>
    </div>
  );
}
