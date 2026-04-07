import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { APP_URL } from "@/lib/constants";
import { ArrowRight } from "lucide-react";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Milestone Astrology Readings | AstrologyPro",
    description:
      "Certain moments in life call for deeper astrological insight. Saturn Return, Jupiter Return, and Solar Return readings — designed for the pivotal transitions written in your birth chart.",
    openGraph: {
      title: "Milestone Astrology Readings | AstrologyPro",
      description: "Saturn Return, Jupiter Return, and Solar Return readings — for the pivotal transitions written in your birth chart.",
      type: "website",
      url: `${APP_URL}/readings`,
    },
  };
}

const readings = [
  {
    slug: "saturn-return",
    title: "Saturn Return",
    subtitle: "The Great Life Audit",
    description:
      "Occurring every ~29.5 years, your Saturn Return is a defining rite of passage. Career pivots, relationship milestones, and identity shifts all converge as Saturn demands you step fully into the next chapter of your life.",
    timing: "Ages 27–30 · 56–60 · 84–88",
    icon: "🪐",
    gradient: "from-purple-900/30 to-indigo-900/20",
    accent: "#9b7fe8",
  },
  {
    slug: "jupiter-return",
    title: "Jupiter Return",
    subtitle: "A Cycle of Abundance",
    description:
      "Every ~12 years, Jupiter returns to its birth position bringing expansion, luck, and opportunity. One of the most fortunate transits in astrology — a cosmic green light for bold new beginnings.",
    timing: "Ages 12 · 24 · 35 · 47 · 59",
    icon: "✨",
    gradient: "from-blue-900/30 to-cyan-900/20",
    accent: "#4c8bc9",
  },
  {
    slug: "solar-return",
    title: "Solar Return",
    subtitle: "Your Personal New Year",
    description:
      "Every year on your birthday, the Sun returns to its exact natal position — creating a new energetic blueprint for the next 12 months. A Solar Return reading is the clearest roadmap for your year ahead.",
    timing: "Annual · Around Your Birthday",
    icon: "☀️",
    gradient: "from-amber-900/30 to-orange-900/20",
    accent: "#c9a84c",
  },
];

export default function ReadingsHubPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#06080f]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(88,28,135,0.15)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(201,168,76,0.08)_0%,transparent_55%)]" />
      </div>
      <div className="relative z-10 flex flex-1 flex-col">
        <MarketingHeader />
        <main className="flex-1">
          {/* Hero */}
          <section className="py-20 md:py-28">
            <div className="mx-auto max-w-3xl px-4 text-center">
              <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#c9a84c]">
                <span className="inline-block size-1.5 rounded-full bg-[#c9a84c]" />
                Milestone Readings
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8] sm:text-5xl">
                The Readings That{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(135deg, #f8d275 0%, #c9a84c 50%, #a07838 100%)" }}
                >
                  Change Everything
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#b8bcd0]/70">
                Certain moments in your life are written in the stars long before they arrive. These readings
                are designed for the pivotal astrological transitions in your birth chart — helping you move
                through them with clarity, intention, and power.
              </p>
            </div>
          </section>

          {/* Reading Cards */}
          <section className="px-4 pb-24 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <div className="grid gap-8 md:grid-cols-3">
                {readings.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/readings/${r.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] transition-all hover:border-[#c9a84c]/20 hover:bg-white/[0.04] hover:shadow-[0_0_40px_rgba(201,168,76,0.05)]"
                  >
                    {/* Card gradient header */}
                    <div className={`relative h-32 overflow-hidden bg-gradient-to-br ${r.gradient}`}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-5xl" aria-hidden="true">{r.icon}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-6">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: r.accent }}>
                        {r.subtitle}
                      </p>
                      <h2 className="text-xl font-bold text-[#f5f0e8] transition-colors group-hover:text-[#c9a84c]">
                        {r.title}
                      </h2>
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-[#b8bcd0]/60">{r.description}</p>
                      <div className="mt-5 flex items-center justify-between border-t border-white/[0.05] pt-4">
                        <span className="text-xs text-[#b8bcd0]/40">{r.timing}</span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#c9a84c] transition-all group-hover:gap-2">
                          Learn More <ArrowRight className="size-3.5" aria-hidden="true" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Bottom CTA */}
              <div className="mt-16 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-10 text-center">
                <p className="text-base font-semibold text-[#f5f0e8]">Not sure which reading you need?</p>
                <p className="mt-2 text-sm text-[#b8bcd0]/55">
                  Browse all certified practitioners and let them guide you to the right reading for where you are right now.
                </p>
                <div className="mt-6">
                  <Link
                    href="/discover"
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#c9a84c] px-7 text-sm font-semibold text-black shadow-[0_0_20px_rgba(201,168,76,0.25)] transition-all hover:bg-[#e2c97e]"
                  >
                    Browse All Practitioners
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
        <MarketingFooter />
      </div>
    </div>
  );
}
