"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  DynamicPricingSection,
  type PricingItemData,
} from "@/components/marketing/dynamic-pricing-card";

export function PricingCard() {
  const [item, setItem] = useState<PricingItemData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadPricing() {
      try {
        const response = await fetch(
          "/api/pricing?keys=professional_divination_course",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load pricing");
        }

        const payload = (await response.json()) as {
          items?: PricingItemData[];
        };

        if (active) {
          setItem(payload.items?.[0] ?? null);
        }
      } catch (error) {
        console.error("Failed to load pricing for marketing card", error);
        if (active) {
          setItem(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPricing();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section
        id="pricing"
        className="flex min-h-[280px] items-center justify-center rounded-3xl border border-white/15 bg-white/6 p-8 shadow-[0_22px_60px_rgba(15,23,42,0.32)] backdrop-blur"
      >
        <Loader2 className="h-8 w-8 animate-spin text-white/70" />
      </section>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <section id="pricing">
      <DynamicPricingSection item={item} linkMode />
    </section>
  );
}
