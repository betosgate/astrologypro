import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";



export async function GET(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const createdFrom = searchParams.get("created_from") ?? "";
  const createdTo = searchParams.get("created_to") ?? "";
  const updatedFrom = searchParams.get("updated_from") ?? "";
  const updatedTo = searchParams.get("updated_to") ?? "";

  const admin = createAdminClient();
  let query = admin
    .from("roles")
    .select("*", { count: "exact" })
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });

  if (search) query = query.ilike("role_name", `%${search}%`);
  if (status) query = query.eq("status", status);
  if (createdFrom) query = query.gte("created_at", createdFrom);
  if (createdTo) query = query.lte("created_at", createdTo + "T23:59:59");
  if (updatedFrom) query = query.gte("updated_at", updatedFrom);
  if (updatedTo) query = query.lte("updated_at", updatedTo + "T23:59:59");

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count });
}

export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { role_name, slug, description, priority, status } = body;

  if (!role_name || !slug || !description) {
    return NextResponse.json({ error: "role_name, slug, description are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("roles")
    .insert({ role_name, slug, description, priority: priority ?? 0, status: status ?? "active" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
