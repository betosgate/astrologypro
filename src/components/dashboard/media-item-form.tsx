"use client";

import { useMemo, useRef, useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { MAX_MEDIA_IMAGES } from "@/lib/media-gallery";

type MediaType = "video" | "audio" | "image" | "article" | "link";

const TYPES: { value: MediaType; label: string; icon: React.ElementType; description: string }[] =
  [
    { value: "video", label: "Video", icon: Video, description: "YouTube, Vimeo, etc." },
    { value: "audio", label: "Audio", icon: Music, description: "Podcast or recording" },
    { value: "image", label: "Image", icon: ImageIcon, description: "Photo gallery image" },
    { value: "article", label: "Article", icon: FileText, description: "Blog post or essay" },
    { value: "link", label: "Link", icon: Link2, description: "Any external link" },
  ];

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
  const [title, setTitle] = useState(initialItem?.title ?? "");
  const [mediaType, setMediaType] = useState<MediaType>(initialItem?.type ?? "image");
  const [url, setUrl] = useState(initialItem?.url ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initialItem?.thumbnail_url ?? "");
  const [albumName, setAlbumName] = useState(initialItem?.album_name ?? "");
  const [description, setDescription] = useState(initialItem?.description ?? "");
  const [featured, setFeatured] = useState(initialItem?.is_featured ?? false);
  const [isActive, setIsActive] = useState(initialItem?.is_active ?? true);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isImage = mediaType === "image";
  const remainingImageSlots = useMemo(() => {
    if (mode === "edit" && initialItem?.type === "image") {
      return Math.max(0, MAX_MEDIA_IMAGES - currentImageCount);
    }
    return Math.max(0, MAX_MEDIA_IMAGES - currentImageCount);
  }, [currentImageCount, initialItem?.type, mode]);

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!isImage || files.length <= 1) {
      if (!title.trim() && !(isImage && files.length > 0)) {
        errs.title = "Title is required.";
      }
    }

    if (isImage) {
      if (mode === "create" && files.length === 0 && !url.trim()) {
        errs.url = "Choose image files or provide an image URL.";
      }
      if (files.length > remainingImageSlots) {
        errs.files = `You can add ${remainingImageSlots} more image${remainingImageSlots === 1 ? "" : "s"} before reaching the ${MAX_MEDIA_IMAGES}-image limit.`;
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

  async function uploadImageFile(file: File, index: number): Promise<string> {
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `media-gallery/${divinerId}/${Date.now()}-${index}-${sanitizeFileName(file.name || `image.${ext}`)}`;

    const { error: uploadError } = await supabase.storage
      .from("all-frontend-assets")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("all-frontend-assets").getPublicUrl(path);
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
          for (const [index, file] of files.entries()) {
            const publicUrl = await uploadImageFile(file, index);
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
        } else {
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

        if (isImage && files.length === 1) {
          const publicUrl = await uploadImageFile(files[0], 0);
          nextUrl = publicUrl;
          nextThumbnailUrl = publicUrl;
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
            {isImage && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="imageFiles">Upload image files</Label>
                  <span className="text-xs text-muted-foreground">
                    {remainingImageSlots} / {MAX_MEDIA_IMAGES} slots available
                  </span>
                </div>
                <Input
                  ref={fileRef}
                  id="imageFiles"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple={mode === "create"}
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                />
                {files.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {files.length} file{files.length === 1 ? "" : "s"} selected
                  </p>
                )}
                {errors.files && <p className="text-sm text-destructive">{errors.files}</p>}
                <p className="text-xs text-muted-foreground">
                  For images, you can upload directly. If no file is selected, the image URL below will be used.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="url">{isImage ? "Image URL" : "URL *"}</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                aria-invalid={!!errors.url}
              />
              {errors.url && <p className="text-sm text-destructive">{errors.url}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl">
                Thumbnail URL {isImage ? "(optional)" : ""}
              </Label>
              <Input
                id="thumbnailUrl"
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://..."
                aria-invalid={!!errors.thumbnailUrl}
              />
              {errors.thumbnailUrl && (
                <p className="text-sm text-destructive">{errors.thumbnailUrl}</p>
              )}
            </div>
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
