"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Expand,
  Eye,
  Globe,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Orbit,
  Search,
  Settings2,
  Shield,
  ShoppingBag,
  Sparkles,
  Users,
  X,
  Zap,
  ZoomIn,
  type LucideIcon,
} from "lucide-react";
import { type Screen } from "@/lib/walkthrough-data";

type Props = {
  screens: Screen[];
  roleSlug: string;
  roleTitle: string;
};

const GROUP_ICONS: Record<string, LucideIcon> = {
  Advocacy: Zap,
  Astrology: Orbit,
  "Astrology Tools": Orbit,
  Commerce: ShoppingBag,
  Community: Users,
  Config: Settings2,
  Curriculum: GraduationCap,
  Dashboard: LayoutDashboard,
  Discovery: Search,
  Engagement: Sparkles,
  Features: Layers,
  Governance: Shield,
  Marketing: Globe,
  Mastery: Eye,
  Onboarding: Users,
  Schedule: CalendarDays,
  Services: ShoppingBag,
  Training: GraduationCap,
};

const GROUP_DESCRIPTIONS: Record<string, string> = {
  Advocacy: "Referral visibility, partner tools, and earnings tracking.",
  Astrology: "Administrative chart engines and specialized data views.",
  "Astrology Tools": "Natal, relationship, and transit tooling.",
  Commerce: "Orders, payouts, and financial visibility.",
  Community: "Shared rituals, gatherings, and member-facing spaces.",
  Config: "Platform settings, legal controls, and audit surfaces.",
  Curriculum: "Training journeys, structured lessons, and progression.",
  Dashboard: "Primary role-aware command centers.",
  Discovery: "Search, browse, and booking paths for visitors.",
  Engagement: "Live experiences, streaming, and participation loops.",
  Features: "Additional feature pages in this role experience.",
  Governance: "Oversight, user management, and system controls.",
  Marketing: "Public brand surfaces and campaign-oriented pages.",
  Mastery: "Advanced ritual and esoteric practice flows.",
  Onboarding: "Registration and first-run setup screens.",
  Schedule: "Availability, sessions, and calendar operations.",
  Services: "Orders, bookings, subscriptions, and account activity.",
  Training: "Mentor-assigned learning and trainee milestones.",
};

