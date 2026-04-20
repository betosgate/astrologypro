/**
 * POST /api/social/disconnect/[platform]?scope=admin|diviner
 *
 * Revokes the active connection for the caller on the given platform.
 *   1. Look up active row for (owner, platform).
 *   2. Ask the adapter to revoke on the remote provider (best-effort).
 *   3. Soft-disconnect (set disconnected_at = now). The row stays for audit.
 */

import { NextRequest, NextResponse } from "next/server";
import { isPlatform } from "@/lib/social/types";
import { getPlatform, isPlatformEnabled } from "@/lib/social/platform-registry";
import {
  getActiveConnection,
  disconnectConnection,
} from "@/lib/social/accounts-repo";
import { resolveOwnerFromRequest } from "@/lib/social/resolve-owner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;

  if (!isPlatform(platform)) {
    return NextResponse.json({ error: "Unknown platform" }, { status: 404 });
  }

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") as "admin" | "diviner" | null;
  const resolved = await resolveOwnerFromRequest(scope);
  if (!resolved) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connection = await getActiveConnection(resolved.owner, platform);
  if (!connection) {
    return NextResponse.json(
      { error: "No active connection" },
      { status: 404 },
    );
  }

  // Best-effort remote revoke (skip if platform is disabled — the stub would throw).
  if (isPlatformEnabled(platform)) {
    try {
      await getPlatform(platform).adapter.revoke(connection);
    } catch (err) {
      console.warn(`[social/disconnect/${platform}] remote revoke failed:`, err);
    }
  }

  await disconnectConnection(connection.id);

  return NextResponse.json({ success: true });
}
