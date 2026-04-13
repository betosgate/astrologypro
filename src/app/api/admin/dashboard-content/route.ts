import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import {
  createDashboardContentItem,
  listAdminDashboardContent,
  type DashboardContentPayload,
} from "@/lib/dashboard-content";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  try {
    const items = await listAdminDashboardContent({
      category: searchParams.get("category") ?? "",
      publicationState: searchParams.get("publication_state") ?? "",
      itemMode: searchParams.get("item_mode") ?? "",
    });
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load dashboard content" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await req.json()) as DashboardContentPayload;
    const item = await createDashboardContentItem(payload, user.id);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create dashboard content" },
      { status: 400 },
    );
  }
}
