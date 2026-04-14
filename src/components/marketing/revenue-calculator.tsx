"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign, TrendingUp, Star } from "lucide-react";
import { SectionContainer } from "@/components/shared/section-container";

function useAnimatedNumber(target: number, duration = 400) {
  const [display, setDisplay] = useState(target);
  const frameRef = useRef<number>(0);
  const startRef = useRef(target);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = display;
    startTimeRef.current = null;

    function animate(timestamp: number) {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(
        startRef.current + (target - startRef.current) * eased
      );
      setDisplay(current);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    }

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return display;
}

export function RevenueCalculator() {
  const [readingsPerWeek, setReadingsPerWeek] = useState(5);
  const [pricePerReading, setPricePerReading] = useState(75);

  const monthlyRevenue = readingsPerWeek * 4 * pricePerReading;
  const annualRevenue = monthlyRevenue * 12;
  const subscriptionCost = 149;
  const monthlyProfit = monthlyRevenue - subscriptionCost;
  const breakEvenReadings = Math.ceil(subscriptionCost / pricePerReading);
  const roiPercentage = Math.round(
    ((monthlyRevenue - subscriptionCost) / subscriptionCost) * 100
  );

  const animatedMonthly = useAnimatedNumber(monthlyRevenue);
  const animatedAnnual = useAnimatedNumber(annualRevenue);
  const animatedProfit = useAnimatedNumber(monthlyProfit);
  const animatedRoi = useAnimatedNumber(roiPercentage);

  return (
    <section className="relative">
      <SectionContainer size="narrow" verticalPadding="lg">
        <div className="relative overflow-hidden rounded-3xl border border-[#c9a84c]/15 bg-gradient-to-br from-[#0d1230] via-[#0a0e27] to-[#0d1230] p-8 shadow-2xl sm:p-12">
          {/* Star decorations — gold tinted */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <Star className="absolute left-[10%] top-[15%] size-3 text-[#c9a84c] opacity-15" />
            <Star className="absolute left-[25%] top-[8%] size-2 text-[#e2c97e] opacity-10" />
            <Star className="absolute right-[15%] top-[12%] size-4 text-[#c9a84c] opacity-8" />
            <Star className="absolute right-[30%] top-[20%] size-2 text-[#e2c97e] opacity-15" />
            <Star className="absolute left-[8%] bottom-[20%] size-3 text-[#c9a84c] opacity-10" />
            <Star className="absolute right-[10%] bottom-[15%] size-2 text-[#e2c97e] opacity-15" />
            <Star className="absolute left-[50%] top-[5%] size-3 text-[#c9a84c] opacity-8" />
            <Star className="absolute right-[45%] bottom-[10%] size-2 text-[#c9a84c] opacity-10" />
            {/* Gradient orbs */}
            <div className="absolute -left-20 -top-20 size-60 rounded-full bg-[#c9a84c]/5 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 size-60 rounded-full bg-[#c9a84c]/5 blur-3xl" />
          </div>

          <div className="relative">
            {/* Heading */}
            <div className="mb-10 text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/10 px-4 py-1.5 text-sm text-[#e2c97e]">
                <TrendingUp className="size-3.5" />
                Revenue Calculator
              </div>
              <h2 className="font-display text-3xl font-bold text-[#f5f0e8] sm:text-4xl lg:text-5xl">
                See What You Could{" "}
                <span className="gold-text">
                  Earn
                </span>
              </h2>
            </div>

            {/* Sliders */}
            <div className="mx-auto mb-10 grid max-w-xl gap-8">
              {/* Readings per week */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label
                    htmlFor="readings-per-week"
                    className="text-sm font-medium text-[#b8bcd0]"
                  >
                    Readings per week
                  </label>
                  <span className="rounded-lg bg-[#c9a84c]/15 px-3 py-1 text-lg font-bold text-[#e2c97e]">
                    {readingsPerWeek}
                  </span>
                </div>
                <input
                  id="readings-per-week"
                  type="range"
                  min={1}
                  max={30}
                  value={readingsPerWeek}
                  onChange={(e) =>
                    setReadingsPerWeek(Number(e.target.value))
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#131840] accent-[#c9a84c] [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#c9a84c] [&::-webkit-slider-thumb]:shadow-lg"
                />
                <div className="mt-1 flex justify-between text-xs text-[#c9a84c]/50">
                  <span>1</span>
                  <span>15</span>
                  <span>30</span>
                </div>
              </div>

              {/* Price per reading */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label
                    htmlFor="price-per-reading"
                    className="text-sm font-medium text-[#b8bcd0]"
                  >
                    Average price per reading
                  </label>
                  <span className="rounded-lg bg-[#c9a84c]/15 px-3 py-1 text-lg font-bold text-[#e2c97e]">
                    ${pricePerReading}
                  </span>
                </div>
                <input
                  id="price-per-reading"
                  type="range"
                  min={50}
                  max={200}
                  step={5}
                  value={pricePerReading}
                  onChange={(e) =>
                    setPricePerReading(Number(e.target.value))
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#131840] accent-[#c9a84c] [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#c9a84c] [&::-webkit-slider-thumb]:shadow-lg"
                />
                <div className="mt-1 flex justify-between text-xs text-[#c9a84c]/50">
                  <span>$50</span>
                  <span>$125</span>
                  <span>$200</span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="glass-card rounded-xl p-5 text-center">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#c9a84c]/70">
                  Monthly Revenue
                </p>
                <p className="font-display text-3xl font-bold text-[#e2c97e]">
                  ${animatedMonthly.toLocaleString()}
                </p>
              </div>
              <div className="glass-card rounded-xl p-5 text-center">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#c9a84c]/70">
                  Annual Revenue
                </p>
                <p className="font-display text-3xl font-bold text-[#e2c97e]">
                  ${animatedAnnual.toLocaleString()}
                </p>
              </div>
              <div className="glass-card rounded-xl border-green-400/10 p-5 text-center">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-green-300/70">
                  Monthly Profit
                </p>
                <p className="font-display text-3xl font-bold text-green-300">
                  ${animatedProfit.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-green-400/50">
                  After $149/mo subscription
                </p>
              </div>
              <div className="glass-card rounded-xl p-5 text-center">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#c9a84c]/70">
                  ROI
                </p>
                <p className="font-display text-3xl font-bold text-[#e2c97e]">
                  {animatedRoi}%
                </p>
                <p className="mt-1 text-xs text-[#c9a84c]/50">
                  Return on investment
                </p>
              </div>
            </div>

            {/* Break-even callout */}
            <div className="mb-8 flex items-center justify-center gap-3 rounded-xl border border-[#c9a84c]/20 bg-[#c9a84c]/10 px-6 py-4">
              <DollarSign className="size-5 shrink-0 text-[#c9a84c]" />
              <p className="text-sm text-[#f5f0e8]/80">
                Your subscription pays for itself after just{" "}
                <span className="font-bold text-[#c9a84c]">
                  {breakEvenReadings} reading{breakEvenReadings !== 1 ? "s" : ""}
                </span>{" "}
                per month
              </p>
            </div>

            {/* CTA */}
            <div className="text-center">
              <Button
                size="lg"
                asChild
                className="gap-2 rounded-full bg-[#c9a84c] px-8 text-base font-semibold text-black shadow-lg shadow-[#c9a84c]/25 hover:bg-[#e2c97e]"
              >
                <Link href="/get-started">
                  Start Earning Today
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
