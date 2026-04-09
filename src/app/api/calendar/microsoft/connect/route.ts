import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMsOAuthUrl } from "@/lib/microsoft-calendar";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: diviner } = await admin.from("diviners").select("id").eq("user_id", user.id).single();
  
  // ownerId is either the Diviner ID or the User ID
  const ownerId = diviner?.id || user.id;

  return NextResponse.redirect(await getMsOAuthUrl(ownerId));
}
