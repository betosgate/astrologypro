/**
 * GET /api/admin/landing-pages/section-types  — list all section type configs
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const admin = createAdminClient();
  const { data } = await admin.from("admin_users").select("id").eq("user_id", user.id).maybeSingle();
  return !!data;
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ status: 403 }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("section_type_config")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ status: 500, detail: error.message }, { status: 500 });

  return NextResponse.json({ section_types: data ?? [] });
}
