import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── GET /api/admin/users/export ──────────────────────────────────────────────
// Returns a CSV download of users matching optional filters.
// Query params: role=, status=, search=
// Columns: name, email, role, status, last_login, created_at, parent_diviner
// Content-Disposition: attachment; filename="users-export-{date}.csv"
// Admin only. No passwords, tokens, or sensitive fields in export.

const ROLE_TABLE_MAP: Record<
  string,
  { table: string; nameCol: string; isActiveCol: string | null }
> = {
  diviner: { table: "diviners", nameCol: "display_name", isActiveCol: "is_active" },
  client: { table: "clients", nameCol: "full_name", isActiveCol: null },
  advocate: { table: "social_advocates", nameCol: "name", isActiveCol: "is_active" },
  community: { table: "community_members", nameCol: "full_name", isActiveCol: null },
  trainee: { table: "trainees", nameCol: "name", isActiveCol: "is_active" },
};

function escapeCsvField(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const roleFilter = searchParams.get("role") ?? "";
  const statusFilter = searchParams.get("status") ?? "";
  const searchFilter = (searchParams.get("search") ?? "").toLowerCase();

  const admin = createAdminClient();

  // Determine which roles to query
  const rolesToQuery = roleFilter
    ? [roleFilter].filter((r) => ROLE_TABLE_MAP[r])
    : Object.keys(ROLE_TABLE_MAP);

  type UserRow = {
    name: string;
    email: string;
    role: string;
    status: string;
    last_login: string;
    created_at: string;
    parent_diviner: string;
  };

  const rows: UserRow[] = [];

  for (const role of rolesToQuery) {
    const { table, nameCol, isActiveCol } = ROLE_TABLE_MAP[role];

    let selectCols = `id, user_id, ${nameCol}, created_at`;
    if (isActiveCol) selectCols += `, ${isActiveCol}`;

    const { data: profileRows, error } = await admin
      .from(table)
      .select(selectCols)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error || !profileRows) continue;

    for (const profile of profileRows) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = profile as unknown as Record<string, any>;

      // Determine status
      const isActive = isActiveCol ? (p[isActiveCol] as boolean) : true;
      const computedStatus = isActive ? "active" : "inactive";

      // Apply status filter
      if (statusFilter && computedStatus !== statusFilter) continue;

      // Fetch email from auth
      const { data: authData } = await admin.auth.admin.getUserById(p.user_id as string);
      const email = authData?.user?.email ?? "";
      const lastLogin = authData?.user?.last_sign_in_at ?? "";

      // Apply search filter
      const name = (p[nameCol] as string) ?? "";
      if (
        searchFilter &&
        !name.toLowerCase().includes(searchFilter) &&
        !email.toLowerCase().includes(searchFilter)
      ) {
        continue;
      }

      // Resolve parent diviner (if any)
      let parentDiviner = "";
      const { data: rel } = await admin
        .from("user_relationships")
        .select("parent_user_id")
        .eq("child_user_id", p.user_id as string)
        .eq("relationship_type", "diviner_client")
        .eq("status", "active")
        .maybeSingle();

      if (rel?.parent_user_id) {
        const { data: parentAuth } = await admin.auth.admin.getUserById(rel.parent_user_id);
        parentDiviner =
          parentAuth?.user?.user_metadata?.full_name ??
          parentAuth?.user?.email ??
          rel.parent_user_id;
      }

      rows.push({
        name,
        email,
        role,
        status: computedStatus,
        last_login: lastLogin ? new Date(lastLogin).toISOString() : "",
        created_at: p.created_at ? new Date(p.created_at as string).toISOString() : "",
        parent_diviner: parentDiviner,
      });
    }
  }

  // Build CSV
  const headers = ["name", "email", "role", "status", "last_login", "created_at", "parent_diviner"];
  const csvLines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => escapeCsvField(row[h as keyof UserRow])).join(",")
    ),
  ];
  const csv = csvLines.join("\r\n");

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="users-export-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
