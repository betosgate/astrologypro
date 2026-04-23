"use client";

import { useEffect, useRef, useState } from "react";
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
import { Loader2, Upload, ChevronDown, Search, Check, Plus, Trash2 } from "lucide-react";
import { ProfileCompletionBar } from "@/components/ui/profile-completion-bar";
import { calculateProfileCompletion } from "@/lib/profile-completion";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// ─── Timezone data ────────────────────────────────────────────────────────────
const TIMEZONES: { zone: string; label: string }[] = [
  { zone: "Pacific/Honolulu", label: "Hawaii (HST, UTC−10)" },
  { zone: "America/Anchorage", label: "Alaska (AKST/AKDT, UTC−9/8)" },
  { zone: "America/Los_Angeles", label: "Pacific — Los Angeles (PST/PDT)" },
  { zone: "America/Vancouver", label: "Pacific — Vancouver (PST/PDT)" },
  { zone: "America/Denver", label: "Mountain — Denver (MST/MDT)" },
  { zone: "America/Edmonton", label: "Mountain — Edmonton (MST/MDT)" },
  { zone: "America/Phoenix", label: "Arizona — Phoenix (MST, no DST)" },
  { zone: "America/Chicago", label: "Central — Chicago (CST/CDT)" },
  { zone: "America/Winnipeg", label: "Central — Winnipeg (CST/CDT)" },
  { zone: "America/Mexico_City", label: "Mexico — Mexico City (CST/CDT)" },
  { zone: "America/New_York", label: "Eastern — New York (EST/EDT)" },
  { zone: "America/Toronto", label: "Eastern — Toronto (EST/EDT)" },
  { zone: "America/Halifax", label: "Atlantic — Halifax (AST/ADT)" },
  { zone: "America/St_Johns", label: "Newfoundland — St. John's (NST/NDT)" },
  { zone: "America/Sao_Paulo", label: "Brazil — São Paulo (BRT/BRST)" },
  { zone: "America/Argentina/Buenos_Aires", label: "Argentina — Buenos Aires (ART)" },
  { zone: "America/Santiago", label: "Chile — Santiago (CLT/CLST)" },
  { zone: "America/Bogota", label: "Colombia — Bogotá (COT)" },
  { zone: "America/Lima", label: "Peru — Lima (PET)" },
  { zone: "America/Caracas", label: "Venezuela — Caracas (VET)" },
  { zone: "Europe/London", label: "London (GMT/BST)" },
  { zone: "Europe/Dublin", label: "Dublin (GMT/IST)" },
  { zone: "Europe/Lisbon", label: "Lisbon (WET/WEST)" },
  { zone: "Europe/Paris", label: "Central Europe — Paris (CET/CEST)" },
  { zone: "Europe/Berlin", label: "Central Europe — Berlin (CET/CEST)" },
  { zone: "Europe/Rome", label: "Central Europe — Rome (CET/CEST)" },
  { zone: "Europe/Madrid", label: "Central Europe — Madrid (CET/CEST)" },
  { zone: "Europe/Amsterdam", label: "Central Europe — Amsterdam (CET/CEST)" },
  { zone: "Europe/Stockholm", label: "Central Europe — Stockholm (CET/CEST)" },
  { zone: "Europe/Warsaw", label: "Central Europe — Warsaw (CET/CEST)" },
  { zone: "Europe/Helsinki", label: "Eastern Europe — Helsinki (EET/EEST)" },
  { zone: "Europe/Athens", label: "Eastern Europe — Athens (EET/EEST)" },
  { zone: "Europe/Bucharest", label: "Eastern Europe — Bucharest (EET/EEST)" },
  { zone: "Europe/Kyiv", label: "Eastern Europe — Kyiv (EET/EEST)" },
  { zone: "Europe/Istanbul", label: "Turkey — Istanbul (TRT, UTC+3)" },
  { zone: "Europe/Moscow", label: "Russia — Moscow (MSK, UTC+3)" },
  { zone: "Africa/Casablanca", label: "Morocco — Casablanca (WET/WEST)" },
  { zone: "Africa/Lagos", label: "Nigeria — Lagos (WAT, UTC+1)" },
  { zone: "Africa/Cairo", label: "Egypt — Cairo (EET, UTC+2)" },
  { zone: "Africa/Johannesburg", label: "South Africa — Johannesburg (SAST, UTC+2)" },
  { zone: "Africa/Nairobi", label: "Kenya — Nairobi (EAT, UTC+3)" },
  { zone: "Asia/Riyadh", label: "Saudi Arabia — Riyadh (AST, UTC+3)" },
  { zone: "Asia/Dubai", label: "UAE — Dubai (GST, UTC+4)" },
  { zone: "Asia/Tehran", label: "Iran — Tehran (IRST, UTC+3:30)" },
  { zone: "Asia/Kabul", label: "Afghanistan — Kabul (AFT, UTC+4:30)" },
  { zone: "Asia/Karachi", label: "Pakistan — Karachi (PKT, UTC+5)" },
  { zone: "Asia/Kolkata", label: "India — Mumbai/Delhi (IST, UTC+5:30)" },
  { zone: "Asia/Kathmandu", label: "Nepal — Kathmandu (NPT, UTC+5:45)" },
  { zone: "Asia/Dhaka", label: "Bangladesh — Dhaka (BST, UTC+6)" },
  { zone: "Asia/Yangon", label: "Myanmar — Yangon (MMT, UTC+6:30)" },
  { zone: "Asia/Bangkok", label: "Thailand — Bangkok (ICT, UTC+7)" },
  { zone: "Asia/Jakarta", label: "Indonesia — Jakarta (WIB, UTC+7)" },
  { zone: "Asia/Singapore", label: "Singapore (SGT, UTC+8)" },
  { zone: "Asia/Hong_Kong", label: "Hong Kong (HKT, UTC+8)" },
  { zone: "Asia/Shanghai", label: "China — Shanghai (CST, UTC+8)" },
  { zone: "Asia/Taipei", label: "Taiwan — Taipei (CST, UTC+8)" },
  { zone: "Asia/Manila", label: "Philippines — Manila (PST, UTC+8)" },
  { zone: "Asia/Seoul", label: "South Korea — Seoul (KST, UTC+9)" },
  { zone: "Asia/Tokyo", label: "Japan — Tokyo (JST, UTC+9)" },
  { zone: "Australia/Perth", label: "Australia — Perth (AWST, UTC+8)" },
  { zone: "Australia/Darwin", label: "Australia — Darwin (ACST, UTC+9:30)" },
  { zone: "Australia/Brisbane", label: "Australia — Brisbane (AEST, UTC+10)" },
  { zone: "Australia/Adelaide", label: "Australia — Adelaide (ACST/ACDT)" },
  { zone: "Australia/Sydney", label: "Australia — Sydney (AEST/AEDT)" },
  { zone: "Australia/Melbourne", label: "Australia — Melbourne (AEST/AEDT)" },
  { zone: "Pacific/Auckland", label: "New Zealand — Auckland (NZST/NZDT)" },
  { zone: "Pacific/Fiji", label: "Fiji (FJT, UTC+12)" },
  { zone: "Pacific/Guam", label: "Guam (ChST, UTC+10)" },
];

