"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SPECIALTIES } from "@/lib/constants";
import { toast } from "sonner";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload } from "lucide-react";

interface DivinerProfile {
  id: string;
  display_name: string;
  username: string;
  bio: string | null;
  tagline: string | null;
  specialties: string[];
  avatar_url: string | null;
  credentials: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<DivinerProfile | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("diviners")
        .select(
          "id, display_name, username, bio, tagline, specialties, avatar_url, credentials"
        )
        .eq("user_id", user.id)
        .single();

      if (data) {
        setProfile({
          ...data,
          specialties: data.specialties ?? [],
          credentials: data.credentials ?? null,
        });
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!profile || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File must be under 2MB");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `avatars/${profile.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Failed to upload avatar");
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("diviners")
      .update({ avatar_url: publicUrl })
      .eq("id", profile.id);

    if (updateError) {
      toast.error("Failed to update avatar");
    } else {
      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success("Avatar updated");
    }
    setUploading(false);
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("diviners")
      .update({
        display_name: profile.display_name,
        bio: profile.bio || null,
        tagline: profile.tagline || null,
        specialties: profile.specialties,
        credentials: profile.credentials || null,
      })
      .eq("id", profile.id);

    setSaving(false);

    if (error) {
      toast.error("Failed to save profile");
      return;
    }

    toast.success("Profile saved");
    router.refresh();
  }

  function toggleSpecialty(specialty: string) {
    if (!profile) return;
    const current = profile.specialties;
    const updated = current.includes(specialty)
      ? current.filter((s) => s !== specialty)
      : [...current, specialty];
    setProfile({ ...profile, specialties: updated });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Loader2 className="size-8 text-destructive" />
        <p className="font-medium">Could not load profile</p>
        <p className="text-sm text-muted-foreground">Please refresh the page or try again later.</p>
        <button onClick={() => window.location.reload()} className="rounded-md border px-4 py-2 text-sm hover:bg-muted">Reload</button>
      </div>
    );
  }

  const initials = profile.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your public diviner profile.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar Card */}
        <Card>
          <CardHeader>
            <CardTitle>Avatar</CardTitle>
            <CardDescription>
              Your profile photo shown to clients.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="size-24">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <Label
              htmlFor="avatar-upload"
              className="flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {uploading ? "Uploading..." : "Upload Photo"}
            </Label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>
              This information appears on your public profile page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={profile.display_name}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        display_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profile.username}
                    disabled
                    className="opacity-60"
                  />
                  <p className="text-xs text-muted-foreground">
                    Username cannot be changed.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={profile.tagline ?? ""}
                  onChange={(e) =>
                    setProfile({ ...profile, tagline: e.target.value })
                  }
                  placeholder="A short description of your practice"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio ?? ""}
                  onChange={(e) =>
                    setProfile({ ...profile, bio: e.target.value })
                  }
                  placeholder="Tell clients about your background and approach..."
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credentials">Credentials &amp; Certifications</Label>
                <Textarea
                  id="credentials"
                  value={profile.credentials ?? ""}
                  onChange={(e) =>
                    setProfile({ ...profile, credentials: e.target.value })
                  }
                  placeholder={
                    "One certification per line, e.g.:\nCertified Vedic Astrologer — ACVA 2019\nTarot Certification — Biddy Tarot 2020"
                  }
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Enter one credential per line. These will appear on your public profile.
                </p>
              </div>
              <div className="space-y-3">
                <Label>Specialties</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SPECIALTIES.map((specialty) => (
                    <div
                      key={specialty}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`specialty-${specialty}`}
                        checked={profile.specialties.includes(specialty)}
                        onCheckedChange={() => toggleSpecialty(specialty)}
                      />
                      <Label
                        htmlFor={`specialty-${specialty}`}
                        className="text-sm font-normal"
                      >
                        {specialty}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Profile"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
