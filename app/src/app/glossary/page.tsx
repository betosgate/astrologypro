import type { Metadata } from 'next'
import glossary from '@/data/glossary'
import { MarketingHeader } from '@/components/marketing/header'
import { MarketingFooter } from '@/components/marketing/footer'
import { GlossaryClient } from './glossary-client'

export const metadata: Metadata = {
  title: 'Astrology & Tarot Glossary: 150+ Terms Defined | AstrologyPro',
  description:
    'A comprehensive glossary of 150+ astrology and tarot terms with clear, informative definitions. From Ascendant to Zodiac, learn the language of the stars.',
}

export default function GlossaryPage() {
  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen bg-[#040610]">
        {/* Hero */}
        <section className="border-b border-[#b8bcd0]/10 bg-gradient-to-b from-[#0d0f1a] to-[#040610] px-6 py-20 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-[#f5f0e8] md:text-5xl">
              Astrology &amp; Tarot Glossary
            </h1>
            <p className="mt-4 text-lg text-[#b8bcd0]/80">
              Over 150 terms defined clearly and concisely. Whether you are a
              beginner or a seasoned practitioner, this is your reference guide
              to the language of the stars and cards.
            </p>
          </div>
        </section>

        <GlossaryClient terms={glossary} />
      </main>
      <MarketingFooter />
    </>
  )
}
