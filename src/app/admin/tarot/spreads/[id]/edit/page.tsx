"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
// createClient no longer needed — uploads go through server API route
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [positionLabels, setPositionLabels] = useState<string[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    card_count: "",
    priority: "",
    image_url: "",
    is_active: true,
  });

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/tarot/spreads/${id}`);
      if (!res.ok) {
        toast.error("Spread not found");
        router.push("/admin/tarot/spreads");
        return;
      }
      const spread = await res.json();
      setForm({
        name: spread.name ?? "",
        description: spread.description ?? "",
        card_count: spread.card_count?.toString() ?? "",
        priority: spread.priority?.toString() ?? "",
        image_url: spread.image_url ?? "",
        is_active: spread.is_active ?? true,
      });
      setThumbnailUrl(spread.image_url ?? "");
      setPositionLabels(spread.layout_json?.position_labels ?? []);
      setLoading(false);
    }
    load();
  }, [id, router]);

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

    const body = new FormData();
    body.append("file", file);
    body.append("kind", "spread");

    try {
      const res = await fetch("/api/admin/tarot/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Upload failed"); return; }
      setThumbnailUrl(data.url);
      setForm((prev) => ({ ...prev, image_url: "" }));
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setErrors({});

    const res = await fetch(`/api/admin/tarot/spreads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        card_count: parseInt(form.card_count) || 0,
        priority: form.priority ? parseInt(form.priority) : 0,
        image_url: form.image_url || thumbnailUrl || null,
        layout_json: { position_labels: positionLabels },
        is_active: form.is_active,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      toast.error(body.error ?? "Failed to save changes");
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
      toast.error(body.error ?? "Failed to delete spread");
      setDeleting(false);
      return;
    }

    toast.success("Spread deleted");
    router.push("/admin/tarot/spreads");
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-muted-foreground">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <p className="mt-4">Loading spread...</p>
      </div>
    );
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
          <h1 className="text-2xl font-bold tracking-tight">Edit Spread</h1>
          <p className="text-muted-foreground text-sm">Update properties for {form.name || "this spread"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Spread Details</CardTitle>
            <CardDescription>Configure the underlying properties for this tarot spread.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Label htmlFor="card_count">Card Count *</Label>
                <Input
                  id="card_count"
                  type="number"
                  min="1"
                  value={form.card_count}
                  onChange={(e) => setForm({ ...form, card_count: String(e.target.value) })}
                  placeholder="e.g. 10"
                />
                {errors.card_count && <p className="text-sm text-destructive">{errors.card_count}</p>}
              </div>
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
                <Label htmlFor="priority">Display Priority (Optional)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="0"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: String(e.target.value) })}
                  placeholder="Higher number = higher in list"
                />
              </div>
            </div>

            {/* Position Labels */}
            <div className="space-y-3">
              <Label>Card Position Names</Label>
              <p className="text-xs text-muted-foreground">
                Define the label for each card position in this spread (e.g. Past, Present, Future).
              </p>
              {positionLabels.length > 0 && (
                <div className="space-y-2 rounded-md border border-input p-3 bg-muted/20">
                  {positionLabels.map((label, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="min-w-[1.5rem] text-xs font-bold text-muted-foreground">{i + 1}.</span>
                      <Input
                        value={label}
                        onChange={(e) => {
                          const updated = [...positionLabels];
                          updated[i] = e.target.value;
                          setPositionLabels(updated);
                        }}
                        className="h-8 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setPositionLabels(positionLabels.filter((_, idx) => idx !== i))}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="New position name..."
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newLabel.trim()) {
                      e.preventDefault();
                      setPositionLabels([...positionLabels, newLabel.trim()]);
                      setNewLabel("");
                    }
                  }}
                  className="h-8 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  disabled={!newLabel.trim()}
                  onClick={() => {
                    setPositionLabels([...positionLabels, newLabel.trim()]);
                    setNewLabel("");
                  }}
                >
                  <Plus className="size-3.5" />
                  Add
                </Button>
              </div>
            </div>

            {/* ── Spread Image Section ── */}
            <div className="space-y-4 rounded-lg border border-input p-4 bg-muted/10">
              <Label className="text-sm font-semibold">Spread Image</Label>

              {(form.image_url || thumbnailUrl) && (
                <div className="flex items-start gap-4">
                  <div
                    className="relative h-32 w-48 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-input bg-black transition-shadow hover:shadow-lg hover:shadow-primary/10"
                    onClick={() => setLightboxUrl(form.image_url || thumbnailUrl)}
                  >
                    <img
                      src={form.image_url || thumbnailUrl}
                      alt="Spread preview"
                      className="h-full w-full object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors">
                      <span className="text-white/0 hover:text-white/90 text-xs font-medium">Click to enlarge</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground pt-1">
                    {form.image_url ? "External URL" : "Uploaded image"}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="image_url" className="text-xs">External Image URL</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Or Upload Image</Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading && <Loader2 className="mr-2 size-3.5 animate-spin" />}
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
                  <span className="text-xs text-muted-foreground">JPEG, PNG, WebP up to 10MB</span>
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
            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10"
                disabled={deleting || saving || uploading}
                onClick={handleDelete}
              >
                {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Delete Spread
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => router.push("/admin/tarot/spreads")} disabled={saving || uploading || deleting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || uploading || deleting}>
                  {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>
      </form>

      {/* Lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={(open) => !open && setLightboxUrl(null)}>
        <DialogContent className="max-w-lg p-2 bg-black/95 border-none">
          {lightboxUrl && (
            <img src={lightboxUrl} alt="Full preview" className="w-full h-auto max-h-[80vh] object-contain rounded" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
