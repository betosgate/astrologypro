import { createAdminClient } from "@/lib/supabase/admin";
import { UserManagementClient, type AdminUser } from "@/components/admin/user-management-client";

export const metadata = { title: "Users — Admin" };

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchParams {
  q?: string;
  role?: string;
  page?: string;
  sortBy?: string;
  sortDir?: string;
  joinedFrom?: string;
  joinedTo?: string;
  loginFrom?: string;
  loginTo?: string;
}

export const PAGE_SIZE = 10;

// ─── Data fetch ───────────────────────────────────────────────────────────────


async function getAllUsers(params: SearchParams): Promise<{ users: AdminUser[]; total: number }> {
  const admin = createAdminClient();

  const q = params.q?.trim() ?? "";
  const roleFilter = params.role ?? "all";
  const sortBy = params.sortBy ?? "lastLoginAt";
  const sortDir = (params.sortDir ?? "desc") as "asc" | "desc";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const joinedFrom = params.joinedFrom ?? "";
  const joinedTo = params.joinedTo ?? "";
  const loginFrom = params.loginFrom ?? "";
  const loginTo = params.loginTo ?? "";

  // Helper: apply text filter — uses any to avoid Supabase generic complexity
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function applyTextFilter(query: any, columns: string[]): any {
    if (!q) return query;
    return query.or(columns.map((c: string) => `${c}.ilike.%${q}%`).join(","));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function applyDateFilter(query: any, column: string): any {
    if (joinedFrom) query = query.gte(column, joinedFrom);
    if (joinedTo) query = query.lte(column, joinedTo + "T23:59:59Z");
    return query;
  }

  // Decide which tables to hit based on role filter
  const fetchDiviners   = roleFilter === "all" || roleFilter === "diviner";
  const fetchClients    = roleFilter === "all" || roleFilter === "client";
  const fetchAdvocates  = roleFilter === "all" || roleFilter === "advocate";
  const fetchCommunity  = roleFilter === "all" || roleFilter === "community";
  const fetchTrainees   = roleFilter === "all" || roleFilter === "trainee";

  // Run all fetches in parallel
  // ── Phase 1: fetch profile tables + ancillary data in parallel ───────────
  const [
    divinersRes,
    clientsRes,
    advocatesRes,
    communityRes,
    traineesRes,
    loginLogsRes,
    notesCountRes,
  ] = await Promise.all([
    // ── Diviners ──────────────────────────────────────────────────────────
    // No DB-level text filter — email lives in auth.users not in this table.
    // Application-level post-filter (below) handles email matching via authEmailMap.
    fetchDiviners
      ? applyDateFilter(
          admin
            .from("diviners")
            .select("id, user_id, display_name, phone, is_active, created_at, is_certified"),
          "created_at"
        )
          .order("created_at", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [] }),

    // ── Clients ───────────────────────────────────────────────────────────
    fetchClients
      ? applyDateFilter(
          applyTextFilter(
            admin
              .from("clients")
              .select("id, user_id, full_name, email, phone, created_at"),
            ["full_name", "email", "phone"]
          ),
          "created_at"
        )
          .order("created_at", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [] }),

    // ── Social Advocates ──────────────────────────────────────────────────
    fetchAdvocates
      ? applyDateFilter(
          applyTextFilter(
            admin
              .from("social_advocates")
              .select("id, user_id, name, email, phone, referral_code, is_active, total_referrals, created_at"),
            ["name", "email", "phone"]
          ),
          "created_at"
        )
          .order("created_at", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [] }),

    // ── Community Members ─────────────────────────────────────────────────
    fetchCommunity
      ? applyDateFilter(
          applyTextFilter(
            admin
              .from("community_members")
              .select("id, user_id, full_name, email, phone, membership_type, membership_status, joined_at"),
            ["full_name", "email", "phone"]
          ),
          "joined_at"
        )
          .order("joined_at", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [] }),

    // ── Trainees ──────────────────────────────────────────────────────────
    fetchTrainees
      ? applyDateFilter(
          applyTextFilter(
            admin
              .from("trainees")
              .select("id, user_id, name, email, phone, username, training_status, created_at"),
            ["name", "email", "phone"]
          ),
          "created_at"
        )
          .order("created_at", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [] }),

    // ── Login logs: last login per user ───────────────────────────────────
    admin
      .from("user_login_logs")
      .select("user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(5000),

    // ── Notes count per user ──────────────────────────────────────────────
    admin.from("admin_user_notes").select("user_id"),
  ]);

  // ── Phase 2: targeted auth lookup for exactly the user_ids we have ────────
  // Collect unique user_ids from all profile rows fetched above.
  const profileUserIds = new Set<string>();
  for (const row of [
    ...(divinersRes.data ?? []),
    ...(clientsRes.data ?? []),
    ...(advocatesRes.data ?? []),
    ...(communityRes.data ?? []),
    ...(traineesRes.data ?? []),
  ] as Array<{ user_id?: string }>) {
    if (row.user_id) profileUserIds.add(row.user_id);
  }

  // Fetch email + ban status only for those IDs — never hits PostgREST row limit
  const authUsersRes = await admin.rpc("get_auth_users_by_ids", {
    user_ids: [...profileUserIds],
  });

  // ── Build lookup maps ─────────────────────────────────────────────────────

  const authUsersList = (authUsersRes.data ?? []) as Array<{
    user_id: string;
    email: string;
    banned_until: string | null;
  }>;

  const bannedSet = new Set<string>(
    authUsersList
      .filter((u) => u.banned_until && new Date(u.banned_until) > new Date())
      .map((u) => u.user_id)
  );

  // email lookup for tables that don't store email (diviners)
  const authEmailMap: Record<string, string> = {};
  for (const u of authUsersList) {
    authEmailMap[u.user_id] = u.email ?? "";
  }

  const lastLoginMap: Record<string, string> = {};
  for (const log of (loginLogsRes.data ?? []) as Array<{ user_id: string; created_at: string }>) {
    if (!lastLoginMap[log.user_id]) lastLoginMap[log.user_id] = log.created_at;
  }

  const notesCountMap: Record<string, number> = {};
  for (const n of (notesCountRes.data ?? []) as Array<{ user_id: string }>) {
    notesCountMap[n.user_id] = (notesCountMap[n.user_id] ?? 0) + 1;
  }

  // ── Assemble unified list ─────────────────────────────────────────────────

  const result: AdminUser[] = [];

  // If q is set and fetching diviners, post-filter by email match too
  const divinersFiltered = (divinersRes.data ?? []) as Array<Record<string, unknown>>;
  const divinersWithEmail = q
    ? divinersFiltered.filter((d) => {
        const email = authEmailMap[d.user_id as string] ?? "";
        return (
          (d.display_name as string ?? "").toLowerCase().includes(q.toLowerCase()) ||
          email.toLowerCase().includes(q.toLowerCase()) ||
          ((d.phone as string) ?? "").toLowerCase().includes(q.toLowerCase())
        );
      })
    : divinersFiltered;

  for (const d of divinersWithEmail) {
    result.push({
      userId: d.user_id as string,
      rowId: d.id as string,
      name: (d.display_name as string) ?? "—",
      email: authEmailMap[d.user_id as string] ?? "",
      phone: (d.phone as string) ?? undefined,
      role: "diviner",
      roleLabel: "Diviner",
      status: (d.is_active as boolean) ? "Active" : "Inactive",
      joinedAt: d.created_at as string,
      blocked: bannedSet.has(d.user_id as string),
      isCertified: !!(d.is_certified as boolean),
      lastLoginAt: lastLoginMap[d.user_id as string],
      notesCount: notesCountMap[d.user_id as string] ?? 0,
    });
  }

  for (const c of (clientsRes.data ?? []) as Array<Record<string, unknown>>) {
    result.push({
      userId: c.user_id as string,
      rowId: c.id as string,
      name: (c.full_name as string) ?? "—",
      email: (c.email as string) ?? "",
      phone: (c.phone as string) ?? undefined,
      role: "client",
      roleLabel: "Client",
      status: "Active",
      joinedAt: c.created_at as string,
      blocked: bannedSet.has(c.user_id as string),
      lastLoginAt: lastLoginMap[c.user_id as string],
      notesCount: notesCountMap[c.user_id as string] ?? 0,
    });
  }

  for (const a of (advocatesRes.data ?? []) as Array<Record<string, unknown>>) {
    result.push({
      userId: a.user_id as string,
      rowId: a.id as string,
      name: (a.name as string) ?? "—",
      email: (a.email as string) ?? "",
      phone: (a.phone as string) ?? undefined,
      role: "advocate",
      roleLabel: "Advocate",
      status: (a.is_active as boolean) ? "Active" : "Inactive",
      joinedAt: a.created_at as string,
      blocked: bannedSet.has(a.user_id as string),
      lastLoginAt: lastLoginMap[a.user_id as string],
      notesCount: notesCountMap[a.user_id as string] ?? 0,
      extra: {
        "Referral Code": (a.referral_code as string) ?? "—",
        "Total Referrals": String((a.total_referrals as number) ?? 0),
      },
    });
  }

  for (const m of (communityRes.data ?? []) as Array<Record<string, unknown>>) {
    result.push({
      userId: m.user_id as string,
      rowId: m.id as string,
      name: (m.full_name as string) ?? "—",
      email: (m.email as string) ?? "",
      phone: (m.phone as string) ?? undefined,
      role: "community",
      roleLabel: "Community",
      status: (m.membership_status as string) ?? "active",
      joinedAt: (m.joined_at as string) ?? new Date().toISOString(),
      blocked: bannedSet.has(m.user_id as string),
      lastLoginAt: lastLoginMap[m.user_id as string],
      notesCount: notesCountMap[m.user_id as string] ?? 0,
      extra: {
        Program:
          (m.membership_type as string) === "mystery_school"
            ? "Mystery School"
            : "Perennial Mandalism",
      },
    });
  }

  for (const t of (traineesRes.data ?? []) as Array<Record<string, unknown>>) {
    result.push({
      userId: t.user_id as string,
      rowId: t.id as string,
      name: (t.name as string) ?? "—",
      email: (t.email as string) ?? "",
      phone: (t.phone as string) ?? undefined,
      role: "trainee",
      roleLabel: "Trainee",
      status: (t.training_status as string) ?? "active",
      joinedAt: t.created_at as string,
      blocked: bannedSet.has(t.user_id as string),
      lastLoginAt: lastLoginMap[t.user_id as string],
      notesCount: notesCountMap[t.user_id as string] ?? 0,
      extra: {
        Username: `@${(t.username as string) ?? ""}`,
      },
    });
  }

  // ── Apply last-login date range filter ────────────────────────────────────

  const filtered = loginFrom || loginTo
    ? result.filter((u) => {
        if (!u.lastLoginAt) return false;
        const ts = new Date(u.lastLoginAt).getTime();
        if (loginFrom && ts < new Date(loginFrom).getTime()) return false;
        if (loginTo && ts > new Date(loginTo + "T23:59:59Z").getTime()) return false;
        return true;
      })
    : result;

  // ── Sort ──────────────────────────────────────────────────────────────────

  const sorted = [...filtered].sort((a, b) => {
    let valA: string | number, valB: string | number;

    if (sortBy === "name") {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
    } else if (sortBy === "email") {
      valA = a.email.toLowerCase();
      valB = b.email.toLowerCase();
    } else if (sortBy === "role") {
      valA = a.roleLabel.toLowerCase();
      valB = b.roleLabel.toLowerCase();
    } else if (sortBy === "joinedAt") {
      valA = new Date(a.joinedAt).getTime();
      valB = new Date(b.joinedAt).getTime();
    } else {
      // default: lastLoginAt (nulls last)
      valA = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
      valB = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
    }

    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  // ── Paginate ──────────────────────────────────────────────────────────────

  const total = sorted.length;
  const start = (page - 1) * PAGE_SIZE;
  const users = sorted.slice(start, start + PAGE_SIZE);

  return { users, total };
}

// ─── Page component ───────────────────────────────────────────────────────────

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { users, total } = await getAllUsers(params);

  return (
    <div className="space-y-6">
      <UserManagementClient
        users={users}
        total={total}
        searchParams={params}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
