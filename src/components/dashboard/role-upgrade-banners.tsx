"use client";

import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { useState } from "react";

interface RoleUpgradeBannersProps {
  isDiviner: boolean;
  isTrainee: boolean;
  isPerennialMandalism: boolean;
}

/**
 * Cross-sell banners shown on the dashboard when the user is missing
 * a complementary role. Each banner can be individually dismissed
 * for the current session.
 */
export function RoleUpgradeBanners({
  isDiviner,
  isTrainee,
  isPerennialMandalism,
}: RoleUpgradeBannersProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

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
      description:
        "Learn from expert instructors, complete interactive lessons, and earn your professional certification.",
      cta: "Explore Training",
      href: "/get-started#trainee_program",
    },
    {
      key: "diviner",
      show: isTrainee && !isDiviner,
      variant: "gold" as const,
      badge: "PROFESSIONAL PRACTICE",
      title: "Launch Your Divination Practice",
      description:
        "Get your branded page, booking system, HD video sessions, and payment processing — all in one platform.",
      cta: "Become a Diviner",
      href: "/get-started#professional_divination_course",
    },
    {
      key: "pm",
      show: !isPerennialMandalism,
      variant: "violet" as const,
      badge: "EXCLUSIVE COMMUNITY",
      title: "Join Perennial Mandalism",
      description:
        "Access exclusive spiritual content, live community events, and deepen your practice with like-minded seekers.",
      cta: "Learn More",
      href: "/get-started#perennial_mandalism_community",
    },
  ].filter((b) => b.show && !dismissed.has(b.key));

  if (visibleBanners.length === 0) return null;

  const variantStyles = {
    emerald: {
      wrapper:
        "from-emerald-950/80 via-teal-950/60 to-slate-950/80 border-emerald-500/25",
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
      wrapper:
        "from-amber-950/80 via-yellow-950/60 to-slate-950/80 border-amber-500/25",
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
      wrapper:
        "from-violet-950/80 via-purple-950/60 to-slate-950/80 border-violet-500/25",
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
    <div className="space-y-3">
      {visibleBanners.map((banner) => {
        const s = variantStyles[banner.variant];
        return (
          <div
            key={banner.key}
            className={`relative overflow-hidden rounded-xl border bg-gradient-to-r ${s.wrapper}`}
          >
            {/* Glow sweep */}
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${s.glow}`}
            />
            {/* Decorative orbs */}
            <div
              className={`pointer-events-none absolute -right-8 -top-8 size-40 rounded-full blur-3xl ${s.orb1}`}
            />
            <div
              className={`pointer-events-none absolute -bottom-6 right-24 size-28 rounded-full blur-2xl ${s.orb2}`}
            />

            <div className="relative flex items-center gap-5 px-5 py-4">
              {/* Graphic icon */}
              <div className="hidden size-14 shrink-0 sm:block">
                {s.iconPath}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <span
                  className={`mb-1.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${s.badge}`}
                >
                  {banner.badge}
                </span>
                <h3 className={`text-base font-bold leading-tight ${s.title}`}>
                  {banner.title}
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed text-white/50">
                  {banner.description}
                </p>
              </div>

              {/* CTA + Dismiss */}
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={banner.href}
                  className={`flex items-center gap-1.5 rounded-lg bg-gradient-to-r px-4 py-2 text-xs font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl ${s.cta} ${s.ctaShadow}`}
                >
                  {banner.cta}
                  <ArrowRight className="size-3.5" />
                </Link>
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
  );
}
