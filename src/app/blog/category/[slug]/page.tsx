import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { BlogNav } from "@/components/blog/BlogNav";
import {
  getCategoryBySlug,
  getPublishedPosts,
  getAllCategories,
} from "@/lib/blog";
import type { BlogListItem } from "@/lib/blog";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ cursor?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  const title = `${category.name} Articles | AstrologyPro Blog`;
  const description =
    category.description ?? `Browse all ${category.name} articles on the AstrologyPro blog.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
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
            {post.reading_time_minutes && (
              <span className="ml-auto text-xs text-[#b8bcd0]/35">
                {post.reading_time_minutes} min
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

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { cursor } = await searchParams;

  const [category, categories, { posts, nextCursor }] = await Promise.all([
    getCategoryBySlug(slug),
    getAllCategories(),
    getPublishedPosts({ categorySlug: slug, limit: 12, cursor }),
  ]);

  if (!category) notFound();

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
            {/* Header */}
            <div className="mb-10">
              <Link
                href="/blog"
                className="mb-5 inline-flex items-center gap-1.5 text-sm text-[#b8bcd0]/50 hover:text-[#c9a84c] transition-colors"
              >
                ← All Posts
              </Link>
              <h1 className="text-3xl font-bold text-[#f5f0e8] sm:text-4xl">{category.name}</h1>
              {category.description && (
                <p className="mt-3 max-w-2xl text-base text-[#b8bcd0]/65">{category.description}</p>
              )}
            </div>

            {posts.length === 0 ? (
              <p className="text-center text-[#b8bcd0]/50 py-20">
                No articles in this category yet.
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
                      href={`/blog/category/${slug}?cursor=${nextCursor}`}
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
