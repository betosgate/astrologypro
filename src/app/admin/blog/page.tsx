import { createAdminClient } from "@/lib/supabase/admin";
import { BlogTableClient, type BlogPost } from "@/components/admin/blog-table-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Blog — Admin" };

// ─── Constants ───────────────────────────────────────────────────────────────

const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;
const ALLOWED_STATUSES = [
  "all",
  "draft",
  "in_review",
  "approved",
  "scheduled",
  "published",
  "unpublished",
  "archived",
];
const ALLOWED_SORT_COLUMNS = [
  "title",
  "status",
  "published_at",
  "updated_at",
];

/** Strip characters that could break PostgREST ilike patterns. */
function sanitizeSearch(raw: string): string {
  return raw.replace(/[%_\\]/g, "").trim().slice(0, 200);
}

// ─── Data fetch ──────────────────────────────────────────────────────────────

interface FetchParams {
  q: string;
  status: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDir: "asc" | "desc";
}

async function fetchBlogPosts(
  params: FetchParams,
): Promise<{ posts: BlogPost[]; total: number }> {
  const admin = createAdminClient();
  const { q, status, page, pageSize, sortBy, sortDir } = params;

  // ── Count query ────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let countQuery: any = admin
    .from("blog_posts")
    .select("id", { count: "exact", head: true });

  if (status !== "all") {
    countQuery = countQuery.eq("status", status);
  }
  if (q) {
    countQuery = countQuery.ilike("title", `%${q}%`);
  }

  const { count: totalCount } = await countQuery;
  const total = totalCount ?? 0;

  // ── Data query ─────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin.from("blog_posts").select(
    `id, title, slug, status, excerpt, featured, hero, reading_time_minutes,
     published_at, scheduled_at, updated_at,
     author:blog_authors(id, name, avatar_url),
     blog_post_categories(category_id, blog_categories(id, name, slug)),
     blog_post_tags(tag_id, blog_tags(id, name, slug))`,
  );

  if (status !== "all") {
    query = query.eq("status", status);
  }
  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  // Sort + deterministic tie-breaker
  query = query
    .order(sortBy, { ascending: sortDir === "asc" })
    .order("id", { ascending: true });

  // Pagination via range
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error } = await query;

  if (error) {
    console.error("[admin/blog] Supabase query error:", error.message);
    return { posts: [], total: 0 };
  }

  return { posts: (data ?? []) as BlogPost[], total };
}

// ─── Page component ──────────────────────────────────────────────────────────

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const rawQ = typeof params.q === "string" ? params.q : "";
  const q = sanitizeSearch(rawQ);

  const rawStatus = typeof params.status === "string" ? params.status : "all";
  const status = ALLOWED_STATUSES.includes(rawStatus) ? rawStatus : "all";

  const rawPage = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const page = Math.max(1, Number.isFinite(rawPage) ? rawPage : 1);

  const rawPageSize = typeof params.pageSize === "string" ? parseInt(params.pageSize, 10) : DEFAULT_PAGE_SIZE;
  const pageSize = ALLOWED_PAGE_SIZES.includes(rawPageSize) ? rawPageSize : DEFAULT_PAGE_SIZE;

  const rawSortBy = typeof params.sortBy === "string" ? params.sortBy : "updated_at";
  const sortBy = ALLOWED_SORT_COLUMNS.includes(rawSortBy) ? rawSortBy : "updated_at";

  const rawSortDir = typeof params.sortDir === "string" ? params.sortDir : "desc";
  const sortDir = rawSortDir === "asc" ? "asc" : "desc";

  const { posts, total } = await fetchBlogPosts({
    q,
    status,
    page,
    pageSize,
    sortBy,
    sortDir: sortDir as "asc" | "desc",
  });

  return (
    <div className="space-y-6">
      <BlogTableClient
        posts={posts}
        total={total}
        searchParams={{
          q: rawQ,
          status,
          page: String(page),
          pageSize: String(pageSize),
          sortBy,
          sortDir,
        }}
      />
    </div>
  );
}
