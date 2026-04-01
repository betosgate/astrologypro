import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingHeader } from '@/components/marketing/header'
import { MarketingFooter } from '@/components/marketing/footer'

export const metadata: Metadata = {
  title: 'Guides & Resources | AstrologyPro',
  description:
    'Free guides for clients and practitioners. Learn about astrology readings, tarot, Saturn Returns, Mercury Retrograde, and how to build your divination business.',
}

const clientGuides = [
  {
    title: 'How Professional Astrology Readings Work',
    description:
      'What to expect from your first session — types of readings, preparation, and making the most of your experience.',
    href: '/guides/how-astrology-readings-work',
  },
  {
    title: 'Understanding Your Saturn Return',
    description:
      'The definitive guide to astrology\'s most transformative transit — what it is, when it happens, and how to navigate it.',
    href: '/guides/saturn-return',
  },
  {
    title: 'Mercury Retrograde: What It Really Means',
    description:
      'Beyond the memes — a grounded guide to retrograde motion, shadow periods, and practical survival tips.',
    href: '/guides/mercury-retrograde',
  },
]

const practitionerGuides = [
  {
    title: 'How to Start Your Astrology Business Online',
    description:
      'Define your niche, set up your tools, price your services, build your presence, and get your first clients.',
    href: '/guides/start-astrology-business',
  },
  {
    title: 'How to Start a Tarot Reading Business Online',
    description:
      'From first deck to first client — everything you need to build a sustainable tarot practice.',
    href: '/guides/start-tarot-business',
  },
  {
    title: 'How to Price Your Readings',
    description:
      'Market rates, value-based pricing, package strategies, and subscription models for professional readers.',
    href: '/guides/pricing-your-readings',
  },
]

function GuideCard({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-[#b8bcd0]/10 bg-[#0d0f1a] p-6 transition-all hover:border-[#c9a84c]/30 hover:shadow-lg hover:shadow-[#c9a84c]/5"
    >
      <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#f5f0e8] transition-colors group-hover:text-[#f8d275]">
        {title}
      </h3>
      <p className="mt-2 text-sm text-[#b8bcd0]/70 leading-relaxed">
        {description}
      </p>
      <span className="mt-4 inline-block text-sm font-medium text-[#c9a84c]">
        Read Guide &rarr;
      </span>
    </Link>
  )
}

export default function GuidesHubPage() {
  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen bg-[#040610]">
        {/* Hero */}
        <section className="border-b border-[#b8bcd0]/10 bg-gradient-to-b from-[#0d0f1a] to-[#040610] px-6 py-20 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-[#f5f0e8] md:text-5xl">
              Guides &amp; Resources
            </h1>
            <p className="mt-4 text-lg text-[#b8bcd0]/80">
              Free, in-depth guides for anyone exploring astrology and tarot —
              whether you are booking your first reading or building a
              professional practice.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-6 py-16">
          {/* For Clients */}
          <section className="mb-16">
            <h2 className="mb-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
              For Clients
            </h2>
            <p className="mb-6 text-[#b8bcd0]/60">
              Understand astrology, prepare for readings, and get the most from
              your experience.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {clientGuides.map((guide) => (
                <GuideCard key={guide.href} {...guide} />
              ))}
            </div>
          </section>

          {/* For Practitioners */}
          <section>
            <h2 className="mb-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-[#f5f0e8]">
              For Practitioners
            </h2>
            <p className="mb-6 text-[#b8bcd0]/60">
              Launch, grow, and sustain your professional divination practice.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {practitionerGuides.map((guide) => (
                <GuideCard key={guide.href} {...guide} />
              ))}
            </div>
          </section>
        </div>
      </main>
      <MarketingFooter />
    </>
  )
}
