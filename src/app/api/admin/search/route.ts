import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";


export interface SearchResult {
  type: "user" | "booking" | "lesson" | "blog";
  id: string;
  label: string;
  sublabel?: string;
  url: string;
  role?: string;
}

export interface SearchResponse {
  results: {
    users: SearchResult[];
    bookings: SearchResult[];
    lessons: SearchResult[];
    blog: SearchResult[];
  };
  total: number;
}

export async function GET(req: NextRequest): Promise<NextResponse<SearchResponse | { error: string }>> {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({
      results: { users: [], bookings: [], lessons: [], blog: [] },
      total: 0,
    });
  }

  const limitParam = parseInt(req.nextUrl.searchParams.get("limit") ?? "5", 10);
  const limit = Number.isNaN(limitParam) || limitParam < 1 || limitParam > 20 ? 5 : limitParam;

  const admin = createAdminClient();
  const pattern = `%${q}%`;

  // Run all queries in parallel
  const [divinersRes, traineesRes, communityRes, bookingsRes, lessonsRes, blogRes] =
    await Promise.all([
      // Diviners — search display_name; email comes from auth.users via user_id
      admin
        .from("diviners")
        .select("id, user_id, display_name")
        .ilike("display_name", pattern)
        .limit(limit),

      // Trainees — search name + email
      admin
        .from("trainees")
        .select("id, name, email")
        .or(`name.ilike.${pattern},email.ilike.${pattern}`)
        .limit(limit),

      // Community members — search full_name + email
      admin
        .from("community_members")
        .select("id, full_name, email, membership_type")
        .or(`full_name.ilike.${pattern},email.ilike.${pattern}`)
        .limit(limit),

      // Bookings — join client to get full_name; search via clients table
      // Use two-step: find matching clients, then load their bookings
      admin
        .from("clients")
        .select("id, full_name, email")
        .or(`full_name.ilike.${pattern},email.ilike.${pattern}`)
        .limit(limit),

      // Training lessons — search title
      admin
        .from("training_lessons")
        .select("id, title, category_id, training_categories(name)")
        .ilike("title", pattern)
        .eq("is_active", true)
        .limit(limit),

      // Blog posts — search title
      admin
        .from("blog_posts")
        .select("id, title, category")
        .ilike("title", pattern)
        .limit(limit),
    ]);

  // For diviners, resolve emails via auth.users bulk-by-ids
  type DivinerRow = { id: string; user_id: string; display_name: string };
  const divinerRows = (divinersRes.data ?? []) as DivinerRow[];
  const divinerUserIds = divinerRows.map((d) => d.user_id);

  let authEmailMap: Record<string, string> = {};
  if (divinerUserIds.length > 0) {
    // Use the get_auth_users_by_ids RPC if available, else fall back to listUsers
    const rpcRes = await admin.rpc("get_auth_users_by_ids", { user_ids: divinerUserIds });
    if (!rpcRes.error && rpcRes.data) {
      for (const row of rpcRes.data as Array<{ id: string; email: string }>) {
        authEmailMap[row.id] = row.email;
      }
    } else {
      // Fallback: use admin auth listUsers (less efficient but safe)
      const { data: authData } = await admin.auth.admin.listUsers({ perPage: 500 });
      const idSet = new Set(divinerUserIds);
      for (const u of authData?.users ?? []) {
        if (idSet.has(u.id)) authEmailMap[u.id] = u.email ?? "";
      }
    }
  }

  // Build user results — deduplicate by combining diviners + trainees + community
  const seen = new Set<string>();
  const users: SearchResult[] = [];

  for (const d of divinerRows) {
    if (seen.has(d.id)) continue;
    seen.add(d.id);
    const email = authEmailMap[d.user_id] ?? "";
    users.push({
      type: "user",
      id: d.id,
      label: d.display_name,
      sublabel: email || undefined,
      url: `/admin/users?search=${encodeURIComponent(email || d.display_name)}`,
      role: "diviner",
    });
  }

  type TraineeRow = { id: string; name: string; email: string };
  for (const t of (traineesRes.data ?? []) as TraineeRow[]) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    users.push({
      type: "user",
      id: t.id,
      label: t.name,
      sublabel: t.email,
      url: `/admin/users?search=${encodeURIComponent(t.email)}`,
      role: "trainee",
    });
  }

  type CommunityRow = { id: string; full_name: string | null; email: string; membership_type: string };
  for (const m of (communityRes.data ?? []) as CommunityRow[]) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    users.push({
      type: "user",
      id: m.id,
      label: m.full_name ?? m.email,
      sublabel: m.email,
      url: `/admin/users?search=${encodeURIComponent(m.email)}`,
      role: m.membership_type ?? "community",
    });
  }

  // Bookings — look up recent bookings for matching clients
  type ClientRow = { id: string; full_name: string | null; email: string };
  const matchingClientIds = ((bookingsRes.data ?? []) as ClientRow[]).map((c) => c.id);
  const clientNameMap: Record<string, string> = {};
  for (const c of (bookingsRes.data ?? []) as ClientRow[]) {
    clientNameMap[c.id] = c.full_name ?? c.email;
  }

  let bookings: SearchResult[] = [];
  if (matchingClientIds.length > 0) {
    const { data: bookingRows } = await admin
      .from("bookings")
      .select("id, client_id, scheduled_at, status")
      .in("client_id", matchingClientIds)
      .order("scheduled_at", { ascending: false })
      .limit(limit);

    for (const b of (bookingRows ?? []) as Array<{
      id: string;
      client_id: string;
      scheduled_at: string;
      status: string;
    }>) {
      const clientName = clientNameMap[b.client_id] ?? "Unknown";
      const dateStr = new Date(b.scheduled_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      bookings.push({
        type: "booking",
        id: b.id,
        label: `Booking #${b.id.slice(0, 8).toUpperCase()}`,
        sublabel: `${clientName} · ${dateStr}`,
        url: `/admin/bookings/${b.id}`,
      });
    }
  }

  // Lessons
  type LessonRow = {
    id: string;
    title: string;
    category_id: string | null;
    training_categories: { name: string }[] | { name: string } | null;
  };
  const lessons: SearchResult[] = ((lessonsRes.data ?? []) as unknown as LessonRow[]).map((l) => {
    const cat = l.training_categories;
    const catName = Array.isArray(cat) ? cat[0]?.name : (cat as { name: string } | null)?.name;
    return {
      type: "lesson",
      id: l.id,
      label: l.title,
      sublabel: catName ?? undefined,
      url: `/admin/training/lessons/${l.id}/edit`,
    };
  });

  // Blog
  type BlogRow = { id: string; title: string; category: string };
  const blog: SearchResult[] = ((blogRes.data ?? []) as BlogRow[]).map((b) => ({
    type: "blog",
    id: b.id,
    label: b.title,
    sublabel: b.category,
    url: `/admin/blog/${b.id}/edit`,
  }));

  const total = users.length + bookings.length + lessons.length + blog.length;

  return NextResponse.json({
    results: {
      users: users.slice(0, limit),
      bookings: bookings.slice(0, limit),
      lessons,
      blog,
    },
    total,
  });
}
