import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface ReorderItem {
  id: string;
  sort_order: number;
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://astrologypro.com/errors/unauthorized", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { items } = body as { items?: ReorderItem[] };

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      {
        type: "https://astrologypro.com/errors/validation",
        title: "items array is required",
        status: 422,
      },
      { status: 422 }
    );
  }

  // Validate all items have id and sort_order
  for (const item of items) {
    if (!item.id || typeof item.sort_order !== "number") {
      return NextResponse.json(
        {
          type: "https://astrologypro.com/errors/validation",
          title: "Each item must have id (string) and sort_order (number)",
          status: 422,
        },
        { status: 422 }
      );
    }
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Update sort_order for each item sequentially
  const errors: string[] = [];
  for (const item of items) {
    const { error } = await admin
      .from("media_items")
      .update({ sort_order: item.sort_order, updated_at: now })
      .eq("id", item.id);

    if (error) {
      errors.push(`${item.id}: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    console.error("[POST /api/admin/media-items/reorder] partial errors:", errors);
    return NextResponse.json(
      {
        type: "https://astrologypro.com/errors/internal",
        title: "Some items failed to update",
        status: 500,
        detail: errors.join("; "),
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, updated: items.length });
}
