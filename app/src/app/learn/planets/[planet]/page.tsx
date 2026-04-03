import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import planets from '@/data/planets'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { FaqSection } from '@/components/seo/faq-section'
import { CtaBanner } from '@/components/seo/cta-banner'
import { JsonLd } from '@/components/seo/json-ld'
import { MarketingHeader } from '@/components/marketing/header'
import { MarketingFooter } from '@/components/marketing/footer'

export const dynamicParams = false

export function generateStaticParams() {
  return planets.map((p) => ({ planet: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ planet: string }>
}): Promise<Metadata> {
  const { planet: slug } = await params
  const planet = planets.find((p) => p.slug === slug)
  if (!planet) return {}

  return {
    title: `${planet.name} in Astrology — Meaning, Signs & Houses`,
    description: `Discover ${planet.name} ${planet.symbol} in astrology. Rules ${planet.ruledSigns.join(' & ')}. Keywords: ${planet.keywords.slice(0, 4).join(', ')}. Learn its meaning in your birth chart.`,
    alternates: {
      canonical: `https://astrologypro.com/learn/planets/${planet.slug}`,
    },
    openGraph: {
      title: `${planet.name} in Astrology — Meaning, Signs & Houses`,
      description: `Explore ${planet.name}: ${planet.keywords.slice(0, 3).join(', ')}, and more.`,
    },
  }
}

const typeLabels: Record<string, string> = {
  luminary: 'Luminary',
  personal: 'Personal Planet',
  social: 'Social Planet',
  transpersonal: 'Transpersonal Planet',
  point: 'Sensitive Point',
}

export default async function PlanetPage({
  params,
}: {
  params: Promise<{ planet: string }>
}) {
  const { planet: slug } = await params
  const planet = planets.find((p) => p.slug === slug)
  if (!planet) notFound()

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${planet.name} in Astrology`,
    description: `Learn about ${planet.name} in astrology — meaning, signs, houses, and retrograde.`,
    url: `https://astrologypro.com/learn/planets/${planet.slug}`,
    publisher: {
      '@type': 'Organization',
      name: 'AstrologyPro',
      url: 'https://astrologypro.com',
    },
  }

  return (
    <div className="min-h-screen bg-[#040610]">
      <MarketingHeader />
      <JsonLd data={articleJsonLd} />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Learn Astrology', href: '/learn' },
            { label: 'Planets', href: '/learn#planets' },
            { label: planet.name },
          ]}
        />

        {/* Hero */}
        <header className="mb-12 mt-6 text-center">
          <div className="mb-4 text-6xl" aria-hidden="true">
            {planet.symbol}
          </div>
          <h1 className="mb-2 font-[family-name:var(--font-display)] text-4xl font-bold text-[#f5f0e8] sm:text-5xl">
            {planet.name}
          </h1>
          <p className="mb-6">
            <span className="inline-flex rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-4 py-1.5 text-sm font-medium text-[#c9a84c]">
              {typeLabels[planet.type]}
            </span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {planet.keywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full border border-[#b8bcd0]/20 px-3 py-1 text-sm text-[#b8bcd0]"
              >
                {kw}
              </span>
            ))}
          </div>
        </header>

        {/* Dignities Box */}
        <section className="mb-12 rounded-xl border border-[#c9a84c]/20 bg-[#c9a84c]/5 p-6">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-semibold text-[#c9a84c]">
            Essential Dignities
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#b8bcd0]/60">Rules</p>
              <div className="mt-1 space-y-1">
                {planet.ruledSigns.map((sign, i) => (
                  <Link
                    key={sign}
                    href={`/zodiac/${planet.ruledSignSlugs[i]}`}
                    className="block font-medium text-[#f5f0e8] transition-colors hover:text-[#c9a84c]"
                  >
                    {sign}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[#b8bcd0]/60">Exaltation</p>
              <p className="mt-1 font-medium text-[#f5f0e8]">{planet.exaltation}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[#b8bcd0]/60">Detriment</p>
              <p className="mt-1 font-medium text-[#f5f0e8]">{planet.detriment}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[#b8bcd0]/60">Fall</p>
              <p className="mt-1 font-medium text-[#f5f0e8]">{planet.fall}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 border-t border-[#c9a84c]/10 pt-4 text-sm text-[#b8bcd0]/70">
            <span>Orbit: {planet.orbitalPeriod}</span>
            {planet.element && <span>Element: {planet.element}</span>}
          </div>
        </section>

        {/* Overview */}
        <section className="mb-12">
          <h2 className="mb-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8]">
            Overview
          </h2>
          <div className="space-y-4 text-[#b8bcd0] leading-relaxed">
            {planet.overview.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {/* In Signs */}
        <section className="mb-12">
          <h2 className="mb-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8]">
            {planet.name} Through the Signs
          </h2>
          <div className="space-y-4 text-[#b8bcd0] leading-relaxed">
            {planet.inSigns.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {/* In Houses */}
        <section className="mb-12">
          <h2 className="mb-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8]">
            {planet.name} Through the Houses
          </h2>
          <div className="space-y-4 text-[#b8bcd0] leading-relaxed">
            {planet.inHouses.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {/* Mythology */}
        <section className="mb-12">
          <h2 className="mb-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8]">
            Mythology & Symbolism
          </h2>
          <div className="space-y-4 text-[#b8bcd0] leading-relaxed">
            {planet.mythology.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {/* Retrograde Guide */}
        <section className="mb-12">
          <h2 className="mb-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8]">
            Retrograde Guide
          </h2>
          <div className="mb-4 rounded-lg border border-[#b8bcd0]/10 bg-[#b8bcd0]/5 p-4 text-sm text-[#b8bcd0]/80 italic">
            {planet.retrograde}
          </div>
          <div className="space-y-4 text-[#b8bcd0] leading-relaxed">
            {planet.retrogradeGuide.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <FaqSection faqs={planet.faqs} />

        {/* Related */}
        <section className="mb-12 mt-12">
          <h2 className="mb-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8]">
            Explore Related Topics
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {planet.ruledSigns.map((sign, i) => (
              <Link
                key={sign}
                href={`/zodiac/${planet.ruledSignSlugs[i]}`}
                className="rounded-lg border border-[#b8bcd0]/10 bg-[#b8bcd0]/5 p-4 text-[#f5f0e8] transition-colors hover:border-[#c9a84c]/40"
              >
                <span className="text-sm text-[#c9a84c]">Ruled Sign</span>
                <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold">
                  {sign}
                </p>
              </Link>
            ))}
            {planets
              .filter((p) => p.slug !== planet.slug)
              .slice(0, 2)
              .map((p) => (
                <Link
                  key={p.slug}
                  href={`/learn/planets/${p.slug}`}
                  className="rounded-lg border border-[#b8bcd0]/10 bg-[#b8bcd0]/5 p-4 text-[#f5f0e8] transition-colors hover:border-[#c9a84c]/40"
                >
                  <span className="text-sm text-[#c9a84c]">Also Explore</span>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold">
                    {p.symbol} {p.name}
                  </p>
                </Link>
              ))}
          </div>
        </section>
      </main>

      <CtaBanner variant="client" />
      <MarketingFooter />
    </div>
  )
}
