"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Plus,
  Trash2,
  Users,
  MapPin,
  Globe,
} from "lucide-react";
import { CitySearch } from "@/components/booking/city-search";

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

const PLAN_CONFIG: Record<
  string,
  { label: string; additionalMembers: number }
> = {
  plan_pm_individual: { label: "Individual Plan", additionalMembers: 0 },
  plan_pm_couple: { label: "Couple Plan", additionalMembers: 1 },
  plan_pm_family: { label: "Family Plan", additionalMembers: 4 },
};

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
  birthCity: string;
  birthCountry: string;
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

interface HouseholdMemberForm {
  id: string | null;
  fullName: string;
  relationship: string;
  dateOfBirth: string;
  birthTime: string;
  birthCity: string;
  birthCountry: string;
  notes: string;
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
    birthCity: "",
    birthCountry: "",
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

function createHouseholdMember(
  member?: Partial<HouseholdMemberForm>
): HouseholdMemberForm {
  return {
    id: member?.id ?? null,
    fullName: member?.fullName ?? "",
    relationship: member?.relationship ?? "",
    dateOfBirth: member?.dateOfBirth ?? "",
    birthTime: member?.birthTime ?? "",
    birthCity: member?.birthCity ?? "",
    birthCountry: member?.birthCountry ?? "",
    notes: member?.notes ?? "",
  };
}

function legacyFormatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

type PrefillResponse = {
  member?: {
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    gender?: string | null;
    state?: string | null;
    city?: string | null;
    zip?: string | null;
    address?: string | null;
    occupation?: string | null;
    date_of_birth?: string | null;
    birth_time?: string | null;
    birth_city?: string | null;
    birth_country?: string | null;
    relationship_status?: string | null;
    plan_type?: string | null;
    intake_data?: Record<string, unknown> | null;
  };
  family_members?: Array<{
    id: string;
    full_name: string | null;
    relationship: string | null;
    date_of_birth: string | null;
    birth_time: string | null;
    birth_city: string | null;
    birth_country: string | null;
    notes: string | null;
  }>;
};

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInvited = searchParams.get("invited") === "true";
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [questionnaireOpen, setQuestionnaireOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMemberForm[]>([]);
  const [form, setForm] = useState<ProfileForm>(emptyForm());

  const planConfig = selectedPlanId ? PLAN_CONFIG[selectedPlanId] : null;
  const maxAdditionalMembers = planConfig?.additionalMembers ?? 0;
  const householdStepEnabled = maxAdditionalMembers > 0;
  const totalSteps = householdStepEnabled ? 4 : 3;

  const stepTitles = useMemo(
    () => [
      "Personal",
      "Address",
      ...(householdStepEnabled ? ["Household"] : []),
      "Journey",
    ],
    [householdStepEnabled]
  );

  function patch(fields: Partial<ProfileForm>) {
    setForm((prev) => ({ ...prev, ...fields }));
  }

  function updateHouseholdMember(
    index: number,
    fields: Partial<HouseholdMemberForm>
  ) {
    setHouseholdMembers((prev) =>
      prev.map((member, memberIndex) =>
        memberIndex === index ? { ...member, ...fields } : member
      )
    );
  }

  function addHouseholdMember() {
    if (householdMembers.length >= maxAdditionalMembers) return;
    setHouseholdMembers((prev) => [...prev, createHouseholdMember()]);
  }

  function removeHouseholdMember(index: number) {
    setHouseholdMembers((prev) => prev.filter((_, memberIndex) => memberIndex !== index));
  }

  useEffect(() => {
    async function loadPrefill() {
      try {
        const res = await fetch("/api/community/onboarding/prefill");
        if (!res.ok) {
          setLoading(false);
          return;
        }

        const { member, family_members } = (await res.json()) as PrefillResponse;
        if (!member) {
          setLoading(false);
          return;
        }

        const intake =
          member.intake_data && typeof member.intake_data === "object"
            ? member.intake_data
            : {};
        const nextSelectedPlanId =
          typeof intake.selected_plan_id === "string"
            ? intake.selected_plan_id
            : member.plan_type === "family"
              ? "plan_pm_family"
              : null;
        const nextPlanConfig = nextSelectedPlanId
          ? PLAN_CONFIG[nextSelectedPlanId] ?? null
          : null;

        setSelectedPlanId(nextSelectedPlanId);
        patch({
          firstName: member.first_name || String(intake.first_name ?? "") || "",
          lastName: member.last_name || String(intake.last_name ?? "") || "",
          email: member.email || "",
          phone: member.phone || String(intake.phone ?? "") || "",
          gender: member.gender || String(intake.gender ?? "") || "",
          state: member.state || String(intake.state ?? "") || "",
          city: member.city || String(intake.city ?? "") || "",
          zip: member.zip || String(intake.zip ?? "") || "",
          address: member.address || String(intake.address ?? "") || "",
          occupation: member.occupation || String(intake.occupation ?? "") || "",
          dateOfBirth: member.date_of_birth || String(intake.date_of_birth ?? "") || "",
          birthTime: member.birth_time || String(intake.birth_time ?? "") || "",
          birthCity: member.birth_city || String(intake.birth_city ?? "") || "",
          birthCountry: member.birth_country || String(intake.birth_country ?? "") || "",
          relationship_status:
            member.relationship_status || String(intake.relationship_status ?? "") || "",
          personality: String(intake.personality ?? ""),
          strengths: String(intake.strengths ?? ""),
          lifeAreasFulfilling: String(intake.lifeAreasFulfilling ?? ""),
          lifeAreasImprovement: String(intake.lifeAreasImprovement ?? ""),
          longTermGoals: String(intake.longTermGoals ?? ""),
          majorLifeEvents: String(intake.majorLifeEvents ?? ""),
          stressManagement: String(intake.stressManagement ?? ""),
          workLifeBalance: String(intake.workLifeBalance ?? ""),
          relationship_with_family: String(intake.relationship_with_family ?? ""),
          biggest_current_challenges: String(intake.biggest_current_challenges ?? ""),
          focus_on_specific_relationships: String(
            intake.focus_on_specific_relationships ?? ""
          ),
          guidance_on_specific_decision: String(
            intake.guidance_on_specific_decision ?? ""
          ),
          concerns_about_romantic_life: String(
            intake.concerns_about_romantic_life ?? ""
          ),
          ongoing_projects_or_plans: String(intake.ongoing_projects_or_plans ?? ""),
          social_life_fulfillment: String(intake.social_life_fulfillment ?? ""),
          spiritualPractices: String(intake.spiritualPractices ?? ""),
          selfDiscovery: String(intake.selfDiscovery ?? ""),
          externalInfluences: String(intake.externalInfluences ?? ""),
          achieveFromReading: String(intake.achieveFromReading ?? ""),
          specificQuestions: String(intake.specificQuestions ?? ""),
          goalsOutcomes: String(intake.goalsOutcomes ?? ""),
          practicalSpiritualPref: String(intake.practicalSpiritualPref ?? ""),
          mainConcern: String(intake.mainConcern ?? ""),
          additionalInfo: String(intake.additionalInfo ?? ""),
        });

        const prefilledHousehold = (family_members ?? []).map((member) =>
          createHouseholdMember({
            id: member.id,
            fullName: member.full_name ?? "",
            relationship: member.relationship ?? "",
            dateOfBirth: member.date_of_birth ?? "",
            birthTime: member.birth_time ?? "",
            birthCity: member.birth_city ?? "",
            birthCountry: member.birth_country ?? "",
            notes: member.notes ?? "",
          })
        );

        if (prefilledHousehold.length > 0) {
          setHouseholdMembers(prefilledHousehold);
        } else if (nextPlanConfig?.additionalMembers === 1) {
          setHouseholdMembers([createHouseholdMember()]);
        }
      } catch {
        // fall back to empty form
      } finally {
        setLoading(false);
      }
    }

    loadPrefill();
  }, []);

  function validateCurrentStep(targetStep = step): string | null {
    if (targetStep === 1) {
      if (!form.firstName.trim()) return "First name is required.";
      if (!form.lastName.trim()) return "Last name is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim().toLowerCase())) {
        return "A valid email is required.";
      }
      if (form.phone.replace(/\D/g, "").length !== 10) {
        return "Phone must be a 10-digit number.";
      }
      if (!form.gender) return "Gender is required.";
      if (!form.occupation.trim()) return "Occupation is required.";
      if (!form.birthTime) return "Birth time is required.";
      if (!form.birthCity.trim()) return "Birth city is required.";
      if (!form.birthCountry.trim()) return "Birth country is required.";
    }

    if (targetStep === 2) {
      if (!form.address.trim()) return "Address is required.";
      if (!form.city.trim()) return "City is required.";
      if (!form.state.trim()) return "State is required.";
      if (!/^\d{5}$/.test(form.zip.trim())) return "Zip must be exactly 5 digits.";
    }

    if (householdStepEnabled && targetStep === 3) {
      if (selectedPlanId === "plan_pm_couple" && householdMembers.length !== 1) {
        return "Couple plans require one household member.";
      }

      for (const [index, member] of householdMembers.entries()) {
        if (!member.fullName.trim()) {
          return `Household member ${index + 1} needs a full name.`;
        }
        if (!member.relationship.trim()) {
          return `Household member ${index + 1} needs a relationship.`;
        }
        if (!member.dateOfBirth) {
          return `Household member ${index + 1} needs a birth date.`;
        }
      }
    }

    return null;
  }

