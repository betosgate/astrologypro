import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Video,
  Calendar,
  CreditCard,
  Users,
  Sparkles,
  Share2,
  BarChart3,
  Zap,
  Heart,
  Shield,
  Check,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features",
};

const features = [
  {
    icon: Globe,
    title: "Your Branded Landing Page",
    description:
      "Get your own professional page at astrologypro.com/username. Customize your profile, showcase your services and specialties, and display client testimonials — all without building a website from scratch.",
    bullets: [
      "Personalized URL you can share anywhere",
      "Customizable bio, photo, and service descriptions",
      "Client testimonial display with star ratings",
      "Mobile-optimized responsive design",
    ],
  },
  {
    icon: Video,
    title: "HD Video Consultations",
    description:
      "Conduct professional readings over crystal-clear HD video. Share your screen to walk clients through natal charts, tarot spreads, and transit reports in real time.",
    bullets: [
      "HD video with screen sharing for charts and cards",
      "Automatic session recording for every consultation",
      "Shareable replay links for clients to revisit",
      "No software downloads required — browser-based",
    ],
  },
  {
    icon: Calendar,
    title: "Smart Booking System",
    description:
      "Let clients book sessions on their own with a timezone-aware scheduling system that syncs with your calendar. Collect birth data and intake information before the session even starts.",
    bullets: [
      "Google Calendar and Outlook integration",
      "Automatic timezone detection and conversion",
      "Custom intake questionnaires per service type",
      "Birth date, time, and location collection at booking",
    ],
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description:
      "Accept payments seamlessly through Stripe. Clients pay at the time of booking, overages are billed automatically, and you receive instant payouts to your bank account.",
    bullets: [
      "Stripe-powered secure checkout",
      "Automatic overage billing for extended sessions",
      "Instant payouts to your connected bank account",
      "Detailed transaction history and reporting",
    ],
  },
  {
    icon: Users,
    title: "Client Management (CRM)",
    description:
      "Keep all your client information organized in one place. Store birth data, session history, reading notes, and track your ongoing relationships with every client.",
    bullets: [
      "Secure birth data storage for every client",
      "Complete session history with notes and recordings",
      "Private practitioner notes per client",
      "Relationship tracking and follow-up reminders",
    ],
  },
  {
    icon: Sparkles,
    title: "Professional Astrology Tools",
    description:
      "Access full chart calculation software built right into the platform. Generate natal charts, synastry reports, transit overlays, and solar/lunar return charts without any third-party tools.",
    bullets: [
      "Western natal chart calculation engine",
      "Synastry and composite chart generation",
      "Real-time transit tracking and overlays",
      "Solar and lunar return chart calculations",
    ],
  },
  {
    icon: Sparkles,
    title: "Tarot Reading Tools",
    description:
      "Perform professional tarot readings with multiple spread types and a beautiful card display. Choose from classic layouts or create custom spreads for your unique reading style.",
    bullets: [
      "Multiple spread types: 3-card, Celtic Cross, and more",
      "Professional high-resolution card imagery",
      "Screen-share-ready card display for video sessions",
      "Custom spread builder for personalized layouts",
    ],
  },
  {
    icon: Share2,
    title: "Social Media Marketing",
    description:
      "Grow your practice with built-in social media tools. Auto-post content to Camera, MessageCircle, YouTube, and TikTok. Access a library of pre-made astrological content to keep your audience engaged.",
    bullets: [
      "Auto-posting to Camera, MessageCircle, YouTube, TikTok",
      "Pre-made content library with astrological themes",
      "Customizable post templates and scheduling",
      "Track engagement and follower growth",
    ],
  },
  {
    icon: BarChart3,
    title: "Affiliate Program",
    description:
      "Turn your clients into ambassadors. Set up an affiliate program with custom commission rates, track every referral, and monitor performance through a dedicated reporting dashboard.",
    bullets: [
      "Custom referral links for each affiliate",
      "Configurable commission rates and structures",
      "Real-time referral tracking and attribution",
      "Comprehensive reporting dashboard",
    ],
  },
  {
    icon: Zap,
    title: "Astrological Event Reminders",
    description:
      "Never let a client miss an important cosmic event. Automatically send email reminders before solar returns, Saturn returns, Jupiter returns, and other significant transits based on their birth data.",
    bullets: [
      "Automatic solar return birthday reminders",
      "Saturn and Jupiter return notifications",
      "Significant transit alerts based on natal chart",
      "Customizable email templates for each event type",
    ],
  },
  {
    icon: Heart,
    title: "Live Streaming",
    description:
      "Embed your YouTube or Globe Live streams directly on your AstrologyPro landing page. Host group readings, Q&A sessions, and educational content for your growing audience.",
    bullets: [
      "YouTube Live embed on your profile page",
      "Globe Live integration",
      "Schedule and promote upcoming streams",
      "Archive past streams for on-demand viewing",
    ],
  },
  {
    icon: Shield,
    title: "Session Recordings",
    description:
      "Every video consultation is automatically recorded and stored securely. Share recordings with clients via a private link, or post highlights to your social media channels.",
    bullets: [
      "Automatic recording of every video session",
      "Secure cloud storage with private access links",
      "One-click sharing to clients via email",
      "Social media sharing for promotional clips",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="px-4 py-24 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Everything You Need to Run Your{" "}
              <span className="text-primary">Divination Business</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              From branded landing pages to HD video sessions, smart booking to
              professional astrology software — AstrologyPro is your all-in-one
              platform.
            </p>
          </div>
        </section>

        {/* Feature Sections */}
        {features.map((feature, index) => {
          const Icon = feature.icon;
          const isEven = index % 2 === 0;

          return (
            <section
              key={feature.title}
              className={isEven ? "bg-background" : "bg-card/50"}
            >
              <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
                <div
                  className={`flex flex-col items-start gap-12 lg:flex-row lg:items-center ${
                    isEven ? "" : "lg:flex-row-reverse"
                  }`}
                >
                  {/* Text Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <h2 className="text-2xl font-bold sm:text-3xl">
                        {feature.title}
                      </h2>
                    </div>
                    <p className="mt-4 text-lg text-muted-foreground">
                      {feature.description}
                    </p>
                    <ul className="mt-6 space-y-3">
                      {feature.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span className="text-sm">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Placeholder Visual */}
                  <div className="flex-1">
                    <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-border/50 bg-muted/30">
                      <Icon className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        {/* CTA */}
        <section className="px-4 py-24 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Ready to <span className="text-primary">Start</span>?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join AstrologyPro today and get everything you need to build a
              thriving divination practice online.
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
