import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared server-pagination helper for the admin Training Management list
 * endpoints (programs, categories, lessons, quizzes).
 *
 * Accepts the same query-param contract across all four entity types:
 *   page      — 1-based page number (default 1)
 *   pageSize  — rows per page (default 10, clamped to 1-100)
 *   search    — free-text ilike on the primary name/title + description
 *   status    — "active" | "inactive" | omitted/all
 *   sortBy    — column name (validated against allowlist per entity)
 *   sortDir   — "asc" | "desc" (default "asc")
 *
 * Returns `{ rows, total, page, pageSize }` so the client table can
 * render the pager from authoritative server counts instead of
 * loading every row into the browser.
 *
 * Uses the Supabase PostgREST `count: "exact"` option to get the
 * total in the same round-trip as the data query (no N+1).
 */

export interface PaginatedListParams {
  page: number;
  pageSize: number;
  search: string | null;
  status: "active" | "inactive" | null;
  sortBy: string | null;
  sortDir: "asc" | "desc";
}

export interface PaginatedListResult<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Parse common pagination/filter params from URLSearchParams. */
export function parsePaginationParams(sp: URLSearchParams): PaginatedListParams {
  const rawPage = parseInt(sp.get("page") ?? "1", 10);
  const rawPageSize = parseInt(sp.get("pageSize") ?? "10", 10);

  return {
    page: Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1,
    pageSize: Number.isFinite(rawPageSize)
      ? Math.max(1, Math.min(rawPageSize, 100))
      : 10,
    search: sp.get("search")?.trim() || null,
    status:
      sp.get("status") === "active"
        ? "active"
        : sp.get("status") === "inactive"
          ? "inactive"
          : null,
    sortBy: sp.get("sortBy") || null,
    sortDir: sp.get("sortDir") === "desc" ? "desc" : "asc",
  };
}

/**
 * Run a paginated list query against a single Supabase table.
 *
 * @param admin        — the admin Supabase client (bypasses RLS)
 * @param table        — the table name (e.g. "training_programs")
 * @param selectCols   — the SELECT column list string
 * @param params       — parsed pagination/filter params
 * @param searchFields — columns to ilike-match against `params.search`
 * @param allowedSorts — map of allowed sortBy values → actual column names
 * @param defaultSort  — { column, ascending } fallback when sortBy is null
 * @param extraFilter  — optional callback to add entity-specific filters
 */
export async function paginatedList<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: SupabaseClient<any, any, any>,
  table: string,
  selectCols: string,
  params: PaginatedListParams,
  searchFields: string[],
  allowedSorts: Record<string, string>,
  defaultSort: { column: string; ascending: boolean },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extraFilter?: (q: any) => any,
): Promise<PaginatedListResult<T>> {
  const { page, pageSize, search, status, sortBy, sortDir } = params;

  // Build the query with count: "exact" so PostgREST returns the total in
  // the response headers alongside the paginated data.
  let query = admin.from(table).select(selectCols, { count: "exact" });

  // Status filter
  if (status === "active") query = query.eq("is_active", true);
  else if (status === "inactive") query = query.eq("is_active", false);

  // Search filter — OR across search fields
  if (search && searchFields.length > 0) {
    const escaped = search.replace(/[%_]/g, (c) => `\\${c}`);
    const pattern = `%${escaped}%`;
    const conditions = searchFields.map((f) => `${f}.ilike.${pattern}`);
    query = query.or(conditions.join(","));
  }

  // Extra entity-specific filters (e.g. created_from/to)
  if (extraFilter) {
    query = extraFilter(query);
  }

  // Sorting — validate against allowlist, fall back to default
  const resolvedCol = sortBy && allowedSorts[sortBy]
    ? allowedSorts[sortBy]
    : defaultSort.column;
  const resolvedAsc = sortBy && allowedSorts[sortBy]
    ? sortDir === "asc"
    : defaultSort.ascending;

  query = query.order(resolvedCol, { ascending: resolvedAsc });
  // Deterministic tie-breaker (engineering rule #16)
  if (resolvedCol !== "id") {
    query = query.order("id", { ascending: true });
  }

  // Pagination — range is 0-based inclusive
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  return {
    rows: (data ?? []) as T[],
    total: count ?? 0,
    page,
    pageSize,
  };
}
