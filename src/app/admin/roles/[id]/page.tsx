import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  RolePermissionsClient,
  type PermissionRow,
  type RoleDetail,
} from "@/components/admin/role-permissions-client";

export const metadata = { title: "Role Permissions — Admin" };

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getRoleData(roleId: string) {
  const admin = createAdminClient();

  const [roleRes, permissionsRes, rolePermsRes] = await Promise.all([
    admin
      .from("roles")
      .select("id, name, slug, status, is_system")
      .eq("id", roleId)
      .maybeSingle(),

    admin
      .from("permissions")
      .select("id, code, name, module, description")
      .order("module", { ascending: true })
      .order("name", { ascending: true }),

    admin
      .from("role_permissions")
      .select("permission_id, permissions(code)")
      .eq("role_id", roleId),
  ]);

  if (!roleRes.data) return null;

  // Count users across all profile tables for this role
  // We use the role slug to determine which table to count from
  const slug = (roleRes.data.slug as string ?? "").toLowerCase();
  let userCount = 0;

  if (slug.includes("diviner")) {
    const { count } = await admin
      .from("diviners")
      .select("id", { count: "exact", head: true });
    userCount = count ?? 0;
  } else if (slug.includes("client")) {
    const { count } = await admin
      .from("clients")
      .select("id", { count: "exact", head: true });
    userCount = count ?? 0;
  } else if (slug.includes("advocate")) {
    const { count } = await admin
      .from("social_advocates")
      .select("id", { count: "exact", head: true });
    userCount = count ?? 0;
  } else if (slug.includes("trainee")) {
    const { count } = await admin
      .from("trainees")
      .select("id", { count: "exact", head: true });
    userCount = count ?? 0;
  } else if (slug.includes("community") || slug.includes("member")) {
    const { count } = await admin
      .from("community_members")
      .select("id", { count: "exact", head: true });
    userCount = count ?? 0;
  }

  const role: RoleDetail = {
    id:         roleRes.data.id as string,
    name:       roleRes.data.name as string,
    slug:       roleRes.data.slug as string,
    status:     roleRes.data.status as string | undefined,
    is_system:  roleRes.data.is_system as boolean | undefined,
    user_count: userCount,
  };

  const allPermissions: PermissionRow[] = (
    (permissionsRes.data ?? []) as Array<Record<string, unknown>>
  ).map((p) => ({
    id:          p.id as string,
    code:        p.code as string,
    name:        p.name as string,
    module:      p.module as string,
    description: p.description as string | undefined,
  }));

  // Extract granted codes from the join result
  const grantedCodes: string[] = [];
  for (const rp of (rolePermsRes.data ?? []) as Array<Record<string, unknown>>) {
    // permissions is a joined object when using select with embedded table
    const perm = rp.permissions as Record<string, unknown> | null;
    if (perm?.code) grantedCodes.push(perm.code as string);
  }

  return { role, allPermissions, grantedCodes };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getRoleData(id);

  if (!data) notFound();

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/roles">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Role Permissions</h1>
          <p className="text-sm text-muted-foreground">
            Configure which permissions this role grants.
          </p>
        </div>
      </div>

      <RolePermissionsClient
        role={data.role}
        allPermissions={data.allPermissions}
        grantedCodes={data.grantedCodes}
      />
    </div>
  );
}
