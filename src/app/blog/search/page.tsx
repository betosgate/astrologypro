import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { BlogNav } from "@/components/blog/BlogNav";
import { getPublishedPosts, getAllCategories } from "@/lib/blog";
import type { BlogListItem } from "@/lib/blog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search Blog | AstrologyPro",
  description: "Search articles on the AstrologyPro Blog.",
};

type Props = { searchParams: Promise<{ q?: string; cursor?: string }> };

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
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {category && (
              <span className="inline-flex items-center rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-2.5 py-0.5 text-xs font-semibold text-[#c9a84c]">
                {category.name}
              </span>
            )}
            {date && <span className="text-xs text-[#b8bcd0]/40">{date}</span>}
          </div>
          <h3 className="text-base font-semibold leading-snug text-[#f5f0e8] transition-colors group-hover:text-[#c9a84c]">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#b8bcd0]/60">
              {post.excerpt}
            </p>
          )}
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#c9a84c]/60 transition-colors group-hover:text-[#c9a84c]">
            Read article →
          </span>
        </div>
      </article>
    </Link>
  );
}

export default async function BlogSearchPage({ searchParams }: Props) {
  const { q, cursor } = await searchParams;
  const query = (q ?? "").trim();

  const [categories, { posts, nextCursor }] = await Promise.all([
    getAllCategories(),
    query
      ? getPublishedPosts({ search: query, limit: 12, cursor })
      : Promise.resolve({ posts: [], nextCursor: null }),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[#06080f]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(88,28,135,0.18)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_85%,rgba(201,168,76,0.09)_0%,transparent_55%)]" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col">
        <MarketingHeader />
        <BlogNav categories={categories} />

        <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10">
              <h1 className="text-3xl font-bold text-[#f5f0e8] sm:text-4xl">Search</h1>
              <p className="mt-2 text-sm text-[#b8bcd0]/50">
                Search articles by title.
              </p>
            </div>

            {/* Search form — GET so URL is shareable */}
            <form method="GET" action="/blog/search" className="mb-10">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Search articles…"
                  autoComplete="off"
                  className="flex-1 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-[#f5f0e8] placeholder-[#b8bcd0]/30 outline-none transition-all focus:border-[#c9a84c]/40 focus:ring-2 focus:ring-[#c9a84c]/10"
                />
                <button
                  type="submit"
                  className="rounded-full px-6 py-3 text-sm font-semibold text-black transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(180deg, #f8d275 0%, #cd912f 100%)" }}
                >
                  Search
                </button>
              </div>
            </form>

            {/* Results */}
            {query && (
              <p className="mb-6 text-sm text-[#b8bcd0]/50">
                {posts.length > 0
                  ? `${posts.length}${nextCursor ? "+" : ""} result${posts.length !== 1 ? "s" : ""} for "${query}"`
                  : `No results for "${query}"`}
              </p>
            )}

            {query && posts.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-20 text-center">
                <svg
                  className="size-12 text-[#b8bcd0]/20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"
                  />
                </svg>
                <p className="text-[#b8bcd0]/50">
                  No articles match your search. Try different keywords.
                </p>
                <Link
                  href="/blog"
                  className="text-sm text-[#c9a84c]/70 hover:text-[#c9a84c] transition-colors"
                >
                  ← Back to all posts
                </Link>
              </div>
            ) : (
              posts.length > 0 && (
                <>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>

                  {nextCursor && (
                    <div className="mt-12 text-center">
                      <Link
                        href={`/blog/search?q=${encodeURIComponent(query)}&cursor=${nextCursor}`}
                        className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-6 py-2.5 text-sm text-[#b8bcd0]/70 transition-all hover:border-[#c9a84c]/30 hover:text-[#c9a84c]"
                      >
                        Load more results →
                      </Link>
                    </div>
                  )}
                </>
              )
            )}

            {!query && (
              <div className="flex flex-col items-center gap-3 py-20 text-center text-[#b8bcd0]/40">
                <svg
                  className="size-12 text-[#b8bcd0]/15"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"
                  />
                </svg>
                <p>Enter a search term above to find articles.</p>
              </div>
            )}
          </div>
        </main>

        <MarketingFooter />
      </div>
    </div>
  );
}
