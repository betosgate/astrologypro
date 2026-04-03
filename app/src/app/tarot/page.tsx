import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingHeader } from '@/components/marketing/header'
import { MarketingFooter } from '@/components/marketing/footer'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { CtaBanner } from '@/components/seo/cta-banner'
import { JsonLd } from '@/components/seo/json-ld'
import tarotCards from '@/data/tarot-cards'

export const metadata: Metadata = {
  title: 'The Complete Tarot Card Guide: All 78 Card Meanings | AstrologyPro',
  description:
    'Explore the full tarot deck with in-depth meanings for all 78 cards — 22 Major Arcana and 56 Minor Arcana. Upright, reversed, love, career, and yes/no interpretations.',
  openGraph: {
    title: 'The Complete Tarot Card Guide | AstrologyPro',
    description:
      'Discover the meaning of every tarot card. Rich symbolism, upright & reversed readings, love and career guidance for all 78 cards.',
  },
}

const majorCards = tarotCards.filter((c) => c.arcana === 'major')
const wandsCards = tarotCards.filter((c) => c.suit === 'Wands')
const cupsCards = tarotCards.filter((c) => c.suit === 'Cups')
const swordsCards = tarotCards.filter((c) => c.suit === 'Swords')
const pentaclesCards = tarotCards.filter((c) => c.suit === 'Pentacles')

function CardGrid({
  cards,
}: {
  cards: typeof tarotCards
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
      {cards.map((card) => (
        <Link
          key={card.slug}
          href={`/tarot/${card.slug}`}
          className="group relative flex flex-col items-center rounded-lg border border-[#b8bcd0]/10 bg-[#b8bcd0]/5 p-4 text-center transition-all hover:border-[#c9a84c]/30 hover:bg-[#c9a84c]/5"
        >
          {/* Card number badge */}
          <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#c9a84c]/10 text-xs font-semibold text-[#c9a84c]">
            {card.arcana === 'major'
              ? card.number
              : card.number <= 10
                ? card.number
                : ['', '', '', '', '', '', '', '', '', '', '', 'Pg', 'Kn', 'Qn', 'Ki'][card.number]}
          </span>
          <span className="text-sm font-medium leading-tight text-[#f5f0e8] transition-colors group-hover:text-[#f8d275]">
            {card.name}
          </span>
          <span className="mt-1 text-[11px] text-[#b8bcd0]/50">
            {card.element}
            {card.zodiacSign ? ` · ${card.zodiacSign}` : ''}
          </span>
        </Link>
      ))}
    </div>
  )
}

function SuitHeader({
  title,
  element,
  description,
}: {
  title: string
  element: string
  description: string
}) {
  const elementColors: Record<string, string> = {
    Fire: 'text-orange-400',
    Water: 'text-blue-400',
    Air: 'text-sky-300',
    Earth: 'text-emerald-400',
  }

  return (
    <div className="mb-6">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8] sm:text-3xl">
        {title}{' '}
        <span className={elementColors[element] || 'text-[#c9a84c]'}>
          ({element})
        </span>
      </h2>
      <p className="mt-2 max-w-2xl text-[#b8bcd0]/70">{description}</p>
    </div>
  )
}

export default function TarotHubPage() {
  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'The Complete Tarot Card Guide',
    description:
      'Comprehensive meanings for all 78 tarot cards including Major Arcana, Wands, Cups, Swords, and Pentacles.',
    url: 'https://astrologypro.com/tarot',
    numberOfItems: 78,
    hasPart: tarotCards.map((card) => ({
      '@type': 'Article',
      name: card.name + ' Tarot Card Meaning',
      url: 'https://astrologypro.com/tarot/' + card.slug,
    })),
  }

  return (
    <div className="min-h-screen bg-[#040610]">
      <MarketingHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <JsonLd data={jsonLdData} />

        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Tarot Guide' },
          ]}
        />

        {/* Hero */}
        <section className="relative mb-16 mt-8 text-center">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c9a84c]/5 blur-[120px]" />
          </div>
          <div className="relative">
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-[#f5f0e8] sm:text-5xl lg:text-6xl">
              The Complete{' '}
              <span className="bg-gradient-to-r from-[#f8d275] to-[#cd912f] bg-clip-text text-transparent">
                Tarot Card Guide
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[#b8bcd0]/80">
              Explore the full tarot deck with rich, authentic meanings for all 78
              cards. From the archetypal journey of the Major Arcana to the
              elemental wisdom of the Minor Arcana, discover the symbolism,
              guidance, and insight each card holds for your life.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <span className="rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/5 px-4 py-1.5 text-sm text-[#f8d275]">
                22 Major Arcana
              </span>
              <span className="rounded-full border border-orange-500/20 bg-orange-500/5 px-4 py-1.5 text-sm text-orange-300">
                14 Wands
              </span>
              <span className="rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-sm text-blue-300">
                14 Cups
              </span>
              <span className="rounded-full border border-sky-400/20 bg-sky-400/5 px-4 py-1.5 text-sm text-sky-300">
                14 Swords
              </span>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-sm text-emerald-300">
                14 Pentacles
              </span>
            </div>
          </div>
        </section>

        {/* Major Arcana */}
        <section className="mb-16" id="major-arcana">
          <SuitHeader
            title="Major Arcana"
            element="Spirit"
            description="The 22 cards of the Major Arcana represent life's karmic and spiritual lessons — the archetypal journey from innocence to wholeness."
          />
          <CardGrid cards={majorCards} />
        </section>

        {/* Wands */}
        <section className="mb-16" id="wands">
          <SuitHeader
            title="Suit of Wands"
            element="Fire"
            description="The Wands govern passion, creativity, ambition, and spiritual energy. They represent the spark that ignites action and the drive to pursue your vision."
          />
          <CardGrid cards={wandsCards} />
        </section>

        {/* Cups */}
        <section className="mb-16" id="cups">
          <SuitHeader
            title="Suit of Cups"
            element="Water"
            description="The Cups govern emotions, relationships, intuition, and the heart. They illuminate the inner world of feelings, love, and creative inspiration."
          />
          <CardGrid cards={cupsCards} />
        </section>

        {/* Swords */}
        <section className="mb-16" id="swords">
          <SuitHeader
            title="Suit of Swords"
            element="Air"
            description="The Swords govern intellect, communication, conflict, and truth. They cut through illusion to reveal clarity, challenge, and mental power."
          />
          <CardGrid cards={swordsCards} />
        </section>

        {/* Pentacles */}
        <section className="mb-16" id="pentacles">
          <SuitHeader
            title="Suit of Pentacles"
            element="Earth"
            description="The Pentacles govern material wealth, work, health, and practical matters. They ground spiritual energy into tangible, worldly manifestation."
          />
          <CardGrid cards={pentaclesCards} />
        </section>

        <CtaBanner variant="client" />
      </main>

      <MarketingFooter />
    </div>
  )
}
