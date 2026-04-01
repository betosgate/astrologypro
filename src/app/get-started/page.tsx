"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLANS, PLAN_ORDER, SHARED_FEATURES, type PlanId } from "@/lib/plans";
import {
  Loader2,
  Sparkles,
  Check,
  Star,
  ArrowRight,
  ChevronDown,
  Shield,
  Zap,
  Users,
  Video,
  Phone,
  Globe,
  BarChart3,
  Mail,
  Calendar,
  Gift,
  Heart,
  Share2,
  Crown,
} from "lucide-react";

const faqs = [
  {
    question: "What's the difference between the plans?",
    answer:
      "Every plan includes the same powerful platform — video sessions, booking, CRM, marketing tools, and your branded page. The only difference is the consultation types you offer: tarot spreads, astrology readings, or both. If you practice both, The Oracle plan saves you $97 on setup and $47/mo compared to buying separately.",
  },
  {
    question: "Can I upgrade my plan later?",
    answer:
      "Absolutely. If you start with a single-specialty plan and want to add the other, you can upgrade to The Oracle at any time. We'll prorate the difference so you only pay the delta.",
  },
  {
    question: "What's included in the setup fee?",
    answer:
      "Your setup fee covers account creation, your branded landing page at astrologypro.com/your-name, full access to professional astrology and tarot back-office tools, all 11 styled email templates, and personalized onboarding support to get your first session booked.",
  },
  {
    question: "How do client payments work?",
    answer:
      "Clients pay through Stripe when they book. You receive 80% of every session fee directly to your Stripe account — no waiting for payouts, no invoicing. We handle all the payment infrastructure.",
  },
  {
    question: "Do I need my own website?",
    answer:
      "No. Your astrologypro.com/your-name page IS your professional website. It includes your bio, all your services, a booking calendar, testimonials, live stream embeds, gift certificates, and more. Share one link and you're in business.",
  },
  {
    question: "What if it's not right for me?",
    answer:
      "We offer a 30-day money-back guarantee, no questions asked. If AstrologyPro isn't helping you grow your practice, we'll refund your setup fee and any monthly charges. Zero risk.",
  },
  {
    question: "Can clients call me for phone readings?",
    answer:
      "Yes — with The Oracle plan, you get a dedicated phone number. Clients call you directly for phone readings starting at $25 for 20 minutes, with per-minute billing after that. Everything is tracked and billed automatically.",
  },
  {
    question: "What video platform do you use?",
    answer:
      "Daily.co powers our HD video sessions with screen sharing and automatic recording. No additional software needed — everything runs in the browser. You can share your charts and cards on screen while you read.",
  },
];

