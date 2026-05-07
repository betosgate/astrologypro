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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const RELATION_TYPES = [
  "Spouse / Partner",
  "Child",
  "Parent",
  "Sibling",
  "Friend",
  "Colleague",
  "Other",
] as const;

const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"] as const;

const RELATIONSHIP_STATUSES = [
  "Single",
  "In a relationship",
  "Engaged",
  "Married",
  "Separated",
  "Divorced",
  "Widowed",
  "Prefer not to say",
] as const;

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming",
] as const;

// ── Initial form state ────────────────────────────────────────────────────────

const INITIAL_FORM = {
  // Contact
  relation_type: "",
  firstname: "",
  lastname: "",
  email: "",
  phone: "",
  // Demographics
  gender: "",
  relationship_status: "",
  // Location
  state: "",
  city: "",
  zip: "",
  address: "",
  // Intake questionnaire
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
  additional_info: "",
  // Status
  status: "active",
};

type FormState = typeof INITIAL_FORM;

const INTAKE_FIELDS = [
  ["personality", "Personality"],
  ["strengths", "Strengths"],
  ["lifeAreasFulfilling", "Life Areas That Are Fulfilling"],
  ["lifeAreasImprovement", "Life Areas for Improvement"],
  ["longTermGoals", "Long-Term Goals"],
  ["majorLifeEvents", "Major Life Events"],
  ["relationship_with_family", "Relationship with Family"],
  ["biggest_current_challenges", "Biggest Current Challenges"],
  ["mainConcern", "Main Concern"],
  ["additionalInfo", "Additional Info"],
  ["achieveFromReading", "What They Hope to Achieve from Reading"],
  ["focus_on_specific_relationships", "Focus on Specific Relationships"],
  ["stressManagement", "Stress Management"],
  ["workLifeBalance", "Work-Life Balance"],
  ["concerns_about_romantic_life", "Concerns About Romantic Life"],
  ["social_life_fulfillment", "Social Life Fulfillment"],
  ["spiritualPractices", "Spiritual Practices"],
  ["guidance_on_specific_decision", "Guidance on a Specific Decision"],
  ["ongoing_projects_or_plans", "Ongoing Projects or Plans"],
  ["selfDiscovery", "Self-Discovery"],
  ["externalInfluences", "External Influences"],
  ["specificQuestions", "Specific Questions"],
  ["goalsOutcomes", "Goals & Outcomes"],
  ["additional_info", "Additional Notes"],
] as [keyof FormState, string][];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddMemberPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ ...INITIAL_FORM });
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleReset() {
    setForm({ ...INITIAL_FORM });
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.firstname.trim()) {
      setError("First Name is required.");
      return;
    }
    if (!form.lastname.trim()) {
      setError("Last Name is required.");
      return;
    }
    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/community/members/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add member.");
        return;
      }
      router.push("/community");
    } catch {
      setError("Unexpected error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/community">
            <ArrowLeft className="mr-1.5 size-4" />
            Dashboard
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Add Perennial Mandalism Member</h1>
          <p className="text-sm text-muted-foreground">
            Fill in the member details and intake information below.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>

        {/* ── Contact Info ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="relation_type">Relation Type</Label>
                <Select value={form.relation_type} onValueChange={(v) => set("relation_type", v)}>
                  <SelectTrigger id="relation_type">
                    <SelectValue placeholder="Select relation" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATION_TYPES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstname">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstname"
                  value={form.firstname}
                  onChange={(e) => set("firstname", e.target.value)}
                  placeholder="First name"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastname">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastname"
                  value={form.lastname}
                  onChange={(e) => set("lastname", e.target.value)}
                  placeholder="Last name"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Demographics ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Demographics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="gender">Gender</Label>
                <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="relationship_status">Relationship Status</Label>
                <Select
                  value={form.relationship_status}
                  onValueChange={(v) => set("relationship_status", v)}
                >
                  <SelectTrigger id="relationship_status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Location ──────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Street address"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state">State</Label>
                <Select value={form.state} onValueChange={(v) => set("state", v)}>
                  <SelectTrigger id="state">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zip">ZIP</Label>
                <Input
                  id="zip"
                  value={form.zip}
                  onChange={(e) => set("zip", e.target.value)}
                  placeholder="00000"
                  maxLength={10}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Intake Questionnaire ──────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <button
              type="button"
              className="flex w-full items-center justify-between text-left"
              onClick={() => setShowQuestionnaire((open) => !open)}
            >
              <CardTitle className="text-base">Intake Questionnaire</CardTitle>
              {showQuestionnaire ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
          </CardHeader>
          {showQuestionnaire && (
            <CardContent>
              <div className="grid gap-4 pb-6 sm:grid-cols-2">
                {INTAKE_FIELDS.map(([field, label]) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field} className="text-sm">{label}</Label>
                    <Textarea
                      id={field}
                      value={form[field]}
                      onChange={(e) => set(field, e.target.value)}
                      rows={1}
                      className="min-h-[52px] resize-none"
                      placeholder={`Enter ${label.toLowerCase()}...`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* ── Status ────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Membership Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 pb-8">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Submit
          </Button>
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button type="button" variant="ghost" asChild>
            <Link href="/community">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
