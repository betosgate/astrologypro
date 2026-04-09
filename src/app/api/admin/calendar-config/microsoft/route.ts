import type { NextRequest } from "next/server";
import {
  listHandler,
  createHandler,
} from "@/lib/calendar/admin-credentials";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET  /api/admin/calendar-config/microsoft
 *   ?reveal=1  — return raw values instead of masked
 *
 * POST /api/admin/calendar-config/microsoft
 *   Body: { key, value, description?, is_active? }
 */

export function GET(req: NextRequest) {
  return listHandler(req, "microsoft_api_keys");
}

export function POST(req: NextRequest) {
  return createHandler(req, "microsoft_api_keys");
}
