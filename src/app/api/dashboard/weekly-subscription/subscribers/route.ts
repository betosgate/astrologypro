import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["active", "cancelled", "past_due", "unpaid"] as const;
type SubscriberStatus = (typeof VALID_STATUSES)[number];

function problemDetail(status: number, title: string, detail: string): NextResponse {
  return NextResponse.json(
    { type: "about:blank", title, detail, status },
    { status, headers: { "Content-Type": "application/problem+json" } }
  );
}

async function getAuthenticatedDiviner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return diviner ?? null;
}

// GET /api/dashboard/weekly-subscription/subscribers
// Query params: status (active|cancelled|all), page (1-based), limit (default 20)
export async function GET(req: NextRequest) {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) return problemDetail(401, "Unauthorized", "Authentication required.");

  const sp = req.nextUrl.searchParams;
  const statusFilter = sp.get("status") ?? "all";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  let query = admin
    .from("weekly_subscription_subscribers")
    .select(
      "id, email, name, status, subscribed_at, cancelled_at, current_period_end, stripe_subscription_id",
      { count: "exact" }
    )
    .eq("diviner_id", diviner.id)
    .order("subscribed_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (statusFilter !== "all" && VALID_STATUSES.includes(statusFilter as SubscriberStatus)) {
    query = query.eq("status", statusFilter);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[GET /api/dashboard/weekly-subscription/subscribers]", error);
    return problemDetail(500, "Internal Server Error", error.message);
  }

  const totalPages = count != null ? Math.ceil(count / limit) : null;

  return NextResponse.json({
    subscribers: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages,
  });
}
