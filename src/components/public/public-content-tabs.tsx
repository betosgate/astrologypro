"use client";

import { useState } from "react";

interface PublicContentTabsProps {
  media: React.ReactNode;
  testimonials: React.ReactNode;
  defaultTab?: "media" | "testimonials";
}

export function PublicContentTabs({
  media,
  testimonials,
  defaultTab = "media",
}: PublicContentTabsProps) {
  const [activeTab, setActiveTab] = useState<"media" | "testimonials">(
    defaultTab,
  );

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
