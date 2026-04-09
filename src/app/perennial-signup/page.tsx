"use client";

import { useRef, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Sparkles,
  Users,
  User,
} from "lucide-react";

// ─── Plans ─────────────────────────────────────────────────────────────────

type PlanKey = "single" | "couple" | "family";

interface PlanDef {
  key: PlanKey;
  name: string;
  priceMonthly: number;
  totalMembers: number;
  description: string;
  stripePriceEnv: string; // for documentation only — wired in the payment task
}

const PLANS: PlanDef[] = [
  {
    key: "single",
    name: "Single",
    priceMonthly: 19.95,
    totalMembers: 1,
    description: "One member. Solo Perennial Mandalism practice.",
    stripePriceEnv: "STRIPE_PRICE_COMMUNITY_INDIVIDUAL",
  },
  {
    key: "couple",
    name: "Couple",
    priceMonthly: 29.95,
    totalMembers: 2,
    description: "You + one partner. Two full Perennial Mandalism accounts.",
    stripePriceEnv: "STRIPE_PRICE_COMMUNITY_COUPLE",
  },
  {
    key: "family",
    name: "Family",
    priceMonthly: 39.95,
    totalMembers: 5,
    description: "Up to 5 household members. Each gets their own account.",
    stripePriceEnv: "STRIPE_PRICE_COMMUNITY_FAMILY",
  },
];

// Legacy relation/sub_relation rules from perennial task 03.
// relation_type values for additional members: 'Couple' | 'Family'.
// Sub-relations are gated on relation_type.
const RELATION_TYPES = ["Couple", "Family"] as const;
type RelationType = (typeof RELATION_TYPES)[number];

const SUB_RELATIONS_BY_TYPE: Record<RelationType, string[]> = {
  Couple: ["Husband", "Wife"],
  Family: ["Son", "Daughter", "Spouse", "Partner", "Other"],
};

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

// Legacy phone formatter from perennial task 03:
//   123       -> 123
//   1234      -> (123) 4
//   1234567   -> (123) 456-7
//   1234567890 -> (123) 456-7890
function legacyFormatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// ─── Member form state ────────────────────────────────────────────────────

