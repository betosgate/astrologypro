import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { FaqSection } from '@/components/seo/faq-section'
import { CtaBanner } from '@/components/seo/cta-banner'
import { JsonLd } from '@/components/seo/json-ld'
import { MarketingHeader } from '@/components/marketing/header'
import { MarketingFooter } from '@/components/marketing/footer'

export const metadata: Metadata = {
  title: 'Mercury Retrograde: What It Really Means | AstrologyPro',
  description:
    'Understand what Mercury Retrograde actually is, how it affects you, survival tips, shadow periods, and how a professional reading can help you navigate it.',
}

const faqs = [
  {
    question: 'How many times a year does Mercury go retrograde?',
    answer:
      'Mercury goes retrograde approximately three to four times per year, with each retrograde lasting about three weeks. Including the pre- and post-retrograde shadow periods, the full cycle extends to roughly seven to eight weeks each time. This means Mercury is in some phase of retrograde for nearly a third of the year.',
  },
  {
    question: 'Should I avoid signing contracts during Mercury Retrograde?',
    answer:
      'The traditional advice is to avoid initiating new contracts, but modern life does not always allow for three-week pauses. If you must sign during retrograde, read everything twice, clarify ambiguous language, and build in flexibility for revisions. The real risk is not the signing itself but the likelihood that details will be overlooked or miscommunicated.',
  },
  {
    question: 'Does Mercury Retrograde affect everyone the same way?',
    answer:
      'No. The impact depends on your birth chart — specifically where Mercury sits natally, which houses the retrograde activates, and whether it aspects your personal planets. Gemini and Virgo risings tend to feel retrogrades most strongly since Mercury rules their chart. A professional reading can show exactly how each retrograde will affect you personally.',
  },
  {
    question: 'Is anything good about Mercury Retrograde?',
    answer:
      'Quite a lot, actually. Mercury Retrograde is excellent for any activity that starts with "re" — review, revise, reconnect, reflect, repair, restructure. Old friends resurface, lost opportunities return, and unfinished projects find their completion. If you approach it as a period of productive reflection rather than a cosmic curse, it becomes genuinely useful.',
  },
]

