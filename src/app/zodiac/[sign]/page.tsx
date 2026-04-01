import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { FaqSection } from "@/components/seo/faq-section";
import { CtaBanner } from "@/components/seo/cta-banner";
import { JsonLd } from "@/components/seo/json-ld";
import zodiacSigns from "@/data/zodiac-signs";

export const dynamicParams = false;

export async function generateStaticParams() {
  return zodiacSigns.map((sign) => ({ sign: sign.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sign: string }>;
}): Promise<Metadata> {
  const { sign: slug } = await params;
  const sign = zodiacSigns.find((s) => s.slug === slug);
  if (!sign) return {};

  const title = `${sign.name} Zodiac Sign: Traits, Compatibility & Meaning | AstrologyPro`;
  const description = `Discover everything about ${sign.name} (${sign.dates}). Explore ${sign.name} personality traits, love compatibility, career strengths, and ruling planet ${sign.rulingPlanet}. Complete ${sign.name} zodiac guide.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://www.astrologypro.com/zodiac/${sign.slug}`,
      siteName: "AstrologyPro",
    },
  };
}

const elementColors: Record<string, string> = {
  Fire: "bg-red-900/30 text-red-300 border-red-700/40",
  Earth: "bg-emerald-900/30 text-emerald-300 border-emerald-700/40",
  Air: "bg-sky-900/30 text-sky-300 border-sky-700/40",
  Water: "bg-blue-900/30 text-blue-300 border-blue-700/40",
};

const compatColors: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: "bg-emerald-900/40", text: "text-emerald-300", label: "High" },
  medium: { bg: "bg-amber-900/40", text: "text-amber-300", label: "Medium" },
  low: { bg: "bg-red-900/40", text: "text-red-300", label: "Low" },
};

