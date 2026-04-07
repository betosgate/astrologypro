import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── GET /api/admin/permissions ───────────────────────────────────────────────
// Returns all permissions grouped by module.
// No auth required — used for building permission matrices in the UI.

export async function GET() {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("permissions")
    .select("id, code, name, module, description")
    .order("module", { ascending: true })
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Group by module
  const grouped = (data ?? []).reduce<
    Record<string, { id: string; code: string; name: string; module: string; description: string | null }[]>
  >((acc, permission) => {
    const module = permission.module ?? "other";
    if (!acc[module]) acc[module] = [];
    acc[module].push(permission);
    return acc;
  }, {});

  return NextResponse.json(grouped);
}
