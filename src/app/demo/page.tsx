import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  Calendar,
  Clock,
  DollarSign,
  ExternalLink,
  Globe,
  LayoutDashboard,
  MessageSquare,
  Monitor,
  Play,
  Share2,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import {
  LandingPageMockup,
  VideoSessionMockup,
  DashboardMockup,
  ShareHubMockup,
  BookingFlowMockup,
  NatalChartIllustration,
  MobilePhoneMockup,
} from "@/components/marketing/illustrations";

export const metadata = {
  title: "See Demo - AstrologyPro",
  description:
    "See exactly what you get with AstrologyPro before signing up. Interactive demo of the platform for astrologers and tarot readers.",
};

function DemoAnnotation({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="group relative">
      {children}
      <div className="absolute -right-2 -top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-lg">
        {label}
      </div>
    </div>
  );
}

// Tab 1: Landing Page Preview
function LandingPageTab() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        This is what your clients see when they visit your personal page.
      </p>

      {/* SVG Preview Illustration */}
      <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/5">
        <LandingPageMockup className="w-full h-auto" />
      </div>

      {/* Diviner Hero Mock */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="relative h-32 bg-gradient-to-br from-primary/30 via-primary/10 to-background" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end gap-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-background bg-primary/20 text-3xl font-bold text-primary">
              MM
            </div>
            <div className="pb-1">
              <h3 className="text-xl font-bold">Mystic Maya</h3>
              <p className="text-sm text-muted-foreground">
                Illuminating Your Path Through the Stars
              </p>
              <div className="mt-1 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                  />
                ))}
                <span className="ml-1 text-xs text-muted-foreground">
                  4.9 (127 reviews)
                </span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Mystic Maya is a compassionate astrologer with nearly a decade of
            experience helping clients understand their cosmic blueprint.
            Specializing in natal charts and transit readings, Maya creates a
            safe and supportive space for self-discovery through the wisdom of
            the stars.
          </p>
        </div>
      </div>

      {/* Service Cards Mock */}
      <DemoAnnotation label="Your services">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              name: "Natal Chart Reading",
              price: 85,
              duration: 60,
              desc: "Deep dive into your birth chart",
            },
            {
              name: "Transit Reading",
              price: 65,
              duration: 45,
              desc: "What the current planets mean for you",
            },
            {
              name: "Synastry Reading",
              price: 120,
              duration: 75,
              desc: "Relationship compatibility analysis",
            },
            {
              name: "Career Guidance",
              price: 95,
              duration: 60,
              desc: "Vocational astrology for career clarity",
            },
          ].map((service) => (
            <div
              key={service.name}
              className="rounded-lg border bg-card p-4 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold">{service.name}</h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {service.desc}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  ${service.price}
                </Badge>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {service.duration} min
                <span className="text-primary">|</span>
                <Video className="h-3 w-3" />
                Video session
              </div>
            </div>
          ))}
        </div>
      </DemoAnnotation>

      {/* Testimonials Mock */}
      <DemoAnnotation label="Client testimonials">
        <div className="space-y-3">
          {[
            {
              name: "Sarah K.",
              text: "Maya's reading was incredibly accurate and gave me the clarity I needed during a difficult time.",
              rating: 5,
            },
            {
              name: "James R.",
              text: "Professional, insightful, and compassionate. I've been coming back for readings every month.",
              rating: 5,
            },
          ].map((review) => (
            <div key={review.name} className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-3 w-3 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                &ldquo;{review.text}&rdquo;
              </p>
              <p className="mt-1 text-xs font-medium">{review.name}</p>
            </div>
          ))}
        </div>
      </DemoAnnotation>

      {/* Book Now Mock */}
      <DemoAnnotation label="Book Now button">
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
          <Button size="lg" className="pointer-events-none gap-2">
            <Calendar className="h-4 w-4" />
            Book a Session
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Clients see available time slots and book instantly
          </p>
        </div>
      </DemoAnnotation>
    </div>
  );
}

