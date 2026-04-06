"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const BUCKET = "all-frontend-assets";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function EditTarotSpreadPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    card_count: "",
    priority: "",
    is_active: true,
  });

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/tarot/spreads/${id}`);
      if (!res.ok) {
        setError("Spread not found");
        setLoading(false);
        return;
      }
      const spread = await res.json();
      setForm({
        name: spread.name ?? "",
        description: spread.description ?? "",
        card_count: spread.card_count?.toString() ?? "",
        priority: spread.priority?.toString() ?? "",
        is_active: spread.is_active ?? true,
      });
      setThumbnailUrl(spread.thumbnail_url ?? "");
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Invalid file type. Allowed: JPEG, PNG, WebP, GIF.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File too large. Maximum size is 10 MB.");
      return;
    }

    setError(null);
    setUploading(true);

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `divine-infinity-being/tarot-spread-image/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const supabase = createClient();

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false });

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    setThumbnailUrl(urlData.publicUrl);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/admin/tarot/spreads/${id}`, {
      method: "PUT",
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
      setError(body.error ?? "Failed to save changes");
      setSaving(false);
      return;
    }

    toast.success("Spread saved successfully");
    router.push("/admin/tarot/spreads");
  }

  async function handleDelete() {
    if (!confirm("Delete this spread? This cannot be undone.")) return;
    setDeleting(true);

    const res = await fetch(`/api/admin/tarot/spreads/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to delete spread");
      setDeleting(false);
      return;
    }

    toast.success("Spread deleted");
    router.push("/admin/tarot/spreads");
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/admin/tarot" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to Tarot
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Edit Tarot Spread</h1>
        </div>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/tarot/spreads" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Spreads
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Edit Tarot Spread</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Spread Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="card_count">Card Count *</Label>
                <Input id="card_count" type="number" min="1" value={form.card_count} onChange={(e) => setForm({ ...form, card_count: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input id="priority" type="number" min="0" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Thumbnail</Label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? "Uploading…" : "Choose Image"}
                </Button>
                {thumbnailUrl && (
                  <a href={thumbnailUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline break-all max-w-xs truncate">
                    {thumbnailUrl}
                  </a>
                )}
              </div>
              {thumbnailUrl && (
                <img src={thumbnailUrl} alt="Thumbnail preview" className="mt-2 h-24 w-auto rounded border object-contain" />
              )}
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="is_active" checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: !!checked })} />
              <Label htmlFor="is_active">Active</Label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving || uploading}>{saving ? "Saving…" : "Save Changes"}</Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? "Deleting…" : "Delete"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/admin/tarot/spreads")}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
