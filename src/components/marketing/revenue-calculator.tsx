"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign, TrendingUp, Star } from "lucide-react";

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
    <section className="relative px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 p-8 shadow-2xl sm:p-12">
          {/* Star decorations */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <Star className="absolute left-[10%] top-[15%] size-3 text-purple-300 opacity-20" />
            <Star className="absolute left-[25%] top-[8%] size-2 text-indigo-300 opacity-15" />
            <Star className="absolute right-[15%] top-[12%] size-4 text-purple-200 opacity-10" />
            <Star className="absolute right-[30%] top-[20%] size-2 text-indigo-200 opacity-20" />
            <Star className="absolute left-[8%] bottom-[20%] size-3 text-purple-300 opacity-15" />
            <Star className="absolute right-[10%] bottom-[15%] size-2 text-indigo-300 opacity-20" />
            <Star className="absolute left-[50%] top-[5%] size-3 text-purple-200 opacity-10" />
            <Star className="absolute right-[45%] bottom-[10%] size-2 text-purple-300 opacity-15" />
            {/* Gradient orbs */}
            <div className="absolute -left-20 -top-20 size-60 rounded-full bg-purple-500/10 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 size-60 rounded-full bg-indigo-500/10 blur-3xl" />
          </div>

          <div className="relative">
            {/* Heading */}
            <div className="mb-10 text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-200">
                <TrendingUp className="size-3.5" />
                Revenue Calculator
              </div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                See What You Could{" "}
                <span className="bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
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
                    className="text-sm font-medium text-purple-100"
                  >
                    Readings per week
                  </label>
                  <span className="rounded-lg bg-purple-500/20 px-3 py-1 text-lg font-bold text-white">
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
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-purple-800 accent-purple-400 [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:shadow-lg"
                />
                <div className="mt-1 flex justify-between text-xs text-purple-400">
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
                    className="text-sm font-medium text-purple-100"
                  >
                    Average price per reading
                  </label>
                  <span className="rounded-lg bg-purple-500/20 px-3 py-1 text-lg font-bold text-white">
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
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-purple-800 accent-purple-400 [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:shadow-lg"
                />
                <div className="mt-1 flex justify-between text-xs text-purple-400">
                  <span>$50</span>
                  <span>$125</span>
                  <span>$200</span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-purple-400/10 bg-purple-500/10 p-5 text-center backdrop-blur-sm">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-purple-300">
                  Monthly Revenue
                </p>
                <p className="text-3xl font-bold text-white">
                  ${animatedMonthly.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border border-purple-400/10 bg-purple-500/10 p-5 text-center backdrop-blur-sm">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-purple-300">
                  Annual Revenue
                </p>
                <p className="text-3xl font-bold text-white">
                  ${animatedAnnual.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border border-green-400/10 bg-green-500/10 p-5 text-center backdrop-blur-sm">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-green-300">
                  Monthly Profit
                </p>
                <p className="text-3xl font-bold text-green-300">
                  ${animatedProfit.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-green-400/70">
                  After $149/mo subscription
                </p>
              </div>
              <div className="rounded-xl border border-indigo-400/10 bg-indigo-500/10 p-5 text-center backdrop-blur-sm">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-indigo-300">
                  ROI
                </p>
                <p className="text-3xl font-bold text-indigo-300">
                  {animatedRoi}%
                </p>
                <p className="mt-1 text-xs text-indigo-400/70">
                  Return on investment
                </p>
              </div>
            </div>

            {/* Break-even callout */}
            <div className="mb-8 flex items-center justify-center gap-3 rounded-xl border border-yellow-400/20 bg-yellow-500/10 px-6 py-4">
              <DollarSign className="size-5 shrink-0 text-yellow-300" />
              <p className="text-sm text-yellow-100">
                Your subscription pays for itself after just{" "}
                <span className="font-bold text-yellow-300">
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
                className="gap-2 bg-white text-base font-semibold text-purple-900 shadow-lg hover:bg-purple-50"
              >
                <Link href="/get-started">
                  Start Earning Today
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
