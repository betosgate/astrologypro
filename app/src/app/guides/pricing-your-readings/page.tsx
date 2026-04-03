import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { FaqSection } from '@/components/seo/faq-section'
import { CtaBanner } from '@/components/seo/cta-banner'
import { JsonLd } from '@/components/seo/json-ld'
import { MarketingHeader } from '@/components/marketing/header'
import { MarketingFooter } from '@/components/marketing/footer'

export const metadata: Metadata = {
  title: 'How to Price Your Astrology & Tarot Readings | AstrologyPro',
  description:
    'Learn how to price your professional readings for profit and sustainability. Covers market rates, value-based pricing, package strategies, and subscription models.',
}

const faqs = [
  {
    question: 'What is the average rate for a professional reading in 2026?',
    answer:
      'Rates vary by modality, experience, and niche. For astrology, 60-minute natal chart readings typically range from $150-$350. For tarot, 30-minute sessions run $50-$150 and 60-minute sessions $100-$300. Specialized readings (synastry, electional, year-ahead) command premium prices of $200-$500+. Location, reputation, and demand all influence where you fall within these ranges.',
  },
  {
    question: 'Should I offer free readings to build my practice?',
    answer:
      'Occasional free readings for testimonials during your launch phase can be valuable, but avoid making it a habit. Free readings attract price-sensitive clients who are unlikely to pay later. Instead, offer discounted "founding client" rates for a limited time — this attracts people who value your work and are willing to invest, just at a lower initial price point.',
  },
  {
    question: 'How often should I raise my prices?',
    answer:
      'Raise your prices when you are consistently booked 2+ weeks in advance, when your skills have significantly improved (new certifications, techniques, or specialties), or at least annually to account for inflation. Give existing clients advance notice and consider grandfathering loyal regulars at their current rate for a transition period.',
  },
  {
    question: 'Do subscriptions really work for readings?',
    answer:
      'Yes, and they are increasingly popular. Clients who value ongoing guidance prefer the simplicity and savings of a monthly subscription over booking individual sessions. For practitioners, subscriptions provide predictable revenue and deeper client relationships. Start with a small cohort of your most engaged clients and expand based on capacity.',
  },
]

export default function PricingYourReadingsPage() {
  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen bg-[#040610]">
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'How to Price Your Astrology & Tarot Readings',
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
                { label: 'Pricing Your Readings' },
              ]}
            />
            <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-bold text-[#f5f0e8] md:text-5xl">
              How to Price Your Astrology &amp; Tarot Readings
            </h1>
            <p className="mt-4 text-xl text-[#b8bcd0]/80">
              Pricing strategies that honor your expertise, attract the right
              clients, and build a sustainable practice.
            </p>
          </div>
        </section>

        <article className="mx-auto max-w-4xl px-6 py-16">
          <div className="space-y-12">
            <section>
              <div className="space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  Pricing is one of the most emotionally charged decisions for professional readers. Too low and you burn out serving clients who do not value your time. Too high and you price yourself out of a market that has not yet learned your worth. The sweet spot requires understanding market rates, your own value proposition, and the pricing psychology that applies specifically to spiritual services.
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                Understanding Market Rates
              </h2>
              <div className="mt-4 space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  Before setting your prices, research what other practitioners in your niche and experience level charge. Not to copy them, but to understand the landscape. Clients have price expectations shaped by the market, and your rates need to feel reasonable within that context — even if you intend to position yourself at the premium end.
                </p>
                <p>
                  In 2026, the market broadly segments into three tiers. Accessible readers ($50-$100/session) serve high volume and often work through marketplaces. Mid-tier professionals ($100-$250/session) have established practices with strong reputations and niche expertise. Premium practitioners ($250-$500+/session) are recognized authorities with waitlists, published work, or celebrity clientele. Know which tier matches your current stage and plan your path to the next one.
                </p>
                <p>
                  Factor in your total time investment, not just the session itself. A 60-minute reading may require 30-45 minutes of preparation (chart calculation, spread planning, research) and 15-30 minutes of follow-up (session summary, notes, energy clearing). A "$150 per hour" session that actually takes two hours of your time is really $75/hour. Price accordingly.
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                Value-Based Pricing
              </h2>
              <div className="mt-4 space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  Value-based pricing shifts the conversation from "how much does your time cost?" to "what is the outcome worth to the client?" A synastry reading that helps a couple decide whether to commit is not a 90-minute service — it is clarity on a life-defining decision. A career reading that gives someone the confidence to change jobs is not an hour of card-flipping — it is a catalyst for transformation.
                </p>
                <p>
                  Frame your services in terms of outcomes and transformations rather than minutes and card counts. Instead of "60-Minute Natal Chart Reading — $200," try "Birth Chart Blueprint: Discover Your Core Strengths, Life Purpose, and Key Challenges — $200." The second framing communicates value and attracts clients who are investing in insight, not buying time.
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                Package Strategies
              </h2>
              <div className="mt-4 space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  Packages are the single most effective pricing strategy for professional readers. They increase average transaction value, create client commitment, and provide a framework for ongoing relationships. A well-designed package feels like a journey rather than a transaction.
                </p>
                <p>
                  Consider a three-tier structure. Your base offering is a single session at your standard rate. Your mid-tier package bundles three sessions (initial reading plus two follow-ups) at a modest discount — typically 10-15% off the individual rate. Your premium package includes extended sessions, written reports, email support between sessions, and priority booking at a 20-25% discount from the individual rate.
                </p>
                <p>
                  Seasonal packages tied to astrological events work exceptionally well. An "Eclipse Season Package" with readings at both eclipses plus a mid-point check-in, or a "Year Ahead Package" with a comprehensive annual reading plus quarterly transit updates, gives clients a compelling reason to commit to multiple sessions at once.
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                Subscription Models
              </h2>
              <div className="mt-4 space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  Monthly subscriptions represent the frontier of pricing for professional readers. Instead of one-off sessions, clients pay a recurring monthly fee for ongoing access to your guidance. This model provides predictable income for you and convenient, consistent support for them.
                </p>
                <p>
                  A typical subscription might include one live reading per month (30 or 60 minutes), a monthly transit forecast or written report, and email or voice memo support for quick questions between sessions. Price subscriptions at 80-90% of what the individual components would cost separately — the slight discount is offset by the guaranteed recurring revenue and reduced client acquisition costs.
                </p>
                <p>
                  Start small with five to ten subscription slots to test the model and ensure you can deliver consistently. As systems mature and your capacity grows, expand the program. Many successful readers eventually generate 50-70% of their income from subscriptions, creating the kind of financial stability that is rare in solo practice.
                </p>
              </div>
            </section>

            <FaqSection faqs={faqs} />
          </div>
        </article>

        <CtaBanner variant="practitioner" />
      </main>
      <MarketingFooter />
    </>
  )
}