// ─── TimezoneCombobox ─────────────────────────────────────────────────────────
function TimezoneCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customVal, setCustomVal] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = TIMEZONES.filter(
    (t) =>
      t.label.toLowerCase().includes(search.toLowerCase()) ||
      t.zone.toLowerCase().includes(search.toLowerCase())
  );

  const displayLabel =
    TIMEZONES.find((t) => t.zone === value)?.label ?? value;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value ? displayLabel : "Select timezone…"}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search timezone…"
              className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">No results</p>
            )}
            {filtered.map((t) => (
              <button
                key={t.zone}
                type="button"
                onClick={() => { onChange(t.zone); setOpen(false); setSearch(""); }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground ${value === t.zone ? "bg-accent/50" : ""}`}
              >
                {value === t.zone && <Check className="h-4 w-4 shrink-0" />}
                <span className={value === t.zone ? "" : "pl-6"}>{t.label}</span>
              </button>
            ))}
            <div className="border-t">
              {customMode ? (
                <div className="flex gap-2 p-2">
                  <input
                    autoFocus
                    value={customVal}
                    onChange={(e) => setCustomVal(e.target.value)}
                    placeholder="e.g. Asia/Kathmandu"
                    className="flex-1 rounded border border-input bg-background px-2 py-1 text-sm outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customVal.trim()) {
                        onChange(customVal.trim());
                        setOpen(false);
                        setCustomMode(false);
                        setCustomVal("");
                        setSearch("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (customVal.trim()) {
                        onChange(customVal.trim());
                        setOpen(false);
                        setCustomMode(false);
                        setCustomVal("");
                        setSearch("");
                      }
                    }}
                  >
                    Set
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCustomMode(true)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <Plus className="h-4 w-4" />
                  Other / Custom IANA zone…
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DivinerProfile {
  id: string;
  display_name: string;
  username: string;
  bio: string | null;
  tagline: string | null;
  specialties: string[];
  avatar_url: string | null;
  cover_image_url: string | null;
  credentials: string | null;
  phone: string | null;
  timezone: string | null;
  youtube_channel_id: string | null;
  facebook_live_url: string | null;
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
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showAvatarConfirm, setShowAvatarConfirm] = useState(false);
  const [showCoverConfirm, setShowCoverConfirm] = useState(false);
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
            cover_image_url: data.cover_image_url ?? null,
            youtube_channel_id: data.youtube_channel_id ?? null,
            facebook_live_url: data.facebook_live_url ?? null,
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

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!profile || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Cover image must be under 5MB");
      return;
    }

    setUploadingCover(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "covers");

    const uploadRes = await fetch("/api/upload/avatar", { method: "POST", body: formData });
    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      toast.error("Failed to upload cover image: " + (uploadData.error ?? "Unknown error"));
      setUploadingCover(false);
      return;
    }

    const publicUrl = uploadData.publicUrl;

    const res = await fetch("/api/dashboard/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cover_image_url: publicUrl }),
    });

    if (!res.ok) {
      toast.error("Failed to update cover image");
    } else {
      setProfile({ ...profile, cover_image_url: publicUrl });
      toast.success("Cover image updated");
    }
    setUploadingCover(false);
  }

  async function handleRemoveAvatar() {
    if (!profile) return;
    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: null }),
      });
      if (res.ok) {
        setProfile({ ...profile, avatar_url: null });
        toast.success("Profile photo removed");
      } else {
        toast.error("Failed to remove profile photo");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setShowAvatarConfirm(false);
    }
  }

  async function handleRemoveCover() {
    if (!profile) return;
    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cover_image_url: null }),
      });
      if (res.ok) {
        setProfile({ ...profile, cover_image_url: null });
        toast.success("Cover image removed");
      } else {
        toast.error("Failed to remove cover image");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setShowCoverConfirm(false);
    }
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
          youtube_channel_id: profile.youtube_channel_id || null,
          facebook_live_url: profile.facebook_live_url || null,
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
    { key: "cover_image_url", label: "Cover image", value: profile.cover_image_url },
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
            <CardTitle>Profile Photo</CardTitle>
            <CardDescription>
              Your avatar shown to clients.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="size-24">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex w-full items-center gap-2">
              <Label
                htmlFor="avatar-upload"
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {uploading ? "Uploading..." : "Upload Photo"}
              </Label>
              {profile.avatar_url && (
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9 text-destructive hover:bg-destructive/10"
                  onClick={() => setShowAvatarConfirm(true)}
                  disabled={uploading}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
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

        {/* Cover Image Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cover / Banner Image</CardTitle>
            <CardDescription>
              Shown at the top of your public profile page. Recommended: 1200x400px.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.cover_image_url && (
              <img
                id="cover_image_url"
                src={profile.cover_image_url}
                alt="Cover preview"
                className="h-28 w-full rounded-md object-cover"
              />
            )}
            {!profile.cover_image_url && (
              <div id="cover_image_url" className="flex h-28 w-full items-center justify-center rounded-md border border-dashed bg-muted/30">
                <p className="text-sm text-muted-foreground">No cover image set</p>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Label
                htmlFor="cover-upload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                {uploadingCover ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {uploadingCover ? "Uploading..." : profile.cover_image_url ? "Change Cover" : "Upload Cover"}
              </Label>
              {profile.cover_image_url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:bg-destructive/10"
                  onClick={() => setShowCoverConfirm(true)}
                  disabled={uploadingCover}
                >
                  <Trash2 className="size-4" />
                  Remove
                </Button>
              )}
            </div>
            <input
              id="cover-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
              disabled={uploadingCover}
            />
          </CardContent>
        </Card>
      </div>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Info</CardTitle>
          <CardDescription>
            Your name, tagline, and bio — shown on your public profile.
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
          </div>
        </CardContent>
      </Card>

      {/* Practice Details */}
      <Card>
        <CardHeader>
          <CardTitle>Practice Details</CardTitle>
          <CardDescription>
            Specialties you offer — clients use these to find you.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Contact & Location */}
      <Card>
        <CardHeader>
          <CardTitle>Contact &amp; Location</CardTitle>
          <CardDescription>
            Phone is for SMS booking notifications only — never shown publicly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone ?? ""}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                placeholder="+1 (555) 123-4567"
                autoComplete="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <TimezoneCombobox
                value={profile.timezone ?? ""}
                onChange={(v) => setProfile({ ...profile, timezone: v })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social / Live Streams */}
      <Card>
        <CardHeader>
          <CardTitle>Social &amp; Live Streams</CardTitle>
          <CardDescription>
            Link your YouTube channel or Facebook Live page — shown on your public profile so clients can tune in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="youtube_channel_id">YouTube Channel ID</Label>
              <Input
                id="youtube_channel_id"
                value={profile.youtube_channel_id ?? ""}
                onChange={(e) =>
                  setProfile({ ...profile, youtube_channel_id: e.target.value })
                }
                placeholder="UCxxxxxxxxxxxxxxxx"
              />
              <p className="text-xs text-muted-foreground">
                Your channel ID (starts with UC…). Found in YouTube Studio &rarr; Settings &rarr; Channel &rarr; Advanced.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook_live_url">Facebook Live Page URL</Label>
              <Input
                id="facebook_live_url"
                type="url"
                value={profile.facebook_live_url ?? ""}
                onChange={(e) =>
                  setProfile({ ...profile, facebook_live_url: e.target.value })
                }
                placeholder="https://facebook.com/yourpage"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visibility */}
      <Card>
        <CardHeader>
          <CardTitle>Visibility</CardTitle>
          <CardDescription>
            Control what appears on your public profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="fixed bottom-6 right-6 shadow-xl lg:static lg:w-full lg:shadow-none">
        {saving ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Changes"
        )}
      </Button>

      <ConfirmDialog
        open={showAvatarConfirm}
        onOpenChange={setShowAvatarConfirm}
        title="Remove profile photo?"
        description="Are you sure you want to remove your profile photo? This will reset your avatar to show your initials."
        onConfirm={handleRemoveAvatar}
        confirmLabel="Remove"
      />

      <ConfirmDialog
        open={showCoverConfirm}
        onOpenChange={setShowCoverConfirm}
        title="Remove cover image?"
        description="Are you sure you want to remove your cover image? Your profile will show the default background."
        onConfirm={handleRemoveCover}
        confirmLabel="Remove"
      />
    </div>
  );
}
