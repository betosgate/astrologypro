import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { callAstroAiApi, AstroAiBody } from "@/lib/astrology-api";

export const dynamic = "force-dynamic";
// AI Lambda calls can take 30-60 s — extend serverless timeout accordingly
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { aiPayload, areaOfInquiry } = body as {
    aiPayload: AstroAiBody;
    areaOfInquiry?: string;
  };

  if (!aiPayload) {
    return NextResponse.json({ error: "aiPayload is required" }, { status: 400 });
  }

  let lastError: unknown;
  const maxRetries = 10;
  const delayMs = 15000; // 15 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await callAstroAiApi(aiPayload, areaOfInquiry);
      console.log(`Ai Result [Attempt ${attempt}]---------->>`, JSON.stringify(result));
      return NextResponse.json(result);
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : "AI API error";
      console.log(`Ai Error [Attempt ${attempt}]---------->>`, JSON.stringify(msg));

      if (attempt < maxRetries) {
        console.log(`Retrying in ${delayMs / 1000} seconds... (Attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  const finalMsg = lastError instanceof Error ? lastError.message : "AI API error after max retries";
  return NextResponse.json({ error: finalMsg }, { status: 502 });
}
