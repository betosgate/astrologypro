import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Hero } from "@/components/marketing/hero";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { RevenueCalculator } from "@/components/marketing/revenue-calculator";
import { DivinerTestimonials } from "@/components/marketing/diviner-testimonials";
import { PricingCard } from "@/components/marketing/pricing-card";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex-1">
        <Hero />
        <FeatureGrid />
        <RevenueCalculator />
        <DivinerTestimonials />
        <PricingCard />
      </main>
      <MarketingFooter />
    </div>
  );
}
