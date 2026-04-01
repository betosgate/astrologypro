import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import aspects from '@/data/aspects'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { FaqSection } from '@/components/seo/faq-section'
import { CtaBanner } from '@/components/seo/cta-banner'
import { JsonLd } from '@/components/seo/json-ld'
import { MarketingHeader } from '@/components/marketing/header'
import { MarketingFooter } from '@/components/marketing/footer'

export const dynamicParams = false

export function generateStaticParams() {
  return aspects.map((a) => ({ aspect: a.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ aspect: string }>
}): Promise<Metadata> {
  const { aspect: slug } = await params
  const aspect = aspects.find((a) => a.slug === slug)
  if (!aspect) return {}

  return {
    title: `${aspect.name} Aspect in Astrology (${aspect.symbol} ${aspect.degrees}°)`,
    description: `Learn about the ${aspect.name} aspect (${aspect.degrees}°) in astrology. Nature: ${aspect.nature}. Keywords: ${aspect.keywords.slice(0, 4).join(', ')}. Meaning in natal, synastry & transit charts.`,
    alternates: {
      canonical: `https://astrologypro.com/learn/aspects/${aspect.slug}`,
    },
    openGraph: {
      title: `${aspect.name} Aspect in Astrology (${aspect.symbol} ${aspect.degrees}°)`,
      description: `Explore the ${aspect.name}: ${aspect.keywords.slice(0, 3).join(', ')}, and more.`,
    },
  }
}

const natureBadgeColors: Record<string, string> = {
  Neutral: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
  Challenging: 'border-red-400/30 bg-red-400/10 text-red-300',
  Harmonious: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
}

export default async function AspectPage({
  params,
}: {
  params: Promise<{ aspect: string }>
}) {
  const { aspect: slug } = await params
  const aspect = aspects.find((a) => a.slug === slug)
  if (!aspect) notFound()

  const otherAspects = aspects.filter((a) => a.slug !== slug)

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${aspect.name} Aspect in Astrology`,
    description: `Learn about the ${aspect.name} aspect in astrology — natal, synastry, and transit meanings.`,
    url: `https://astrologypro.com/learn/aspects/${aspect.slug}`,
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
            { label: 'Aspects', href: '/learn#aspects' },
            { label: aspect.name },
          ]}
        />

        {/* Hero */}
        <header className="mb-12 mt-6 text-center">
          <div className="mb-4 text-6xl" aria-hidden="true">
            {aspect.symbol}
          </div>
          <h1 className="mb-2 font-[family-name:var(--font-display)] text-4xl font-bold text-[#f5f0e8] sm:text-5xl">
            The {aspect.name}
          </h1>
          <div className="mb-6 flex items-center justify-center gap-3">
            <span className="font-[family-name:var(--font-display)] text-xl text-[#b8bcd0]/70">
              {aspect.degrees}°
            </span>
            <span
              className={`inline-flex rounded-full border px-4 py-1.5 text-sm font-medium ${natureBadgeColors[aspect.nature] || ''}`}
            >
              {aspect.nature}
            </span>
          </div>
          <p className="text-sm text-[#b8bcd0]/60">Typical orb: {aspect.orb}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {aspect.keywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full border border-[#b8bcd0]/20 px-3 py-1 text-sm text-[#b8bcd0]"
              >
                {kw}
              </span>
            ))}
          </div>
        </header>

        {/* Overview */}
        <section className="mb-12">
          <h2 className="mb-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8]">
            Overview
          </h2>
          <div className="space-y-4 text-[#b8bcd0] leading-relaxed">
            {aspect.overview.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {/* In Natal Chart */}
        <section className="mb-12">
          <h2 className="mb-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8]">
            The {aspect.name} in the Natal Chart
          </h2>
          <div className="space-y-4 text-[#b8bcd0] leading-relaxed">
            {aspect.inNatal.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {/* In Synastry */}
        <section className="mb-12">
          <h2 className="mb-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8]">
            The {aspect.name} in Synastry
          </h2>
          <div className="space-y-4 text-[#b8bcd0] leading-relaxed">
            {aspect.inSynastry.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {/* In Transit */}
        <section className="mb-12">
          <h2 className="mb-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8]">
            The {aspect.name} in Transit
          </h2>
          <div className="space-y-4 text-[#b8bcd0] leading-relaxed">
            {aspect.inTransit.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {/* Example Planet Pairs */}
        <section className="mb-12">
          <h2 className="mb-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8]">
            Example Planet Pairs
          </h2>
          <div className="space-y-3">
            {aspect.examplePairs.map((pair) => (
              <div
                key={pair.planets}
                className="rounded-lg border border-[#b8bcd0]/10 bg-[#b8bcd0]/5 p-4"
              >
                <h3 className="mb-2 font-[family-name:var(--font-display)] text-lg font-semibold text-[#c9a84c]">
                  {pair.planets}
                </h3>
                <p className="text-sm text-[#b8bcd0] leading-relaxed">{pair.meaning}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <FaqSection faqs={aspect.faqs} />

        {/* Related Aspects */}
        <section className="mb-12 mt-12">
          <h2 className="mb-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8]">
            Other Aspects
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {otherAspects.map((a) => (
              <Link
                key={a.slug}
                href={`/learn/aspects/${a.slug}`}
                className="rounded-lg border border-[#b8bcd0]/10 bg-[#b8bcd0]/5 p-4 text-[#f5f0e8] transition-colors hover:border-[#c9a84c]/40"
              >
                <span className="text-2xl">{a.symbol}</span>
                <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold">
                  {a.name}
                </p>
                <p className="text-sm text-[#b8bcd0]/60">
                  {a.degrees}° · {a.nature}
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
