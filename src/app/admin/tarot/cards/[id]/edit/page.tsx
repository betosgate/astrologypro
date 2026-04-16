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
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2, ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const BUCKET = "all-frontend-assets";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface Spread { id: string; name: string; }

export default function EditTarotCardPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [spreads, setSpreads] = useState<Spread[]>([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    arcana: "major",
    suit: "",
    number: "",
    priority: "",
    upright_meaning: "",
    reversed_meaning: "",
    image_url: "",
    is_active: true,
  });
  const [cardImageUrl, setCardImageUrl] = useState("");
  const [relatedSpreadIds, setRelatedSpreadIds] = useState<string[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [cardRes, spreadsRes] = await Promise.all([
        fetch(`/api/admin/tarot/cards/${id}`),
        fetch("/api/admin/tarot/spreads"),
      ]);

      if (spreadsRes.ok) {
        const data = await spreadsRes.json();
        setSpreads(Array.isArray(data) ? data : []);
      }

      if (!cardRes.ok) {
        toast.error("Card not found");
        setLoading(false);
        return;
      }

      const card = await cardRes.json();
      setForm({
        name: card.name ?? "",
        description: card.description ?? "",
        arcana: card.arcana ?? "major",
        suit: card.suit ?? "",
        number: card.number?.toString() ?? "",
        priority: card.priority?.toString() ?? "",
        upright_meaning: card.upright_meaning ?? "",
        reversed_meaning: card.reversed_meaning ?? "",
        image_url: card.image_url ?? "",
        is_active: card.is_active ?? true,
      });
      setCardImageUrl(card.card_image_url ?? "");
      setRelatedSpreadIds(Array.isArray(card.related_spread_ids) ? card.related_spread_ids : []);
      setLoading(false);
    }
    load();
  }, [id]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.priority.trim()) e.priority = "Priority is required";
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
    const path = `divine-infinity-profile-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
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
    setCardImageUrl(urlData.publicUrl);
    setUploading(false);
  }

  function toggleSpread(spreadId: string) {
    setRelatedSpreadIds((prev) =>
      prev.includes(spreadId) ? prev.filter((x) => x !== spreadId) : [...prev, spreadId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setErrors({});

    const res = await fetch(`/api/admin/tarot/cards/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || null,
        arcana: form.arcana,
        suit: form.arcana === "minor" ? (form.suit || null) : null,
        number: form.number ? parseInt(form.number) : null,
        priority: parseInt(form.priority),
        upright_meaning: form.upright_meaning || null,
        reversed_meaning: form.reversed_meaning || null,
        image_url: form.image_url || null,
        card_image_url: cardImageUrl || null,
        related_spread_ids: relatedSpreadIds.length > 0 ? relatedSpreadIds : null,
        is_active: form.is_active,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      toast.error(body.error ?? "Failed to save changes");
      setSaving(false);
      return;
    }

    toast.success("Card updated successfully");
    router.push("/admin/tarot/cards");
  }

  async function handleDelete() {
    if (!confirm("Delete this card? This cannot be undone.")) return;
    setDeleting(true);

    const res = await fetch(`/api/admin/tarot/cards/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json();
      toast.error(body.error ?? "Failed to delete card");
      setDeleting(false);
      return;
    }

    toast.success("Card deleted");
    router.push("/admin/tarot/cards");
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" disabled>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Card</h1>
            <p className="text-muted-foreground text-sm">Loading card data…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/tarot/cards">
            <ArrowLeft className="size-5" />
            <span className="sr-only">Back to cards</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Card</h1>
          <p className="text-muted-foreground text-sm">Update the properties and imagery for {form.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Card Details</CardTitle>
            <CardDescription>Configure the properties, meanings, and imagery for this tarot card.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. The Fool"
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="arcana">Arcana *</Label>
                <select
                  id="arcana"
                  value={form.arcana}
                  onChange={(e) => setForm({ ...form, arcana: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="major">Major Arcana</option>
                  <option value="minor">Minor Arcana</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Card description..."
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {form.arcana === "minor" && (
                <div className="space-y-2">
                  <Label htmlFor="suit">Suit</Label>
                  <Input
                    id="suit"
                    placeholder="e.g. Wands, Cups"
                    value={form.suit}
                    onChange={(e) => setForm({ ...form, suit: e.target.value })}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="number">Card Number</Label>
                <Input
                  id="number"
                  type="number"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  placeholder="e.g. 0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Display Priority *</Label>
                <Input
                  id="priority"
                  type="number"
                  min="0"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  placeholder="Higher number = higher in list"
                />
                {errors.priority && <p className="text-sm text-destructive">{errors.priority}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="upright_meaning">Upright Meaning</Label>
                <Textarea
                  id="upright_meaning"
                  rows={3}
                  value={form.upright_meaning}
                  onChange={(e) => setForm({ ...form, upright_meaning: e.target.value })}
                  placeholder="Meaning when the card is drawn upright..."
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reversed_meaning">Reversed Meaning</Label>
                <Textarea
                  id="reversed_meaning"
                  rows={3}
                  value={form.reversed_meaning}
                  onChange={(e) => setForm({ ...form, reversed_meaning: e.target.value })}
                  placeholder="Meaning when the card is drawn reversed..."
                  className="resize-none"
                />
              </div>
            </div>

            {/* ── Card Image Section ── */}
            <div className="space-y-4 rounded-lg border border-input p-4 bg-muted/10">
              <Label className="text-sm font-semibold">Card Image</Label>

              {/* Preview — shows external URL or uploaded image */}
              {(form.image_url || cardImageUrl) && (
                <div className="flex items-start gap-4">
                  <div
                    className="relative h-40 w-28 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-input bg-black transition-shadow hover:shadow-lg hover:shadow-primary/10"
                    onClick={() => setLightboxUrl(form.image_url || cardImageUrl)}
                  >
                    <img
                      src={form.image_url || cardImageUrl}
                      alt="Card preview"
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

              {/* External URL input */}
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

              {/* Upload */}
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
                    {cardImageUrl ? "Change image" : "Select image"}
                  </Button>
                  {cardImageUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setCardImageUrl("")}
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

            {spreads.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Related Spreads</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => {
                      const allSelected = spreads.every((s) => relatedSpreadIds.includes(s.id));
                      setRelatedSpreadIds(allSelected ? [] : spreads.map((s) => s.id));
                    }}
                  >
                    {spreads.every((s) => relatedSpreadIds.includes(s.id)) ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                <div className="rounded-md border border-input p-3 space-y-2 max-h-48 overflow-y-auto bg-muted/20">
                  {spreads.map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`spread-${s.id}`}
                        checked={relatedSpreadIds.includes(s.id)}
                        onCheckedChange={() => toggleSpread(s.id)}
                      />
                      <Label htmlFor={`spread-${s.id}`} className="font-normal cursor-pointer leading-none">
                        {s.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: !!checked })}
              />
              <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={saving || uploading || deleting}
                className="w-full sm:w-auto"
              >
                <Trash2 className="mr-2 size-4" />
                {deleting ? "Deleting…" : "Delete Card"}
              </Button>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/tarot/cards")}
                  disabled={saving || uploading || deleting}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || uploading || deleting}
                  className="flex-1 sm:flex-none"
                >
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
        <DialogContent className="max-w-md p-2 bg-black/95 border-none">
          {lightboxUrl && (
            <img src={lightboxUrl} alt="Full preview" className="w-full h-auto max-h-[80vh] object-contain rounded" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
