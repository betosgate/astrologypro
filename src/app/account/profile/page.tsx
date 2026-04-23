"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Save, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ALLOWED_SPECIALTIES = [
  "Astrology",
  "Tarot",
  "Numerology",
  "Human Design",
  "Oracle Cards",
  "Palmistry",
  "Runes",
  "Crystal Healing",
];

const ROLE_LABELS: Record<string, string> = {
  diviner: "Diviner",
  trainee: "Trainee",
  client: "Client",
  advocate: "Advocate",
  community: "PM Member",
};

const TIMEZONE_OPTIONS = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Phoenix",
  "America/Indiana/Indianapolis",
  "America/Puerto_Rico",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

interface ProfileData {
  roles: string[];
  display_name: string;
  bio: string;
  avatar_url: string;
  specialties: string[];
  phone: string;
  timezone: string;
  birth_date: string | null;
  birth_time: string | null;
  birth_city: string | null;
  email: string;
}

export default function UnifiedProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAvatarConfirm, setShowAvatarConfirm] = useState(false);

  const [roles, setRoles] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthCity, setBirthCity] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/account/profile");
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to load profile");
        }
        const data: ProfileData = await res.json();
        setRoles(data.roles);
        setEmail(data.email || "");
        setDisplayName(data.display_name || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url || "");
        setSpecialties(data.specialties || []);
        setPhone(data.phone || "");
        setTimezone(data.timezone || "");
        setBirthDate(data.birth_date || "");
        setBirthTime(data.birth_time || "");
        setBirthCity(data.birth_city || "");
      } catch {
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [router]);

  function toggleSpecialty(specialty: string) {
    setSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    );
  }

  async function handleSave() {
    setError(null);
    setSuccess(false);

    if (!displayName.trim()) {
      setError("Display name is required.");
      return;
    }
    if (bio.length > 500) {
      setError("Bio must be 500 characters or fewer.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          bio,
          avatar_url: avatarUrl,
          specialties,
          phone,
          timezone,
          birth_date: birthDate || null,
          birth_time: birthTime || null,
          birth_city: birthCity || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save profile.");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File must be under 2MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");

      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setAvatarUrl(data.publicUrl);
      toast.success("Avatar uploaded. Don't forget to save changes!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveAvatar() {
    setAvatarUrl("");
    setShowAvatarConfirm(false);
    toast.success("Avatar URL cleared. Don't forget to save changes!");
  }

  // Determine which sections to show based on roles
  const hasDivinerOrTrainee = roles.includes("diviner") || roles.includes("trainee");
  const hasClientOrCommunity = roles.includes("client") || roles.includes("community");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/account">
            <ArrowLeft className="mr-1 size-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Profile</h1>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
      </div>

      {/* Role Badges */}
      {roles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <Badge key={role} variant="secondary">
                  {ROLE_LABELS[role] || role}
                </Badge>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Changes below will sync across all your role profiles.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Shared Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name *</Label>
            <Input
              id="display_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              Syncs to all role profiles (diviner, trainee, client, etc.)
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="avatar_url">Avatar URL</Label>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Avatar className="size-16 shadow-sm">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-lg">
                  {displayName
                    ? displayName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                    : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2 flex-1 w-full">
                <div className="flex gap-2 w-full">
                  <div className="relative flex-1">
                    <Input
                      id="avatar_url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="pr-10"
                    />
                    {uploading && (
                      <div className="absolute inset-y-0 right-3 flex items-center">
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Label
                      htmlFor="avatar-upload"
                      className="flex h-9 cursor-pointer items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      <Upload className="size-4" />
                      Upload
                    </Label>
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 text-destructive hover:bg-destructive/10"
                        onClick={() => setShowAvatarConfirm(true)}
                      >
                        <Trash2 className="size-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell clients about yourself..."
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {bio.length}/500 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select timezone...</option>
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Specialties — only for diviner/trainee */}
      {hasDivinerOrTrainee && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Specialties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ALLOWED_SPECIALTIES.map((s) => (
                <label
                  key={s}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={specialties.includes(s)}
                    onCheckedChange={() => toggleSpecialty(s)}
                  />
                  {s}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Birth Data — only for client/community */}
      {hasClientOrCommunity && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Birth Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Used for astrology chart calculations.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="birth_date">Birth Date</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_time">Birth Time</Label>
                <Input
                  id="birth_time"
                  type="time"
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_city">Birth City</Label>
                <Input
                  id="birth_city"
                  value={birthCity}
                  onChange={(e) => setBirthCity(e.target.value)}
                  placeholder="e.g. New York, NY"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Sync Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Sync Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            {roles.includes("diviner") && (
              <p>
                <Badge variant="outline" className="mr-2">Diviner</Badge>
                Name, bio, avatar, specialties, phone, timezone
              </p>
            )}
            {roles.includes("trainee") && (
              <p>
                <Badge variant="outline" className="mr-2">Trainee</Badge>
                Name, bio, avatar, specialties, phone, timezone
              </p>
            )}
            {roles.includes("client") && (
              <p>
                <Badge variant="outline" className="mr-2">Client</Badge>
                Name, birth date, birth time, birth city
              </p>
            )}
            {roles.includes("advocate") && (
              <p>
                <Badge variant="outline" className="mr-2">Advocate</Badge>
                Name
              </p>
            )}
            {roles.includes("community") && (
              <p>
                <Badge variant="outline" className="mr-2">PM Member</Badge>
                Name, phone, birth date, birth time, birth city
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error / Success Messages */}
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          Profile saved successfully. All role profiles have been synced.
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 size-4" />
              Save Profile
            </>
          )}
        </Button>
      </div>

      <ConfirmDialog
        open={showAvatarConfirm}
        onOpenChange={setShowAvatarConfirm}
        title="Remove avatar?"
        description="Are you sure you want to clear your avatar URL? This will remove your profile picture across all services."
        onConfirm={handleRemoveAvatar}
        confirmLabel="Remove"
      />
    </div>
  );
}
