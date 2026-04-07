"use client";

import { useState } from "react";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, BookOpen, Users, Moon, Check } from "lucide-react";
import { toast } from "sonner";
import { getUpcomingEntryDates } from "@/lib/mystery-school/quarters";

type MembershipType = "perennial_mandalism" | "mystery_school";
type PlanType = "individual" | "family";

export default function JoinCommunityPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<MembershipType>("perennial_mandalism");
  const [planType, setPlanType] = useState<PlanType>("individual");
  const nextMysterySchoolEntry = getUpcomingEntryDates()[0] ?? null;

  async function handleSubscribe() {
    setLoading(true);
    try {
      const mysterySchoolPayload =
        activeTab === "mystery_school"
          ? {
              entry_quarter: nextMysterySchoolEntry?.quarter,
              entry_year: nextMysterySchoolEntry?.year,
            }
          : {};

      const res = await fetch("/api/community/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipType: activeTab,
          planType: activeTab === "mystery_school" ? "individual" : planType,
          ...mysterySchoolPayload,
        }),
      });

      if (res.status === 401) {
        // Not logged in — redirect to login then back here
        window.location.href = `/login?next=${encodeURIComponent("/join/community")}`;
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not start checkout. Please try again.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const programs: Record<MembershipType, {
    name: string;
    description: string;
    features: { icon: typeof Star; text: string }[];
    pricing: { label: string; price: string; priceType: PlanType | null }[];
  }> = {
    perennial_mandalism: {
      name: "Perennial Mandalism",
      description: "A living tradition uniting cosmic wisdom, sacred geometry, and divination practice.",
      features: [
        { icon: Moon, text: "New Moon & Full Moon group ceremonies" },
        { icon: Star, text: "Monthly wisdom circles with master diviners" },
        { icon: BookOpen, text: "Sacred texts and mandalist teachings library" },
        { icon: Users, text: "Private community of dedicated practitioners" },
      ],
      pricing: [
        { label: "Individual", price: "$9.97/month", priceType: "individual" },
        { label: "Family", price: "$19.97/month", priceType: "family" },
      ],
    },
    mystery_school: {
      name: "Mystery School",
      description: "A structured path for those called to master the esoteric arts of astrology and tarot.",
      features: [
        { icon: BookOpen, text: "Structured courses from beginner to advanced" },
        { icon: Star, text: "Weekly live classes with senior practitioners" },
        { icon: Users, text: "Practice circles and peer study groups" },
        { icon: Moon, text: "Submit readings for mentor feedback" },
      ],
      pricing: [
        { label: "Enrollment + Monthly", price: "$97 one-time + $27/month", priceType: null },
      ],
    },
  };

  const prog = programs[activeTab];

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Join the Community</h1>
            <p className="mt-2 text-muted-foreground">Choose the path that calls to you.</p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as MembershipType); setPlanType("individual"); }}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="perennial_mandalism">Perennial Mandalism</TabsTrigger>
              <TabsTrigger value="mystery_school">Mystery School</TabsTrigger>
            </TabsList>

            {(["perennial_mandalism", "mystery_school"] as const).map((key) => {
              const p = programs[key];
              return (
                <TabsContent key={key} value={key}>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">{p.description}</p>
                      {p.features.map((f) => {
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
                        <CardTitle>Subscribe to {p.name}</CardTitle>
                        <CardDescription>Secure checkout powered by Stripe.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Plan selection for Perennial Mandalism */}
                        {p.pricing.length > 1 && (
                          <div className="grid gap-2">
                            {p.pricing.map((plan) => (
                              <button
                                key={plan.label}
                                type="button"
                                onClick={() => plan.priceType && setPlanType(plan.priceType)}
                                className={`flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                                  planType === plan.priceType
                                    ? "border-primary bg-primary/5"
                                    : "border-muted hover:border-primary/40"
                                }`}
                              >
                                <span className="text-sm font-medium">{plan.label}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold">{plan.price}</span>
                                  {planType === plan.priceType && (
                                    <Check className="size-4 text-primary" />
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Single price (Mystery School) */}
                        {p.pricing.length === 1 && (
                          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
                            <p className="text-2xl font-bold">{p.pricing[0].price}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Cancel anytime · Billed via Stripe</p>
                            {key === "mystery_school" && nextMysterySchoolEntry && (
                              <p className="mt-3 text-xs text-muted-foreground">
                                Next cohort: <span className="font-medium text-foreground capitalize">
                                  {nextMysterySchoolEntry.quarter} {nextMysterySchoolEntry.year}
                                </span>
                              </p>
                            )}
                          </div>
                        )}

                        <Button className="w-full" onClick={handleSubscribe} disabled={loading}>
                          {loading ? (
                            <><Loader2 className="mr-2 size-4 animate-spin" /> Redirecting to Stripe…</>
                          ) : (
                            `Subscribe to ${p.name}`
                          )}
                        </Button>

                        <p className="text-center text-xs text-muted-foreground">
                          You will be redirected to Stripe for secure payment. Cancel anytime.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
