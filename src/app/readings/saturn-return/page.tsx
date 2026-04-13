import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";
import { getDivinerAvatarUrl } from "@/lib/diviner-images";
import { BadgeCheck, ArrowRight } from "lucide-react";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Saturn Return Readings | AstrologyPro",
    description:
      "Your Saturn Return is one of the most significant astrological events of your life. Book a personal reading with a certified astrologer to navigate this powerful transition.",
    openGraph: {
      title: "Saturn Return Readings | AstrologyPro",
      description:
        "Your Saturn Return is one of the most significant astrological events of your life. Book a personal reading with a certified astrologer to navigate this powerful transition.",
      type: "website",
      url: `${APP_URL}/readings/saturn-return`,
    },
    twitter: {
      card: "summary_large_image",
      title: "Saturn Return Readings | AstrologyPro",
      description:
        "Your Saturn Return is one of the most significant astrological events of your life. Book a personal reading with a certified astrologer to navigate this powerful transition.",
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

async function getSaturnReturnDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  // First: find diviners with services tagged trigger_event = 'saturn_return'
  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "saturn_return")
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

  // Fetch matching diviners (or fall back to certified astrologers)
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
    // Fallback: certified astrologers
    query = query
      .eq("is_certified", true)
      .contains("specialties", ["Saturn Return"])
      .order("is_certified", { ascending: false });
  }

  const { data: diviners } = await query;

  if (!diviners || diviners.length === 0) {
    // Final fallback: any certified astrologer
    const { data: fallback } = await admin
      .from("diviners")
      .select("id, username, display_name, tagline, avatar_url, specialties, is_certified")
      .eq("is_active", true)
      .eq("onboarding_completed", true)
      .eq("charges_enabled", true)
      .eq("is_certified", true)
      .limit(6);

    if (!fallback) return [];

    // Fetch starting prices for fallback diviners
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

  // Fetch starting prices for matching diviners not already in priceByDiviner
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
  const avatarUrl = getDivinerAvatarUrl(diviner.avatarUrl);
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#0d1117]/60 transition-all hover:border-[#c9a84c]/30 hover:shadow-[0_0_30px_rgba(201,168,76,0.05)]">
      {/* Cover gradient */}
      <div className="relative h-20 overflow-hidden bg-gradient-to-br from-[#c9a84c]/10 to-[#4c6bc9]/10">
        {diviner.isCertified && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#0d1117]/80 px-2 py-0.5 text-[10px] font-semibold text-[#c9a84c] backdrop-blur-sm">
            <BadgeCheck className="size-3" aria-hidden="true" />
            DIB Certified
          </span>
        )}
      </div>

      {/* Avatar overlapping cover */}
      <div className="relative -mt-7 flex flex-col px-5">
        <div className="flex items-end justify-between">
          <Image
            src={avatarUrl}
            alt={diviner.displayName}
            width={56}
            height={56}
            className="size-14 rounded-full border-2 border-[#0d1117] object-cover ring-1 ring-[#c9a84c]/20"
          />
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

