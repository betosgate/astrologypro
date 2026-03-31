import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  UserPlus,
  UserCog,
  Briefcase,
  CreditCard,
  Clock,
  Globe,
  CalendarCheck,
  Video,
  Mail,
  Users,
  Star,
  Share2,
  Megaphone,
  Radio,
  BellRing,
  Lightbulb,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works — Complete Guide",
};

interface Step {
  number: number;
  title: string;
  description: string;
  screenshot: string;
  icon: React.ElementType;
}

const gettingStartedSteps: Step[] = [
  {
    number: 1,
    title: "Create Your Account",
    description:
      "Visit astrologypro.com/get-started and fill in your email, password, and username. Complete the checkout to pay the one-time $197 setup fee plus your first month of service. You'll be taken straight into your dashboard once payment is confirmed.",
    screenshot: "The get-started registration form with email, password, and username fields",
    icon: UserPlus,
  },
  {
    number: 2,
    title: "Complete Your Profile",
    description:
      "Upload a professional photo that represents your brand, write a compelling bio and tagline, and select your specialties from options like natal astrology, tarot reading, horary, and more. This information appears on your public landing page.",
    screenshot: "The profile editor showing photo upload, bio textarea, and specialty checkboxes",
    icon: UserCog,
  },
  {
    number: 3,
    title: "Set Up Your Services",
    description:
      "Choose which of the 19 consultation types you want to offer — from natal chart readings to tarot spreads to compatibility reports. Customize the pricing for each service to match your experience level and market.",
    screenshot: "The services configuration page with toggles and price inputs for each service type",
    icon: Briefcase,
  },
  {
    number: 4,
    title: "Connect Stripe",
    description:
      "Link your Stripe account so you can receive payments directly from clients. Stripe handles all payment processing securely, and funds are deposited straight into your bank account on a rolling basis.",
    screenshot: "The Stripe Connect onboarding flow with bank account setup",
    icon: CreditCard,
  },
  {
    number: 5,
    title: "Set Your Availability",
    description:
      "Configure your working hours for each day of the week. Block off lunch breaks, set different hours for weekdays vs weekends, and mark specific dates as unavailable. Clients can only book during your open slots.",
    screenshot: "The weekly availability calendar with time slot selectors for each day",
    icon: Clock,
  },
];

const managingPracticeSteps: Step[] = [
  {
    number: 6,
    title: "Your Landing Page",
    description:
      "Your page is live at astrologypro.com/[username]. This is your professional home on the web — share this link on social media, in your email signature, and anywhere you connect with potential clients. It showcases your profile, services, and testimonials.",
    screenshot: "A sample diviner landing page with profile, services grid, and testimonials",
    icon: Globe,
  },
  {
    number: 7,
    title: "Client Bookings",
    description:
      "When a client visits your page, they pick a service, choose a date and time from your availability, fill out their birth information (date, time, location), and complete payment. You receive a notification and the booking appears in your dashboard.",
    screenshot: "The client booking flow: service selection, date picker, birth info form, and payment",
    icon: CalendarCheck,
  },
  {
    number: 8,
    title: "Video Sessions",
    description:
      "Join sessions directly from your dashboard when the appointment time arrives. Screen share your astrology software, tarot tools, or chart images during the session. All sessions are automatically recorded for your client's reference.",
    screenshot: "The video session interface with screen sharing and recording indicator",
    icon: Video,
  },
  {
    number: 9,
    title: "After the Session",
    description:
      "Session recordings are automatically sent to clients via email once the session ends. Clients can rewatch their reading anytime and even share clips on social media, which drives new traffic back to your AstrologyPro page.",
    screenshot: "The post-session email with recording link and social sharing buttons",
    icon: Mail,
  },
  {
    number: 10,
    title: "Client Management",
    description:
      "View all your clients in one place with their birth data, session history, and your private notes. The built-in CRM helps you remember details about each client and prepare for follow-up sessions with context.",
    screenshot: "The CRM dashboard showing client list with birth data and session history",
    icon: Users,
  },
];