interface MemberForm {
  id: string;
  isPrimary: boolean;
  // Legacy relation rules: additional members must pick a relation_type
  // (Couple | Family) and a sub_relation gated on the type. The primary
  // member is implicitly "Self" and skips both fields.
  relationType: RelationType | "";
  subRelation: string;
  // Required core fields (from task 03)
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
  // Optional questionnaire — collapsed by default per the spec
  questionnaireOpen: boolean;
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

function newMember(isPrimary: boolean): MemberForm {
  return {
    id: Math.random().toString(36).slice(2),
    isPrimary,
    relationType: "",
    subRelation: "",
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
    questionnaireOpen: false,
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function PerennialSignupPage() {
  const [planKey, setPlanKey] = useState<PlanKey>("single");
  const plan = PLANS.find((p) => p.key === planKey)!;

  const [members, setMembers] = useState<MemberForm[]>([newMember(true)]);
  const [submitNote, setSubmitNote] = useState<string | null>(null);

  // Two-step flow required by perennial task 05: the user fills out the
  // form, then reviews every member + plan + credentials messaging before
  // the actual Stripe checkout fires.
  const [step, setStep] = useState<"form" | "review">("form");

  const householdCount = members.length;
  const remainingSlots = Math.max(0, plan.totalMembers - householdCount);
  const canAdd = householdCount < plan.totalMembers;

  // When the selected plan cannot hold the current household count, overflow
  // is > 0. The page blocks submission and shows an explicit warning so the
  // user manually removes the excess members — plan changes must not silently
  // discard member data (task 04 / task 02 non-negotiable rule).
  const overflowCount = Math.max(0, householdCount - plan.totalMembers);
  const hasOverflow = overflowCount > 0;

  function changePlan(next: PlanKey) {
    // Never auto-trim members on plan downgrade. If the new plan has fewer
    // slots than the current household, the overflow warning handles it.
    setPlanKey(next);
    // Clear any stale submit error so the new overflow banner is the only
    // active guidance.
    setSubmitNote(null);
  }

  function addMember() {
    if (!canAdd) return;
    setMembers((prev) => [...prev, newMember(false)]);
    setSubmitNote(null);
  }

  function removeMember(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id || m.isPrimary));
    setSubmitNote(null);
  }

  function patch(id: string, patchFields: Partial<MemberForm>) {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patchFields } : m)),
    );
  }

  // Field id helper — used for both <Label htmlFor> and scroll-to-first-error.
  function fid(memberId: string, field: string) {
    return `m-${memberId}-${field}`;
  }

  interface ValidationFailure {
    message: string;
    fieldId: string | null;
  }

  function validate(): ValidationFailure | null {
    // 1. Plan capacity check first — before any field-level validation.
    const limits = {
      single: { min: 1, max: 1 },
      couple: { min: 2, max: 2 },
      family: { min: 3, max: 5 },
    } as const;
    const { min, max } = limits[plan.key];
    if (members.length < min || members.length > max) {
      return {
        message:
          min === max
            ? `${plan.name} plan requires exactly ${min} member${min === 1 ? "" : "s"}. You have ${members.length}.`
            : `${plan.name} plan requires ${min}–${max} household members. You have ${members.length}.`,
        fieldId: null,
      };
    }

    // 2. Field validation per member, in member order, returning the FIRST
    //    invalid field id so the parent can scroll/focus it.
    const emails = new Set<string>();
    for (const m of members) {
      const memberLabel = m.isPrimary
        ? "Primary member"
        : `Additional member (${m.firstName || "no name"})`;

      if (!m.isPrimary) {
        if (!m.relationType) {
          return { message: `${memberLabel}: relation type is required.`, fieldId: fid(m.id, "relationType") };
        }
        if (!m.subRelation) {
          return { message: `${memberLabel}: sub-relation is required.`, fieldId: fid(m.id, "subRelation") };
        }
      }
      if (!m.firstName.trim()) {
        return { message: `${memberLabel}: first name is required.`, fieldId: fid(m.id, "firstName") };
      }
      if (!m.lastName.trim()) {
        return { message: `${memberLabel}: last name is required.`, fieldId: fid(m.id, "lastName") };
      }
      const e = m.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
        return { message: `${memberLabel}: a valid email is required.`, fieldId: fid(m.id, "email") };
      }
      if (emails.has(e)) {
        return {
          message: `Email ${e} is used by more than one member. Each household member needs a unique email.`,
          fieldId: fid(m.id, "email"),
        };
      }
      emails.add(e);
      // Phone: must be exactly 10 digits per the legacy formatter contract.
      if (m.phone.replace(/\D/g, "").length !== 10) {
        return { message: `${memberLabel}: phone must be a 10-digit number.`, fieldId: fid(m.id, "phone") };
      }
      if (!m.gender) {
        return { message: `${memberLabel}: gender is required.`, fieldId: fid(m.id, "gender") };
      }
      if (!m.state.trim()) {
        return { message: `${memberLabel}: state is required.`, fieldId: fid(m.id, "state") };
      }
      if (!m.city.trim()) {
        return { message: `${memberLabel}: city is required.`, fieldId: fid(m.id, "city") };
      }
      // Zip: numeric, exactly 5 digits per task 03.
      if (!/^\d{5}$/.test(m.zip.trim())) {
        return { message: `${memberLabel}: zip must be exactly 5 digits.`, fieldId: fid(m.id, "zip") };
      }
      if (!m.address.trim()) {
        return { message: `${memberLabel}: address is required.`, fieldId: fid(m.id, "address") };
      }
      if (!m.occupation.trim()) {
        return { message: `${memberLabel}: occupation is required.`, fieldId: fid(m.id, "occupation") };
      }
      if (!m.dateOfBirth) {
        return { message: `${memberLabel}: date of birth is required.`, fieldId: fid(m.id, "dateOfBirth") };
      }
      if (!m.birthTime) {
        return { message: `${memberLabel}: birth time is required.`, fieldId: fid(m.id, "birthTime") };
      }
    }
    return null;
  }

  const [checkingOut, setCheckingOut] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function focusInvalidField(fieldId: string | null) {
    if (!fieldId) return;
    // Scroll the field into view, then focus it. requestAnimationFrame so
    // the focus happens after the scroll smooths.
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    requestAnimationFrame(() => {
      try {
        (el as HTMLElement).focus({ preventScroll: true });
      } catch {
        /* not focusable */
      }
    });
  }

  // Validate + switch to the review step. Nothing hits the network here —
  // the Stripe call only fires from `confirmAndCheckout` below after the
  // user sees the review screen.
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitNote(null);
    const failure = validate();
    if (failure) {
      setSubmitNote(failure.message);
      focusInvalidField(failure.fieldId);
      return;
    }
    setStep("review");
    // Bring the user back to the top of the page so the review content is
    // the first thing they see.
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function confirmAndCheckout() {
    setSubmitNote(null);
    // Defense in depth: re-validate in case the user navigated back, edited,
    // and came back to review without re-clicking Review.
    const failure = validate();
    if (failure) {
      setSubmitNote(failure.message);
      setStep("form");
      focusInvalidField(failure.fieldId);
      return;
    }

    setCheckingOut(true);
    try {
      const res = await fetch("/api/perennial-signup/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_key: planKey,
          members: members.map((m) => ({
            is_primary: m.isPrimary,
            // Legacy relation/sub_relation. The primary member is implicitly
            // "Self" so we omit relation_type/sub_relation for them.
            relation_type: m.isPrimary ? "Self" : m.relationType,
            sub_relation: m.isPrimary ? null : m.subRelation,
            // Required core fields
            first_name: m.firstName,
            last_name: m.lastName,
            email: m.email,
            phone: m.phone,
            gender: m.gender,
            state: m.state,
            city: m.city,
            zip: m.zip,
            address: m.address,
            occupation: m.occupation,
            date_of_birth: m.dateOfBirth,
            birth_time: m.birthTime,
            // Full optional questionnaire (every member)
            relationship_status: m.relationship_status || null,
            personality: m.personality || null,
            strengths: m.strengths || null,
            lifeAreasFulfilling: m.lifeAreasFulfilling || null,
            lifeAreasImprovement: m.lifeAreasImprovement || null,
            longTermGoals: m.longTermGoals || null,
            majorLifeEvents: m.majorLifeEvents || null,
            stressManagement: m.stressManagement || null,
            workLifeBalance: m.workLifeBalance || null,
            relationship_with_family: m.relationship_with_family || null,
            biggest_current_challenges: m.biggest_current_challenges || null,
            focus_on_specific_relationships: m.focus_on_specific_relationships || null,
            guidance_on_specific_decision: m.guidance_on_specific_decision || null,
            concerns_about_romantic_life: m.concerns_about_romantic_life || null,
            ongoing_projects_or_plans: m.ongoing_projects_or_plans || null,
            social_life_fulfillment: m.social_life_fulfillment || null,
            spiritualPractices: m.spiritualPractices || null,
            selfDiscovery: m.selfDiscovery || null,
            externalInfluences: m.externalInfluences || null,
            achieveFromReading: m.achieveFromReading || null,
            specificQuestions: m.specificQuestions || null,
            goalsOutcomes: m.goalsOutcomes || null,
            practicalSpiritualPref: m.practicalSpiritualPref || null,
            mainConcern: m.mainConcern || null,
            additionalInfo: m.additionalInfo || null,
          })),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setSubmitNote(body.error ?? `Checkout failed (HTTP ${res.status})`);
        return;
      }
      if (body.checkout_url) {
        // Stripe-hosted checkout. The webhook handler
        // (handlePerennialSignupCheckoutCompleted) will provision the
        // household accounts after payment succeeds.
        window.location.href = body.checkout_url;
        return;
      }
      setSubmitNote("Stripe returned no checkout URL.");
    } catch (err) {
      setSubmitNote(err instanceof Error ? err.message : String(err));
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero — legacy copy preserved verbatim per task 07. */}
      <header className="border-b bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto max-w-5xl px-4 py-10 sm:py-14 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Perennial Mandalism
            </p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Welcome to Our Living Circle of Wisdom
          </h1>
          <div className="space-y-3 text-sm text-muted-foreground max-w-3xl leading-relaxed">
            <p>
              We warmly invite individuals, couples, and families to join a
              growing community of like-minded souls who honor the timeless
              insights of Astrology and the living traditions of perennial
              wisdom. Here, we gather in sacred fellowship to learn, grow, and
              celebrate the spiritual arts &mdash; through teachings and
              trainings in astrology, yoga, meditation, tarot and the sacred
              texts of the world&apos;s great lineages.
            </p>
            <p>
              As a member, you&apos;ll receive access to a private Backoffice
              that offers personalized chart readings for all ages (7 and up),
              carefully attuned to each stage of life. You&apos;ll be able to
              participate in our monthly public rituals via webcast &mdash;
              beautifully woven ceremonies that align us with the rhythms of
              the cosmos. In our members-only gatherings, families are
              encouraged to sit together as we read aloud and reflect on
              sacred texts such as the Bhagavad Gita, the Gospel of Thomas,
              and the Tao Te Ching.
            </p>
            <p>
              We also offer special trainings for children, teens, and adults
              in the rich symbolism of astrology, tarot, and Jungian
              archetypes &mdash; creating a space where spiritual learning
              becomes a shared journey across generations. Our intimate
              community meetings bring heart-centered, spiritually grounded
              connection into focus, weaving together the mystical with the
              practical in everyday life.
            </p>
            <p className="text-foreground font-medium">
              Come take your place in a community devoted to awakening,
              understanding, and the shared joy of inner discovery.
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-8">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* LEFT: plan + members (form step) or review (review step) */}
          <div className="lg:col-span-2 space-y-6">
            {step === "review" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Review your household</CardTitle>
                  <CardDescription className="text-xs">
                    Check every member before payment. You can go back and
                    edit anything. No charge happens until you confirm on
                    the next step.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">Plan</span>
                      <span className="font-semibold">
                        {plan.name} — {formatCurrency(plan.priceMonthly)}/month
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">
                        Household
                      </span>
                      <span className="tabular-nums">
                        {householdCount} member{householdCount === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground pt-1">
                      {members[0]?.firstName || "Primary member"}{" "}
                      {members[0]?.lastName || ""} is the billing owner.
                      Every other member gets their own Perennial account
                      with a system-generated password emailed after
                      successful payment.
                    </p>
                  </div>

                  <ul className="space-y-2">
                    {members.map((m, idx) => (
                      <li
                        key={m.id}
                        className="rounded-lg border p-3 text-xs space-y-0.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm">
                            {m.firstName} {m.lastName}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {m.isPrimary
                              ? "Primary (billing)"
                              : `Member ${idx + 1}`}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{m.email}</p>
                        <p className="text-muted-foreground">
                          {m.phone}
                          {m.city && `  ·  ${m.city}, ${m.state} ${m.zip}`}
                        </p>
                        {!m.isPrimary && m.relationType && (
                          <p className="text-muted-foreground">
                            {m.relationType}
                            {m.subRelation ? ` — ${m.subRelation}` : ""}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-primary space-y-1">
                    <p className="font-semibold">
                      Nothing is created until payment succeeds.
                    </p>
                    <p>
                      When you click Confirm and pay, you&apos;ll be
                      redirected to Stripe. Accounts + login emails go out
                      after Stripe confirms the charge.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Plan selection — only visible while editing */}
            {step === "form" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Choose your plan</CardTitle>
                <CardDescription className="text-xs">
                  All plans include the full Perennial Mandalism content set.
                  Pick the household size that matches you — every member
                  gets a real account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PLANS.map((p) => {
                    const isSelected = p.key === planKey;
                    return (
                      <button
                        type="button"
                        key={p.key}
                        onClick={() => changePlan(p.key)}
                        className={`text-left rounded-xl border p-4 transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/30 hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{p.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {p.totalMembers === 1
                                ? "1 member"
                                : p.key === "family"
                                  ? "3–5 members"
                                  : `${p.totalMembers} members`}
                            </p>
                          </div>
                          {isSelected && <Check className="size-4 text-primary" />}
                        </div>
                        <p className="mt-3 text-lg font-bold tabular-nums">
                          {formatCurrency(p.priceMonthly)}
                          <span className="text-xs font-normal text-muted-foreground">
                            /month
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {p.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {plan.key === "couple" && (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800">
                    Heads up: the <code>STRIPE_PRICE_COMMUNITY_COUPLE</code>{" "}
                    env var is missing in this environment. The Couple plan
                    will be visible but checkout will not complete until the
                    Stripe price is configured.
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* Plan overflow warning — shown when switching to a smaller plan
                leaves more members than the new plan allows. The user must
                remove excess members manually; the page never auto-discards. */}
            {step === "form" && hasOverflow && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive space-y-1">
                <p className="font-semibold">
                  Too many members for the {plan.name} plan
                </p>
                <p className="text-xs">
                  The {plan.name} plan allows{" "}
                  {plan.key === "family"
                    ? "3–5"
                    : plan.totalMembers}{" "}
                  member{plan.totalMembers === 1 ? "" : "s"}. You currently
                  have {householdCount}. Please remove{" "}
                  {overflowCount} household member
                  {overflowCount === 1 ? "" : "s"} below, or choose a larger
                  plan.
                </p>
              </div>
            )}

            {/* Member forms — edit mode only. Review mode shows a summary
                list from the review Card above instead. */}
            {step === "form" && members.map((m, idx) => {
              const isPrimary = m.isPrimary;
              return (
                <Card key={m.id}>
                  <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                    <div className="flex items-start gap-2">
                      {isPrimary ? (
                        <User className="size-5 text-primary mt-0.5" />
                      ) : (
                        <Users className="size-5 text-muted-foreground mt-0.5" />
                      )}
                      <div>
                        <CardTitle className="text-base">
                          {isPrimary
                            ? "Primary member (you)"
                            : `Household member ${idx + 1}`}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {isPrimary
                            ? "You'll manage billing for the household."
                            : "Will receive their own account and login after payment."}
                        </CardDescription>
                      </div>
                    </div>
                    {!isPrimary && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive"
                        onClick={() => removeMember(m.id)}
                        aria-label="Remove member"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* ── Legacy relation_type + sub_relation (additional members only) ── */}
                    {!isPrimary && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor={fid(m.id, "relationType")}>Relation type</Label>
                          <Select
                            value={m.relationType}
                            onValueChange={(v) =>
                              patch(m.id, {
                                relationType: v as RelationType,
                                subRelation: "", // reset when type changes
                              })
                            }
                          >
                            <SelectTrigger id={fid(m.id, "relationType")}>
                              <SelectValue placeholder="Couple / Family" />
                            </SelectTrigger>
                            <SelectContent>
                              {RELATION_TYPES.map((rt) => (
                                <SelectItem key={rt} value={rt}>
                                  {rt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={fid(m.id, "subRelation")}>Sub-relation</Label>
                          <Select
                            value={m.subRelation}
                            onValueChange={(v) => patch(m.id, { subRelation: v })}
                            disabled={!m.relationType}
                          >
                            <SelectTrigger id={fid(m.id, "subRelation")}>
                              <SelectValue
                                placeholder={
                                  m.relationType
                                    ? "Select sub-relation"
                                    : "Pick relation type first"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {(m.relationType
                                ? SUB_RELATIONS_BY_TYPE[m.relationType]
                                : []
                              ).map((sr) => (
                                <SelectItem key={sr} value={sr}>
                                  {sr}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* ── Identity ── */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={fid(m.id, "firstName")}>First name</Label>
                        <Input
                          id={fid(m.id, "firstName")}
                          value={m.firstName}
                          onChange={(e) => patch(m.id, { firstName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={fid(m.id, "lastName")}>Last name</Label>
                        <Input
                          id={fid(m.id, "lastName")}
                          value={m.lastName}
                          onChange={(e) => patch(m.id, { lastName: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={fid(m.id, "email")}>Email</Label>
                        <Input
                          id={fid(m.id, "email")}
                          type="email"
                          value={m.email}
                          onChange={(e) => patch(m.id, { email: e.target.value })}
                          placeholder="member@example.com"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={fid(m.id, "phone")}>Phone</Label>
                        <Input
                          id={fid(m.id, "phone")}
                          type="tel"
                          value={m.phone}
                          onChange={(e) =>
                            patch(m.id, { phone: legacyFormatPhone(e.target.value) })
                          }
                          placeholder="(123) 456-7890"
                          required
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground -mt-2">
                      Each member must have a unique email. A system-generated
                      password is emailed after payment &mdash; no need to
                      choose one here.
                    </p>

                    {/* ── Demographics ── */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={fid(m.id, "gender")}>Gender</Label>
                        <Select
                          value={m.gender}
                          onValueChange={(v) => patch(m.id, { gender: v })}
                        >
                          <SelectTrigger id={fid(m.id, "gender")}>
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
                        <Label htmlFor={fid(m.id, "occupation")}>Occupation</Label>
                        <Input
                          id={fid(m.id, "occupation")}
                          value={m.occupation}
                          onChange={(e) => patch(m.id, { occupation: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* ── Address ── */}
                    <div className="space-y-1.5">
                      <Label htmlFor={fid(m.id, "address")}>Address</Label>
                      <Input
                        id={fid(m.id, "address")}
                        value={m.address}
                        onChange={(e) => patch(m.id, { address: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={fid(m.id, "city")}>City</Label>
                        <Input
                          id={fid(m.id, "city")}
                          value={m.city}
                          onChange={(e) => patch(m.id, { city: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={fid(m.id, "state")}>State</Label>
                        <Input
                          id={fid(m.id, "state")}
                          value={m.state}
                          onChange={(e) => patch(m.id, { state: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={fid(m.id, "zip")}>Zip</Label>
                        <Input
                          id={fid(m.id, "zip")}
                          inputMode="numeric"
                          maxLength={5}
                          value={m.zip}
                          onChange={(e) =>
                            patch(m.id, { zip: e.target.value.replace(/\D/g, "").slice(0, 5) })
                          }
                          required
                        />
                      </div>
                    </div>

                    {/* ── Birth ── */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={fid(m.id, "dateOfBirth")}>Date of birth</Label>
                        <Input
                          id={fid(m.id, "dateOfBirth")}
                          type="date"
                          value={m.dateOfBirth}
                          onChange={(e) => patch(m.id, { dateOfBirth: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={fid(m.id, "birthTime")}>Birth time</Label>
                        <Input
                          id={fid(m.id, "birthTime")}
                          type="time"
                          value={m.birthTime}
                          onChange={(e) => patch(m.id, { birthTime: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* ── Optional questionnaire (25 fields, collapsed by default) ── */}
                    <button
                      type="button"
                      onClick={() =>
                        patch(m.id, { questionnaireOpen: !m.questionnaireOpen })
                      }
                      className="flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors pt-2"
                    >
                      <span>Optional questionnaire (25 fields)</span>
                      {m.questionnaireOpen ? (
                        <ChevronUp className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      )}
                    </button>
                    {m.questionnaireOpen && (
                      <div className="space-y-3 border-t pt-3">
                        <div className="space-y-1.5">
                          <Label htmlFor={fid(m.id, "relationship_status")}>
                            Relationship status
                          </Label>
                          <Select
                            value={m.relationship_status}
                            onValueChange={(v) =>
                              patch(m.id, { relationship_status: v })
                            }
                          >
                            <SelectTrigger id={fid(m.id, "relationship_status")}>
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

                        {(
                          [
                            ["personality", "Personality"],
                            ["strengths", "Strengths"],
                            ["lifeAreasFulfilling", "Life areas — most fulfilling"],
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
                          ] as const
                        ).map(([key, label]) => (
                          <div key={key} className="space-y-1.5">
                            <Label htmlFor={fid(m.id, key)}>{label}</Label>
                            <Textarea
                              id={fid(m.id, key)}
                              rows={2}
                              value={m[key] as string}
                              onChange={(e) => patch(m.id, { [key]: e.target.value } as Partial<MemberForm>)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {step === "form" && canAdd && (
              <Button
                type="button"
                variant="outline"
                onClick={addMember}
                className="w-full"
              >
                <Plus className="mr-2 size-4" />
                Add another household member ({remainingSlots} remaining)
              </Button>
            )}
          </div>

          {/* RIGHT: sticky order summary */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 space-y-4">
              <Card className="border-primary/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Order summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-baseline justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <Badge variant="outline">{plan.name}</Badge>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-muted-foreground">Members</span>
                    <span className="tabular-nums">
                      {householdCount}/{plan.totalMembers}
                    </span>
                  </div>
                  <div className="border-t pt-3 flex items-baseline justify-between">
                    <span className="font-semibold">Total / month</span>
                    <span className="text-lg font-bold tabular-nums text-primary">
                      {formatCurrency(plan.priceMonthly)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Charged monthly. Cancel any time from your account.
                  </p>
                </CardContent>
              </Card>

              {submitNote && (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800">
                  {submitNote}
                </div>
              )}

              {step === "form" ? (
                <>
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={checkingOut || hasOverflow}
                  >
                    Review your household
                  </Button>
                  <p className="text-[11px] text-muted-foreground text-center">
                    You&apos;ll get to check everything before any charge.
                  </p>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    className="w-full"
                    size="lg"
                    disabled={checkingOut || hasOverflow}
                    onClick={confirmAndCheckout}
                  >
                    {checkingOut ? "Redirecting to payment…" : "Confirm and pay"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    size="sm"
                    disabled={checkingOut}
                    onClick={() => {
                      setStep("form");
                      setSubmitNote(null);
                    }}
                  >
                    Back to edit
                  </Button>
                  <p className="text-[11px] text-muted-foreground text-center">
                    Accounts are created after successful payment. You&apos;ll
                    receive an email with a system-generated password for
                    each household member.
                  </p>
                </>
              )}
            </div>
          </aside>
        </form>
      </main>
    </div>
  );
}
