/**
 * GET /api/social/accounts?scope=admin|diviner
 *
 * Returns the list of active social connections for the caller.
 * Never returns tokens — only the public/safe projection.
 */

import { NextRequest, NextResponse } from "next/server";
import { listActiveConnections } from "@/lib/social/accounts-repo";
import { listPlatformsForUi } from "@/lib/social/platform-registry";
import { resolveOwnerFromRequest } from "@/lib/social/resolve-owner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") as "admin" | "diviner" | null;

  const resolved = await resolveOwnerFromRequest(scope);
  if (!resolved) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [connections, platforms] = await Promise.all([
    listActiveConnections(resolved.owner),
    Promise.resolve(listPlatformsForUi()),
  ]);

  return NextResponse.json({
    owner: {
      type: resolved.owner.type,
      id: resolved.owner.id,
    },
    platforms,
    connections,
  });
}
