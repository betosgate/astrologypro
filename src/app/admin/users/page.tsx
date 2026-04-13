import { createAdminClient } from "@/lib/supabase/admin";
import { UserManagementClient, type AdminUser } from "@/components/admin/user-management-client";

export const metadata = { title: "Users — Admin" };

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchParams {
  q?: string;
  role?: string;
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortDir?: string;
  joinedFrom?: string;
  joinedTo?: string;
  loginFrom?: string;
  loginTo?: string;
  status?: string;
}

const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 10;

// ─── Data fetch ───────────────────────────────────────────────────────────────


async function getAllUsers(params: SearchParams, pageSize: number): Promise<{ users: AdminUser[]; total: number }> {
  const admin = createAdminClient();

  const q = params.q?.trim() ?? "";
  const roleFilter = params.role ?? "all";
  const statusFilter = params.status ?? "all";
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
    deletedUsersRes,
  ] = await Promise.all([
    // ── Diviners ──────────────────────────────────────────────────────────
    // No DB-level text filter — email lives in auth.users not in this table.
    // Application-level post-filter (below) handles email matching via authEmailMap.
    fetchDiviners
      ? (() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let q: any = applyDateFilter(
            admin
              .from("diviners")
              .select("id, user_id, display_name, phone, is_active, created_at, is_certified"),
            "created_at"
          );
          if (statusFilter === "active") q = q.eq("is_active", true);
          if (statusFilter === "inactive") q = q.eq("is_active", false);
          return q.order("created_at", { ascending: false }).limit(500);
        })()
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
      ? (() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let q: any = applyDateFilter(
            applyTextFilter(
              admin
                .from("social_advocates")
                .select("id, user_id, name, email, phone, referral_code, is_active, total_referrals, created_at"),
              ["name", "email", "phone"]
            ),
            "created_at"
          );
          if (statusFilter === "active") q = q.eq("is_active", true);
          if (statusFilter === "inactive") q = q.eq("is_active", false);
          return q.order("created_at", { ascending: false }).limit(500);
        })()
      : Promise.resolve({ data: [] }),

    // ── Community Members ─────────────────────────────────────────────────
    fetchCommunity
      ? (() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let q: any = applyDateFilter(
            applyTextFilter(
              admin
                .from("community_members")
                .select("id, user_id, full_name, email, phone, membership_type, membership_status, joined_at"),
              ["full_name", "email", "phone"]
            ),
            "joined_at"
          );
          if (statusFilter === "active") q = q.eq("membership_status", "active");
          if (statusFilter === "inactive") q = q.neq("membership_status", "active");
          return q.order("joined_at", { ascending: false }).limit(500);
        })()
      : Promise.resolve({ data: [] }),

    // ── Trainees ──────────────────────────────────────────────────────────
    fetchTrainees
      ? (() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let q: any = applyDateFilter(
            applyTextFilter(
              admin
                .from("trainees")
                .select("id, user_id, name, email, phone, username, training_status, created_at"),
              ["name", "email", "phone"]
            ),
            "created_at"
          );
          if (statusFilter === "active") q = q.in("training_status", ["in_progress", "active"]);
          if (statusFilter === "inactive") q = q.in("training_status", ["dropped", "completed", "certified"]);
          return q.order("created_at", { ascending: false }).limit(500);
        })()
      : Promise.resolve({ data: [] }),

    // ── Login logs: last login per user ───────────────────────────────────
    admin
      .from("user_login_logs")
      .select("user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(5000),

    // ── Notes count per user ──────────────────────────────────────────────
    admin.from("admin_user_notes").select("user_id"),

    // ── Deleted user IDs ─────────────────────────────────────────────────
    // Soft-deleted users are archived to `deleted_users` but their original
    // profile rows may still exist (is_active=false or untouched). Exclude
    // them from the main list so they only appear in the deleted-users view.
    admin.from("deleted_users").select("user_id"),
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

  // Soft-deleted user IDs — exclude these from the active list so they only
  // appear in the dedicated deleted-users view.
  const deletedUserIds = new Set(
    ((deletedUsersRes.data ?? []) as Array<{ user_id: string }>).map(
      (r) => r.user_id,
    ),
  );

  // ── Assemble raw rows (one per role-table entry) ───────────────────────────

  const rawRows: AdminUser[] = [];

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
    rawRows.push({
      userId: d.user_id as string,
      rowId: d.id as string,
      name: (d.display_name as string) ?? "—",
      email: authEmailMap[d.user_id as string] ?? "",
      phone: (d.phone as string) ?? undefined,
      role: "diviner",
      roleLabel: "Diviner",
      roles: [{ slug: "diviner", label: "Diviner" }],
      status: (d.is_active as boolean) ? "Active" : "Inactive",
      joinedAt: d.created_at as string,
      blocked: bannedSet.has(d.user_id as string),
      isCertified: !!(d.is_certified as boolean),
      lastLoginAt: lastLoginMap[d.user_id as string],
      notesCount: notesCountMap[d.user_id as string] ?? 0,
    });
  }

  for (const c of (clientsRes.data ?? []) as Array<Record<string, unknown>>) {
    rawRows.push({
      userId: c.user_id as string,
      rowId: c.id as string,
      name: (c.full_name as string) ?? "—",
      email: (c.email as string) ?? "",
      phone: (c.phone as string) ?? undefined,
      role: "client",
      roleLabel: "Client",
      roles: [{ slug: "client", label: "Client" }],
      status: "Active",
      joinedAt: c.created_at as string,
      blocked: bannedSet.has(c.user_id as string),
      lastLoginAt: lastLoginMap[c.user_id as string],
      notesCount: notesCountMap[c.user_id as string] ?? 0,
    });
  }

  for (const a of (advocatesRes.data ?? []) as Array<Record<string, unknown>>) {
    rawRows.push({
      userId: a.user_id as string,
      rowId: a.id as string,
      name: (a.name as string) ?? "—",
      email: (a.email as string) ?? "",
      phone: (a.phone as string) ?? undefined,
      role: "advocate",
      roleLabel: "Advocate",
      roles: [{ slug: "advocate", label: "Advocate" }],
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
    rawRows.push({
      userId: m.user_id as string,
      rowId: m.id as string,
      name: (m.full_name as string) ?? "—",
      email: (m.email as string) ?? "",
      phone: (m.phone as string) ?? undefined,
      role: "community",
      roleLabel: "Community",
      roles: [{ slug: "community", label: "Community" }],
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
    rawRows.push({
      userId: t.user_id as string,
      rowId: t.id as string,
      name: (t.name as string) ?? "—",
      email: (t.email as string) ?? "",
      phone: (t.phone as string) ?? undefined,
      role: "trainee",
      roleLabel: "Trainee",
      roles: [{ slug: "trainee", label: "Trainee" }],
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

  // ── Exclude soft-deleted users ──────────────────────────────────────────
  // Remove any row whose user_id appears in the deleted_users archive so
  // deleted users only show in the dedicated deleted-users view.
  const activeRows = rawRows.filter((r) => !deletedUserIds.has(r.userId));

  // ── Consolidate by userId: merge rows with the same userId into one ───────

  const userMap = new Map<string, AdminUser>();
  for (const row of activeRows) {
    const existing = userMap.get(row.userId);
    if (existing) {
      // Merge roles (avoid duplicates)
      const existingSlugs = new Set(existing.roles.map((r) => r.slug));
      for (const r of row.roles) {
        if (!existingSlugs.has(r.slug)) {
          existing.roles.push(r);
        }
      }
      // Use the earliest joinedAt
      if (new Date(row.joinedAt) < new Date(existing.joinedAt)) {
        existing.joinedAt = row.joinedAt;
      }
      // Keep name/email from the first non-empty entry
      if (existing.name === "—" && row.name !== "—") existing.name = row.name;
      if (!existing.email && row.email) existing.email = row.email;
      if (!existing.phone && row.phone) existing.phone = row.phone;
      // Merge isCertified
      if (row.isCertified) existing.isCertified = true;
      // Merge extra
      if (row.extra) {
        existing.extra = { ...(existing.extra ?? {}), ...row.extra };
      }
    } else {
      userMap.set(row.userId, { ...row });
    }
  }

  // Update roleLabel to reflect primary role for sorting
  const result: AdminUser[] = [];
  for (const user of userMap.values()) {
    user.roleLabel = user.roles.map((r) => r.label).join(", ");
    result.push(user);
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
  const start = (page - 1) * pageSize;
  const users = sorted.slice(start, start + pageSize);

  return { users, total };
}

// ─── Page component ───────────────────────────────────────────────────────────

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const rawPageSize = parseInt(params.pageSize ?? String(DEFAULT_PAGE_SIZE), 10);
  const pageSize = ALLOWED_PAGE_SIZES.includes(rawPageSize) ? rawPageSize : DEFAULT_PAGE_SIZE;
  const { users, total } = await getAllUsers(params, pageSize);

  return (
    <div className="space-y-6">
      <UserManagementClient
        users={users}
        total={total}
        searchParams={params}
        pageSize={pageSize}
      />
    </div>
  );
}
