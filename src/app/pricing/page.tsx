import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { PricingCard } from "@/components/marketing/pricing-card";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { FaqSection } from "@/components/marketing/faq-section";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pricing",
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="px-4 py-24 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Simple,{" "}
              <span className="text-primary">Transparent</span> Pricing
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Three plans, one powerful platform. Pick the services that match
              your practice — tarot, astrology, or both. Every plan includes
              the full business toolkit.
            </p>
          </div>
        </section>

        {/* Pricing Card */}
        <PricingCard />

        {/* Cost Comparison */}
        <ComparisonTable />

        {/* FAQ */}
        <FaqSection />

        {/* CTA */}
        <section className="bg-card/50 px-4 py-24 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Ready to Build Your{" "}
              <span className="text-primary">Practice</span>?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join hundreds of practitioners already growing their business
              with AstrologyPro. Plans start at just $97/mo.
            </p>
            <Button size="lg" className="mt-8 text-base" asChild>
              <Link href="/get-started">Get Started Now</Link>
            </Button>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
