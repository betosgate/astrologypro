import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_PLATFORMS = [
  "facebook",
  "twitter",
  "whatsapp",
  "linkedin",
  "instagram",
  "tiktok",
] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, platform } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid token" },
        { status: 400 }
      );
    }

    if (
      !platform ||
      !VALID_PLATFORMS.includes(platform as (typeof VALID_PLATFORMS)[number])
    ) {
      return NextResponse.json(
        { error: "Invalid platform" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Fetch current share batch
    const { data: batch, error: fetchError } = await admin
      .from("share_batches")
      .select("id, shares")
      .eq("token", token)
      .single();

    if (fetchError || !batch) {
      return NextResponse.json(
        { error: "Share batch not found" },
        { status: 404 }
      );
    }

    // Merge in the new platform share timestamp
    const currentShares =
      typeof batch.shares === "object" && batch.shares !== null
        ? batch.shares
        : {};
    const updatedShares = {
      ...currentShares,
      [platform]: new Date().toISOString(),
    };

    const { error: updateError } = await admin
      .from("share_batches")
      .update({ shares: updatedShares })
      .eq("id", batch.id);

    if (updateError) {
      console.error("[Share Track] Failed to update:", updateError);
      return NextResponse.json(
        { error: "Failed to track share" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      shares: updatedShares,
    });
  } catch (err) {
    console.error("[Share Track] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
