import {
  Globe, Video, Calendar, CreditCard, Users, Share2,
  MessageSquare, BarChart3, Sparkles, Shield, Zap, Heart,
  Moon, Sun, Star,
} from "lucide-react";
import { StarField } from "./astro-decorations";

const features = [
  {
    icon: Globe,
    title: "Your Branded Page",
    description: "Get a professional landing page at astrologypro.com/yourname. Showcase your services, testimonials, and book clients instantly.",
  },
  {
    icon: Video,
    title: "HD Video Sessions",
    description: "Crystal-clear video with screen sharing. Show your charts and cards live. Every session auto-recorded for your clients.",
  },
  {
    icon: Sun,
    title: "Astrology Chart Tools",
    description: "Full access to professional natal chart calculation, solar returns, synastry, transits, and more during live sessions.",
  },
  {
    icon: Moon,
    title: "Tarot Reading Software",
    description: "Professional tarot spreads — Celtic Cross, Horseshoe, Astrological, and more. Display cards beautifully during sessions.",
  },
  {
    icon: Calendar,
    title: "Smart Booking",
    description: "Clients book based on your real availability. Google Calendar sync. Automatic timezone conversion and reminders.",
  },
  {
    icon: CreditCard,
    title: "Instant Payments",
    description: "Accept payments via Stripe directly to your account. Automatic overage billing for sessions that run long.",
  },
  {
    icon: Users,
    title: "Client CRM",
    description: "Store birth data, session history, and private notes for every client. Build lasting relationships that grow your practice.",
  },
  {
    icon: Share2,
    title: "Social Marketing",
    description: "Auto-post to Instagram, Twitter, YouTube, and TikTok. Pre-made astrology and tarot content with your unique links.",
  },
  {
    icon: BarChart3,
    title: "Affiliate Program",
    description: "Set up affiliates to send you clients. Track referrals, set custom commission rates, and manage payouts.",
  },
  {
    icon: Zap,
    title: "Event Reminders",
    description: "Auto-detect solar returns, Saturn returns, and Jupiter returns. Remind clients to book at the cosmically perfect time.",
  },
  {
    icon: Heart,
    title: "Live Streaming",
    description: "Stream from YouTube or Facebook Live right on your page. Turn viewers into booking clients during your lives.",
  },
  {
    icon: Shield,
    title: "Session Recordings",
    description: "Every session recorded automatically. Clients can rewatch, share on social media, and book again with one click.",
  },
];

export function FeatureGrid() {
  return (
    <section className="relative px-4 py-10 sm:px-6 lg:px-8">
      {/* Subtle star background — gold tinted */}
      <StarField className="pointer-events-none absolute inset-0 h-full w-full text-amber-200/20" />

      <div className="relative mx-auto max-w-7xl">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 text-sm text-[#c9a84c]">
            <Sparkles className="h-4 w-4" />
            <span>Complete Business Toolkit</span>
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 className="font-display text-3xl font-bold text-[#f5f0e8] sm:text-4xl lg:text-5xl">
            Everything You Need to{" "}
            <span className="gold-text">Thrive</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#b8bcd0]">
            Stop juggling Zoom, Calendly, Squarespace, and PayPal. One platform,
            one price, everything included.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="glass-card group relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover:border-[#c9a84c]/20 hover:shadow-lg hover:shadow-[#c9a84c]/5"
            >
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#c9a84c]/10 ring-1 ring-[#c9a84c]/20">
                  <feature.icon className="h-6 w-6 text-[#c9a84c]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#f5f0e8]">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#b8bcd0]/80">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Zodiac symbols row — gold */}
        <div className="mt-10 flex items-center justify-center gap-4 text-2xl text-[#c9a84c]/25">
          {["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"].map((symbol) => (
            <span key={symbol} className="hidden sm:inline">{symbol}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
