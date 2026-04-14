import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Period = "30d" | "90d" | "1y" | "all";

function periodToDate(period: Period): string | null {
  if (period === "all") return null;
  const now = new Date();
  const days = period === "30d" ? 30 : period === "90d" ? 90 : 365;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function escapeCsv(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const period = (req.nextUrl.searchParams.get("period") ?? "90d") as Period;
  if (!["30d", "90d", "1y", "all"].includes(period)) {
    return new NextResponse("Invalid period", { status: 422 });
  }

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner?.id) {
    return new NextResponse("Diviner profile not found", { status: 404 });
  }

  const dateAfter = periodToDate(period);

  let query = admin
    .from("revenue_ledger_entries")
    .select(
      "id, source_type, source_reference, gross_amount_cents, platform_fee_cents, affiliate_commission_cents, diviner_net_amount_cents, refunded_gross_amount_cents, refunded_diviner_net_amount_cents, settlement_status, recognized_at"
    )
    .eq("diviner_id", diviner.id)
    .order("recognized_at", { ascending: false });

  if (dateAfter) {
    query = query.gte("recognized_at", dateAfter);
  }

  const { data: rows, error } = await query.limit(1000);

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  const header = ["Date", "Type", "Reference", "Gross ($)", "Platform Fee ($)", "Affiliate ($)", "Net ($)", "Refunded ($)", "Status"];
  const csvRows = [header.map(escapeCsv).join(",")];

  for (const row of rows ?? []) {
    const date = new Date(row.recognized_at as string).toISOString().slice(0, 10);
    const gross = (Number(row.gross_amount_cents ?? 0) / 100).toFixed(2);
    const fee = (Number(row.platform_fee_cents ?? 0) / 100).toFixed(2);
    const affiliate = (Number(row.affiliate_commission_cents ?? 0) / 100).toFixed(2);
    const net = (Number(row.diviner_net_amount_cents ?? 0) / 100).toFixed(2);
    const refunded = (Number(row.refunded_gross_amount_cents ?? 0) / 100).toFixed(2);
    csvRows.push(
      [
        date,
        row.source_type,
        row.source_reference,
        gross,
        fee,
        affiliate,
        net,
        refunded,
        row.settlement_status,
      ]
        .map(escapeCsv)
        .join(",")
    );
  }

  const csv = csvRows.join("\r\n");
  const filename = `finance-${diviner.display_name?.replace(/\s+/g, "-").toLowerCase() ?? "export"}-${period}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
