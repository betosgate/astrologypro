import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/affiliates/[id]/commissions/export
// Returns all commissions for the affiliate as a CSV download (admin only).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("affiliate_commissions")
    .select(
      "created_at, order_reference, commission_amount_cents, status, payout_id"
    )
    .eq("affiliate_id", id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/500",
        title: "Database error",
        detail: error.message,
      },
      { status: 500 }
    );
  }

  const rows = data ?? [];

  const header = "date,order_id,commission_amount,status,payout_id\n";
  const body = rows
    .map((r) => {
      const date = r.created_at ? new Date(r.created_at).toISOString().split("T")[0] : "";
      const orderId = r.order_reference ?? "";
      const amount = typeof r.commission_amount_cents === "number"
        ? (r.commission_amount_cents / 100).toFixed(2)
        : "0.00";
      const status = r.status ?? "";
      const payoutId = r.payout_id ?? "";
      return [date, orderId, amount, status, payoutId]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    })
    .join("\n");

  const csv = header + body;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="commissions-${id}.csv"`,
    },
  });
}
