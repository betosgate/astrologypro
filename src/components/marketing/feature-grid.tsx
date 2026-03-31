import {
  Globe, Video, Calendar, CreditCard, Users, Share2,
  MessageSquare, BarChart3, Sparkles, Shield, Zap, Heart,
} from "lucide-react";

const features = [
  { icon: Globe, title: "Your Branded Page", description: "Get a professional landing page at astrologypro.com/yourname. Showcase your services, testimonials, and book clients." },
  { icon: Video, title: "HD Video Sessions", description: "Crystal-clear video with screen sharing. Show your charts and cards live. Every session auto-recorded." },
  { icon: Calendar, title: "Smart Booking", description: "Clients book based on your real availability. Google Calendar sync. Automatic reminders." },
  { icon: CreditCard, title: "Instant Payments", description: "Accept payments via Stripe. Automatic overage billing. Your money, your account." },
  { icon: Users, title: "Client CRM", description: "Track birth data, session history, and notes for every client. Build lasting relationships." },
  { icon: Share2, title: "Social Marketing", description: "Auto-post to Instagram, Twitter, YouTube, and more. Pre-made content with your links." },
  { icon: MessageSquare, title: "Testimonials", description: "Collect and display client reviews on your page. Build trust and credibility automatically." },
  { icon: BarChart3, title: "Affiliate Program", description: "Set up affiliates to send you clients. Track referrals, commissions, and payouts." },
  { icon: Sparkles, title: "Astrology & Tarot Tools", description: "Full access to professional chart calculation and tarot software during sessions." },
  { icon: Shield, title: "Session Recordings", description: "Every session recorded automatically. Clients can rewatch and share on social media." },
  { icon: Zap, title: "Event Reminders", description: "Auto-detect solar returns, Saturn returns, and more. Remind clients to book at the perfect time." },
  { icon: Heart, title: "Live Streaming", description: "Stream from YouTube or Facebook Live right on your page. Attract viewers to your services." },
];

export function FeatureGrid() {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Everything You Need to <span className="text-primary">Thrive</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Stop juggling Zoom, Calendly, Squarespace, and PayPal. One platform,
            one price, everything included.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border/60 bg-card/50 p-6 transition-colors hover:border-primary/30 hover:bg-card"
            >
              <feature.icon className="h-10 w-10 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
