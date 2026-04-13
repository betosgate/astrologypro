import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  VALID_MEDIA_TYPES,
  VALID_PUBLIC_SECTIONS,
  normalizePublishPolicy,
} from "@/lib/diviner-publishing";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("diviners")
    .select(
      "id, public_publish_blocked, blocked_public_sections, blocked_media_types, publish_block_reason, publish_blocked_at, publish_blocked_by"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Diviner not found" }, { status: 404 });
  }

  return NextResponse.json({
    policy: {
      ...normalizePublishPolicy(data),
      publishBlockedAt: data.publish_blocked_at ?? null,
      publishBlockedBy: data.publish_blocked_by ?? null,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const publicPublishBlocked = body.publicPublishBlocked === true;
  const blockedPublicSections = Array.isArray(body.blockedPublicSections)
    ? body.blockedPublicSections.filter(
        (value): value is string =>
          typeof value === "string" &&
          (VALID_PUBLIC_SECTIONS as readonly string[]).includes(value)
      )
    : [];
  const blockedMediaTypes = Array.isArray(body.blockedMediaTypes)
    ? body.blockedMediaTypes.filter(
        (value): value is string =>
          typeof value === "string" &&
          (VALID_MEDIA_TYPES as readonly string[]).includes(value)
      )
    : [];
  const publishBlockReason =
    typeof body.publishBlockReason === "string" && body.publishBlockReason.trim()
      ? body.publishBlockReason.trim()
      : null;

  if (
    Array.isArray(body.blockedPublicSections) &&
    blockedPublicSections.length !== body.blockedPublicSections.length
  ) {
    return NextResponse.json({ error: "Invalid blocked public sections" }, { status: 422 });
  }

  if (
    Array.isArray(body.blockedMediaTypes) &&
    blockedMediaTypes.length !== body.blockedMediaTypes.length
  ) {
    return NextResponse.json({ error: "Invalid blocked media types" }, { status: 422 });
  }

  const hasAnyBlock =
    publicPublishBlocked ||
    blockedPublicSections.length > 0 ||
    blockedMediaTypes.length > 0;

  const admin = createAdminClient();
  const updatePayload = {
    public_publish_blocked: publicPublishBlocked,
    blocked_public_sections: blockedPublicSections,
    blocked_media_types: blockedMediaTypes,
    publish_block_reason: hasAnyBlock ? publishBlockReason : null,
    publish_blocked_at: hasAnyBlock ? new Date().toISOString() : null,
    publish_blocked_by: hasAnyBlock ? user.id : null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await admin
    .from("diviners")
    .update(updatePayload)
    .eq("id", id)
    .select(
      "id, public_publish_blocked, blocked_public_sections, blocked_media_types, publish_block_reason, publish_blocked_at, publish_blocked_by"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    policy: {
      ...normalizePublishPolicy(data),
      publishBlockedAt: data.publish_blocked_at ?? null,
      publishBlockedBy: data.publish_blocked_by ?? null,
    },
  });
}
