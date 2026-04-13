import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/onboarding/profile
 * Fetch the current user's diviner record (admin client, bypasses RLS).
 * Creates one if it doesn't exist yet.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Try to find existing diviner record
    let { data: diviner } = await admin
      .from("diviners")
      .select(
        "id, username, onboarding_step, display_name, bio, tagline, avatar_url, cover_image_url, stripe_account_id, timezone, specialties, phone, youtube_channel_id, facebook_live_url"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    // Create diviner record if missing
    if (!diviner) {
      const username =
        user.user_metadata?.username ??
        user.email?.split("@")[0]?.replace(/[^a-z0-9-]/gi, "-") ??
        `diviner-${user.id.slice(0, 8)}`;

      const { data: created, error: createErr } = await admin
        .from("diviners")
        .insert({
          user_id: user.id,
          username,
          display_name: user.user_metadata?.name ?? username,
          is_active: true,
          onboarding_step: 1,
        })
        .select(
          "id, username, onboarding_step, display_name, bio, tagline, avatar_url, cover_image_url, stripe_account_id, timezone, specialties, phone, youtube_channel_id, facebook_live_url"
        )
        .single();

      if (createErr) {
        console.error("[onboarding/profile] create diviner error:", createErr);
        return NextResponse.json(
          { error: "Failed to create diviner record: " + createErr.message },
          { status: 500 }
        );
      }
      diviner = created;
    }

    return NextResponse.json({ diviner });
  } catch (err) {
    console.error("[onboarding/profile] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * PATCH /api/onboarding/profile
 * Update diviner profile fields + save onboarding step (admin client).
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const admin = createAdminClient();

    // Build update object from allowed fields
    const update: Record<string, unknown> = {};
    const allowed = [
      "display_name",
      "bio",
      "tagline",
      "avatar_url",
      "cover_image_url",
      "timezone",
      "specialties",
      "phone",
      "youtube_channel_id",
      "facebook_live_url",
      "onboarding_step",
    ];

    for (const key of allowed) {
      if (key in body) {
        update[key] = body[key];
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data: diviner, error } = await admin
      .from("diviners")
      .update(update)
      .eq("user_id", user.id)
      .select("id")
      .single();

    if (error) {
      console.error("[onboarding/profile] update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ divinerId: diviner.id });
  } catch (err) {
    console.error("[onboarding/profile] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
