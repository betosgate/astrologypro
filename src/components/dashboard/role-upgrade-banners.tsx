"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, X, Check, Loader2, GraduationCap, Star, Users, BookOpen, Video, Award, Clock, Infinity, Sparkles, Calendar, Music2, Globe, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DivinerUpgradeModal } from "@/components/trainee/diviner-upgrade-modal";

interface RoleUpgradeBannersProps {
  isDiviner: boolean;
  isTrainee: boolean;
  isPerennialMandalism: boolean;
  showTraineeUpgrade?: boolean;
  showDivinerUpgrade?: boolean;
}

// ── Trainee Modal ─────────────────────────────────────────────────────────────

function TraineeUpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const features = [
    { icon: BookOpen,    text: "Access to all training modules & video lessons" },
    { icon: Video,       text: "HD recorded sessions with expert instructors" },
    { icon: GraduationCap, text: "Interactive assessments & quizzes" },
    { icon: Award,       text: "Official professional certification upon completion" },
    { icon: Users,       text: "Private community study groups & peer support" },
    { icon: Clock,       text: "Self-paced — learn on your own schedule" },
    { icon: Infinity,    text: "Lifetime access to all course materials" },
    { icon: Star,        text: "Certified badge displayed on your public profile" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-emerald-500/20 bg-gradient-to-b from-emerald-950/95 to-slate-950/95 backdrop-blur-xl">
        {/* Header banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900/60 to-teal-900/40 px-6 pt-6 pb-5 border-b border-emerald-500/15">
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-6 right-20 size-24 rounded-full bg-teal-500/10 blur-2xl" />
          <DialogHeader className="relative">
            <Badge className="mb-3 w-fit bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-bold tracking-widest uppercase hover:bg-emerald-500/15">
              Certification Program
            </Badge>
            <DialogTitle className="text-xl font-bold text-emerald-50">
              Become a Certified Diviner
            </DialogTitle>
            <DialogDescription className="text-sm text-white/60 mt-1">
              Deepen your craft, earn your certification, and unlock the certified badge on your public profile.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Feature list */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/80">What you get</p>
          <ul className="space-y-2.5">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                  <Check className="size-3 text-emerald-400" />
                </span>
                <span className="text-sm text-white/75">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="border-t border-emerald-500/15 bg-emerald-950/30 px-6 py-4 flex items-center justify-between gap-3">
          <p className="text-xs text-white/40">Choose a training plan, complete checkout, then set up your trainee profile.</p>
          <Button
            asChild
            className="shrink-0 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold shadow-lg shadow-emerald-500/30"
          >
            <Link href="/join/trainee/plan">
              Choose Plan
              <ArrowRight className="ml-1.5 size-3.5" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Perennial Mandalism Modal ─────────────────────────────────────────────────

interface PricingPlan {
  plan_id: string;
  display_name: string;
  recurring_amount: number;
  recurring_currency: string;
  recurring_interval: string;
  features: string[];
}

function parsePmHighlights(html: string | null): string[] {
  if (!html) return [];
  const liMatches = html.match(/<li\b[^>]*>([\s\S]*?)<\/li>/gi);
  const pMatches = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/gi);
  const matches = liMatches?.length ? liMatches : pMatches ?? [];

  return matches
    .map((entry) =>
      entry
        .replace(/<\/?(li|p)\b[^>]*>/gi, "")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim(),
    )
    .filter(Boolean);
}

function formatPmPrice(amount: number | null, currency: string | null) {
  if (amount == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency ?? "USD").toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function PmUpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchPlans() {
    setLoadingPlans(true);
    setError(null);
    try {
      const res = await fetch("/api/pricing?keys=perennial_mandalism_community", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load plans");

      const item = data.items?.[0];
      const fetchedPlans = item?.plans || [];

      const processedPlans = fetchedPlans.map((p: any) => ({
        ...p,
        highlights: parsePmHighlights(p.html_description)
      }));

      setPlans(processedPlans);

      // Default selection: individual or first available
      const individual = processedPlans.find((p: any) => p.plan_id.includes("individual"));
      setSelectedPlanId(individual?.plan_id ?? processedPlans[0]?.plan_id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pricing.");
    } finally {
      setLoadingPlans(false);
    }
  }

  // Fetch plans on open
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void fetchPlans();
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function handleCheckout() {
    if (!selectedPlanId) return;
    setLoadingCheckout(true);
    setError(null);
    try {
      const res = await fetch("/api/community/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipType: "perennial_mandalism",
          planId: selectedPlanId,
          sourcePortal: pathname.startsWith("/trainee")
            ? "trainee"
            : pathname.startsWith("/dashboard")
              ? "diviner"
              : "switch",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start checkout");
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoadingCheckout(false);
    }
  }

  const activePlan = plans.find((p) => p.plan_id === selectedPlanId);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !loadingCheckout) onClose(); }}>
      <DialogContent className="!w-[calc(100vw-2rem)] sm:!w-[calc(100vw-4rem)] !max-w-[820px] p-0 overflow-hidden border-violet-500/20 bg-gradient-to-b from-violet-950/95 to-slate-950/95 backdrop-blur-xl">
        <div className="flex max-h-[90vh] flex-col overflow-hidden">
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-violet-900/95 to-purple-900/80 px-6 py-6 border-b border-violet-500/15 backdrop-blur-xl">
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-violet-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-6 right-20 size-28 rounded-full bg-purple-500/10 blur-2xl" />
          <DialogHeader className="relative">
            <Badge className="mb-3 w-fit bg-violet-500/15 text-violet-400 border-violet-500/30 text-[10px] font-bold tracking-widest uppercase hover:bg-violet-500/15">
              Exclusive Community
            </Badge>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-violet-50">
              <Sparkles className="size-5 text-violet-300" />
              Join Perennial Mandalism
            </DialogTitle>
            <DialogDescription className="mt-1 max-w-2xl text-sm text-white/65">
              Access exclusive spiritual content, live events, and a private community of seekers.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col">
            {/* Plan selector */}
            <div className="min-w-0 border-b border-white/10 px-6 py-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-violet-400/80">Choose your plan</p>

              {loadingPlans ? (
                <div className="flex min-h-[200px] items-center justify-center text-sm text-white/60">
                  <Loader2 className="mr-2 size-4 animate-spin text-violet-400" />
                  Loading live pricing…
                </div>
              ) : plans.length === 0 ? (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200">
                  {error ?? "No active Perennial Mandalism plans are configured."}
                </div>
              ) : (
                <div className="space-y-3">
                  {plans.map((plan) => {
                    const selected = plan.plan_id === selectedPlanId;
                    return (
                      <button
                        key={plan.plan_id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.plan_id)}
                        className={`w-full rounded-xl border p-4 text-left transition-all ${
                          selected
                            ? "border-violet-500/60 bg-violet-500/12 ring-1 ring-violet-500/35"
                            : "border-white/10 bg-white/5 hover:border-violet-400/30 hover:bg-white/[0.07]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-base font-bold text-white">{plan.display_name}</p>
                              {plan.plan_id.includes("family") && (
                                <Badge className="border-violet-500/30 bg-violet-500/15 text-[10px] uppercase tracking-widest text-violet-200 hover:bg-violet-500/15">
                                  Family
                                </Badge>
                              )}
                            </div>
                            {plan.description && (
                              <p className="mt-1 text-sm text-white/55">{plan.description}</p>
                            )}
                          </div>
                          <span
                            className={`mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                              selected
                                ? "border-violet-300 bg-violet-400 text-slate-950"
                                : "border-white/20 text-transparent"
                            }`}
                          >
                            <Check className="size-3.5" />
                          </span>
                        </div>
                        <div className="mt-3">
                          {plan.recurring_amount > 0 ? (
                            <div className="flex flex-col">
                              <p className="text-lg font-bold text-violet-200">
                                {formatPmPrice(plan.recurring_amount, plan.recurring_currency)}
                                <span className="text-sm font-normal text-white/40">/{plan.recurring_interval || "mo"}</span>
                              </p>
                              {plan.onetime_amount > 0 && (
                                <p className="text-xs text-white/40">
                                  + {formatPmPrice(plan.onetime_amount, plan.onetime_currency)} setup
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-lg font-bold text-violet-200">
                              {formatPmPrice(plan.onetime_amount, plan.onetime_currency)}
                              <span className="text-sm font-normal text-white/40"> one-time</span>
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Features list */}
            <div className="min-w-0 border-b border-white/10 px-6 py-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-violet-400/80">What you’re unlocking</p>

              {activePlan ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-violet-500/15 bg-white/[0.04] p-4">
                    <p className="text-sm font-semibold text-white">{activePlan.display_name}</p>
                    <div className="mt-1">
                      {activePlan.recurring_amount > 0 ? (
                         <div className="flex flex-col">
                            <p className="text-xl font-bold text-violet-200">
                              {formatPmPrice(activePlan.recurring_amount, activePlan.recurring_currency)}
                              <span className="text-sm font-normal text-white/40">/{activePlan.recurring_interval || "mo"}</span>
                            </p>
                            {activePlan.onetime_amount > 0 && (
                              <p className="text-sm text-white/40">
                                + {formatPmPrice(activePlan.onetime_amount, activePlan.onetime_currency)} setup fee
                              </p>
                            )}
                         </div>
                      ) : (
                        <p className="text-xl font-bold text-violet-200">
                          {formatPmPrice(activePlan.onetime_amount, activePlan.onetime_currency)}
                          <span className="text-sm font-normal text-white/40"> one-time</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-2.5">
                    {(activePlan.highlights?.length > 0
                      ? activePlan.highlights
                      : [
                          "Exclusive spiritual content library",
                          "Live community events & sacred rituals",
                          "Private community forum",
                          "Early access to teachings",
                          "Worldwide seeker network",
                        ]
                    ).map((highlight: string) => (
                      <li key={highlight} className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-violet-500/15">
                          <Check className="size-3 text-violet-400" />
                        </span>
                        <span className="text-sm leading-relaxed text-white/72">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/60">
                  Select a plan to review its details.
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="min-w-0 px-6 py-5">
              <div className="rounded-xl border border-violet-500/15 bg-white/[0.04] p-4">
                {error && (
                  <p className="mb-3 text-sm text-red-300">{error}</p>
                )}
                <Button
                  onClick={handleCheckout}
                  disabled={loadingPlans || loadingCheckout || !activePlan}
                  className="w-full bg-gradient-to-r from-violet-500 to-purple-500 font-bold text-white hover:from-violet-400 hover:to-purple-400 shadow-lg shadow-violet-500/20"
                >
                  {loadingCheckout ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Redirecting…
                    </>
                  ) : (
                    <>
                      Continue to Payment
                      <ArrowRight className="ml-2 size-4" />
                    </>
                  )}
                </Button>
                <p className="mt-2 text-center text-xs text-white/40">
                  Secure payment via Stripe Checkout. Cancel anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Banners Component ────────────────────────────────────────────────────

export function RoleUpgradeBanners({
  isDiviner,
  isTrainee,
  isPerennialMandalism,
  showTraineeUpgrade = true,
  showDivinerUpgrade = false,
}: RoleUpgradeBannersProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [openModal, setOpenModal] = useState<string | null>(null);

  function dismiss(key: string) {
    setDismissed((prev) => new Set(prev).add(key));
  }

  const visibleBanners = [
    {
      key: "trainee",
      show: showTraineeUpgrade && isDiviner && !isTrainee,
      variant: "emerald" as const,
      badge: "CERTIFICATION PROGRAM",
      title: "Become a Certified Diviner",
      description: "Learn from expert instructors, complete interactive lessons, and earn your professional certification.",
      cta: "Explore Training",
    },
    {
      key: "diviner",
      show: (isTrainee || showDivinerUpgrade) && !isDiviner,
      variant: "gold" as const,
      badge: "PROFESSIONAL PRACTICE",
      title: "Launch Your Divination Practice",
      description: "Get your branded page, booking system, HD video sessions, and payment processing — all in one platform.",
      cta: "Become a Diviner",
    },
    {
      key: "pm",
      show: !isPerennialMandalism,
      variant: "violet" as const,
      badge: "EXCLUSIVE COMMUNITY",
      title: "Join Perennial Mandalism",
      description: "Access exclusive spiritual content, live community events, and deepen your practice with like-minded seekers.",
      cta: "Learn More",
    },
  ].filter((b) => b.show && !dismissed.has(b.key));

  if (visibleBanners.length === 0) return null;

  const variantStyles = {
    emerald: {
      wrapper: "from-emerald-950/80 via-teal-950/60 to-slate-950/80 border-emerald-500/25",
      glow: "from-emerald-500/20 via-teal-500/10 to-transparent",
      orb1: "bg-emerald-400/15",
      orb2: "bg-teal-500/10",
      badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      title: "text-emerald-50",
      cta: "from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400",
      ctaShadow: "shadow-emerald-500/30",
      iconPath: (
        <svg viewBox="0 0 80 80" className="size-full" aria-hidden>
          <polygon points="40,8 50,28 72,32 56,48 60,70 40,60 20,70 24,48 8,32 30,28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" className="text-emerald-400/40" />
          <polygon points="40,18 47,31 62,33 51,43 54,58 40,51 26,58 29,43 18,33 33,31" fill="none" stroke="currentColor" strokeWidth="1" className="text-emerald-500/25" />
          <circle cx="40" cy="40" r="5" fill="currentColor" className="text-emerald-400/50" />
          <line x1="40" y1="4" x2="40" y2="14" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400/30" />
          <line x1="40" y1="66" x2="40" y2="76" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400/30" />
          <line x1="4" y1="40" x2="14" y2="40" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400/30" />
          <line x1="66" y1="40" x2="76" y2="40" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400/30" />
        </svg>
      ),
    },
    gold: {
      wrapper: "from-amber-950/80 via-yellow-950/60 to-slate-950/80 border-amber-500/25",
      glow: "from-amber-500/20 via-yellow-500/10 to-transparent",
      orb1: "bg-amber-400/15",
      orb2: "bg-yellow-500/10",
      badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      title: "text-amber-50",
      cta: "from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400",
      ctaShadow: "shadow-amber-500/30",
      iconPath: (
        <svg viewBox="0 0 80 80" className="size-full" aria-hidden>
          <circle cx="40" cy="40" r="22" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-400/40" />
          <circle cx="40" cy="40" r="14" fill="none" stroke="currentColor" strokeWidth="1" className="text-amber-500/25" />
          {[0,45,90,135,180,225,270,315].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 40 + 24 * Math.cos(rad);
            const y1 = 40 + 24 * Math.sin(rad);
            const x2 = 40 + 32 * Math.cos(rad);
            const y2 = 40 + 32 * Math.sin(rad);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1.5" className="text-amber-400/40" />;
          })}
          <circle cx="40" cy="40" r="5" fill="currentColor" className="text-amber-400/60" />
        </svg>
      ),
    },
    violet: {
      wrapper: "from-violet-950/80 via-purple-950/60 to-slate-950/80 border-violet-500/25",
      glow: "from-violet-500/20 via-purple-500/10 to-transparent",
      orb1: "bg-violet-400/15",
      orb2: "bg-purple-500/10",
      badge: "bg-violet-500/15 text-violet-400 border-violet-500/30",
      title: "text-violet-50",
      cta: "from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500",
      ctaShadow: "shadow-violet-500/30",
      iconPath: (
        <svg viewBox="0 0 80 80" className="size-full" aria-hidden>
          <path d="M40 10 L46 30 L68 30 L50 44 L57 64 L40 52 L23 64 L30 44 L12 30 L34 30 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" className="text-violet-400/40" />
          <circle cx="40" cy="40" r="8" fill="none" stroke="currentColor" strokeWidth="1" className="text-violet-500/40" />
          <circle cx="40" cy="40" r="3" fill="currentColor" className="text-violet-400/60" />
          <circle cx="40" cy="18" r="2" fill="currentColor" className="text-violet-400/30" />
          <circle cx="58" cy="28" r="1.5" fill="currentColor" className="text-violet-400/25" />
          <circle cx="22" cy="28" r="1.5" fill="currentColor" className="text-violet-400/25" />
          <circle cx="52" cy="56" r="1.5" fill="currentColor" className="text-violet-400/25" />
          <circle cx="28" cy="56" r="1.5" fill="currentColor" className="text-violet-400/25" />
        </svg>
      ),
    },
  };

  return (
    <>
      <div className="space-y-3">
        {visibleBanners.map((banner) => {
          const s = variantStyles[banner.variant];
          return (
            <div
              key={banner.key}
              className={`relative overflow-hidden rounded-xl border bg-gradient-to-r ${s.wrapper} cursor-pointer`}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${s.glow}`} />
              <div className={`pointer-events-none absolute -right-8 -top-8 size-40 rounded-full blur-3xl ${s.orb1}`} />
              <div className={`pointer-events-none absolute -bottom-6 right-24 size-28 rounded-full blur-2xl ${s.orb2}`} />

              <div className="relative flex items-center gap-5 px-5 py-4">
                <div className="hidden size-14 shrink-0 sm:block">{s.iconPath}</div>

                <div className="min-w-0 flex-1">
                  <span className={`mb-1.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${s.badge}`}>
                    {banner.badge}
                  </span>
                  <h3 className={`text-base font-bold leading-tight ${s.title}`}>{banner.title}</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/50">{banner.description}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenModal(banner.key)}
                    className={`flex items-center gap-1.5 rounded-lg bg-gradient-to-r px-4 py-2 text-xs font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl ${s.cta} ${s.ctaShadow} cursor-pointer`}
                  >
                    {banner.cta}
                    <ArrowRight className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => dismiss(banner.key)}
                    className="rounded-md p-1.5 text-white/30 transition-colors hover:text-white/70 cursor-pointer"
                    aria-label={`Dismiss ${banner.title}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <TraineeUpgradeModal
        open={openModal === "trainee"}
        onClose={() => setOpenModal(null)}
      />
      <DivinerUpgradeModal
        open={openModal === "diviner"}
        onClose={() => setOpenModal(null)}
      />
      <PmUpgradeModal
        open={openModal === "pm"}
        onClose={() => setOpenModal(null)}
      />
    </>
  );
}
