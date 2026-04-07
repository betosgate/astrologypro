import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";



export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = 25;
  const offset = (page - 1) * limit;
  const paymentFrom = sp.get("payment_from");
  const paymentTo = sp.get("payment_to");

  const admin = createAdminClient();
  let query = admin
    .from("bookings")
    .select(
      "id, client_name, client_email, service_name, scheduled_at, amount_charged, stripe_payment_id, status, created_at, diviner_id",
      { count: "exact" }
    )
    .not("amount_charged", "is", null)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (paymentFrom) query = query.gte("created_at", paymentFrom);
  if (paymentTo) query = query.lte("created_at", paymentTo + "T23:59:59");

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    payments: data ?? [],
    total: count ?? 0,
    page,
    hasMore: offset + limit < (count ?? 0),
  });
}
