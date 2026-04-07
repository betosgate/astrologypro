import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { BlogNav } from "@/components/blog/BlogNav";
import {
  getAuthorBySlug,
  getPublishedPosts,
  getAllCategories,
} from "@/lib/blog";
import type { BlogListItem } from "@/lib/blog";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ cursor?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) return {};
  const title = `${author.name} | AstrologyPro Blog`;
  const description =
    author.bio ?? `Articles by ${author.name} on the AstrologyPro blog.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
    twitter: { card: "summary_large_image", title, description },
  };
}

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

export default async function AuthorPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { cursor } = await searchParams;

  const [author, categories, { posts, nextCursor }] = await Promise.all([
    getAuthorBySlug(slug),
    getAllCategories(),
    getPublishedPosts({ authorSlug: slug, limit: 12, cursor }),
  ]);

  if (!author) notFound();

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
            {/* Author profile card */}
            <div className="mb-12">
              <Link
                href="/blog"
                className="mb-6 inline-flex items-center gap-1.5 text-sm text-[#b8bcd0]/50 hover:text-[#c9a84c] transition-colors"
              >
                ← All Posts
              </Link>

              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-7">
                {author.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={author.avatar_url}
                    alt={author.name}
                    className="size-20 shrink-0 rounded-full object-cover ring-2 ring-[#c9a84c]/20"
                  />
                ) : (
                  <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-[#c9a84c]/15 text-2xl font-bold text-[#c9a84c] ring-2 ring-[#c9a84c]/20">
                    {author.name[0]}
                  </div>
                )}

                <div>
                  <h1 className="text-2xl font-bold text-[#f5f0e8] sm:text-3xl">
                    {author.name}
                  </h1>
                  {author.bio && (
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-[#b8bcd0]/65">
                      {author.bio}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-3">
                    {author.twitter_handle && (
                      <a
                        href={`https://twitter.com/${author.twitter_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#b8bcd0]/50 hover:text-[#c9a84c] transition-colors"
                      >
                        <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        @{author.twitter_handle}
                      </a>
                    )}
                    {author.website_url && (
                      <a
                        href={author.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#b8bcd0]/50 hover:text-[#c9a84c] transition-colors"
                      >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Website
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Posts */}
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-[#b8bcd0]/50">
              Articles by {author.name}
            </h2>

            {posts.length === 0 ? (
              <p className="py-20 text-center text-[#b8bcd0]/50">
                No published articles yet.
              </p>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>

                {nextCursor && (
                  <div className="mt-12 text-center">
                    <Link
                      href={`/blog/author/${slug}?cursor=${nextCursor}`}
                      className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-6 py-2.5 text-sm text-[#b8bcd0]/70 transition-all hover:border-[#c9a84c]/30 hover:text-[#c9a84c]"
                    >
                      Load more articles →
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        <MarketingFooter />
      </div>
    </div>
  );
}
