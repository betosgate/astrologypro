"use client";

import { useEffect, useState } from "react";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCcw, Check, Users } from "lucide-react";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PricingPlan {
  plan_id: string;
  display_name: string;
  onetime_amount: number | null;
  onetime_currency: string | null;
  recurring_amount: number | null;
  recurring_currency: string | null;
  recurring_interval: string | null;
  mrp: number | null;
  stripe_price_id: string | null;
  description: string | null;
  custom_fields: Array<{ label: string; value: string; slug: string }> | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ResubscribePage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/pricing/perennial_mandalism_community")
      .then((r) => r.json())
      .then((data) => {
        const fetchedPlans: PricingPlan[] = data?.plans ?? [];
        setPlans(fetchedPlans);
        // Default to individual plan
        const individual = fetchedPlans.find((p) => p.plan_id === "plan_pm_individual");
        if (individual) setSelectedPlan(individual.plan_id);
        else if (fetchedPlans.length > 0) setSelectedPlan(fetchedPlans[0].plan_id);
      })
      .catch(() => {
        toast.error("Could not load plans. Please refresh the page.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleResubscribe() {
    if (!selectedPlan) return;
    setSubmitting(true);
    try {
      const planType = selectedPlan.includes("family")
        ? "family"
        : selectedPlan.includes("couple")
          ? "couple"
          : "individual";

      const res = await fetch("/api/community/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipType: "perennial_mandalism",
          planType,
        }),
      });

      if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent("/join/community/resubscribe")}`;
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
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
              <RefreshCcw className="size-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
            <p className="mt-2 text-muted-foreground">
              Your Perennial Mandalism membership is no longer active.
              Resubscribe to pick up where you left off — your profile,
              progress, and community connections are all still here.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5" />
                Resubscribe to Perennial Mandalism
              </CardTitle>
              <CardDescription>
                Choose your plan and complete checkout via Stripe. Your existing
                account data will be restored immediately.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : plans.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No plans available. Please contact support.
                </p>
              ) : (
                <div className="grid gap-2">
                  {plans.map((plan) => {
                    const isSelected = selectedPlan === plan.plan_id;
                    const price = plan.recurring_amount;
                    const currency = plan.recurring_currency ?? "USD";
                    const interval = plan.recurring_interval ?? "month";

                    return (
                      <button
                        key={plan.plan_id}
                        type="button"
                        onClick={() => setSelectedPlan(plan.plan_id)}
                        className={`flex items-center justify-between rounded-lg border p-4 text-left transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-muted hover:border-primary/40"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="text-sm font-semibold">{plan.display_name}</span>
                          {plan.description && (
                            <p className="text-xs text-muted-foreground">{plan.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {plan.mrp != null && plan.mrp > (price ?? 0) && (
                            <span className="text-xs text-muted-foreground line-through">
                              {formatCurrency(plan.mrp, currency)}
                            </span>
                          )}
                          {price != null && (
                            <span className="text-sm font-bold">
                              {formatCurrency(price, currency)}/{interval}
                            </span>
                          )}
                          {isSelected && <Check className="size-4 text-primary" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleResubscribe}
                disabled={submitting || !selectedPlan || loading}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Redirecting to Stripe…
                  </>
                ) : (
                  "Resubscribe Now"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Secure checkout via Stripe. Cancel anytime.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
