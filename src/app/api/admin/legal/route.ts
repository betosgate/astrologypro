import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

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

export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", status: 401, detail: "Admin access required." },
      { status: 401 }
    );
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("legal_documents")
    .select("id, document_type, version, title, is_active, effective_date, created_at, created_by")
    .order("document_type", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { type: "about:blank", title: "Internal Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  // Group by document_type
  const grouped: Record<string, typeof data> = {};
  for (const doc of data ?? []) {
    if (!grouped[doc.document_type]) {
      grouped[doc.document_type] = [];
    }
    grouped[doc.document_type].push(doc);
  }

  return NextResponse.json({ documents: data ?? [], grouped });
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", status: 401, detail: "Admin access required." },
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

  const { document_type, version, title, content, effective_date, activate_immediately } = body;

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
  if (!version || typeof version !== "string" || version.trim() === "") {
    return NextResponse.json(
      { type: "about:blank", title: "Validation Error", status: 422, detail: "version is required." },
      { status: 422 }
    );
  }
  if (!title || typeof title !== "string" || title.trim() === "") {
    return NextResponse.json(
      { type: "about:blank", title: "Validation Error", status: 422, detail: "title is required." },
      { status: 422 }
    );
  }
  if (!content || typeof content !== "string" || content.trim() === "") {
    return NextResponse.json(
      { type: "about:blank", title: "Validation Error", status: 422, detail: "content is required." },
      { status: 422 }
    );
  }
  if (!effective_date || typeof effective_date !== "string") {
    return NextResponse.json(
      { type: "about:blank", title: "Validation Error", status: 422, detail: "effective_date is required." },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  const shouldActivate = Boolean(activate_immediately);

  // If activating immediately, deactivate all previous versions of same type first
  if (shouldActivate) {
    const { error: deactivateError } = await admin
      .from("legal_documents")
      .update({ is_active: false })
      .eq("document_type", document_type as string);

    if (deactivateError) {
      return NextResponse.json(
        { type: "about:blank", title: "Internal Error", status: 500, detail: deactivateError.message },
        { status: 500 }
      );
    }
  }

  const { data: doc, error: insertError } = await admin
    .from("legal_documents")
    .insert({
      document_type,
      version: (version as string).trim(),
      title: (title as string).trim(),
      content: (content as string).trim(),
      effective_date,
      is_active: shouldActivate,
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        {
          type: "about:blank",
          title: "Conflict",
          status: 409,
          detail: `Version ${version} already exists for ${document_type}.`,
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { type: "about:blank", title: "Internal Error", status: 500, detail: insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(doc, { status: 201 });
}
