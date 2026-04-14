import Link from "next/link";
import { Check, Crown } from "lucide-react";
import { PLANS, PLAN_ORDER, type PlanId } from "@/lib/plans";
import { SectionContainer } from "@/components/shared/section-container";

export function PricingCard() {
  return (
    <section className="relative" id="pricing">
      <SectionContainer verticalPadding="lg">
        <div className="grid items-start gap-6 md:grid-cols-3">
          {PLAN_ORDER.map((planId) => {
            const p = PLANS[planId];
            return (
              <div
                key={planId}
                className={`relative overflow-hidden rounded-2xl border transition-all ${
                  p.isFeatured
                    ? "border-[#c9a84c]/40 bg-[#c9a84c]/[0.03] shadow-2xl shadow-[#c9a84c]/10 md:-mt-4"
                    : "border-white/[0.08] bg-white/[0.02]"
                }`}
              >
                {p.isFeatured && (
                  <div className="bg-gradient-to-r from-[#8b7a3a] via-[#c9a84c] to-[#e2c97e] px-4 py-2 text-center text-xs font-bold uppercase tracking-widest text-black">
                    <Crown className="mr-1 inline size-3" />
                    Best Value — Save $144/yr
                  </div>
                )}

                <div className="p-6 md:p-8">
                  <h3 className="font-display text-xl font-bold text-[#f5f0e8]">
                    {p.name}
                  </h3>
                  <p className="mt-1 text-sm text-[#b8bcd0]/60">{p.tagline}</p>

                  <div className="mt-5">
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-4xl font-bold text-[#f5f0e8]">
                        ${p.monthlyPrice}
                      </span>
                      <span className="text-[#b8bcd0]/60">/mo</span>
                    </div>
                    <p className="mt-1 text-sm text-[#b8bcd0]/50">
                      + ${p.setupPrice} one-time setup
                    </p>
                  </div>

                  <div className="mt-5 rounded-lg border border-[#c9a84c]/15 bg-[#c9a84c]/5 px-4 py-3">
                    <p className="text-sm font-medium text-[#c9a84c]">
                      {p.serviceLabel}
                    </p>
                  </div>

                  <ul className="mt-5 space-y-2.5">
                    {p.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#c9a84c]/10">
                          <Check className="size-3 text-[#c9a84c]" />
                        </div>
                        <span className="text-sm text-[#b8bcd0]/80">{h}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/get-started"
                    className={`mt-6 block w-full rounded-full py-3 text-center text-sm font-semibold transition-all ${
                      p.isFeatured
                        ? "bg-[#c9a84c] text-black shadow-lg shadow-[#c9a84c]/25 hover:bg-[#e2c97e]"
                        : "border border-[#c9a84c]/30 text-[#c9a84c] hover:border-[#c9a84c] hover:bg-[#c9a84c]/10"
                    }`}
                  >
                    Get Started
                  </Link>

                  {/* M6 — Guarantee note */}
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#b8bcd0]/50">
                    <svg className="size-3 shrink-0 text-[#c9a84c]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 10.5c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.25-8.25-3.286z" />
                    </svg>
                    30-day money-back guarantee
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </SectionContainer>
    </section>
  );
}
