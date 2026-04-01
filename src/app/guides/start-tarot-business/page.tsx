import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { FaqSection } from '@/components/seo/faq-section'
import { CtaBanner } from '@/components/seo/cta-banner'
import { JsonLd } from '@/components/seo/json-ld'
import { MarketingHeader } from '@/components/marketing/header'
import { MarketingFooter } from '@/components/marketing/footer'

export const metadata: Metadata = {
  title: 'How to Start a Tarot Reading Business Online | AstrologyPro',
  description:
    'A complete guide to launching a professional tarot reading business online. Learn how to find your niche, price your readings, build a client base, and grow sustainably.',
}

const faqs = [
  {
    question: 'Do I need years of experience before charging for readings?',
    answer:
      'You need sufficient skill to deliver genuine value, but "sufficient" does not mean "decades." If you can competently read common spreads, communicate insights clearly, and hold space for clients emotionally, you are ready to start. Begin with shorter, simpler readings and expand your offerings as your confidence and skill grow. Most successful readers started charging within 1-2 years of serious study.',
  },
  {
    question: 'Should I read online or in person?',
    answer:
      'Online reading dramatically expands your potential client base beyond your geographic area. Video sessions allow you to read for anyone in the world while maintaining the personal connection of face-to-face interaction. Many readers offer both options but find that online sessions generate more volume and flexibility. Start online to maximize your reach, then add in-person sessions if local demand supports it.',
  },
  {
    question: 'How do I handle difficult or emotional readings?',
    answer:
      'Prepare yourself with clear boundaries and compassionate communication. You are a reader, not a therapist — know where your scope ends and have referral resources ready. For emotional topics, hold space without overstepping. Never diagnose, prescribe, or make promises about specific outcomes. Develop a personal grounding practice to process the energy you absorb during sessions.',
  },
  {
    question: 'What legal considerations should I be aware of?',
    answer:
      'Requirements vary by location. In most places, tarot reading is legal but may require a general business license. Some jurisdictions have specific regulations for "fortune telling" businesses. Register as a sole proprietor or LLC, get appropriate business insurance, and include a disclaimer on your website clarifying that readings are for entertainment and spiritual guidance, not professional medical, legal, or financial advice.',
  },
]

