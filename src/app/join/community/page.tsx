"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, BookOpen, Users, Moon, Check, AlertCircle, Sparkles, Zap } from "lucide-react";
import { getUpcomingEntryDates } from "@/lib/mystery-school/quarters";

type MembershipType = "perennial_mandalism" | "mystery_school";

// ── Pricing API types ──────────────────────────────────────────────────────

interface CustomField {
  slug: string;
  label: string;
  value: string;
}

interface PricingPlan {
  id: string;
  plan_id: string;
  display_name: string;
  amount: number;
  mrp: number;
  currency: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  stripe_price_id: string;
  custom_fields: CustomField[];
}

// Maps API plan_id to the PlanKey used by the perennial-signup page
const PLAN_ID_TO_KEY: Record<string, "single" | "couple" | "family"> = {
  plan_pm_individual: "single",
  plan_pm_couple: "couple",
  plan_pm_family: "family",
};

// Representative icon for each plan tier
const PLAN_ICONS: Record<string, typeof Star> = {
  plan_pm_individual: Star,
  plan_pm_couple: Moon,
  plan_pm_family: Users,
};

// ── Perennial Plans Panel ──────────────────────────────────────────────────

function PerennialPlansPanel() {
  const router = useRouter();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch("/api/pricing/perennial_mandalism_community");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const data = await res.json();
        const activePlans: PricingPlan[] = (data.plans ?? []).filter(
          (p: PricingPlan) => p.is_active,
        );
        setPlans(activePlans);
        if (activePlans.length > 0) {
          setSelectedPlanId(activePlans[0].plan_id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  function handleChoosePlan(plan: PricingPlan) {
    const planKey = PLAN_ID_TO_KEY[plan.plan_id];
    if (!planKey) return;
    router.push(`/perennial-signup?plan=${planKey}`);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        <p className="text-sm">Loading plans…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        <AlertCircle className="size-5" />
        <p>Could not load pricing: {error}</p>
      </div>
    );
  }

  const selectedPlan = plans.find((p) => p.plan_id === selectedPlanId) ?? null;

  return (
    <div className="space-y-4">
      {/* Plan cards */}
      <div className="grid gap-3">
        {plans.map((plan) => {
          const isSelected = plan.plan_id === selectedPlanId;
          const Icon = PLAN_ICONS[plan.plan_id] ?? Sparkles;
          const savings = plan.custom_fields.find((f) => f.slug === "savings");
          const members = plan.custom_fields.find((f) => f.slug === "members");
          const discount =
            plan.mrp > plan.amount
              ? Math.round(((plan.mrp - plan.amount) / plan.mrp) * 100)
              : null;

          return (
            <button
              key={plan.plan_id}
              type="button"
              onClick={() => setSelectedPlanId(plan.plan_id)}
              className={`w-full text-left rounded-xl border p-4 transition-all duration-150 ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                  : "border-muted hover:border-primary/40 hover:bg-muted/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                      isSelected ? "bg-primary/15" : "bg-muted/60"
                    }`}
                  >
                    <Icon
                      className={`size-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{plan.display_name}</p>
                      {savings && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {savings.value}
                        </Badge>
                      )}
                    </div>
                    {members && (
                      <p className="text-xs text-muted-foreground">
                        {members.value === "1"
                          ? "1 member"
                          : members.value === "2"
                            ? "2 members"
                            : `${members.value} members`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <div className="text-right">
                    <p className="text-base font-bold tabular-nums">
                      ${plan.amount.toFixed(2)}
                      <span className="text-xs font-normal text-muted-foreground">/mo</span>
                    </p>
                    {discount !== null && (
                      <p className="text-[10px] text-muted-foreground line-through tabular-nums">
                        ${plan.mrp.toFixed(2)}
                      </p>
                    )}
                  </div>
                  {isSelected && <Check className="size-4 text-primary" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected plan details */}
      {selectedPlan && (
        <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground space-y-1.5">
          <p>{selectedPlan.description}</p>
          <ul className="space-y-1 pt-0.5">
            {selectedPlan.custom_fields
              .filter((f) => !["savings"].includes(f.slug))
              .map((f) => (
                <li key={f.slug} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <Check className="size-3 text-primary shrink-0" />
                    {f.label}
                  </span>
                  <span className="font-medium text-foreground">{f.value}</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      <Button
        className="w-full"
        disabled={!selectedPlan}
        onClick={() => selectedPlan && handleChoosePlan(selectedPlan)}
      >
        <Zap className="mr-2 size-4" />
        {selectedPlan
          ? `Join with ${selectedPlan.display_name}`
          : "Select a plan to continue"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        You&apos;ll complete your membership profile on the next page. No payment until you confirm.
      </p>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

const programs = {
  perennial_mandalism: {
    name: "Perennial Mandalism",
    description:
      "A living tradition uniting cosmic wisdom, sacred geometry, and divination practice.",
    features: [
      { icon: Moon, text: "New Moon & Full Moon group ceremonies" },
      { icon: Star, text: "Monthly wisdom circles with master diviners" },
      { icon: BookOpen, text: "Sacred texts and mandalist teachings library" },
      { icon: Users, text: "Private community of dedicated practitioners" },
    ],
  },
  mystery_school: {
    name: "Mystery School",
    description:
      "A structured path for those called to master the esoteric arts of astrology and tarot.",
    features: [
      { icon: BookOpen, text: "Structured courses from beginner to advanced" },
      { icon: Star, text: "Weekly live classes with senior practitioners" },
      { icon: Users, text: "Practice circles and peer study groups" },
      { icon: Moon, text: "Submit readings for mentor feedback" },
    ],
  },
};

export default function JoinCommunityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<MembershipType>("perennial_mandalism");
  const [planType, setPlanType] = useState<"individual" | "family">("individual");
  const nextMysterySchoolEntry = getUpcomingEntryDates()[0] ?? null;

  async function handleMysterySchoolSubscribe() {
    setLoading(true);
    try {
      const res = await fetch("/api/community/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipType: "mystery_school",
          planType: "individual",
          entry_quarter: nextMysterySchoolEntry?.quarter,
          entry_year: nextMysterySchoolEntry?.year,
        }),
      });

      if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent("/join/community")}`;
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Could not start checkout. Please try again.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Join the Community</h1>
            <p className="mt-2 text-muted-foreground">Choose the path that calls to you.</p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as MembershipType);
              setPlanType("individual");
            }}
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="perennial_mandalism">Perennial Mandalism</TabsTrigger>
              <TabsTrigger value="mystery_school">Mystery School</TabsTrigger>
            </TabsList>

            {/* ── Perennial Mandalism tab ── */}
            <TabsContent value="perennial_mandalism">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Left: features */}
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {programs.perennial_mandalism.description}
                  </p>
                  {programs.perennial_mandalism.features.map((f) => {
                    const Icon = f.icon;
                    return (
                      <div key={f.text} className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="size-4 text-primary" />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Right: live plan selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Choose Your Plan</CardTitle>
                    <CardDescription>
                      All plans include full Perennial Mandalism access.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PerennialPlansPanel />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── Mystery School tab ── */}
            <TabsContent value="mystery_school">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {programs.mystery_school.description}
                  </p>
                  {programs.mystery_school.features.map((f) => {
                    const Icon = f.icon;
                    return (
                      <div key={f.text} className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="size-4 text-primary" />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
                      </div>
                    );
                  })}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Subscribe to Mystery School</CardTitle>
                    <CardDescription>Secure checkout powered by Stripe.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
                      <p className="text-2xl font-bold">$97 + $27/month</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        $97 one-time enrolment · $27/mo thereafter
                      </p>
                      {nextMysterySchoolEntry && (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Next cohort:{" "}
                          <span className="font-medium text-foreground capitalize">
                            {nextMysterySchoolEntry.quarter} {nextMysterySchoolEntry.year}
                          </span>
                        </p>
                      )}
                    </div>

                    <Button className="w-full" onClick={handleMysterySchoolSubscribe} disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" /> Redirecting to Stripe…
                        </>
                      ) : (
                        "Subscribe to Mystery School"
                      )}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">
                      You will be redirected to Stripe for secure payment. Cancel anytime.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
