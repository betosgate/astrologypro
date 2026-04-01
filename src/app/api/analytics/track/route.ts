import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { divinerId, path, referrer } = body;

    if (!divinerId || !path) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const ipHash = createHash("sha256").update(ip).digest("hex");
    const userAgent = request.headers.get("user-agent") ?? null;

    const admin = createAdminClient();
    await admin.from("page_views").insert({
      diviner_id: divinerId,
      path,
      referrer: referrer || null,
      user_agent: userAgent,
      ip_hash: ipHash,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to track" }, { status: 500 });
  }
}
