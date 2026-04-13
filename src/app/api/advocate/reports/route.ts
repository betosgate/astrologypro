import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PERIOD_DAYS: Record<string, number | null> = {
  "30d": 30,
  "90d": 90,
  "1y": 365,
  all: null,
};

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: advocate } = await supabase
    .from("social_advocates")
    .select(
      "id, referral_code, total_referrals, total_earned, total_paid, commission_percent"
    )
    .eq("user_id", user.id)
    .single();

  if (!advocate) {
    return NextResponse.json({ error: "Advocate not found" }, { status: 404 });
  }

  const period = req.nextUrl.searchParams.get("period") ?? "all";
  const days = PERIOD_DAYS[period] ?? null;

  const adminSupabase = createAdminClient();

  // Build referrals query with optional date filter
  let referralsQuery = adminSupabase
    .from("affiliate_referrals")
    .select(
      "id, commission_amount, status, created_at, booking_id, bookings(scheduled_at, clients(full_name, email), services(name))"
    )
    .eq("affiliate_id", advocate.id)
    .order("created_at", { ascending: false });

  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    referralsQuery = referralsQuery.gte("created_at", since.toISOString());
  }

  const { data: referrals, error: refError } = await referralsQuery.limit(500);

  if (refError) {
    return NextResponse.json(
      { error: "Failed to fetch referrals" },
      { status: 500 }
    );
  }

  const allRefs = referrals ?? [];

  // Compute summary
  const totalEarned = Number(advocate.total_earned ?? 0);
  const totalPaid = Number(advocate.total_paid ?? 0);
  const pendingAmount = totalEarned - totalPaid;

  // Conversion rate: referrals that resulted in earned/paid vs total
  const convertedCount = allRefs.filter(
    (r) => r.status === "earned" || r.status === "paid"
  ).length;
  const conversionRate =
    allRefs.length > 0
      ? Math.round((convertedCount / allRefs.length) * 1000) / 10
      : 0;

  const summary = {
    totalReferrals: advocate.total_referrals ?? 0,
    totalEarned,
    totalPaid,
    pendingAmount,
    commissionRate: Number(advocate.commission_percent ?? 10),
    referralCode: advocate.referral_code,
    conversionRate,
  };

  // Map referrals for response
  type BookingJoin = {
    scheduled_at?: string;
    clients?: { full_name?: string; email?: string } | null;
    services?: { name?: string } | null;
  };

  const referralRows = allRefs.map((r) => {
    const booking = r.bookings as unknown as BookingJoin | null;
    return {
      id: r.id,
      clientName:
        booking?.clients?.full_name ?? booking?.clients?.email ?? "—",
      bookingDate: booking?.scheduled_at
        ? new Date(booking.scheduled_at).toISOString().slice(0, 10)
        : null,
      commissionAmount: Number(r.commission_amount ?? 0),
      status: r.status,
      serviceName: booking?.services?.name ?? "—",
    };
  });

  // Monthly aggregation
  const monthlyMap = new Map<
    string,
    { referrals: number; earned: number; paid: number }
  >();
  for (const r of allRefs) {
    const d = new Date(r.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthlyMap.get(key) ?? { referrals: 0, earned: 0, paid: 0 };
    entry.referrals += 1;
    const amt = Number(r.commission_amount ?? 0);
    if (r.status === "paid") {
      entry.paid += amt;
    }
    entry.earned += amt;
    monthlyMap.set(key, entry);
  }

  const monthly = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));

  // Status breakdown
  const statusBreakdown = { pending: 0, earned: 0, paid: 0 };
  for (const r of allRefs) {
    const s = r.status as keyof typeof statusBreakdown;
    if (s in statusBreakdown) {
      statusBreakdown[s] += 1;
    }
  }

  return NextResponse.json({
    summary,
    referrals: referralRows,
    monthly,
    statusBreakdown,
  });
}
