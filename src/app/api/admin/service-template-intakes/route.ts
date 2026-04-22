import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ALLOWED_SORTS = [
  "submitted_at",
  "template_name",
  "category",
  "submission_status",
  "primary_birth_city",
] as const;

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const status = searchParams.get("status")?.trim() ?? "";
  const category = searchParams.get("category")?.trim() ?? "";
  const sortBy = searchParams.get("sort_by") ?? "submitted_at";
  const sortDir = searchParams.get("sort_dir") === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.max(1, Number.parseInt(searchParams.get("limit") ?? "25", 10));
  const safeSort = ALLOWED_SORTS.includes(sortBy as (typeof ALLOWED_SORTS)[number])
    ? sortBy
    : "submitted_at";

  const admin = createAdminClient();
  let query = admin
    .from("service_template_intake_submissions")
    .select("*", { count: "exact" })
    .order(safeSort, { ascending: sortDir === "asc" })
    .range((page - 1) * limit, (page - 1) * limit + limit - 1);

  if (status === "new" || status === "reviewed" || status === "archived") {
    query = query.eq("submission_status", status);
  }
  if (category === "astrology" || category === "tarot") {
    query = query.eq("category", category);
  }
  if (search) {
    const escaped = search.replace(/,/g, " ");
    query = query.or(
      [
        `template_name.ilike.%${escaped}%`,
        `template_slug.ilike.%${escaped}%`,
        `primary_birth_city.ilike.%${escaped}%`,
        `secondary_birth_city.ilike.%${escaped}%`,
        `question.ilike.%${escaped}%`,
        `area_of_inquiry.ilike.%${escaped}%`,
      ].join(","),
    );
  }

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    submissions: data ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}
