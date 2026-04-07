import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { BlogNav } from "@/components/blog/BlogNav";
import {
  getSeriesBySlug,
  getSeriesPosts,
  getAllCategories,
} from "@/lib/blog";
import type { BlogListItem } from "@/lib/blog";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);
  if (!series) return {};
  const title = `${series.name} Series | AstrologyPro Blog`;
  const description =
    series.description ?? `Read the complete "${series.name}" series on AstrologyPro Blog.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: series.cover_image_url ? [{ url: series.cover_image_url }] : [],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

function SeriesPostRow({ post, index }: { post: BlogListItem; index: number }) {
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="flex gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-all hover:border-[#c9a84c]/20 hover:bg-white/[0.04]">
        {/* Part number */}
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/5 text-sm font-bold text-[#c9a84c]">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            {date && <span className="text-xs text-[#b8bcd0]/40">{date}</span>}
            {post.reading_time_minutes && (
              <span className="text-xs text-[#b8bcd0]/35">{post.reading_time_minutes} min read</span>
            )}
          </div>
          <h3 className="font-semibold text-[#f5f0e8] transition-colors group-hover:text-[#c9a84c]">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="mt-1.5 line-clamp-2 text-sm text-[#b8bcd0]/60">{post.excerpt}</p>
          )}
        </div>

        <svg
          className="size-5 shrink-0 self-center text-[#b8bcd0]/30 transition-colors group-hover:text-[#c9a84c]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </article>
    </Link>
  );
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params;

  const [series, categories] = await Promise.all([
    getSeriesBySlug(slug),
    getAllCategories(),
  ]);

  if (!series) notFound();

  const posts = await getSeriesPosts(series.id);

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
          <div className="mx-auto max-w-3xl">
            <Link
              href="/blog"
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-[#b8bcd0]/50 hover:text-[#c9a84c] transition-colors"
            >
              ← All Posts
            </Link>

            {/* Series header */}
            {series.cover_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={series.cover_image_url}
                alt={series.name}
                className="mb-7 w-full rounded-2xl object-cover aspect-[16/6]"
              />
            )}

            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#c9a84c]">
              Series
            </div>
            <h1 className="mt-3 text-3xl font-bold text-[#f5f0e8] sm:text-4xl">{series.name}</h1>
            {series.description && (
              <p className="mt-4 text-base leading-7 text-[#b8bcd0]/65">{series.description}</p>
            )}

            <div className="mt-4 text-sm text-[#b8bcd0]/40">
              {posts.length} {posts.length === 1 ? "article" : "articles"} in this series
            </div>

            {/* Posts list */}
            <div className="mt-10 flex flex-col gap-3">
              {posts.length === 0 ? (
                <p className="py-10 text-center text-[#b8bcd0]/50">
                  No articles published yet.
                </p>
              ) : (
                posts.map((post, i) => (
                  <SeriesPostRow key={post.id} post={post} index={i} />
                ))
              )}
            </div>
          </div>
        </main>

        <MarketingFooter />
      </div>
    </div>
  );
}
