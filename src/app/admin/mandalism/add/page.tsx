"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];

const RELATION_TYPES = [
  "Self",
  "Spouse",
  "Partner",
  "Child",
  "Parent",
  "Sibling",
  "Friend",
  "Other",
];

const INITIAL_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  state: "",
  city: "",
  zip: "",
  address: "",
  gender: "",
  date_of_birth: "",
  birth_time: "",
  birth_city: "",
  relationship_status: "",
  relation_type: "",
  membership_type: "individual",
  notes: "",
  password: "",
  confirmpassword: "",
  // Questionnaire fields
  personality: "",
  strengths: "",
  lifeAreasFulfilling: "",
  lifeAreasImprovement: "",
  longTermGoals: "",
  majorLifeEvents: "",
  relationship_with_family: "",
  biggest_current_challenges: "",
  mainConcern: "",
  additionalInfo: "",
  achieveFromReading: "",
  additional_info: "",
  focus_on_specific_relationships: "",
  stressManagement: "",
  workLifeBalance: "",
  concerns_about_romantic_life: "",
  social_life_fulfillment: "",
  spiritualPractices: "",
  guidance_on_specific_decision: "",
  ongoing_projects_or_plans: "",
  selfDiscovery: "",
  externalInfluences: "",
  specificQuestions: "",
  goalsOutcomes: "",
};

export default function AddMemberPage() {
  const router = useRouter();
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleReset() {
    setForm({ ...INITIAL_FORM });
    setError(null);
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Client-side validation
    if (!form.first_name.trim()) {
      setError("First name is required");
      return;
    }
    if (!form.last_name.trim()) {
      setError("Last name is required");
      return;
    }
    if (!form.email.trim()) {
      setError("Email is required");
      return;
    }
    if (form.password && form.password !== form.confirmpassword) {
      setError("Passwords do not match");
      return;
    }

    setSaving(true);

    const res = await fetch("/api/admin/mandalism/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to create member");
      setSaving(false);
      return;
    }

    setSaving(false);
    setSuccess(true);
    setTimeout(() => {
      router.push("/admin/mandalism");
    }, 1500);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/mandalism"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Mandalism
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Add Perennial Mandalism Member
        </h1>
        <p className="text-muted-foreground">
          Create a new member with the full profile and intake questionnaire.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
                placeholder="Last name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="member@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Street address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                placeholder="State"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">Zip Code</Label>
              <Input
                id="zip"
                value={form.zip}
                onChange={(e) => set("zip", e.target.value)}
                placeholder="Zip code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={form.gender || "none"}
                onValueChange={(value) => set("gender", value === "none" ? "" : value)}
              >
                <SelectTrigger id="gender" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="none">Select...</SelectItem>
                  {GENDER_OPTIONS.map((gender) => (
                    <SelectItem key={gender} value={gender.toLowerCase()}>
                      {gender}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Birth Information */}
        <Card>
          <CardHeader>
            <CardTitle>Birth Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={form.date_of_birth}
                onChange={(e) => set("date_of_birth", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_time">Birth Time</Label>
              <Input
                id="birth_time"
                type="time"
                value={form.birth_time}
                onChange={(e) => set("birth_time", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_city">Birth City</Label>
              <Input
                id="birth_city"
                value={form.birth_city}
                onChange={(e) => set("birth_city", e.target.value)}
                placeholder="City of birth"
              />
            </div>
          </CardContent>
        </Card>

        {/* Membership Details */}
        <Card>
          <CardHeader>
            <CardTitle>Membership Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="membership_type">Membership Type</Label>
              <Select
                value={form.membership_type}
                onValueChange={(value) => set("membership_type", value)}
              >
                <SelectTrigger id="membership_type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="relation_type">Relation Type</Label>
              <Select
                value={form.relation_type || "none"}
                onValueChange={(value) => set("relation_type", value === "none" ? "" : value)}
              >
                <SelectTrigger id="relation_type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="none">Select...</SelectItem>
                  {RELATION_TYPES.map((relation) => (
                    <SelectItem key={relation} value={relation.toLowerCase()}>
                      {relation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationship_status">Relationship Status</Label>
              <Select
                value={form.relationship_status || "none"}
                onValueChange={(value) =>
                  set("relationship_status", value === "none" ? "" : value)
                }
              >
                <SelectTrigger id="relationship_status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="none">Select...</SelectItem>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                  <SelectItem value="in_relationship">In a Relationship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Admin notes about this member"
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Credentials */}
        <Card>
          <CardHeader>
            <CardTitle>Account Credentials (optional)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Leave blank for invite-only"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmpassword">Confirm Password</Label>
              <Input
                id="confirmpassword"
                type="password"
                value={form.confirmpassword}
                onChange={(e) => set("confirmpassword", e.target.value)}
                placeholder="Confirm password"
              />
            </div>
          </CardContent>
        </Card>

        {/* Intake Questionnaire */}
        <Card>
          <CardHeader>
            <CardTitle>Intake Questionnaire</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {[
              { key: "personality", label: "Personality" },
              { key: "strengths", label: "Strengths" },
              { key: "lifeAreasFulfilling", label: "Fulfilling Life Areas" },
              { key: "lifeAreasImprovement", label: "Life Areas for Improvement" },
              { key: "longTermGoals", label: "Long Term Goals" },
              { key: "majorLifeEvents", label: "Major Life Events" },
              { key: "relationship_with_family", label: "Relationship with Family" },
              { key: "biggest_current_challenges", label: "Biggest Current Challenges" },
              { key: "mainConcern", label: "Main Concern" },
              { key: "achieveFromReading", label: "What to Achieve from Reading" },
              { key: "focus_on_specific_relationships", label: "Focus on Specific Relationships" },
              { key: "stressManagement", label: "Stress Management" },
              { key: "workLifeBalance", label: "Work-Life Balance" },
              { key: "concerns_about_romantic_life", label: "Concerns about Romantic Life" },
              { key: "social_life_fulfillment", label: "Social Life Fulfillment" },
              { key: "spiritualPractices", label: "Spiritual Practices" },
              { key: "guidance_on_specific_decision", label: "Guidance on Specific Decision" },
              { key: "ongoing_projects_or_plans", label: "Ongoing Projects or Plans" },
              { key: "selfDiscovery", label: "Self Discovery" },
              { key: "externalInfluences", label: "External Influences" },
              { key: "specificQuestions", label: "Specific Questions" },
              { key: "goalsOutcomes", label: "Goals and Outcomes" },
              { key: "additionalInfo", label: "Additional Info" },
              { key: "additional_info", label: "Other Notes" },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="text-sm">{label}</Label>
                <Textarea
                  id={key}
                  rows={1}
                  className="resize-none min-h-[52px]"
                  value={(form as Record<string, string>)[key] ?? ""}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={label}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Error / Success */}
        {error && (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-600 dark:bg-green-950/30 dark:text-green-400">
            Member created successfully! Redirecting...
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving || success}>
            {saving ? "Creating..." : "Submit"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={saving}
          >
            Reset
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/admin/mandalism")}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
