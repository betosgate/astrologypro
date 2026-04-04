import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member || member.membership_status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const title = sp.get("title") ?? "";
  const location = sp.get("location") ?? "";
  const author = sp.get("author") ?? "";
  const sector = sp.get("sector") ?? "";
  const tag = sp.get("tag") ?? "";
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = 12;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("ingress_charts")
    .select("id, title, ingress_type, importance, short_description, effective_time_period, event_timestamp, validity_start, validity_end, location_name, tags, sector_focus, author_name, is_social_advo, created_at", { count: "exact" })
    .eq("is_published", true);

  if (title) query = query.ilike("title", `%${title}%`);
  if (location) query = query.ilike("location_name", `%${location}%`);
  if (author) query = query.ilike("author_name", `%${author}%`);
  if (sector) query = query.contains("sector_focus", [sector]);
  if (tag) query = query.contains("tags", [tag]);
  if (from) query = query.gte("validity_start", from);
  if (to) query = query.lte("validity_end", to);

  const { data, error, count } = await query
    .order("event_timestamp", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    charts: data ?? [],
    total: count ?? 0,
    page,
    hasMore: offset + limit < (count ?? 0),
  });
}
