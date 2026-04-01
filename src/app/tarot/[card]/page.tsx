import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MarketingHeader } from '@/components/marketing/header'
import { MarketingFooter } from '@/components/marketing/footer'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { FaqSection } from '@/components/seo/faq-section'
import { CtaBanner } from '@/components/seo/cta-banner'
import { JsonLd } from '@/components/seo/json-ld'
import tarotCards from '@/data/tarot-cards'

export const dynamicParams = false

export function generateStaticParams() {
  return tarotCards.map((card) => ({ card: card.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ card: string }>
}): Promise<Metadata> {
  const { card: slug } = await params
  const card = tarotCards.find((c) => c.slug === slug)
  if (!card) return {}

  const title = `${card.name} Tarot Card Meaning: Upright & Reversed | AstrologyPro`
  const description = `Discover the ${card.name} tarot card meaning — upright, reversed, in love, career, and yes/no. Keywords: ${card.keywords.slice(0, 4).join(', ')}.`

  return {
    title,
    description,
    openGraph: { title, description },
  }
}

function getRelatedCards(card: (typeof tarotCards)[0]) {
  const related: { label: string; card: (typeof tarotCards)[0] }[] = []

  // Previous card in sequence
  if (card.arcana === 'major') {
    const prev = tarotCards.find(
      (c) => c.arcana === 'major' && c.number === card.number - 1
    )
    if (prev) related.push({ label: 'Previous', card: prev })
    const next = tarotCards.find(
      (c) => c.arcana === 'major' && c.number === card.number + 1
    )
    if (next) related.push({ label: 'Next', card: next })
  } else {
    const prev = tarotCards.find(
      (c) => c.suit === card.suit && c.number === card.number - 1
    )
    if (prev) related.push({ label: 'Previous', card: prev })
    const next = tarotCards.find(
      (c) => c.suit === card.suit && c.number === card.number + 1
    )
    if (next) related.push({ label: 'Next', card: next })
  }

  // Same suit (pick 2 random others)
  const sameSuit = tarotCards.filter(
    (c) =>
      c.suit === card.suit &&
      c.slug !== card.slug &&
      !related.some((r) => r.card.slug === c.slug)
  )
  if (sameSuit.length > 0) {
    const pick = sameSuit[Math.floor(sameSuit.length / 2)]
    if (pick) related.push({ label: 'Same Suit', card: pick })
  }

  return related
}

function YesNoIndicator({ value }: { value: 'Yes' | 'No' | 'Maybe' }) {
  const colors = {
    Yes: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    No: 'border-red-500/30 bg-red-500/10 text-red-400',
    Maybe: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold ${colors[value]}`}
    >
      {value === 'Yes' && (
        <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
      {value === 'No' && (
        <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {value === 'Maybe' && (
        <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01" />
        </svg>
      )}
      {value}
    </span>
  )
}

function SectionHeading({
  icon,
  children,
}: {
  icon: string
  children: React.ReactNode
}) {
  return (
    <h2 className="mb-4 flex items-center gap-3 font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
      <span className="text-2xl" role="img" aria-hidden="true">
        {icon}
      </span>
      {children}
    </h2>
  )
}

export default async function TarotCardPage({
  params,
}: {
  params: Promise<{ card: string }>
}) {
  const { card: slug } = await params
  const card = tarotCards.find((c) => c.slug === slug)

  if (!card) notFound()

  const related = getRelatedCards(card)

  const arcanaLabel =
    card.arcana === 'major' ? 'Major Arcana' : `${card.suit} (Minor Arcana)`

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${card.name} Tarot Card Meaning`,
    description: `Complete guide to the ${card.name} tarot card — upright, reversed, love, career, and yes/no meanings.`,
    url: `https://astrologypro.com/tarot/${card.slug}`,
    author: {
      '@type': 'Organization',
      name: 'AstrologyPro',
    },
  }

  return (
    <div className="min-h-screen bg-[#040610]">
      <MarketingHeader />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <JsonLd data={jsonLdData} />

        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Tarot Guide', href: '/tarot' },
            {
              label: card.arcana === 'major' ? 'Major Arcana' : `${card.suit}`,
              href: `/tarot#${card.arcana === 'major' ? 'major-arcana' : card.suit?.toLowerCase()}`,
            },
            { label: card.name },
          ]}
        />

        {/* Hero */}
        <section className="relative mb-12 mt-6">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-[300px] w-[500px] -translate-x-1/2 rounded-full bg-[#c9a84c]/5 blur-[100px]" />
          </div>

          <div className="relative">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-[#b8bcd0]/60">
              <span className="rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/5 px-3 py-0.5 text-[#c9a84c]">
                {arcanaLabel}
              </span>
              <span className="rounded-full border border-[#b8bcd0]/10 bg-[#b8bcd0]/5 px-3 py-0.5">
                {card.element}
              </span>
              {card.zodiacSign && (
                <Link
                  href={`/zodiac/${card.zodiacSlug}`}
                  className="rounded-full border border-[#b8bcd0]/10 bg-[#b8bcd0]/5 px-3 py-0.5 transition-colors hover:border-[#c9a84c]/30 hover:text-[#f8d275]"
                >
                  {card.zodiacSign}
                </Link>
              )}
              {card.planet && (
                <span className="rounded-full border border-[#b8bcd0]/10 bg-[#b8bcd0]/5 px-3 py-0.5">
                  {card.planet}
                </span>
              )}
            </div>

            <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-[#f5f0e8] sm:text-5xl">
              {card.name}
            </h1>

            {card.arcana === 'major' && (
              <p className="mt-1 text-lg text-[#b8bcd0]/50">
                Card {card.number} of the Major Arcana
              </p>
            )}
            {card.arcana === 'minor' && (
              <p className="mt-1 text-lg text-[#b8bcd0]/50">
                {card.suit} &middot; Card {card.number} of 14
              </p>
            )}

            {/* Keywords */}
            <div className="mt-4 flex flex-wrap gap-2">
              {card.keywords.map((kw) => (
                <span
                  key={kw}
                  className="rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/5 px-3 py-1 text-sm text-[#f8d275]"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Card at a Glance */}
        <section className="mb-12 rounded-lg border border-[#b8bcd0]/10 bg-[#0d0f1a] p-6">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold text-[#f5f0e8]">
            Card at a Glance
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#b8bcd0]/40">
                Arcana
              </span>
              <p className="mt-0.5 text-sm font-medium text-[#f5f0e8]">
                {card.arcana === 'major' ? 'Major' : 'Minor'}
              </p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-[#b8bcd0]/40">
                Number
              </span>
              <p className="mt-0.5 text-sm font-medium text-[#f5f0e8]">
                {card.number}
              </p>
            </div>
            {card.suit && (
              <div>
                <span className="text-xs uppercase tracking-wider text-[#b8bcd0]/40">
                  Suit
                </span>
                <p className="mt-0.5 text-sm font-medium text-[#f5f0e8]">
                  {card.suit}
                </p>
              </div>
            )}
            <div>
              <span className="text-xs uppercase tracking-wider text-[#b8bcd0]/40">
                Element
              </span>
              <p className="mt-0.5 text-sm font-medium text-[#f5f0e8]">
                {card.element}
              </p>
            </div>
            {card.zodiacSign && (
              <div>
                <span className="text-xs uppercase tracking-wider text-[#b8bcd0]/40">
                  Zodiac
                </span>
                <p className="mt-0.5 text-sm font-medium text-[#f5f0e8]">
                  <Link
                    href={`/zodiac/${card.zodiacSlug}`}
                    className="text-[#f8d275] transition-colors hover:text-[#c9a84c]"
                  >
                    {card.zodiacSign}
                  </Link>
                </p>
              </div>
            )}
            {card.planet && (
              <div>
                <span className="text-xs uppercase tracking-wider text-[#b8bcd0]/40">
                  Planet
                </span>
                <p className="mt-0.5 text-sm font-medium text-[#f5f0e8]">
                  {card.planet}
                </p>
              </div>
            )}
            <div>
              <span className="text-xs uppercase tracking-wider text-[#b8bcd0]/40">
                Yes or No
              </span>
              <div className="mt-0.5">
                <YesNoIndicator value={card.yesOrNo} />
              </div>
            </div>
          </div>
        </section>

        {/* Upright Meaning */}
        <section className="mb-12">
          <SectionHeading icon="&#9650;">
            {card.name} Upright Meaning
          </SectionHeading>
          <div className="prose-cosmic">
            {card.uprightMeaning.split('\n\n').map((p, i) => (
              <p
                key={i}
                className="mb-4 leading-relaxed text-[#b8bcd0]/80"
              >
                {p}
              </p>
            ))}
          </div>
        </section>

        {/* Reversed Meaning */}
        <section className="mb-12">
          <SectionHeading icon="&#9660;">
            {card.name} Reversed Meaning
          </SectionHeading>
          <div className="mb-4 flex flex-wrap gap-2">
            {card.reversedKeywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full border border-red-500/20 bg-red-500/5 px-3 py-1 text-sm text-red-300/80"
              >
                {kw}
              </span>
            ))}
          </div>
          <div className="prose-cosmic">
            {card.reversedMeaning.split('\n\n').map((p, i) => (
              <p
                key={i}
                className="mb-4 leading-relaxed text-[#b8bcd0]/80"
              >
                {p}
              </p>
            ))}
          </div>
        </section>

        {/* In Love */}
        <section className="mb-12">
          <SectionHeading icon="&#10084;">
            {card.name} in Love
          </SectionHeading>
          <div className="prose-cosmic">
            {card.loveMeaning.split('\n\n').map((p, i) => (
              <p
                key={i}
                className="mb-4 leading-relaxed text-[#b8bcd0]/80"
              >
                {p}
              </p>
            ))}
          </div>
        </section>

        {/* In Career */}
        <section className="mb-12">
          <SectionHeading icon="&#9733;">
            {card.name} in Career
          </SectionHeading>
          <div className="prose-cosmic">
            {card.careerMeaning.split('\n\n').map((p, i) => (
              <p
                key={i}
                className="mb-4 leading-relaxed text-[#b8bcd0]/80"
              >
                {p}
              </p>
            ))}
          </div>
        </section>

        {/* Yes or No */}
        <section className="mb-12">
          <SectionHeading icon="&#10067;">
            {card.name}: Yes or No?
          </SectionHeading>
          <div className="flex items-center gap-4 rounded-lg border border-[#b8bcd0]/10 bg-[#0d0f1a] p-6">
            <YesNoIndicator value={card.yesOrNo} />
            <p className="text-sm text-[#b8bcd0]/70">
              {card.yesOrNo === 'Yes' &&
                `${card.name} is a ${card.yesOrNo} card. It carries positive, affirmative energy that supports moving forward with your question.`}
              {card.yesOrNo === 'No' &&
                `${card.name} leans toward No. This card suggests caution, reconsideration, or that the timing is not right for what you are asking about.`}
              {card.yesOrNo === 'Maybe' &&
                `${card.name} is a Maybe card. The answer depends on additional factors and surrounding cards. More reflection or information is needed before a clear answer emerges.`}
            </p>
          </div>
        </section>

        {/* Advice */}
        <section className="mb-12">
          <SectionHeading icon="&#128161;">Advice</SectionHeading>
          <blockquote className="rounded-lg border-l-4 border-[#c9a84c]/40 bg-[#c9a84c]/5 px-6 py-4">
            <p className="leading-relaxed text-[#f5f0e8]/90 italic">
              {card.advice}
            </p>
          </blockquote>
        </section>

        {/* FAQ */}
        {card.faqs.length > 0 && (
          <section className="mb-12">
            <FaqSection
              faqs={card.faqs}
              title={`${card.name} FAQs`}
            />
          </section>
        )}

        {/* Related Cards */}
        {related.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
              Related Cards
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {related.map(({ label, card: rel }) => (
                <Link
                  key={rel.slug}
                  href={`/tarot/${rel.slug}`}
                  className="group flex items-center gap-4 rounded-lg border border-[#b8bcd0]/10 bg-[#b8bcd0]/5 p-4 transition-all hover:border-[#c9a84c]/30 hover:bg-[#c9a84c]/5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c9a84c]/10 text-sm font-semibold text-[#c9a84c]">
                    {rel.arcana === 'major'
                      ? rel.number
                      : rel.number <= 10
                        ? rel.number
                        : rel.name.split(' ')[0][0]}
                  </div>
                  <div>
                    <span className="text-xs text-[#b8bcd0]/40">{label}</span>
                    <p className="text-sm font-medium text-[#f5f0e8] transition-colors group-hover:text-[#f8d275]">
                      {rel.name}
                    </p>
                  </div>
                </Link>
              ))}

              {/* Link to zodiac sign if applicable */}
              {card.zodiacSign && (
                <Link
                  href={`/zodiac/${card.zodiacSlug}`}
                  className="group flex items-center gap-4 rounded-lg border border-[#b8bcd0]/10 bg-[#b8bcd0]/5 p-4 transition-all hover:border-[#c9a84c]/30 hover:bg-[#c9a84c]/5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c9a84c]/10 text-sm text-[#c9a84c]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs text-[#b8bcd0]/40">
                      Associated Sign
                    </span>
                    <p className="text-sm font-medium text-[#f5f0e8] transition-colors group-hover:text-[#f8d275]">
                      {card.zodiacSign} Guide
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </section>
        )}

        <CtaBanner variant="client" />
      </main>

      <MarketingFooter />
    </div>
  )
}
