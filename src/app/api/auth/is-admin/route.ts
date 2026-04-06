import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * GET /api/auth/is-admin
 *
 * Returns whether the authenticated user has admin access.
 * Admin access is driven by the admin_users table (DB-first),
 * with ADMIN_EMAILS env var as a bootstrap fallback.
 */
export async function GET() {
  const user = await requireAdmin();
  return NextResponse.json({ isAdmin: !!user });
}
