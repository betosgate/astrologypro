import type { NextRequest } from "next/server";
import {
  listHandler,
  createHandler,
} from "@/lib/calendar/admin-credentials";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET  /api/admin/calendar-config/google
 *   ?reveal=1  — return raw values instead of masked
 *
 * POST /api/admin/calendar-config/google
 *   Body: { key, value, description?, is_active? }
 *
 * Both endpoints require admin auth (enforced by the shared handlers).
 */

export function GET(req: NextRequest) {
  return listHandler(req, "google_api_keys");
}

export function POST(req: NextRequest) {
  return createHandler(req, "google_api_keys");
}
