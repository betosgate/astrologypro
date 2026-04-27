// POST /api/dashboard/notifications/mark-read
//
// Marks all unread `notifications` for the caller as read. Uses the AUTH
// client so RLS (user_id = auth.uid()) is the policy of record — the
// service-role client is intentionally NOT used here.
//
// Spec: docs/specs/affiliate-commission-system.md §7

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function problem(status: number, title: string, detail?: string) {
  return NextResponse.json(
    {
      type: `https://httpstatuses.io/${status}`,
      title,
      status,
      ...(detail ? { detail } : {}),
    },
    { status },
  );
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return problem(401, "Unauthorized");

  const { error, count } = await supabase
    .from("notifications")
    .update({ is_read: true }, { count: "exact" })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) return problem(500, "Database error", error.message);

  return NextResponse.json({ data: { marked: count ?? 0 } });
}
