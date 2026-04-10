"use client";

import { Check, Crown } from "lucide-react";

export interface PlanData {
  plan_id: string;
  display_name: string;
  description: string | null;
  html_description: string | null;
  onetime_amount: number | null;
  onetime_currency: string | null;
  recurring_amount: number | null;
  recurring_currency: string | null;
  recurring_interval: string | null;
  mrp: number | null;
  stripe_price_id: string | null;
  custom_fields: { label: string; value: string; slug: string }[];
  sort_order: number;
}

export interface PricingItemData {
  item_key: string;
  item_name: string;
  description: string | null;
  html_description: string | null;
  plans: PlanData[];
}

function getCustomField(plan: PlanData, slug: string): string | null {
  return plan.custom_fields?.find((f) => f.slug === slug)?.value ?? null;
}

function parseHighlights(html: string | null): string[] {
  if (!html) return [];
  // Extract text from <li> tags
  const matches = html.match(/<li>(.*?)<\/li>/gi);
  if (!matches) return [];
  return matches.map((m) =>
    m.replace(/<\/?li>/gi, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
  );
}

interface DynamicPricingCardProps {
  plan: PlanData;
  isSelected?: boolean;
  onSelect?: (plan: PlanData) => void;
  linkMode?: boolean; // true = renders as <a href="/get-started">, false = renders as button
}

export function DynamicPricingCard({ plan, isSelected, onSelect, linkMode }: DynamicPricingCardProps) {
  const isFeatured = getCustomField(plan, "is_featured") === "true";
  const badgeText = getCustomField(plan, "badge_text");
  const serviceLabel = getCustomField(plan, "service_label");
  const highlights = parseHighlights(plan.html_description);
  const intervalLabel = plan.recurring_interval === "year" ? "/yr" : "/mo";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        isFeatured
          ? "border-[#c9a84c]/40 bg-[#c9a84c]/[0.03] shadow-2xl shadow-[#c9a84c]/10 md:-mt-4 md:mb-0"
          : "border-white/[0.08] bg-white/[0.02]"
      } ${isSelected ? "ring-2 ring-[#c9a84c]" : ""}`}
    >
      {/* Badge */}
      {isFeatured && (
        <div className="bg-gradient-to-r from-[#8b7a3a] via-[#c9a84c] to-[#e2c97e] px-4 py-2 text-center text-xs font-bold uppercase tracking-widest text-black">
          <Crown className="mr-1 inline size-3" />
          {badgeText ?? "Best Value"}
        </div>
      )}

      <div className="p-6 md:p-8">
        {/* Plan name */}
        <h3 className="font-display text-xl font-bold text-[#f5f0e8]">
          {plan.display_name}
        </h3>
        <p className="mt-1 text-sm text-[#b8bcd0]/60">{plan.description}</p>

        {/* Pricing */}
        <div className="mt-5">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-4xl font-bold text-[#f5f0e8]">
              ${plan.recurring_amount != null ? plan.recurring_amount : plan.onetime_amount ?? 0}
            </span>
            {plan.recurring_amount != null && (
              <span className="text-[#b8bcd0]/60">{intervalLabel}</span>
            )}
          </div>
          {plan.recurring_amount != null && plan.onetime_amount != null && (
            <p className="mt-1 text-sm text-[#b8bcd0]/50">
              + ${plan.onetime_amount} one-time setup
            </p>
          )}
          {plan.recurring_amount == null && plan.onetime_amount != null && (
            <p className="mt-1 text-sm text-[#b8bcd0]/50">one-time payment</p>
          )}
        </div>

        {/* Service label */}
        {serviceLabel && (
          <div className="mt-5 rounded-lg border border-[#c9a84c]/15 bg-[#c9a84c]/5 px-4 py-3">
            <p className="text-sm font-medium text-[#c9a84c]">{serviceLabel}</p>
          </div>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <ul className="mt-5 space-y-2.5">
            {highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#c9a84c]/10">
                  <Check className="size-3 text-[#c9a84c]" />
                </div>
                <span className="text-sm text-[#b8bcd0]/80">{h}</span>
              </li>
            ))}
          </ul>
        )}

        {/* CTA */}
        {linkMode ? (
          <a
            href="/get-started"
            className={`mt-6 block w-full rounded-full py-3 text-center text-sm font-semibold transition-all ${
              isFeatured
                ? "bg-[#c9a84c] text-black shadow-lg shadow-[#c9a84c]/25 hover:bg-[#e2c97e]"
                : "border border-[#c9a84c]/30 text-[#c9a84c] hover:border-[#c9a84c] hover:bg-[#c9a84c]/10"
            }`}
          >
            Get Started
          </a>
        ) : (
          <button
            type="button"
            onClick={() => onSelect?.(plan)}
            className={`mt-6 w-full rounded-full py-3 text-sm font-semibold transition-all ${
              isFeatured
                ? "bg-[#c9a84c] text-black shadow-lg shadow-[#c9a84c]/25 hover:bg-[#e2c97e]"
                : "border border-[#c9a84c]/30 text-[#c9a84c] hover:border-[#c9a84c] hover:bg-[#c9a84c]/10"
            }`}
          >
            {isSelected ? "Selected — Scroll to Sign Up" : `Choose ${plan.display_name}`}
          </button>
        )}

        {/* Guarantee */}
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#b8bcd0]/50">
          <svg className="size-3 shrink-0 text-[#c9a84c]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 10.5c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.25-8.25-3.286z" />
          </svg>
          30-day money-back guarantee
        </p>
      </div>
    </div>
  );
}

/** Renders a full pricing section for one item with title + plan cards */
interface DynamicPricingSectionProps {
  item: PricingItemData;
  selectedPlanId?: string;
  onSelectPlan?: (plan: PlanData) => void;
  linkMode?: boolean;
}

export function DynamicPricingSection({ item, selectedPlanId, onSelectPlan, linkMode }: DynamicPricingSectionProps) {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 text-center">
          <h2 className="font-display text-3xl font-bold text-[#f5f0e8] sm:text-4xl">
            Choose Your <span className="gold-text">Path</span>
          </h2>
          {item.description && (
            <p className="mt-3 text-[#b8bcd0]/70">{item.description}</p>
          )}
        </div>

        <div className="mt-12 grid items-start gap-6 md:grid-cols-3">
          {item.plans.map((plan) => (
            <DynamicPricingCard
              key={plan.plan_id}
              plan={plan}
              isSelected={selectedPlanId === plan.plan_id}
              onSelect={onSelectPlan}
              linkMode={linkMode}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
