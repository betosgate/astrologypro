import { createAdminClient } from "@/lib/supabase/admin";
import {
  MandalismTableClient,
  type MandalismContent,
  type MandalismStats,
} from "@/components/admin/mandalism-table-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mandalism Content \u2014 Admin" };

// ─── Constants ───────────────────────────────────────────────────────────────

const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;
const ALLOWED_TYPES = [
  "all",
  "live_stream",
  "video",
  "document",
  "youtube",
  "announcement",
];
const ALLOWED_STATUSES = ["all", "published", "draft"];
const ALLOWED_ACCESS = ["all", "free", "members"];
const ALLOWED_SORT_COLUMNS = [
  "title",
  "content_type",
  "access_control",
  "priority",
  "is_published",
  "created_at",
];

/** Strip characters that could break PostgREST ilike patterns. */
function sanitizeSearch(raw: string): string {
  return raw.replace(/[%_\\]/g, "").trim().slice(0, 200);
}

// ─── Data fetch ──────────────────────────────────────────────────────────────

interface FetchParams {
  q: string;
  type: string;
  status: string;
  access: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDir: "asc" | "desc";
}

async function fetchMandalismContent(
  params: FetchParams,
): Promise<{ items: MandalismContent[]; total: number; stats: MandalismStats }> {
  const admin = createAdminClient();
  const { q, type, status, access, page, pageSize, sortBy, sortDir } = params;

  // ── Stats query (unfiltered counts) ────────────────────────────────────────
  const { data: allRows } = await admin
    .from("mandalism_content")
    .select("content_type, is_published");

  const stats: MandalismStats = {
    total: 0,
    published: 0,
    draft: 0,
    counts: {},
  };

  if (allRows) {
    stats.total = allRows.length;
    for (const row of allRows) {
      if (row.is_published) stats.published++;
      else stats.draft++;
      stats.counts[row.content_type] =
        (stats.counts[row.content_type] ?? 0) + 1;
    }
  }

  // ── Count query (filtered) ─────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let countQuery: any = admin
    .from("mandalism_content")
    .select("id", { count: "exact", head: true });

  if (type !== "all") countQuery = countQuery.eq("content_type", type);
  if (status === "published") countQuery = countQuery.eq("is_published", true);
  else if (status === "draft") countQuery = countQuery.eq("is_published", false);
  if (access === "free") countQuery = countQuery.eq("access_control", "free");
  else if (access === "members") countQuery = countQuery.eq("access_control", "members");
  if (q) countQuery = countQuery.ilike("title", `%${q}%`);

  const { count: totalCount } = await countQuery;
  const total = totalCount ?? 0;

  // ── Data query ─────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin.from("mandalism_content").select(
    `id, title, content_type, access_control, is_published, priority,
     created_at, description, url, pdf_url, content_thumbnail_url,
     duration_label, start_at, end_at`,
  );

  if (type !== "all") query = query.eq("content_type", type);
  if (status === "published") query = query.eq("is_published", true);
  else if (status === "draft") query = query.eq("is_published", false);
  if (access === "free") query = query.eq("access_control", "free");
  else if (access === "members") query = query.eq("access_control", "members");
  if (q) query = query.ilike("title", `%${q}%`);

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
    console.error("[admin/mandalism] Supabase query error:", error.message);
    return { items: [], total: 0, stats };
  }

  return { items: (data ?? []) as MandalismContent[], total, stats };
}

// ─── Page component ──────────────────────────────────────────────────────────

export default async function AdminMandalismPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const rawQ = typeof params.q === "string" ? params.q : "";
  const q = sanitizeSearch(rawQ);

  const rawType = typeof params.type === "string" ? params.type : "all";
  const type = ALLOWED_TYPES.includes(rawType) ? rawType : "all";

  const rawStatus = typeof params.status === "string" ? params.status : "all";
  const status = ALLOWED_STATUSES.includes(rawStatus) ? rawStatus : "all";

  const rawAccess = typeof params.access === "string" ? params.access : "all";
  const access = ALLOWED_ACCESS.includes(rawAccess) ? rawAccess : "all";

  const rawPage =
    typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const page = Math.max(1, Number.isFinite(rawPage) ? rawPage : 1);

  const rawPageSize =
    typeof params.pageSize === "string"
      ? parseInt(params.pageSize, 10)
      : DEFAULT_PAGE_SIZE;
  const pageSize = ALLOWED_PAGE_SIZES.includes(rawPageSize)
    ? rawPageSize
    : DEFAULT_PAGE_SIZE;

  const rawSortBy =
    typeof params.sortBy === "string" ? params.sortBy : "created_at";
  const sortBy = ALLOWED_SORT_COLUMNS.includes(rawSortBy)
    ? rawSortBy
    : "created_at";

  const rawSortDir =
    typeof params.sortDir === "string" ? params.sortDir : "desc";
  const sortDir = rawSortDir === "asc" ? "asc" : "desc";

  const { items, total, stats } = await fetchMandalismContent({
    q,
    type,
    status,
    access,
    page,
    pageSize,
    sortBy,
    sortDir,
  });

  return (
    <div className="space-y-6">
      <MandalismTableClient
        items={items}
        total={total}
        stats={stats}
        searchParams={{
          q: rawQ,
          type,
          status,
          access,
          page: String(page),
          pageSize: String(pageSize),
          sortBy,
          sortDir,
        }}
      />
    </div>
  );
}
