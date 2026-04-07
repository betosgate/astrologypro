import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface OrderRow {
  id: string;
  product_title: string;
  product_type: string;
  amount_cents: number;
  currency: string;
  status: string;
  paid_at: string | null;
  delivered_at: string | null;
  created_at: string;
  diviners: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  } | null;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const cursor = searchParams.get("cursor"); // format: "created_at::id"

    const LIMIT = 20;

    let query = supabase
      .from("orders")
      .select(
        `id, product_title, product_type, amount_cents, currency, status,
         paid_at, delivered_at, created_at,
         diviners(display_name, username, avatar_url)`
      )
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(LIMIT + 1);

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    if (cursor) {
      const [cursorDate, cursorId] = cursor.split("::");
      if (cursorDate && cursorId) {
        query = query.or(
          `created_at.lt.${cursorDate},and(created_at.eq.${cursorDate},id.lt.${cursorId})`
        );
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("[portal/orders] Query error:", error);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    const rows = (data ?? []) as unknown as OrderRow[];
    const hasMore = rows.length > LIMIT;
    const items = hasMore ? rows.slice(0, LIMIT) : rows;

    const nextCursor =
      hasMore && items.length > 0
        ? `${items[items.length - 1].created_at}::${items[items.length - 1].id}`
        : null;

    return NextResponse.json({ orders: items, nextCursor, hasMore });
  } catch (err) {
    console.error("[portal/orders] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
