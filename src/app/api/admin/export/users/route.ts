import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function toCSV(rows: Record<string, unknown>[], headers: string[]): string {
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map(r => headers.map(h => escape(r[h])).join(","))
  ].join("\n");
}

// ─── GET /api/admin/export/users ─────────────────────────────────────────────
// Query params:  role, status, search, joined_from, joined_to
// Extra:         ids (comma-separated) — when exporting selected rows only
// POST /api/admin/export/users
// Body:          { ids: string[] } — export specific user IDs

async function buildExport(req: NextRequest, selectedIds?: string[]) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const roleFilter   = sp.get("role")        ?? "all";
  const statusFilter = sp.get("status")      ?? "all";
  const q            = sp.get("search")?.trim() ?? "";
  const joinedFrom   = sp.get("joined_from") ?? "";
  const joinedTo     = sp.get("joined_to")   ?? "";

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function applyTextFilter(query: any, columns: string[]): any {
    if (!q) return query;
    return query.or(columns.map((c: string) => `${c}.ilike.%${q}%`).join(","));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function applyDateFilter(query: any, column: string): any {
    if (joinedFrom) query = query.gte(column, joinedFrom);
    if (joinedTo)   query = query.lte(column, joinedTo + "T23:59:59Z");
    return query;
  }

  const fetchDiviners  = roleFilter === "all" || roleFilter === "diviner";
  const fetchClients   = roleFilter === "all" || roleFilter === "client";
  const fetchAdvocates = roleFilter === "all" || roleFilter === "advocate";
  const fetchCommunity = roleFilter === "all" || roleFilter === "community";
  const fetchTrainees  = roleFilter === "all" || roleFilter === "trainee";

  const [divinersRes, clientsRes, advocatesRes, communityRes, traineesRes] =
    await Promise.all([
      fetchDiviners
        ? (() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let dq: any = applyDateFilter(
              admin.from("diviners").select("id, user_id, display_name, phone, is_active, created_at, training_status"),
              "created_at"
            );
            if (statusFilter === "active")   dq = dq.eq("is_active", true);
            if (statusFilter === "inactive") dq = dq.eq("is_active", false);
            if (selectedIds?.length) dq = dq.in("user_id", selectedIds);
            return dq.order("created_at", { ascending: false }).limit(10000);
          })()
        : Promise.resolve({ data: [] }),

      fetchClients
        ? (() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let cq: any = applyDateFilter(
              applyTextFilter(
                admin.from("clients").select("id, user_id, full_name, email, phone, created_at"),
                ["full_name", "email", "phone"]
              ),
              "created_at"
            );
            if (selectedIds?.length) cq = cq.in("user_id", selectedIds);
            return cq.order("created_at", { ascending: false }).limit(10000);
          })()
        : Promise.resolve({ data: [] }),

      fetchAdvocates
        ? (() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let aq: any = applyDateFilter(
              applyTextFilter(
                admin.from("social_advocates").select("id, user_id, name, email, phone, is_active, created_at"),
                ["name", "email", "phone"]
              ),
              "created_at"
            );
            if (statusFilter === "active")   aq = aq.eq("is_active", true);
            if (statusFilter === "inactive") aq = aq.eq("is_active", false);
            if (selectedIds?.length) aq = aq.in("user_id", selectedIds);
            return aq.order("created_at", { ascending: false }).limit(10000);
          })()
        : Promise.resolve({ data: [] }),

      fetchCommunity
        ? (() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let mq: any = applyDateFilter(
              applyTextFilter(
                admin.from("community_members").select("id, user_id, full_name, email, phone, membership_status, joined_at"),
                ["full_name", "email", "phone"]
              ),
              "joined_at"
            );
            if (statusFilter === "active")   mq = mq.eq("membership_status", "active");
            if (statusFilter === "inactive") mq = mq.neq("membership_status", "active");
            if (selectedIds?.length) mq = mq.in("user_id", selectedIds);
            return mq.order("joined_at", { ascending: false }).limit(10000);
          })()
        : Promise.resolve({ data: [] }),

      fetchTrainees
        ? (() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let tq: any = applyDateFilter(
              applyTextFilter(
                admin.from("trainees").select("id, user_id, name, email, phone, training_status, created_at"),
                ["name", "email", "phone"]
              ),
              "created_at"
            );
            if (statusFilter === "active")   tq = tq.in("training_status", ["in_progress", "active"]);
            if (statusFilter === "inactive") tq = tq.in("training_status", ["dropped", "completed", "certified"]);
            if (selectedIds?.length) tq = tq.in("user_id", selectedIds);
            return tq.order("created_at", { ascending: false }).limit(10000);
          })()
        : Promise.resolve({ data: [] }),
    ]);

  // Collect user_ids for auth lookup
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

  const authUsersRes = await admin.rpc("get_auth_users_by_ids", {
    user_ids: [...profileUserIds],
  });

  const authUsersList = (authUsersRes.data ?? []) as Array<{
    user_id: string;
    email: string;
    banned_until: string | null;
    last_sign_in_at?: string | null;
  }>;

  const authEmailMap: Record<string, string> = {};
  const lastSignInMap: Record<string, string> = {};
  for (const u of authUsersList) {
    authEmailMap[u.user_id] = u.email ?? "";
    if (u.last_sign_in_at) lastSignInMap[u.user_id] = u.last_sign_in_at;
  }

  // Fetch last login from user_login_logs
  const loginLogsRes = await admin
    .from("user_login_logs")
    .select("user_id, created_at")
    .in("user_id", [...profileUserIds])
    .order("created_at", { ascending: false })
    .limit(50000);

  const lastLoginMap: Record<string, string> = {};
  for (const log of (loginLogsRes.data ?? []) as Array<{ user_id: string; created_at: string }>) {
    if (!lastLoginMap[log.user_id]) lastLoginMap[log.user_id] = log.created_at;
  }

  // Apply text filter for diviners (email lives in auth.users)
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

  // Build unified rows
  type ExportRow = {
    ID: string;
    Email: string;
    Name: string;
    Role: string;
    Status: string;
    "Training Status": string;
    "Joined At": string;
    "Last Login": string;
  };

  const rows: ExportRow[] = [];

  for (const d of divinersWithEmail) {
    rows.push({
      ID:                d.user_id as string,
      Email:             authEmailMap[d.user_id as string] ?? "",
      Name:              (d.display_name as string) ?? "",
      Role:              "Diviner",
      Status:            (d.is_active as boolean) ? "Active" : "Inactive",
      "Training Status": (d.training_status as string) ?? "",
      "Joined At":       d.created_at as string,
      "Last Login":      lastLoginMap[d.user_id as string] ?? "",
    });
  }

  for (const c of (clientsRes.data ?? []) as Array<Record<string, unknown>>) {
    rows.push({
      ID:                c.user_id as string,
      Email:             (c.email as string) ?? "",
      Name:              (c.full_name as string) ?? "",
      Role:              "Client",
      Status:            "Active",
      "Training Status": "",
      "Joined At":       c.created_at as string,
      "Last Login":      lastLoginMap[c.user_id as string] ?? "",
    });
  }

  for (const a of (advocatesRes.data ?? []) as Array<Record<string, unknown>>) {
    rows.push({
      ID:                a.user_id as string,
      Email:             (a.email as string) ?? "",
      Name:              (a.name as string) ?? "",
      Role:              "Advocate",
      Status:            (a.is_active as boolean) ? "Active" : "Inactive",
      "Training Status": "",
      "Joined At":       a.created_at as string,
      "Last Login":      lastLoginMap[a.user_id as string] ?? "",
    });
  }

  for (const m of (communityRes.data ?? []) as Array<Record<string, unknown>>) {
    rows.push({
      ID:                m.user_id as string,
      Email:             (m.email as string) ?? "",
      Name:              (m.full_name as string) ?? "",
      Role:              "Community",
      Status:            (m.membership_status as string) ?? "",
      "Training Status": "",
      "Joined At":       (m.joined_at as string) ?? "",
      "Last Login":      lastLoginMap[m.user_id as string] ?? "",
    });
  }

  for (const t of (traineesRes.data ?? []) as Array<Record<string, unknown>>) {
    rows.push({
      ID:                t.user_id as string,
      Email:             (t.email as string) ?? "",
      Name:              (t.name as string) ?? "",
      Role:              "Trainee",
      Status:            (t.training_status as string) ?? "",
      "Training Status": (t.training_status as string) ?? "",
      "Joined At":       t.created_at as string,
      "Last Login":      lastLoginMap[t.user_id as string] ?? "",
    });
  }

  const headers = ["ID", "Email", "Name", "Role", "Status", "Training Status", "Joined At", "Last Login"];
  const csv = toCSV(rows as unknown as Record<string, unknown>[], headers);

  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="users-export-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(req: NextRequest) {
  return buildExport(req);
}

// POST with { ids: string[] } exports only the specified user IDs
export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids) ? body.ids : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: "No IDs provided" }, { status: 422 });
  }

  return buildExport(req, ids);
}
