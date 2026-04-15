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
  ZoomOut,
  RotateCcw,
  Plus,
  Minus,
  Info,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { type Screen } from "@/lib/walkthrough-data";
import { cn } from "@/lib/utils";


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
  "Dashboard & Decans": Eye,
  Discovery: Search,
  "Discovery & Access": Search,
  Engagement: Sparkles,
  "Enrollment & Checkout": ShoppingBag,
  Features: Layers,
  Governance: Shield,
  "Horoscope Toolkit": Sparkles,
  Marketing: Globe,
  Mastery: Eye,
  Onboarding: Users,
  "My Schedule": CalendarDays,
  "Manage Testimonial": MessageSquare,
  Support: MessageSquare,
  Tools: Settings2,
  "Training & Graduation": GraduationCap,
  Reports: BarChart3,
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
  "Dashboard & Decans": "The 36-decan journey dashboard, individual decan study pages, and guided ritual execution.",
  "Manage Testimonial": "Moderation of user feedback and public ratings.",
  Discovery: "Search, browse, and booking paths for visitors.",
  "Discovery & Access": "How users find, access, and switch to the Mystery School portal.",
  Engagement: "Live experiences, streaming, and participation loops.",
  "Enrollment & Checkout": "Multi-step signup wizard, Stripe payment, and post-checkout finalization.",
  Features: "Additional feature pages in this role experience.",
  Governance: "Oversight, user management, and system controls.",
  Marketing: "Public brand surfaces and campaign-oriented pages.",
  Mastery: "Advanced ritual and esoteric practice flows.",
  Onboarding: "Registration and first-run setup screens.",
  "My Schedule": "Availability, sessions, and calendar operations.",
  Services: "Orders, bookings, subscriptions, and account activity.",
  Training: "Mentor-assigned learning and trainee milestones.",
  "Training & Graduation": "Foundation Q1 curriculum, lesson modules, graduation eligibility, and post-grad ritual builder.",
};

