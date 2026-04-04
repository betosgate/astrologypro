import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/auth/me — returns the current user's email and id */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  return NextResponse.json({ id: user.id, email: user.email ?? null });
}
