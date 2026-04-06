import { createAdminClient } from "@/lib/supabase/admin";
import {
  InvitationsClient,
  type InvitationRow,
  type RoleOption,
} from "@/components/admin/invitations-client";

export const metadata = { title: "Invitations — Admin" };

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getData() {
  const admin = createAdminClient();

  const [invitationsRes, rolesRes] = await Promise.all([
    admin
      .from("invitations")
      .select("id, email, role_slug, status, invited_by, expires_at, resent_count, created_at")
      .order("created_at", { ascending: false })
      .limit(500),

    admin
      .from("roles")
      .select("id, name, slug")
      .order("name", { ascending: true }),
  ]);

  const invitations: InvitationRow[] = (
    (invitationsRes.data ?? []) as Array<Record<string, unknown>>
  ).map((inv) => ({
    id:           inv.id as string,
    email:        inv.email as string,
    role_slug:    inv.role_slug as string,
    status:       inv.status as string,
    invited_by:   inv.invited_by as string | undefined,
    expires_at:   inv.expires_at as string | undefined,
    resent_count: inv.resent_count as number | undefined,
    created_at:   inv.created_at as string,
  }));

  const roles: RoleOption[] = (
    (rolesRes.data ?? []) as Array<Record<string, unknown>>
  ).map((r) => ({
    id:   r.id as string,
    name: r.name as string,
    slug: r.slug as string,
  }));

  return { invitations, roles };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminInvitationsPage() {
  const { invitations, roles } = await getData();

  return (
    <div className="space-y-6">
      <InvitationsClient invitations={invitations} roles={roles} />
    </div>
  );
}