export default function StartTarotBusinessPage() {
  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen bg-[#040610]">
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'How to Start a Tarot Reading Business Online',
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
                { label: 'Start a Tarot Business' },
              ]}
            />
            <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-bold text-[#f5f0e8] md:text-5xl">
              How to Start a Tarot Reading Business Online
            </h1>
            <p className="mt-4 text-xl text-[#b8bcd0]/80">
              From first deck to first client — everything you need to build a
              sustainable, professional tarot reading practice.
            </p>
          </div>
        </section>

        <article className="mx-auto max-w-4xl px-6 py-16">
          <div className="space-y-12">
            <section>
              <div className="space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  Tarot reading has evolved from parlor curiosity to a respected profession with genuine demand. Millions of people seek tarot guidance for career decisions, relationship clarity, personal growth, and spiritual development. The shift to online services has removed geographic barriers, meaning a skilled reader can build a global client base from anywhere with an internet connection.
                </p>
                <p>
                  If you are ready to turn your tarot practice into a business, this guide covers everything from defining your unique niche to landing your first paying clients. Whether you want a full-time career or a meaningful side practice, the fundamentals are the same: deliver genuine value, present yourself professionally, and create systems that let you focus on reading rather than administration.
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                Step 1: Define Your Reading Style and Niche
              </h2>
              <div className="mt-4 space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  Every successful tarot reader has a distinct voice. Some readers are warm, nurturing, and focused on emotional guidance. Others are direct, practical, and strategy-oriented. Some integrate astrology, numerology, or oracle cards alongside tarot. Your unique combination of style, skill, and personality is what sets you apart in a growing market.
                </p>
                <p>
                  Defining a niche narrows your competition and sharpens your marketing. Instead of competing with every tarot reader online, you become the go-to reader for a specific audience. Strong tarot niches include: love and relationship readings, career and business guidance, shadow work and personal transformation, creative and artistic guidance, and lunar cycle coaching.
                </p>
                <p>
                  To find your niche, reflect on three questions: What topics do you read most effectively? What kinds of clients energize you? What unique perspective do you bring that others do not? The intersection of these answers is your niche. You can always expand later, but starting focused builds momentum faster than starting broad.
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                Step 2: Develop Your Professional Reading Process
              </h2>
              <div className="mt-4 space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  The difference between a casual reading and a professional one is structure. Develop a consistent process that clients can rely on. This typically includes: a pre-session intake form where clients describe their question or situation, a defined session length (30 or 60 minutes), a preferred set of spreads for different question types, and a follow-up summary or recording.
                </p>
                <p>
                  Practice your professional delivery by recording yourself doing readings. Watch the recordings critically — are you speaking clearly? Do you communicate card meanings in a way that connects to the client&apos;s question? Are you balancing honesty with compassion? Do you avoid filler words and unnecessary tangents? Professional delivery is a skill that improves with deliberate practice.
                </p>
                <p>
                  Create a code of ethics for your practice. This should cover confidentiality, scope of practice (you are a reader, not a therapist or doctor), how you handle questions about health or legal matters, your policy on repeat readings for the same question, and how you manage emotional situations. Having clear ethics protects both you and your clients.
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                Step 3: Set Up Your Online Presence
              </h2>
              <div className="mt-4 space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  Your online presence needs three elements: a professional website, a social media strategy, and a booking system. Your website is your home base — it should clearly communicate who you are, what you offer, how much it costs, and how to book. Keep the design clean and aligned with your brand. Include testimonials once you have them, and make the booking process as frictionless as possible.
                </p>
                <p>
                  For social media, choose one or two platforms where your ideal clients gather. Instagram and TikTok work well for tarot because the visual nature of the cards translates beautifully to short-form video. Post consistently: daily card pulls, spread tutorials, seasonal reading themes, and behind-the-scenes glimpses of your practice. Content that educates and inspires builds trust before someone ever books a session.
                </p>
                <p>
                  An all-in-one platform like AstrologyPro eliminates the technical complexity. Instead of piecing together a website builder, booking tool, video platform, and payment processor, you get a branded practitioner page with integrated everything — designed specifically for divination professionals. This means more time reading cards and less time troubleshooting technology.
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                Step 4: Price for Sustainability
              </h2>
              <div className="mt-4 space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  Pricing your readings requires balancing accessibility with sustainability. Research the market: in 2026, online tarot readings typically range from $50-$100 for 30 minutes and $100-$250 for 60 minutes, depending on the reader&apos;s experience and niche. Specialized readings (year-ahead spreads, relationship deep-dives) command higher rates because they require more preparation and expertise.
                </p>
                <p>
                  Start at the lower end of market rates for your experience level and increase as demand grows. When you are consistently booked two or more weeks in advance, it is time to raise your prices. This natural supply-and-demand approach ensures you are never undervaluing yourself while remaining accessible as you build your reputation.
                </p>
                <p>
                  Create packages that encourage ongoing relationships. A "Monthly Lunar Coaching" package with two readings per month, or a "Quarterly Deep Dive" package with one extended session per season, provides recurring revenue and deeper client relationships. Packages also reduce the mental energy clients spend deciding whether to book — they just show up at their scheduled time.
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                Step 5: Get Your First Clients and Grow
              </h2>
              <div className="mt-4 space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  Your first ten clients will come from your personal network. Tell everyone you know that you are now offering professional readings. Post on your personal social media. Offer "founding client" rates to the first five or ten bookings in exchange for honest testimonials. These early reviews are gold — they provide the social proof that turns curious visitors into paying clients.
                </p>
                <p>
                  Once your foundation is set, scale through content and referrals. Every piece of content you create — a blog post about a tarot spread, a video explaining a card, a social media post about the current moon phase — is a potential entry point for a future client. The people who consume your free content and find it valuable are the most likely to pay for a private session.
                </p>
                <p>
                  Build referral relationships with complementary practitioners: astrologers, life coaches, therapists, and other tarot readers who do not share your niche. Cross-referrals between aligned professionals benefit everyone. Consider guest appearances on podcasts, collaborative live events on social media, and joint workshops that expose you to each other&apos;s audiences.
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
