import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "tarot" | "birth_chart" | "astro_toolkit";

interface TarotItem {
  id: string;
  user_id: string;
  user_email: string | null;
  spread_name: string | null;
  cards_count: number;
  notes: string | null;
  created_at: string;
}

interface BirthChartItem {
  id: string;
  user_id: string;
  user_email: string | null;
  city_label: string | null;
  birth_date: string;
  created_at: string;
}

interface AstroToolkitItem {
  id: string;
  user_id: string;
  user_email: string | null;
  reading_type: string | null;
  created_at: string;
}

type ReadingItem = TarotItem | BirthChartItem | AstroToolkitItem;

interface PaginatedResponse {
  items: ReadingItem[];
  next_cursor: string | null;
}

// ─── Helper: resolve emails for a list of user_ids ───────────────────────────

async function resolveEmails(
  admin: ReturnType<typeof createAdminClient>,
  userIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (userIds.length === 0) return map;

  // auth.users is accessible via the admin client's auth API
  // We batch-list users — Supabase admin.auth.admin.listUsers only returns up to 1000 at a time
  // For the filtered set we just iterate the returned page
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error || !data) return map;

  for (const u of data.users) {
    if (userIds.includes(u.id)) {
      map.set(u.id, u.email ?? "");
    }
  }
  return map;
}

// ─── GET handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tab: Tab = (searchParams.get("tab") as Tab) || "tarot";
  const search = searchParams.get("search")?.trim() ?? "";
  const typeFilter = searchParams.get("type")?.trim() ?? "";
  const cursor = searchParams.get("cursor")?.trim() ?? "";
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "25", 10), 1), 100);

  const admin = createAdminClient();

  // ─── Tarot ─────────────────────────────────────────────────────────────────
  if (tab === "tarot") {
    let query = admin
      .from("tarot_readings")
      .select("id, user_id, spread_name, cards, notes, created_at")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      // keyset: created_at < cursor_date OR (created_at = cursor_date AND id < cursor_id)
      // Simplify: filter by id for stable keyset (UUID ordered by insertion isn't reliable)
      // Use created_at-based cursor stored as ISO string
      query = query.lt("created_at", cursor);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = data ?? [];
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    const userIds = [...new Set(page.map((r) => r.user_id))];
    const emailMap = await resolveEmails(admin, userIds);

    let items: TarotItem[] = page.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      user_email: emailMap.get(r.user_id) ?? null,
      spread_name: r.spread_name ?? null,
      cards_count: Array.isArray(r.cards) ? (r.cards as unknown[]).length : 0,
      notes: r.notes ?? null,
      created_at: r.created_at,
    }));

    // Client-side email search (Supabase can't join auth.users in RPC easily)
    if (search) {
      const lc = search.toLowerCase();
      items = items.filter((i) => i.user_email?.toLowerCase().includes(lc));
    }

    const next_cursor =
      hasMore && page.length > 0 ? page[page.length - 1].created_at : null;

    const response: PaginatedResponse = { items, next_cursor };
    return NextResponse.json(response);
  }

  // ─── Birth Chart ────────────────────────────────────────────────────────────
  if (tab === "birth_chart") {
    let query = admin
      .from("birth_chart_results")
      .select("id, user_id, city_label, birth_day, birth_month, birth_year, created_at")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = data ?? [];
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    const userIds = [...new Set(page.map((r) => r.user_id))];
    const emailMap = await resolveEmails(admin, userIds);

    let items: BirthChartItem[] = page.map((r) => {
      const day = r.birth_day ?? "?";
      const month = r.birth_month ?? "?";
      const year = r.birth_year ?? "?";
      return {
        id: r.id,
        user_id: r.user_id,
        user_email: emailMap.get(r.user_id) ?? null,
        city_label: r.city_label ?? null,
        birth_date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        created_at: r.created_at,
      };
    });

    if (search) {
      const lc = search.toLowerCase();
      items = items.filter((i) => i.user_email?.toLowerCase().includes(lc));
    }

    const next_cursor =
      hasMore && page.length > 0 ? page[page.length - 1].created_at : null;

    const response: PaginatedResponse = { items, next_cursor };
    return NextResponse.json(response);
  }

  // ─── Astro Toolkit ──────────────────────────────────────────────────────────
  {
    let query = admin
      .from("astro_toolkit_readings")
      .select("id, user_id, reading_type, created_at")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    if (typeFilter) {
      query = query.eq("reading_type", typeFilter);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = data ?? [];
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    const userIds = [...new Set(page.map((r) => r.user_id))];
    const emailMap = await resolveEmails(admin, userIds);

    let items: AstroToolkitItem[] = page.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      user_email: emailMap.get(r.user_id) ?? null,
      reading_type: r.reading_type ?? null,
      created_at: r.created_at,
    }));

    if (search) {
      const lc = search.toLowerCase();
      items = items.filter((i) => i.user_email?.toLowerCase().includes(lc));
    }

    const next_cursor =
      hasMore && page.length > 0 ? page[page.length - 1].created_at : null;

    const response: PaginatedResponse = { items, next_cursor };
    return NextResponse.json(response);
  }
}
