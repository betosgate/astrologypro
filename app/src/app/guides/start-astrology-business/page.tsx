import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { FaqSection } from '@/components/seo/faq-section'
import { CtaBanner } from '@/components/seo/cta-banner'
import { JsonLd } from '@/components/seo/json-ld'
import { MarketingHeader } from '@/components/marketing/header'
import { MarketingFooter } from '@/components/marketing/footer'

export const metadata: Metadata = {
  title: 'How to Start Your Astrology Business Online in 2026 | AstrologyPro',
  description:
    'A step-by-step guide to launching your professional astrology practice online. Define your niche, set up tools, price your services, and get your first clients.',
}

const faqs = [
  {
    question: 'Do I need formal certification to start an astrology business?',
    answer:
      'There is no universally required license or certification for professional astrologers. However, completing a reputable program — such as those offered by the NCGR, Kepler College, or the Faculty of Astrological Studies — builds credibility and deepens your skills. Many successful astrologers are self-taught but invest in continuing education throughout their careers.',
  },
  {
    question: 'How much can I earn as a professional astrologer?',
    answer:
      'Income varies widely based on your niche, pricing, and client volume. New astrologers typically charge $75-$150 per session, while established practitioners charge $200-$500+. With consistent marketing and a strong online presence, many full-time astrologers earn $50,000-$150,000+ annually. Digital products like recorded workshops and written reports can supplement session income.',
  },
  {
    question: 'What tools and software do I need to get started?',
    answer:
      'At minimum, you need reliable astrology software (Solar Fire, Astro Gold, or free options like Astro.com), a video conferencing tool for remote sessions, a booking and payment system, and a professional website. Platforms like AstrologyPro bundle these essentials into a single solution designed specifically for divination professionals.',
  },
  {
    question: 'How long does it take to build a full client roster?',
    answer:
      'Most astrologers need 6-12 months of consistent effort to build a sustainable client base. The first three months focus on establishing your presence and getting initial clients through your personal network. Months 4-8 typically involve content marketing and referral building. By month 12, many practitioners have enough recurring clients and referrals to sustain a full-time practice.',
  },
]

