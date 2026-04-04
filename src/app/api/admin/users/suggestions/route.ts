import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

/** GET /api/admin/users/suggestions?q=... — typeahead for the users search box */
export async function GET(req: NextRequest) {
  // Auth guard
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return NextResponse.json({ suggestions: [] }, { status: 403 });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ suggestions: [] });

  const admin = createAdminClient();
  const pattern = `%${q}%`;

  // Query all five tables in parallel — name, email, phone
  const [diviners, clients, advocates, community, trainees, authUsers] = await Promise.all([
    admin.from("diviners").select("display_name, user_id, phone").ilike("display_name", pattern).limit(5),
    admin.from("clients").select("full_name, email, phone").or(`full_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`).limit(5),
    admin.from("social_advocates").select("name, email").or(`name.ilike.${pattern},email.ilike.${pattern}`).limit(5),
    admin.from("community_members").select("full_name, email").or(`full_name.ilike.${pattern},email.ilike.${pattern}`).limit(5),
    admin.from("trainees").select("name, email").or(`name.ilike.${pattern},email.ilike.${pattern}`).limit(5),
    // For diviners email lookup
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const authEmailMap: Record<string, string> = {};
  for (const u of authUsers.data?.users ?? []) authEmailMap[u.id] = u.email ?? "";

  const seen = new Set<string>();
  const suggestions: Array<{ value: string; type: "name" | "email" | "phone"; display: string }> = [];

  function add(value: string, type: "name" | "email" | "phone", display: string) {
    const key = `${type}:${value.toLowerCase()}`;
    if (seen.has(key) || !value) return;
    seen.add(key);
    suggestions.push({ value, type, display });
  }

  // Diviners — name + email (from auth map)
  for (const d of (diviners.data ?? []) as Array<{ display_name: string; user_id: string; phone?: string }>) {
    if (d.display_name) add(d.display_name, "name", d.display_name);
    const email = authEmailMap[d.user_id];
    if (email && email.toLowerCase().includes(q.toLowerCase())) add(email, "email", email);
    if (d.phone && d.phone.includes(q)) add(d.phone, "phone", d.phone);
  }

  // Other tables
  for (const c of (clients.data ?? []) as Array<{ full_name?: string; email?: string; phone?: string }>) {
    if (c.full_name) add(c.full_name, "name", c.full_name);
    if (c.email) add(c.email, "email", c.email);
    if (c.phone) add(c.phone, "phone", c.phone);
  }
  for (const a of (advocates.data ?? []) as Array<{ name?: string; email?: string }>) {
    if (a.name) add(a.name, "name", a.name);
    if (a.email) add(a.email, "email", a.email);
  }
  for (const m of (community.data ?? []) as Array<{ full_name?: string; email?: string }>) {
    if (m.full_name) add(m.full_name, "name", m.full_name);
    if (m.email) add(m.email, "email", m.email);
  }
  for (const t of (trainees.data ?? []) as Array<{ name?: string; email?: string }>) {
    if (t.name) add(t.name, "name", t.name);
    if (t.email) add(t.email, "email", t.email);
  }

  return NextResponse.json({ suggestions: suggestions.slice(0, 8) });
}