  function handleNext() {
    setError("");
    const failure = validateCurrentStep();
    if (failure) {
      setError(failure);
      return;
    }
    setStep((current) => Math.min(current + 1, totalSteps));
  }

  function handleBack() {
    setError("");
    setStep((current) => Math.max(current - 1, 1));
  }

  async function handleSubmit() {
    setError("");

    for (let currentStep = 1; currentStep <= totalSteps; currentStep += 1) {
      const failure = validateCurrentStep(currentStep);
      if (failure) {
        setError(failure);
        setStep(currentStep);
        return;
      }
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
          birth_city: form.birthCity.trim(),
          birth_country: form.birthCountry.trim(),
          relationship_status: form.relationship_status || null,
          personality: form.personality.trim() || null,
          strengths: form.strengths.trim() || null,
          lifeAreasFulfilling: form.lifeAreasFulfilling.trim() || null,
          lifeAreasImprovement: form.lifeAreasImprovement.trim() || null,
          longTermGoals: form.longTermGoals.trim() || null,
          majorLifeEvents: form.majorLifeEvents.trim() || null,
          stressManagement: form.stressManagement.trim() || null,
          workLifeBalance: form.workLifeBalance.trim() || null,
          relationship_with_family: form.relationship_with_family.trim() || null,
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
          family_members: householdMembers.map((member) => ({
            ...(member.id ? { id: member.id } : {}),
            full_name: member.fullName.trim(),
            relationship: member.relationship.trim(),
            date_of_birth: member.dateOfBirth,
            birth_time: member.birthTime || null,
            birth_city: member.birthCity.trim() || null,
            birth_country: member.birthCountry.trim() || null,
            notes: member.notes.trim() || null,
          })),
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome to Perennial Mandalism
        </h1>
        {isInvited ? (
          <p className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
            Your membership was invited by admin. Complete the same community onboarding flow here before dashboard access opens.
          </p>
        ) : null}
        <p className="mt-1 text-muted-foreground">
          Finish your profile so your community access is fully wired.
        </p>
        {planConfig && (
          <div className="mt-3 flex justify-center">
            <Badge variant="secondary">{planConfig.label}</Badge>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2">
        {stepTitles.map((title, index) => {
          const number = index + 1;
          const isActive = number === step;
          const isCompleted = number < step;

          return (
            <div key={title} className="flex items-center gap-2">
              <div
                className={`flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isActive
                      ? "border-2 border-primary text-primary"
                      : "border-2 border-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? <CheckCircle2 className="size-4" /> : number}
              </div>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {title}
              </span>
              {number < stepTitles.length && (
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

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
            <CardDescription>
              Tell us about yourself. Fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">
                  First name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => patch({ firstName: e.target.value })}
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
                  onChange={(e) => patch({ email: e.target.value })}
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
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="gender">
                  Gender <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.gender}
                  onValueChange={(value) => patch({ gender: value })}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((gender) => (
                      <SelectItem key={gender} value={gender}>
                        {gender}
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
                />
              </div>
            </div>

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
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>
                Birth Location <span className="text-destructive">*</span>
              </Label>
              <CitySearch
                value={form.birthCity}
                placeholder="Search birth city..."
                onChange={(result) =>
                  patch({
                    birthCity: result.city,
                    birthCountry: result.city.split(",").pop()?.trim() || "",
                  })
                }
              />
              {form.birthCity && (
                <p className="text-[10px] text-muted-foreground">
                  Detected: {form.birthCity}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {householdStepEnabled && step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Household Members</CardTitle>
            <CardDescription>
              Add the people included in your {planConfig?.label.toLowerCase()}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 text-sm">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                <span>
                  {householdMembers.length}/{maxAdditionalMembers} household member
                  {maxAdditionalMembers === 1 ? "" : "s"} added
                </span>
              </div>
              {householdMembers.length < maxAdditionalMembers && (
                <Button type="button" variant="outline" size="sm" onClick={addHouseholdMember}>
                  <Plus className="mr-1 size-4" />
                  Add member
                </Button>
              )}
            </div>

            {householdMembers.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Add each household member you want included in this plan.
              </div>
            ) : (
              householdMembers.map((member, index) => (
                <div key={member.id ?? `new-${index}`} className="space-y-4 rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Household member {index + 1}</p>
                      <p className="text-sm text-muted-foreground">
                        This profile powers charts, invites, and family features.
                      </p>
                    </div>
                    {householdMembers.length > (selectedPlanId === "plan_pm_couple" ? 1 : 0) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHouseholdMember(index)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor={`family-name-${index}`}>
                        Full name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`family-name-${index}`}
                        value={member.fullName}
                        onChange={(e) =>
                          updateHouseholdMember(index, { fullName: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`family-relationship-${index}`}>
                        Relationship <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`family-relationship-${index}`}
                        value={member.relationship}
                        onChange={(e) =>
                          updateHouseholdMember(index, { relationship: e.target.value })
                        }
                        placeholder="Spouse, Partner, Child, Parent"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor={`family-dob-${index}`}>
                        Birth date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`family-dob-${index}`}
                        type="date"
                        value={member.dateOfBirth}
                        onChange={(e) =>
                          updateHouseholdMember(index, { dateOfBirth: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`family-birth-time-${index}`}>Birth time</Label>
                      <Input
                        id={`family-birth-time-${index}`}
                        type="time"
                        value={member.birthTime}
                        onChange={(e) =>
                          updateHouseholdMember(index, { birthTime: e.target.value })
                        }
                      />
                    </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Birth Location <span className="text-destructive">*</span></Label>
                      <CitySearch
                        value={member.birthCity}
                        placeholder="Search birth city..."
                        onChange={(result) =>
                          updateHouseholdMember(index, {
                            birthCity: result.city,
                            birthCountry: result.city.split(",").pop()?.trim() || "",
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`family-notes-${index}`}>Notes</Label>
                      <Input
                        id={`family-notes-${index}`}
                        value={member.notes}
                        onChange={(e) =>
                          updateHouseholdMember(index, { notes: e.target.value })
                        }
                        placeholder="Anything important to remember"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {step === totalSteps && (
        <Card>
          <CardHeader>
            <CardTitle>About Your Journey</CardTitle>
            <CardDescription>
              These questions are optional, but they help tailor your experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="relationship_status">Relationship status</Label>
              <Select
                value={form.relationship_status}
                onValueChange={(value) => patch({ relationship_status: value })}
              >
                <SelectTrigger id="relationship_status">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              type="button"
              onClick={() => setQuestionnaireOpen((current) => !current)}
              className="flex w-full items-center justify-between border-t pt-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            >
              <span>Optional questionnaire</span>
              {questionnaireOpen ? (
                <ChevronUp className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
            </button>

            {questionnaireOpen && (
              <div className="space-y-3">
                {QUESTIONNAIRE_FIELDS.map(([key, label]) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={`q-${key}`}>{label}</Label>
                    <Textarea
                      id={`q-${key}`}
                      rows={2}
                      value={(form as unknown as Record<string, string>)[key] ?? ""}
                      onChange={(e) =>
                        patch({ [key]: e.target.value } as Partial<ProfileForm>)
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-center text-sm text-amber-800">
          {error}
        </div>
      )}

      <div className="flex justify-between">
        {step > 1 ? (
          <Button type="button" variant="outline" onClick={handleBack}>
            <ChevronLeft className="mr-1 size-4" />
            Back
          </Button>
        ) : (
          <div />
        )}

        {step < totalSteps ? (
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
