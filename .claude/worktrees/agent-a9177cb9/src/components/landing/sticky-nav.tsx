"use client";

import { useEffect, useState, useCallback } from "react";

interface StickyNavProps {
  displayName: string;
  hasBio: boolean;
  hasServices: boolean;
  hasTestimonials: boolean;
}

const sections = [
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "reviews", label: "Reviews" },
  { id: "booking", label: "Book" },
] as const;

export function StickyNav({
  displayName,
  hasBio,
  hasServices,
  hasTestimonials,
}: StickyNavProps) {
  const [visible, setVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  const filteredSections = sections.filter((s) => {
    if (s.id === "about" && !hasBio) return false;
    if (s.id === "services" && !hasServices) return false;
    if (s.id === "reviews" && !hasTestimonials) return false;
    return true;
  });

  useEffect(() => {
    const heroEl = document.getElementById("hero");
    if (!heroEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" }
    );

    observer.observe(heroEl);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sectionIds = filteredSections.map((s) => s.id);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { threshold: 0.3, rootMargin: "-100px 0px -40% 0px" }
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [filteredSections]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    []
  );

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-40 transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      }`}
      aria-label="Section navigation"
    >
      <div className="border-b border-white/[0.06] bg-cosmos-900/80 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
          {/* Diviner name */}
          <span className="text-sm font-medium text-cream/70">
            {displayName}
          </span>

          {/* Section links */}
          <div className="flex items-center gap-1">
            {filteredSections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={(e) => handleClick(e, section.id)}
                className={`relative px-3 py-1.5 text-sm transition-colors ${
                  activeSection === section.id
                    ? "text-gold"
                    : "text-silver/60 hover:text-silver"
                }`}
              >
                {section.label}
                {activeSection === section.id && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gold" />
                )}
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
