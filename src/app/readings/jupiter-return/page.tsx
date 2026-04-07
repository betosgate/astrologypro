import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";
import { BadgeCheck, ArrowRight } from "lucide-react";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Jupiter Return Readings | AstrologyPro",
    description:
      "Every ~12 years, Jupiter returns to its birth position — bringing a wave of expansion, opportunity, and good fortune. Book a reading to make the most of this powerful window.",
    openGraph: {
      title: "Jupiter Return Readings | AstrologyPro",
      description:
        "Every ~12 years, Jupiter returns to its birth position — bringing a wave of expansion, opportunity, and good fortune. Book a reading to make the most of this powerful window.",
      type: "website",
      url: `${APP_URL}/readings/jupiter-return`,
    },
    twitter: {
      card: "summary_large_image",
      title: "Jupiter Return Readings | AstrologyPro",
      description:
        "Every ~12 years, Jupiter returns to its birth position — bringing a wave of expansion, opportunity, and good fortune. Book a reading to make the most of this powerful window.",
    },
  };
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface DivinerLandingCard {
  username: string;
  displayName: string;
  tagline: string | null;
  avatarUrl: string | null;
  isCertified: boolean;
  startingPrice: number | null;
}

// ─────────────────────────────────────────────
// Data fetching
// ─────────────────────────────────────────────

