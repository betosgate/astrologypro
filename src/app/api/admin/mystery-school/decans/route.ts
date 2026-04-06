import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";



/** GET — list all decans with ritual step counts */
export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: decans } = await admin
    .from("decans")
    .select("id, decan_number, sign, planet, title, start_month, start_day, end_month, end_day, description")
    .order("decan_number");

  const { data: rituals } = await admin
    .from("decan_rituals")
    .select("decan_id");

  const ritualCounts: Record<string, number> = {};
  for (const r of rituals ?? []) {
    ritualCounts[r.decan_id] = (ritualCounts[r.decan_id] ?? 0) + 1;
  }

  return NextResponse.json(
    (decans ?? []).map((d) => ({ ...d, ritualStepCount: ritualCounts[d.id] ?? 0 }))
  );
}

/** POST — add a ritual step to a decan */
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { decanId, stepOrder, stepType, content, description } = await req.json();
  if (!decanId || !content) {
    return NextResponse.json({ error: "decanId and content required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // If description provided, update the decan's description
  if (description !== undefined) {
    await admin.from("decans").update({ description }).eq("id", decanId);
  }

  if (stepOrder !== undefined && stepType && content) {
    const { data, error } = await admin
      .from("decan_rituals")
      .insert({ decan_id: decanId, step_order: stepOrder, step_type: stepType, content })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }

  return NextResponse.json({ success: true });
}
