import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── Problem Details helper ───────────────────────────────────────────────────

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: `https://httpstatus.es/${status}`, title, status, detail },
    { status }
  );
}

// ─── GET — list all active queues ────────────────────────────────────────────

export async function GET(): Promise<NextResponse> {
  const admin_user = await getAdminUser();
  if (!admin_user) {
    return problem(401, "Unauthorized", "Admin access required.");
  }

  const admin = createAdminClient();

  const { data: queues, error } = await admin
    .from("ticket_queues")
    .select("id, name, team_type, is_active, created_at")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    return problem(500, "Database Error", error.message);
  }

  return NextResponse.json({ queues: queues ?? [] });
}
