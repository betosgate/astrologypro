"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface StickyNavProps {
  displayName: string;
  hasBio: boolean;
  hasServices: boolean;
  hasTestimonials: boolean;
  bookHref?: string;
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
  bookHref = "#booking",
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
        // Section is already mounted — scroll right away. We still
        // update the URL hash so deep-linking / back-button work.
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        if (window.location.hash !== `#${id}`) {
          history.replaceState(null, "", `#${id}`);
        }
        return;
      }

      // Section isn't in the DOM yet (e.g. the testimonials anchor lives
      // inside a tab that hasn't been activated). Set the hash and
      // dispatch hashchange so listeners (like PublicContentTabs) can
      // mount the right subtree and then scroll once it exists.
      const oldUrl = window.location.href;
      window.location.hash = id;
      const newUrl = window.location.href;
      window.dispatchEvent(
        new HashChangeEvent("hashchange", { oldURL: oldUrl, newURL: newUrl }),
      );
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

          {/* Section links + Book Now */}
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

            {/* Book Now CTA — always visible in sticky nav */}
            <Link
              href={bookHref}
              className="ml-3 inline-flex h-7 items-center rounded-full bg-gold px-4 text-xs font-semibold text-cosmos-900 shadow-[0_0_12px_rgba(201,168,76,0.25)] transition-all hover:bg-gold-light hover:shadow-[0_0_18px_rgba(201,168,76,0.35)]"
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