export default function ScreenshotLightbox({ screens, roleSlug, roleTitle }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeGroup, setActiveGroup] = useState(screens[0]?.group || "Features");
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set([screens[0]?.group || "Features"]));
  const [expandedSubModules, setExpandedSubModules] = useState<Set<string>>(new Set());
  const [activeScreen, setActiveScreen] = useState<string | null>(null);
  const [activeSubModule, setActiveSubModule] = useState<string | null>(null);

  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const subModuleRefs = useRef<Map<string, HTMLElement>>(new Map());
  const screenRefs = useRef<Map<string, HTMLElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  const open = openIndex !== null;
  const current = openIndex !== null ? screens[openIndex] : null;

  const close = useCallback(() => {
    setOpenIndex(null);
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const prev = useCallback(() => {
    setOpenIndex((value) => {
      if (value === null) return null;
      resetZoom();
      return value > 0 ? value - 1 : screens.length - 1;
    });
  }, [screens.length, resetZoom]);

  const next = useCallback(() => {
    setOpenIndex((value) => {
      if (value === null) return null;
      resetZoom();
      return value < screens.length - 1 ? value + 1 : 0;
    });
  }, [screens.length, resetZoom]);

  const handleZoom = (delta: number) => {
    setScale(prev => {
      const newScale = Math.min(Math.max(prev + delta, 1), 4);
      if (newScale === 1) setOffset({ x: 0, y: 0 });
      return newScale;
    });
  };

  // Used to prevent IntersectionObserver from fighting with user-clicked scrolls
  const isClickScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout>();

  // Panning logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setStartPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    const newX = e.clientX - startPos.x;
    const newY = e.clientY - startPos.y;

    // Boundary check logic could be added here, but simple pan for now
    setOffset({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

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
        if (isClickScrolling.current) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const groupName = entry.target.getAttribute("data-group-name");
            const screenName = entry.target.getAttribute("data-screen-name");
            const subModuleName = entry.target.getAttribute("data-sub-module-name");

            if (groupName) setActiveGroup(groupName);
            if (screenName) setActiveScreen(screenName);
            if (subModuleName) {
              setActiveSubModule(subModuleName);
              // Auto-expand if not already
              setExpandedSubModules(prev => {
                if (prev.has(subModuleName)) return prev;
                const next = new Set(prev);
                next.add(subModuleName);
                return next;
              });
            }
          }
        });
      },
      {
        root: containerRef.current,
        rootMargin: "-10% 0px -70% 0px",
        threshold: [0, 0.1, 0.5]
      }
    );

    screenRefs.current.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, [screens]);

  // Scroll to Top visibility listener
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const groups = useMemo(() => {
    const grouped: Array<{
      name: string;
      subModules: Array<{ name: string; screens: Screen[] }>;
      totalScreens: number;
    }> = [];

    for (const screen of screens) {
      const groupName = screen.group || "Features";
      const subModuleName = screen.subModule || "General";

      let group = grouped.find((g) => g.name === groupName);
      if (!group) {
        group = { name: groupName, subModules: [], totalScreens: 0 };
        grouped.push(group);
      }

      let subModule = group.subModules.find((sm) => sm.name === subModuleName);
      if (!subModule) {
        subModule = { name: subModuleName, screens: [] };
        group.subModules.push(subModule);
      }

      subModule.screens.push(screen);
      group.totalScreens++;
    }

    return grouped;
  }, [screens]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  const toggleSubModule = (subModuleName: string) => {
    setExpandedSubModules(prev => {
      const next = new Set(prev);
      if (next.has(subModuleName)) {
        next.delete(subModuleName);
      } else {
        next.add(subModuleName);
      }
      return next;
    });
  };

  const handleScrollClick = (callback: () => void) => {
    isClickScrolling.current = true;
    callback();

    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      isClickScrolling.current = false;
    }, 800); // Wait for smooth scroll to finish
  };

  const scrollToGroup = (groupName: string) => {
    handleScrollClick(() => {
      const element = sectionRefs.current.get(groupName);
      if (!element) return;
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveGroup(groupName);
    });

    // Ensure expanded
    setExpandedGroups(prev => {
      if (prev.has(groupName)) return prev;
      const next = new Set(prev);
      next.add(groupName);
      return next;
    });
  };

  const scrollToSubModule = (subModuleName: string, groupName: string) => {
    handleScrollClick(() => {
      if (!expandedGroups.has(groupName)) {
        toggleGroup(groupName);
      }
      const element = subModuleRefs.current.get(subModuleName);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        // Fallback to screen-based scroll if sub-module ref not found
        const group = groups.find(g => g.name === groupName);
        const subModule = group?.subModules.find(sm => sm.name === subModuleName);
        if (subModule?.screens[0]) {
          scrollToScreenDOM(subModule.screens[0].name, groupName);
        }
      }
      setActiveSubModule(subModuleName);
    });

    // Auto expand the sub-module tracking
    setExpandedSubModules(prev => {
      const next = new Set(prev);
      next.add(subModuleName);
      return next;
    });
  };

  const scrollToScreenDOM = (screenName: string, groupName: string) => {
    // Try Ref first, fallback to DOM ID search
    let element = screenRefs.current.get(screenName);
    if (!element) {
      element = document.getElementById(`screen-${screenName}`) || undefined;
    }

    if (!element) return;

    element.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveScreen(screenName);
    setActiveGroup(groupName);
  };

  const scrollToScreen = (screenName: string, groupName: string) => {
    handleScrollClick(() => {
      scrollToScreenDOM(screenName, groupName);
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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
                title={`Scroll to ${group.name}`}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${isActive
                  ? "border border-amber-500/30 bg-amber-500/12 text-amber-500"
                  : "border border-white/10 bg-white/5 text-[#b8bcd0]/75 hover:bg-white/10 hover:text-[#f5f0e8]"
                  }`}
              >
                <Icon className="size-3" />
                <span>{group.name}</span>
                <span className="text-[10px] opacity-65">{group.totalScreens}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-8">
        <nav className="sticky top-24 hidden w-64 shrink-0 self-start lg:block max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-500/20 hover:scrollbar-thumb-amber-500/40">
          <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/50">
            Explorer Index
          </p>
          <div className="space-y-1.5 px-1">
            {groups.map((group) => {
              const Icon = GROUP_ICONS[group.name] || Layers;
              const isActive = activeGroup === group.name;
              const isExpanded = expandedGroups.has(group.name);

              return (
                <div key={group.name} className="flex flex-col">
                  <button
                    onClick={() => {
                      toggleGroup(group.name);
                      if (!isExpanded) scrollToGroup(group.name);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all duration-200",
                      isActive
                        ? "text-amber-500"
                        : "text-[#a5afca] hover:bg-white/5 hover:text-[#f5f0e8]"
                    )}
                  >
                    <Icon className={cn("size-3.5 shrink-0", isActive ? "text-amber-500" : "opacity-40")} />
                    <span className="flex-1 truncate">{group.name}</span>
                    <ChevronRight
                      className={cn(
                        "size-3 opacity-30 transition-transform duration-200",
                        isExpanded && "rotate-90 opacity-60"
                      )}
                    />
                  </button>

                  <div className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isExpanded ? "mt-1 max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                  )}>
                    <div className="ml-5 flex flex-col gap-1.5 border-l border-white/5 pl-3 py-1">
                      {group.subModules.map((sub) => {
                        const isSubActive = activeSubModule === sub.name;
                        const isSubExpanded = expandedSubModules.has(sub.name);
                        const hasSubModule = sub.name !== "General";

                        return (
                          <div key={sub.name} className="flex flex-col gap-1">
                            {hasSubModule ? (
                              <button
                                onClick={() => {
                                  toggleSubModule(sub.name);
                                  scrollToSubModule(sub.name, group.name);
                                }}
                                className={cn(
                                  "flex w-full items-center gap-2 rounded-lg py-1.5 px-2 text-left text-[11px] font-bold transition-all",
                                  isSubActive
                                    ? "text-amber-500 bg-amber-500/5 shadow-[inset_0_0_10px_rgba(245,158,11,0.05)]"
                                    : "text-[#8e9ab7] hover:bg-white/5 hover:text-[#f5f0e8]"
                                )}
                              >
                                {isSubExpanded ? <ChevronDown className="size-2.5 opacity-50" /> : <ChevronRight className="size-2.5 opacity-50" />}
                                <span className="flex-1 truncate">{sub.name}</span>
                              </button>
                            ) : null}

                            <div className={cn(
                              "flex flex-col gap-0.5",
                              hasSubModule && !isSubExpanded ? "hidden" : "block",
                              hasSubModule && "ml-3 border-l border-white/5 pl-2"
                            )}>
                              {sub.screens.map((screen) => {
                                const isScreenActive = activeScreen === screen.name;
                                return (
                                  <button
                                    key={screen.name}
                                    onClick={() => scrollToScreen(screen.name, group.name)}
                                    className={cn(
                                      "group relative flex w-full items-center gap-2.5 rounded-lg py-1.5 pl-3 pr-2 text-left text-[11px] transition-all duration-300",
                                      isScreenActive
                                        ? "bg-amber-500/15 font-bold text-amber-500 shadow-[inset_0_0_15px_rgba(245,158,11,0.1)]"
                                        : "text-muted-foreground/60 hover:bg-white/[0.03] hover:text-[#f5f0e8]"
                                    )}
                                  >
                                    <div className={cn(
                                      "size-1.5 shrink-0 rounded-full transition-all duration-500",
                                      isScreenActive
                                        ? "bg-amber-500 scale-125 shadow-[0_0_10px_rgba(245,158,11,0.8)]"
                                        : "bg-white/20 group-hover:bg-white/40"
                                    )} />
                                    <span className={cn(
                                      "truncate transition-colors duration-300",
                                      isScreenActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                                    )}>
                                      {screen.label}
                                    </span>
                                    {isScreenActive && (
                                      <div className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </nav>

        <div className="min-w-0 flex-1" ref={containerRef}>
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
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                    <Icon className="size-4 text-amber-500" />
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
                    {group.totalScreens}
                  </span>
                </div>

                <div className="space-y-10">
                  {group.subModules.map((sub) => {
                    const hasSubModule = sub.name !== "General";

                    return (
                      <div
                        key={sub.name}
                        ref={(element) => {
                          if (element) subModuleRefs.current.set(sub.name, element);
                        }}
                        className={cn(hasSubModule && "relative pt-2")}
                      >
                        {hasSubModule ? (
                          <div className="mb-6 flex items-center gap-3">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-[11px] font-bold tracking-widest text-amber-500 uppercase shadow-[0_0_20px_rgba(245,158,11,0.05)]">
                              <Orbit className="size-3" />
                              {sub.name}
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                          </div>
                        ) : null}

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {sub.screens.map((screen) => {
                            const globalIndex = screens.indexOf(screen);
                            const isScreenActive = activeScreen === screen.name;

                            return (
                              <button
                                key={screen.name}
                                id={`screen-${screen.name}`}
                                ref={(element) => {
                                  if (element) screenRefs.current.set(screen.name, element);
                                }}
                                data-group-name={group.name}
                                data-screen-name={screen.name}
                                data-sub-module-name={sub.name}
                                onClick={() => setOpenIndex(globalIndex)}
                                className={cn(
                                  "group flex flex-col cursor-pointer overflow-hidden rounded-2xl border transition-all duration-500",
                                  "bg-[linear-gradient(180deg,rgba(13,18,33,0.98),rgba(8,10,19,0.98))] text-left",
                                  isScreenActive
                                    ? "border-amber-500/50 -translate-y-1.5 shadow-[0_22px_50px_rgba(0,0,0,0.36),0_0_25px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20"
                                    : "border-white/10 hover:-translate-y-1 hover:border-amber-500/30 hover:shadow-[0_22px_50px_rgba(0,0,0,0.36)]"
                                )}
                              >
                                <div className="relative aspect-video overflow-hidden border-b border-white/10 bg-[#07111f]">
                                  <Image
                                    src={`/walkthrough/screenshots/${roleSlug}/${screen.name}.png`}
                                    alt={`${roleTitle} - ${screen.label}`}
                                    fill
                                    className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    loading={globalIndex < 6 ? "eager" : "lazy"}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 group-hover:bg-black/40">
                                    <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
                                      <Expand className="size-3.5" />
                                      View full size
                                    </div>
                                  </div>
                                </div>

                                <div className="px-5 py-5">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className={cn(
                                      "truncate text-sm font-bold transition-colors",
                                      isScreenActive ? "text-amber-500" : "text-[#f5f0e8] group-hover:text-amber-500"
                                    )}>
                                      {screen.label}
                                    </p>
                                    <div className="flex items-center gap-1.5 opacity-50 transition-opacity group-hover:opacity-100">
                                      {screen.purpose && (
                                        <span title="Operational Purpose">
                                          <Info className="size-3 text-amber-500" />
                                        </span>
                                      )}
                                      <span title="Expand View">
                                        <ZoomIn className="size-3.5 shrink-0 text-[#8e9ab7] transition-colors group-hover:text-amber-500/80" />
                                      </span>
                                    </div>
                                  </div>
                                  {screen.description ? (
                                    <p className="mt-2 text-xs font-medium leading-relaxed text-[#b8bcd0]/60">
                                      {screen.description}
                                    </p>
                                  ) : null}

                                  {screen.purpose && (
                                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                      <div className="mt-0.5 size-1 shrink-0 rounded-full bg-amber-500" />
                                      <p className="line-clamp-2 text-[10px] leading-relaxed text-[#b8bcd0]/80">
                                        {screen.purpose}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-amber-500/20 bg-black/60 text-amber-500 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-amber-500 hover:text-black hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] ${showScrollTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-10 opacity-0"
          }`}
        title="Scroll to Top"
      >
        <ChevronUp className="size-6" />
      </button>

      {open && current ? (
        <div className="fixed inset-0 z-50 flex flex-col" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-[#06080f]/98 backdrop-blur-xl" onClick={close} />

          <div className="relative z-10 flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="shrink-0 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500">
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
              title="Close Walkthrough (Esc)"
              className="rounded-full cursor-pointer p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4 lg:flex-row lg:px-8">
            <div
              className="relative flex-1 flex items-center justify-center overflow-hidden cursor-default"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              ref={containerRef}
            >
              <button
                onClick={prev}
                title="Previous Screen (Left Arrow)"
                className="absolute left-2 z-20 cursor-pointer rounded-full bg-black/60 p-2.5 text-white/70 backdrop-blur-sm transition-all hover:bg-white hover:text-black sm:left-4"
                aria-label="Previous"
              >
                <ChevronLeft className="size-5" />
              </button>

              <div
                className={`relative h-full w-full max-w-5xl transition-transform duration-200 ease-out select-none ${isDragging ? "transition-none" : ""}`}
                style={{
                  transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
                  cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
                }}
              >
                <Image
                  src={`/walkthrough/screenshots/${roleSlug}/${current.name}.png`}
                  alt={`${roleTitle} - ${current.label}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  quality={95}
                  priority
                  draggable={false}
                />
              </div>

              <button
                onClick={next}
                title="Next Screen (Right Arrow)"
                className="absolute right-2 z-20 cursor-pointer rounded-full bg-black/60 p-2.5 text-white/70 backdrop-blur-sm transition-all hover:bg-white hover:text-black sm:right-4"
                aria-label="Next"
              >
                <ChevronRight className="size-5" />
              </button>

              {/* Bottom Zoom Controls */}
              <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-black/60 p-1 backdrop-blur-md">
                <button
                  onClick={() => handleZoom(-0.5)}
                  disabled={scale <= 1}
                  className="rounded-full cursor-pointer p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
                  title="Zoom Out"
                >
                  <Minus className="size-4" />
                </button>
                <div className="min-w-14 text-center text-[10px] font-bold text-white/80">
                  {Math.round(scale * 100)}%
                </div>
                <button
                  onClick={() => handleZoom(0.5)}
                  disabled={scale >= 4}
                  className="rounded-full cursor-pointer p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
                  title="Zoom In"
                >
                  <Plus className="size-4" />
                </button>
                <div className="mx-1 h-4 w-px bg-white/10" />
                <button
                  onClick={resetZoom}
                  disabled={scale === 1 && offset.x === 0 && offset.y === 0}
                  className="rounded-full cursor-pointer p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
                  title="Reset Zoom"
                >
                  <RotateCcw className="size-4" />
                </button>
              </div>
            </div>

            {/* Information Panel */}
            <div className="w-full shrink-0 overflow-y-auto rounded-[2rem] border border-white/10 bg-[#0d121f]/60 p-6 backdrop-blur-xl lg:w-[28rem] xl:w-[32rem] 2xl:w-[36rem] 2xl:p-8 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500/80">
                <Info className="size-3" />
                Screen Context
              </div>

              <h3 className="mt-4 text-xl font-bold text-white">
                {current.label}
              </h3>

              <div className="mt-6 flex flex-col gap-6">
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30">The Purpose</h4>
                  <p className="mt-3 text-[15px] font-medium leading-[1.65] text-white/95">
                    {current.purpose || current.description || "The purpose of this screen is to provide specialized administrative controls for AstrologyPro's governance system."}
                  </p>
                </div>

                {current.bullets && current.bullets.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30">How It Works</h4>
                    <div className="mt-4 space-y-3.5">
                      {current.bullets.map((bullet) => (
                        <div key={bullet} className="flex items-start gap-3 text-[13.5px] font-medium leading-relaxed text-[#f5f0e8]/90">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-amber-500/60" />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl bg-white/[0.03] p-4 text-[10px] text-white/30 italic">
                  Tip: Use Arrow keys to navigate through the {roleTitle} portal modules.
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 px-4 pb-4 sm:px-6">
            <div className="flex gap-1.5 overflow-x-auto py-2">
              {screens.map((screen, index) => (
                <button
                  key={screen.name}
                  onClick={() => setOpenIndex(index)}
                  title={screen.label}
                  className={`relative cursor-pointer h-14 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${index === openIndex
                    ? "border-amber-500 opacity-100 scale-105 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                    : "border-transparent opacity-40 hover:opacity-70"
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
