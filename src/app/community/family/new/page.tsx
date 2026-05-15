"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, AlertCircle, Loader2, ChevronDown, ChevronUp, Mail } from "lucide-react";
import { ProgressRing } from "@/components/community/progress-ring";
import { calcFamilyProfileCompletion } from "@/lib/community/family-profile-completion";
import {
  BirthCityAutocomplete,
  extractCountryFromCityLabel,
} from "@/components/community/birth-city-autocomplete";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RELATIONSHIPS = [
  "Spouse/Partner",
  "Child",
  "Parent",
  "Sibling",
  "Friend",
  "Other",
] as const;

// Previous country dropdown values kept for reference. The active UI uses a
// free-text country input because autocomplete can return labels outside this
// short fixed list.
// const COUNTRIES = [
//   "United States",
//   "United Kingdom",
//   "Canada",
//   "Australia",
//   "India",
//   "Mexico",
//   "Brazil",
//   "Germany",
//   "France",
//   "Spain",
//   "Italy",
//   "Portugal",
//   "Netherlands",
//   "Sweden",
//   "Norway",
//   "Japan",
//   "South Korea",
//   "China",
//   "South Africa",
//   "New Zealand",
//   "Other",
// ] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcAgeGroup(dob: string): { label: string; value: "adult" | "child" } | null {
  if (!dob) return null;
  const ageYears =
    (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000);
  return ageYears < 14
    ? { label: "Child (under 14)", value: "child" }
    : { label: "Adult (14+)", value: "adult" };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FamilyMemberNewPage() {
  const router = useRouter();

  // Form state
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [relationship, setRelationship] = useState("");
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
  const [birthTime, setBirthTime] = useState("");
  const [birthCity, setBirthCity] = useState("");
  const [birthCountry, setBirthCountry] = useState("");
  const [birthLat, setBirthLat] = useState("");
  const [birthLng, setBirthLng] = useState("");
  const [notes, setNotes] = useState("");

  // Invite section
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Live completion preview (no natal_chart since member isn't created yet)
  // ---------------------------------------------------------------------------
  const completion = calcFamilyProfileCompletion({
    full_name: fullName,
    date_of_birth: dateOfBirth,
    birth_time: birthTimeUnknown ? "unknown" : birthTime,
    birth_time_unknown: birthTimeUnknown,
    birth_city: birthCity,
    birth_country: birthCountry,
    relationship,
    natal_chart: null, // always pending before submit
  });

  const ringColor =
    completion.percent >= 80
      ? "hsl(142, 71%, 45%)"
      : completion.percent >= 50
      ? "hsl(var(--primary))"
      : "hsl(25, 90%, 55%)";

  const ageGroupInfo = calcAgeGroup(dateOfBirth);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const body: Record<string, unknown> = {
      fullName,
      dateOfBirth,
      birthTime: birthTimeUnknown ? null : birthTime || null,
      birthCity: birthCity || null,
      birthCountry: birthCountry || null,
      relationship: relationship || null,
      notes: notes || null,
      birthLat: birthLat || null,
      birthLng: birthLng || null,
    };

    const res = await fetch("/api/community/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to add family member");
      setSaving(false);
      return;
    }

    const newId = data.member?.id as string | undefined;

    // If invite email provided and we have the new member id, send the invite
    if (inviteEmail && newId) {
      await fetch(`/api/community/family/${newId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
    }

    router.push(newId ? `/community/family/${newId}` : "/community/family");
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/community/family">
            <ArrowLeft className="mr-1.5 size-4" />
            Family
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Add Family Member</h1>
          <p className="text-sm text-muted-foreground">
            Enter birth details for accurate natal chart generation.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Profile Completion Ring ─────────────────────────────────────── */}
        <Card>
          <CardContent className="flex items-center gap-5 py-4">
            <ProgressRing
              percentage={completion.percent}
              size={72}
              strokeWidth={7}
              color={ringColor}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                Profile {completion.percent}% complete
              </p>
              {completion.missing.length > 0 ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Missing:{" "}
                  {completion.missing
                    .filter((m) => m !== "Natal chart generated")
                    .join(", ")}
                  {completion.missing.includes("Natal chart generated") && (
                    <span className="text-amber-600">
                      {completion.missing.filter(
                        (m) => m !== "Natal chart generated"
                      ).length > 0
                        ? " · "
                        : ""}
                      Natal chart pending until submitted
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-xs text-green-600 mt-0.5">
                  All fields filled — generate chart after saving
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Required Fields ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="relationship">
                  Relationship <span className="text-destructive">*</span>
                </Label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger id="relationship" className="w-full">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIPS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dateOfBirth">
                  Date of Birth <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dateOfBirth"
                  required
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
                {ageGroupInfo && (
                  <p className="text-xs text-muted-foreground">
                    Age group:{" "}
                    <span className="font-medium">{ageGroupInfo.label}</span>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Astro Details ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Astro Details</CardTitle>
            <CardDescription className="text-xs">
              Used to generate accurate natal charts. The more you fill in, the
              more accurate the reading.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Birth Time */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="birthTime">Birth Time</Label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={birthTimeUnknown}
                    onChange={(e) => {
                      setBirthTimeUnknown(e.target.checked);
                      if (e.target.checked) setBirthTime("");
                    }}
                  />
                  <span className="text-xs text-muted-foreground">Unknown</span>
                </label>
              </div>
              <Input
                id="birthTime"
                type="time"
                value={birthTime}
                disabled={birthTimeUnknown}
                onChange={(e) => setBirthTime(e.target.value)}
                className={birthTimeUnknown ? "opacity-50 cursor-not-allowed" : ""}
              />
              {!birthTime && !birthTimeUnknown && (
                <p className="text-xs text-amber-600">
                  Add birth time for greater chart accuracy (ascendant &amp;
                  house positions require it).
                </p>
              )}
            </div>

            {/* Birth City / Country */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="birthCity">Birth City</Label>
                <BirthCityAutocomplete
                  id="birthCity"
                  value={birthCity}
                  onChange={(label, option) => {
                    setBirthCity(label);
                    if (!option) return;
                    setBirthLat(String(option.lat));
                    setBirthLng(String(option.lng));
                    const country = extractCountryFromCityLabel(option.label);
                    if (country) setBirthCountry(country);
                  }}
                  placeholder="City"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="birthCountry">Birth Country</Label>
                {/* Previous dropdown kept for reference.
                <Select value={birthCountry} onValueChange={setBirthCountry}>
                  <SelectTrigger id="birthCountry">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                */}
                <Input
                  id="birthCountry"
                  value={birthCountry}
                  onChange={(e) => setBirthCountry(e.target.value)}
                  placeholder="Country"
                />
                {!birthCountry && birthCity && (
                  <p className="text-xs text-amber-600">
                    Add birth country so the family profile can be marked complete.
                  </p>
                )}
              </div>
            </div>

            {/* Lat / Lng */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="birthLat">
                  Birth Latitude{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    (auto-fill available)
                  </span>
                </Label>
                <Input
                  id="birthLat"
                  value={birthLat}
                  onChange={(e) => setBirthLat(e.target.value)}
                  placeholder="Auto-filled from city"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="birthLng">
                  Birth Longitude{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    (auto-fill available)
                  </span>
                </Label>
                <Input
                  id="birthLng"
                  value={birthLng}
                  onChange={(e) => setBirthLng(e.target.value)}
                  placeholder="Auto-filled from city"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Optional ─────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Optional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="notes">Notes</Label>
                <span className="text-xs text-muted-foreground">
                  {notes.length}/500
                </span>
              </div>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) =>
                  setNotes(e.target.value.slice(0, 500))
                }
                placeholder="Any additional notes about this family member (optional)"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Invite to Login (collapsible) ─────────────────────────────── */}
        <Card>
          <button
            type="button"
            onClick={() => setShowInvite((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                Invite this member to log in
              </span>
              <span className="text-xs text-muted-foreground">(optional)</span>
            </div>
            {showInvite ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </button>
          {showInvite && (
            <CardContent className="border-t pt-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Send an invite so this family member can log in and view their
                own natal chart.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="inviteEmail">Email Address</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="family@example.com"
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Add Member
            {inviteEmail && " & Send Invite"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/community/family">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
