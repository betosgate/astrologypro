import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPortals } from "@/lib/user-roles";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ portals: [] });
  }

  const portals = await getUserPortals(supabase, user.id);

  return NextResponse.json({ portals });
}
