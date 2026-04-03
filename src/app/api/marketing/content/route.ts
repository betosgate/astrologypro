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
    const { title, captionTemplate, platforms, imageUrl, category } =
      body as {
        title: string;
        captionTemplate: string;
        platforms: string[];
        imageUrl?: string;
        category?: string;
      };

    if (!title?.trim() || !captionTemplate?.trim()) {
      return NextResponse.json(
        { error: "Title and caption are required" },
        { status: 400 }
      );
    }

    // Verify user is a diviner (only diviners manage marketing content)
    const { data: diviner } = await supabase
      .from("diviners")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!diviner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("marketing_content")
      .insert({
        title: title.trim(),
        caption_template: captionTemplate.trim(),
        platforms: platforms ?? [],
        image_url: imageUrl ?? null,
        category: category ?? "custom",
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("[Marketing] Failed to save content:", error);
      return NextResponse.json(
        { error: "Failed to save content" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    console.error("[Marketing Content] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: diviner } = await supabase
      .from("diviners")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!diviner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = supabase
      .from("marketing_content")
      .select("id, title, caption_template, platforms, image_url, category, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
