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
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Card Details</CardTitle>
            <CardDescription>Configure the properties, meanings, and imagery for this tarot card.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="image_url">External Image URL (Optional)</Label>
              <Input
                id="image_url"
                type="url"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Card Image Upload</Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div
                  className="relative flex h-32 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-muted-foreground/50 bg-muted/30 transition-colors hover:bg-muted/50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {cardImageUrl ? (
                    <img src={cardImageUrl} alt="Card preview" className="h-full w-full object-cover" />
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
                  <p className="text-sm font-medium">Upload Card Image</p>
                  <p className="text-xs text-muted-foreground">JPEG, PNG, WebP up to 10MB.</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
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

            {spreads.length > 0 && (
              <div className="space-y-2">
                <Label>Related Spreads</Label>
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
    </div>
  );
}
