import { Check, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const rows = [
  { tool: "Website (Squarespace/Wix)", diy: "$16\u201340/mo" },
  { tool: "Video Sessions (Zoom Pro)", diy: "$13\u201320/mo" },
  { tool: "Booking System (Calendly)", diy: "$12\u201316/mo" },
  { tool: "Payment Processing Setup", diy: "$0 but hours of work" },
  { tool: "Session Recording", diy: "$10\u201325/mo" },
  { tool: "Client CRM", diy: "$15\u201330/mo" },
  { tool: "Email Marketing", diy: "$10\u201320/mo" },
  { tool: "Social Media Tools", diy: "$15\u201350/mo" },
  { tool: "Affiliate System", diy: "$30\u201350/mo" },
];

export function ComparisonTable() {
  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Stop Juggling{" "}
            <span className="text-primary">10 Different Tools</span>
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            See how much you save by switching to one integrated platform
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border shadow-lg">
          {/* Header */}
          <div className="grid grid-cols-3 border-b bg-muted/50">
            <div className="px-4 py-4 text-sm font-semibold sm:px-6">
              Tool / Feature
            </div>
            <div className="flex items-center gap-2 border-l px-4 py-4 text-sm font-semibold sm:px-6">
              <X className="size-4 text-red-500" />
              DIY Approach
            </div>
            <div className="flex items-center gap-2 border-l bg-primary/5 px-4 py-4 text-sm font-semibold text-primary sm:px-6">
              <Check className="size-4" />
              AstrologyPro
            </div>
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <div
              key={row.tool}
              className={`grid grid-cols-3 ${i < rows.length - 1 ? "border-b" : ""}`}
            >
              <div className="px-4 py-3.5 text-sm sm:px-6">{row.tool}</div>
              <div className="border-l px-4 py-3.5 text-sm font-medium text-orange-500 dark:text-orange-400 sm:px-6">
                {row.diy}
              </div>
              <div className="flex items-center gap-2 border-l bg-primary/5 px-4 py-3.5 sm:px-6">
                <div className="flex size-5 items-center justify-center rounded-full bg-green-500/10">
                  <Check className="size-3 text-green-500" />
                </div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  Included
                </span>
              </div>
            </div>
          ))}

          {/* Total row */}
          <div className="grid grid-cols-3 border-t-2 border-primary/20 bg-muted/30">
            <div className="px-4 py-4 text-sm font-bold sm:px-6">
              Total Monthly Cost
            </div>
            <div className="border-l px-4 py-4 sm:px-6">
              <span className="text-lg font-bold text-red-500 dark:text-red-400">
                $121&ndash;251/mo
              </span>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Plus hours of setup & maintenance
              </p>
            </div>
            <div className="border-l bg-primary/5 px-4 py-4 sm:px-6">
              <span className="text-lg font-bold text-primary">$149/mo</span>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Everything included, ready to go
              </p>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 px-6 py-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              Plus you get extras no DIY setup offers:
            </span>{" "}
            professional astrology &amp; tarot tools, astrological event
            reminders, post-session follow-ups, and a branded business page
            &mdash; all built specifically for diviners.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Button size="lg" asChild className="gap-2 text-base">
            <Link href="/get-started">
              Get Everything for $149/mo
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
