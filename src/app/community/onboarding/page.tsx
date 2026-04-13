"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";

// ─── Constants matching perennial-signup exactly ─────────────────────────

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

const TOTAL_STEPS = 3;

// Legacy phone formatter from perennial-signup (task 03)
function legacyFormatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// All 24 optional questionnaire textarea fields (matching perennial-signup)
const QUESTIONNAIRE_FIELDS: Array<[string, string]> = [
  ["personality", "Personality"],
  ["strengths", "Strengths"],
  ["lifeAreasFulfilling", "Life areas -- most fulfilling"],
  ["lifeAreasImprovement", "Life areas needing improvement"],
  ["longTermGoals", "Long-term goals"],
  ["majorLifeEvents", "Major life events"],
  ["stressManagement", "How you manage stress"],
  ["workLifeBalance", "Work / life balance"],
  ["relationship_with_family", "Relationship with family"],
  ["biggest_current_challenges", "Biggest current challenges"],
  ["focus_on_specific_relationships", "Focus on specific relationships"],
  ["guidance_on_specific_decision", "Guidance on a specific decision"],
  ["concerns_about_romantic_life", "Concerns about romantic life"],
  ["ongoing_projects_or_plans", "Ongoing projects or plans"],
  ["social_life_fulfillment", "Social life fulfillment"],
  ["spiritualPractices", "Current spiritual practices"],
  ["selfDiscovery", "Self-discovery focus"],
  ["externalInfluences", "External influences"],
  ["achieveFromReading", "What you hope to achieve from a reading"],
  ["specificQuestions", "Specific questions"],
  ["goalsOutcomes", "Desired outcomes"],
  ["practicalSpiritualPref", "Practical / spiritual preference"],
  ["mainConcern", "Main concern"],
  ["additionalInfo", "Anything else you'd like to share"],
];

// ─── Form state (mirrors MemberForm from perennial-signup) ───────────────

interface ProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  state: string;
  city: string;
  zip: string;
  address: string;
  occupation: string;
  dateOfBirth: string;
  birthTime: string;
  // Optional questionnaire (25 fields: relationship_status + 24 textareas)
  relationship_status: string;
  personality: string;
  strengths: string;
  lifeAreasFulfilling: string;
  lifeAreasImprovement: string;
  longTermGoals: string;
  majorLifeEvents: string;
  stressManagement: string;
  workLifeBalance: string;
  relationship_with_family: string;
  biggest_current_challenges: string;
  focus_on_specific_relationships: string;
  guidance_on_specific_decision: string;
  concerns_about_romantic_life: string;
  ongoing_projects_or_plans: string;
  social_life_fulfillment: string;
  spiritualPractices: string;
  selfDiscovery: string;
  externalInfluences: string;
  achieveFromReading: string;
  specificQuestions: string;
  goalsOutcomes: string;
  practicalSpiritualPref: string;
  mainConcern: string;
  additionalInfo: string;
}

