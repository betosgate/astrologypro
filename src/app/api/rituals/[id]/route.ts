import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/rituals/[id] — fetch a single ritual config, verify ownership
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: ritual, error } = await supabase
      .from("user_ritual_configurations")
      .select(
        "id, user_id, ritual_name, ritual_tags, created_at, updated_at"
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !ritual) {
      return NextResponse.json(
        {
          type: "https://httpstatuses.com/404",
          title: "Not Found",
          status: 404,
          detail: "Ritual not found or access denied.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ ritual });
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