const marketingGrowthSteps: Step[] = [
  {
    number: 11,
    title: "Testimonials",
    description:
      "After each session, clients are invited to submit a review. You can approve the best testimonials to display prominently on your landing page. Strong social proof is one of the most effective ways to convert new visitors into paying clients.",
    screenshot: "The testimonials management panel with approve/reject controls",
    icon: Star,
  },
  {
    number: 12,
    title: "Affiliate Program",
    description:
      "Create affiliates, give them unique referral links, and set custom commission rates. When their referrals book a session with you, the affiliate earns a commission automatically. It's a hands-off way to grow your client base through word of mouth.",
    screenshot: "The affiliate management page with referral links and commission settings",
    icon: Share2,
  },
  {
    number: 13,
    title: "Social Media",
    description:
      "Connect your social accounts and let AstrologyPro auto-post pre-made astrology content — daily horoscopes, transit alerts, and educational posts — with your unique booking links embedded. Keep your feeds active without the daily effort.",
    screenshot: "The social media settings with connected accounts and auto-post schedule",
    icon: Megaphone,
  },
  {
    number: 14,
    title: "Live Streaming",
    description:
      "Add your YouTube Channel ID in settings. Whenever you go live on YouTube, the live stream automatically appears on your AstrologyPro landing page. Viewers watching your stream can book a session with one click.",
    screenshot: "The landing page with an embedded YouTube live stream and booking button",
    icon: Radio,
  },
  {
    number: 15,
    title: "Event Reminders",
    description:
      "AstrologyPro tracks your clients' birth data and automatically emails them before major astrological events — solar returns, Saturn returns, Jupiter transits, and more. These timely reminders drive repeat bookings without you lifting a finger.",
    screenshot: "A sample event reminder email for an upcoming solar return with booking CTA",
    icon: BellRing,
  },
];

const tips = [
  "Feature your 3-4 most popular services on your landing page to keep the choice simple for new visitors.",
  "Share your astrologypro.com/[username] link in all your social media bios — Camera, TikTok, MessageCircle, and YouTube.",
  "Encourage clients to leave testimonials right after sessions while the experience is fresh.",
  "Go live on YouTube regularly and direct viewers to your AstrologyPro page for private readings.",
  "Set up at least 2 affiliates to start growing your client base through referrals.",
];

const tocSections = [
  { id: "getting-started", label: "Getting Started", steps: "1-5" },
  { id: "managing-practice", label: "Managing Your Practice", steps: "6-10" },
  { id: "marketing-growth", label: "Marketing & Growth", steps: "11-15" },
  { id: "tips", label: "Tips for Success", steps: "" },
];

function StepCard({ step }: { step: Step }) {
  const Icon = step.icon;
  return (
    <Card id={`step-${step.number}`} className="overflow-hidden">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
          {step.number}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Icon className="size-5 text-primary" />
            <h3 className="text-lg font-semibold">{step.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-8">
          <p className="text-sm text-muted-foreground text-center">
            Screenshot: {step.screenshot}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function StepSection({
  id,
  title,
  steps,
}: {
  id: string;
  title: string;
  steps: Step[];
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-6 text-2xl font-bold tracking-tight">{title}</h2>
      <div className="space-y-6">
        {steps.map((step) => (
          <StepCard key={step.number} step={step} />
        ))}
      </div>
    </section>
  );
}

export default function InstructionsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b bg-muted/30 py-16">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              How to Use AstrologyPro
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Complete Guide
            </p>
            <p className="mt-2 text-muted-foreground">
              Follow these 15 steps to set up your practice, manage clients, and
              grow your business.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-4 py-12">
          {/* Table of Contents */}
          <Card className="mb-12">
            <CardHeader>
              <h2 className="text-lg font-semibold">Table of Contents</h2>
            </CardHeader>
            <CardContent>
              <nav>
                <ol className="space-y-2">
                  {tocSections.map((section) => (
                    <li key={section.id}>
                      <Link
                        href={`#${section.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {section.label}
                        {section.steps && (
                          <span className="ml-2 text-muted-foreground">
                            (Steps {section.steps})
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ol>
              </nav>
            </CardContent>
          </Card>

          {/* Step Sections */}
          <div className="space-y-16">
            <StepSection
              id="getting-started"
              title="Getting Started"
              steps={gettingStartedSteps}
            />
            <StepSection
              id="managing-practice"
              title="Managing Your Practice"
              steps={managingPracticeSteps}
            />
            <StepSection
              id="marketing-growth"
              title="Marketing & Growth"
              steps={marketingGrowthSteps}
            />

            {/* Tips for Success */}
            <section id="tips" className="scroll-mt-24">
              <h2 className="mb-6 text-2xl font-bold tracking-tight">
                Tips for Success
              </h2>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Lightbulb className="size-5 text-primary" />
                    <h3 className="text-lg font-semibold">
                      Pro Tips to Grow Faster
                    </h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {i + 1}
                        </span>
                        <span className="text-muted-foreground">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold">Ready to Get Started?</h2>
            <p className="mt-2 text-muted-foreground">
              Create your account and launch your astrology practice today.
            </p>
            <div className="mt-6">
              <Link
                href="/get-started"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Get Started Now
              </Link>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
