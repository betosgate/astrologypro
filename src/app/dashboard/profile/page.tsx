"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload } from "lucide-react";
import { ProfileCompletionBar } from "@/components/ui/profile-completion-bar";
import { calculateProfileCompletion } from "@/lib/profile-completion";

interface DivinerProfile {
  id: string;
  display_name: string;
  username: string;
  bio: string | null;
  tagline: string | null;
  specialties: string[];
  avatar_url: string | null;
  credentials: string | null;
  phone: string | null;
  timezone: string | null;
  show_public_session_counts: boolean;
  public_session_counts_override: "force_show" | "force_hide" | null;
  public_session_counts_override_reason: string | null;
  service_package?: {
    displayName: string;
    allowedCategories: string[];
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<DivinerProfile | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/dashboard/profile");
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const { profile: data } = await res.json();
        if (data) {
          setProfile({
            ...data,
            specialties: data.specialties ?? [],
            credentials: data.credentials ?? null,
            phone: data.phone ?? null,
            timezone: data.timezone ?? null,
            show_public_session_counts: data.show_public_session_counts === true,
            public_session_counts_override: data.public_session_counts_override ?? null,
            public_session_counts_override_reason: data.public_session_counts_override_reason ?? null,
          });
        }
      } catch {
        // network error — leave profile null
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

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "avatars");

    const uploadRes = await fetch("/api/upload/avatar", { method: "POST", body: formData });
    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      toast.error("Failed to upload avatar: " + (uploadData.error ?? "Unknown error"));
      setUploading(false);
      return;
    }

    const publicUrl = uploadData.publicUrl;

    // Update avatar_url via API route so profile sync runs
    const res = await fetch("/api/dashboard/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar_url: publicUrl }),
    });

    if (!res.ok) {
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

    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: profile.display_name,
          bio: profile.bio || null,
          tagline: profile.tagline || null,
          specialties: profile.specialties,
          credentials: profile.credentials || null,
          phone: profile.phone || null,
          timezone: profile.timezone || null,
          show_public_session_counts: profile.show_public_session_counts,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          data.errors?.join(", ") || data.error || "Failed to save profile";
        toast.error(msg);
        setSaving(false);
        return;
      }

      toast.success("Profile saved");
      router.refresh();
    } catch {
      toast.error("Failed to save profile");
    }

    setSaving(false);
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

  const completion = calculateProfileCompletion([
    { key: "display_name", label: "Display name", value: profile.display_name },
    { key: "tagline", label: "Tagline", value: profile.tagline },
    { key: "bio", label: "Bio", value: profile.bio },
    { key: "avatar_url", label: "Profile photo", value: profile.avatar_url },
    { key: "phone", label: "Phone number", value: profile.phone },
    { key: "timezone", label: "Timezone", value: profile.timezone },
    { key: "specialties", label: "Specialties", value: profile.specialties },
  ]);

  function focusField(fieldKey: string) {
    document.getElementById(fieldKey)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  const sessionCountOverrideActive =
    profile.public_session_counts_override === "force_show" ||
    profile.public_session_counts_override === "force_hide";
  const sessionCountHelperText = sessionCountOverrideActive
    ? profile.public_session_counts_override === "force_show"
      ? "An administrator is currently forcing this block to stay visible on your public profile."
      : "An administrator is currently forcing this block to stay hidden on your public profile."
    : "Display your total completed sessions plus recent 7-day and 30-day activity on your public page.";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your public diviner profile.
        </p>
      </div>

      <ProfileCompletionBar
        percentage={completion.percentage}
        missingFields={completion.missingFields}
        completedCount={completion.completedCount}
        totalCount={completion.totalCount}
        onMissingFieldClick={focusField}
      />

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
              {profile.service_package && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                  Current package:{" "}
                  <span className="font-medium text-foreground">
                    {profile.service_package.displayName}
                  </span>
                  . Allowed categories:{" "}
                  {profile.service_package.allowedCategories.join(", ")}.
                </div>
              )}
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={profile.phone ?? ""}
                        onChange={(e) =>
                          setProfile({ ...profile, phone: e.target.value })
                        }
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input
                        id="timezone"
                        value={profile.timezone ?? ""}
                        onChange={(e) =>
                          setProfile({ ...profile, timezone: e.target.value })
                        }
                        placeholder="America/New_York"
                      />
                    </div>
                  </div>
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
                  <Label htmlFor="specialties">Specialties</Label>
                  <div id="specialties" />
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
                <div className="rounded-xl border border-white/10 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="show_public_session_counts" className="text-sm font-medium">
                        Show public session counts
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {sessionCountHelperText}
                      </p>
                      {profile.public_session_counts_override_reason ? (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Admin note: {profile.public_session_counts_override_reason}
                        </p>
                      ) : null}
                    </div>
                    <Switch
                      id="show_public_session_counts"
                      checked={profile.show_public_session_counts}
                      onCheckedChange={(checked) =>
                        setProfile({
                          ...profile,
                          show_public_session_counts: checked,
                        })
                      }
                      disabled={saving || sessionCountOverrideActive}
                      aria-label="Show public session counts"
                    />
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
