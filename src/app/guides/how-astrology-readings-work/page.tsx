import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { FaqSection } from '@/components/seo/faq-section'
import { CtaBanner } from '@/components/seo/cta-banner'
import { JsonLd } from '@/components/seo/json-ld'
import { MarketingHeader } from '@/components/marketing/header'
import { MarketingFooter } from '@/components/marketing/footer'

export const metadata: Metadata = {
  title: 'How Professional Astrology Readings Work: What to Expect | AstrologyPro',
  description:
    'Your complete guide to professional astrology readings. Learn about types of readings, how to prepare, what happens during a session, and how to get the most from your experience.',
}

const faqs = [
  {
    question: 'Do I need to know my exact birth time?',
    answer:
      'An exact birth time is ideal because it determines your Rising sign and house placements, which are essential for a thorough reading. If you do not know your time, check your birth certificate, hospital records, or ask family members. If no time is available, an astrologer can still provide valuable insight using a "solar chart" based on your date and place of birth, though some details will be less precise.',
  },
  {
    question: 'How is astrology different from psychic reading?',
    answer:
      'Astrology is a structured system based on astronomical calculations and symbolic interpretation of planetary positions. While some astrologers also use intuition, the foundation is a birth chart — a mathematically precise map of the sky at your birth. Psychic reading relies primarily on intuitive or extrasensory perception. Many practitioners blend both approaches.',
  },
  {
    question: 'Can astrology predict the future?',
    answer:
      'Astrology identifies cycles, themes, and energetic patterns — not specific events. A transit reading can tell you that the next six months emphasize career transformation, but it cannot predict you will get a promotion on March 15. Think of astrology as a weather forecast: it shows you the climate so you can dress appropriately and plan wisely, but it does not control the weather.',
  },
  {
    question: 'How often should I get a reading?',
    answer:
      'Most people benefit from a comprehensive natal chart reading once (it remains relevant your entire life) and transit or update readings quarterly or at major life junctures. Specific transits — Saturn Returns, eclipses affecting your chart, Jupiter returns — are excellent times to book. Avoid getting readings too frequently for the same question, as this can create dependency rather than clarity.',
  },
]