export default async function SaturnReturnPage() {
  const diviners = await getSaturnReturnDiviners();

  return (
    <div className="flex min-h-screen flex-col bg-[#06080f]">
      {/* Cosmic background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(88,28,135,0.18)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_85%,rgba(201,168,76,0.09)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,rgba(59,7,100,0.10)_0%,transparent_60%)]" />
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
                Your Saturn Return{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #f8d275 0%, #c9a84c 50%, #a07838 100%)",
                  }}
                >
                  Is Calling
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#b8bcd0]/75">
                Occurring every ~29.5 years, your Saturn Return is a defining life transition.
                Work with a certified astrologer to understand what it means for you.
              </p>

              {/* Stats */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-8">
                <div className="text-center">
                  <p
                    className="text-3xl font-bold text-[#c9a84c]"
                    aria-label="First Return: approximately age 29"
                  >
                    ~Age 29
                  </p>
                  <p className="mt-1 text-sm text-[#b8bcd0]/50">First Return</p>
                </div>
                <div className="h-10 w-px bg-white/10" aria-hidden="true" />
                <div className="text-center">
                  <p
                    className="text-3xl font-bold text-[#c9a84c]"
                    aria-label="Second Return: approximately age 59"
                  >
                    ~Age 59
                  </p>
                  <p className="mt-1 text-sm text-[#b8bcd0]/50">Second Return</p>
                </div>
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

          {/* ── 2. What Is a Saturn Return ────────────── */}
          <section className="px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <div className="grid items-center gap-12 md:grid-cols-2">
                {/* Text */}
                <div>
                  <h2 className="text-2xl font-bold text-[#f5f0e8] sm:text-3xl">
                    What Is a Saturn Return?
                  </h2>
                  <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-[#b8bcd0]/70">
                    <p>
                      Saturn, the planet of discipline, structure, and karma, takes approximately
                      29.5 years to complete one full orbit around the Sun. When it returns to the
                      exact position it held at the moment of your birth, you experience what
                      astrologers call a Saturn Return.
                    </p>
                    <p>
                      This transit marks a rite of passage — a cosmic audit of your life choices,
                      values, and foundations. Saturn asks you to take responsibility, shed what no
                      longer serves you, and step into the next chapter of your life with greater
                      maturity.
                    </p>
                    <p>
                      Common themes include career pivots, relationship milestones or endings,
                      identity shifts, and a deep reassessment of what you truly want from life.
                    </p>
                  </div>
                </div>

                {/* Visual card */}
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7">
                  <h3 className="mb-5 text-sm font-semibold uppercase tracking-widest text-[#c9a84c]">
                    When Does It Happen?
                  </h3>
                  <div className="space-y-4">
                    {[
                      {
                        ages: "Ages 27–30",
                        label: "First Saturn Return",
                        desc: "The entry into true adulthood",
                      },
                      {
                        ages: "Ages 56–60",
                        label: "Second Saturn Return",
                        desc: "Stepping into elder wisdom",
                      },
                      {
                        ages: "Ages 84–88",
                        label: "Third Saturn Return",
                        desc: "The master's harvest",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                      >
                        <span className="mt-0.5 shrink-0 rounded-lg border border-[#c9a84c]/20 bg-[#c9a84c]/10 px-2.5 py-1 text-xs font-bold text-[#c9a84c]">
                          {item.ages}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[#f5f0e8]">{item.label}</p>
                          <p className="mt-0.5 text-xs text-[#b8bcd0]/50">{item.desc}</p>
                        </div>
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
                Saturn Return touches every dimension of your life
              </p>

              <div className="grid gap-6 sm:grid-cols-3">
                {[
                  {
                    icon: "🪐",
                    title: "Career & Purpose",
                    desc: "Saturn forces a reckoning with your professional path. Dead-end jobs, unfulfilling careers, and misaligned ambitions are brought to the surface — and replaced with direction grounded in your true calling.",
                  },
                  {
                    icon: "💞",
                    title: "Relationships",
                    desc: "Commitments are tested under Saturn's watchful eye. Relationships built on solid foundations deepen and mature; those without roots may dissolve — making room for what is truly aligned.",
                  },
                  {
                    icon: "🌱",
                    title: "Identity & Growth",
                    desc: "Perhaps the most profound shift: the shedding of who you thought you were to reveal who you are becoming. Saturn demands you step fully into adulthood — and then later, elderhood.",
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
                Find Your Saturn Return Guide
              </h2>
              <p className="mb-10 text-center text-sm text-[#b8bcd0]/50">
                These practitioners specialize in Saturn Return readings
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
                    q: "What is a Saturn Return?",
                    a: "A Saturn Return occurs when Saturn completes a full orbit of the Sun and returns to the zodiac position it occupied at the time of your birth. This transit, which happens around ages 27–30, 56–60, and 84–88, is associated with major life reassessments and restructuring.",
                  },
                  {
                    q: "When exactly does my Saturn Return happen?",
                    a: "The timing depends on the exact degree Saturn occupied in your birth chart. A certified astrologer can calculate the precise dates of your Saturn Return using your birth date, time, and location. The transit itself typically spans 2–3 years.",
                  },
                  {
                    q: "Do I need my exact birth time for a Saturn Return reading?",
                    a: "Your birth time gives the astrologer the most complete picture, including your Ascendant and house placements — all of which influence how Saturn's return manifests in your life. However, a skilled reader can still offer valuable insight without the exact time.",
                  },
                  {
                    q: "What if I am in the middle of my Saturn Return right now?",
                    a: "This is the ideal time to book a reading. Understanding Saturn's specific placement and aspects in your chart helps you work with the energy consciously rather than simply enduring it. Many clients find a Saturn Return reading to be one of the most clarifying readings of their life.",
                  },
                  {
                    q: "What happens during a second Saturn Return?",
                    a: "Around age 56–60, Saturn returns for a second time. Where the first return initiates true adulthood, the second invites a transition into elderhood, legacy, and wisdom. It is often a time of releasing outdated roles and stepping into a more authentic, authoritative expression of the self.",
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
                Ready to navigate your Saturn Return?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#b8bcd0]/65">
                Connect with a certified astrologer who can illuminate what this powerful
                transition means for your unique chart — and how to move through it with clarity.
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