export default function StartAstrologyBusinessPage() {
  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen bg-[#040610]">
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'How to Start Your Astrology Business Online in 2026',
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
                { label: 'Start an Astrology Business' },
              ]}
            />
            <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-bold text-[#f5f0e8] md:text-5xl">
              How to Start Your Astrology Business Online in 2026
            </h1>
            <p className="mt-4 text-xl text-[#b8bcd0]/80">
              Turn your astrological knowledge into a thriving practice with this
              step-by-step guide to going professional.
            </p>
          </div>
        </section>

        <article className="mx-auto max-w-4xl px-6 py-16">
          <div className="space-y-12">
            {/* Introduction */}
            <section>
              <div className="space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  The demand for professional astrology services has never been higher. The global psychic services market is projected to exceed $2.2 billion by 2027, and astrology sits at the center of this growth. People are seeking personalized guidance for career decisions, relationship dynamics, life transitions, and spiritual growth — and they are willing to pay well for it.
                </p>
                <p>
                  If you have been studying astrology seriously and friends keep asking for readings, you are closer to launching a business than you think. This guide walks you through the five essential steps to transform your passion into a professional, profitable astrology practice — entirely online.
                </p>
              </div>
            </section>

            {/* Step 1 */}
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                Step 1: Define Your Niche
              </h2>
              <div className="mt-4 space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  The biggest mistake new astrologers make is trying to serve everyone. General "astrology readings" face enormous competition, but a specific niche — career astrology for professionals, relationship synastry for couples, electional astrology for entrepreneurs — positions you as the obvious choice for a defined audience.
                </p>
                <p>
                  Consider your own strengths and interests. What types of readings do you find most energizing? What questions do people come to you with most often? Where does your technical skill intersect with genuine demand? Your niche should sit at the intersection of what you do best, what you enjoy most, and what people will pay for.
                </p>
                <p>
                  Strong niches in 2026 include: natal chart readings for life transitions (especially Saturn Returns and midlife transits), synastry and composite readings for couples, vocational astrology for career changers, and lunar cycle coaching for creatives and entrepreneurs. Each of these has clear demand, defined audiences, and willingness to invest in guidance.
                </p>
              </div>
            </section>

            {/* Step 2 */}
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                Step 2: Set Up Your Tools and Platform
              </h2>
              <div className="mt-4 space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  Running an astrology business online requires several interconnected tools: a professional website with your bio and services, a booking system that handles scheduling across time zones, a video platform for live sessions, a payment processor, and astrology software for chart calculation. Managing these separately is possible but creates friction and wastes time.
                </p>
                <p>
                  Modern platforms like AstrologyPro consolidate these into a single solution built specifically for divination professionals. Instead of juggling Calendly, Zoom, Stripe, and a separate website, you get a branded practitioner page, integrated booking, video sessions, payment processing, and client management — all in one place. This lets you focus on readings rather than technology.
                </p>
                <p>
                  At minimum, ensure your setup includes: a professional domain and website, reliable video conferencing, automated booking with calendar sync, secure payment processing, and a client intake form that collects birth data (date, time, and place of birth) before each session. The smoother your client experience from booking to follow-up, the more likely they are to return and refer others.
                </p>
              </div>
            </section>

            {/* Step 3 */}
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                Step 3: Price Your Services Strategically
              </h2>
              <div className="mt-4 space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  Pricing is where many new astrologers stumble. Undercharging signals to clients that you do not value your own expertise, while overcharging without established credibility limits your reach. The key is to start with market-aware pricing and increase as your demand grows.
                </p>
                <p>
                  Research what experienced astrologers in your niche charge. In 2026, standard rates for a 60-minute natal chart reading range from $150-$350 depending on the practitioner&apos;s experience and market. Shorter 30-minute transit or follow-up sessions typically run $75-$175. Specialized readings like synastry or electional charts command premium prices of $200-$500.
                </p>
                <p>
                  Consider offering a tiered structure: a foundational reading at your base price, a premium package with a follow-up session and written report, and a VIP tier with ongoing monthly check-ins. Packages create recurring revenue and deepen client relationships. Many successful astrologers generate the majority of their income from returning clients rather than one-time bookings.
                </p>
              </div>
            </section>

            {/* Step 4 */}
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                Step 4: Build Your Online Presence
              </h2>
              <div className="mt-4 space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  Your online presence is your storefront, your resume, and your first impression rolled into one. Start with a professional website that clearly communicates who you are, what you offer, and how to book. Include your bio, credentials, service descriptions, pricing, testimonials (once you have them), and a straightforward booking process.
                </p>
                <p>
                  Content marketing is the most effective long-term strategy for attracting clients. Write blog posts about upcoming transits, record short videos explaining astrological concepts, or create social media content around new and full moons. Consistent, valuable content establishes your authority and attracts people who are already interested in astrology — your ideal clients.
                </p>
                <p>
                  Social media platforms favor short, educational content. Instagram reels, TikTok videos, and YouTube shorts about current transits consistently perform well because they meet people where they already are — scrolling their feeds looking for cosmic insight. You do not need to be on every platform. Choose one or two where your ideal clients spend time and post consistently.
                </p>
              </div>
            </section>

            {/* Step 5 */}
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                Step 5: Get Your First Clients
              </h2>
              <div className="mt-4 space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  Your first clients will almost certainly come from your existing network. Let friends, family, and social media followers know you are open for business. Offer a small number of discounted "founding client" readings to build your testimonial base and sharpen your professional delivery. These early sessions are invaluable for refining your process and building confidence.
                </p>
                <p>
                  After your initial launch, referrals become your most powerful growth engine. Deliver an exceptional experience — thorough preparation, genuine presence during the session, and thoughtful follow-up — and satisfied clients will recommend you to their friends. Consider formalizing this with a referral incentive: a discount on their next session when they send someone your way.
                </p>
                <p>
                  As your practice grows, diversify your client acquisition. Guest appearances on astrology podcasts, collaborations with complementary practitioners (tarot readers, therapists, coaches), and listings on professional directories all expand your reach. The goal is to build multiple streams of discovery so you are never dependent on a single platform or algorithm.
                </p>
              </div>
            </section>

            {/* FAQ */}
            <FaqSection faqs={faqs} />
          </div>
        </article>

        <CtaBanner variant="practitioner" />
      </main>
      <MarketingFooter />
    </>
  )
}
