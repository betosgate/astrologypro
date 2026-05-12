"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type CustomField = { label: string; slug: string; value: string };

type PricingPlan = {
  plan_id: string;
  display_name: string;
  description: string | null;
  onetime_amount: number | null;
  onetime_currency: string | null;
  recurring_amount: number | null;
  recurring_currency: string | null;
  recurring_interval: string | null;
  html_description: string | null;
  custom_fields?: CustomField[];
};

type PricingItem = {
  item_key?: string;
  item_name: string;
  description: string | null;
  plans: PricingPlan[];
};

type PlanOption = {
  id: string;
  name: string;
  description: string;
  onetimeAmount: number | null;
  onetimeCurrency: string;
  recurringAmount: number | null;
  recurringCurrency: string;
  recurringInterval: string | null;
  highlights: string[];
  isFeatured: boolean;
  badgeText: string;
};

function getField(fields: CustomField[] | undefined, slug: string) {
  return fields?.find((field) => field.slug === slug)?.value ?? null;
}

function parseHighlights(html: string | null): string[] {
  if (!html) return [];
  const liMatches = html.match(/<li\b[^>]*>([\s\S]*?)<\/li>/gi);
  const pMatches = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/gi);
  const matches = liMatches?.length ? liMatches : pMatches ?? [];
  return matches
    .map((entry) =>
      entry
        .replace(/<\/?(li|p)\b[^>]*>/gi, "")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim()
    )
    .filter(Boolean);
}

function formatMoney(amount: number | null, currency: string | null) {
  if (amount == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency ?? "USD").toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPlanPrice(plan: PlanOption) {
  const parts: string[] = [];
  const oneTime = formatMoney(plan.onetimeAmount, plan.onetimeCurrency);
  if (oneTime) parts.push(`${oneTime} one-time`);
  const recurring = formatMoney(plan.recurringAmount, plan.recurringCurrency);
  if (recurring) parts.push(`${recurring}/${plan.recurringInterval ?? "month"}`);
  return parts.join(" + ");
}

export default function TraineePlanSelectionPage() {
  const [item, setItem] = useState<PricingItem | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadPricing() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/pricing?keys=trainee_program", {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          items?: PricingItem[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load pricing.");
        }
        const next = payload.items?.[0] ?? null;
        if (!active) return;
        setItem(next);

        const planOrder = (next?.plans ?? [])
          .map((plan) => ({
            id: plan.plan_id,
            sort: Number(getField(plan.custom_fields, "sort_order") ?? "99"),
            featured: getField(plan.custom_fields, "is_featured") === "true",
          }))
          .sort((a, b) => a.sort - b.sort);
        setSelectedPlan(
          planOrder.find((plan) => plan.featured)?.id ?? planOrder[0]?.id ?? ""
        );
      } catch (err) {
        if (!active) return;
        setItem(null);
        setError(err instanceof Error ? err.message : "Failed to load pricing.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadPricing();
    return () => {
      active = false;
    };
  }, []);

  const plans = useMemo<PlanOption[]>(() => {
    return (item?.plans ?? [])
      .map((plan) => ({
        id: plan.plan_id,
        name: plan.display_name,
        description: plan.description ?? "",
        onetimeAmount: plan.onetime_amount,
        onetimeCurrency:
          plan.onetime_currency ?? plan.recurring_currency ?? "USD",
        recurringAmount: plan.recurring_amount,
        recurringCurrency:
          plan.recurring_currency ?? plan.onetime_currency ?? "USD",
        recurringInterval: plan.recurring_interval ?? null,
        highlights: parseHighlights(plan.html_description),
        isFeatured: getField(plan.custom_fields, "is_featured") === "true",
        badgeText: getField(plan.custom_fields, "badge_text") ?? "Recommended",
      }))
      .sort((a, b) => {
        const aSort = Number(
          getField(
            item?.plans.find((plan) => plan.plan_id === a.id)?.custom_fields,
            "sort_order"
          ) ?? "99"
        );
        const bSort = Number(
          getField(
            item?.plans.find((plan) => plan.plan_id === b.id)?.custom_fields,
            "sort_order"
          ) ?? "99"
        );
        return aSort - bSort;
      });
  }, [item]);

  async function handleCheckout() {
    if (!selectedPlan) {
      setError("Please select a plan.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/join/trainee/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan }),
      });
      const payload = (await response.json()) as {
        checkout_url?: string;
        error?: string;
      };
      if (!response.ok || !payload.checkout_url) {
        throw new Error(payload.error ?? "Failed to start checkout.");
      }
      window.location.href = payload.checkout_url;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start checkout.";
      setError(message);
      toast.error(message);
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#070716] text-white">
      <MarketingHeader />
      <main className="flex flex-1 items-start justify-center bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.24),transparent_35%),radial-gradient(circle_at_bottom,rgba(236,72,153,0.10),transparent_30%),linear-gradient(180deg,#100f24_0%,#070716_100%)] px-4 py-10 sm:px-6">
        <div className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-violet-500/20 bg-gradient-to-b from-violet-950/95 to-slate-950/95 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="border-b border-violet-500/15 bg-gradient-to-r from-violet-900/95 to-fuchsia-900/70 px-6 py-8 sm:px-10">
            <Badge className="mb-3 w-fit border-violet-400/30 bg-violet-400/15 text-[10px] font-bold uppercase tracking-widest text-violet-200 hover:bg-violet-400/15">
              Trainee Program
            </Badge>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-violet-50 sm:text-4xl">
              <GraduationCap className="size-7 text-violet-200" />
              Choose Your Training Plan
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/65 sm:text-base">
              Complete payment for the certified trainee program, then continue
              to your profile setup and training dashboard.
            </p>
          </div>

          <div className="px-6 py-6 sm:px-10">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="size-8 animate-spin text-violet-200" />
              </div>
            ) : plans.length === 0 ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                {error ?? "No trainee plans are currently available."}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {plans.map((plan) => {
                  const selected = selectedPlan === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`relative rounded-2xl border p-5 text-left transition ${
                        selected
                          ? "border-violet-300 bg-violet-400/15 shadow-lg shadow-violet-900/30"
                          : "border-white/10 bg-white/[0.04] hover:border-violet-300/50"
                      }`}
                    >
                      {plan.isFeatured && (
                        <Badge className="mb-3 border-violet-300/30 bg-violet-300/15 text-violet-100 hover:bg-violet-300/15">
                          {plan.badgeText}
                        </Badge>
                      )}
                      <h2 className="text-xl font-semibold text-white">{plan.name}</h2>
                      {plan.description && (
                        <p className="mt-1 text-sm text-white/60">{plan.description}</p>
                      )}
                      <p className="mt-4 text-lg font-bold text-violet-100">
                        {formatPlanPrice(plan)}
                      </p>
                      {plan.highlights.length > 0 && (
                        <ul className="mt-4 space-y-2">
                          {plan.highlights.map((highlight) => (
                            <li key={highlight} className="flex gap-2 text-sm text-white/70">
                              <Check className="mt-0.5 size-4 shrink-0 text-violet-200" />
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {error && plans.length > 0 && (
              <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            )}

            <Button
              type="button"
              onClick={handleCheckout}
              disabled={loading || submitting || !selectedPlan}
              className="mt-6 h-14 w-full rounded-full bg-violet-200 text-lg font-semibold text-violet-950 shadow-lg shadow-violet-900/30 hover:bg-violet-100"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" />
                  Starting checkout...
                </>
              ) : (
                <>
                  Continue to Payment
                  <ArrowRight className="ml-2 size-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
