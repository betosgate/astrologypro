import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { BlogSubscribeForm } from "./subscribe-form";

export const metadata: Metadata = {
  title: "Blog - Astrology Insights & Business Tips | AstrologyPro",
  description:
    "Expert advice on running a profitable astrology and tarot practice — pricing, client growth, planetary insights, and more.",
  openGraph: {
    title: "Blog - Astrology Insights & Business Tips | AstrologyPro",
    description:
      "Expert advice on running a profitable astrology and tarot practice — pricing, client growth, planetary insights, and more.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog - Astrology Insights & Business Tips | AstrologyPro",
    description:
      "Expert advice on running a profitable astrology and tarot practice — pricing, client growth, planetary insights, and more.",
  },
};

const COMING_POSTS = [
  {
    title: "How to Price Your Astrology Readings",
    category: "Business",
    publishDate: "Coming April 2026",
    description:
      "A practical framework for setting rates that reflect your expertise, cover your costs, and attract the clients you want — without undercharging or second-guessing yourself.",
    categoryColor: "border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#c9a84c]",
  },
  {
    title: "The Saturn Return: What Your Clients Need to Know",
    category: "Astrology",
    publishDate: "Coming April 2026",
    description:
      "Saturn's 29-year cycle brings upheaval and transformation. Here's how to guide clients through their first, second, and third returns with clarity and compassion.",
    categoryColor: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  },
  {
    title: "Building a 6-Figure Reading Business",
    category: "Business",
    publishDate: "Coming May 2026",
    description:
      "From your first paid session to a full-time practice: the systems, pricing strategies, and platform tools that professional diviners use to scale sustainably.",
    categoryColor: "border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#c9a84c]",
  },
  {
    title: "Mercury Retrograde and Client Bookings",
    category: "Astrology",
    publishDate: "Coming May 2026",
    description:
      "Mercury retrograde doesn't have to wreck your calendar. Learn how to set client expectations, protect your bookings, and actually lean into the energy.",
    categoryColor: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  },
];

export default function BlogPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#06080f]">
      {/* Cosmic background layers */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(88,28,135,0.18)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_85%,rgba(201,168,76,0.09)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,rgba(59,7,100,0.10)_0%,transparent_60%)]" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col">
        <MarketingHeader />

        <main className="flex-1">
          {/* Hero */}
          <section className="px-4 py-24 text-center sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              {/* Decorative star */}
              <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#c9a84c]">
                <span className="inline-block size-1.5 rounded-full bg-[#c9a84c]" />
                Launching Soon
              </div>

              <h1 className="font-display text-4xl font-bold tracking-tight text-[#f5f0e8] sm:text-5xl lg:text-6xl">
                Astrology Insights &amp;{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #f8d275 0%, #c9a84c 50%, #a07838 100%)",
                  }}
                >
                  Business Tips
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#b8bcd0]/80">
                Expert advice for professional diviners — from pricing your
                readings and growing your client base to understanding the
                transits that shape your practice.
              </p>
            </div>
          </section>

          {/* Coming Soon Posts */}
          <section className="px-4 pb-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-10 text-center text-sm font-semibold uppercase tracking-widest text-[#b8bcd0]/50">
                First Articles — Coming April &amp; May 2026
              </h2>

              <div className="grid gap-6 sm:grid-cols-2">
                {COMING_POSTS.map((post) => (
                  <article
                    key={post.title}
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-all hover:border-[#c9a84c]/20 hover:bg-white/[0.04]"
                  >
                    {/* Subtle hover glow */}
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(201,168,76,0.05)_0%,transparent_70%)]" />
                    </div>

                    <div className="relative">
                      {/* Category + date row */}
                      <div className="mb-4 flex items-center gap-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${post.categoryColor}`}
                        >
                          {post.category}
                        </span>
                        <span className="text-xs text-[#b8bcd0]/40">
                          {post.publishDate}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold leading-snug text-[#f5f0e8]">
                        {post.title}
                      </h3>

                      <p className="mt-3 text-sm leading-relaxed text-[#b8bcd0]/65">
                        {post.description}
                      </p>

                      {/* Notify pill */}
                      <a
                        href="#subscribe"
                        className="mt-5 inline-flex items-center gap-1.5 text-xs text-[#c9a84c]/60 hover:text-[#c9a84c] transition-colors"
                      >
                        <span className="inline-block size-1 rounded-full bg-[#c9a84c]/60" />
                        Notify me when published
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* Email Subscribe */}
          <section id="subscribe" className="border-t border-white/[0.06] px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/10">
                {/* Envelope icon inline */}
                <svg
                  className="size-6 text-[#c9a84c]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>

              <h2 className="font-display text-2xl font-semibold text-[#f5f0e8] sm:text-3xl">
                Get Notified When We Publish
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#b8bcd0]/65">
                No spam — just practical articles on astrology, tarot, and
                growing your reading practice. Unsubscribe anytime.
              </p>

              <BlogSubscribeForm />
            </div>
          </section>
        </main>

        <MarketingFooter />
      </div>
    </div>
  );
}
