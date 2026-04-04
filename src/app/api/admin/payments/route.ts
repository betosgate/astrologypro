import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = 25;
  const offset = (page - 1) * limit;

  const admin = createAdminClient();
  const { data, error, count } = await admin
    .from("bookings")
    .select(
      "id, client_name, client_email, service_name, scheduled_at, amount_charged, stripe_payment_id, status, created_at, diviner_id",
      { count: "exact" }
    )
    .not("amount_charged", "is", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    payments: data ?? [],
    total: count ?? 0,
    page,
    hasMore: offset + limit < (count ?? 0),
  });
}
