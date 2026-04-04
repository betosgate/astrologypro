import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data } = await admin.from("blog_posts").select("title, excerpt").eq("slug", slug).eq("is_published", true).single();
  if (!data) return {};
  return { title: `${data.title} | AstrologyPro Blog`, description: data.excerpt ?? undefined };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data: post } = await admin
    .from("blog_posts")
    .select("id, title, slug, excerpt, content, category, image_url, published_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!post) notFound();

  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#06080f]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(88,28,135,0.18)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_85%,rgba(201,168,76,0.09)_0%,transparent_55%)]" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col">
        <MarketingHeader />

        <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/blog"
              className="mb-8 inline-flex items-center gap-1.5 text-sm text-[#b8bcd0]/60 hover:text-[#c9a84c] transition-colors"
            >
              ← Back to Blog
            </Link>

            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.title}
                className="mb-8 w-full rounded-2xl object-cover aspect-video"
              />
            )}

            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-2.5 py-0.5 text-xs font-semibold text-[#c9a84c]">
                {post.category}
              </span>
              {publishedDate && (
                <span className="text-xs text-[#b8bcd0]/40">{publishedDate}</span>
              )}
            </div>

            <h1 className="text-3xl font-bold leading-tight text-[#f5f0e8] sm:text-4xl">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="mt-4 text-lg leading-relaxed text-[#b8bcd0]/70">{post.excerpt}</p>
            )}

            {post.content && (
              <div
                className="mt-10 prose prose-invert prose-sm sm:prose-base max-w-none
                  prose-headings:text-[#f5f0e8] prose-p:text-[#b8bcd0]/80
                  prose-a:text-[#c9a84c] prose-strong:text-[#f5f0e8]
                  prose-li:text-[#b8bcd0]/80"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            )}
          </div>
        </main>

        <MarketingFooter />
      </div>
    </div>
  );
}
