import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Star } from "lucide-react";
import { ZodiacWheel } from "./astro-decorations";

const included = [
  "Your branded landing page",
  "19 consultation types (Astrology & Tarot)",
  "HD video sessions with screen sharing",
  "Automatic session recording & sharing",
  "Smart booking & calendar sync",
  "Stripe payment processing",
  "Client CRM & birth data management",
  "Affiliate program tools",
  "Social media auto-posting",
  "Email & SMS notifications",
  "Astrological event reminders",
  "Client testimonials system",
  "YouTube & Facebook Live embed",
  "Full astrology & tarot software access",
  "Post-session follow-up automation",
];

export function PricingCard() {
  return (
    <section className="relative px-4 py-14 sm:px-6 lg:px-8" id="pricing">
      {/* Background zodiac wheel — gold tinted */}
      <ZodiacWheel className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 text-[#c9a84c]/10" />

      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 text-sm text-[#c9a84c]">
          <Star className="h-4 w-4" />
          <span>One Plan, Everything Included</span>
          <Star className="h-4 w-4" />
        </div>
        <h2 className="font-display text-3xl font-bold text-[#f5f0e8] sm:text-4xl lg:text-5xl">
          Simple,{" "}
          <span className="gold-text">All-Inclusive</span>{" "}
          Pricing
        </h2>
        <p className="mt-4 text-lg text-[#b8bcd0]">
          No hidden fees. No per-feature charges. Everything you need in one plan.
        </p>
      </div>
      <div className="relative mx-auto mt-12 max-w-lg">
        <div className="glass-card relative overflow-hidden rounded-2xl border-[#c9a84c]/30 p-8 shadow-2xl shadow-[#c9a84c]/5">
          {/* Gold gradient accent stripe at top */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#8b7a3a] via-[#c9a84c] to-[#e2c97e]" />

          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#c9a84c]/10 px-3 py-1 text-xs font-medium text-[#c9a84c]">
              <Sparkles className="h-3 w-3" />
              PROFESSIONAL PLAN
            </div>
            <div className="mt-4">
              <span className="font-display text-5xl font-bold text-[#f5f0e8]">$149</span>
              <span className="text-[#b8bcd0]">/month</span>
            </div>
            <p className="mt-2 text-sm text-[#b8bcd0]/70">
              + $197 one-time setup fee
            </p>
          </div>

          <div className="cosmic-divider my-6" />

          <ul className="space-y-3">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c9a84c]/10">
                  <Check className="h-3 w-3 text-[#c9a84c]" />
                </div>
                <span className="text-sm text-[#b8bcd0]">{item}</span>
              </li>
            ))}
          </ul>

          <Button size="lg" className="mt-8 w-full rounded-full bg-[#c9a84c] text-base font-semibold text-black shadow-lg shadow-[#c9a84c]/25 hover:bg-[#e2c97e]" asChild>
            <Link href="/get-started">Start Your Practice Today</Link>
          </Button>

          <p className="mt-4 text-center text-xs text-[#b8bcd0]/50">
            30-day money-back guarantee. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