function emptyForm(): ProfileForm {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    state: "",
    city: "",
    zip: "",
    address: "",
    occupation: "",
    dateOfBirth: "",
    birthTime: "",
    relationship_status: "",
    personality: "",
    strengths: "",
    lifeAreasFulfilling: "",
    lifeAreasImprovement: "",
    longTermGoals: "",
    majorLifeEvents: "",
    stressManagement: "",
    workLifeBalance: "",
    relationship_with_family: "",
    biggest_current_challenges: "",
    focus_on_specific_relationships: "",
    guidance_on_specific_decision: "",
    concerns_about_romantic_life: "",
    ongoing_projects_or_plans: "",
    social_life_fulfillment: "",
    spiritualPractices: "",
    selfDiscovery: "",
    externalInfluences: "",
    achieveFromReading: "",
    specificQuestions: "",
    goalsOutcomes: "",
    practicalSpiritualPref: "",
    mainConcern: "",
    additionalInfo: "",
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [questionnaireOpen, setQuestionnaireOpen] = useState(false);

  const [form, setForm] = useState<ProfileForm>(emptyForm());

  function patch(fields: Partial<ProfileForm>) {
    setForm((prev) => ({ ...prev, ...fields }));
  }

  // ── Pre-fill from existing member data ──────────────────────────────────
  useEffect(() => {
    async function loadPrefill() {
      try {
        const res = await fetch("/api/community/onboarding/prefill");
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const { member } = await res.json();
        if (!member) {
          setLoading(false);
          return;
        }

        // intake_data may contain fields that were set during provisioning
        // but don't have dedicated columns on community_members
        const intake =
          member.intake_data && typeof member.intake_data === "object"
            ? member.intake_data
            : {};

        patch({
          firstName: member.first_name || intake.first_name || "",
          lastName: member.last_name || intake.last_name || "",
          email: member.email || "",
          phone: member.phone || intake.phone || "",
          gender: member.gender || intake.gender || "",
          state: member.state || intake.state || "",
          city: member.city || intake.city || "",
          zip: member.zip || intake.zip || "",
          address: member.address || intake.address || "",
          occupation: member.occupation || intake.occupation || "",
          dateOfBirth: member.date_of_birth || intake.date_of_birth || "",
          birthTime: member.birth_time || intake.birth_time || "",
          relationship_status:
            member.relationship_status || intake.relationship_status || "",
          personality: intake.personality || "",
          strengths: intake.strengths || "",
          lifeAreasFulfilling: intake.lifeAreasFulfilling || "",
          lifeAreasImprovement: intake.lifeAreasImprovement || "",
          longTermGoals: intake.longTermGoals || "",
          majorLifeEvents: intake.majorLifeEvents || "",
          stressManagement: intake.stressManagement || "",
          workLifeBalance: intake.workLifeBalance || "",
          relationship_with_family: intake.relationship_with_family || "",
          biggest_current_challenges: intake.biggest_current_challenges || "",
          focus_on_specific_relationships:
            intake.focus_on_specific_relationships || "",
          guidance_on_specific_decision:
            intake.guidance_on_specific_decision || "",
          concerns_about_romantic_life:
            intake.concerns_about_romantic_life || "",
          ongoing_projects_or_plans: intake.ongoing_projects_or_plans || "",
          social_life_fulfillment: intake.social_life_fulfillment || "",
          spiritualPractices: intake.spiritualPractices || "",
          selfDiscovery: intake.selfDiscovery || "",
          externalInfluences: intake.externalInfluences || "",
          achieveFromReading: intake.achieveFromReading || "",
          specificQuestions: intake.specificQuestions || "",
          goalsOutcomes: intake.goalsOutcomes || "",
          practicalSpiritualPref: intake.practicalSpiritualPref || "",
          mainConcern: intake.mainConcern || "",
          additionalInfo: intake.additionalInfo || "",
        });
      } catch {
        // Silently continue with empty form if prefill fails
      } finally {
        setLoading(false);
      }
    }
    loadPrefill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Validation (matches perennial-signup required fields) ───────────────

  function validate(): { message: string; step: number } | null {
    if (!form.firstName.trim()) {
      return { message: "First name is required.", step: 1 };
    }
    if (!form.lastName.trim()) {
      return { message: "Last name is required.", step: 1 };
    }
    const emailVal = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      return { message: "A valid email is required.", step: 1 };
    }
    if (form.phone.replace(/\D/g, "").length !== 10) {
      return { message: "Phone must be a 10-digit number.", step: 1 };
    }
    if (!form.gender) {
      return { message: "Gender is required.", step: 1 };
    }
    if (!form.state.trim()) {
      return { message: "State is required.", step: 2 };
    }
    if (!form.city.trim()) {
      return { message: "City is required.", step: 2 };
    }
    if (!/^\d{5}$/.test(form.zip.trim())) {
      return { message: "Zip must be exactly 5 digits.", step: 2 };
    }
    if (!form.address.trim()) {
      return { message: "Address is required.", step: 2 };
    }
    if (!form.occupation.trim()) {
      return { message: "Occupation is required.", step: 2 };
    }
    if (!form.dateOfBirth) {
      return { message: "Date of birth is required.", step: 1 };
    }
    if (!form.birthTime) {
      return { message: "Birth time is required.", step: 1 };
    }
    return null;
  }

  function handleNext() {
    setError("");
    // Validate fields relevant to current step before proceeding
    if (step === 1) {
      if (!form.firstName.trim()) {
        setError("First name is required.");
        return;
      }
      if (!form.lastName.trim()) {
        setError("Last name is required.");
        return;
      }
      if (form.phone && form.phone.replace(/\D/g, "").length !== 10) {
        setError("Phone must be a 10-digit number.");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function handleBack() {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit() {
    setError("");
    const failure = validate();
    if (failure) {
      setError(failure.message);
      setStep(failure.step);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/community/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone,
          gender: form.gender,
          state: form.state.trim(),
          city: form.city.trim(),
          zip: form.zip.trim(),
          address: form.address.trim(),
          occupation: form.occupation.trim(),
          date_of_birth: form.dateOfBirth,
          birth_time: form.birthTime,
          relationship_status: form.relationship_status || null,
          // Full optional questionnaire (24 fields)
          personality: form.personality.trim() || null,
          strengths: form.strengths.trim() || null,
          lifeAreasFulfilling: form.lifeAreasFulfilling.trim() || null,
          lifeAreasImprovement: form.lifeAreasImprovement.trim() || null,
          longTermGoals: form.longTermGoals.trim() || null,
          majorLifeEvents: form.majorLifeEvents.trim() || null,
          stressManagement: form.stressManagement.trim() || null,
          workLifeBalance: form.workLifeBalance.trim() || null,
          relationship_with_family:
            form.relationship_with_family.trim() || null,
          biggest_current_challenges:
            form.biggest_current_challenges.trim() || null,
          focus_on_specific_relationships:
            form.focus_on_specific_relationships.trim() || null,
          guidance_on_specific_decision:
            form.guidance_on_specific_decision.trim() || null,
          concerns_about_romantic_life:
            form.concerns_about_romantic_life.trim() || null,
          ongoing_projects_or_plans:
            form.ongoing_projects_or_plans.trim() || null,
          social_life_fulfillment:
            form.social_life_fulfillment.trim() || null,
          spiritualPractices: form.spiritualPractices.trim() || null,
          selfDiscovery: form.selfDiscovery.trim() || null,
          externalInfluences: form.externalInfluences.trim() || null,
          achieveFromReading: form.achieveFromReading.trim() || null,
          specificQuestions: form.specificQuestions.trim() || null,
          goalsOutcomes: form.goalsOutcomes.trim() || null,
          practicalSpiritualPref: form.practicalSpiritualPref.trim() || null,
          mainConcern: form.mainConcern.trim() || null,
          additionalInfo: form.additionalInfo.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      router.push("/community");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome to Perennial Mandalism
        </h1>
        <p className="mt-1 text-muted-foreground">
          Let&apos;s set up your profile so we can personalise your experience.
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const n = i + 1;
          const isActive = n === step;
          const isCompleted = n < step;
          return (
            <div key={n} className="flex items-center gap-2">
              <div
                className={`flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isActive
                      ? "border-2 border-primary text-primary"
                      : "border-2 border-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? <CheckCircle2 className="size-4" /> : n}
              </div>
              {n < TOTAL_STEPS && (
                <div
                  className={`h-0.5 w-8 transition-colors ${
                    isCompleted ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1 -- Personal Details + Contact */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
            <CardDescription>
              Tell us about yourself. Fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">
                  First name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => patch({ firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">
                  Last name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => patch({ lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Email + Phone */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => patch({ email: e.target.value })}
                  placeholder="member@example.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">
                  Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    patch({ phone: legacyFormatPhone(e.target.value) })
                  }
                  placeholder="(123) 456-7890"
                  required
                />
              </div>
            </div>

            {/* Gender + Occupation */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="gender">
                  Gender <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.gender}
                  onValueChange={(v) => patch({ gender: v })}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="occupation">
                  Occupation <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="occupation"
                  value={form.occupation}
                  onChange={(e) => patch({ occupation: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Date of birth + Birth time */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dateOfBirth">
                  Date of birth <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => patch({ dateOfBirth: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="birthTime">
                  Birth time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="birthTime"
                  type="time"
                  value={form.birthTime}
                  onChange={(e) => patch({ birthTime: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2 -- Address */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
            <CardDescription>
              Where are you based? This helps us tailor community content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="address">
                Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => patch({ address: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city">
                  City <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => patch({ city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state">
                  State <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="state"
                  value={form.state}
                  onChange={(e) => patch({ state: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zip">
                  Zip <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="zip"
                  inputMode="numeric"
                  maxLength={5}
                  value={form.zip}
                  onChange={(e) =>
                    patch({
                      zip: e.target.value.replace(/\D/g, "").slice(0, 5),
                    })
                  }
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3 -- Optional Questionnaire (all 25 fields) */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>About Your Journey</CardTitle>
            <CardDescription>
              Help us understand where you are so we can guide you better. All
              fields on this step are optional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Relationship status (select) */}
            <div className="space-y-1.5">
              <Label htmlFor="relationship_status">Relationship status</Label>
              <Select
                value={form.relationship_status}
                onValueChange={(v) => patch({ relationship_status: v })}
              >
                <SelectTrigger id="relationship_status">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_STATUSES.map((rs) => (
                    <SelectItem key={rs} value={rs}>
                      {rs}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Collapsible questionnaire (24 textarea fields) */}
            <button
              type="button"
              onClick={() => setQuestionnaireOpen(!questionnaireOpen)}
              className="flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors pt-2"
            >
              <span>Optional questionnaire (24 fields)</span>
              {questionnaireOpen ? (
                <ChevronUp className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
            </button>
            {questionnaireOpen && (
              <div className="space-y-3 border-t pt-3">
                {QUESTIONNAIRE_FIELDS.map(([key, label]) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={`q-${key}`}>{label}</Label>
                    <Textarea
                      id={`q-${key}`}
                      rows={2}
                      value={(form as unknown as Record<string, string>)[key] ?? ""}
                      onChange={(e) =>
                        patch({
                          [key]: e.target.value,
                        } as Partial<ProfileForm>)
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-center text-sm text-amber-800">
          {error}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between">
        {step > 1 ? (
          <Button type="button" variant="outline" onClick={handleBack}>
            <ChevronLeft className="mr-1 size-4" />
            Back
          </Button>
        ) : (
          <div />
        )}

        {step < TOTAL_STEPS ? (
          <Button type="button" onClick={handleNext}>
            Next
            <ChevronRight className="ml-1 size-4" />
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Complete Profile & Enter Community"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
