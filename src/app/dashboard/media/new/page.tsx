"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Video, Music, Image, FileText, Link2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type MediaType = "video" | "audio" | "image" | "article" | "link";

const TYPES: { value: MediaType; label: string; icon: React.ElementType; description: string }[] = [
  { value: "video", label: "Video", icon: Video, description: "YouTube, Vimeo, etc." },
  { value: "audio", label: "Audio", icon: Music, description: "Podcast, recording" },
  { value: "image", label: "Image", icon: Image, description: "Photo or graphic" },
  { value: "article", label: "Article", icon: FileText, description: "Blog post or essay" },
  { value: "link", label: "Link", icon: Link2, description: "Any external link" },
];

export default function NewMediaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("video");
  const [url, setUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [description, setDescription] = useState("");
  const [featured, setFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Title is required.";
    if (!url.trim()) errs.url = "URL is required.";
    else {
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
        errs.thumbnailUrl = "Please enter a valid URL for the thumbnail.";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const res = await fetch("/api/dashboard/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        media_type: mediaType,
        url: url.trim(),
        thumbnail_url: thumbnailUrl.trim() || undefined,
        description: description.trim() || undefined,
        featured,
        is_active: isActive,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.detail ?? "Failed to create media item.");
      return;
    }

    toast.success("Media item added.");
    router.push("/dashboard/media");
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/media">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Media</h1>
          <p className="text-muted-foreground text-sm">Add a new item to your media gallery.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Intro to Birth Charts"
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of this media..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Media type selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Media Type <span className="text-destructive">*</span>
            </CardTitle>
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
                  <span className="text-[10px] text-muted-foreground hidden sm:block">{description}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* URLs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">
                URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                aria-invalid={!!errors.url}
              />
              {errors.url && (
                <p className="text-sm text-destructive">{errors.url}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl">Thumbnail URL (optional)</Label>
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
              {thumbnailUrl && !errors.thumbnailUrl && (
                <div className="mt-2 w-32 overflow-hidden rounded border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail preview"
                    className="aspect-video w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="featured" className="cursor-pointer">Featured</Label>
                <p className="text-xs text-muted-foreground">Highlight this item on your public profile.</p>
              </div>
              <Switch
                id="featured"
                checked={featured}
                onCheckedChange={setFeatured}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
                <p className="text-xs text-muted-foreground">Show this item publicly.</p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/media">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Add Media"}
          </Button>
        </div>
      </form>
    </div>
  );
}
