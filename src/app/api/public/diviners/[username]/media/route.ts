import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

const VALID_TYPES = ["video", "audio", "article", "link", "image"] as const;
type MediaType = (typeof VALID_TYPES)[number];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const sp = req.nextUrl.searchParams;
  const typeParam = sp.get("type");

  if (typeParam && !VALID_TYPES.includes(typeParam as MediaType)) {
    return NextResponse.json(
      {
        type: "https://astrologypro.com/errors/invalid-param",
        title: "Invalid type parameter",
        status: 422,
        detail: `type must be one of: ${VALID_TYPES.join(", ")}`,
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Resolve diviner by username
  const { data: diviner, error: divinerError } = await admin
    .from("diviners")
    .select("id, username, display_name, avatar_url")
    .eq("username", username)
    .eq("is_active", true)
    .single();

  if (divinerError || !diviner) {
    return NextResponse.json(
      {
        type: "https://astrologypro.com/errors/not-found",
        title: "Diviner not found",
        status: 404,
      },
      { status: 404 }
    );
  }

  let query = admin
    .from("media_items")
    .select(
      "id, type, url, title, description, thumbnail_url, category, platform, duration_seconds, sort_order, is_featured, view_count, created_at"
    )
    .eq("diviner_id", diviner.id)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (typeParam) {
    query = query.eq("type", typeParam);
  }

  const { data: items, error: itemsError } = await query;

  if (itemsError) {
    console.error("[GET /api/public/diviners/[username]/media]", itemsError);
    return NextResponse.json(
      {
        type: "https://astrologypro.com/errors/internal",
        title: "Internal server error",
        status: 500,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      items: items ?? [],
      diviner: {
        id: diviner.id,
        username: diviner.username,
        display_name: diviner.display_name,
        avatar_url: diviner.avatar_url,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300",
      },
    }
  );
}
