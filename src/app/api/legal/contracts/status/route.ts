import { NextResponse } from "next/server";
import { getContractStatusForCurrentUser } from "@/lib/contract-orchestration";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await getContractStatusForCurrentUser();
    return NextResponse.json({
      roles: status.roles,
      pending: status.pending,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load contract status" },
      { status: 401 },
    );
  }
}
