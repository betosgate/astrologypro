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
    title: "Romantic Relationship Readings | AstrologyPro",
    description:
      "Synastry and composite chart analysis for romantic compatibility — revealing how two people connect, communicate, clash, and grow together astrologically.",
    openGraph: {
      title: "Romantic Relationship Readings | AstrologyPro",
      description:
        "Synastry and composite chart analysis for romantic compatibility — revealing how two people connect, communicate, clash, and grow together astrologically.",
      type: "website",
      url: `${APP_URL}/readings/romantic-relationships`,
    },
    twitter: {
      card: "summary_large_image",
      title: "Romantic Relationship Readings | AstrologyPro",
      description:
        "Synastry and composite chart analysis for romantic compatibility — revealing how two people connect, communicate, clash, and grow together astrologically.",
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

async function getRomanticRelationshipsDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "romantic_relationships")
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

export default async function RomanticRelationshipsPage() {
  const diviners = await getRomanticRelationshipsDiviners();

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
                Relationship Astrology
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8] sm:text-5xl lg:text-6xl">
                Romantic Relationships:{" "}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #f8d275 0%, #c9a84c 50%, #a07838 100%)" }}>
                  The Astrology of Love &amp; Connection
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#b8bcd0]/75">
                Every relationship has its own astrological signature. Synastry reveals how two charts interact — the magnetic pull, the friction points, the growth edges. The composite chart reveals the relationship itself as its own living entity.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-10">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#c9a84c]">Synastry</p>
                  <p className="mt-1 text-sm text-[#b8bcd0]/50">Two Charts in Contact</p>
                </div>
                <div className="h-10 w-px bg-white/10" aria-hidden="true" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#c9a84c]">Composite</p>
                  <p className="mt-1 text-sm text-[#b8bcd0]/50">The Relationship&apos;s Own Chart</p>
                </div>
              </div>
              <div className="mt-10">
                <a href="#diviners" className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#c9a84c] px-8 text-sm font-semibold text-black shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all hover:bg-[#e2c97e]">
                  Find Your Relationship Astrologer ↓
                </a>
              </div>
            </div>
          </section>

          {/* What Is */}
          <section className="px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <div className="grid items-center gap-12 md:grid-cols-2">
                <div>
                  <h2 className="text-2xl font-bold text-[#f5f0e8] sm:text-3xl">What Is a Romantic Relationship Astrology Reading?</h2>
                  <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-[#b8bcd0]/70">
                    <p>
                      A romantic relationship reading uses two primary techniques. Synastry overlays one person&apos;s natal chart on top of another&apos;s, examining the aspects formed between their planetary placements — what draws them together, where they energize each other, and where tension naturally arises.
                    </p>
                    <p>
                      The composite chart takes a different approach: it calculates the midpoints between the two individuals&apos; charts to create an entirely new chart — the chart of the relationship itself. This chart reveals the purpose, dynamics, and evolutionary direction of the partnership as a whole.
                    </p>
                    <p>
                      Used together, synastry and composite analysis provide the most complete astrological portrait of a romantic connection. Whether you&apos;re in a new relationship, navigating long-term partnership, or trying to understand a past connection, this reading offers clarity that few other tools can match.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7">
                  <h3 className="mb-5 text-sm font-semibold uppercase tracking-widest text-[#c9a84c]">What a Romantic Relationship Reading Reveals</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Attraction & Chemistry", desc: "The planetary contacts that create magnetic pull, fascination, and physical attraction between two people" },
                      { label: "Communication & Understanding", desc: "How each person thinks, speaks, and processes — and where natural understanding or misunderstanding lives" },
                      { label: "Emotional Connection", desc: "Moon and Venus interactions showing how each person's emotional needs and love language align or clash" },
                      { label: "Growth & Challenge", desc: "Saturn, Mars, and outer planet contacts that create the friction and pressure points that drive growth" },
                      { label: "Long-Term Potential", desc: "The composite chart's signature revealing the purpose, direction, and evolutionary arc of the relationship" },
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
              <p className="mb-10 text-center text-sm text-[#b8bcd0]/50">A romantic relationship reading reveals the full astrological story of your connection</p>
              <div className="grid gap-6 sm:grid-cols-3">
                {[
                  { icon: "💫", title: "Synastry Analysis", desc: "Your astrologer will identify the most significant contacts between your two charts — the Venus-Mars aspects, Moon connections, Saturn contacts, and nodal links that form the core story of how these two people affect each other." },
                  { icon: "💑", title: "Composite Chart Reading", desc: "The composite chart is examined as its own entity — what is this relationship here to do? What themes does it carry? What does it ask of both people? Where does it flourish and where does it struggle?" },
                  { icon: "🌱", title: "Practical Relationship Guidance", desc: "The reading closes with grounded, compassionate guidance on communication strategies, navigating the tension points, and how to align with the highest expression of what your connection is capable of." },
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
              <h2 className="mb-2 text-center text-2xl font-bold text-[#f5f0e8] sm:text-3xl">Find Your Relationship Astrologer</h2>
              <p className="mb-10 text-center text-sm text-[#b8bcd0]/50">These practitioners specialize in synastry and composite chart readings</p>
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
                  { q: "Do I need both people's birth data for a relationship reading?", a: "Yes — you'll need the birth date, time, and location for both individuals. The more precise the data (especially birth time), the more accurate and nuanced the synastry and composite analysis will be. If your partner's birth time is unknown, the reading will still provide valuable insight using a solar chart." },
                  { q: "Does my partner need to be present for the reading?", a: "No. The reading is done with chart data alone. You can have the reading on your own, and your astrologer will interpret both charts objectively without requiring your partner's participation or knowledge." },
                  { q: "Can astrology tell me if someone is my soulmate?", a: "Astrology can reveal deep resonance, karmic connection (through nodal contacts), and powerful energetic pull between two charts. However, the concept of a 'soulmate' goes beyond technique — your astrologer can show you what the connection is astrologically built for, but the choices you make within it determine the outcome." },
                  { q: "Can this reading be done for a relationship that has ended?", a: "Absolutely. Many people seek a relationship reading specifically to understand a past connection — why it felt so intense, what the purpose of it was, and what patterns to carry forward. Past relationship readings are some of the most healing and clarifying sessions available." },
                  { q: "Is synastry or composite more important?", a: "They answer different questions. Synastry shows how two individuals interact — their chemistry, tensions, and communication patterns. The composite chart shows what the relationship itself is — its purpose, themes, and direction. Both are needed for a complete picture. Most skilled astrologers use them together." },
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
              <h2 className="text-2xl font-bold text-[#f5f0e8] sm:text-3xl">Ready to understand your connection at its deepest level?</h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#b8bcd0]/65">
                Connect with a certified relationship astrologer who can decode the synastry and composite charts — revealing the magnetic pull, growth edges, and deeper purpose of your most important connection.
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
