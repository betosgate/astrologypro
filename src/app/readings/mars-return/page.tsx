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
    title: "Mars Return Readings | AstrologyPro",
    description:
      "Every two years, Mars returns to its natal position — beginning a new cycle of drive, ambition, and assertive energy. A Mars Return reading reveals the themes, battles, and momentum that will define your next chapter of action.",
    openGraph: {
      title: "Mars Return Readings | AstrologyPro",
      description:
        "Every two years, Mars returns to its natal position — beginning a new cycle of drive, ambition, and assertive energy. A Mars Return reading reveals the themes, battles, and momentum that will define your next chapter of action.",
      type: "website",
      url: `${APP_URL}/readings/mars-return`,
    },
    twitter: {
      card: "summary_large_image",
      title: "Mars Return Readings | AstrologyPro",
      description:
        "Every two years, Mars returns to its natal position — beginning a new cycle of drive, ambition, and assertive energy. A Mars Return reading reveals the themes, battles, and momentum that will define your next chapter of action.",
    },
  };
}

interface DivinerLandingCard {
  username: string;
  displayName: string;
  tagline: string | null;
  avatarUrl: string | null;
  isCertified: boolean;
  startingPrice: number | null;
}

async function getMarsReturnDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "mars_return")
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
    .select("id, username, display_name, tagline, avatar_url, is_certified")
    .eq("is_active", true)
    .eq("onboarding_completed", true)
    .eq("charges_enabled", true)
    .limit(6);

  if (divinerIds.length > 0) {
    query = query.in("id", divinerIds);
  } else {
    query = query.eq("is_certified", true).order("is_certified", { ascending: false });
  }

  const { data: diviners } = await query;

  if (!diviners || diviners.length === 0) {
    const { data: fallback } = await admin
      .from("diviners")
      .select("id, username, display_name, tagline, avatar_url, is_certified")
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
      if (!fallbackPrices.has(id) || price < fallbackPrices.get(id)!) fallbackPrices.set(id, price);
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

  const missingPriceIds = diviners.map((d) => d.id as string).filter((id) => !priceByDiviner.has(id));
  if (missingPriceIds.length > 0) {
    const { data: extraServices } = await admin
      .from("services")
      .select("diviner_id, base_price")
      .in("diviner_id", missingPriceIds)
      .eq("is_active", true);
    for (const svc of extraServices ?? []) {
      const id = svc.diviner_id as string;
      const price = Number(svc.base_price);
      if (!priceByDiviner.has(id) || price < priceByDiviner.get(id)!) priceByDiviner.set(id, price);
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

function DivinerCard({ diviner }: { diviner: DivinerLandingCard }) {
  const avatarUrl = getDivinerAvatarUrl(diviner.avatarUrl);
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#0d1117]/60 transition-all hover:border-[#c9a84c]/30 hover:shadow-[0_0_30px_rgba(201,168,76,0.05)]">
      <div className="relative h-20 overflow-hidden bg-gradient-to-br from-[#c9a84c]/10 to-[#c97a4c]/10">
        {diviner.isCertified && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#0d1117]/80 px-2 py-0.5 text-[10px] font-semibold text-[#c9a84c] backdrop-blur-sm">
            <BadgeCheck className="size-3" aria-hidden="true" />
            DIB Certified
          </span>
        )}
      </div>
      <div className="relative -mt-7 flex flex-col px-5">
        <div className="flex items-end justify-between">
          <Image src={avatarUrl} alt={diviner.displayName} width={56} height={56} className="size-14 rounded-full border-2 border-[#0d1117] object-cover ring-1 ring-[#c9a84c]/20" />
        </div>
        <div className="mt-3">
          <h3 className="font-semibold text-[#f5f0e8] transition-colors group-hover:text-[#c9a84c]">{diviner.displayName}</h3>
          {diviner.tagline && <p className="mt-0.5 line-clamp-2 text-sm text-[#b8bcd0]/60">{diviner.tagline}</p>}
        </div>
        <div className="mt-3">
          {diviner.startingPrice !== null && (
            <span className="text-sm font-medium text-[#f5f0e8]">From ${diviner.startingPrice}</span>
          )}
        </div>
        <div className="mb-5 mt-4">
          <Link href={`/${diviner.username}`} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#c9a84c] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#e2c97e]">
            Book a Reading <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function MarsReturnPage() {
  const diviners = await getMarsReturnDiviners();

  return (
    <div className="flex min-h-screen flex-col bg-[#06080f]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_10%,rgba(201,120,28,0.15)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_85%,rgba(201,168,76,0.09)_0%,transparent_55%)]" />
      </div>
      <div className="relative z-10 flex flex-1 flex-col">
        <MarketingHeader />
        <main className="flex-1">
          {/* Hero */}
          <section className="relative overflow-hidden py-20 md:py-28">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(201,168,76,0.07)_0%,transparent_60%)]" />
            <div className="relative mx-auto max-w-4xl px-4 text-center">
              <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#c9a84c]">
                <span className="inline-block size-1.5 rounded-full bg-[#c9a84c]" />
                Annual Mars Cycle
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8] sm:text-5xl lg:text-6xl">
                Your Mars Return:{" "}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #f8d275 0%, #c9a84c 50%, #a07838 100%)" }}>
                  A New Cycle of Drive &amp; Desire
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#b8bcd0]/75">
                Every two years, Mars returns to the exact position it occupied at your birth — resetting your
                personal engine. A Mars Return reading reveals the themes of drive, ambition, desire, conflict,
                and action that will define your next chapter.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-10">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#c9a84c]">Every ~2 Years</p>
                  <p className="mt-1 text-sm text-[#b8bcd0]/50">Mars Completes Its Cycle</p>
                </div>
                <div className="h-10 w-px bg-white/10" aria-hidden="true" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#c9a84c]">Forward Momentum</p>
                  <p className="mt-1 text-sm text-[#b8bcd0]/50">Drive, Ambition &amp; Initiative</p>
                </div>
              </div>
              <div className="mt-10">
                <a href="#diviners" className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#c9a84c] px-8 text-sm font-semibold text-black shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all hover:bg-[#e2c97e]">
                  Find Your Mars Return Astrologer ↓
                </a>
              </div>
            </div>
          </section>

          {/* What Is */}
          <section className="px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <div className="grid items-center gap-12 md:grid-cols-2">
                <div>
                  <h2 className="text-2xl font-bold text-[#f5f0e8] sm:text-3xl">What Is a Mars Return?</h2>
                  <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-[#b8bcd0]/70">
                    <p>
                      Mars is the planet of drive, ambition, desire, physical energy, assertiveness, and
                      conflict. It takes approximately two years to travel through all twelve zodiac signs and
                      return to the degree it occupied at the moment of your birth. This return marks the
                      beginning of a new Mars cycle in your life.
                    </p>
                    <p>
                      At the Mars Return, astrologers cast a new chart for the exact moment of the return. This
                      chart reveals the quality of the Mars energy you&apos;ll be working with for the coming two
                      years: where your drive will be most powerfully focused, what battles and competitions may
                      arise, how your physical vitality will fare, and what ambitions are ready to launch.
                    </p>
                    <p>
                      Understanding your Mars Return is especially valuable when you&apos;re preparing to start a
                      new venture, compete for an opportunity, navigate a period of intense action or conflict,
                      or recalibrate your relationship with ambition, anger, and desire.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7">
                  <h3 className="mb-5 text-sm font-semibold uppercase tracking-widest text-[#c9a84c]">What a Mars Return Reveals</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Drive & Motivation Themes", desc: "Where your ambition and initiative will be most powerfully focused for the next two years" },
                      { label: "Conflict & Competition Patterns", desc: "Where battles, competition, or assertiveness themes are most likely to arise in this cycle" },
                      { label: "Physical Energy & Vitality", desc: "The quality and sustainability of your physical energy, endurance, and body-based drive during this Mars cycle" },
                      { label: "Desire & What You're Pursuing", desc: "What you want most urgently right now — and whether the chart supports pursuing it directly or with patience" },
                      { label: "Optimal Launch Windows", desc: "When to initiate, compete, and push forward — and when to recover and consolidate energy rather than force" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#c9a84c]" />
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

          {/* What to Expect */}
          <section className="px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-2 text-center text-2xl font-bold text-[#f5f0e8] sm:text-3xl">What to Expect</h2>
              <p className="mb-10 text-center text-sm text-[#b8bcd0]/50">A Mars Return reading maps your two-year cycle of drive, ambition, and action</p>
              <div className="grid gap-6 sm:grid-cols-3">
                {[
                  { icon: "🔥", title: "Mars Return Chart Reading", desc: "Your astrologer casts your Mars Return chart and interprets the house where Mars falls, its aspects to natal planets, and the Rising sign of the return — painting a complete picture of what this two-year cycle activates in your life." },
                  { icon: "⚔️", title: "Conflict & Competition Themes", desc: "Mars governs battles — external conflicts with others and internal battles with your own resistance. Your reader will identify where conflict themes are most active and how to channel Mars energy constructively rather than destructively." },
                  { icon: "🚀", title: "Ambition & Launch Strategy", desc: "The reading closes with concrete guidance on what to initiate during this cycle, where to invest your drive most productively, and how to pace your energy across the full two-year window for maximum effectiveness." },
                ].map((card) => (
                  <div key={card.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-all hover:border-[#c9a84c]/20 hover:bg-white/[0.04]">
                    <span className="text-3xl" aria-hidden="true">{card.icon}</span>
                    <h3 className="mt-4 text-base font-semibold text-[#f5f0e8]">{card.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#b8bcd0]/60">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Diviner Grid */}
          <section id="diviners" className="scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-2 text-center text-2xl font-bold text-[#f5f0e8] sm:text-3xl">Find Your Mars Return Astrologer</h2>
              <p className="mb-10 text-center text-sm text-[#b8bcd0]/50">These practitioners specialize in Mars return and predictive astrology</p>
              {diviners.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {diviners.map((d) => <DivinerCard key={d.username} diviner={d} />)}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] py-16 text-center">
                  <p className="text-[#b8bcd0]/50">New practitioners are joining soon. Browse all astrologers in the meantime.</p>
                </div>
              )}
              <div className="mt-8 text-center">
                <Link href="/discover?type=astrologer" className="inline-flex items-center gap-1.5 text-sm text-[#c9a84c]/70 transition-colors hover:text-[#c9a84c]">
                  See All Astrologers <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-8 text-center text-2xl font-bold text-[#f5f0e8] sm:text-3xl">Frequently Asked Questions</h2>
              <div className="space-y-3">
                {[
                  { q: "How often does a Mars Return happen?", a: "Mars takes approximately 687 days (just under two years) to return to its natal position. So you experience a Mars Return roughly every two years, though the exact timing shifts based on Mars's elliptical orbit and whether it goes retrograde during the cycle." },
                  { q: "Is a Mars Return always significant?", a: "More significant than many minor returns, less sweeping than a Jupiter or Saturn return. The Mars Return is especially important when Mars occupies an angular house (1st, 4th, 7th, or 10th) in the return chart, or when it makes powerful aspects to your natal Sun, Moon, or angles — in those cases, the cycle often brings major initiative-taking, major conflicts, or significant physical exertion." },
                  { q: "Should I be worried about my Mars Return?", a: "Mars energy is neutral — it's a force of initiative and drive. The quality of your Mars Return depends on how Mars is configured in both the return chart and your natal chart. Some returns bring exciting forward momentum; others bring necessary battles or physical intensity. A reading gives you the context to work with the energy rather than be blindsided by it." },
                  { q: "How does a Mars Return differ from a Saturn Return?", a: "A Saturn Return (around age 29-30 and 58-59) is a major life-restructuring event marking a new chapter of maturity and responsibility. A Mars Return is a shorter, more frequent cycle focused specifically on drive, ambition, and action themes — not the life-overhaul quality of Saturn. Think of Saturn as rebuilding the entire structure and Mars as recharging the engine." },
                  { q: "What information do I need for a Mars Return reading?", a: "Your full birth data — date, time, and location — is needed to calculate both your natal Mars position and the Mars Return chart. The more precise the birth time, the more accurate the return chart's Rising sign and house placements will be." },
                ].map((item) => (
                  <details key={item.q} className="group rounded-xl border border-white/[0.07] bg-white/[0.02]">
                    <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 text-sm font-semibold text-[#f5f0e8] hover:text-[#c9a84c] transition-colors list-none">
                      {item.q}
                      <span className="shrink-0 text-[#c9a84c]/50 transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <div className="border-t border-white/[0.05] px-5 pb-5 pt-4">
                      <p className="text-sm leading-relaxed text-[#b8bcd0]/65">{item.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[#c9a84c]/10 bg-[radial-gradient(ellipse_at_50%_50%,rgba(201,168,76,0.06)_0%,transparent_70%)] p-10 text-center md:p-14">
              <h2 className="text-2xl font-bold text-[#f5f0e8] sm:text-3xl">Ready to harness your next Mars cycle?</h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#b8bcd0]/65">
                Connect with a certified astrologer who can decode your Mars Return chart — showing you where
                your drive is focused, what ambitions are ready to launch, and how to channel your energy for
                maximum impact over the next two years.
              </p>
              <div className="mt-8">
                <Link href="/discover" className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#c9a84c] px-8 text-sm font-semibold text-black shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all hover:bg-[#e2c97e]">
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