// Tab 2: Dashboard Preview
function DashboardTab() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Your command center for managing bookings, clients, and revenue.
      </p>

      {/* SVG Dashboard Preview */}
      <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/5">
        <DashboardMockup className="w-full h-auto" />
      </div>

      {/* Revenue Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          {
            label: "Revenue",
            value: "$2,450",
            change: "+18%",
            icon: DollarSign,
          },
          {
            label: "Bookings",
            value: "18",
            change: "+5",
            icon: Calendar,
          },
          { label: "Clients", value: "12", change: "+3", icon: Users },
          { label: "Rating", value: "4.9", change: "127 reviews", icon: Star },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {stat.label}
                </span>
                <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="mt-1 text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-emerald-500">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart Mockup */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-primary" />
            Revenue This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-end gap-1">
            {[40, 55, 35, 70, 60, 85, 90, 75, 95, 80, 100, 65, 85, 90].map(
              (h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-primary/20 transition-all hover:bg-primary/40"
                  style={{ height: `${h}%` }}
                />
              )
            )}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>Mar 1</span>
            <span>Mar 15</span>
            <span>Mar 31</span>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Upcoming Bookings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              client: "Sarah K.",
              service: "Natal Chart Reading",
              time: "Today, 2:00 PM",
              amount: "$85",
            },
            {
              client: "James R.",
              service: "Transit Reading",
              time: "Today, 4:30 PM",
              amount: "$65",
            },
            {
              client: "Lisa M.",
              service: "Synastry Reading",
              time: "Tomorrow, 10:00 AM",
              amount: "$120",
            },
          ].map((booking) => (
            <div
              key={booking.client}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="text-sm font-medium">{booking.client}</p>
                <p className="text-xs text-muted-foreground">
                  {booking.service}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-primary">
                  {booking.amount}
                </p>
                <p className="text-xs text-muted-foreground">{booking.time}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
        <p className="text-sm font-medium text-emerald-400">
          Your subscription pays for itself after just 2 readings!
        </p>
      </div>
    </div>
  );
}

