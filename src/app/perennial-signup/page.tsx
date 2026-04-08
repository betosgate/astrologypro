"use client";

import { useState } from "react";
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

const RELATIONS = [
  { value: "self", label: "Self (primary)" },
  { value: "spouse", label: "Spouse / Partner" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "friend", label: "Friend" },
  { value: "other", label: "Other" },
] as const;

// ─── Member form state ────────────────────────────────────────────────────

interface MemberForm {
  id: string;
  isPrimary: boolean;
  relation: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  birthTime: string;
  birthCity: string;
  birthCountry: string;
  // Optional questionnaire — collapsed by default per the spec
  questionnaireOpen: boolean;
  intentions: string;
  challenges: string;
  goals: string;
}

function newMember(isPrimary: boolean): MemberForm {
  return {
    id: Math.random().toString(36).slice(2),
    isPrimary,
    relation: isPrimary ? "self" : "",
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    birthTime: "",
    birthCity: "",
    birthCountry: "",
    questionnaireOpen: false,
    intentions: "",
    challenges: "",
    goals: "",
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

  const householdCount = members.length;
  const remainingSlots = Math.max(0, plan.totalMembers - householdCount);
  const canAdd = householdCount < plan.totalMembers;

  function changePlan(next: PlanKey) {
    const nextPlan = PLANS.find((p) => p.key === next)!;
    setPlanKey(next);
    // Trim members down if the new plan has fewer slots
    setMembers((prev) => {
      if (prev.length <= nextPlan.totalMembers) return prev;
      return prev.slice(0, nextPlan.totalMembers);
    });
  }

  function addMember() {
    if (!canAdd) return;
    setMembers((prev) => [...prev, newMember(false)]);
  }

  function removeMember(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id || m.isPrimary));
  }

  function patch(id: string, patchFields: Partial<MemberForm>) {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patchFields } : m)),
    );
  }

  function validate(): string | null {
    // Email uniqueness across the household + required fields
    const emails = new Set<string>();
    for (const m of members) {
      if (!m.firstName.trim() || !m.lastName.trim()) {
        return `${m.isPrimary ? "Primary member" : "Additional member"}: first and last name are required.`;
      }
      const e = m.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
        return `${m.firstName || "Member"}: a valid email is required.`;
      }
      if (emails.has(e)) {
        return `Email ${e} is used by more than one member. Each household member needs a unique email.`;
      }
      emails.add(e);
      if (!m.relation) {
        return `${m.firstName || "Member"}: relation is required.`;
      }
      if (!m.dateOfBirth) {
        return `${m.firstName || "Member"}: date of birth is required.`;
      }
    }
    if (members.length !== plan.totalMembers && plan.key !== "family") {
      return `${plan.name} plan requires exactly ${plan.totalMembers} member${plan.totalMembers === 1 ? "" : "s"}. You have ${members.length}.`;
    }
    if (plan.key === "family" && (members.length < 3 || members.length > 5)) {
      return `Family plan requires 3 to 5 household members. You have ${members.length}.`;
    }
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setSubmitNote(err);
      return;
    }
    // Payment + account creation are handled in tasks 05 + 09. For now log
    // the payload so QA can see what would be submitted.
    setSubmitNote(
      "Form is valid. Payment + account provisioning is handled by Perennial signup tasks 05 and 09 — not yet wired to Stripe. See the browser console for the payload that would be sent.",
    );
    // eslint-disable-next-line no-console
    console.log("[perennial-signup] would submit", {
      plan: planKey,
      total_monthly: plan.priceMonthly,
      members: members.map((m) => ({
        is_primary: m.isPrimary,
        relation: m.relation,
        first_name: m.firstName,
        last_name: m.lastName,
        email: m.email,
        date_of_birth: m.dateOfBirth,
        birth_time: m.birthTime || null,
        birth_city: m.birthCity || null,
        birth_country: m.birthCountry || null,
        intentions: m.intentions || null,
        challenges: m.challenges || null,
        goals: m.goals || null,
      })),
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="border-b bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto max-w-5xl px-4 py-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="size-5 text-primary" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Perennial Mandalism
            </p>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Join the Perennial Mandalism household
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
            Choose your household plan, add the members who will share your
            practice, and we&apos;ll create a full account for each person
            after payment. Every household member gets their own login,
            charts, and Perennial Mandalism content access.
          </p>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: plan + members */}
          <div className="lg:col-span-2 space-y-6">
            {/* Plan selection */}
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

            {/* Member forms */}
            {members.map((m, idx) => {
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
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`fn-${m.id}`}>First name</Label>
                        <Input
                          id={`fn-${m.id}`}
                          value={m.firstName}
                          onChange={(e) =>
                            patch(m.id, { firstName: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`ln-${m.id}`}>Last name</Label>
                        <Input
                          id={`ln-${m.id}`}
                          value={m.lastName}
                          onChange={(e) =>
                            patch(m.id, { lastName: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`em-${m.id}`}>Email</Label>
                      <Input
                        id={`em-${m.id}`}
                        type="email"
                        value={m.email}
                        onChange={(e) =>
                          patch(m.id, { email: e.target.value })
                        }
                        placeholder="member@example.com"
                        required
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Each member must have a unique email. A system-generated
                        password is emailed after payment — no need to choose
                        one here.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`rel-${m.id}`}>Relation</Label>
                        <Select
                          value={m.relation}
                          onValueChange={(v) => patch(m.id, { relation: v })}
                        >
                          <SelectTrigger id={`rel-${m.id}`}>
                            <SelectValue placeholder="Select relation" />
                          </SelectTrigger>
                          <SelectContent>
                            {RELATIONS.filter(
                              (r) => isPrimary === (r.value === "self"),
                            ).map((r) => (
                              <SelectItem key={r.value} value={r.value}>
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`dob-${m.id}`}>Date of birth</Label>
                        <Input
                          id={`dob-${m.id}`}
                          type="date"
                          value={m.dateOfBirth}
                          onChange={(e) =>
                            patch(m.id, { dateOfBirth: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`bt-${m.id}`}>Birth time</Label>
                        <Input
                          id={`bt-${m.id}`}
                          type="time"
                          value={m.birthTime}
                          onChange={(e) =>
                            patch(m.id, { birthTime: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`bc-${m.id}`}>Birth city</Label>
                        <Input
                          id={`bc-${m.id}`}
                          value={m.birthCity}
                          onChange={(e) =>
                            patch(m.id, { birthCity: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`bcy-${m.id}`}>Birth country</Label>
                        <Input
                          id={`bcy-${m.id}`}
                          value={m.birthCountry}
                          onChange={(e) =>
                            patch(m.id, { birthCountry: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {/* Optional questionnaire (collapsed by default) */}
                    <button
                      type="button"
                      onClick={() =>
                        patch(m.id, { questionnaireOpen: !m.questionnaireOpen })
                      }
                      className="flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors pt-2"
                    >
                      <span>Optional questionnaire</span>
                      {m.questionnaireOpen ? (
                        <ChevronUp className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      )}
                    </button>
                    {m.questionnaireOpen && (
                      <div className="space-y-3 border-t pt-3">
                        <div className="space-y-1.5">
                          <Label htmlFor={`int-${m.id}`}>Intentions</Label>
                          <Textarea
                            id={`int-${m.id}`}
                            rows={2}
                            value={m.intentions}
                            onChange={(e) =>
                              patch(m.id, { intentions: e.target.value })
                            }
                            placeholder="What brings you to the practice?"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`ch-${m.id}`}>Current challenges</Label>
                          <Textarea
                            id={`ch-${m.id}`}
                            rows={2}
                            value={m.challenges}
                            onChange={(e) =>
                              patch(m.id, { challenges: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`gl-${m.id}`}>Goals</Label>
                          <Textarea
                            id={`gl-${m.id}`}
                            rows={2}
                            value={m.goals}
                            onChange={(e) =>
                              patch(m.id, { goals: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {canAdd && (
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

              <Button type="submit" className="w-full" size="lg">
                Continue to payment
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                Accounts are created after successful payment. You&apos;ll
                receive an email with a system-generated password for each
                household member.
              </p>
            </div>
          </aside>
        </form>
      </main>
    </div>
  );
}