export default function MercuryRetrogradePage() {
  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen bg-[#040610]">
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'Mercury Retrograde: What It Really Means',
            description: metadata.description as string,
            publisher: { '@type': 'Organization', name: 'AstrologyPro' },
          }}
        />

        {/* Hero */}
        <section className="border-b border-[#b8bcd0]/10 bg-gradient-to-b from-[#0d0f1a] to-[#040610] px-6 pb-12 pt-8">
          <div className="mx-auto max-w-4xl">
            <Breadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'Guides', href: '/guides' },
                { label: 'Mercury Retrograde' },
              ]}
            />
            <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-bold text-[#f5f0e8] md:text-5xl">
              Mercury Retrograde: What It Really Means
            </h1>
            <p className="mt-4 text-xl text-[#b8bcd0]/80">
              Beyond the memes and the panic — a grounded, practical guide to
              astrology&apos;s most discussed transit.
            </p>
          </div>
        </section>

        <article className="mx-auto max-w-4xl px-6 py-16">
          <div className="space-y-12">
            {/* What Is Retrograde Motion */}
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                What Is Retrograde Motion?
              </h2>
              <div className="mt-4 space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  Retrograde motion is an optical illusion. No planet actually reverses its orbit around the Sun. What happens is that Earth, which orbits faster than the outer planets (and at a different speed than Mercury and Venus), periodically "laps" or is lapped by other planets. When this happens, the other planet appears to move backward against the backdrop of the zodiac — much like a car you are passing on the highway appears to drift backward relative to you.
                </p>
                <p>
                  Mercury, being the closest planet to the Sun, orbits much faster than Earth. Three to four times a year, Mercury&apos;s orbit brings it between Earth and the Sun, creating the illusion of backward motion. This illusion lasts about three weeks each time. While the physics is straightforward, the astrological implications have been observed and documented for thousands of years.
                </p>
              </div>
            </section>

            {/* Mercury's Role */}
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                Mercury&apos;s Role in Astrology
              </h2>
              <div className="mt-4 space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  Mercury is the planet of communication, intellect, commerce, travel, and information technology. Named after the Roman messenger god, it governs every form of exchange — conversations, emails, contracts, negotiations, data, transportation, and the countless systems that keep modern life functioning. Mercury is the connective tissue of civilization.
                </p>
                <p>
                  In your birth chart, Mercury&apos;s sign shows how you think and communicate. Mercury in Aries thinks fast and speaks directly; Mercury in Pisces thinks in images and communicates through feeling. Your natal Mercury also determines how you learn, process information, and express ideas. When transiting Mercury goes retrograde, it does not erase these qualities — it turns them inward, slowing the external expression while deepening the internal processing.
                </p>
              </div>
            </section>

            {/* What Actually Happens */}
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                What Actually Happens During Mercury Retrograde
              </h2>
              <div className="mt-4 space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  The stereotypical Mercury Retrograde experience includes communication breakdowns, technology failures, travel disruptions, lost mail, misunderstood texts, and contracts that fall through. While these experiences are real and widely reported, focusing only on the negative misses the larger picture.
                </p>
                <p>
                  Mercury Retrograde is fundamentally a period of review. The "re" prefix captures its essence: revisit, reconsider, revise, reconnect, repair, reflect. Old friends contact you. Past job opportunities resurface. Unfinished creative projects call for completion. Errors in previous work reveal themselves so they can be corrected. The planet of forward communication is asking you to look backward — and that is not a glitch. It is a feature.
                </p>
                <p>
                  Problems arise when you fight this energy instead of working with it. Rushing to launch a new business, pushing through a major purchase, or insisting on resolving an argument during retrograde is like swimming against a current. You can do it, but it costs far more energy than waiting for the tide to turn. The disruptions people experience are often the result of forcing forward motion during a period designed for reflection.
                </p>
              </div>
            </section>

            {/* Mercury Retro in Each Element */}
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                Mercury Retrograde by Element
              </h2>
              <p className="mt-4 text-[#b8bcd0] leading-relaxed">
                Each year, Mercury tends to retrograde through signs of the same element, creating a thematic thread across all three retrograde periods. Understanding the element adds nuance to your experience.
              </p>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div className="rounded-lg border border-[#b8bcd0]/10 bg-[#0d0f1a] p-6">
                  <h3 className="text-lg font-semibold text-red-400">Fire Sign Retrogrades</h3>
                  <p className="mt-2 text-[#b8bcd0] leading-relaxed">
                    Mercury retrograde in Aries, Leo, or Sagittarius disrupts confidence, self-expression, and bold action. You may second-guess decisions, feel creatively blocked, or experience identity confusion. The gift is re-examining whether your bold moves are truly aligned with your values or just ego-driven. Use this time to refine your vision before charging ahead again.
                  </p>
                </div>
                <div className="rounded-lg border border-[#b8bcd0]/10 bg-[#0d0f1a] p-6">
                  <h3 className="text-lg font-semibold text-emerald-400">Earth Sign Retrogrades</h3>
                  <p className="mt-2 text-[#b8bcd0] leading-relaxed">
                    Mercury retrograde in Taurus, Virgo, or Capricorn affects finances, work systems, health routines, and practical planning. Budgets need revision, work processes reveal inefficiencies, and material plans require adjustment. The gift is discovering where your systems leak energy and resources so you can plug the gaps.
                  </p>
                </div>
                <div className="rounded-lg border border-[#b8bcd0]/10 bg-[#0d0f1a] p-6">
                  <h3 className="text-lg font-semibold text-sky-400">Air Sign Retrogrades</h3>
                  <p className="mt-2 text-[#b8bcd0] leading-relaxed">
                    Mercury retrograde in Gemini, Libra, or Aquarius hits communication and relationships hardest. Misunderstandings multiply, negotiations stall, social plans fall apart, and technology hiccups peak. The gift is reconnection — old contacts return, unresolved conversations demand closure, and you reassess who deserves space in your social world.
                  </p>
                </div>
                <div className="rounded-lg border border-[#b8bcd0]/10 bg-[#0d0f1a] p-6">
                  <h3 className="text-lg font-semibold text-violet-400">Water Sign Retrogrades</h3>
                  <p className="mt-2 text-[#b8bcd0] leading-relaxed">
                    Mercury retrograde in Cancer, Scorpio, or Pisces stirs emotional communication, old memories, and intuitive processing. Feelings you thought you had resolved resurface. Family dynamics replay. Dreams become vivid and symbolic. The gift is emotional clarity — finally understanding patterns and attachments that have been operating beneath the surface.
                  </p>
                </div>
              </div>
            </section>

            {/* Shadow Periods */}
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                Shadow Periods: The Full Retrograde Cycle
              </h2>
              <div className="mt-4 space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  Mercury Retrograde does not begin and end cleanly. Before it stations retrograde, Mercury moves through the degrees it will later retrace — this is the pre-retrograde shadow, lasting about two weeks. During this phase, the themes of the upcoming retrograde start to emerge. You may notice early hints of the disruptions or reconnections to come.
                </p>
                <p>
                  After Mercury stations direct and resumes forward motion, it must again traverse the degrees it covered during retrograde. This post-retrograde shadow lasts another two weeks. During this phase, the insights and revisions of the retrograde period solidify into action. Things that were delayed begin moving forward again, and the lessons integrate.
                </p>
                <p>
                  The complete Mercury Retrograde cycle — pre-shadow, retrograde, post-shadow — spans roughly seven to eight weeks. Experienced astrologers track the full cycle rather than just the three-week retrograde window, because the shadow periods are when the real integration happens.
                </p>
              </div>
            </section>

            {/* Survival Tips */}
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                Mercury Retrograde Survival Tips
              </h2>
              <ul className="mt-4 space-y-3">
                {[
                  'Double-check all communications before sending — emails, texts, contracts, and especially anything involving numbers or addresses.',
                  'Back up your devices before retrograde begins. Technology failures are the most commonly reported disruption.',
                  'Build extra time into travel plans. Delays, cancellations, and wrong turns are par for the course.',
                  'Avoid launching new ventures, signing major contracts, or making large purchases if possible. If you must, read the fine print twice.',
                  'Embrace the "re" prefix: review old projects, reconnect with old friends, revise your plans, revisit abandoned ideas.',
                  'Use the time for reflection and journaling. Mercury Retrograde is ideal for internal processing and creative incubation.',
                  'Do not panic if things go sideways. Most retrograde disruptions are temporary and self-correcting once Mercury goes direct.',
                  'Pay attention to what resurfaces — old contacts, past opportunities, and unresolved issues return for a reason.',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#b8bcd0]">
                    <span className="mt-1 text-[#c9a84c]">&#10147;</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* How a Reading Helps */}
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
                How a Professional Reading Helps
              </h2>
              <div className="mt-4 space-y-4 text-[#b8bcd0] leading-relaxed">
                <p>
                  A general Mercury Retrograde guide applies to everyone, but your experience is personal. A professional astrologer can examine which houses the retrograde activates in your chart, whether it aspects your natal planets, and how it interacts with other current transits. This specificity transforms generic advice into a tailored strategy.
                </p>
                <p>
                  For example, Mercury retrograding through your 2nd house affects finances and values, while the same retrograde through your 7th house focuses on partnership communication. Knowing the difference means you can direct your attention and preparation where it matters most. A reading before each retrograde season gives you the most strategic advantage.
                </p>
              </div>
            </section>

            {/* FAQ */}
            <FaqSection faqs={faqs} />
          </div>
        </article>

        <CtaBanner variant="client" />
      </main>
      <MarketingFooter />
    </>
  )
}
