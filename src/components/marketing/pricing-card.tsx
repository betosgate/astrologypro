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
    <section className="relative px-4 py-24 sm:px-6 lg:px-8" id="pricing">
      {/* Background zodiac wheel */}
      <ZodiacWheel className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 text-purple-400 opacity-20" />

      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 text-sm text-primary">
          <Star className="h-4 w-4" />
          <span>One Plan, Everything Included</span>
          <Star className="h-4 w-4" />
        </div>
        <h2 className="text-3xl font-bold sm:text-4xl">
          Simple, <span className="text-primary">All-Inclusive</span> Pricing
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          No hidden fees. No per-feature charges. Everything you need in one plan.
        </p>
      </div>
      <div className="relative mx-auto mt-12 max-w-lg">
        <div className="relative overflow-hidden rounded-2xl border-2 border-primary/50 bg-card p-8 shadow-2xl shadow-primary/10">
          {/* Decorative gradient at top */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 via-primary to-indigo-500" />

          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              PROFESSIONAL PLAN
            </div>
            <div className="mt-4">
              <span className="text-5xl font-bold">$149</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              + $197 one-time setup fee
            </p>
          </div>

          <div className="my-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          <ul className="space-y-3">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>

          <Button size="lg" className="mt-8 w-full text-base shadow-lg shadow-primary/25" asChild>
            <Link href="/get-started">Start Your Practice Today</Link>
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            30-day money-back guarantee. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
