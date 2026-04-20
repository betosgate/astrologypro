"use client";

import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";

interface Props {
  serviceLabel: string;
  startingPrice: number;
  discoverLink: string;
}

export function ReadingStickyBar({ serviceLabel, startingPrice, discoverLink }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 500);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-[#c9a84c]/20 bg-[#06080f]/95 px-4 py-3 backdrop-blur-md transition-transform duration-300 sm:px-6 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <p className="text-sm text-[#b8bcd0]/70">
          <span className="font-semibold text-[#f5f0e8]">{serviceLabel} Reading</span>
          {" · "}Starting from ${startingPrice}
        </p>
        <a
          href={discoverLink}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#c9a84c] px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#e2c97e]"
        >
          Book a Reading <ArrowRight className="size-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
