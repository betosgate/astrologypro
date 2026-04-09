import type { NextRequest } from "next/server";
import {
  getOneHandler,
  patchHandler,
  deleteHandler,
} from "@/lib/calendar/admin-credentials";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET    /api/admin/calendar-config/microsoft/[id]   — single row (raw value)
 * PATCH  /api/admin/calendar-config/microsoft/[id]   — update
 * DELETE /api/admin/calendar-config/microsoft/[id]   — delete
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return getOneHandler(req, "microsoft_api_keys", id);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return patchHandler(req, "microsoft_api_keys", id);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return deleteHandler(req, "microsoft_api_keys", id);
}