async function getJupiterReturnDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  // First: find diviners with services tagged trigger_event = 'jupiter_return'
  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "jupiter_return")
    .eq("is_active", true);

  let divinerIds: string[] = [];
  const priceByDiviner = new Map<string, number>();

  if (taggedServices && taggedServices.length > 0) {
    for (const svc of taggedServices) {
      const id = svc.diviner_id as string;
      const price = Number(svc.base_price);
      if (!priceByDiviner.has(id) || price < priceByDiviner.get(id)!) {
        priceByDiviner.set(id, price);
      }
    }
    divinerIds = [...priceByDiviner.keys()];
  }

  let query = admin
    .from("diviners")
    .select("id, username, display_name, tagline, avatar_url, specialties, is_certified")
    .eq("is_active", true)
    .eq("onboarding_completed", true)
    .eq("charges_enabled", true)
    .limit(6);

  if (divinerIds.length > 0) {
    query = query.in("id", divinerIds);
  } else {
    query = query
      .eq("is_certified", true)
      .order("is_certified", { ascending: false });
  }

  const { data: diviners } = await query;

  if (!diviners || diviners.length === 0) {
    const { data: fallback } = await admin
      .from("diviners")
      .select("id, username, display_name, tagline, avatar_url, specialties, is_certified")
      .eq("is_active", true)
      .eq("onboarding_completed", true)
      .eq("charges_enabled", true)
      .eq("is_certified", true)
      .limit(6);

    if (!fallback) return [];

    const fallbackIds = fallback.map((d) => d.id as string);
    const { data: fallbackServices } = await admin
      .from("services")
      .select("diviner_id, base_price")
      .in("diviner_id", fallbackIds)
      .eq("is_active", true);

    const fallbackPrices = new Map<string, number>();
    for (const svc of fallbackServices ?? []) {
      const id = svc.diviner_id as string;
      const price = Number(svc.base_price);
      if (!fallbackPrices.has(id) || price < fallbackPrices.get(id)!) {
        fallbackPrices.set(id, price);
      }
    }

    return fallback.map((d) => ({
      username: d.username as string,
      displayName: d.display_name as string,
      tagline: (d.tagline as string | null) ?? null,
      avatarUrl: (d.avatar_url as string | null) ?? null,
      isCertified: !!(d.is_certified as boolean | null),
      startingPrice: fallbackPrices.get(d.id as string) ?? null,
    }));
  }

  const missingPriceIds = diviners
    .map((d) => d.id as string)
    .filter((id) => !priceByDiviner.has(id));

  if (missingPriceIds.length > 0) {
    const { data: extraServices } = await admin
      .from("services")
      .select("diviner_id, base_price")
      .in("diviner_id", missingPriceIds)
      .eq("is_active", true);

    for (const svc of extraServices ?? []) {
      const id = svc.diviner_id as string;
      const price = Number(svc.base_price);
      if (!priceByDiviner.has(id) || price < priceByDiviner.get(id)!) {
        priceByDiviner.set(id, price);
      }
    }
  }

  return diviners.map((d) => ({
    username: d.username as string,
    displayName: d.display_name as string,
    tagline: (d.tagline as string | null) ?? null,
    avatarUrl: (d.avatar_url as string | null) ?? null,
    isCertified: !!(d.is_certified as boolean | null),
    startingPrice: priceByDiviner.get(d.id as string) ?? null,
  }));
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function DivinerCard({ diviner }: { diviner: DivinerLandingCard }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#0d1117]/60 transition-all hover:border-[#c9a84c]/30 hover:shadow-[0_0_30px_rgba(201,168,76,0.05)]">
      <div className="relative h-20 overflow-hidden bg-gradient-to-br from-[#c9a84c]/10 to-[#4c9c4c]/10">
        {diviner.isCertified && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#0d1117]/80 px-2 py-0.5 text-[10px] font-semibold text-[#c9a84c] backdrop-blur-sm">
            <BadgeCheck className="size-3" aria-hidden="true" />
            DIB Certified
          </span>
        )}
      </div>

      <div className="relative -mt-7 flex flex-col px-5">
        <div className="flex items-end justify-between">
          {diviner.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={diviner.avatarUrl}
              alt={diviner.displayName}
              className="size-14 rounded-full border-2 border-[#0d1117] object-cover ring-1 ring-[#c9a84c]/20"
            />
          ) : (
            <div className="flex size-14 items-center justify-center rounded-full border-2 border-[#0d1117] bg-[#c9a84c]/10 text-base font-semibold text-[#c9a84c] ring-1 ring-[#c9a84c]/20">
              {diviner.displayName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
          )}
        </div>

        <div className="mt-3">
          <h3 className="font-semibold text-[#f5f0e8] transition-colors group-hover:text-[#c9a84c]">
            {diviner.displayName}
          </h3>
          {diviner.tagline && (
            <p className="mt-0.5 line-clamp-2 text-sm text-[#b8bcd0]/60">
              {diviner.tagline}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          {diviner.startingPrice !== null && (
            <span className="text-sm font-medium text-[#f5f0e8]">
              From ${diviner.startingPrice}
            </span>
          )}
        </div>

        <div className="mb-5 mt-4">
          <Link
            href={`/${diviner.username}`}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#c9a84c] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#e2c97e]"
          >
            Book a Reading
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function JupiterReturnPage() {
  const diviners = await getJupiterReturnDiviners();

  return (
    <div className="flex min-h-screen flex-col bg-[#06080f]">
      {/* Cosmic background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(28,88,135,0.18)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_85%,rgba(201,168,76,0.09)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,rgba(7,59,7,0.10)_0%,transparent_60%)]" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col">
        <MarketingHeader />

        <main className="flex-1">
          {/* ── 1. Hero ────────────────────────────────── */}
          <section className="relative overflow-hidden py-20 md:py-28">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(201,168,76,0.06)_0%,transparent_60%)]" />
            <div className="relative mx-auto max-w-4xl px-4 text-center">
              <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#c9a84c]">
                <span className="inline-block size-1.5 rounded-full bg-[#c9a84c]" />
                Astrological Life Events
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8] sm:text-5xl lg:text-6xl">
                Your Jupiter Return:{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #f8d275 0%, #c9a84c 50%, #a07838 100%)",
                  }}
                >
                  A Cycle of Abundance Begins
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#b8bcd0]/75">
                Every ~12 years, Jupiter returns to its birth position — bringing a wave of
                expansion, opportunity, and good fortune. Book a reading to make the most of
                this powerful window.
              </p>

              {/* Stats */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
                {[
                  { age: "~Age 12", label: "Jupiter Returns" },
                  { age: "~Age 24", label: "Jupiter Returns" },
                  { age: "~Age 35", label: "Jupiter Returns" },
                  { age: "~Age 47", label: "Jupiter Returns" },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <p className="text-2xl font-bold text-[#c9a84c]">{item.age}</p>
                    <p className="mt-1 text-xs text-[#b8bcd0]/50">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <a
                  href="#diviners"
                  className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#c9a84c] px-8 text-sm font-semibold text-black shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all hover:bg-[#e2c97e] hover:shadow-[0_0_30px_rgba(201,168,76,0.4)]"
                >
                  Find Your Astrologer ↓
                </a>
              </div>
            </div>
          </section>

          {/* ── 2. What Is a Jupiter Return ───────────── */}
          <section className="px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <div className="grid items-center gap-12 md:grid-cols-2">
                <div>
                  <h2 className="text-2xl font-bold text-[#f5f0e8] sm:text-3xl">
                    What Is a Jupiter Return?
                  </h2>
                  <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-[#b8bcd0]/70">
                    <p>
                      Jupiter, the planet of growth, luck, wisdom, and abundance, completes
                      its orbit around the Sun approximately every 12 years. When it returns
                      to the same zodiac position it occupied at your birth, you experience
                      a Jupiter Return — a personal renewal of your potential.
                    </p>
                    <p>
                      Unlike Saturn's demanding energy, Jupiter brings gifts: expanded
                      opportunities, renewed optimism, and a broader sense of what is possible.
                      Each return opens a new 12-year chapter of your story.
                    </p>
                    <p>
                      The key is alignment. Those who are conscious of this window and take
                      deliberate action tend to experience the most profound breakthroughs.
                      A skilled astrologer can help you identify exactly where Jupiter's
                      abundance is directed in your chart.
                    </p>
                  </div>
                </div>

                {/* Visual card */}
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7">
                  <h3 className="mb-5 text-sm font-semibold uppercase tracking-widest text-[#c9a84c]">
                    Jupiter Return Cycle
                  </h3>
                  <div className="space-y-3">
                    {[
                      { range: "Every ~12 years", desc: "Jupiter completes its full cycle" },
                      { range: "1-year window", desc: "The peak period of expanded potential" },
                      {
                        range: "6 returns by age 72",
                        desc: "Multiple opportunities across a lifetime",
                      },
                    ].map((item) => (
                      <div
                        key={item.range}
                        className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                      >
                        <span className="mt-0.5 shrink-0 rounded-lg border border-[#c9a84c]/20 bg-[#c9a84c]/10 px-2.5 py-1 text-xs font-bold text-[#c9a84c] whitespace-nowrap">
                          {item.range}
                        </span>
                        <p className="text-sm text-[#b8bcd0]/60">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── 3. What to Expect ─────────────────────── */}
          <section className="px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-2 text-center text-2xl font-bold text-[#f5f0e8] sm:text-3xl">
                What to Expect
              </h2>
              <p className="mb-10 text-center text-sm text-[#b8bcd0]/50">
                Jupiter expands whatever it touches in your chart
              </p>

              <div className="grid gap-6 sm:grid-cols-3">
                {[
                  {
                    icon: "💰",
                    title: "Career & Abundance",
                    desc: "Jupiter returns often coincide with major career leaps, new business opportunities, financial expansion, and professional recognition. This is the time to take bold action toward your biggest goals.",
                  },
                  {
                    icon: "✈️",
                    title: "Travel & Learning",
                    desc: "The planet of philosophy, higher learning, and exploration encourages you to broaden your horizons — through travel, education, new belief systems, or cross-cultural connections.",
                  },
                  {
                    icon: "🌟",
                    title: "Spiritual Growth",
                    desc: "Jupiter rules wisdom and meaning. Its return can trigger profound spiritual awakenings, deepened faith, or an expanded sense of purpose. Many people describe this as a period of feeling truly guided.",
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-all hover:border-[#c9a84c]/20 hover:bg-white/[0.04]"
                  >
                    <span className="text-3xl" aria-hidden="true">
                      {card.icon}
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-[#f5f0e8]">{card.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#b8bcd0]/60">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── 4. Diviner Grid ───────────────────────── */}
          <section id="diviners" className="scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-2 text-center text-2xl font-bold text-[#f5f0e8] sm:text-3xl">
                Find Your Jupiter Return Guide
              </h2>
              <p className="mb-10 text-center text-sm text-[#b8bcd0]/50">
                These practitioners specialize in Jupiter Return readings
              </p>

              {diviners.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {diviners.map((d) => (
                    <DivinerCard key={d.username} diviner={d} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] py-16 text-center">
                  <p className="text-[#b8bcd0]/50">
                    New practitioners are joining soon. Browse all astrologers in the meantime.
                  </p>
                </div>
              )}

              <div className="mt-8 text-center">
                <Link
                  href="/discover?type=astrologer"
                  className="inline-flex items-center gap-1.5 text-sm text-[#c9a84c]/70 transition-colors hover:text-[#c9a84c]"
                >
                  See All Astrologers
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>

          {/* ── 5. FAQ ────────────────────────────────── */}
          <section className="px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-8 text-center text-2xl font-bold text-[#f5f0e8] sm:text-3xl">
                Frequently Asked Questions
              </h2>

              <div className="space-y-3">
                {[
                  {
                    q: "What is a Jupiter Return?",
                    a: "A Jupiter Return occurs approximately every 12 years when Jupiter transits back to the zodiac sign and degree it occupied at the time of your birth. It marks the beginning of a new cycle of growth, expansion, and opportunity in your life.",
                  },
                  {
                    q: "How often does a Jupiter Return happen?",
                    a: "Jupiter takes about 11.86 years to orbit the Sun, so you will experience a Jupiter Return roughly every 12 years — at ages 12, 24, 35–36, 47–48, 59–60, 71–72, and so on throughout your life.",
                  },
                  {
                    q: "How long does a Jupiter Return last?",
                    a: "Jupiter moves relatively quickly through each sign over about 12 months. The exact return transit may last a few weeks, but the energy of the new cycle it initiates unfolds over the full 12 years that follow.",
                  },
                  {
                    q: "Do I need my birth time for a Jupiter Return reading?",
                    a: "Your birth time provides the most complete picture, particularly for house placements. However, even without an exact time, an astrologer can identify significant themes and the primary areas of life Jupiter will activate.",
                  },
                  {
                    q: "What makes a Jupiter Return reading different from a general natal reading?",
                    a: "A Jupiter Return reading focuses specifically on the current 12-year cycle being activated — the new chapter Jupiter is opening. The astrologer examines Jupiter's natal placement, the transiting return chart, and how it interacts with your current life circumstances.",
                  },
                ].map((item) => (
                  <details
                    key={item.q}
                    className="group rounded-xl border border-white/[0.07] bg-white/[0.02]"
                  >
                    <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 text-sm font-semibold text-[#f5f0e8] hover:text-[#c9a84c] transition-colors list-none">
                      {item.q}
                      <span className="shrink-0 text-[#c9a84c]/50 transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <div className="border-t border-white/[0.05] px-5 pb-5 pt-4">
                      <p className="text-sm leading-relaxed text-[#b8bcd0]/65">{item.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* ── 6. Bottom CTA ─────────────────────────── */}
          <section className="px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[#c9a84c]/10 bg-[radial-gradient(ellipse_at_50%_50%,rgba(201,168,76,0.06)_0%,transparent_70%)] p-10 text-center md:p-14">
              <h2 className="text-2xl font-bold text-[#f5f0e8] sm:text-3xl">
                Ready to harness your Jupiter Return?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#b8bcd0]/65">
                Work with a certified astrologer to understand exactly where Jupiter's abundance
                is flowing in your chart — and how to align your actions with this cosmic window.
              </p>
              <div className="mt-8">
                <Link
                  href="/discover"
                  className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#c9a84c] px-8 text-sm font-semibold text-black shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all hover:bg-[#e2c97e] hover:shadow-[0_0_30px_rgba(201,168,76,0.4)]"
                >
                  Browse All Astrologers
                </Link>
              </div>
            </div>
          </section>
        </main>

        <MarketingFooter />
      </div>
    </div>
  );
}
