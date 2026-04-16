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
    title: "7 Card Horseshoe Tarot Spread | AstrologyPro",
    description:
      "The horseshoe spread is one of tarot's most elegant seven-card layouts — covering past, present, hidden influences, obstacles, outside influences, advice, and outcome in a single cohesive reading.",
    openGraph: {
      title: "7 Card Horseshoe Tarot Spread | AstrologyPro",
      description:
        "The horseshoe spread is one of tarot's most elegant seven-card layouts — covering past, present, hidden influences, obstacles, outside influences, advice, and outcome in a single cohesive reading.",
      type: "website",
      url: `${APP_URL}/readings/7-card-horseshoe-spread-major-read`,
    },
    twitter: {
      card: "summary_large_image",
      title: "7 Card Horseshoe Tarot Spread | AstrologyPro",
      description:
        "The horseshoe spread is one of tarot's most elegant seven-card layouts — covering past, present, hidden influences, obstacles, outside influences, advice, and outcome in a single cohesive reading.",
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

async function get7CardHorseshoeSpreadMajorReadDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "7_card_horseshoe_spread_major_read")
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

export default async function SevenCardHorseshoeSpreadMajorReadPage() {
  const diviners = await get7CardHorseshoeSpreadMajorReadDiviners();

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
                Classic Major Tarot Spread
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8] sm:text-5xl lg:text-6xl">
                The 7-Card Horseshoe Spread:{" "}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #f8d275 0%, #c9a84c 50%, #a07838 100%)" }}>
                  A Complete View of Any Situation
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#b8bcd0]/75">
                The horseshoe spread has been a cornerstone of tarot practice for centuries. Seven
                positions covering past, present, hidden factors, obstacles, external influences, advice,
                and outcome — it&rsquo;s the most complete single-question spread in the classical tarot canon.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-10">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#c9a84c]">7 Cards</p>
                  <p className="mt-1 text-sm text-[#b8bcd0]/50">Seven Positions</p>
                </div>
                <div className="h-10 w-px bg-white/10" aria-hidden="true" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#c9a84c]">45 Minutes</p>
                  <p className="mt-1 text-sm text-[#b8bcd0]/50">The Full Situation Picture</p>
                </div>
              </div>
              <div className="mt-10">
                <a href="#diviners" className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#c9a84c] px-8 text-sm font-semibold text-black shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all hover:bg-[#e2c97e]">
                  Find Your Tarot Reader ↓
                </a>
              </div>
            </div>
          </section>

          {/* What Is */}
          <section className="px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <div className="grid items-center gap-12 md:grid-cols-2">
                <div>
                  <h2 className="text-2xl font-bold text-[#f5f0e8] sm:text-3xl">What Is the Horseshoe Tarot Spread?</h2>
                  <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-[#b8bcd0]/70">
                    <p>
                      The horseshoe spread arranges seven cards in an arc — like the horseshoe shape that
                      gives it its name. Each of the seven positions addresses a distinct dimension of
                      the situation: where you&rsquo;ve been, where you are, what&rsquo;s hidden beneath
                      the surface, what&rsquo;s in your way, what outside forces are at play, what advice
                      the cards offer, and where things are heading.
                    </p>
                    <p>
                      Unlike question spreads that focus narrowly on a single thread, the horseshoe gives
                      you the full picture: not just what will likely happen, but why the situation has
                      developed this way, what you may not be seeing clearly, and what specific guidance
                      the cards are offering. It&rsquo;s a complete situational analysis rather than a
                      directional prediction.
                    </p>
                    <p>
                      The horseshoe&rsquo;s structure makes it especially valuable for complex personal
                      situations — ongoing conflicts, relationship crossroads, career transitions, or any
                      situation where you feel like you don&rsquo;t have the full picture. The hidden
                      influences position alone often delivers the most transformative insight of the
                      entire reading.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7">
                  <h3 className="mb-5 text-sm font-semibold uppercase tracking-widest text-[#c9a84c]">What the Horseshoe Spread Reveals</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Past Context", desc: "What has shaped the current situation — the history and prior choices that have led to this point" },
                      { label: "Present Reality", desc: "Where you actually are right now — including what may be happening beneath the surface of appearances" },
                      { label: "Hidden Influences", desc: "Factors operating beneath conscious awareness — subconscious patterns, unseen dynamics, or overlooked forces affecting the outcome" },
                      { label: "Obstacles & External Forces", desc: "What is standing in the way and what outside influences (other people, circumstances, timing) are shaping the trajectory" },
                      { label: "Advice & Most Likely Outcome", desc: "The most relevant guidance for navigating the situation, and where things are heading if current energies continue" },
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
              <p className="mb-10 text-center text-sm text-[#b8bcd0]/50">The horseshoe spread delivers a complete situational analysis in one reading</p>
              <div className="grid gap-6 sm:grid-cols-3">
                {[
                  { icon: "🧩", title: "Full Situational Mapping", desc: "Seven cards are drawn and placed in the horseshoe layout, each occupying a specific position that addresses a distinct dimension of the situation. You'll see the full architecture of what you're navigating before your reader interprets a single card." },
                  { icon: "🔍", title: "The Hidden Influences Position", desc: "Often the most powerful card in the spread, position three surfaces what's operating below conscious awareness — the invisible dynamic, the overlooked factor, or the subconscious pattern that is quietly driving the situation more than anything visible." },
                  { icon: "🎯", title: "Integrated Outcome & Advice", desc: "The reading closes by synthesizing all seven positions into a coherent narrative — understanding not just where things are headed but what you can specifically do with the advice card's guidance to shift or support the outcome." },
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
              <h2 className="mb-2 text-center text-2xl font-bold text-[#f5f0e8] sm:text-3xl">Find Your Horseshoe Spread Reader</h2>
              <p className="mb-10 text-center text-sm text-[#b8bcd0]/50">These readers specialize in comprehensive classical tarot spreads</p>
              {diviners.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {diviners.map((d) => <DivinerCard key={d.username} diviner={d} />)}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] py-16 text-center">
                  <p className="text-[#b8bcd0]/50">New practitioners are joining soon. Browse all tarot readers in the meantime.</p>
                </div>
              )}
              <div className="mt-8 text-center">
                <Link href="/discover?type=tarot" className="inline-flex items-center gap-1.5 text-sm text-[#c9a84c]/70 transition-colors hover:text-[#c9a84c]">
                  See All Tarot Readers <ArrowRight className="size-3.5" aria-hidden="true" />
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
                  { q: "What kinds of situations is the horseshoe spread best for?", a: "Situations with multiple layers of complexity where you want more than just a yes/no or directional answer. Relationship dilemmas, ongoing life challenges, career crossroads, or any situation where you feel you're missing part of the picture. The horseshoe's seven positions are specifically designed to surface hidden factors and external influences that simpler spreads leave uncovered." },
                  { q: "How is the horseshoe different from the Celtic Cross?", a: "Both are comprehensive spreads, but the horseshoe (7 cards) is slightly more streamlined than the Celtic Cross (10 cards). The horseshoe covers all essential angles efficiently; the Celtic Cross adds extra positions for subconscious themes and final outcome. Choose horseshoe for a thorough but focused reading; choose Celtic Cross when you want maximum depth." },
                  { q: "Do I need to bring a specific question?", a: "A question helps focus the spread, but the horseshoe also works as a general situational reading — 'What do I most need to know about my life right now?' is a valid opening. That said, the most powerful readings come from a specific, sincere question that gives the reader a clear lens through which to interpret the positions." },
                  { q: "Can the hidden influences position show information about other people?", a: "Yes — the hidden influences position often surfaces what another person is thinking, feeling, or intending that you're not fully aware of. It can also show your own subconscious attitudes, overlooked practical factors, or timing elements that haven't been considered. It tends to be the most revelatory position in the entire spread." },
                  { q: "Is the horseshoe spread suitable for recurring life themes rather than a one-time question?", a: "Absolutely. The spread's structure handles recurring patterns particularly well — the past position traces the pattern's origin, the hidden influences reveals what perpetuates it, and the advice and outcome positions chart a constructive path forward. It's an excellent format for working with persistent life themes." },
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
              <h2 className="text-2xl font-bold text-[#f5f0e8] sm:text-3xl">Ready for the full picture of your situation?</h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#b8bcd0]/65">
                Connect with a skilled tarot reader who can use the horseshoe spread to map every
                dimension of your situation — from hidden influences to final outcome — in one
                comprehensive, actionable reading.
              </p>
              <div className="mt-8">
                <Link href="/discover" className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#c9a84c] px-8 text-sm font-semibold text-black shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all hover:bg-[#e2c97e]">
                  Browse All Tarot Readers
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
