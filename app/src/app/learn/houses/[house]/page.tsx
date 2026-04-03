import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import houses from '@/data/houses'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { FaqSection } from '@/components/seo/faq-section'
import { CtaBanner } from '@/components/seo/cta-banner'
import { JsonLd } from '@/components/seo/json-ld'
import { MarketingHeader } from '@/components/marketing/header'
import { MarketingFooter } from '@/components/marketing/footer'

export const dynamicParams = false

export function generateStaticParams() {
  return houses.map((h) => ({ house: h.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ house: string }>
}): Promise<Metadata> {
  const { house: slug } = await params
  const house = houses.find((h) => h.slug === slug)
  if (!house) return {}

  return {
    title: `${house.name} in Astrology — ${house.nickname}`,
    description: `Learn about the ${house.name} (${house.nickname}) in astrology. Ruling sign: ${house.rulingSign}. Ruling planet: ${house.rulingPlanet}. Discover its meaning in your birth chart.`,
    alternates: {
      canonical: `https://astrologypro.com/learn/houses/${house.slug}`,
    },
    openGraph: {
      title: `${house.name} in Astrology — ${house.nickname}`,
      description: `Explore the ${house.name}: ${house.lifeAreas.slice(0, 3).join(', ')}, and more.`,
    },
  }
}

export default async function HousePage({
  params,
}: {
  params: Promise<{ house: string }>
}) {
  const { house: slug } = await params
  const house = houses.find((h) => h.slug === slug)
  if (!house) notFound()

  const houseIndex = houses.findIndex((h) => h.slug === slug)
  const prevHouse = houses[(houseIndex - 1 + 12) % 12]
  const nextHouse = houses[(houseIndex + 1) % 12]

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${house.name} in Astrology — ${house.nickname}`,
    description: `Learn about the ${house.name} (${house.nickname}) in astrology.`,
    url: `https://astrologypro.com/learn/houses/${house.slug}`,
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
            { label: 'Houses', href: '/learn#houses' },
            { label: house.name },
          ]}
        />

        {/* Hero */}
        <header className="mb-12 mt-6 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-6 py-2">
            <span className="font-[family-name:var(--font-display)] text-4xl font-bold text-[#c9a84c]">
              {house.number}
            </span>
          </div>
          <h1 className="mb-2 font-[family-name:var(--font-display)] text-4xl font-bold text-[#f5f0e8] sm:text-5xl">
            The {house.name}
          </h1>
          <p className="mb-6 font-[family-name:var(--font-display)] text-xl text-[#c9a84c] italic">
            {house.nickname}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/zodiac/${house.rulingSignSlug}`}
              className="rounded-full border border-[#b8bcd0]/20 px-4 py-1.5 text-sm text-[#b8bcd0] transition-colors hover:border-[#c9a84c]/40 hover:text-[#f5f0e8]"
            >
              ♈ Ruled by {house.rulingSign}
            </Link>
            <Link
              href={`/learn/planets/${house.rulingPlanetSlug}`}
              className="rounded-full border border-[#b8bcd0]/20 px-4 py-1.5 text-sm text-[#b8bcd0] transition-colors hover:border-[#c9a84c]/40 hover:text-[#f5f0e8]"
            >
              ☉ Planet: {house.rulingPlanet}
            </Link>
            <span className="rounded-full border border-[#b8bcd0]/20 px-4 py-1.5 text-sm text-[#b8bcd0]">
              {house.element} · {house.modality}
            </span>
          </div>
        </header>

        {/* Overview */}
        <section className="mb-12">
          <h2 className="mb-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8]">
            Overview
          </h2>
          <div className="space-y-4 text-[#b8bcd0] leading-relaxed">
            {house.overview.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {/* Life Areas */}
        <section className="mb-12">
          <h2 className="mb-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8]">
            Life Areas Governed
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {house.lifeAreas.map((area) => (
              <div
                key={area}
                className="rounded-lg border border-[#b8bcd0]/10 bg-[#b8bcd0]/5 p-4 text-center text-sm text-[#f5f0e8]"
              >
                {area}
              </div>
            ))}
          </div>
        </section>

        {/* Planets in House */}
        <section className="mb-12">
          <h2 className="mb-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8]">
            Planets in the {house.name}
          </h2>
          <div className="space-y-4 text-[#b8bcd0] leading-relaxed">
            {house.planetsInHouse.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {/* Signs on Cusp */}
        <section className="mb-12">
          <h2 className="mb-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8]">
            Signs on the {house.name} Cusp
          </h2>
          <div className="space-y-4 text-[#b8bcd0] leading-relaxed">
            {house.signsOnCusp.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {/* Transits */}
        <section className="mb-12">
          <h2 className="mb-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8]">
            Transits Through the {house.name}
          </h2>
          <div className="space-y-4 text-[#b8bcd0] leading-relaxed">
            {house.transits.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <FaqSection faqs={house.faqs} />

        {/* Related */}
        <section className="mb-12 mt-12">
          <h2 className="mb-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8]">
            Explore Related Topics
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href={`/zodiac/${house.rulingSignSlug}`}
              className="rounded-lg border border-[#b8bcd0]/10 bg-[#b8bcd0]/5 p-4 text-[#f5f0e8] transition-colors hover:border-[#c9a84c]/40"
            >
              <span className="text-sm text-[#c9a84c]">Ruling Sign</span>
              <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold">
                {house.rulingSign}
              </p>
            </Link>
            <Link
              href={`/learn/planets/${house.rulingPlanetSlug}`}
              className="rounded-lg border border-[#b8bcd0]/10 bg-[#b8bcd0]/5 p-4 text-[#f5f0e8] transition-colors hover:border-[#c9a84c]/40"
            >
              <span className="text-sm text-[#c9a84c]">Ruling Planet</span>
              <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold">
                {house.rulingPlanet}
              </p>
            </Link>
            <Link
              href={`/learn/houses/${prevHouse.slug}`}
              className="rounded-lg border border-[#b8bcd0]/10 bg-[#b8bcd0]/5 p-4 text-[#f5f0e8] transition-colors hover:border-[#c9a84c]/40"
            >
              <span className="text-sm text-[#c9a84c]">Previous</span>
              <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold">
                {prevHouse.name}
              </p>
            </Link>
            <Link
              href={`/learn/houses/${nextHouse.slug}`}
              className="rounded-lg border border-[#b8bcd0]/10 bg-[#b8bcd0]/5 p-4 text-[#f5f0e8] transition-colors hover:border-[#c9a84c]/40"
            >
              <span className="text-sm text-[#c9a84c]">Next</span>
              <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold">
                {nextHouse.name}
              </p>
            </Link>
          </div>
        </section>
      </main>

      <CtaBanner variant="client" />
      <MarketingFooter />
    </div>
  )
}
