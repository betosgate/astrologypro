import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

interface AcceptanceStatus {
  accepted: boolean;
  version: string;
  accepted_at: string | null;
}

export async function GET(req: NextRequest) {
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

  const typesParam = req.nextUrl.searchParams.get("types");
  if (!typesParam) {
    return NextResponse.json(
      { type: "about:blank", title: "Validation Error", status: 422, detail: "types query parameter is required." },
      { status: 422 }
    );
  }

  const requestedTypes = typesParam
    .split(",")
    .map((t) => t.trim())
    .filter((t) => VALID_TYPES.includes(t as DocumentType)) as DocumentType[];

  if (requestedTypes.length === 0) {
    return NextResponse.json(
      { type: "about:blank", title: "Validation Error", status: 422, detail: "No valid document types provided." },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Fetch active documents for each requested type
  const { data: activeDocs, error: docsError } = await admin
    .from("legal_documents")
    .select("id, document_type, version")
    .in("document_type", requestedTypes)
    .eq("is_active", true);

  if (docsError) {
    return NextResponse.json(
      { type: "about:blank", title: "Internal Error", status: 500, detail: docsError.message },
      { status: 500 }
    );
  }

  const activeDocIds = (activeDocs ?? []).map((d) => d.id);

  // Fetch user's acceptances for those document IDs
  const { data: acceptances, error: accError } = await admin
    .from("legal_acceptances")
    .select("document_id, document_version, accepted_at")
    .eq("user_id", user.id)
    .in("document_id", activeDocIds.length > 0 ? activeDocIds : ["00000000-0000-0000-0000-000000000000"]);

  if (accError) {
    return NextResponse.json(
      { type: "about:blank", title: "Internal Error", status: 500, detail: accError.message },
      { status: 500 }
    );
  }

  const acceptanceByDocId = new Map<string, { document_version: string; accepted_at: string }>();
  for (const acc of acceptances ?? []) {
    acceptanceByDocId.set(acc.document_id, {
      document_version: acc.document_version,
      accepted_at: acc.accepted_at,
    });
  }

  const activeDocByType = new Map<string, { id: string; version: string }>();
  for (const doc of activeDocs ?? []) {
    activeDocByType.set(doc.document_type, { id: doc.id, version: doc.version });
  }

  const result: Record<string, AcceptanceStatus> = {};
  for (const docType of requestedTypes) {
    const activeDoc = activeDocByType.get(docType);
    if (!activeDoc) {
      result[docType] = { accepted: false, version: "", accepted_at: null };
      continue;
    }
    const acceptance = acceptanceByDocId.get(activeDoc.id);
    result[docType] = {
      accepted: Boolean(acceptance),
      version: activeDoc.version,
      accepted_at: acceptance?.accepted_at ?? null,
    };
  }

  return NextResponse.json(result);
}
