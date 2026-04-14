import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const dynamic = "force-dynamic";

const VOICEMAIL_BUCKET =
  process.env.CHIME_VOICEMAIL_BUCKET ??
  process.env.CHIME_RECORDING_BUCKET ??
  "";

const PRESIGNED_URL_TTL_SECONDS = 3600; // 1 hour

function getS3Client(): S3Client {
  const region = process.env.AWS_REGION ?? "us-east-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (accessKeyId && secretAccessKey) {
    return new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  // Fall back to default credential chain (instance role / AWS_PROFILE)
  return new S3Client({ region });
}

/**
 * GET /api/admin/diviners/[id]/voicemails
 * Admin-only: list voicemails for a diviner, most recent first.
 * Returns up to 50 records (admin inspection only — no pagination needed).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const admin = createAdminClient();

  // Object-level auth: verify diviner exists
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!diviner) {
    return NextResponse.json({ error: "Diviner not found" }, { status: 404 });
  }

  const { data, error } = await admin
    .from("voicemails")
    .select(
      "id, caller_phone, s3_key, duration_seconds, listened_at, created_at"
    )
    .eq("diviner_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to fetch voicemails:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ voicemails: data ?? [] });
}

/**
 * POST /api/admin/diviners/[id]/voicemails
 * Admin-only: generate a presigned S3 URL for a voicemail by voicemail id.
 * Body: { voicemailId: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let voicemailId: string | undefined;
  try {
    const body = await request.json();
    voicemailId = body?.voicemailId;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON with a voicemailId field" },
      { status: 422 }
    );
  }

  if (!voicemailId || typeof voicemailId !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid voicemailId" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Fetch voicemail — enforce object-level auth (must belong to this diviner)
  const { data: voicemail } = await admin
    .from("voicemails")
    .select("id, s3_key, diviner_id")
    .eq("id", voicemailId)
    .eq("diviner_id", id)
    .maybeSingle();

  if (!voicemail) {
    return NextResponse.json(
      { error: "Voicemail not found" },
      { status: 404 }
    );
  }

  if (!VOICEMAIL_BUCKET) {
    console.error("CHIME_VOICEMAIL_BUCKET env var not set");
    return NextResponse.json(
      { error: "S3 bucket not configured" },
      { status: 500 }
    );
  }

  try {
    const s3 = getS3Client();
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: VOICEMAIL_BUCKET,
        Key: voicemail.s3_key,
      }),
      { expiresIn: PRESIGNED_URL_TTL_SECONDS }
    );
    return NextResponse.json({ url, expiresIn: PRESIGNED_URL_TTL_SECONDS });
  } catch (err) {
    console.error("Failed to generate presigned URL:", err);
    return NextResponse.json(
      { error: "Failed to generate playback URL" },
      { status: 500 }
    );
  }
}
