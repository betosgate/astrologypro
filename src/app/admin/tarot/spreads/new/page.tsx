"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { ArrowLeft, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";

const BUCKET = "all-frontend-assets";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function NewTarotSpreadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    card_count: "",
    priority: "",
    is_active: true,
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.card_count.trim()) e.card_count = "Card count is required";
    else if (isNaN(parseInt(form.card_count)) || parseInt(form.card_count) < 1) e.card_count = "Must be at least 1";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Allowed: JPEG, PNG, WebP, GIF.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 10 MB.");
      return;
    }

    setUploading(true);

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `divine-infinity-being/tarot-spread-image/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const supabase = createClient();

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false });

    if (uploadError) {
      toast.error(`Upload failed: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    setThumbnailUrl(urlData.publicUrl);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setErrors({});

    const res = await fetch("/api/admin/tarot/spreads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        card_count: parseInt(form.card_count) || 0,
        priority: form.priority ? parseInt(form.priority) : 0,
        thumbnail_url: thumbnailUrl || null,
        is_active: form.is_active,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      toast.error(body.error ?? "Failed to create spread");
      setSaving(false);
      return;
    }

    toast.success("Spread created successfully");
    router.push("/admin/tarot/spreads");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/tarot/spreads">
            <ArrowLeft className="size-5" />
            <span className="sr-only">Back to spreads</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Spread</h1>
          <p className="text-muted-foreground text-sm">Create a new tarot spread for readings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Spread Details</CardTitle>
            <CardDescription>Configure the underlying properties for this tarot spread.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Celtic Cross"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the purpose and layout of this spread..."
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="card_count">Card Count *</Label>
                <Input
                  id="card_count"
                  type="number"
                  min="1"
                  value={form.card_count}
                  onChange={(e) => setForm({ ...form, card_count: e.target.value })}
                  placeholder="e.g. 10"
                />
                {errors.card_count && <p className="text-sm text-destructive">{errors.card_count}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Display Priority (Optional)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="0"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  placeholder="Higher number = higher in list"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Thumbnail Image</Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div
                  className="relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-muted-foreground/50 bg-muted/30 transition-colors hover:bg-muted/50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt="Thumbnail" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="size-6 text-muted-foreground opacity-50" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                      <Loader2 className="size-5 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Upload Image</p>
                  <p className="text-xs text-muted-foreground">JPEG, PNG, WebP up to 10MB.</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {thumbnailUrl ? "Change image" : "Select image"}
                    </Button>
                    {thumbnailUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setThumbnailUrl("")}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: !!checked })}
              />
              <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => router.push("/admin/tarot/spreads")} disabled={saving || uploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || uploading}>
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                Create Spread
              </Button>
            </div>

          </CardContent>
        </Card>
      </form>
    </div>
  );
}
