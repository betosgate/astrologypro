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
    title: "Celtic Cross Tarot Reading | AstrologyPro",
    description:
      "The Celtic Cross is the most iconic and comprehensive spread in all of tarot — 10 cards covering the full spectrum of a situation: present, past, future, subconscious, external influences, hopes, fears, and outcome.",
    openGraph: {
      title: "Celtic Cross Tarot Reading | AstrologyPro",
      description:
        "The Celtic Cross is the most iconic and comprehensive spread in all of tarot — 10 cards covering the full spectrum of a situation: present, past, future, subconscious, external influences, hopes, fears, and outcome.",
      type: "website",
      url: `${APP_URL}/readings/10-card-celtic-cross-major-read`,
    },
    twitter: {
      card: "summary_large_image",
      title: "Celtic Cross Tarot Reading | AstrologyPro",
      description:
        "The Celtic Cross is the most iconic and comprehensive spread in all of tarot — 10 cards covering the full spectrum of a situation: present, past, future, subconscious, external influences, hopes, fears, and outcome.",
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

async function getCelticCrossDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "10_card_celtic_cross_major_read")
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

export default async function CelticCrossPage() {
  const diviners = await getCelticCrossDiviners();

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
                The Gold Standard of Tarot Spreads
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8] sm:text-5xl lg:text-6xl">
                The Celtic Cross:{" "}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #f8d275 0%, #c9a84c 50%, #a07838 100%)" }}>
                  Tarot&apos;s Most Complete Spread
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#b8bcd0]/75">
                For over a century, the Celtic Cross has been the definitive major tarot reading — ten cards, ten
                positions, covering every dimension of a situation from your deepest subconscious to the most likely
                final outcome.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-10">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#c9a84c]">10 Cards</p>
                  <p className="mt-1 text-sm text-[#b8bcd0]/50">10 Distinct Positions</p>
                </div>
                <div className="h-10 w-px bg-white/10" aria-hidden="true" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#c9a84c]">60 Minutes</p>
                  <p className="mt-1 text-sm text-[#b8bcd0]/50">The Complete Tarot Picture</p>
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
                  <h2 className="text-2xl font-bold text-[#f5f0e8] sm:text-3xl">What Is the Celtic Cross Tarot Spread?</h2>
                  <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-[#b8bcd0]/70">
                    <p>
                      The Celtic Cross is the most recognized and widely used spread in tarot history. First documented
                      in A.E. Waite&apos;s 1910 &lsquo;Pictorial Key to the Tarot&rsquo; — written alongside the
                      creation of the iconic Rider-Waite-Smith deck — the Celtic Cross has remained the benchmark for
                      comprehensive single-session tarot work for well over a century.
                    </p>
                    <p>
                      Ten cards are laid in a specific pattern: a central cross of six cards surrounded by a staff of
                      four. Each position addresses a unique dimension of the situation: the present energy, the
                      crossing influence, the foundation, the recent past, the possible future, the near future, the
                      querent&apos;s position, external influences, hopes and fears, and the final outcome.
                    </p>
                    <p>
                      The Celtic Cross is appropriate whenever you want the fullest possible picture of a situation. It
                      covers more ground than any other common spread — including subconscious and conscious dimensions,
                      past and future, internal and external forces. For major life decisions or deep personal
                      questions, it remains unmatched.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7">
                  <h3 className="mb-5 text-sm font-semibold uppercase tracking-widest text-[#c9a84c]">What a Celtic Cross Reading Reveals</h3>
                  <div className="space-y-3">
                    {[
                      { label: "The Core Situation & Crossing Influence", desc: "What is at the heart of the matter and what is the primary force crossing, challenging, or shaping it" },
                      { label: "Past Foundation & Recent Events", desc: "The root basis of the situation and what recent events have contributed to the current circumstances" },
                      { label: "Subconscious & Conscious Themes", desc: "What is operating below the surface of awareness and what is consciously known or desired" },
                      { label: "External Influences & Near Future", desc: "The people, circumstances, or energies outside yourself affecting the situation, and what is immediately approaching" },
                      { label: "Hopes, Fears & Final Outcome", desc: "What you most hope for and fear in the situation, and the most likely final outcome based on current trajectory" },
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
              <p className="mb-10 text-center text-sm text-[#b8bcd0]/50">A Celtic Cross reading is the gold standard for comprehensive tarot work</p>
              <div className="grid gap-6 sm:grid-cols-3">
                {[
                  { icon: "✝️", title: "The Ten-Position Layout", desc: "Your reader places ten cards in the classic Celtic Cross formation and walks through each position in sequence — building a complete, interconnected story of the situation rather than interpreting cards in isolation." },
                  { icon: "🧠", title: "Conscious & Subconscious Layers", desc: "Two positions are specifically dedicated to what is conscious versus subconscious in the situation — one of the Celtic Cross's most powerful features, as it often surfaces the self-sabotage, hidden desire, or unconscious belief that is the real driver of the situation." },
                  { icon: "🏁", title: "Hopes, Fears & Outcome", desc: "The final three cards in the staff form the most anticipated part of the reading: what you most deeply hope for and fear (often the same card — a profound insight in itself), and the final outcome card showing where the situation is likely to land." },
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
              <h2 className="mb-2 text-center text-2xl font-bold text-[#f5f0e8] sm:text-3xl">Find Your Celtic Cross Reader</h2>
              <p className="mb-10 text-center text-sm text-[#b8bcd0]/50">These readers specialize in comprehensive major tarot spreads</p>
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
                  { q: "How is the Celtic Cross different from other 10-card spreads?", a: "The Celtic Cross has a very specific, codified layout where each of the 10 positions has a defined meaning established by over a century of tarot tradition. The relationship spread also uses 10 cards but in a different arrangement optimized for two-person dynamics. The Celtic Cross is a general-purpose comprehensive spread; the relationship spread is purpose-built for interpersonal questions." },
                  { q: "Is the Celtic Cross appropriate for beginners?", a: "As a querent (the person receiving the reading), absolutely — you don't need to know anything about tarot to receive a Celtic Cross reading. The depth and complexity is the reader's job to manage. As a reader, it requires significant experience to interpret all 10 positions and their interplay accurately — which is why you want a skilled practitioner." },
                  { q: "What is the 'hopes and fears' position and why is one card used for both?", a: "One of the most philosophically rich aspects of the Celtic Cross — a single card occupies both the 'hopes' and 'fears' positions, because what we most deeply hope for and what we most deeply fear are often the same thing. The card in this position reveals the core ambivalence or paradox at the heart of what you want. Many clients describe it as the most personally resonant card of the spread." },
                  { q: "Can I ask a yes/no question for a Celtic Cross?", a: "You can, but it's somewhat like using a Swiss Army knife to slice bread — it works, but the tool has more capacity than the task requires. The Celtic Cross is designed for complex, multi-dimensional questions. A 3-card spread handles yes/no questions more efficiently. Use the Celtic Cross when you want the full landscape of a situation." },
                  { q: "How often should I get a Celtic Cross reading?", a: "Unlike weekly or monthly readings that track fast-moving energy, a Celtic Cross is a deep-dive into a specific situation or life area. Most people find one every few months — or whenever a major crossroads arises — is the right cadence. More frequently than that tends to create noise rather than clarity, as the cards need time to play out." },
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
              <h2 className="text-2xl font-bold text-[#f5f0e8] sm:text-3xl">Ready for the most complete tarot reading available?</h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#b8bcd0]/65">
                Connect with a skilled tarot reader who can navigate all ten positions of the Celtic Cross — giving
                you the full picture of your situation from subconscious roots to final outcome.
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
