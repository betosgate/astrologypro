import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const included = [
  "Your branded landing page",
  "19 consultation types (Astrology & Tarot)",
  "HD video sessions with screen sharing",
  "Automatic session recording",
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
  "Session recording sharing",
];

export function PricingCard() {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8" id="pricing">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">
          Simple, <span className="text-primary">All-Inclusive</span> Pricing
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          One plan. Everything included. No hidden fees.
        </p>
      </div>
      <div className="mx-auto mt-12 max-w-lg">
        <div className="rounded-2xl border-2 border-primary/50 bg-card p-8 shadow-xl shadow-primary/5">
          <div className="text-center">
            <h3 className="text-2xl font-bold">Professional Plan</h3>
            <div className="mt-4">
              <span className="text-5xl font-bold">$149</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              + $197 one-time setup fee
            </p>
          </div>
          <ul className="mt-8 space-y-3">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
          <Button size="lg" className="mt-8 w-full text-base" asChild>
            <Link href="/get-started">Start Your Practice Today</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
