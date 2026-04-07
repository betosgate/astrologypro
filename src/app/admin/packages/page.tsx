import { createAdminClient } from "@/lib/supabase/admin";
import {
  PackagesTableClient,
  type PackageRow,
} from "@/components/admin/packages-table-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Packages — Admin" };

// ─── Types ──────────────────────────────────────────────────────────────────

interface SearchParams {
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortDir?: string;
  createdFrom?: string;
  createdTo?: string;
}

const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;

// ─── Data fetch ─────────────────────────────────────────────────────────────

async function getPackages(params: SearchParams) {
  const admin = createAdminClient();

  const sortBy = params.sortBy ?? "created_at";
  const sortDir = (params.sortDir ?? "desc") as "asc" | "desc";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const rawPageSize = parseInt(params.pageSize ?? String(DEFAULT_PAGE_SIZE), 10);
  const pageSize = ALLOWED_PAGE_SIZES.includes(rawPageSize) ? rawPageSize : DEFAULT_PAGE_SIZE;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Map sortBy to valid DB column
  const SORT_COLUMNS: Record<string, string> = {
    name: "name",
    price: "price",
    is_active: "is_active",
    created_at: "created_at",
  };
  const sortColumn = SORT_COLUMNS[sortBy] ?? "created_at";

  let query = admin
    .from("packages")
    .select("id, name, description, price, features, is_active, created_at", {
      count: "exact",
    })
    .order(sortColumn, { ascending: sortDir === "asc" })
    .order("id", { ascending: false })
    .range(from, to);

  // Date filters on created_at
  if (params.createdFrom) {
    query = query.gte("created_at", params.createdFrom);
  }
  if (params.createdTo) {
    query = query.lte("created_at", params.createdTo + "T23:59:59Z");
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("Failed to fetch packages:", error.message);
    return { packages: [], total: 0, pageSize };
  }

  const packages: PackageRow[] = (
    (data ?? []) as Array<Record<string, unknown>>
  ).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    description: (p.description as string | null) ?? null,
    price: p.price as number,
    features: (p.features as string[] | null) ?? null,
    is_active: p.is_active as boolean,
    created_at: p.created_at as string,
  }));

  return { packages, total: count ?? 0, pageSize };
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function AdminPackagesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { packages, total, pageSize } = await getPackages(params);

  return (
    <div className="space-y-6">
      <PackagesTableClient
        packages={packages}
        total={total}
        searchParams={params}
        pageSize={pageSize}
      />
    </div>
  );
}
