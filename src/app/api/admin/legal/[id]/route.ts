import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", status: 401, detail: "Admin access required." },
      { status: 401 }
    );
  }

  const admin = createAdminClient();

  const { data: doc, error } = await admin
    .from("legal_documents")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !doc) {
    return NextResponse.json(
      { type: "about:blank", title: "Not Found", status: 404, detail: "Document not found." },
      { status: 404 }
    );
  }

  // Attach acceptance count
  const { count } = await admin
    .from("legal_acceptances")
    .select("id", { count: "exact", head: true })
    .eq("document_id", params.id);

  return NextResponse.json({ ...doc, acceptance_count: count ?? 0 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const admin = createAdminClient();

  // Fetch current doc to get its type
  const { data: existing, error: fetchError } = await admin
    .from("legal_documents")
    .select("id, document_type, is_active")
    .eq("id", params.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { type: "about:blank", title: "Not Found", status: 404, detail: "Document not found." },
      { status: 404 }
    );
  }

  // Special action: activate this version
  if (body.action === "activate") {
    // Deactivate all versions of same type
    const { error: deactivateError } = await admin
      .from("legal_documents")
      .update({ is_active: false })
      .eq("document_type", existing.document_type);

    if (deactivateError) {
      return NextResponse.json(
        { type: "about:blank", title: "Internal Error", status: 500, detail: deactivateError.message },
        { status: 500 }
      );
    }

    // Activate this one
    const { data: activated, error: activateError } = await admin
      .from("legal_documents")
      .update({ is_active: true })
      .eq("id", params.id)
      .select()
      .single();

    if (activateError) {
      return NextResponse.json(
        { type: "about:blank", title: "Internal Error", status: 500, detail: activateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(activated);
  }

  // Content/metadata update
  const updates: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim() !== "") {
    updates.title = body.title.trim();
  }
  if (typeof body.content === "string" && body.content.trim() !== "") {
    updates.content = body.content.trim();
  }
  if (typeof body.effective_date === "string" && body.effective_date.trim() !== "") {
    updates.effective_date = body.effective_date.trim();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { type: "about:blank", title: "Validation Error", status: 422, detail: "No updatable fields provided." },
      { status: 422 }
    );
  }

  const { data: updated, error: updateError } = await admin
    .from("legal_documents")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { type: "about:blank", title: "Internal Error", status: 500, detail: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", status: 401, detail: "Admin access required." },
      { status: 401 }
    );
  }

  const admin = createAdminClient();

  const { data: existing, error: fetchError } = await admin
    .from("legal_documents")
    .select("id, is_active")
    .eq("id", params.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { type: "about:blank", title: "Not Found", status: 404, detail: "Document not found." },
      { status: 404 }
    );
  }

  if (existing.is_active) {
    return NextResponse.json(
      {
        type: "about:blank",
        title: "Conflict",
        status: 409,
        detail: "Cannot delete an active document. Activate another version first.",
      },
      { status: 409 }
    );
  }

  // Check for acceptance references
  const { count: acceptanceCount } = await admin
    .from("legal_acceptances")
    .select("id", { count: "exact", head: true })
    .eq("document_id", params.id);

  if (acceptanceCount && acceptanceCount > 0) {
    return NextResponse.json(
      {
        type: "about:blank",
        title: "Conflict",
        status: 409,
        detail: `Cannot delete: ${acceptanceCount} user acceptance(s) reference this document.`,
      },
      { status: 409 }
    );
  }

  const { error: deleteError } = await admin
    .from("legal_documents")
    .delete()
    .eq("id", params.id);

  if (deleteError) {
    return NextResponse.json(
      { type: "about:blank", title: "Internal Error", status: 500, detail: deleteError.message },
      { status: 500 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
