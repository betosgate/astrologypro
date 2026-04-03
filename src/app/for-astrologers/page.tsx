import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingHeader } from '@/components/marketing/header'
import { MarketingFooter } from '@/components/marketing/footer'
import { FaqSection } from '@/components/seo/faq-section'
import { JsonLd } from '@/components/seo/json-ld'

export const metadata: Metadata = {
  title: 'Built for Professional Diviners | AstrologyPro',
  description:
    'AstrologyPro gives astrologers and tarot readers everything they need: branded pages, video sessions, booking, payments, CRM, and marketing tools — all in one platform.',
  openGraph: {
    title: 'Built for Professional Diviners | AstrologyPro',
    description:
      'Stop juggling 5+ tools. AstrologyPro replaces your booking, payments, video, CRM, and marketing with one platform built for divination professionals.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Built for Professional Diviners | AstrologyPro',
    description:
      'Stop juggling 5+ tools. AstrologyPro replaces your booking, payments, video, CRM, and marketing with one platform built for divination professionals.',
  },
}

const painPoints = [
  {
    problem: 'Juggling 5+ tools for bookings, payments, video, and marketing',
    solution: 'One platform replaces them all',
  },
  {
    problem: 'Losing 30%+ to marketplace commissions',
    solution: 'Keep 80% of every session',
  },
  {
    problem: 'No professional online presence',
    solution: 'Your own branded page in minutes',
  },
  {
    problem: 'Chasing clients for payments and scheduling',
    solution: 'Automated booking, reminders, and billing',
  },
]

const features = [
  {
    title: 'Branded Practitioner Page',
    description:
      'Your own professional page with bio, services, reviews, and booking — a complete online presence that looks like you, not a marketplace.',
  },
  {
    title: 'HD Video Sessions',
    description:
      'Built-in video conferencing designed for readings. No Zoom links, no technical issues for clients. Phone dial-in for clients who prefer audio only.',
  },
  {
    title: 'Smart Booking System',
    description:
      'Clients book directly on your page with real-time availability. Automatic calendar sync, timezone handling, and email/SMS reminders eliminate no-shows.',
  },
  {
    title: 'Integrated Payments',
    description:
      'Accept payments at booking with Stripe. No invoicing, no chasing. Funds go directly to your account on an 80/20 split — you keep the lion\'s share.',
  },
  {
    title: 'Client CRM',
    description:
      'Track client history, notes, birth data, and session records. Know every client\'s story before they join the call. Build relationships that last.',
  },
  {
    title: 'Marketing Tools',
    description:
      'Shareable profile links, SEO-optimized pages, and built-in discovery so new clients find you. Referral tracking and gift certificates drive organic growth.',
  },
]

const steps = [
  {
    step: '1',
    title: 'Create Your Profile',
    description:
      'Sign up, add your bio, services, and pricing. Your branded page goes live in minutes — no technical skills required.',
  },
  {
    step: '2',
    title: 'Start Booking Clients',
    description:
      'Share your page link. Clients browse your services, pick a time, pay, and receive automatic confirmation and reminders.',
  },
  {
    step: '3',
    title: 'Deliver & Grow',
    description:
      'Conduct readings via built-in video. Collect reviews, build your reputation, and let the platform help new clients discover you.',
  },
]

const faqs = [
  {
    question: 'How much does AstrologyPro cost for practitioners?',
    answer:
      'AstrologyPro operates on a revenue-share model — there is no monthly subscription fee. You keep 80% of every session, and we take 20% to cover the platform, payment processing, video infrastructure, and client acquisition. You only pay when you earn.',
  },
  {
    question: 'Can I use AstrologyPro alongside my existing website?',
    answer:
      'Absolutely. Many practitioners use AstrologyPro as their booking and session engine while maintaining their own website or social media presence. You can embed your booking link anywhere and direct clients to your AstrologyPro page for scheduling and payments.',
  },
  {
    question: 'What types of practitioners can use the platform?',
    answer:
      'AstrologyPro is built for astrologers, tarot readers, oracle card readers, and other divination professionals. Whether you specialize in natal charts, synastry, tarot spreads, or a combination of modalities, the platform adapts to your practice.',
  },
  {
    question: 'How do clients find me on the platform?',
    answer:
      'Clients discover practitioners through our Discover page, which features searchable practitioner profiles filtered by specialty, availability, and reviews. Your SEO-optimized profile page also appears in search engine results, bringing organic traffic directly to your listing.',
  },
]

