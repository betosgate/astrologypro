import { Metadata } from 'next'
import Link from 'next/link'
import houses from '@/data/houses'
import planets from '@/data/planets'
import aspects from '@/data/aspects'
import { MarketingHeader } from '@/components/marketing/header'
import { MarketingFooter } from '@/components/marketing/footer'
import { CtaBanner } from '@/components/seo/cta-banner'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'

export const metadata: Metadata = {
  title: 'Learn Astrology — Houses, Planets & Aspects',
  description:
    'Comprehensive astrology education: explore all 12 houses, 12 celestial bodies, and 5 major aspects. Free in-depth guides with authentic astrological knowledge.',
  alternates: {
    canonical: 'https://astrologypro.com/learn',
  },
  openGraph: {
    title: 'Learn Astrology — Houses, Planets & Aspects',
    description:
      'Explore all 12 houses, 12 celestial bodies, and 5 major aspects in our free astrology education hub.',
  },
}

const natureBadgeColors: Record<string, string> = {
  Neutral: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
  Challenging: 'border-red-400/30 bg-red-400/10 text-red-300',
  Harmonious: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
}

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-[#040610]">
      <MarketingHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Learn Astrology' },
          ]}
        />

        {/* Hero */}
        <header className="mb-16 mt-6 text-center">
          <h1 className="mb-4 font-[family-name:var(--font-display)] text-4xl font-bold text-[#f5f0e8] sm:text-5xl lg:text-6xl">
            Learn Astrology
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-[#b8bcd0]/70">
            Explore the building blocks of the birth chart — from the twelve
            houses that map your life, to the planets that animate it, to the
            aspects that connect them all.
          </p>
        </header>

        {/* Houses Section */}
        <section id="houses" className="mb-16 scroll-mt-24">
          <div className="mb-8 text-center">
            <h2 className="mb-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8]">
              The 12 Houses
            </h2>
            <p className="text-[#b8bcd0]/60">
              The houses divide your birth chart into twelve life arenas, each
              governing a different domain of experience.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {houses.map((house) => (
              <Link
                key={house.slug}
                href={`/learn/houses/${house.slug}`}
                className="group rounded-xl border border-[#b8bcd0]/10 bg-[#b8bcd0]/5 p-5 transition-all hover:border-[#c9a84c]/40 hover:bg-[#c9a84c]/5"
              >
                <div className="mb-2 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 font-[family-name:var(--font-display)] text-lg font-bold text-[#c9a84c]">
                    {house.number}
                  </span>
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#f5f0e8] transition-colors group-hover:text-[#c9a84c]">
                      {house.name}
                    </h3>
                    <p className="text-sm text-[#b8bcd0]/60 italic">
                      {house.nickname}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[#b8bcd0]/50">
                  {house.rulingSign} · {house.rulingPlanet} · {house.element}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Planets Section */}
        <section id="planets" className="mb-16 scroll-mt-24">
          <div className="mb-8 text-center">
            <h2 className="mb-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8]">
              The Planets & Celestial Bodies
            </h2>
            <p className="text-[#b8bcd0]/60">
              Each planet represents a fundamental drive or function within the
              psyche, shaping how you experience the world.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {planets.map((planet) => (
              <Link
                key={planet.slug}
                href={`/learn/planets/${planet.slug}`}
                className="group rounded-xl border border-[#b8bcd0]/10 bg-[#b8bcd0]/5 p-5 transition-all hover:border-[#c9a84c]/40 hover:bg-[#c9a84c]/5"
              >
                <div className="mb-2 flex items-center gap-3">
                  <span className="text-3xl" aria-hidden="true">
                    {planet.symbol}
                  </span>
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#f5f0e8] transition-colors group-hover:text-[#c9a84c]">
                      {planet.name}
                    </h3>
                    <p className="text-sm text-[#b8bcd0]/60">
                      Rules {planet.ruledSigns.join(' & ')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {planet.keywords.slice(0, 3).map((kw) => (
                    <span
                      key={kw}
                      className="rounded-full border border-[#b8bcd0]/10 px-2 py-0.5 text-xs text-[#b8bcd0]/50"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Aspects Section */}
        <section id="aspects" className="mb-16 scroll-mt-24">
          <div className="mb-8 text-center">
            <h2 className="mb-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8]">
              The Major Aspects
            </h2>
            <p className="text-[#b8bcd0]/60">
              Aspects are the angular relationships between planets, revealing
              how different parts of your chart interact and influence each
              other.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {aspects.map((aspect) => (
              <Link
                key={aspect.slug}
                href={`/learn/aspects/${aspect.slug}`}
                className="group rounded-xl border border-[#b8bcd0]/10 bg-[#b8bcd0]/5 p-5 transition-all hover:border-[#c9a84c]/40 hover:bg-[#c9a84c]/5"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-3xl" aria-hidden="true">
                    {aspect.symbol}
                  </span>
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#f5f0e8] transition-colors group-hover:text-[#c9a84c]">
                      {aspect.name}
                    </h3>
                    <p className="text-sm text-[#b8bcd0]/60">{aspect.degrees}°</p>
                  </div>
                </div>
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${natureBadgeColors[aspect.nature] || ''}`}
                >
                  {aspect.nature}
                </span>
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
