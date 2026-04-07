import { createAdminClient } from "@/lib/supabase/admin";
import {
  ActivityLogTableClient,
  type ActivityLogEntry,
} from "@/components/admin/activity-log-table-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Activity Log — Admin" };

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityLogSearchParams {
  q?: string;
  action?: string;
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortDir?: string;
  dateFrom?: string;
  dateTo?: string;
}

const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 50;

const ALLOWED_SORT_COLUMNS = [
  "admin_user_id",
  "target_user_id",
  "action_type",
  "ip_address",
  "created_at",
];

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getActivityLog(params: ActivityLogSearchParams) {
  const admin = createAdminClient();

  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const rawPageSize = parseInt(
    params.pageSize ?? String(DEFAULT_PAGE_SIZE),
    10,
  );
  const pageSize = ALLOWED_PAGE_SIZES.includes(rawPageSize)
    ? rawPageSize
    : DEFAULT_PAGE_SIZE;

  const sortBy = ALLOWED_SORT_COLUMNS.includes(params.sortBy ?? "")
    ? params.sortBy!
    : "created_at";
  const sortDir = params.sortDir === "asc" ? "asc" : "desc";
  const ascending = sortDir === "asc";

  const q = params.q?.trim() ?? "";
  const actionFilter = params.action ?? "all";
  const dateFrom = params.dateFrom?.trim() ?? "";
  const dateTo = params.dateTo?.trim() ?? "";

  const offset = (page - 1) * pageSize;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("admin_activity_log")
    .select(
      "id, admin_user_id, target_user_id, action_type, details, ip_address, created_at",
      { count: "exact" },
    )
    .order(sortBy, { ascending })
    .order("id", { ascending: false })
    .range(offset, offset + pageSize - 1);

  // Action type filter
  if (actionFilter && actionFilter !== "all") {
    query = query.eq("action_type", actionFilter);
  }

  // Date range filters
  if (dateFrom) {
    query = query.gte("created_at", dateFrom);
  }
  if (dateTo) {
    query = query.lte("created_at", dateTo + "T23:59:59Z");
  }

  // Text search on admin_user_id, target_user_id, or details (cast to text)
  if (q) {
    query = query.or(
      [
        `admin_user_id.ilike.%${q}%`,
        `target_user_id.ilike.%${q}%`,
        `details::text.ilike.%${q}%`,
      ].join(","),
    );
  }

  const { data, count, error } = await query;
  if (error) {
    console.error("[admin/activity-log page]", error);
  }

  return {
    entries: (data ?? []) as ActivityLogEntry[],
    total: count ?? 0,
    page,
    pageSize,
    sortBy,
    sortDir,
    q,
    action: actionFilter,
    dateFrom,
    dateTo,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<ActivityLogSearchParams>;
}) {
  const params = await searchParams;
  const {
    entries,
    total,
    page,
    pageSize,
    sortBy,
    sortDir,
    q,
    action,
    dateFrom,
    dateTo,
  } = await getActivityLog(params);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <ActivityLogTableClient
      entries={entries}
      total={total}
      page={page}
      pageSize={pageSize}
      totalPages={totalPages}
      sortBy={sortBy}
      sortDir={sortDir}
      q={q}
      action={action}
      dateFrom={dateFrom}
      dateTo={dateTo}
    />
  );
}
