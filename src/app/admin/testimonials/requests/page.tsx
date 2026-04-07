import { createAdminClient } from "@/lib/supabase/admin";
import { TestimonialRequestsTableClient } from "@/components/admin/testimonial-requests-table-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Testimonial Requests — Admin" };

// ─── Types ────────────────────────────────────────────────────────────────────

export type TestimonialRequestRow = {
  id: string;
  requested_to_name: string;
  requested_to_email: string;
  requested_to_phone_no: string | null;
  testimonial_for: string | null;
  notes: string | null;
  status: "pending" | "sent" | "completed" | "declined";
  created_by: string;
  created_at: string;
  updated_at: string | null;
  diviners: { display_name: string } | null;
};

interface SearchParams {
  q?: string;
  email?: string;
  status?: string;
  submittedFrom?: string;
  submittedTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortDir?: string;
}

const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getRequests(
  params: SearchParams,
  pageSize: number,
): Promise<{ requests: TestimonialRequestRow[]; total: number }> {
  const admin = createAdminClient();

  const q = params.q?.trim() ?? "";
  const email = params.email?.trim() ?? "";
  const status = params.status ?? "";
  const submittedFrom = params.submittedFrom ?? "";
  const submittedTo = params.submittedTo ?? "";
  const updatedFrom = params.updatedFrom ?? "";
  const updatedTo = params.updatedTo ?? "";
  const sortBy = params.sortBy ?? "created_at";
  const sortDir = (params.sortDir ?? "desc") as "asc" | "desc";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const columns =
    "id, requested_to_name, requested_to_email, requested_to_phone_no, testimonial_for, notes, status, created_by, created_at, updated_at, diviners(display_name)";

  let countQuery = admin
    .from("testimonial_requests")
    .select("id", { count: "exact", head: true });

  let dataQuery = admin.from("testimonial_requests").select(columns);

  if (status) {
    countQuery = countQuery.eq("status", status);
    dataQuery = dataQuery.eq("status", status);
  }

  if (q) {
    countQuery = countQuery.ilike("requested_to_name", `%${q}%`);
    dataQuery = dataQuery.ilike("requested_to_name", `%${q}%`);
  }

  if (email) {
    countQuery = countQuery.ilike("requested_to_email", `%${email}%`);
    dataQuery = dataQuery.ilike("requested_to_email", `%${email}%`);
  }

  if (submittedFrom) {
    countQuery = countQuery.gte("created_at", submittedFrom);
    dataQuery = dataQuery.gte("created_at", submittedFrom);
  }
  if (submittedTo) {
    countQuery = countQuery.lte("created_at", `${submittedTo}T23:59:59`);
    dataQuery = dataQuery.lte("created_at", `${submittedTo}T23:59:59`);
  }
  if (updatedFrom) {
    countQuery = countQuery.gte("updated_at", updatedFrom);
    dataQuery = dataQuery.gte("updated_at", updatedFrom);
  }
  if (updatedTo) {
    countQuery = countQuery.lte("updated_at", `${updatedTo}T23:59:59`);
    dataQuery = dataQuery.lte("updated_at", `${updatedTo}T23:59:59`);
  }

  const ascending = sortDir === "asc";
  dataQuery = dataQuery
    .order(sortBy, { ascending })
    .order("id", { ascending: true });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  dataQuery = dataQuery.range(from, to);

  const [countRes, dataRes] = await Promise.all([countQuery, dataQuery]);

  return {
    requests: ((dataRes.data ?? []) as unknown as TestimonialRequestRow[]).map(
      (r) => ({
        ...r,
        diviners: Array.isArray(r.diviners) ? r.diviners[0] ?? null : r.diviners,
      })
    ),
    total: countRes.count ?? 0,
  };
}

// ─── Page component ───────────────────────────────────────────────────────────

export default async function TestimonialRequestsPage({
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

  const { requests, total } = await getRequests(params, pageSize);

  return (
    <div className="space-y-6">
      <TestimonialRequestsTableClient
        requests={requests}
        total={total}
        searchParams={params}
        pageSize={pageSize}
      />
    </div>
  );
}
