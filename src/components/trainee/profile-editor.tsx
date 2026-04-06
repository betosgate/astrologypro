"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Loader2, Camera, Check } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ProfileEditorProps {
  profileId: string;
  name: string;
  bio: string | null;
  specialties: string[];
  avatarUrl: string | null;
  username: string;
  allowedSpecialties: readonly string[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ProfileEditor({
  profileId,
  name: initialName,
  bio: initialBio,
  specialties: initialSpecialties,
  avatarUrl: initialAvatarUrl,
  username,
  allowedSpecialties,
}: ProfileEditorProps) {
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio ?? "");
  const [specialties, setSpecialties] = useState<string[]>(initialSpecialties);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [specialtiesOpen, setSpecialtiesOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Avatar upload ──────────────────────────────────────────────────────────
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation: type + size
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, or GIF images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `trainee-avatars/${profileId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("all-frontend-assets")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("all-frontend-assets")
        .getPublicUrl(path);

      const publicUrl = urlData.publicUrl;

      // Persist to profile
      const res = await fetch("/api/trainee/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: publicUrl }),
      });

      if (!res.ok) throw new Error("Failed to save avatar URL.");

      setAvatarUrl(publicUrl);
      toast.success("Profile photo updated.");
    } catch (err) {
      toast.error("Could not upload photo. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
      // Reset the input so the same file can be re-selected
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // ── Save profile fields ────────────────────────────────────────────────────
  async function handleSave() {
    if (!name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/trainee/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim() || undefined,
          specialties,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to save.");
      }

      toast.success("Profile saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  // ── Specialties toggle ─────────────────────────────────────────────────────
  function toggleSpecialty(s: string) {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* ── Avatar ── */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="size-20">
            <AvatarImage src={avatarUrl ?? undefined} alt={`${name}'s avatar`} />
            <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Upload new profile photo"
            className="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="size-3 animate-spin" aria-hidden="true" />
            ) : (
              <Camera className="size-3" aria-hidden="true" />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            aria-label="Upload profile photo"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-sm text-muted-foreground">@{username}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            JPEG, PNG, WebP or GIF · max 5 MB
          </p>
        </div>
      </div>

      {/* ── Name ── */}
      <div className="space-y-1.5">
        <Label htmlFor="profile-name">Display name</Label>
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder="Your display name"
          aria-required="true"
        />
      </div>

      {/* ── Bio ── */}
      <div className="space-y-1.5">
        <Label htmlFor="profile-bio">
          Bio{" "}
          <span className="text-xs font-normal text-muted-foreground">
            ({bio.length}/500)
          </span>
        </Label>
        <Textarea
          id="profile-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 500))}
          rows={4}
          maxLength={500}
          placeholder="Tell your mentor and future clients a little about yourself…"
        />
      </div>

      {/* ── Specialties ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Specialties</Label>
          <Dialog open={specialtiesOpen} onOpenChange={setSpecialtiesOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Pencil className="mr-1.5 size-3.5" aria-hidden="true" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Specialties</DialogTitle>
                <DialogDescription>
                  Select the disciplines you are studying or practicing.
                </DialogDescription>
              </DialogHeader>
              <ul role="list" className="mt-2 space-y-2">
                {allowedSpecialties.map((s) => {
                  const checked = specialties.includes(s);
                  return (
                    <li key={s} className="flex items-center gap-3">
                      <Checkbox
                        id={`spec-${s}`}
                        checked={checked}
                        onCheckedChange={() => toggleSpecialty(s)}
                        aria-label={s}
                      />
                      <label
                        htmlFor={`spec-${s}`}
                        className="cursor-pointer text-sm capitalize"
                      >
                        {s}
                      </label>
                      {checked && (
                        <Check className="ml-auto size-3.5 text-primary" aria-hidden="true" />
                      )}
                    </li>
                  );
                })}
              </ul>
              <DialogFooter className="mt-4">
                <Button onClick={() => setSpecialtiesOpen(false)}>Done</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex flex-wrap gap-2">
          {specialties.length === 0 ? (
            <p className="text-sm text-muted-foreground">No specialties selected yet.</p>
          ) : (
            specialties.map((s) => (
              <Badge key={s} variant="secondary" className="capitalize">
                {s}
              </Badge>
            ))
          )}
        </div>
      </div>

      {/* ── Save Button ── */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="min-w-24">
          {saving ? (
            <>
              <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </div>
  );
}