// Tab 3: Session Room Preview
function SessionTab() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        HD video sessions with built-in tools designed for astrologers.
      </p>

      {/* Session Room Mockup */}
      <div className="overflow-hidden rounded-xl border bg-card">
        {/* Top bar mock */}
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-3">
            <Badge variant="destructive" className="gap-1">
              <span className="h-2 w-2 rounded-full bg-white" />
              REC
            </Badge>
            <span className="text-sm font-medium">Natal Chart Reading</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 font-mono text-sm font-bold text-primary">
            <Clock className="h-3.5 w-3.5" />
            32:15 / 60:00
          </div>
        </div>

        {/* Video area — SVG illustration */}
        <div className="relative">
          <VideoSessionMockup className="w-full h-auto" />
          {/* Annotation callouts */}
          <div className="absolute left-3 top-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
            Timer & cost tracker
          </div>
          <div className="absolute bottom-3 right-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
            Face/Screen toggle
          </div>
        </div>

        {/* Controls mock */}
        <div className="flex items-center justify-center gap-3 border-t px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border">
            <Video className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-md border">
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-md border">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
            End Session
          </div>
        </div>
      </div>

      {/* Feature callouts */}
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          {
            icon: Clock,
            title: "Smart Timer",
            desc: "Tracks session duration with automatic overtime billing",
          },
          {
            icon: DollarSign,
            title: "Live Cost Tracker",
            desc: "Clients see the running total in real time",
          },
          {
            icon: Monitor,
            title: "Screen Sharing",
            desc: "Show birth charts and card spreads on screen",
          },
          {
            icon: MessageSquare,
            title: "In-Session Chat",
            desc: "Text chat alongside video for links and details",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="flex gap-3 rounded-lg border p-3"
          >
            <feature.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">{feature.title}</p>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tab 4: Marketing Tools Preview
function MarketingTab() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Share your services everywhere in seconds with the Push-to-Share hub.
      </p>

      {/* SVG Share Hub Preview */}
      <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/5">
        <ShareHubMockup className="w-full h-auto" />
      </div>

      {/* Share Hub Mockup */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Share2 className="h-4 w-4 text-primary" />
            Push-to-Share Hub
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Your booking link</p>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 rounded bg-background px-2 py-1 text-sm">
                astrologypro.com/mystic-maya
              </code>
              <Button variant="outline" size="sm">
                Copy
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {["Instagram", "TikTok", "Facebook", "X / Twitter"].map(
              (platform) => (
                <button
                  key={platform}
                  type="button"
                  className="flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <Globe className="h-5 w-5" />
                  {platform}
                </button>
              )
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-medium">Quick Share Templates</p>
            {[
              "Book a reading with me! Limited spots this week.",
              "New service alert: Synastry readings now available!",
              "5-star reviews keep coming in. Book your session today.",
            ].map((template) => (
              <div
                key={template}
                className="flex items-center justify-between rounded-lg border p-2.5"
              >
                <p className="text-xs text-muted-foreground">{template}</p>
                <Button variant="ghost" size="sm" className="shrink-0 text-xs">
                  Use
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
        <p className="text-sm font-medium">
          Share to all your socials in 30 seconds
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pre-written captions, one-click sharing, and tracking built in.
        </p>
      </div>
    </div>
  );
}

// Tab 5: Client Portal Preview
function ClientPortalTab() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        A polished experience for your clients, from booking to replay.
      </p>

      {/* SVG Booking Flow Preview */}
      <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/5">
        <BookingFlowMockup className="w-full h-auto" />
      </div>

      {/* Booking Flow Mock */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            Booking Flow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              1
            </div>
            <div>
              <p className="text-sm font-medium">Choose a Service</p>
              <p className="text-xs text-muted-foreground">
                Browse available readings and prices
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              2
            </div>
            <div>
              <p className="text-sm font-medium">Pick a Time</p>
              <p className="text-xs text-muted-foreground">
                See real-time availability on an interactive calendar
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              3
            </div>
            <div>
              <p className="text-sm font-medium">Pay Securely</p>
              <p className="text-xs text-muted-foreground">
                Stripe-powered checkout with automatic receipts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              4
            </div>
            <div>
              <p className="text-sm font-medium">Join Session</p>
              <p className="text-xs text-muted-foreground">
                One click to enter the video room at the scheduled time
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recording Playback Mock */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Play className="h-4 w-4 text-primary" />
            Session Recordings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              {
                title: "Natal Chart Reading",
                date: "Mar 28, 2026",
                duration: "58 min",
              },
              {
                title: "Transit Reading",
                date: "Mar 15, 2026",
                duration: "42 min",
              },
            ].map((rec) => (
              <div
                key={rec.title}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-14 items-center justify-center rounded bg-zinc-800">
                    <Play className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{rec.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {rec.date} &middot; {rec.duration}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-xs">
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Watch
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Clients can rewatch sessions and share recordings with permission.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DemoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-background">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
            <Badge variant="secondary" className="mb-4">
              Interactive Preview
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              See AstrologyPro in Action
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Explore every part of the platform before you sign up. No account
              required — just click through the tabs to see what you get.
            </p>
          </div>
        </section>

        {/* Demo Tabs */}
        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <Tabs defaultValue="landing" className="space-y-6">
            <TabsList className="w-full flex-wrap">
              <TabsTrigger value="landing" className="gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Your</span> Landing Page
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="gap-1.5">
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Your</span> Dashboard
              </TabsTrigger>
              <TabsTrigger value="session" className="gap-1.5">
                <Video className="h-3.5 w-3.5" />
                Video Sessions
              </TabsTrigger>
              <TabsTrigger value="marketing" className="gap-1.5">
                <Share2 className="h-3.5 w-3.5" />
                Marketing
              </TabsTrigger>
              <TabsTrigger value="portal" className="gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Client Portal
              </TabsTrigger>
            </TabsList>

            <TabsContent value="landing">
              <LandingPageTab />
            </TabsContent>
            <TabsContent value="dashboard">
              <DashboardTab />
            </TabsContent>
            <TabsContent value="session">
              <SessionTab />
            </TabsContent>
            <TabsContent value="marketing">
              <MarketingTab />
            </TabsContent>
            <TabsContent value="portal">
              <ClientPortalTab />
            </TabsContent>
          </Tabs>
        </section>

        {/* CTA */}
        <section className="border-t border-border/40 bg-gradient-to-t from-primary/5 to-background">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Ready to Start?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Set up your professional astrology practice in under 10 minutes.
              Your first month is on us.
            </p>
            <Button asChild size="lg" className="mt-6 gap-2">
              <Link href="/get-started">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
