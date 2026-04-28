import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const ALLOWED_STATUSES = new Set(["all", "completed", "in-progress", "not-started"]);

type MemberRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  membership_status: string | null;
};

type RitualRow = {
  id: string;
  user_id: string;
  community_member_id: string | null;
  ritual_name: string;
  ritual_tags: string[] | null;
  created_at: string;
  updated_at: string;
  last_executed_at: string | null;
  current_step: number | null;
  is_complete: boolean | null;
  community_members?: MemberRow | MemberRow[] | null;
};

function getMember(row: RitualRow): MemberRow | null {
  const member = row.community_members;
  if (Array.isArray(member)) return member[0] ?? null;
  return member ?? null;
}

function normalizeDate(value: string | null, endOfDay = false): string | null {
  if (!value) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 
  const sp = req.nextUrl.searchParams;
  const pageRaw = Number.parseInt(sp.get("page") ?? "1", 10);
  const page = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1);
  const pageSizeRaw = Number.parseInt(sp.get("pageSize") ?? "10", 10);
  const pageSize = Math.max(1, Math.min(100, Number.isFinite(pageSizeRaw) ? pageSizeRaw : 10));
 
  const ritualName = sp.get("ritualName")?.trim() ?? "";
  const userId = sp.get("userId")?.trim() ?? "";
  const statusRaw = sp.get("status")?.trim() ?? "all";
  const status = ALLOWED_STATUSES.has(statusRaw) ? statusRaw : "all";
  const createdFrom = normalizeDate(sp.get("createdFrom"));
  const createdTo = normalizeDate(sp.get("createdTo"), true);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const sortFieldRaw = sp.get("sortField")?.trim() ?? "created_at";
  const sortOrderRaw = sp.get("sortOrder")?.trim() ?? "desc";
  const sortOrder = sortOrderRaw === "asc" ? "asc" : "desc";

  // Map frontend field names to database field names
  const sortFieldMap: Record<string, string> = {
    created_at: "created_at",
    last_executed_at: "last_executed_at",
    ritual_name: "ritual_name",
    user_name: "community_members.full_name",
  };

  const sortField = sortFieldMap[sortFieldRaw] ?? "created_at";

  const admin = createAdminClient();

  let query = admin
    .from("user_ritual_configurations")
    .select(
      `id, user_id, community_member_id, ritual_name, ritual_tags,
       created_at, updated_at, last_executed_at,
       current_step, is_complete,
       community_members!inner(id, full_name, email, membership_status, membership_type)`,
      { count: "exact" }
    )
    .eq("community_members.membership_type", "perennial_mandalism");

  if (ritualName) query = query.eq("ritual_name", ritualName);
  if (userId) query = query.eq("user_id", userId);
  if (status === "completed") query = query.eq("is_complete", true);
  if (status === "in-progress") {
    query = query.eq("is_complete", false).gt("current_step", 0);
  }
  if (status === "not-started") {
    query = query.eq("is_complete", false).eq("current_step", 0);
  }
  if (createdFrom) query = query.gte("created_at", createdFrom);
  if (createdTo) query = query.lte("created_at", createdTo);

  const { data, error, count } = await query
    .order(sortField.includes(".") ? sortField.split(".")[1] : sortField, { 
      ascending: sortOrder === "asc",
      foreignTable: sortField.includes(".") ? sortField.split(".")[0] : undefined 
    })
    .order("id", { ascending: false })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = ((data ?? []) as unknown as RitualRow[])
    .map((row) => {
      const member = getMember(row);
      return {
        id: row.id,
        user_id: row.user_id,
        user_name: member?.full_name ?? "",
        user_email: member?.email ?? "",
        membership_status: member?.membership_status ?? "",
        ritual_name: row.ritual_name,
        ritual_tags: row.ritual_tags ?? [],
        created_at: row.created_at,
        updated_at: row.updated_at,
        last_executed_at: row.last_executed_at,
        current_step: row.current_step ?? 0,
        is_complete: row.is_complete === true,
      };
    })
    .filter((row) => row.user_name || row.user_email);

  const { data: optionRows } = await admin
    .from("user_ritual_configurations")
    .select(
      `user_id, ritual_name,
       community_members!inner(id, full_name, email, membership_type)`
    )
    .eq("community_members.membership_type", "perennial_mandalism")
    .order("ritual_name", { ascending: true });

  const ritualNames = new Set<string>();
  const users = new Map<string, { value: string; label: string }>();

  for (const row of (optionRows ?? []) as unknown as RitualRow[]) {
    if (row.ritual_name) ritualNames.add(row.ritual_name);
    const member = getMember(row);
    if (!member) continue;
    const label = member.full_name
      ? `${member.full_name}${member.email ? ` (${member.email})` : ""}`
      : member.email ?? row.user_id;
    users.set(row.user_id, { value: row.user_id, label });
  }

  const total = count ?? 0;

  return NextResponse.json({
    rows,
    options: {
      rituals: Array.from(ritualNames).map((name) => ({
        value: name,
        label: name,
      })),
      users: Array.from(users.values()).sort((a, b) =>
        a.label.localeCompare(b.label)
      ),
    },
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}
