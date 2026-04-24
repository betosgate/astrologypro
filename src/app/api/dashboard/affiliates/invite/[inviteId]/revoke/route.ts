// Task 02 — POST /api/dashboard/affiliates/invite/[inviteId]/revoke
//
// Marks the invite as revoked. Deletes the junction if it has no commissions
// attributed to it, otherwise suspends it. Caller must be the owning diviner.
//
// Sprint: docs/tasks/2026-04-23/affiliate-identity-refactor/02-invite-flow-refactor.md

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function problem(
  status: number,
  title: string,
  detail?: string,
) {
  return NextResponse.json(
    {
      type: `https://httpstatuses.io/${status}`,
      title,
      status,
      ...(detail ? { detail } : {}),
    },
    { status },
  );
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ inviteId: string }> },
) {
  const { inviteId } = await params;
  if (!inviteId) return problem(422, "Validation error", "inviteId is required");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return problem(401, "Unauthorized");

  const admin = createAdminClient();

  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!diviner) return problem(403, "Not a diviner");

  const { data: rpcData, error: rpcError } = await admin.rpc(
    "revoke_affiliate_invite",
    {
      p_invite_id: inviteId,
      p_caller_diviner_id: diviner.id,
    },
  );

  if (rpcError) {
    const code = (rpcError as { code?: string }).code;
    if (code === "P0003") return problem(404, "Invite not found");
    if (code === "P0004") return problem(409, "Invite already accepted");
    console.error("[invite:revoke] RPC error", { code, message: rpcError.message });
    return problem(500, "Failed to revoke invitation", rpcError.message);
  }
  if (!rpcData || !Array.isArray(rpcData) || rpcData.length === 0) {
    return problem(500, "Failed to revoke invitation", "RPC returned no row");
  }

  const row = rpcData[0] as {
    invite_id: string;
    junction_id: string;
    junction_action: "deleted" | "suspended";
  };

  console.log("[invite:revoked]", {
    invite_id: row.invite_id,
    junction_id: row.junction_id,
    junction_action: row.junction_action,
    diviner_id: diviner.id,
  });

  return NextResponse.json(
    {
      data: {
        invite_id: row.invite_id,
        junction_id: row.junction_id,
        junction_action: row.junction_action,
      },
    },
    { status: 200 },
  );
}