export default function ForAstrologersPage() {
  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen bg-[#040610]">
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'AstrologyPro for Professional Diviners',
            description: metadata.description as string,
          }}
        />

        {/* Hero */}
        <section className="border-b border-[#b8bcd0]/10 bg-gradient-to-b from-[#0d0f1a] to-[#040610] px-6 py-24 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-[#f5f0e8] md:text-5xl lg:text-6xl">
              Built for Professional Diviners
            </h1>
            <p className="mt-6 text-xl text-[#b8bcd0]/80">
              Stop juggling five different tools. AstrologyPro gives you a
              branded page, video sessions, booking, payments, and client
              management — everything in one place.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/get-started"
                className="inline-flex items-center justify-center rounded-lg px-8 py-3 font-semibold text-[#1a1200] shadow-lg transition-all hover:brightness-110"
                style={{
                  background:
                    'linear-gradient(180deg, #f8d275 0%, #cd912f 100%)',
                }}
              >
                Get Started Free
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-lg border border-[#b8bcd0]/20 px-8 py-3 font-medium text-[#b8bcd0] transition-colors hover:border-[#f8d275]/40 hover:text-[#f5f0e8]"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>

        {/* Pain Points */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8]">
              Sound Familiar?
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {painPoints.map((pp) => (
                <div
                  key={pp.problem}
                  className="rounded-xl border border-[#b8bcd0]/10 bg-[#0d0f1a] p-6"
                >
                  <p className="text-[#b8bcd0]/50 line-through">
                    {pp.problem}
                  </p>
                  <p className="mt-2 font-medium text-[#f8d275]">
                    {pp.solution}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-[#b8bcd0]/10 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8]">
              Everything You Need, Nothing You Don&apos;t
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.title}>
                  <h3 className="font-semibold text-[#f5f0e8]">{f.title}</h3>
                  <p className="mt-2 text-sm text-[#b8bcd0]/70 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial Placeholder */}
        <section className="border-t border-[#b8bcd0]/10 bg-[#0d0f1a] px-6 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <blockquote className="text-lg italic text-[#b8bcd0]/80 leading-relaxed">
              &ldquo;AstrologyPro replaced five separate tools I was paying for.
              My clients love the seamless booking experience, and I love that I
              can focus on readings instead of admin.&rdquo;
            </blockquote>
            <p className="mt-4 text-sm text-[#b8bcd0]/50">
              — Professional Astrologer (Testimonials coming soon)
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-t border-[#b8bcd0]/10 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8]">
              How It Works
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.step} className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 font-[family-name:var(--font-display)] text-2xl font-bold text-[#f8d275]">
                    {s.step}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[#f5f0e8]">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm text-[#b8bcd0]/70 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-[#b8bcd0]/10 px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <FaqSection faqs={faqs} />
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-[#b8bcd0]/10 bg-[#0d0f1a] px-6 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5f0e8] md:text-4xl">
              Ready to Grow Your Practice?
            </h2>
            <p className="mt-4 text-lg text-[#b8bcd0]/70">
              Join a growing community of professional diviners who chose to
              simplify their business and focus on what they do best — reading.
            </p>
            <Link
              href="/get-started"
              className="mt-8 inline-flex items-center justify-center rounded-lg px-10 py-4 text-lg font-semibold text-[#1a1200] shadow-lg transition-all hover:brightness-110"
              style={{
                background:
                  'linear-gradient(180deg, #f8d275 0%, #cd912f 100%)',
              }}
            >
              Get Started — It&apos;s Free
            </Link>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  )
}
