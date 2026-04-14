"use client";

import { useState } from "react";
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

interface RoleUpgradeBannersProps {
  isDiviner: boolean;
  isTrainee: boolean;
  isPerennialMandalism: boolean;
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
          <p className="text-xs text-white/40">Enrollment is by application — reviewed within 24 hours.</p>
          <Button
            asChild
            className="shrink-0 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold shadow-lg shadow-emerald-500/30"
          >
            <a href="/join/trainee">
              Apply Now
              <ArrowRight className="ml-1.5 size-3.5" />
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Perennial Mandalism Modal ─────────────────────────────────────────────────

type PmPlan = "individual" | "family";

const PM_PLANS: { key: PmPlan; label: string; price: string; sub: string; members: string }[] = [
  { key: "individual", label: "Individual", price: "$9.97", sub: "/month", members: "1 member" },
  { key: "family",     label: "Family",     price: "$19.97", sub: "/month", members: "Up to 5 members" },
];

const PM_FEATURES = [
  { icon: Lock,     text: "Exclusive spiritual content library" },
  { icon: Calendar, text: "Live community events & sacred rituals" },
  { icon: Users,    text: "Private members-only community forum" },
  { icon: Star,     text: "Monthly member Q&A with community leaders" },
  { icon: Sparkles, text: "Early access to new teachings & content" },
  { icon: Music2,   text: "Digital ritual tools, meditations & resources" },
  { icon: Globe,    text: "Connect with like-minded seekers worldwide" },
  { icon: Award,    text: "Members-only discounts on services" },
];

function PmUpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selectedPlan, setSelectedPlan] = useState<PmPlan>("individual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/community/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipType: "perennial_mandalism",
          planType: selectedPlan,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start checkout");
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !loading) onClose(); }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-violet-500/20 bg-gradient-to-b from-violet-950/95 to-slate-950/95 backdrop-blur-xl">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-violet-900/60 to-purple-900/40 px-6 pt-6 pb-5 border-b border-violet-500/15">
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-violet-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-6 right-20 size-24 rounded-full bg-purple-500/10 blur-2xl" />
          <DialogHeader className="relative">
            <Badge className="mb-3 w-fit bg-violet-500/15 text-violet-400 border-violet-500/30 text-[10px] font-bold tracking-widest uppercase hover:bg-violet-500/15">
              Exclusive Community
            </Badge>
            <DialogTitle className="text-xl font-bold text-violet-50">
              Join Perennial Mandalism
            </DialogTitle>
            <DialogDescription className="text-sm text-white/60 mt-1">
              Access exclusive spiritual content, live events, and a private community of seekers.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Features */}
        <div className="px-6 pt-5 pb-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-400/80">What you get</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
            {PM_FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-violet-500/15">
                  <Check className="size-3 text-violet-400" />
                </span>
                <span className="text-xs text-white/70 leading-snug">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Plan selector */}
        <div className="px-6 pb-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-400/80">Choose your plan</p>
          <div className="grid grid-cols-2 gap-3">
            {PM_PLANS.map((plan) => (
              <button
                key={plan.key}
                type="button"
                onClick={() => setSelectedPlan(plan.key)}
                className={`relative rounded-lg border p-4 text-left transition-all ${
                  selectedPlan === plan.key
                    ? "border-violet-500/60 bg-violet-500/15 ring-1 ring-violet-500/40"
                    : "border-white/10 bg-white/5 hover:border-violet-500/30"
                }`}
              >
                {selectedPlan === plan.key && (
                  <span className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-violet-500">
                    <Check className="size-2.5 text-white" />
                  </span>
                )}
                <p className="text-sm font-bold text-white">{plan.label}</p>
                <p className="text-xs text-white/50 mb-2">{plan.members}</p>
                <p className="text-lg font-bold text-violet-300">
                  {plan.price}
                  <span className="text-xs font-normal text-white/40">{plan.sub}</span>
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="border-t border-violet-500/15 bg-violet-950/30 px-6 py-4 space-y-2">
          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-white/40">Cancel anytime. No contracts.</p>
            <Button
              onClick={handleCheckout}
              disabled={loading}
              className="shrink-0 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white font-bold shadow-lg shadow-violet-500/30"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Redirecting…
                </>
              ) : (
                <>
                  Subscribe Now
                  <ArrowRight className="ml-1.5 size-3.5" />
                </>
              )}
            </Button>
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
}: RoleUpgradeBannersProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [openModal, setOpenModal] = useState<string | null>(null);

  function dismiss(key: string) {
    setDismissed((prev) => new Set(prev).add(key));
  }

  const visibleBanners = [
    {
      key: "trainee",
      show: isDiviner && !isTrainee,
      variant: "emerald" as const,
      badge: "CERTIFICATION PROGRAM",
      title: "Become a Certified Diviner",
      description: "Learn from expert instructors, complete interactive lessons, and earn your professional certification.",
      cta: "Explore Training",
    },
    {
      key: "diviner",
      show: isTrainee && !isDiviner,
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
              className={`relative overflow-hidden rounded-xl border bg-gradient-to-r ${s.wrapper}`}
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
                    className={`flex items-center gap-1.5 rounded-lg bg-gradient-to-r px-4 py-2 text-xs font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl ${s.cta} ${s.ctaShadow}`}
                  >
                    {banner.cta}
                    <ArrowRight className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => dismiss(banner.key)}
                    className="rounded-md p-1.5 text-white/30 transition-colors hover:text-white/70"
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
      <PmUpgradeModal
        open={openModal === "pm"}
        onClose={() => setOpenModal(null)}
      />
    </>
  );
}
