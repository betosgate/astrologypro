"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
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
import { Loader2, Save, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

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
}

interface CommunityProfileFormProps {
  member: CommunityMember;
  userId?: string;
}

export function CommunityProfileForm({ member }: CommunityProfileFormProps) {
  const intake = member.intake_data ?? {};

  const [firstName, setFirstName] = useState(member.first_name ?? "");
  const [lastName, setLastName] = useState(member.last_name ?? "");
  const [phone, setPhone] = useState(member.phone ?? "");
  const [gender, setGender] = useState(member.gender ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(member.date_of_birth ?? "");
  const [birthTime, setBirthTime] = useState(member.birth_time ?? "");
  const [birthCity, setBirthCity] = useState(member.birth_city ?? "");
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
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input
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
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Birth Time</Label>
              <Input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Birth City</Label>
              <Input
                value={birthCity}
                onChange={(e) => setBirthCity(e.target.value)}
                placeholder="e.g. New York, NY"
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
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input value={state} onChange={(e) => setState(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Zip Code</Label>
              <Input
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
          <CardContent className="space-y-4">
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
                  rows={2}
                  className="resize-none"
                />
              </div>
            ))}
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
              {new Date(member.joined_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
          </div>
          {member.expires_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expires</span>
              <span className="font-medium">
                {new Date(member.expires_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>
            </div>
          )}
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