export default function HowAstrologyReadingsWorkPage() {
  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen bg-[#040610]">
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'How Professional Astrology Readings Work: What to Expect',
            description: metadata.description as string,
            publisher: { '@type': 'Organization', name: 'AstrologyPro' },
          }}
        />

        <section className="border-b border-[#b8bcd0]/10 bg-gradient-to-b from-[#0d0f1a] to-[#040610] px-6 pb-12 pt-8">
          <div className="mx-auto max-w-4xl">
            <Breadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'Guides', href: '/guides' },
                { label: 'How Astrology Readings Work' },
              ]}
            />
            <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-bold text-[#f5f0e8] md:text-5xl">
              How Professional Astrology Readings Work
            </h1>
            <p className="mt-4 text-xl text-[#b8bcd0]/80">
              Everything you need to know before your first session — from
              choosing a reading type to making the most of your experience.
            </p>
          </div>
        </section>

        <article className="mx-auto max-w-4xl px-6 py-16">
          <div className="space-y-12">
            <section>
              <div className="space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  A professional astrology reading is a personalized consultation where a trained astrologer interprets the positions of celestial bodies in your birth chart — or their current movements — to provide insight, guidance, and clarity about your life. Unlike Sun sign horoscopes, a professional reading is based on your exact birth data and addresses your specific questions and circumstances.
                </p>
                <p>
                  Whether you are curious about your life purpose, navigating a difficult transition, exploring relationship compatibility, or simply want to understand yourself more deeply, astrology offers a structured framework for self-discovery. Here is what to expect from the process.
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                Types of Astrology Readings
              </h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div className="rounded-lg border border-[#b8bcd0]/10 bg-[#0d0f1a] p-6">
                  <h3 className="text-lg font-semibold text-[#f8d275]">Natal Chart Reading</h3>
                  <p className="mt-2 text-[#b8bcd0] leading-relaxed">
                    The foundational reading. Your astrologer interprets your complete birth chart — Sun, Moon, Rising sign, planetary placements, houses, and aspects — to reveal your core personality, strengths, challenges, and life themes. This reading is relevant for your entire lifetime and serves as the reference point for all future readings.
                  </p>
                </div>
                <div className="rounded-lg border border-[#b8bcd0]/10 bg-[#0d0f1a] p-6">
                  <h3 className="text-lg font-semibold text-[#f8d275]">Transit Reading</h3>
                  <p className="mt-2 text-[#b8bcd0] leading-relaxed">
                    A forecast-style reading that examines where the planets are now and how they interact with your birth chart. Transit readings are ideal when you are going through a specific life event, facing a decision, or want to understand the energies of the coming months. They answer "what is happening now and what is coming next."
                  </p>
                </div>
                <div className="rounded-lg border border-[#b8bcd0]/10 bg-[#0d0f1a] p-6">
                  <h3 className="text-lg font-semibold text-[#f8d275]">Synastry Reading</h3>
                  <p className="mt-2 text-[#b8bcd0] leading-relaxed">
                    A relationship compatibility reading that overlays two birth charts to reveal the dynamics between two people. Synastry shows areas of natural harmony, potential friction, communication styles, and emotional needs. It is valuable for romantic partners, business partners, family relationships, and friendships.
                  </p>
                </div>
                <div className="rounded-lg border border-[#b8bcd0]/10 bg-[#0d0f1a] p-6">
                  <h3 className="text-lg font-semibold text-[#f8d275]">Solar Return Reading</h3>
                  <p className="mt-2 text-[#b8bcd0] leading-relaxed">
                    Cast for the exact moment the Sun returns to its natal position each year (your "cosmic birthday"), this reading forecasts themes and opportunities for the year ahead. Solar Return readings are the perfect birthday gift and an ideal annual check-in for understanding the energies of the coming year.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                How to Prepare for Your Reading
              </h2>
              <div className="mt-4 space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  The single most important preparation is gathering your birth data: your exact date of birth, the time of birth (as precise as possible), and the city or town where you were born. Without accurate birth time, your astrologer cannot determine your Rising sign or house placements, which limits the depth of the reading.
                </p>
                <p>
                  Beyond birth data, come with questions. While a natal chart reading covers many topics, having two or three specific areas of focus — career direction, relationship patterns, timing for a major decision — helps your astrologer prioritize the most relevant information. Write your questions down before the session so you do not forget them in the moment.
                </p>
                <p>
                  Approach the reading with openness. Astrology may confirm things you already sense about yourself, and it may reveal perspectives you had not considered. The most valuable readings often include insights that surprise you — areas you had not thought to explore or connections you had not made. Let the reading expand your understanding rather than just validating what you already believe.
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                What Happens During a Session
              </h2>
              <div className="mt-4 space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  A typical reading lasts 60 to 90 minutes. Your astrologer will have prepared your chart in advance and may begin with an overview of your key placements — Sun, Moon, Rising sign, and any particularly striking patterns. From there, the session usually follows the flow of your questions, with the astrologer guiding you through relevant chart areas.
                </p>
                <p>
                  The best readings are conversations, not lectures. Your astrologer presents what the chart shows, and you provide context from your lived experience. This dialogue is essential — the same planetary configuration can manifest differently depending on your circumstances, and your feedback helps the astrologer interpret with precision and relevance.
                </p>
                <p>
                  Most modern readings are conducted via video call, which is just as effective as in-person sessions. Many astrologers share their screen so you can see your chart as they discuss it. Some offer recordings of the session so you can revisit the information later — a valuable option since sessions often contain more detail than you can absorb in one sitting.
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                After Your Reading
              </h2>
              <div className="mt-4 space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  Give yourself time to process. A thorough astrology reading delivers a significant amount of information, and its full impact often unfolds over days and weeks as you recognize the patterns in your daily life. If your astrologer provided a recording or written summary, revisit it a few days later — you will hear things you missed the first time.
                </p>
                <p>
                  Take action on the practical guidance. If the reading identified a favorable period for a career move, prepare for it. If it highlighted a pattern in relationships, bring that awareness into your interactions. Astrology is most powerful when it informs action, not when it remains abstract knowledge. The chart shows the terrain; you still need to walk the path.
                </p>
              </div>
            </section>

            <FaqSection faqs={faqs} />
          </div>
        </article>

        <CtaBanner variant="client" />
      </main>
      <MarketingFooter />
    </>
  )
}
