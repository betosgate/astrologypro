import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasValidMysterySchoolBilling } from "@/lib/mystery-school/access";

export const dynamic = "force-dynamic";

/**
 * GET /api/mystery-school/student-status
 *
 * Lightweight read used by the Mystery School resubscribe page to decide
 * whether the visitor has an existing student row to resume from. Returns
 * just the fields the resubscribe UI needs — never the full row.
 *
 * Response shape:
 * {
 *   exists: boolean,
 *   status: string | null,
 *   entry_quarter: string | null,
 *   entry_year: number | null,
 *   billing_valid: boolean,
 *   access_expires_at: string | null
 * }
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: student } = await supabase
    .from("mystery_school_students")
    .select(
      "status, entry_quarter, entry_year, access_expires_at, stripe_subscription_id, one_time_fee_paid, one_time_fee_amount"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (!student) {
    return NextResponse.json({
      exists: false,
      status: null,
      entry_quarter: null,
      entry_year: null,
      billing_valid: false,
      access_expires_at: null,
    });
  }

  return NextResponse.json({
    exists: true,
    status: student.status,
    entry_quarter: student.entry_quarter,
    entry_year: student.entry_year,
    billing_valid: hasValidMysterySchoolBilling(student),
    access_expires_at: student.access_expires_at,
  });
}
