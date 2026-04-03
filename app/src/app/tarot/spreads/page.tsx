import type { Metadata } from 'next'
import Link from 'next/link'
import tarotSpreads from '@/data/tarot-spreads'
import { MarketingHeader } from '@/components/marketing/header'
import { MarketingFooter } from '@/components/marketing/footer'

export const metadata: Metadata = {
  title: 'Tarot Spreads: 8 Layouts for Every Question | AstrologyPro',
  description:
    'Explore 8 tarot spreads from beginner to advanced — Celtic Cross, Three Card, Relationship, Career Path, and more. Step-by-step guides for every reading.',
}

const difficultyOrder = ['Beginner', 'Intermediate', 'Advanced'] as const
const difficultyColor = {
  Beginner: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Intermediate: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Advanced: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
}

export default function SpreadsHubPage() {
  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen bg-[#040610]">
        {/* Hero */}
        <section className="border-b border-[#b8bcd0]/10 bg-gradient-to-b from-[#0d0f1a] to-[#040610] px-6 py-20 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-[#f5f0e8] md:text-5xl">
              Tarot Spreads
            </h1>
            <p className="mt-4 text-lg text-[#b8bcd0]/80">
              From your first daily pull to the legendary Celtic Cross — find the
              perfect layout for every question, situation, and skill level.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-6 py-16">
          {difficultyOrder.map((level) => {
            const spreads = tarotSpreads.filter((s) => s.difficulty === level)
            if (spreads.length === 0) return null
            return (
              <section key={level} className="mb-16">
                <h2 className="mb-6 font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                  {level} Spreads
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {spreads.map((spread) => (
                    <Link
                      key={spread.slug}
                      href={`/tarot/spreads/${spread.slug}`}
                      className="group rounded-xl border border-[#b8bcd0]/10 bg-[#0d0f1a] p-6 transition-all hover:border-[#c9a84c]/30 hover:shadow-lg hover:shadow-[#c9a84c]/5"
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-2.5 py-0.5 text-xs font-medium text-[#f8d275]">
                          {spread.cardCount}{' '}
                          {spread.cardCount === 1 ? 'Card' : 'Cards'}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${difficultyColor[spread.difficulty]}`}
                        >
                          {spread.difficulty}
                        </span>
                      </div>
                      <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#f5f0e8] transition-colors group-hover:text-[#f8d275]">
                        {spread.name}
                      </h3>
                      <p className="mt-2 text-sm text-[#b8bcd0]/70 leading-relaxed">
                        {spread.purpose}
                      </p>
                      <span className="mt-4 inline-block text-sm font-medium text-[#c9a84c]">
                        View Guide &rarr;
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </main>
      <MarketingFooter />
    </>
  )
}
