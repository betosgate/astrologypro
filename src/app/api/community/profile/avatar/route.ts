import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/community/profile/avatar
 *
 * Persists an uploaded avatar URL onto the authenticated user's
 * auth.users.user_metadata.avatar_url. This is intentionally narrow —
 * it does not touch any other metadata keys.
 *
 * The Community Journey Progress completion check for the
 * "profile_photo" milestone reads user.user_metadata?.avatar_url, so the
 * value MUST be persisted here (not only on community_members) for the
 * milestone to flip to complete.
 *
 * Body: { avatar_url: string }
 *   - Non-empty string: sets the URL on user_metadata.
 *   - Empty string or null: clears the URL.
 *
 * Response: { success: true, avatar_url: string | null }
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

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const raw = body.avatar_url;

    // Accept string, empty string, or null; reject anything else.
    if (raw !== null && typeof raw !== "string") {
      return NextResponse.json(
        { error: "avatar_url must be a string or null" },
        { status: 422 }
      );
    }

    const trimmed = typeof raw === "string" ? raw.trim() : "";
    const nextAvatarUrl = trimmed.length > 0 ? trimmed : null;

    // Basic URL shape check when a value is provided. Keep it lenient —
    // the storage upload step already produced a public URL we trust.
    if (nextAvatarUrl && !/^https?:\/\//i.test(nextAvatarUrl)) {
      return NextResponse.json(
        { error: "avatar_url must be an http(s) URL" },
        { status: 422 }
      );
    }

    const admin = createAdminClient();

    // Merge only avatar_url into user_metadata — preserve everything else.
    const existingMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const nextMetadata = { ...existingMetadata, avatar_url: nextAvatarUrl };

    const { error } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: nextMetadata,
    });

    if (error) {
      console.error("[community/profile/avatar] update failed:", error);
      return NextResponse.json(
        { error: "Failed to update avatar" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, avatar_url: nextAvatarUrl });
  } catch (err) {
    console.error("[community/profile/avatar] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
