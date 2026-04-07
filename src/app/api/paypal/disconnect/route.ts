import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/paypal/disconnect
 * Removes PayPal Connect data for the authenticated diviner.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: diviner } = await supabase
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) return NextResponse.json({ error: "Diviner not found" }, { status: 404 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("diviners")
    .update({
      paypal_merchant_id: null,
      paypal_email: null,
      paypal_onboarded: false,
      paypal_onboarded_at: null,
    })
    .eq("id", diviner.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
