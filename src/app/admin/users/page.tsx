import { createAdminClient } from "@/lib/supabase/admin";
import { UserManagementClient, type AdminUser } from "@/components/admin/user-management-client";

export const metadata = { title: "Users — Admin" };

async function getAllUsers(): Promise<AdminUser[]> {
  const admin = createAdminClient();

  const [diviners, clients, advocates, community, trainees, authUsers, loginLogs] = await Promise.all([
    admin
      .from("diviners")
      .select("id, user_id, display_name, email, phone, is_active, created_at, is_certified")
      .order("created_at", { ascending: false })
      .limit(500),
    admin
      .from("clients")
      .select("id, user_id, full_name, email, phone, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    admin
      .from("social_advocates")
      .select("id, user_id, name, email, referral_code, is_active, total_referrals, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    admin
      .from("community_members")
      .select("id, user_id, full_name, email, phone, membership_type, membership_status, joined_at")
      .order("joined_at", { ascending: false })
      .limit(500),
    admin
      .from("trainees")
      .select("id, user_id, name, email, username, training_status, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    // Fetch auth users to check ban status
    admin.auth.admin.listUsers({ perPage: 1000 }),
    // Most recent login per user_id
    admin
      .from("user_login_logs")
      .select("user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(5000),
  ]);

  // Build a lookup: userId → banned
  const bannedSet = new Set<string>(
    (authUsers.data?.users ?? [])
      .filter((u) => u.banned_until && new Date(u.banned_until) > new Date())
      .map((u) => u.id)
  );

  // Build a lookup: userId → most recent login timestamp
  const lastLoginMap: Record<string, string> = {};
  for (const log of (loginLogs.data ?? []) as Array<{ user_id: string; created_at: string }>) {
    if (!lastLoginMap[log.user_id]) {
      lastLoginMap[log.user_id] = log.created_at;
    }
  }

  const result: AdminUser[] = [];

  for (const d of diviners.data ?? []) {
    result.push({
      userId: d.user_id,
      rowId: d.id,
      name: (d as { display_name?: string }).display_name ?? "—",
      email: d.email ?? "",
      phone: (d as { phone?: string }).phone ?? undefined,
      role: "diviner",
      roleLabel: "Diviner",
      status: (d as { is_active?: boolean }).is_active ? "Active" : "Inactive",
      joinedAt: d.created_at,
      blocked: bannedSet.has(d.user_id),
      isCertified: !!(d as { is_certified?: boolean }).is_certified,
      lastLoginAt: lastLoginMap[d.user_id],
    });
  }

  for (const c of clients.data ?? []) {
    result.push({
      userId: c.user_id,
      rowId: c.id,
      name: (c as { full_name?: string }).full_name ?? "—",
      email: c.email ?? "",
      phone: (c as { phone?: string }).phone ?? undefined,
      role: "client",
      roleLabel: "Client",
      status: "Active",
      joinedAt: c.created_at,
      blocked: bannedSet.has(c.user_id),
      lastLoginAt: lastLoginMap[c.user_id],
    });
  }

  for (const a of advocates.data ?? []) {
    result.push({
      userId: a.user_id,
      rowId: a.id,
      name: (a as { name?: string }).name ?? "—",
      email: a.email ?? "",
      role: "advocate",
      roleLabel: "Advocate",
      status: (a as { is_active?: boolean }).is_active ? "Active" : "Inactive",
      joinedAt: a.created_at,
      blocked: bannedSet.has(a.user_id),
      lastLoginAt: lastLoginMap[a.user_id],
      extra: {
        "Referral Code": (a as { referral_code?: string }).referral_code ?? "—",
        "Total Referrals": String((a as { total_referrals?: number }).total_referrals ?? 0),
      },
    });
  }

  for (const m of community.data ?? []) {
    result.push({
      userId: m.user_id,
      rowId: m.id,
      name: (m as { full_name?: string }).full_name ?? "—",
      email: m.email ?? "",
      phone: (m as { phone?: string }).phone ?? undefined,
      role: "community",
      roleLabel: "Community",
      status: (m as { membership_status?: string }).membership_status ?? "active",
      joinedAt: (m as { joined_at?: string }).joined_at ?? new Date().toISOString(),
      blocked: bannedSet.has(m.user_id),
      lastLoginAt: lastLoginMap[m.user_id],
      extra: {
        Program: (m as { membership_type?: string }).membership_type === "mystery_school"
          ? "Mystery School"
          : "Perennial Mandalism",
      },
    });
  }

  for (const t of trainees.data ?? []) {
    result.push({
      userId: t.user_id,
      rowId: t.id,
      name: (t as { name?: string }).name ?? "—",
      email: t.email ?? "",
      role: "trainee",
      roleLabel: "Trainee",
      status: (t as { training_status?: string }).training_status ?? "active",
      joinedAt: t.created_at,
      blocked: bannedSet.has(t.user_id),
      lastLoginAt: lastLoginMap[t.user_id],
      extra: {
        Username: `@${(t as { username?: string }).username ?? ""}`,
      },
    });
  }

  // Sort newest first
  return result.sort(
    (a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
  );
}

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      <UserManagementClient users={users} />
    </div>
  );
}
