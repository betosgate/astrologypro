"use client";

import { useEffect, useState } from "react";

interface PublicContentTabsProps {
  media: React.ReactNode;
  testimonials: React.ReactNode;
  defaultTab?: "media" | "testimonials";
}

/**
 * The Media / Testimonials tab toggle on a diviner profile. Only the
 * currently-active tab's content is mounted, which means the
 * <section id="reviews"> from TestimonialsSection only exists in the DOM
 * when the testimonials tab is active.
 *
 * That gating used to break the StickyNav "Reviews" link: clicking it
 * called document.getElementById("reviews") → null → scrollIntoView
 * silently no-op'd. The hash listener below fixes it: any time the URL
 * hash points at the reviews/testimonials anchor (on first load OR after
 * a click), we flip to the testimonials tab and then scroll once it has
 * mounted.
 */
export function PublicContentTabs({
  media,
  testimonials,
  defaultTab = "media",
}: PublicContentTabsProps) {
  const [activeTab, setActiveTab] = useState<"media" | "testimonials">(
    defaultTab,
  );

  useEffect(() => {
    function syncFromHash() {
      if (typeof window === "undefined") return;
      const hash = window.location.hash.toLowerCase();
      if (hash !== "#reviews" && hash !== "#testimonials") return;

      // Switch tab so the testimonials subtree mounts.
      setActiveTab("testimonials");

      // Scroll once React has a chance to commit the new tab content.
      // We use requestAnimationFrame inside requestAnimationFrame to
      // wait one full paint — by that point the section element exists.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = document.getElementById("reviews");
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      });
    }

    // Run once on mount in case the page was loaded with the hash already
    // present (e.g. someone shared a /[username]#reviews link).
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  return (
    <section id="media-testimonials" className="py-10 md:py-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => setActiveTab("media")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                activeTab === "media"
                  ? "bg-gold text-cosmos-900"
                  : "text-silver/70 hover:text-cream"
              }`}
            >
              My Media
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("testimonials")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                activeTab === "testimonials"
                  ? "bg-gold text-cosmos-900"
                  : "text-silver/70 hover:text-cream"
              }`}
            >
              Testimonials
            </button>
          </div>
        </div>

        {activeTab === "media" ? media : testimonials}
      </div>

      <div className="cosmic-divider mx-auto mt-10 max-w-6xl md:mt-14" />
    </section>
  );
}
