"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { ProgressRing } from "@/components/community/progress-ring";
import { calcFamilyProfileCompletion } from "@/lib/community/family-profile-completion";
import {
  BirthCityAutocomplete,
  extractCountryFromCityLabel,
} from "@/components/community/birth-city-autocomplete";

// ---------------------------------------------------------------------------
// Constants (mirror from new/page.tsx)
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
// Component
// ---------------------------------------------------------------------------

export default function FamilyMemberEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // Loaded state
  const [loadingMember, setLoadingMember] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Load existing member
  // ---------------------------------------------------------------------------
  const loadMember = useCallback(async () => {
    const res = await fetch("/api/community/family");
    if (!res.ok) {
      setNotFound(true);
      setLoadingMember(false);
      return;
    }
    const data = await res.json();
    type RawMember = {
      id: string;
      full_name: string;
      date_of_birth: string;
      birth_time: string | null;
      birth_city: string | null;
      birth_country: string | null;
      birth_lat?: number | null;
      birth_lng?: number | null;
      relationship: string | null;
      notes: string | null;
    };
    const found = (data.members ?? []).find((m: RawMember) => m.id === id) as RawMember | undefined;
    if (!found) {
      setNotFound(true);
      setLoadingMember(false);
      return;
    }

    setFullName(found.full_name);
    setDateOfBirth(found.date_of_birth);
    setRelationship(found.relationship ?? "");
    if (found.birth_time) {
      setBirthTime(found.birth_time);
      setBirthTimeUnknown(false);
    } else {
      setBirthTimeUnknown(true);
    }
    setBirthCity(found.birth_city ?? "");
    setBirthCountry(found.birth_country ?? "");
    setBirthLat(found.birth_lat == null ? "" : String(found.birth_lat));
    setBirthLng(found.birth_lng == null ? "" : String(found.birth_lng));
    setNotes(found.notes ?? "");
    setLoadingMember(false);
  }, [id]);

  useEffect(() => {
    loadMember();
  }, [loadMember]);

  // ---------------------------------------------------------------------------
  // Live completion preview
  // ---------------------------------------------------------------------------
  const completion = calcFamilyProfileCompletion({
    full_name: fullName,
    date_of_birth: dateOfBirth,
    birth_time: birthTimeUnknown ? "unknown" : birthTime,
    birth_time_unknown: birthTimeUnknown,
    birth_city: birthCity,
    birth_country: birthCountry,
    relationship,
    natal_chart: null,
  });

  const ringColor =
    completion.percent >= 80
      ? "hsl(142, 71%, 45%)"
      : completion.percent >= 50
      ? "hsl(var(--primary))"
      : "hsl(25, 90%, 55%)";

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
    };
    if (birthLat.trim()) body.birthLat = birthLat.trim();
    if (birthLng.trim()) body.birthLng = birthLng.trim();

    const res = await fetch(`/api/community/family/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to save changes");
      setSaving(false);
      return;
    }

    router.push(`/community/family/${id}`);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loadingMember) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Family member not found.</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/community/family">
            <ArrowLeft className="mr-1.5 size-4" />
            Back to Family
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/community/family/${id}`}>
            <ArrowLeft className="mr-1.5 size-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Edit Family Member</h1>
          <p className="text-sm text-muted-foreground">
            Update birth details — chart will be invalidated if DOB or birth time changes.
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
              {completion.missing.length > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Missing:{" "}
                  {completion.missing
                    .filter((m) => m !== "Natal chart generated")
                    .join(", ")}
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
                <Label htmlFor="relationship">Relationship</Label>
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
                <p className="text-xs text-amber-600">
                  Changing DOB will invalidate the existing natal chart.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Astro Details ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Astro Details</CardTitle>
            <CardDescription className="text-xs">
              Changing birth time will invalidate the existing natal chart.
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
                <Label htmlFor="birthLat">Birth Latitude</Label>
                <Input
                  id="birthLat"
                  value={birthLat}
                  onChange={(e) => setBirthLat(e.target.value)}
                  placeholder="e.g. 40.7128"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="birthLng">Birth Longitude</Label>
                <Input
                  id="birthLng"
                  value={birthLng}
                  onChange={(e) => setBirthLng(e.target.value)}
                  placeholder="e.g. -74.0060"
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
                onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                placeholder="Any additional notes about this family member (optional)"
                rows={3}
              />
            </div>
          </CardContent>
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
            Save Changes
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/community/family/${id}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
