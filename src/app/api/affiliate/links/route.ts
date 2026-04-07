import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/affiliate/links
// List referral links for the authenticated affiliate user
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const admin = createAdminClient();

  // Look up affiliate record
  const { data: affiliate, error: affError } = await admin
    .from("diviner_affiliates")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (affError) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", status: 500, detail: affError.message },
      { status: 500 }
    );
  }

  if (!affiliate) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Affiliate record not found", status: 404 },
      { status: 404 }
    );
  }

  const { data, error } = await admin
    .from("affiliate_referral_links")
    .select("id, slug, url, product_id, product_type, clicks, conversions, is_active, created_at")
    .eq("affiliate_id", affiliate.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: data ?? [] });
}
