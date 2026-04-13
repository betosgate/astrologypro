"use client";

import Link from "next/link";
import {
  GraduationCap,
  Star,
  Sparkles,
  ArrowRight,
  X,
} from "lucide-react";
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

  const banners: {
    key: string;
    show: boolean;
    icon: React.ElementType;
    iconColor: string;
    borderColor: string;
    bgColor: string;
    title: string;
    description: string;
    cta: string;
    href: string;
  }[] = [
    {
      key: "trainee",
      show: isDiviner && !isTrainee,
      icon: GraduationCap,
      iconColor: "text-emerald-500",
      borderColor: "border-emerald-500/20",
      bgColor: "bg-emerald-500/5",
      title: "Become a Certified Diviner",
      description:
        "Enroll in our training program — learn from expert instructors, complete interactive lessons, and earn your certification.",
      cta: "Explore Training",
      href: "/get-started#trainee_program",
    },
    {
      key: "diviner",
      show: isTrainee && !isDiviner,
      icon: Star,
      iconColor: "text-primary",
      borderColor: "border-primary/20",
      bgColor: "bg-primary/5",
      title: "Launch Your Divination Practice",
      description:
        "Ready to start taking clients? Sign up as a diviner to get your branded page, booking system, video sessions, and payment processing.",
      cta: "Become a Diviner",
      href: "/get-started#professional_divination_course",
    },
    {
      key: "pm",
      show: !isPerennialMandalism,
      icon: Sparkles,
      iconColor: "text-violet-500",
      borderColor: "border-violet-500/20",
      bgColor: "bg-violet-500/5",
      title: "Join the Perennial Mandalism Community",
      description:
        "Access exclusive spiritual content, community events, and deepen your practice with like-minded seekers.",
      cta: "Learn More",
      href: "/get-started#perennial_mandalism_community",
    },
  ];

  const visibleBanners = banners.filter(
    (b) => b.show && !dismissed.has(b.key)
  );

  if (visibleBanners.length === 0) return null;

  return (
    <div className="space-y-3">
      {visibleBanners.map((banner) => {
        const Icon = banner.icon;
        return (
          <div
            key={banner.key}
            className={`relative flex items-center justify-between gap-4 rounded-lg border ${banner.borderColor} ${banner.bgColor} px-4 py-3 text-sm`}
          >
            <div className="flex items-start gap-3 min-w-0">
              <Icon
                className={`size-5 shrink-0 mt-0.5 ${banner.iconColor}`}
              />
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  {banner.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  {banner.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={banner.href}
                className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${banner.iconColor} hover:underline underline-offset-2`}
              >
                {banner.cta}
                <ArrowRight className="size-3" />
              </Link>
              <button
                type="button"
                onClick={() => dismiss(banner.key)}
                className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={`Dismiss ${banner.title}`}
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
