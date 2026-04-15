import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SPECIALTIES } from "@/lib/constants";
import { syncProfileAcrossRoles } from "@/lib/profile-sync";
import {
  isPublicSectionBlocked,
  normalizePublishPolicy,
  publishBlockMessage,
} from "@/lib/diviner-publishing";
import {
  getRoleServicePackages,
  resolveRoleServicePackage,
} from "@/lib/role-service-packages";

export const dynamic = "force-dynamic";

// ── Allowed specialty values (compile-time set for O(1) lookup) ──────────
const ALLOWED_SPECIALTIES = new Set<string>(SPECIALTIES);

// ── Columns returned by GET ─────────────────────────────────────────────
const PROFILE_SELECT =
  "id, display_name, username, bio, tagline, specialties, avatar_url, cover_image_url, credentials, phone, timezone, youtube_channel_id, facebook_live_url, show_public_session_counts, public_session_counts_override, public_session_counts_override_reason, service_package_code";

// ── GET /api/dashboard/profile ──────────────────────────────────────────
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const packages = await getRoleServicePackages();
  const { data, error } = await admin
    .from("diviners")
    .select(PROFILE_SELECT)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Profile not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    profile: {
      ...data,
      service_package: resolveRoleServicePackage(packages, data.service_package_code),
    },
  });
}

// ── PATCH /api/dashboard/profile ────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  // 1. Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // 3. Validate & build update payload
  const errors: string[] = [];
  const updates: Record<string, unknown> = {};

  // display_name — required if provided, max 100
  if (body.display_name !== undefined) {
    const name = String(body.display_name).trim();
    if (name.length === 0) {
      errors.push("display_name is required and cannot be empty");
    } else if (name.length > 100) {
      errors.push("display_name must be 100 characters or fewer");
    } else {
      updates.display_name = name;
    }
  }

  // bio — max 500
  if (body.bio !== undefined) {
    const bio = String(body.bio ?? "").trim();
    if (bio.length > 500) {
      errors.push("bio must be 500 characters or fewer");
    } else {
      updates.bio = bio || null;
    }
  }

  // tagline — max 150
  if (body.tagline !== undefined) {
    const tagline = String(body.tagline ?? "").trim();
    if (tagline.length > 150) {
      errors.push("tagline must be 150 characters or fewer");
    } else {
      updates.tagline = tagline || null;
    }
  }

  // specialties — must be from allowed list
  if (body.specialties !== undefined) {
    if (!Array.isArray(body.specialties)) {
      errors.push("specialties must be an array");
    } else {
      const invalid = (body.specialties as string[]).filter(
        (s) => !ALLOWED_SPECIALTIES.has(s)
      );
      if (invalid.length > 0) {
        errors.push(`Invalid specialties: ${invalid.join(", ")}`);
      } else {
        updates.specialties = body.specialties;
      }
    }
  }

  // avatar_url — string
  if (body.avatar_url !== undefined) {
    updates.avatar_url = body.avatar_url ? String(body.avatar_url) : null;
  }

  // phone — string
  if (body.phone !== undefined) {
    updates.phone = body.phone ? String(body.phone).trim() : null;
  }

  // timezone — string
  if (body.timezone !== undefined) {
    updates.timezone = body.timezone ? String(body.timezone).trim() : null;
  }

  // show_public_session_counts — boolean
  if (body.show_public_session_counts !== undefined) {
    updates.show_public_session_counts = body.show_public_session_counts === true;
    updates.public_session_counts_updated_at = new Date().toISOString();
  }

  // credentials — string
  if (body.credentials !== undefined) {
    updates.credentials = body.credentials
      ? String(body.credentials).trim()
      : null;
  }

  // cover_image_url — string
  if (body.cover_image_url !== undefined) {
    updates.cover_image_url = body.cover_image_url
      ? String(body.cover_image_url)
      : null;
  }

  // youtube_channel_id — string, max 30 chars
  if (body.youtube_channel_id !== undefined) {
    const ytId = String(body.youtube_channel_id ?? "").trim();
    if (ytId.length > 30) {
      errors.push("youtube_channel_id must be 30 characters or fewer");
    } else {
      updates.youtube_channel_id = ytId || null;
    }
  }

  // facebook_live_url — string URL
  if (body.facebook_live_url !== undefined) {
    const fbUrl = String(body.facebook_live_url ?? "").trim();
    if (fbUrl && !fbUrl.startsWith("http")) {
      errors.push("facebook_live_url must be a valid URL");
    } else {
      updates.facebook_live_url = fbUrl || null;
    }
  }

  // Return validation errors
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  // Nothing to update
  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields provided" },
      { status: 400 }
    );
  }

  // 4. Publishing restrictions for public profile fields
  const admin = createAdminClient();
  const { data: divinerPolicyRow } = await admin
    .from("diviners")
    .select("id, public_publish_blocked, blocked_public_sections, blocked_media_types, publish_block_reason, show_public_session_counts, public_session_counts_override, public_session_counts_override_reason")
    .eq("user_id", user.id)
    .maybeSingle();
  const publishPolicy = normalizePublishPolicy(divinerPolicyRow as Record<string, unknown> | null);
  const touchesHeroFields =
    body.display_name !== undefined ||
    body.tagline !== undefined ||
    body.specialties !== undefined ||
    body.avatar_url !== undefined ||
    body.cover_image_url !== undefined ||
    body.youtube_channel_id !== undefined ||
    body.facebook_live_url !== undefined ||
    body.credentials !== undefined;
  const touchesBioFields = body.bio !== undefined;

  if (
    (touchesHeroFields && isPublicSectionBlocked(publishPolicy, "hero")) ||
    (touchesBioFields && isPublicSectionBlocked(publishPolicy, "bio"))
  ) {
    return NextResponse.json(
      {
        error: publishBlockMessage(
          publishPolicy,
          "Public profile publishing for this section has been blocked by an administrator."
        ),
      },
      { status: 403 }
    );
  }

  // 5. Write with admin client
  const { error } = await admin
    .from("diviners")
    .update(updates)
    .eq("user_id", user.id);

  if (error) {
    console.error("[diviner-profile] Update failed:", error.message);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }

  // 6. Fire-and-forget sync to other role tables
  syncProfileAcrossRoles(
    user.id,
    {
      display_name: updates.display_name as string | undefined,
      bio: updates.bio as string | undefined,
      avatar_url: updates.avatar_url as string | undefined,
      specialties: updates.specialties as string[] | undefined,
      phone: updates.phone as string | undefined,
      timezone: updates.timezone as string | undefined,
    },
    "diviners"
  ).catch((err) =>
    console.error("[diviner-profile] Sync error:", err)
  );

  // 7. Return updated profile
  const { data: updated } = await admin
    .from("diviners")
    .select(PROFILE_SELECT)
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    profile: {
      ...updated,
      service_package: resolveRoleServicePackage(
        await getRoleServicePackages(),
        updated.service_package_code,
      ),
    },
  });
}
