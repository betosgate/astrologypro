import { NextRequest } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { applyAdminOverride, type AdminOverrideAction } from "@/lib/trainee-tabbie-appointments";

export const dynamic = "force-dynamic";

const VALID_ACTIONS: AdminOverrideAction[] = [
  "mark_completed",
  "reset_completed",
  "mark_cancelled",
];

// ─── POST /api/admin/tabbie-appointments/[traineeId]/override ─────────────────
// Body: { action: AdminOverrideAction; reason: string }
// Every override requires a non-empty reason and is audited.

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ traineeId: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return Response.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { traineeId } = await params;

  let body: { action?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { type: "https://httpstatuses.com/400", title: "Invalid JSON", status: 400 },
      { status: 400 }
    );
  }

  const action = body.action as AdminOverrideAction | undefined;
  const reason = body.reason?.trim() ?? "";

  if (!action || !VALID_ACTIONS.includes(action)) {
    return Response.json(
      {
        type: "https://httpstatuses.com/422",
        title: "Validation failed",
        status: 422,
        detail: `action must be one of: ${VALID_ACTIONS.join(", ")}`,
      },
      { status: 422 }
    );
  }

  if (!reason) {
    return Response.json(
      {
        type: "https://httpstatuses.com/422",
        title: "Validation failed",
        status: 422,
        detail: "reason is required for admin overrides",
      },
      { status: 422 }
    );
  }

  const result = await applyAdminOverride({
    traineeId,
    action,
    reason,
    adminEmail: user.email ?? user.id,
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({ ok: true });
}
