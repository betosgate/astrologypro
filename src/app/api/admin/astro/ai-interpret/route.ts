import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { callAstroAiApi, AstroAiBody } from "@/lib/astrology-api";

export const dynamic = "force-dynamic";
// AI Lambda calls can take 30-60 s — extend serverless timeout accordingly
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { aiPayload, areaOfInquiry } = body as { aiPayload: AstroAiBody; areaOfInquiry?: string };

  if (!aiPayload) {
    return NextResponse.json({ error: "aiPayload is required" }, { status: 400 });
  }

  try {
    const result = await callAstroAiApi(aiPayload, areaOfInquiry);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI API error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
