import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureSignedAgreementArtifactForAcceptance } from "@/lib/signed-agreements";

export const dynamic = "force-dynamic";

const VALID_TYPES = [
  "customer_terms",
  "diviner_agreement",
  "affiliate_agreement",
  "telephony_consent",
  "marketing_consent",
  "privacy_policy",
  "refund_policy",
] as const;

type DocumentType = (typeof VALID_TYPES)[number];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", status: 401, detail: "Authentication required." },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { type: "about:blank", title: "Bad Request", status: 400, detail: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { document_type } = body;

  if (!document_type || !VALID_TYPES.includes(document_type as DocumentType)) {
    return NextResponse.json(
      {
        type: "about:blank",
        title: "Validation Error",
        status: 422,
        detail: `document_type must be one of: ${VALID_TYPES.join(", ")}`,
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Find current active document for this type
  const { data: activeDoc, error: docError } = await admin
    .from("legal_documents")
    .select("id, document_type, version")
    .eq("document_type", document_type as string)
    .eq("is_active", true)
    .single();

  if (docError || !activeDoc) {
    return NextResponse.json(
      {
        type: "about:blank",
        title: "Not Found",
        status: 404,
        detail: `No active document found for type: ${document_type}`,
      },
      { status: 404 }
    );
  }

  // Extract IP from x-forwarded-for header
  const forwarded = req.headers.get("x-forwarded-for");
  const ipAddress = forwarded ? forwarded.split(",")[0].trim() : null;
  const userAgent = req.headers.get("user-agent") ?? null;

  // Upsert acceptance (idempotent — update accepted_at if already accepted a different version)
  const { data: acceptance, error: insertError } = await admin
    .from("legal_acceptances")
    .upsert(
      {
        user_id: user.id,
        document_id: activeDoc.id,
        document_type: activeDoc.document_type,
        document_version: activeDoc.version,
        accepted_at: new Date().toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
      },
      { onConflict: "user_id,document_id" }
    )
    .select("id");

  if (insertError) {
    return NextResponse.json(
      { type: "about:blank", title: "Internal Error", status: 500, detail: insertError.message },
      { status: 500 }
    );
  }

  try {
    const acceptanceId = Array.isArray(acceptance)
      ? acceptance[0]?.id
      : (acceptance as { id?: string } | null)?.id;
    if (acceptanceId) {
      await ensureSignedAgreementArtifactForAcceptance(acceptanceId);
    }
  } catch {
    // Acceptance is the source of truth; artifact creation can be retried later.
  }

  return NextResponse.json({ accepted: true, document_version: activeDoc.version });
}