export default function GetStartedPage() {
  const supabase = createClient();
  const formRef = useRef<HTMLDivElement>(null);

  const [selectedPlan, setSelectedPlan] = useState<PlanId>("both");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function selectPlan(planId: PlanId) {
    setSelectedPlan(planId);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function validateForm(): string | null {
    if (!email || !password || !confirmPassword || !username) {
      return "All fields are required.";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }
    if (username.length < 3) {
      return "Username must be at least 3 characters.";
    }
    if (username.length > 30) {
      return "Username must be 30 characters or fewer.";
    }
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(username) && username.length > 1) {
      return "Username must start and end with a letter or number, and can only contain lowercase letters, numbers, and hyphens.";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            role: "diviner",
            plan: selectedPlan,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!data.user) {
        setError("Sign up failed. Please try again.");
        return;
      }

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          userId: data.user.id,
          planId: selectedPlan,
        }),
      });

      const checkout = await response.json();

      if (!response.ok || !checkout.url) {
        setError(checkout.error ?? "Failed to create checkout session.");
        return;
      }

      window.location.href = checkout.url;
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const plan = PLANS[selectedPlan];

  return (
    <div className="flex min-h-screen flex-col bg-[#06080f]">
      <MarketingHeader />

      <main className="flex-1">
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden px-4 pb-16 pt-20 text-center sm:px-6 md:pt-28 lg:px-8">
          {/* Cosmic background glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(201,168,76,0.08)_0%,transparent_60%)]" />

          <div className="relative mx-auto max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/5 px-4 py-1.5 text-sm text-[#c9a84c]">
              <Sparkles className="size-4" />
              Built exclusively for astrologers &amp; tarot readers
            </div>

            <h1 className="font-display text-4xl font-bold leading-tight text-[#f5f0e8] sm:text-5xl md:text-6xl">
              Your Gift Deserves{" "}
              <span className="gold-text">a Real Practice</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#b8bcd0]/80">
              Stop juggling Zoom links, Venmo requests, and spreadsheets.
              AstrologyPro gives you a professional branded platform — booking,
              video sessions, payments, client management, and marketing — all
              in one place.
            </p>

            <div className="mt-8 flex items-center justify-center gap-3">
              <a
                href="#plans"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[#c9a84c] px-8 text-sm font-semibold text-black shadow-lg shadow-[#c9a84c]/25 transition-all hover:bg-[#e2c97e] hover:shadow-[#c9a84c]/40"
              >
                See Plans &amp; Pricing
                <ArrowRight className="size-4" />
              </a>
              <Link
                href="/demo"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/10 px-8 text-sm font-medium text-[#b8bcd0] transition-all hover:border-[#c9a84c]/30 hover:text-[#c9a84c]"
              >
                See a Demo
              </Link>
            </div>
          </div>
        </section>

        {/* ===== TRUST BAR ===== */}
        <section className="border-y border-white/5 bg-white/[0.02]">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 px-4 py-5 sm:gap-12">
            <div className="flex items-center gap-2 text-sm text-[#b8bcd0]/70">
              <Shield className="size-4 text-[#22c55e]" />
              <span className="text-[#22c55e]/80">30-day money-back guarantee</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#b8bcd0]/70">
              <Zap className="size-4 text-[#c9a84c]" />
              <span>Cancel <strong className="text-[#f5f0e8]">anytime</strong></span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#b8bcd0]/70">
              <Video className="size-4 text-[#c9a84c]" />
              <span>HD video sessions <strong className="text-[#f5f0e8]">included</strong></span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#b8bcd0]/70">
              <Globe className="size-4 text-[#c9a84c]" />
              <span>Your <strong className="text-[#f5f0e8]">branded page</strong> included</span>
            </div>
          </div>
        </section>

        {/* ===== PAIN POINTS ===== */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-display text-3xl font-bold text-[#f5f0e8] sm:text-4xl">
              Sound familiar?
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { text: "Sending Zoom links by hand for every session", icon: Video },
                { text: "Chasing payments through Venmo or CashApp", icon: Zap },
                { text: "No professional page — just a social media bio link", icon: Globe },
                { text: "Losing clients because booking is too complicated", icon: Calendar },
              ].map(({ text, icon: Icon }) => (
                <div
                  key={text}
                  className="glass-card rounded-xl p-5 text-left"
                >
                  <Icon className="mb-3 size-5 text-red-400/70" />
                  <p className="text-sm leading-relaxed text-[#b8bcd0]/70">{text}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-lg font-medium text-[#c9a84c]">
              There&apos;s a better way.
            </p>
          </div>
        </section>

        {/* ===== PLAN CARDS ===== */}
        <section id="plans" className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-4 text-center">
              <h2 className="font-display text-3xl font-bold text-[#f5f0e8] sm:text-4xl">
                Choose Your <span className="gold-text">Path</span>
              </h2>
              <p className="mt-3 text-[#b8bcd0]/70">
                Every plan includes the full platform. Pick the services that match your practice.
              </p>
            </div>

            <div className="mt-12 grid items-start gap-6 md:grid-cols-3">
              {PLAN_ORDER.map((planId) => {
                const p = PLANS[planId];
                const isSelected = selectedPlan === planId;
                return (
                  <div
                    key={planId}
                    className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                      p.isFeatured
                        ? "border-[#c9a84c]/40 bg-[#c9a84c]/[0.03] shadow-2xl shadow-[#c9a84c]/10 md:-mt-4 md:mb-0"
                        : "border-white/[0.08] bg-white/[0.02]"
                    } ${isSelected ? "ring-2 ring-[#c9a84c]" : ""}`}
                  >
                    {/* Best value badge */}
                    {p.isFeatured && (
                      <div className="bg-gradient-to-r from-[#8b7a3a] via-[#c9a84c] to-[#e2c97e] px-4 py-2 text-center text-xs font-bold uppercase tracking-widest text-black">
                        <Crown className="mr-1 inline size-3" />
                        Best Value — Save $144/yr
                      </div>
                    )}

                    <div className="p-6 md:p-8">
                      {/* Plan name */}
                      <h3 className="font-display text-xl font-bold text-[#f5f0e8]">
                        {p.name}
                      </h3>
                      <p className="mt-1 text-sm text-[#b8bcd0]/60">{p.tagline}</p>

                      {/* Pricing */}
                      <div className="mt-5">
                        <div className="flex items-baseline gap-1">
                          <span className="font-display text-4xl font-bold text-[#f5f0e8]">
                            ${p.monthlyPrice}
                          </span>
                          <span className="text-[#b8bcd0]/60">/mo</span>
                        </div>
                        <p className="mt-1 text-sm text-[#b8bcd0]/50">
                          + ${p.setupPrice} one-time setup
                        </p>
                      </div>

                      {/* Service count */}
                      <div className="mt-5 rounded-lg border border-[#c9a84c]/15 bg-[#c9a84c]/5 px-4 py-3">
                        <p className="text-sm font-medium text-[#c9a84c]">
                          {p.serviceLabel}
                        </p>
                      </div>

                      {/* Highlights */}
                      <ul className="mt-5 space-y-2.5">
                        {p.highlights.map((h) => (
                          <li key={h} className="flex items-start gap-2.5">
                            <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#c9a84c]/10">
                              <Check className="size-3 text-[#c9a84c]" />
                            </div>
                            <span className="text-sm text-[#b8bcd0]/80">{h}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <button
                        type="button"
                        onClick={() => selectPlan(planId)}
                        className={`mt-6 w-full rounded-full py-3 text-sm font-semibold transition-all ${
                          p.isFeatured
                            ? "bg-[#c9a84c] text-black shadow-lg shadow-[#c9a84c]/25 hover:bg-[#e2c97e]"
                            : "border border-[#c9a84c]/30 text-[#c9a84c] hover:border-[#c9a84c] hover:bg-[#c9a84c]/10"
                        }`}
                      >
                        {isSelected ? "Selected — Scroll to Sign Up" : `Choose ${p.name}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===== EVERYTHING INCLUDED ===== */}
        <section className="border-y border-white/5 bg-white/[0.015] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-3 text-center font-display text-3xl font-bold text-[#f5f0e8] sm:text-4xl">
              Every Plan <span className="gold-text">Includes</span>
            </h2>
            <p className="mb-10 text-center text-[#b8bcd0]/60">
              No features locked behind upgrades. Your plan differs only in consultation types.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Globe, label: "Branded landing page" },
                { icon: Video, label: "HD video sessions" },
                { icon: Calendar, label: "Smart booking & calendar" },
                { icon: Zap, label: "Stripe payment processing" },
                { icon: Users, label: "Client CRM & birth data" },
                { icon: Share2, label: "Social media auto-posting" },
                { icon: Mail, label: "Email & SMS notifications" },
                { icon: BarChart3, label: "Analytics dashboard" },
                { icon: Heart, label: "Client loyalty discounts" },
                { icon: Gift, label: "Gift certificate system" },
                { icon: Star, label: "Testimonials & reviews" },
                { icon: Shield, label: "Back-office software access" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                >
                  <Icon className="size-4 shrink-0 text-[#c9a84c]" />
                  <span className="text-sm text-[#b8bcd0]/80">{label}</span>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-xs text-[#b8bcd0]/40">
              Plus: session recording, affiliate tools, event reminders, follow-up automation, discovery listing, YouTube/Facebook Live embed, and more
            </p>
          </div>
        </section>

        {/* ===== COST COMPARISON ===== */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-3 text-center font-display text-3xl font-bold text-[#f5f0e8] sm:text-4xl">
              What You&apos;re <span className="gold-text">Replacing</span>
            </h2>
            <p className="mb-10 text-center text-[#b8bcd0]/60">
              Most practitioners spend $120&ndash;250/mo piecing together separate tools
            </p>

            <div className="space-y-2">
              {[
                { tool: "Website builder", cost: "$16–40/mo" },
                { tool: "Video conferencing", cost: "$13–20/mo" },
                { tool: "Booking/scheduling", cost: "$12–16/mo" },
                { tool: "Session recording", cost: "$10–25/mo" },
                { tool: "Client CRM", cost: "$15–30/mo" },
                { tool: "Email marketing", cost: "$10–20/mo" },
                { tool: "Social media tools", cost: "$15–50/mo" },
                { tool: "Affiliate system", cost: "$30–50/mo" },
              ].map(({ tool, cost }) => (
                <div
                  key={tool}
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] px-4 py-3"
                >
                  <span className="text-sm text-[#b8bcd0]/70">{tool}</span>
                  <span className="text-sm font-medium text-red-400/80">{cost}</span>
                </div>
              ))}

              {/* Total */}
              <div className="mt-4 flex items-center justify-between rounded-xl border border-[#c9a84c]/20 bg-[#c9a84c]/5 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-[#f5f0e8]">
                    AstrologyPro replaces all of this
                  </p>
                  <p className="mt-0.5 text-xs text-[#b8bcd0]/50">
                    Plus astrology/tarot tools no generic platform offers
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-bold text-[#c9a84c]">
                    From $97/mo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section className="border-y border-white/5 bg-white/[0.015] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-display text-3xl font-bold text-[#f5f0e8] sm:text-4xl">
              Live in <span className="gold-text">3 Steps</span>
            </h2>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Pick Your Plan",
                  desc: "Choose tarot, astrology, or both. Every plan includes the full platform.",
                },
                {
                  step: "2",
                  title: "Set Up Your Profile",
                  desc: "Add your bio, photo, and services. Our AI helps write your copy. Takes 5 minutes.",
                },
                {
                  step: "3",
                  title: "Share Your Link",
                  desc: "Your branded page is live at astrologypro.com/you. Share it and start booking.",
                },
              ].map(({ step, title, desc }) => (
                <div key={step} className="relative">
                  <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[#c9a84c]/10 font-display text-xl font-bold text-[#c9a84c]">
                    {step}
                  </div>
                  <h3 className="font-display text-lg font-semibold text-[#f5f0e8]">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#b8bcd0]/60">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SIGNUP FORM ===== */}
        <section ref={formRef} id="signup" className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-lg">
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] shadow-2xl">
              {/* Plan summary header */}
              <div className="border-b border-white/[0.06] bg-[#c9a84c]/5 px-6 py-5 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-[#c9a84c]/60">
                  Selected Plan
                </p>
                <h3 className="mt-1 font-display text-xl font-bold text-[#f5f0e8]">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-[#b8bcd0]/70">
                  ${plan.setupPrice} setup + ${plan.monthlyPrice}/mo &middot;{" "}
                  {plan.serviceLabel}
                </p>
                {/* Plan switcher */}
                <div className="mt-3 flex justify-center gap-2">
                  {PLAN_ORDER.map((pid) => (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => setSelectedPlan(pid)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                        selectedPlan === pid
                          ? "bg-[#c9a84c] text-black"
                          : "border border-white/10 text-[#b8bcd0]/60 hover:border-[#c9a84c]/30 hover:text-[#c9a84c]"
                      }`}
                    >
                      {PLANS[pid].name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form */}
              <div className="p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#b8bcd0]/80">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="border-white/10 bg-white/[0.04] text-[#f5f0e8] placeholder:text-[#b8bcd0]/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[#b8bcd0]/80">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="border-white/10 bg-white/[0.04] text-[#f5f0e8] placeholder:text-[#b8bcd0]/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-[#b8bcd0]/80">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="border-white/10 bg-white/[0.04] text-[#f5f0e8] placeholder:text-[#b8bcd0]/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-[#b8bcd0]/80">
                      Choose Your URL
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="mystic-maya"
                      value={username}
                      onChange={(e) =>
                        setUsername(
                          e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                        )
                      }
                      required
                      autoComplete="username"
                      className="border-white/10 bg-white/[0.04] text-[#f5f0e8] placeholder:text-[#b8bcd0]/30"
                    />
                    <p className="text-sm text-[#b8bcd0]/50">
                      Your page:{" "}
                      <span className="font-medium text-[#c9a84c]">
                        astrologypro.com/{username || "your-name"}
                      </span>
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full rounded-full bg-[#c9a84c] py-6 text-base font-semibold text-black shadow-lg shadow-[#c9a84c]/25 hover:bg-[#e2c97e]"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Creating your practice...
                      </>
                    ) : (
                      <>
                        Start Your Practice — ${plan.setupPrice} + ${plan.monthlyPrice}/mo
                        <ArrowRight className="ml-2 size-4" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Trust signals */}
                <div className="mt-5 flex flex-col items-center gap-2 text-center">
                  <div className="flex items-center gap-4 text-xs text-[#b8bcd0]/40">
                    <span className="flex items-center gap-1">
                      <Shield className="size-3 text-[#22c55e]/60" />
                      30-day money-back
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="size-3 text-[#c9a84c]/60" />
                      Cancel anytime
                    </span>
                  </div>
                  <p className="text-xs text-[#b8bcd0]/30">
                    Already have an account?{" "}
                    <Link href="/login" className="text-[#c9a84c]/60 hover:text-[#c9a84c]">
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section className="border-t border-white/5 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-10 text-center font-display text-3xl font-bold text-[#f5f0e8] sm:text-4xl">
              Questions? <span className="gold-text">Answers.</span>
            </h2>

            <div className="divide-y divide-white/[0.06]">
              {faqs.map((faq, i) => (
                <div key={faq.question}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between py-5 text-left"
                  >
                    <span className="pr-4 text-base font-medium text-[#f5f0e8]">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`size-5 shrink-0 text-[#b8bcd0]/40 transition-transform duration-200 ${
                        openFaq === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-200 ${
                      openFaq === i
                        ? "max-h-96 pb-5 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="text-sm leading-relaxed text-[#b8bcd0]/60">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FINAL CTA ===== */}
        <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(201,168,76,0.06)_0%,transparent_60%)]" />
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-[#f5f0e8] sm:text-4xl">
              Every day without a professional platform is a day your practice isn&apos;t growing.
            </h2>
            <p className="mt-4 text-[#b8bcd0]/60">
              Turn your gift into a thriving business — start booking clients this week.
            </p>
            <a
              href="#plans"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#c9a84c] px-8 text-sm font-semibold text-black shadow-lg shadow-[#c9a84c]/25 transition-all hover:bg-[#e2c97e]"
            >
              Choose Your Plan
              <ArrowRight className="size-4" />
            </a>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
