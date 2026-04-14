import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import {
  activateContractAmendmentRollout,
  updateContractAmendmentRolloutState,
} from "@/lib/contract-orchestration";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | {
        action?: "activate" | "paused" | "superseded" | "update";
        target_roles?: string[];
        consolidated_template_id?: string | null;
        notes?: string | null;
      }
    | null;

  try {
    if (body?.action === "activate") {
      const result = await activateContractAmendmentRollout({
        rolloutId: id,
        adminUserId: user.id,
      });
      return NextResponse.json({ ok: true, result });
    }

    if (body?.action === "paused" || body?.action === "superseded") {
      await updateContractAmendmentRolloutState({
        rolloutId: id,
        state: body.action,
      });
      return NextResponse.json({ ok: true });
    }

    const admin = createAdminClient();
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (Array.isArray(body?.target_roles)) {
      updates.target_roles = body.target_roles.map((value) => String(value).trim()).filter(Boolean);
    }
    if ("consolidated_template_id" in (body ?? {})) {
      updates.consolidated_template_id = body?.consolidated_template_id
        ? String(body.consolidated_template_id)
        : null;
    }
    if ("notes" in (body ?? {})) {
      updates.notes = body?.notes ? String(body.notes) : null;
    }

    const { data, error } = await admin
      .from("contract_amendment_rollouts")
      .update(updates)
      .eq("id", id)
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

    return NextResponse.json({ rollout: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update amendment rollout" },
      { status: 400 },
    );
  }
}
