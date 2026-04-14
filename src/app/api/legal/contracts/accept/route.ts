import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { acceptUserContractRequirement } from "@/lib/contract-orchestration";

export const dynamic = "force-dynamic";

function getClientIp(req: NextRequest): string | null {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null
  );
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { requirement_id?: string; signature_name?: string } | null;
  if (!body?.requirement_id) {
    return NextResponse.json({ error: "requirement_id is required" }, { status: 422 });
  }
  if (!body.signature_name?.trim()) {
    return NextResponse.json({ error: "signature_name is required" }, { status: 422 });
  }

  try {
    const result = await acceptUserContractRequirement({
      requirementId: body.requirement_id,
      userId: user.id,
      ipAddress: getClientIp(req),
      userAgent: req.headers.get("user-agent"),
      signatureName: body.signature_name.trim(),
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to accept contract" },
      { status: 400 },
    );
  }
}
