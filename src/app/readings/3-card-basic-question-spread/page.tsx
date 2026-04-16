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
    title: "3 Card Tarot Spread Readings | AstrologyPro",
    description:
      "A focused 3-card tarot reading gives you direct clarity on any question — past, present, and future, or situation, action, and outcome. Quick, powerful, and surprisingly precise.",
    openGraph: {
      title: "3 Card Tarot Spread Readings | AstrologyPro",
      description:
        "A focused 3-card tarot reading gives you direct clarity on any question — past, present, and future, or situation, action, and outcome. Quick, powerful, and surprisingly precise.",
      type: "website",
      url: `${APP_URL}/readings/3-card-basic-question-spread`,
    },
    twitter: {
      card: "summary_large_image",
      title: "3 Card Tarot Spread Readings | AstrologyPro",
      description:
        "A focused 3-card tarot reading gives you direct clarity on any question — past, present, and future, or situation, action, and outcome. Quick, powerful, and surprisingly precise.",
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

async function get3CardBasicQuestionSpreadDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "3_card_basic_question_spread")
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

export default async function ThreeCardBasicQuestionSpreadPage() {
  const diviners = await get3CardBasicQuestionSpreadDiviners();

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
                The Classic Tarot Spread
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8] sm:text-5xl lg:text-6xl">
                The 3-Card Spread:{" "}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #f8d275 0%, #c9a84c 50%, #a07838 100%)" }}>
                  Fast Clarity on Any Question
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#b8bcd0]/75">
                Three cards. Three positions. Infinite clarity. The 3-card spread is the most versatile tool
                in tarot — deceptively simple but capable of remarkable depth when read by a skilled practitioner.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-10">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#c9a84c]">3 Cards</p>
                  <p className="mt-1 text-sm text-[#b8bcd0]/50">One Question Focus</p>
                </div>
                <div className="h-10 w-px bg-white/10" aria-hidden="true" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#c9a84c]">20 Minutes</p>
                  <p className="mt-1 text-sm text-[#b8bcd0]/50">Direct &amp; Precise</p>
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
                  <h2 className="text-2xl font-bold text-[#f5f0e8] sm:text-3xl">What Is a 3-Card Tarot Reading?</h2>
                  <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-[#b8bcd0]/70">
                    <p>
                      The 3-card spread is the foundational tarot layout — three cards drawn and placed in
                      sequence, each representing a distinct dimension of a situation. The most common
                      interpretation maps the cards to past, present, and future, but the spread adapts to
                      any question: situation, action, outcome; mind, body, spirit; the problem, the
                      obstacle, the solution.
                    </p>
                    <p>
                      Despite its simplicity, a 3-card reading in the hands of a skilled reader is not
                      shallow. Each card carries a rich system of symbolism, numerology, elemental
                      correspondence, and traditional meaning. The relationship between the three cards —
                      how they speak to each other across positions — adds another full layer of meaning
                      that a beginner often misses.
                    </p>
                    <p>
                      The 3-card spread excels at focused questions with a defined scope: a decision point,
                      a relationship dynamic, a career choice. For complex situations with many moving
                      parts, a larger spread will serve better — but for precision and direct guidance, the
                      3-card is unmatched.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7">
                  <h3 className="mb-5 text-sm font-semibold uppercase tracking-widest text-[#c9a84c]">What a 3-Card Reading Reveals</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Root Cause or Past Context", desc: "The first card reveals what has brought you to this moment — the situation's origin or the energy you're carrying in" },
                      { label: "Present Energy", desc: "The second card shows the current state of the situation — what is active, what you're working with right now" },
                      { label: "Most Likely Outcome", desc: "The third card reveals the probable outcome if current energies continue, or the advice for the path forward" },
                      { label: "Core Tension or Theme", desc: "The interplay between all three cards often reveals the central tension or lesson the situation is asking you to work with" },
                      { label: "Immediate Actionable Guidance", desc: "What you can do right now — within days or weeks — based on what the spread is showing" },
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
              <p className="mb-10 text-center text-sm text-[#b8bcd0]/50">A 3-card tarot reading delivers focused, actionable guidance</p>
              <div className="grid gap-6 sm:grid-cols-3">
                {[
                  { icon: "🃏", title: "Prepare Your Question", desc: "The more focused your question, the sharper the reading. A clear, specific question ('Should I accept this job offer?' vs. 'What should I do with my life?') allows the reader to draw cards with precise intent and deliver the most actionable insight." },
                  { icon: "🔍", title: "Card-by-Card Interpretation", desc: "Your reader explains each card in its position — its traditional meaning, the imagery and symbolism at work, and how it specifically applies to your question and situation. Nothing is generic; the interpretation is always personalized to your context." },
                  { icon: "💡", title: "Synthesis & Guidance", desc: "The reading concludes with a synthesis of all three cards together — the story they're collectively telling, the key message for your situation, and grounded, practical guidance on what to do or consider next." },
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
              <h2 className="mb-2 text-center text-2xl font-bold text-[#f5f0e8] sm:text-3xl">Find Your Tarot Reader</h2>
              <p className="mb-10 text-center text-sm text-[#b8bcd0]/50">These readers specialize in focused question spreads and direct guidance</p>
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
                  { q: "What questions work best for a 3-card reading?", a: "Focused, specific questions with a defined scope work best: 'What do I need to know about this relationship?', 'What will happen if I take this job?', 'What is blocking my progress right now?' Questions that are too broad ('What is my life purpose?') are better suited for larger spreads that can hold more complexity." },
                  { q: "How accurate are tarot readings?", a: "Tarot is not prediction in the deterministic sense — it's a symbolic language that surfaces what's present in a situation, including factors your conscious mind may not be fully registering. Skilled readers consistently deliver insights that clients describe as remarkably accurate to their experience. The accuracy reflects the reader's skill and the quality of the question as much as the cards themselves." },
                  { q: "Do I need to be present for the reading, or can it be done remotely?", a: "Tarot readings work just as effectively remotely as in person — many readers do their most focused work via video call or even asynchronous audio/video recordings. The card draw is equally valid either way. Ask your reader about their preferred format." },
                  { q: "Can I ask the same question in multiple readings?", a: "It's fine to revisit a question as circumstances evolve. However, repeatedly drawing for the same question without giving time for the situation to develop — out of anxiety rather than genuine inquiry — tends to produce muddier readings. Give at least a few weeks between readings on the same topic." },
                  { q: "Is a 3-card reading appropriate for a first tarot session?", a: "It's an excellent starting point. The 3-card spread gives you a clear sense of the reader's style and the process without being overwhelming. Many long-term tarot clients keep returning to the 3-card format precisely for its directness and efficiency, even after experiencing larger spreads." },
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
              <h2 className="text-2xl font-bold text-[#f5f0e8] sm:text-3xl">Ready for direct clarity on your question?</h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#b8bcd0]/65">
                Connect with a skilled tarot reader who can translate the symbolism of three cards into
                grounded, actionable guidance — the fast-track to clarity when you need a focused answer.
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
