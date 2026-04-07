import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { BlogSubscribeForm } from "./subscribe-form";
import { BlogNav } from "@/components/blog/BlogNav";
import {
  getHeroPosts,
  getFeaturedPosts,
  getLatestPosts,
  getAllCategories,
} from "@/lib/blog";
import type { BlogListItem } from "@/lib/blog";

export const revalidate = 3600;

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

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function PostCard({ post }: { post: BlogListItem }) {
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const category = post.categories[0];

  return (
    <Link href={`/blog/${post.slug}`} className="group">
      <article className="relative h-full overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] transition-all hover:border-[#c9a84c]/20 hover:bg-white/[0.04]">
        {/* Hover glow */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(201,168,76,0.05)_0%,transparent_70%)]" />
        </div>

        {post.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="aspect-video w-full object-cover"
          />
        )}

        <div className="relative p-5">
          <div className="mb-3 flex items-center gap-3">
            {category && (
              <span className="inline-flex items-center rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-2.5 py-0.5 text-xs font-semibold text-[#c9a84c]">
                {category.name}
              </span>
            )}
            {date && <span className="text-xs text-[#b8bcd0]/40">{date}</span>}
            {post.reading_time_minutes && (
              <span className="ml-auto text-xs text-[#b8bcd0]/35">
                {post.reading_time_minutes} min read
              </span>
            )}
          </div>

          <h3 className="text-base font-semibold leading-snug text-[#f5f0e8] transition-colors group-hover:text-[#c9a84c]">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#b8bcd0]/60">
              {post.excerpt}
            </p>
          )}

          {post.author && (
            <div className="mt-4 flex items-center gap-2">
              {post.author.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.author.avatar_url}
                  alt={post.author.name}
                  className="size-6 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-6 items-center justify-center rounded-full bg-[#c9a84c]/20 text-xs font-bold text-[#c9a84c]">
                  {post.author.name[0]}
                </div>
              )}
              <span className="text-xs text-[#b8bcd0]/50">{post.author.name}</span>
            </div>
          )}

          <span className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#c9a84c]/60 transition-colors group-hover:text-[#c9a84c]">
            Read article →
          </span>
        </div>
      </article>
    </Link>
  );
}

function HeroPostCard({ post }: { post: BlogListItem }) {
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const category = post.categories[0];

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="relative overflow-hidden rounded-3xl border border-white/[0.07]">
        {post.cover_image_url ? (
          <div className="relative aspect-[16/7]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06080f] via-[#06080f]/60 to-transparent" />
          </div>
        ) : (
          <div className="aspect-[16/7] bg-[radial-gradient(ellipse_at_40%_50%,rgba(88,28,135,0.4)_0%,rgba(6,8,15,1)_70%)]" />
        )}

        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-10">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            {category && (
              <span className="inline-flex items-center rounded-full border border-[#c9a84c]/40 bg-[#c9a84c]/15 px-3 py-0.5 text-xs font-semibold text-[#c9a84c]">
                {category.name}
              </span>
            )}
            {post.reading_time_minutes && (
              <span className="text-xs text-white/50">
                {post.reading_time_minutes} min read
              </span>
            )}
            {date && <span className="text-xs text-white/40">{date}</span>}
          </div>

          <h2 className="text-2xl font-bold leading-tight text-[#f5f0e8] transition-colors group-hover:text-[#c9a84c] sm:text-3xl lg:text-4xl">
            {post.title}
          </h2>

          {post.excerpt && (
            <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">
              {post.excerpt}
            </p>
          )}

          {post.author && (
            <div className="mt-5 flex items-center gap-2">
              {post.author.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.author.avatar_url}
                  alt={post.author.name}
                  className="size-7 rounded-full object-cover ring-1 ring-white/20"
                />
              ) : (
                <div className="flex size-7 items-center justify-center rounded-full bg-[#c9a84c]/20 text-xs font-bold text-[#c9a84c] ring-1 ring-white/20">
                  {post.author.name[0]}
                </div>
              )}
              <span className="text-sm text-white/60">{post.author.name}</span>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function BlogPage() {
  const [heroPosts, featuredPosts, latestPosts, categories] = await Promise.all([
    getHeroPosts(1),
    getFeaturedPosts(3),
    getLatestPosts(6),
    getAllCategories(),
  ]);

  const heroPost = heroPosts[0] ?? null;
  const hasContent = heroPost || featuredPosts.length > 0 || latestPosts.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-[#06080f]">
      {/* Cosmic background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(88,28,135,0.18)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_85%,rgba(201,168,76,0.09)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,rgba(59,7,100,0.10)_0%,transparent_60%)]" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col">
        <MarketingHeader />
        <BlogNav categories={categories} />

        <main className="flex-1">
          {hasContent ? (
            <>
              {/* ── Hero post ────────────────────────────── */}
              {heroPost && (
                <section className="px-4 pt-10 sm:px-6 lg:px-8">
                  <div className="mx-auto max-w-5xl">
                    <HeroPostCard post={heroPost} />
                  </div>
                </section>
              )}

              {/* ── Featured posts ───────────────────────── */}
              {featuredPosts.length > 0 && (
                <section className="px-4 pt-14 sm:px-6 lg:px-8">
                  <div className="mx-auto max-w-5xl">
                    <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-[#b8bcd0]/50">
                      Featured
                    </h2>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {featuredPosts.map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* ── Category pills ───────────────────────── */}
              {categories.length > 0 && (
                <section className="px-4 pt-14 sm:px-6 lg:px-8">
                  <div className="mx-auto max-w-5xl">
                    <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-[#b8bcd0]/50">
                      Browse by Category
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/blog/category/${cat.slug}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-sm text-[#b8bcd0]/70 transition-all hover:border-[#c9a84c]/30 hover:bg-[#c9a84c]/5 hover:text-[#c9a84c]"
                        >
                          {cat.name}
                          {cat._count > 0 && (
                            <span className="text-xs text-[#b8bcd0]/35">{cat._count}</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* ── Latest posts ─────────────────────────── */}
              {latestPosts.length > 0 && (
                <section className="px-4 py-14 sm:px-6 lg:px-8">
                  <div className="mx-auto max-w-5xl">
                    <div className="mb-6 flex items-center justify-between">
                      <h2 className="text-sm font-semibold uppercase tracking-widest text-[#b8bcd0]/50">
                        Latest Articles
                      </h2>
                      <Link
                        href="/blog/search"
                        className="text-xs text-[#c9a84c]/60 hover:text-[#c9a84c] transition-colors"
                      >
                        Search →
                      </Link>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {latestPosts.map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </>
          ) : (
            /* ── Coming soon fallback ─────────────────── */
            <section className="px-4 py-24 text-center sm:px-6 lg:px-8">
              <div className="mx-auto max-w-3xl">
                <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#c9a84c]">
                  <span className="inline-block size-1.5 rounded-full bg-[#c9a84c]" />
                  Launching Soon
                </div>
                <h1 className="font-display text-4xl font-bold tracking-tight text-[#f5f0e8] sm:text-5xl">
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
                  Expert advice for professional diviners — from pricing your readings and growing
                  your client base to understanding the transits that shape your practice.
                </p>
              </div>
            </section>
          )}

          {/* ── Email Subscribe ───────────────────────── */}
          <section
            id="subscribe"
            className="border-t border-white/[0.06] px-4 py-20 sm:px-6 lg:px-8"
          >
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/10">
                <svg
                  className="size-6 text-[#c9a84c]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden="true"
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
                No spam — just practical articles on astrology, tarot, and growing your reading
                practice. Unsubscribe anytime.
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
