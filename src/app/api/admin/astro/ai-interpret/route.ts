import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { callAstroAiApi, AstroAiBody } from "@/lib/astrology-api";

export const dynamic = "force-dynamic";
// AI Lambda calls can take 30-60 s — extend serverless timeout accordingly
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { aiPayload, areaOfInquiry } = body as {
    aiPayload: AstroAiBody;
    areaOfInquiry?: string;
  };

  if (!aiPayload) {
    return NextResponse.json({ error: "aiPayload is required" }, { status: 400 });
  }

  // Retry policy:
  //   - retry on transient errors only (network, 5xx, 429)
  //   - DO NOT retry 4xx — they won't recover and just waste serverless time
  //   - exponential-ish backoff with jitter so multiple instances don't thunder
  //   - never log the payload (it contains birth data) — log only the error
  const maxRetries = 10;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await callAstroAiApi(aiPayload, areaOfInquiry);
      return NextResponse.json(result);
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : "AI API error";
      console.error(`[ai-interpret] attempt ${attempt}/${maxRetries}: ${msg}`);

      // Detect non-retryable client errors (4xx). The helper throws Error
      // messages that include the upstream status code in most paths.
      const isClient4xx = /\b(400|401|403|404|405|409|410|422)\b/.test(msg);
      if (isClient4xx) {
        return NextResponse.json(
          { error: msg },
          { status: 502 },
        );
      }

      if (attempt < maxRetries) {
        const baseMs = Math.min(2 ** (attempt - 1) * 1000, 8000);
        const jitterMs = Math.floor(Math.random() * 500);
        await new Promise((resolve) => setTimeout(resolve, baseMs + jitterMs));
      }
    }
  }

  const finalMsg =
    lastError instanceof Error ? lastError.message : "AI API error after max retries";
  return NextResponse.json({ error: finalMsg }, { status: 502 });
}