export default async function ZodiacSignPage({
  params,
}: {
  params: Promise<{ sign: string }>;
}) {
  const { sign: slug } = await params;
  const sign = zodiacSigns.find((s) => s.slug === slug);
  if (!sign) notFound();

  const overviewParagraphs = sign.overview.split("\n\n");
  const personalityParagraphs = sign.personality.split("\n\n");
  const loveParagraphs = sign.loveAndRelationships.split("\n\n");
  const careerParagraphs = sign.careerAndMoney.split("\n\n");

  return (
    <div className="min-h-screen bg-[#040610]">
      <MarketingHeader />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `${sign.name} Zodiac Sign: Traits, Compatibility & Meaning`,
          description: `Complete guide to the ${sign.name} zodiac sign including personality traits, love compatibility, career strengths, and astrological meaning.`,
          url: `https://www.astrologypro.com/zodiac/${sign.slug}`,
          publisher: {
            "@type": "Organization",
            name: "AstrologyPro",
            url: "https://www.astrologypro.com",
          },
        }}
      />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Zodiac Signs", href: "/zodiac" },
          { label: sign.name },
        ]}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-radial from-[#c9a84c]/20 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 text-8xl sm:text-9xl">{sign.symbol}</div>
          <h1 className="font-display text-4xl font-bold text-[#f5f0e8] sm:text-5xl lg:text-6xl">
            {sign.name}
          </h1>
          <p className="mt-3 text-xl text-[#c9a84c]">{sign.dates}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <span
              className={`rounded-full border px-4 py-1.5 text-sm font-medium ${elementColors[sign.element] || "bg-gray-800 text-gray-300"}`}
            >
              {sign.element}
            </span>
            <span className="rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-4 py-1.5 text-sm font-medium text-[#c9a84c]">
              {sign.modality}
            </span>
            <span className="rounded-full border border-purple-700/40 bg-purple-900/30 px-4 py-1.5 text-sm font-medium text-purple-300">
              Ruled by {sign.rulingPlanet}
            </span>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-[#f5f0e8]">
            {sign.name} Overview
          </h2>
          <div className="mt-6 space-y-4">
            {overviewParagraphs.map((p, i) => (
              <p key={i} className="leading-relaxed text-[#b8bcd0]">
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* At a Glance Grid */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-center text-3xl font-bold text-[#f5f0e8]">
            {sign.name} at a Glance
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "Element", value: sign.element, href: null },
              { label: "Modality", value: sign.modality, href: null },
              {
                label: "Ruling Planet",
                value: sign.rulingPlanet,
                href: `/planets/${sign.rulingPlanetSlug}`,
              },
              {
                label: "House",
                value: sign.house,
                href: `/houses/${sign.houseSlug}`,
              },
              { label: "Polarity", value: sign.polarity, href: null },
              { label: "Body Part", value: sign.bodyPart, href: null },
              { label: "Color", value: sign.color, href: null },
              { label: "Gemstone", value: sign.gemstone, href: null },
              { label: "Day", value: sign.dayOfWeek, href: null },
              {
                label: "Tarot Card",
                value: sign.tarotCard,
                href: `/tarot/${sign.tarotCardSlug}`,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-[#c9a84c]/15 bg-[#0a0d1a] p-4 text-center"
              >
                <div className="text-xs font-medium uppercase tracking-wider text-[#c9a84c]/70">
                  {item.label}
                </div>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="mt-1 block text-sm font-semibold text-[#f5f0e8] transition-colors hover:text-[#c9a84c]"
                  >
                    {item.value}
                  </Link>
                ) : (
                  <div className="mt-1 text-sm font-semibold text-[#f5f0e8]">
                    {item.value}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personality Section */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-[#f5f0e8]">
            {sign.name} Personality Traits
          </h2>
          <div className="mt-6 space-y-4">
            {personalityParagraphs.map((p, i) => (
              <p key={i} className="leading-relaxed text-[#b8bcd0]">
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Love & Relationships Section */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-[#f5f0e8]">
            {sign.name} in Love & Relationships
          </h2>
          <div className="mt-6 space-y-4">
            {loveParagraphs.map((p, i) => (
              <p key={i} className="leading-relaxed text-[#b8bcd0]">
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Career & Money Section */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-[#f5f0e8]">
            {sign.name} Career & Money
          </h2>
          <div className="mt-6 space-y-4">
            {careerParagraphs.map((p, i) => (
              <p key={i} className="leading-relaxed text-[#b8bcd0]">
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Compatibility Grid */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-center text-3xl font-bold text-[#f5f0e8]">
            {sign.name} Compatibility
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[#b8bcd0]">
            See how {sign.name} connects with every zodiac sign.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {sign.compatibility.map((c) => {
              const style = compatColors[c.level];
              const otherSign = zodiacSigns.find((s) => s.slug === c.slug);
              return (
                <Link
                  key={c.slug}
                  href={`/zodiac/${c.slug}`}
                  className={`group rounded-xl border border-[#c9a84c]/10 ${style.bg} p-4 text-center transition-all hover:border-[#c9a84c]/30 hover:shadow-lg`}
                >
                  <div className="text-3xl">{otherSign?.symbol}</div>
                  <div className="mt-1 text-sm font-semibold text-[#f5f0e8] group-hover:text-[#c9a84c]">
                    {c.sign}
                  </div>
                  <div
                    className={`mt-1 text-xs font-medium ${style.text}`}
                  >
                    {style.label} Compatibility
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Strengths & Weaknesses */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-center text-3xl font-bold text-[#f5f0e8]">
            Strengths & Weaknesses
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-700/30 bg-emerald-900/10 p-6">
              <h3 className="font-display text-xl font-bold text-emerald-300">
                Strengths
              </h3>
              <ul className="mt-4 space-y-2">
                {sign.strengths.map((s) => (
                  <li
                    key={s}
                    className="flex items-start gap-2 text-[#b8bcd0]"
                  >
                    <span className="mt-1 text-emerald-400">+</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-red-700/30 bg-red-900/10 p-6">
              <h3 className="font-display text-xl font-bold text-red-300">
                Weaknesses
              </h3>
              <ul className="mt-4 space-y-2">
                {sign.weaknesses.map((w) => (
                  <li
                    key={w}
                    className="flex items-start gap-2 text-[#b8bcd0]"
                  >
                    <span className="mt-1 text-red-400">&minus;</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Famous People */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-[#f5f0e8]">
            Famous {sign.name} People
          </h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {sign.famousPeople.map((person) => (
              <span
                key={person}
                className="rounded-full border border-[#c9a84c]/20 bg-[#0a0d1a] px-4 py-2 text-sm text-[#f5f0e8]"
              >
                {person}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FaqSection
        faqs={sign.faqs}
        title={`Frequently Asked Questions About ${sign.name}`}
      />

      {/* Related Content Links */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-bold text-[#f5f0e8]">
            Explore Related Topics
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href={`/planets/${sign.rulingPlanetSlug}`}
              className="group rounded-xl border border-[#c9a84c]/15 bg-[#0a0d1a] p-5 transition-all hover:border-[#c9a84c]/40"
            >
              <div className="text-xs font-medium uppercase tracking-wider text-[#c9a84c]/60">
                Ruling Planet
              </div>
              <div className="mt-1 font-display text-lg font-bold text-[#f5f0e8] group-hover:text-[#c9a84c]">
                {sign.rulingPlanet}
              </div>
              <p className="mt-1 text-sm text-[#b8bcd0]/70">
                Learn how {sign.rulingPlanet} shapes {sign.name}&apos;s nature
              </p>
            </Link>
            <Link
              href={`/houses/${sign.houseSlug}`}
              className="group rounded-xl border border-[#c9a84c]/15 bg-[#0a0d1a] p-5 transition-all hover:border-[#c9a84c]/40"
            >
              <div className="text-xs font-medium uppercase tracking-wider text-[#c9a84c]/60">
                Astrological House
              </div>
              <div className="mt-1 font-display text-lg font-bold text-[#f5f0e8] group-hover:text-[#c9a84c]">
                {sign.house}
              </div>
              <p className="mt-1 text-sm text-[#b8bcd0]/70">
                Explore the {sign.house} in astrology
              </p>
            </Link>
            <Link
              href={`/tarot/${sign.tarotCardSlug}`}
              className="group rounded-xl border border-[#c9a84c]/15 bg-[#0a0d1a] p-5 transition-all hover:border-[#c9a84c]/40"
            >
              <div className="text-xs font-medium uppercase tracking-wider text-[#c9a84c]/60">
                Tarot Card
              </div>
              <div className="mt-1 font-display text-lg font-bold text-[#f5f0e8] group-hover:text-[#c9a84c]">
                {sign.tarotCard}
              </div>
              <p className="mt-1 text-sm text-[#b8bcd0]/70">
                Discover the meaning of {sign.tarotCard}
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <CtaBanner variant="client" />

      <MarketingFooter />
    </div>
  );
}
