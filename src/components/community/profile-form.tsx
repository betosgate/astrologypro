"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Loader2,
  Save,
  ChevronDown,
  ChevronUp,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { ProfileCompletionBar } from "@/components/ui/profile-completion-bar";
import {
  calculateProfileCompletion,
  getCommunityProfileFields,
} from "@/lib/profile-completion";
import {
  BirthCityAutocomplete,
  extractCountryFromCityLabel,
} from "@/components/community/birth-city-autocomplete";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

interface CommunityMember {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  birth_time: string | null;
  birth_city: string | null;
  // Required by the shared Horoscope Toolkit (`/community/horoscope`).
  // Loaded/persisted via `community_members.birth_country`. See
  // `tasks/22.04.2026/community-horoscope-birth-country`.
  birth_country: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  relationship_status: string | null;
  intake_data: Record<string, string> | null;
  membership_type: string;
  membership_status: string;
  joined_at: string;
  expires_at: string | null;
  current_period_end?: string | null;
  last_payment_date?: string | null;
}

interface CommunityProfileFormProps {
  member: CommunityMember;
  userId?: string;
  initialAvatarUrl?: string | null;
}

export function CommunityProfileForm({
  member,
  initialAvatarUrl = null,
}: CommunityProfileFormProps) {
  const router = useRouter();
  const intake = member.intake_data ?? {};

  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [firstName, setFirstName] = useState(member.first_name ?? "");
  const [lastName, setLastName] = useState(member.last_name ?? "");
  const [phone, setPhone] = useState(member.phone ?? "");
  const [gender, setGender] = useState(member.gender ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(member.date_of_birth ?? "");
  const [birthTime, setBirthTime] = useState(member.birth_time ?? "");
  const [birthCity, setBirthCity] = useState(member.birth_city ?? "");
  const [birthCountry, setBirthCountry] = useState(member.birth_country ?? "");
  const [address, setAddress] = useState(member.address ?? "");
  const [city, setCity] = useState(member.city ?? "");
  const [state, setState] = useState(member.state ?? "");
  const [zip, setZip] = useState(member.zip ?? "");
  const [relationshipStatus, setRelationshipStatus] = useState(
    member.relationship_status ?? ""
  );
  const [occupation, setOccupation] = useState(intake.occupation ?? "");

  // Questionnaire fields from intake_data
  const [personality, setPersonality] = useState(intake.personality ?? "");
  const [strengths, setStrengths] = useState(intake.strengths ?? "");
  const [lifeAreasFulfilling, setLifeAreasFulfilling] = useState(intake.lifeAreasFulfilling ?? "");
  const [lifeAreasImprovement, setLifeAreasImprovement] = useState(intake.lifeAreasImprovement ?? "");
  const [longTermGoals, setLongTermGoals] = useState(intake.longTermGoals ?? "");
  const [majorLifeEvents, setMajorLifeEvents] = useState(intake.majorLifeEvents ?? "");
  const [mainConcern, setMainConcern] = useState(intake.mainConcern ?? "");
  const [additionalInfo, setAdditionalInfo] = useState(intake.additionalInfo ?? "");

  const [saving, setSaving] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  const programName =
    member.membership_type === "mystery_school"
      ? "Mystery School"
      : "Perennial Mandalism";

  // Derived from the single source of truth in lib/profile-completion.ts so
  // any new profile field only needs to be declared in one place.
  const completion = calculateProfileCompletion(
    getCommunityProfileFields({
      firstName,
      lastName,
      phone,
      gender,
      dateOfBirth,
      birthTime,
      birthCity,
      birthCountry,
      address,
      city,
      state,
      zip,
      occupation,
    })
  );

  function focusField(fieldKey: string) {
    document.getElementById(fieldKey)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  async function handleAvatarUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    // Reset the input so the same file can be re-selected after an error.
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be under 2 MB.");
      return;
    }

    setUploadingAvatar(true);
    try {
      // 1. Upload the file to storage (reuses the existing avatar route).
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");

      const uploadRes = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json().catch(() => ({}));

      if (!uploadRes.ok) {
        toast.error(
          `Failed to upload photo: ${uploadData.error ?? "Unknown error"}`
        );
        return;
      }

      const publicUrl: string | undefined = uploadData.publicUrl;
      if (!publicUrl) {
        toast.error("Upload did not return a public URL.");
        return;
      }

      // 2. Persist the URL on user_metadata.avatar_url — this is what
      //    Journey Progress reads to flip the milestone to complete.
      const persistRes = await fetch("/api/community/profile/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: publicUrl }),
      });

      if (!persistRes.ok) {
        const data = await persistRes.json().catch(() => ({}));
        toast.error(
          data.error ?? "Failed to save photo. Please try again."
        );
        return;
      }

      // 3. Update local preview immediately and refresh server state so
      //    other surfaces (e.g. /community Journey Progress) pick it up.
      setAvatarUrl(publicUrl);
      toast.success("Profile photo updated.");
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred while uploading.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  const avatarInitials = (() => {
    const source = [firstName, lastName]
      .map((v) => v?.trim())
      .filter((v) => v && v.length > 0)
      .join(" ");
    const name = source || member.full_name || member.email || "";
    return name
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .join("")
      .toUpperCase()
      .slice(0, 2);
  })();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/community/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: member.email,
          phone: phone.trim(),
          gender,
          date_of_birth: dateOfBirth || null,
          birth_time: birthTime || null,
          birth_city: birthCity.trim() || null,
          // `/api/community/onboarding/complete` already accepts and persists
          // `birth_country` via `trimStr(birth_country)` — we just need to
          // send it. Empty string → null.
          birth_country: birthCountry.trim() || null,
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          zip: zip.trim(),
          occupation: occupation.trim(),
          relationship_status: relationshipStatus,
          personality,
          strengths,
          lifeAreasFulfilling,
          lifeAreasImprovement,
          longTermGoals,
          majorLifeEvents,
          mainConcern,
          additionalInfo,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.detail ?? "Failed to save profile.");
        return;
      }

      toast.success("Profile updated successfully.");
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <ProfileCompletionBar
        title="Profile Details"
        subtitle="Tracks your personal & birth data only. Charts, family, and account setup progress are shown on your dashboard as Journey Progress."
        percentage={completion.percentage}
        missingFields={completion.missingFields}
        completedCount={completion.completedCount}
        totalCount={completion.totalCount}
        onMissingFieldClick={focusField}
      />

      {/* Profile Photo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Photo</CardTitle>
          <CardDescription>
            Used across your community dashboard. Max 2 MB — JPEG, PNG, WebP, or GIF.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Avatar className="size-20">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="Profile photo" /> : null}
            <AvatarFallback className="text-lg">
              {avatarInitials || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <Label
              htmlFor="community-avatar-upload"
              className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                uploadingAvatar
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer hover:bg-muted"
              }`}
            >
              {uploadingAvatar ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {uploadingAvatar
                ? "Uploading..."
                : avatarUrl
                ? "Change Photo"
                : "Upload Photo"}
            </Label>
            <input
              id="community-avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
            />
            <p className="text-xs text-muted-foreground">
              {avatarUrl
                ? "Replace your current photo with a new one."
                : "Add a photo to complete your profile."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input
                id="community-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input
                id="community-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={member.email}
                readOnly
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                id="community-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger id="community-gender"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Non-binary">Non-binary</SelectItem>
                  <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Occupation</Label>
              <Input
                id="community-occupation"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Relationship Status</Label>
              <Select value={relationshipStatus} onValueChange={setRelationshipStatus}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single">Single</SelectItem>
                  <SelectItem value="In a relationship">In a relationship</SelectItem>
                  <SelectItem value="Married">Married</SelectItem>
                  <SelectItem value="Divorced">Divorced</SelectItem>
                  <SelectItem value="Widowed">Widowed</SelectItem>
                  <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Birth Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Birth Data</CardTitle>
          <CardDescription>
            Date of Birth, Birth Time, Birth City, and Birth Country are all
            required to generate your natal chart on Horoscope.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                id="community-dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Birth Time</Label>
              <Input
                id="community-birth-time"
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Birth City</Label>
              <BirthCityAutocomplete
                id="community-birth-city"
                value={birthCity}
                onChange={(label) => {
                  setBirthCity(label);
                  // Prefill Birth Country from the city label ONLY when the
                  // Country field is currently empty. We never overwrite a
                  // value the user has already set — the user stays in
                  // control of the country string.
                  if (!birthCountry.trim()) {
                    const guessed = extractCountryFromCityLabel(label);
                    if (guessed) setBirthCountry(guessed);
                  }
                }}
                placeholder="e.g. New York, NY"
              />
            </div>
            <div className="space-y-2">
              <Label>Birth Country</Label>
              <Input
                id="community-birth-country"
                value={birthCountry}
                onChange={(e) => setBirthCountry(e.target.value)}
                placeholder="e.g. United States"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Street Address</Label>
            <Input
              id="community-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>City</Label>
              <Input id="community-city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input id="community-state" value={state} onChange={(e) => setState(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Zip Code</Label>
              <Input
                id="community-zip"
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                maxLength={5}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questionnaire (collapsible) */}
      <Card>
        <CardHeader>
          <button
            type="button"
            className="flex w-full items-center justify-between"
            onClick={() => setShowQuestionnaire(!showQuestionnaire)}
          >
            <CardTitle className="text-base">Spiritual Journey Questionnaire</CardTitle>
            {showQuestionnaire ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </CardHeader>
        {showQuestionnaire && (
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "What is your personality type?", value: personality, set: setPersonality },
                { label: "What are your key strengths?", value: strengths, set: setStrengths },
                { label: "Which life areas are most fulfilling?", value: lifeAreasFulfilling, set: setLifeAreasFulfilling },
                { label: "Which life areas need improvement?", value: lifeAreasImprovement, set: setLifeAreasImprovement },
                { label: "What are your long-term goals?", value: longTermGoals, set: setLongTermGoals },
                { label: "Any major life events recently?", value: majorLifeEvents, set: setMajorLifeEvents },
                { label: "What is your main concern?", value: mainConcern, set: setMainConcern },
                { label: "Anything else you'd like to share?", value: additionalInfo, set: setAdditionalInfo },
              ].map((field) => (
                <div key={field.label} className="space-y-2">
                  <Label className="text-sm">{field.label}</Label>
                  <Textarea
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                    rows={1}
                    className="resize-none min-h-[52px]"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Membership Info (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Membership</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Program</span>
            <Badge variant="secondary">{programName}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={member.membership_status === "active" ? "default" : "secondary"}>
              {member.membership_status}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Member Since</span>
            <span className="font-medium">
              {new Date(member.joined_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Payment</span>
            <span className="font-medium">
              {member.last_payment_date
                ? new Date(member.last_payment_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {member.membership_status === "cancelled" || member.membership_status === "canceled"
                ? "Cancelled On"
                : member.membership_status === "cancelling"
                ? "Access Until"
                : "Next Billing"}
            </span>
            <span className="font-medium">
              {(member.current_period_end || member.expires_at)
                ? new Date((member.current_period_end || member.expires_at)!).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                : "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <><Loader2 className="mr-2 size-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="mr-2 size-4" /> Save Changes</>
          )}
        </Button>
      </div>
    </form>
  );
}
