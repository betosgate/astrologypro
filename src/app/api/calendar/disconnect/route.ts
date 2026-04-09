import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { disconnectGoogleCalendar } from "@/lib/google-calendar";
import { disconnectMsCalendar } from "@/lib/microsoft-calendar";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider, connectionId } = await req.json() as {
    provider: "google" | "microsoft";
    connectionId?: string;
  };

  const admin = createAdminClient();
  const { data: diviner } = await admin.from("diviners").select("id").eq("user_id", user.id).single();
  if (!diviner) return NextResponse.json({ error: "Diviner not found" }, { status: 404 });

  if (provider === "google") {
    await disconnectGoogleCalendar(diviner.id, connectionId);
  } else if (provider === "microsoft") {
    await disconnectMsCalendar(diviner.id, connectionId);
  } else {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
