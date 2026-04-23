"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type CustomField = {
  label: string;
  slug: string;
  value: string;
};

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
  stripe_price_id: string | null;
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

function getField(fields: CustomField[] | undefined, slug: string): string | null {
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
        .trim(),
    )
    .filter(Boolean);
}

function formatMoney(amount: number | null, currency: string | null) {
  if (amount == null) return null;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency ?? "USD").toUpperCase(),
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${(currency ?? "USD").toUpperCase()} ${amount.toLocaleString()}`;
  }
}

function formatPlanPrice(plan: PlanOption) {
  const parts: string[] = [];

  const oneTime = formatMoney(plan.onetimeAmount, plan.onetimeCurrency);
  if (oneTime) parts.push(`${oneTime} one-time`);

  const recurring = formatMoney(plan.recurringAmount, plan.recurringCurrency);
  if (recurring) {
    const interval = plan.recurringInterval ?? "month";
    parts.push(`${recurring}/${interval}`);
  }

  return parts.join(" + ");
}

export function DivinerUpgradeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [item, setItem] = useState<PricingItem | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSubmitting(false);
      return;
    }

    let active = true;

    async function loadPricing() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          "/api/pricing?keys=professional_divination_course",
          { cache: "no-store" },
        );

        const payload = (await response.json()) as { items?: PricingItem[]; error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load pricing.");
        }

        const nextItem = payload.items?.[0] ?? null;
        if (!active) return;

        setItem(nextItem);

        const planOrder = (nextItem?.plans ?? [])
          .map((plan) => ({
            id: plan.plan_id,
            sort: Number(getField(plan.custom_fields, "sort_order") ?? "99"),
            featured: getField(plan.custom_fields, "is_featured") === "true",
          }))
          .sort((a, b) => a.sort - b.sort);

        const featured =
          planOrder.find((plan) => plan.featured)?.id ?? planOrder[0]?.id ?? "";
        setSelectedPlan(featured);
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
  }, [open]);

  const plans = useMemo<PlanOption[]>(() => {
    return (item?.plans ?? [])
      .map((plan) => ({
        id: plan.plan_id,
        name: plan.display_name,
        description: plan.description ?? "",
        onetimeAmount: plan.onetime_amount,
        onetimeCurrency: plan.onetime_currency ?? plan.recurring_currency ?? "USD",
        recurringAmount: plan.recurring_amount,
        recurringCurrency: plan.recurring_currency ?? plan.onetime_currency ?? "USD",
        recurringInterval: plan.recurring_interval ?? null,
        highlights: parseHighlights(plan.html_description),
        isFeatured: getField(plan.custom_fields, "is_featured") === "true",
        badgeText: getField(plan.custom_fields, "badge_text") ?? "Recommended",
      }))
      .sort((a, b) => {
        const aSort = Number(
          getField(item?.plans.find((plan) => plan.plan_id === a.id)?.custom_fields, "sort_order") ?? "99",
        );
        const bSort = Number(
          getField(item?.plans.find((plan) => plan.plan_id === b.id)?.custom_fields, "sort_order") ?? "99",
        );
        return aSort - bSort;
      });
  }, [item]);

  const activePlan = plans.find((plan) => plan.id === selectedPlan) ?? plans[0] ?? null;

  async function handleCheckout() {
    if (!selectedPlan) {
      setError("Please select a plan.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/trainee/diviner-upgrade/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan }),
      });

      const payload = (await response.json()) as { checkout_url?: string; error?: string };
      if (!response.ok || !payload.checkout_url) {
        throw new Error(payload.error ?? "Failed to start checkout.");
      }

      window.location.href = payload.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout.");
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !submitting && onClose()}>
      <DialogContent className="!w-[calc(100vw-2rem)] sm:!w-[calc(100vw-4rem)] !max-w-[820px] overflow-hidden border-amber-500/20 bg-gradient-to-b from-amber-950/95 to-slate-950/95 p-0 backdrop-blur-xl">
        <div className="flex max-h-[90vh] flex-col overflow-hidden">
        <div className="relative shrink-0 overflow-hidden border-b border-amber-500/15 bg-gradient-to-r from-amber-900/95 to-yellow-900/80 px-6 py-6 backdrop-blur-xl">
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-6 right-20 size-28 rounded-full bg-yellow-500/10 blur-2xl" />
          <DialogHeader className="relative">
            <Badge className="mb-3 w-fit border-amber-500/30 bg-amber-500/15 text-[10px] font-bold uppercase tracking-widest text-amber-300 hover:bg-amber-500/15">
              Professional Practice
            </Badge>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-amber-50">
              <Sparkles className="size-5 text-amber-300" />
              Become a Diviner
            </DialogTitle>
            <DialogDescription className="mt-1 max-w-2xl text-sm text-white/65">
              Choose your Professional Divination Course plan. After payment,
              we’ll unlock your diviner setup and route you into onboarding.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col">
          <div className="min-w-0 border-b border-white/10 px-6 py-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-300/80">
              Choose your option
            </p>

            {loading ? (
              <div className="flex min-h-[260px] items-center justify-center text-sm text-white/60">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Loading live pricing…
              </div>
            ) : plans.length === 0 ? (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200">
                {error ?? "No active Professional Divination Course plans are configured."}
              </div>
            ) : (
              <div className="space-y-3">
                {plans.map((plan) => {
                  const selected = plan.id === activePlan?.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`w-full rounded-xl border p-4 text-left transition-all ${
                        selected
                          ? "border-amber-400/60 bg-amber-500/12 ring-1 ring-amber-400/35"
                          : "border-white/10 bg-white/5 hover:border-amber-400/30 hover:bg-white/[0.07]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-base font-bold text-white">{plan.name}</p>
                            {plan.isFeatured && (
                              <Badge className="border-amber-500/30 bg-amber-500/15 text-[10px] uppercase tracking-widest text-amber-200 hover:bg-amber-500/15">
                                {plan.badgeText}
                              </Badge>
                            )}
                          </div>
                          {plan.description && (
                            <p className="mt-1 text-sm text-white/55">{plan.description}</p>
                          )}
                        </div>
                        <span
                          className={`mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                            selected
                              ? "border-amber-300 bg-amber-400 text-slate-950"
                              : "border-white/20 text-transparent"
                          }`}
                        >
                          <Check className="size-3.5" />
                        </span>
                      </div>
                      <p className="mt-3 text-lg font-semibold text-amber-200">
                        {formatPlanPrice(plan)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="min-w-0 border-b border-white/10 px-6 py-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-300/80">
              What you’re unlocking
            </p>

            {activePlan ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-500/15 bg-white/[0.04] p-4">
                  <p className="text-sm font-semibold text-white">{activePlan.name}</p>
                  <p className="mt-1 text-xl font-bold text-amber-200">
                    {formatPlanPrice(activePlan)}
                  </p>
                  {item?.description && (
                    <p className="mt-2 text-sm leading-relaxed text-white/55">
                      {item.description}
                    </p>
                  )}
                </div>

                <ul className="space-y-2.5">
                  {(activePlan.highlights.length > 0
                    ? activePlan.highlights
                    : [
                        "Professional diviner onboarding unlocked after payment",
                        "Live pricing synced from the admin pricing configuration",
                        "Your trainee account can continue while your diviner profile is provisioned",
                      ]
                  ).map((highlight) => (
                    <li key={highlight} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                        <Check className="size-3 text-amber-300" />
                      </span>
                      <span className="text-sm leading-relaxed text-white/72">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/60">
                Select a plan to review its live pricing and included details.
              </div>
            )}

          </div>

          <div className="min-w-0 px-6 py-5">
            <div className="rounded-xl border border-amber-500/15 bg-white/[0.04] p-4">
              {error && (
                <p className="mb-3 text-sm text-red-300">{error}</p>
              )}
              <Button
                onClick={handleCheckout}
                disabled={loading || submitting || !activePlan}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 font-bold text-slate-950 hover:from-amber-400 hover:to-yellow-400"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Redirecting to payment…
                  </>
                ) : (
                  <>
                    Continue to Payment
                    <ArrowRight className="ml-2 size-4" />
                  </>
                )}
              </Button>
              <p className="mt-2 text-center text-xs text-white/40">
                Payment opens directly in Stripe Checkout.
              </p>
            </div>
          </div>
        </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
