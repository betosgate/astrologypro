import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { BlockRenderer, extractToc } from "@/components/blog/BlockRenderer";
import {
  getPostBySlug,
  getRelatedPosts,
  getSeriesPosts,
  checkBlogRedirect,
} from "@/lib/blog";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

// ─────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const title = post.seo_title ?? post.og_title ?? `${post.title} | AstrologyPro Blog`;
  const description =
    post.seo_description ?? post.og_description ?? post.excerpt ?? undefined;
  const ogImage = post.og_image_url ?? post.cover_image_url ?? undefined;
  const canonical = post.canonical_url ?? undefined;

  return {
    title,
    description,
    ...(canonical && { alternates: { canonical } }),
    openGraph: {
      title: post.og_title ?? post.title,
      description: post.og_description ?? post.excerpt ?? undefined,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      authors: post.author ? [post.author.name] : undefined,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.og_title ?? post.title,
      description: post.og_description ?? post.excerpt ?? undefined,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function AuthorCard({
  author,
}: {
  author: NonNullable<Awaited<ReturnType<typeof getPostBySlug>>>["author"];
}) {
  if (!author) return null;
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#b8bcd0]/40">
        About the Author
      </p>
      <div className="flex items-start gap-3">
        {author.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={author.avatar_url}
            alt={author.name}
            className="size-12 shrink-0 rounded-full object-cover ring-1 ring-white/10"
          />
        ) : (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#c9a84c]/15 text-base font-bold text-[#c9a84c] ring-1 ring-white/10">
            {author.name[0]}
          </div>
        )}
        <div>
          <Link
            href={`/blog/author/${author.slug}`}
            className="text-sm font-semibold text-[#f5f0e8] hover:text-[#c9a84c] transition-colors"
          >
            {author.name}
          </Link>
          {author.bio && (
            <p className="mt-1 text-xs leading-5 text-[#b8bcd0]/55 line-clamp-3">{author.bio}</p>
          )}
          {author.twitter_handle && (
            <a
              href={`https://twitter.com/${author.twitter_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-[#b8bcd0]/40 hover:text-[#c9a84c] transition-colors"
            >
              @{author.twitter_handle}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function TocSidebar({
  toc,
}: {
  toc: ReturnType<typeof extractToc>;
}) {
  if (toc.length === 0) return null;
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#b8bcd0]/40">
        In This Article
      </p>
      <nav aria-label="Table of contents">
        <ol className="flex flex-col gap-2">
          {toc.map((item) => (
            <li
              key={item.anchor}
              style={{ paddingLeft: item.level === 2 ? 0 : item.level === 3 ? "1rem" : "1.5rem" }}
            >
              <a
                href={`#${item.anchor}`}
                className="text-sm text-[#b8bcd0]/55 hover:text-[#c9a84c] transition-colors leading-snug"
              >
                {item.text}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}

function SeriesNav({
  series,
  seriesPosts,
  currentSlug,
}: {
  series: NonNullable<Awaited<ReturnType<typeof getPostBySlug>>>["series"];
  seriesPosts: Awaited<ReturnType<typeof getSeriesPosts>>;
  currentSlug: string;
}) {
  if (!series || seriesPosts.length === 0) return null;
  const currentIndex = seriesPosts.findIndex((p) => p.slug === currentSlug);

  return (
    <div className="rounded-2xl border border-[#c9a84c]/15 bg-[#c9a84c]/5 p-5">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#c9a84c]/70">
        Series
      </p>
      <Link
        href={`/blog/series/${series.slug}`}
        className="mb-4 block text-sm font-semibold text-[#f5f0e8] hover:text-[#c9a84c] transition-colors"
      >
        {series.name}
      </Link>
      <ol className="flex flex-col gap-2">
        {seriesPosts.map((p, i) => (
          <li key={p.id}>
            <Link
              href={`/blog/${p.slug}`}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                p.slug === currentSlug
                  ? "bg-[#c9a84c]/10 font-semibold text-[#c9a84c]"
                  : "text-[#b8bcd0]/60 hover:text-[#f5f0e8]"
              }`}
            >
              <span className="shrink-0 text-xs text-[#c9a84c]/50">{i + 1}.</span>
              <span className="line-clamp-1">{p.title}</span>
            </Link>
          </li>
        ))}
      </ol>

      {/* Prev / Next in series */}
      {currentIndex >= 0 && (
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-4">
          {currentIndex > 0 ? (
            <Link
              href={`/blog/${seriesPosts[currentIndex - 1].slug}`}
              className="flex items-center gap-1.5 text-xs text-[#b8bcd0]/55 hover:text-[#c9a84c] transition-colors"
            >
              ← Prev
            </Link>
          ) : (
            <span />
          )}
          {currentIndex < seriesPosts.length - 1 ? (
            <Link
              href={`/blog/${seriesPosts[currentIndex + 1].slug}`}
              className="flex items-center gap-1.5 text-xs text-[#b8bcd0]/55 hover:text-[#c9a84c] transition-colors"
            >
              Next →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}

function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const url = `https://astrologypro.com/blog/${slug}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-widest text-[#b8bcd0]/40">
        Share
      </span>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X (Twitter)"
        className="flex size-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-[#b8bcd0]/60 transition-all hover:border-[#c9a84c]/30 hover:text-[#c9a84c]"
      >
        <svg className="size-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
      <a
        href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className="flex size-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-[#b8bcd0]/60 transition-all hover:border-[#c9a84c]/30 hover:text-[#c9a84c]"
      >
        <svg className="size-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      </a>
      {/* Copy link handled client-side below */}
    </div>
  );
}

function RelatedPosts({
  posts,
}: {
  posts: Awaited<ReturnType<typeof getRelatedPosts>>;
}) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-16 border-t border-white/[0.06] pt-12">
      <h2 className="mb-6 text-xl font-bold text-[#f5f0e8]">Related Articles</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => {
          const date = post.published_at
            ? new Date(post.published_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : null;
          const category = post.categories[0];

          return (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group">
              <article className="relative h-full overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] transition-all hover:border-[#c9a84c]/20 hover:bg-white/[0.04]">
                {post.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="aspect-video w-full object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {category && (
                      <span className="inline-flex items-center rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-2 py-0.5 text-xs font-semibold text-[#c9a84c]">
                        {category.name}
                      </span>
                    )}
                    {date && <span className="text-xs text-[#b8bcd0]/40">{date}</span>}
                  </div>
                  <h3 className="text-sm font-semibold text-[#f5f0e8] leading-snug transition-colors group-hover:text-[#c9a84c]">
                    {post.title}
                  </h3>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  // Check for redirect first
  const redirectTarget = await checkBlogRedirect(slug);
  if (redirectTarget) {
    redirect(`/blog/${redirectTarget}`);
  }

  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const categoryIds = post.categories.map((c) => c.id);

  const [relatedPosts, seriesPosts] = await Promise.all([
    getRelatedPosts(post.id, categoryIds, 3),
    post.series ? getSeriesPosts(post.series.id) : Promise.resolve([]),
  ]);

  const toc = extractToc(post.content_blocks);

  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#06080f]">
      {/* Cosmic background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(88,28,135,0.18)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_85%,rgba(201,168,76,0.09)_0%,transparent_55%)]" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col">
        <MarketingHeader />

        <main className="flex-1">
          {/* ── Cover image with gradient overlay ── */}
          {post.cover_image_url && (
            <div className="relative h-[50vh] min-h-[320px] max-h-[520px] w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#06080f]/50 to-[#06080f]" />
            </div>
          )}

          <div className="px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              {/* Back link */}
              <div className={post.cover_image_url ? "-mt-4 mb-6" : "py-12 mb-0"}>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1.5 text-sm text-[#b8bcd0]/50 hover:text-[#c9a84c] transition-colors"
                >
                  ← Back to Blog
                </Link>
              </div>

              {/* Article header */}
              <header className="mb-8">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  {post.categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/blog/category/${cat.slug}`}
                      className="inline-flex items-center rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-2.5 py-0.5 text-xs font-semibold text-[#c9a84c] hover:bg-[#c9a84c]/20 transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                  {publishedDate && (
                    <span className="text-sm text-[#b8bcd0]/45">{publishedDate}</span>
                  )}
                  {post.reading_time_minutes && (
                    <span className="text-sm text-[#b8bcd0]/35">
                      {post.reading_time_minutes} min read
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-bold leading-tight text-[#f5f0e8] sm:text-4xl lg:text-5xl">
                  {post.title}
                </h1>

                {post.excerpt && (
                  <p className="mt-5 text-lg leading-relaxed text-[#b8bcd0]/70">{post.excerpt}</p>
                )}

                {/* Author row */}
                {post.author && (
                  <div className="mt-6 flex items-center gap-3">
                    {post.author.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.author.avatar_url}
                        alt={post.author.name}
                        className="size-9 rounded-full object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="flex size-9 items-center justify-center rounded-full bg-[#c9a84c]/15 text-sm font-bold text-[#c9a84c] ring-1 ring-white/10">
                        {post.author.name[0]}
                      </div>
                    )}
                    <div>
                      <Link
                        href={`/blog/author/${post.author.slug}`}
                        className="text-sm font-semibold text-[#f5f0e8] hover:text-[#c9a84c] transition-colors"
                      >
                        {post.author.name}
                      </Link>
                    </div>
                  </div>
                )}
              </header>

              {/* ── Two-column layout ── */}
              <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
                {/* Main content — 70% */}
                <article className="min-w-0 lg:flex-[7]">
                  {/* Tags row */}
                  {post.tags.length > 0 && (
                    <div className="mb-8 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <Link
                          key={tag.id}
                          href={`/blog/tag/${tag.slug}`}
                          className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-0.5 text-xs text-[#b8bcd0]/55 hover:border-[#c9a84c]/20 hover:text-[#c9a84c] transition-colors"
                        >
                          #{tag.name}
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Content blocks */}
                  <BlockRenderer blocks={post.content_blocks} />

                  {/* Share buttons */}
                  <div className="mt-12 border-t border-white/[0.06] pt-8">
                    <ShareButtons title={post.title} slug={post.slug} />
                  </div>
                </article>

                {/* Sidebar — 30% */}
                <aside className="flex flex-col gap-5 lg:sticky lg:top-[96px] lg:flex-[3]">
                  <TocSidebar toc={toc} />
                  <AuthorCard author={post.author} />
                  {post.series && (
                    <SeriesNav
                      series={post.series}
                      seriesPosts={seriesPosts}
                      currentSlug={post.slug}
                    />
                  )}
                </aside>
              </div>

              {/* Related posts */}
              <RelatedPosts posts={relatedPosts} />
            </div>
          </div>
        </main>

        <div className="mt-20">
          <MarketingFooter />
        </div>
      </div>
    </div>
  );
}