export default function ScreenshotLightbox({ screens, roleSlug, roleTitle }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeGroup, setActiveGroup] = useState(screens[0]?.group || "Features");
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const open = openIndex !== null;
  const current = openIndex !== null ? screens[openIndex] : null;

  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(() => {
    setOpenIndex((value) => {
      if (value === null) return null;
      return value > 0 ? value - 1 : screens.length - 1;
    });
  }, [screens.length]);
  const next = useCallback(() => {
    setOpenIndex((value) => {
      if (value === null) return null;
      return value < screens.length - 1 ? value + 1 : 0;
    });
  }, [screens.length]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") prev();
      if (event.key === "ArrowRight") next();
    };

    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handler);
    };
  }, [close, next, open, prev]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveGroup(entry.target.getAttribute("data-group") || "Features");
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );

    sectionRefs.current.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const groups = useMemo(() => {
    const grouped: Array<{ name: string; screens: Screen[] }> = [];

    for (const screen of screens) {
      const groupName = screen.group || "Features";
      const existing = grouped.find((group) => group.name === groupName);
      if (existing) {
        existing.screens.push(screen);
      } else {
        grouped.push({ name: groupName, screens: [screen] });
      }
    }

    return grouped;
  }, [screens]);

  const scrollToGroup = (groupName: string) => {
    const element = sectionRefs.current.get(groupName);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveGroup(groupName);
  };

  return (
    <>
      <div className="-mx-2 mb-6 overflow-x-auto px-2 lg:hidden">
        <div className="flex gap-2 pb-2">
          {groups.map((group) => {
            const Icon = GROUP_ICONS[group.name] || Layers;
            const isActive = activeGroup === group.name;

            return (
              <button
                key={group.name}
                onClick={() => scrollToGroup(group.name)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? "border border-cyan-400/30 bg-cyan-400/12 text-cyan-300"
                    : "border border-white/10 bg-white/5 text-[#b8bcd0]/75 hover:bg-white/10 hover:text-[#f5f0e8]"
                }`}
              >
                <Icon className="size-3" />
                <span>{group.name}</span>
                <span className="text-[10px] opacity-65">{group.screens.length}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-8">
        <nav className="sticky top-24 hidden w-56 shrink-0 self-start lg:block">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8890af]">
            Sections
          </p>
          <ul className="space-y-1.5">
            {groups.map((group) => {
              const Icon = GROUP_ICONS[group.name] || Layers;
              const isActive = activeGroup === group.name;

              return (
                <li key={group.name}>
                  <button
                    onClick={() => scrollToGroup(group.name)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs transition ${
                      isActive
                        ? "border border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                        : "border border-transparent text-[#a5afca] hover:border-white/8 hover:bg-white/5 hover:text-[#f5f0e8]"
                    }`}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span className="truncate">{group.name}</span>
                    <span className="ml-auto text-[10px] opacity-65">{group.screens.length}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 flex-1">
          {groups.map((group) => {
            const Icon = GROUP_ICONS[group.name] || Layers;
            const description = GROUP_DESCRIPTIONS[group.name];

            return (
              <section
                key={group.name}
                ref={(element) => {
                  if (element) sectionRefs.current.set(group.name, element);
                }}
                data-group={group.name}
                className="mb-12 scroll-mt-24"
                id={`section-${group.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="mb-5 flex items-start gap-3">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                    <Icon className="size-4 text-cyan-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f5f0e8]">
                      {group.name}
                    </h3>
                    {description ? (
                      <p className="mt-1 text-xs leading-5 text-[#b8bcd0]/68">{description}</p>
                    ) : null}
                  </div>
                  <span className="ml-auto shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-[#b8bcd0]/68">
                    {group.screens.length}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {group.screens.map((screen) => {
                    const globalIndex = screens.indexOf(screen);

                    return (
                      <button
                        key={screen.name}
                        onClick={() => setOpenIndex(globalIndex)}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(13,18,33,0.98),rgba(8,10,19,0.98))] text-left shadow-[0_16px_38px_rgba(0,0,0,0.28)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-[0_22px_50px_rgba(0,0,0,0.36)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40"
                      >
                        <div className="relative aspect-video overflow-hidden border-b border-white/10 bg-[#07111f]">
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,10,20,0.08),rgba(5,10,20,0.55))]" />
                          <Image
                            src={`/walkthrough/screenshots/${roleSlug}/${screen.name}.png`}
                            alt={`${roleTitle} - ${screen.label}`}
                            fill
                            className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            loading={globalIndex < 6 ? "eager" : "lazy"}
                          />
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[linear-gradient(90deg,rgba(34,211,238,0.88),rgba(34,211,238,0.08))]" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 group-hover:bg-black/40">
                            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
                              <Expand className="size-3.5" />
                              View full size
                            </div>
                          </div>
                        </div>

                        <div className="px-4 py-4">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-[#f5f0e8] transition-colors group-hover:text-cyan-300">
                              {screen.label}
                            </p>
                            <ZoomIn className="size-3.5 shrink-0 text-[#8e9ab7] transition-colors group-hover:text-cyan-300/80" />
                          </div>
                          {screen.description ? (
                            <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[#b8bcd0]/72">
                              {screen.description}
                            </p>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {open && current ? (
        <div className="fixed inset-0 z-50 flex flex-col" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={close} />

          <div className="relative z-10 flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="shrink-0 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
                {openIndex! + 1} / {screens.length}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{current.label}</p>
                {current.description ? (
                  <p className="hidden truncate text-xs text-white/60 sm:block">{current.description}</p>
                ) : null}
              </div>
            </div>

            <button
              onClick={close}
              className="rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 pb-4">
            <button
              onClick={prev}
              className="absolute left-2 z-20 rounded-full bg-black/60 p-2.5 text-white/70 backdrop-blur-sm transition-all hover:bg-black/80 hover:text-white sm:left-4"
              aria-label="Previous"
            >
              <ChevronLeft className="size-5" />
            </button>

            <div className="relative mx-auto h-full w-full max-w-6xl">
              <Image
                src={`/walkthrough/screenshots/${roleSlug}/${current.name}.png`}
                alt={`${roleTitle} - ${current.label}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>

            <button
              onClick={next}
              className="absolute right-2 z-20 rounded-full bg-black/60 p-2.5 text-white/70 backdrop-blur-sm transition-all hover:bg-black/80 hover:text-white sm:right-4"
              aria-label="Next"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          <div className="relative z-10 px-4 pb-3 sm:px-6">
            <div className="flex gap-1.5 overflow-x-auto py-1">
              {screens.map((screen, index) => (
                <button
                  key={screen.name}
                  onClick={() => setOpenIndex(index)}
                  className={`relative h-14 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                    index === openIndex
                      ? "border-cyan-300 opacity-100 scale-105 shadow-[0_0_15px_rgba(103,232,249,0.4)]"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <Image
                    src={`/walkthrough/screenshots/${roleSlug}/${screen.name}.png`}
                    alt={screen.label}
                    fill
                    className="object-cover object-top"
                    sizes="80px"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
