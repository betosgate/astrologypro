import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import tarotSpreads from '@/data/tarot-spreads'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { FaqSection } from '@/components/seo/faq-section'
import { CtaBanner } from '@/components/seo/cta-banner'
import { JsonLd } from '@/components/seo/json-ld'
import { MarketingHeader } from '@/components/marketing/header'
import { MarketingFooter } from '@/components/marketing/footer'

export const dynamicParams = false

export async function generateStaticParams() {
  return tarotSpreads.map((s) => ({ spread: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ spread: string }>
}): Promise<Metadata> {
  const { spread: slug } = await params
  const spread = tarotSpreads.find((s) => s.slug === slug)
  if (!spread) return {}
  return {
    title: `${spread.name} Tarot Spread: ${spread.cardCount}-Card Layout Guide | AstrologyPro`,
    description: spread.purpose,
    openGraph: {
      title: `${spread.name} Tarot Spread Guide`,
      description: spread.purpose,
    },
  }
}

export default async function SpreadPage({
  params,
}: {
  params: Promise<{ spread: string }>
}) {
  const { spread: slug } = await params
  const spread = tarotSpreads.find((s) => s.slug === slug)
  if (!spread) notFound()

  const difficultyColor = {
    Beginner: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    Intermediate: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    Advanced: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  }

  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen bg-[#040610]">
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: `${spread.name} Tarot Spread Guide`,
            description: spread.purpose,
            publisher: {
              '@type': 'Organization',
              name: 'AstrologyPro',
            },
          }}
        />

        {/* Hero */}
        <section className="border-b border-[#b8bcd0]/10 bg-gradient-to-b from-[#0d0f1a] to-[#040610] px-6 pb-12 pt-8">
          <div className="mx-auto max-w-4xl">
            <Breadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'Tarot Guide', href: '/tarot' },
                { label: 'Spreads', href: '/tarot/spreads' },
                { label: spread.name },
              ]}
            />
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-3 py-1 text-sm font-medium text-[#f8d275]">
                {spread.cardCount} {spread.cardCount === 1 ? 'Card' : 'Cards'}
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${difficultyColor[spread.difficulty]}`}
              >
                {spread.difficulty}
              </span>
            </div>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold text-[#f5f0e8] md:text-5xl">
              {spread.name}
            </h1>
            <p className="mt-4 text-xl text-[#b8bcd0]/80">{spread.purpose}</p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-6 py-16">
          {/* Best For */}
          <section className="mb-16">
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
              Best For
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {spread.bestFor.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-lg border border-[#b8bcd0]/10 bg-[#b8bcd0]/5 px-4 py-3"
                >
                  <span className="mt-0.5 text-[#c9a84c]">&#9733;</span>
                  <span className="text-[#b8bcd0]">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Overview */}
          <section className="mb-16">
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
              Overview
            </h2>
            <div className="space-y-4 text-[#b8bcd0] leading-relaxed">
              {spread.overview.split('\n\n').map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          {/* Card Positions */}
          <section className="mb-16">
            <h2 className="mb-6 font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
              Card Positions
            </h2>
            <div className="space-y-4">
              {spread.positions.map((pos) => (
                <div
                  key={pos.number}
                  className="flex gap-4 rounded-lg border border-[#b8bcd0]/10 bg-[#0d0f1a] p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#c9a84c]/30 bg-[#c9a84c]/10 font-[family-name:var(--font-display)] text-lg font-bold text-[#f8d275]">
                    {pos.number}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#f5f0e8]">
                      {pos.name}
                    </h3>
                    <p className="mt-1 text-[#b8bcd0]/70">{pos.meaning}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* How to Read */}
          <section className="mb-16">
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
              How to Read This Spread
            </h2>
            <div className="space-y-4 text-[#b8bcd0] leading-relaxed">
              {spread.howToRead.split('\n\n').map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          {/* Tips */}
          <section className="mb-16">
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
              Tips for Better Readings
            </h2>
            <ul className="space-y-3">
              {spread.tips.map((tip, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-[#b8bcd0]"
                >
                  <span className="mt-1 text-[#c9a84c]">&#10147;</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Variations */}
          <section className="mb-16">
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
              Variations
            </h2>
            <div className="space-y-4 text-[#b8bcd0] leading-relaxed">
              {spread.variations.split('\n\n').map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <FaqSection faqs={spread.faqs} />

          {/* Related Spreads */}
          <section className="mt-16">
            <h2 className="mb-6 font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
              Explore Other Spreads
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tarotSpreads
                .filter((s) => s.slug !== spread.slug)
                .slice(0, 3)
                .map((s) => (
                  <Link
                    key={s.slug}
                    href={`/tarot/spreads/${s.slug}`}
                    className="rounded-lg border border-[#b8bcd0]/10 bg-[#0d0f1a] p-5 transition-colors hover:border-[#c9a84c]/30"
                  >
                    <h3 className="font-semibold text-[#f5f0e8]">{s.name}</h3>
                    <p className="mt-1 text-sm text-[#b8bcd0]/60">
                      {s.cardCount} cards &middot; {s.difficulty}
                    </p>
                  </Link>
                ))}
            </div>
          </section>
        </div>

        <CtaBanner variant="client" />
      </main>
      <MarketingFooter />
    </>
  )
}
