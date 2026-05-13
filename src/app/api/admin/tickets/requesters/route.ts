import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type RequesterSuggestion = {
  id: string;
  name: string;
  email: string;
};

type ProfileRow = {
  user_id?: string | null;
  name?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  email?: string | null;
};

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function profileName(row: ProfileRow) {
  return cleanString(row.full_name) || cleanString(row.name) || cleanString(row.display_name);
}

async function getAuthEmailMap(admin: SupabaseClient, userIds: string[]) {
  if (userIds.length === 0) return {};

  const { data, error } = await admin.rpc("get_auth_users_by_ids", { user_ids: userIds });
  if (error || !data) return {};

  const emailMap: Record<string, string> = {};
  for (const row of data as Array<{ user_id?: string; email?: string }>) {
    if (row.user_id && row.email) emailMap[row.user_id] = row.email;
  }
  return emailMap;
}

async function findUserIdsByEmail(admin: SupabaseClient, q: string) {
  if (!q) return [];

  const { data, error } = await admin.rpc("search_auth_user_ids_by_email", {
    email_query: q,
    max_rows: 100,
  });

  if (error || !data) return [];

  return (data as Array<{ user_id?: string }>)
    .map((row) => row.user_id)
    .filter((id): id is string => !!id);
}

export async function GET(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  const limitParam = Number.parseInt(req.nextUrl.searchParams.get("limit") ?? "5", 10);
  const limit = Number.isNaN(limitParam) ? 5 : Math.min(Math.max(limitParam, 1), 10);

  try {
    const admin = createAdminClient();
    const pattern = `%${q}%`;
    const emailMatchedUserIds = await findUserIdsByEmail(admin, q);

    const [clientsRes, advocatesRes, communityRes, traineesRes, divinersRes] = await Promise.all([
      q
        ? admin
            .from("clients")
            .select("user_id, full_name, email")
            .or(`full_name.ilike.${pattern},email.ilike.${pattern}`)
            .limit(limit)
        : admin
            .from("clients")
            .select("user_id, full_name, email")
            .order("created_at", { ascending: false })
            .limit(limit),
      q
        ? admin
            .from("social_advocates")
            .select("user_id, name, email")
            .or(`name.ilike.${pattern},email.ilike.${pattern}`)
            .limit(limit)
        : admin
            .from("social_advocates")
            .select("user_id, name, email")
            .order("created_at", { ascending: false })
            .limit(limit),
      q
        ? admin
            .from("community_members")
            .select("user_id, full_name, email")
            .or(`full_name.ilike.${pattern},email.ilike.${pattern}`)
            .limit(limit)
        : admin
            .from("community_members")
            .select("user_id, full_name, email")
            .order("joined_at", { ascending: false })
            .limit(limit),
      q
        ? admin
            .from("trainees")
            .select("user_id, name, email")
            .or(`name.ilike.${pattern},email.ilike.${pattern}`)
            .limit(limit)
        : admin
            .from("trainees")
            .select("user_id, name, email")
            .order("created_at", { ascending: false })
            .limit(limit),
      q
        ? (() => {
            let query = admin.from("diviners").select("user_id, display_name");
            const filters = [`display_name.ilike.${pattern}`];
            if (emailMatchedUserIds.length > 0) {
              filters.push(`user_id.in.(${emailMatchedUserIds.join(",")})`);
            }
            query = query.or(filters.join(","));
            return query.limit(limit);
          })()
        : admin
            .from("diviners")
            .select("user_id, display_name")
            .order("created_at", { ascending: false })
            .limit(limit),
    ]);

    const firstError = [
      clientsRes.error,
      advocatesRes.error,
      communityRes.error,
      traineesRes.error,
      divinersRes.error,
    ].find(Boolean);

    if (firstError) {
      return NextResponse.json({ error: firstError.message }, { status: 500 });
    }

    const divinerRows = (divinersRes.data ?? []) as ProfileRow[];
    const divinerEmailMap = await getAuthEmailMap(
      admin,
      divinerRows.map((row) => cleanString(row.user_id)).filter(Boolean),
    );

    const seen = new Set<string>();
    const users: RequesterSuggestion[] = [];

    const add = (row: ProfileRow, fallbackEmail = "") => {
      const id = cleanString(row.user_id);
      const email = cleanString(row.email) || fallbackEmail;
      if (!id || !email) return;

      const name = profileName(row) || email.split("@")[0];
      const haystack = `${name} ${email}`.toLowerCase();
      if (q && !haystack.includes(q)) return;

      const key = email.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      users.push({ id, name, email });
    };

    for (const row of (clientsRes.data ?? []) as ProfileRow[]) add(row);
    for (const row of (advocatesRes.data ?? []) as ProfileRow[]) add(row);
    for (const row of (communityRes.data ?? []) as ProfileRow[]) add(row);
    for (const row of (traineesRes.data ?? []) as ProfileRow[]) add(row);
    for (const row of divinerRows) add(row, divinerEmailMap[cleanString(row.user_id)] ?? "");

    return NextResponse.json({ users: users.slice(0, limit) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load requesters.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
