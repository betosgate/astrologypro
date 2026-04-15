import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["solar", "lunar"] as const;

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const type = sp.get("type") ?? "";
  const fromDate = sp.get("from_date") ?? "";
  const toDate = sp.get("to_date") ?? "";
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));

  if (type && !(VALID_TYPES as readonly string[]).includes(type)) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/422",
        title: "Validation Error",
        status: 422,
        detail: "type must be 'solar' or 'lunar'",
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_eclipses")
    .select(
      "id, date_utc, type, subtype, saros_series, saros_member, degree_ecliptic, sign, magnitude, is_visible_globally, notes",
      { count: "exact" }
    );

  if (type) {
    query = query.eq("type", type);
  }
  if (fromDate) {
    query = query.gte("date_utc", fromDate);
  }
  if (toDate) {
    query = query.lte("date_utc", toDate);
  }

  query = query.order("date_utc", { ascending: true }).limit(limit);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/500",
        title: "Internal Server Error",
        status: 500,
        detail: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ eclipses: data ?? [], total: count ?? 0 });
}
