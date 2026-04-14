import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function rfc9457(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: `https://httpstatuses.com/${status}`, title, status, detail },
    { status }
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await getAdminUser();
  if (!adminUser) return rfc9457(403, "Forbidden", "Admin access required");

  const { id } = await params;
  if (!id) return rfc9457(400, "Bad Request", "id is required");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mundane_backtest_runs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return rfc9457(404, "Not Found", "Backtest run not found");
    return rfc9457(500, "Internal Server Error", error.message);
  }

  return NextResponse.json(data);
}
