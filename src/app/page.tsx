import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Hero } from "@/components/marketing/hero";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { RevenueCalculator } from "@/components/marketing/revenue-calculator";
import { EmailCapture } from "@/components/marketing/email-capture";
import { DivinerTestimonials } from "@/components/marketing/diviner-testimonials";
import { PricingCard } from "@/components/marketing/pricing-card";

export const metadata: Metadata = {
  title: "AstrologyPro - Run Your Divination Business",
  description:
    "The all-in-one platform for astrologers and tarot readers. Your own branded page, booking system, HD video sessions, CRM, and marketing tools.",
  openGraph: {
    title: "AstrologyPro - Run Your Divination Business",
    description:
      "Get your own branded astrology page, booking system, video sessions, and marketing tools — all in one platform.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AstrologyPro - Run Your Divination Business",
    description:
      "Get your own branded astrology page, booking system, video sessions, and marketing tools — all in one platform.",
  },
};

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex-1">
        <Hero />
        <RevenueCalculator />
        <FeatureGrid />
        <EmailCapture />
        <DivinerTestimonials />
        <PricingCard />
      </main>
      <MarketingFooter />
    </div>
  );
}
