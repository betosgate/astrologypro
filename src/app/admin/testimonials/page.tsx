import { createAdminClient } from "@/lib/supabase/admin";
import {
  TestimonialsTableClient,
  type TestimonialRow,
} from "@/components/admin/testimonials-table-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Testimonials — Admin" };

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchParams {
  q?: string;
  client?: string;
  status?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortDir?: string;
}

const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getTestimonials(
  params: SearchParams,
  pageSize: number,
): Promise<{ testimonials: TestimonialRow[]; total: number }> {
  const admin = createAdminClient();

  const q = params.q?.trim() ?? "";
  const clientName = params.client?.trim() ?? "";
  const status = params.status ?? "";
  const createdFrom = params.createdFrom ?? "";
  const createdTo = params.createdTo ?? "";
  const sortBy = params.sortBy ?? "created_at";
  const sortDir = (params.sortDir ?? "desc") as "asc" | "desc";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const columns =
    "id, diviner_id, client_name, display_alias, rating, text, service_type, service_name, title, status, is_featured, spam_score, created_at, requested_to_email, requested_to_phone_no, added_by_name, added_by_id, diviners(display_name)";

  // Build count query
  let countQuery = admin
    .from("testimonials")
    .select("id", { count: "exact", head: true });

  // Build data query
  let dataQuery = admin.from("testimonials").select(columns);

  // Apply filters to both queries
  if (status) {
    countQuery = countQuery.eq("status", status);
    dataQuery = dataQuery.eq("status", status);
  }

  if (q) {
    const filter = `title.ilike.%${q}%,text.ilike.%${q}%`;
    countQuery = countQuery.or(filter);
    dataQuery = dataQuery.or(filter);
  }

  if (clientName) {
    countQuery = countQuery.ilike("client_name", `%${clientName}%`);
    dataQuery = dataQuery.ilike("client_name", `%${clientName}%`);
  }

  if (createdFrom) {
    countQuery = countQuery.gte("created_at", createdFrom);
    dataQuery = dataQuery.gte("created_at", createdFrom);
  }

  if (createdTo) {
    countQuery = countQuery.lte("created_at", `${createdTo}T23:59:59`);
    dataQuery = dataQuery.lte("created_at", `${createdTo}T23:59:59`);
  }

  // Sort — deterministic tie-breaker with id
  const ascending = sortDir === "asc";
  dataQuery = dataQuery
    .order(sortBy, { ascending })
    .order("id", { ascending: true });

  // Paginate
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  dataQuery = dataQuery.range(from, to);

  // Execute in parallel
  const [countRes, dataRes] = await Promise.all([countQuery, dataQuery]);

  return {
    testimonials: ((dataRes.data ?? []) as unknown as TestimonialRow[]).map(
      (t) => ({
        ...t,
        diviners: Array.isArray(t.diviners) ? t.diviners[0] ?? null : t.diviners,
      })
    ),
    total: countRes.count ?? 0,
  };
}

// ─── Page component ───────────────────────────────────────────────────────────

export default async function TestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const rawPageSize = parseInt(
    params.pageSize ?? String(DEFAULT_PAGE_SIZE),
    10,
  );
  const pageSize = ALLOWED_PAGE_SIZES.includes(rawPageSize)
    ? rawPageSize
    : DEFAULT_PAGE_SIZE;

  const { testimonials, total } = await getTestimonials(params, pageSize);

  return (
    <div className="space-y-6">
      <TestimonialsTableClient
        testimonials={testimonials}
        total={total}
        searchParams={params}
        pageSize={pageSize}
      />
    </div>
  );
}
