import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { diviner_id, name, type, discount_percent, min_sessions, is_active } =
      body as {
        diviner_id: string;
        name: string;
        type: "session_count" | "package";
        discount_percent: number;
        min_sessions: number | null;
        is_active: boolean;
      };

    if (!diviner_id || !name || !type || discount_percent == null) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["session_count", "package"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (discount_percent <= 0 || discount_percent > 100) {
      return NextResponse.json(
        { error: "Discount percent must be between 1 and 100" },
        { status: 400 }
      );
    }

    // Verify diviner belongs to user
    const { data: diviner } = await supabase
      .from("diviners")
      .select("id")
      .eq("id", diviner_id)
      .eq("user_id", user.id)
      .single();

    if (!diviner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("discount_rules")
      .insert({
        diviner_id,
        name,
        type,
        discount_percent,
        min_sessions: min_sessions ?? null,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("Insert discount error:", error);
      return NextResponse.json(
        { error: "Failed to create discount" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, is_active } = body as { id: string; is_active: boolean };

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // RLS enforces ownership — update only if owned by user's diviner
    const { error } = await supabase
      .from("discount_rules")
      .update({ is_active })
      .eq("id", id);

    if (error) {
      console.error("Update discount error:", error);
      return NextResponse.json(
        { error: "Failed to update discount" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
