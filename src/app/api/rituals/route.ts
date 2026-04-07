import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/rituals — list current user's ritual configurations (paginated)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          type: "https://httpstatuses.com/401",
          title: "Unauthorized",
          status: 401,
          detail: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10))
    );
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from("user_ritual_configurations")
      .select("id, ritual_name, ritual_tags, created_at, updated_at", {
        count: "exact",
      })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        {
          type: "https://httpstatuses.com/500",
          title: "Internal Server Error",
          status: 500,
          detail: "Failed to fetch rituals.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      rituals: data ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch {
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/500",
        title: "Internal Server Error",
        status: 500,
        detail: "An unexpected error occurred.",
      },
      { status: 500 }
    );
  }
}

// POST /api/rituals — create a new ritual configuration
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          type: "https://httpstatuses.com/401",
          title: "Unauthorized",
          status: 401,
          detail: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ritual_name, ritual_tags } = body as {
      ritual_name?: string;
      ritual_tags?: string[];
    };

    if (
      !ritual_name ||
      typeof ritual_name !== "string" ||
      ritual_name.trim().length === 0
    ) {
      return NextResponse.json(
        {
          type: "https://httpstatuses.com/422",
          title: "Unprocessable Entity",
          status: 422,
          detail: "ritual_name is required and must be a non-empty string.",
        },
        { status: 422 }
      );
    }

    if (
      !Array.isArray(ritual_tags) ||
      ritual_tags.length === 0 ||
      ritual_tags.some((t) => typeof t !== "string")
    ) {
      return NextResponse.json(
        {
          type: "https://httpstatuses.com/422",
          title: "Unprocessable Entity",
          status: 422,
          detail:
            "ritual_tags is required and must be a non-empty array of strings.",
        },
        { status: 422 }
      );
    }

    // Look up community_member_id for this user (nullable — gracefully handle if absent)
    const { data: member } = await supabase
      .from("community_members")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data, error } = await supabase
      .from("user_ritual_configurations")
      .insert({
        user_id: user.id,
        community_member_id: member?.id ?? null,
        ritual_name: ritual_name.trim(),
        ritual_tags,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        {
          type: "https://httpstatuses.com/500",
          title: "Internal Server Error",
          status: 500,
          detail: "Failed to create ritual.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/500",
        title: "Internal Server Error",
        status: 500,
        detail: "An unexpected error occurred.",
      },
      { status: 500 }
    );
  }
}
