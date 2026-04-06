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
  const [error, setError] = useState<string | null>(null);
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
        setError("Card not found");
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
    const path = `divine-infinity-profile-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
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
    if (!form.priority) {
      setError("Priority is required.");
      return;
    }
    setSaving(true);
    setError(null);

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
      setError(body.error ?? "Failed to save changes");
      setSaving(false);
      return;
    }

    toast.success("Card saved successfully");
    router.push("/admin/tarot/cards");
  }

  async function handleDelete() {
    if (!confirm("Delete this card? This cannot be undone.")) return;
    setDeleting(true);

    const res = await fetch(`/api/admin/tarot/cards/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to delete card");
      setDeleting(false);
      return;
    }

    toast.success("Card deleted");
    router.push("/admin/tarot/cards");
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/admin/tarot" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to Tarot
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Edit Tarot Card</h1>
        </div>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/tarot/cards" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Cards
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Edit Tarot Card</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Card Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="arcana">Arcana *</Label>
                <select
                  id="arcana"
                  value={form.arcana}
                  onChange={(e) => setForm({ ...form, arcana: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="major">Major</option>
                  <option value="minor">Minor</option>
                </select>
              </div>
              {form.arcana === "minor" && (
                <div className="space-y-2">
                  <Label htmlFor="suit">Suit</Label>
                  <Input id="suit" placeholder="e.g. Wands, Cups" value={form.suit} onChange={(e) => setForm({ ...form, suit: e.target.value })} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number">Number</Label>
                <Input id="number" type="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Input
                  id="priority"
                  type="number"
                  min="0"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upright_meaning">Upright Meaning</Label>
              <Textarea id="upright_meaning" rows={3} value={form.upright_meaning} onChange={(e) => setForm({ ...form, upright_meaning: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reversed_meaning">Reversed Meaning</Label>
              <Textarea id="reversed_meaning" rows={3} value={form.reversed_meaning} onChange={(e) => setForm({ ...form, reversed_meaning: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input id="image_url" type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Card Image Upload</Label>
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
                {cardImageUrl && (
                  <a href={cardImageUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline break-all max-w-xs truncate">
                    {cardImageUrl}
                  </a>
                )}
              </div>
              {cardImageUrl && (
                <img src={cardImageUrl} alt="Card preview" className="mt-2 h-24 w-auto rounded border object-contain" />
              )}
            </div>

            {spreads.length > 0 && (
              <div className="space-y-2">
                <Label>Related Spreads</Label>
                <div className="rounded-md border border-input p-3 space-y-2 max-h-48 overflow-y-auto">
                  {spreads.map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`spread-${s.id}`}
                        checked={relatedSpreadIds.includes(s.id)}
                        onCheckedChange={() => toggleSpread(s.id)}
                      />
                      <Label htmlFor={`spread-${s.id}`} className="font-normal cursor-pointer">
                        {s.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
              <Button type="button" variant="outline" onClick={() => router.push("/admin/tarot/cards")}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
