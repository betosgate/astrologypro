import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import {
  listContractAmendmentRollouts,
  previewAmendmentAudience,
} from "@/lib/contract-orchestration";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const previewRoles = req.nextUrl.searchParams.get("preview_roles");
  if (previewRoles) {
    try {
      const roles = previewRoles
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const preview = await previewAmendmentAudience(roles);
      return NextResponse.json(preview);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to preview rollout" },
        { status: 400 },
      );
    }
  }

  try {
    const rollouts = await listContractAmendmentRollouts();
    return NextResponse.json({ rollouts });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load amendment rollouts" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | {
        amendment_template_id?: string;
        target_roles?: string[];
        consolidated_template_id?: string | null;
        notes?: string | null;
      }
    | null;

  const amendmentTemplateId = String(body?.amendment_template_id ?? "").trim();
  const targetRoles = Array.isArray(body?.target_roles)
    ? body!.target_roles.map((value) => String(value).trim()).filter(Boolean)
    : [];

  if (!amendmentTemplateId || targetRoles.length === 0) {
    return NextResponse.json(
      { error: "amendment_template_id and target_roles are required" },
      { status: 422 },
    );
  }

  const admin = createAdminClient();
  const { data: rollout, error } = await admin
    .from("contract_amendment_rollouts")
    .insert({
      amendment_template_id: amendmentTemplateId,
      target_roles: targetRoles,
      consolidated_template_id: body?.consolidated_template_id
        ? String(body.consolidated_template_id)
        : null,
      notes: body?.notes ? String(body.notes) : null,
    })
    .select(
      `
        *,
        amendment_template:contract_templates!contract_amendment_rollouts_amendment_template_id_fkey(*),
        consolidated_template:contract_templates!contract_amendment_rollouts_consolidated_template_id_fkey(*)
      `,
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ rollout }, { status: 201 });
}
