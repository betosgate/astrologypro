import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { getChimeVoiceClient } from "@/lib/chime-client";
import { SearchAvailablePhoneNumbersCommand } from "@aws-sdk/client-chime-sdk-voice";

export const dynamic = "force-dynamic";

/**
 * GET /api/chime/voice/test-credentials
 * Admin-only diagnostic endpoint — tests whether the configured AWS Chime
 * credentials can successfully call SearchAvailablePhoneNumbers.
 *
 * Returns the raw error name/message on failure so you can debug without
 * digging through terminal logs.
 *
 * DELETE THIS ROUTE before deploying to production.
 */
export async function GET() {
  const adminEmail = await getAdminUser();
  if (!adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const diagnostics: Record<string, unknown> = {
    hasAccessKeyId: !!process.env.AWS_CHIME_ACCESS_KEY_ID,
    accessKeyIdPrefix: process.env.AWS_CHIME_ACCESS_KEY_ID?.slice(0, 8) + "...",
    hasSecretAccessKey: !!process.env.AWS_CHIME_SECRET_ACCESS_KEY,
    region: process.env.AWS_CHIME_REGION ?? process.env.AWS_REGION ?? "us-east-1",
    smaId: process.env.CHIME_SMA_ID ?? "(not set)",
  };

  const voice = getChimeVoiceClient();

  // Test 1: Search for a Local number (area code 212)
  try {
    const localResult = await voice.send(
      new SearchAvailablePhoneNumbersCommand({
        PhoneNumberType: "Local",
        Country: "US",
        AreaCode: "212",
        MaxResults: 1,
      })
    );
    diagnostics.localSearch = {
      success: true,
      count: localResult.E164PhoneNumbers?.length ?? 0,
      sample: localResult.E164PhoneNumbers?.[0] ?? null,
    };
  } catch (err: unknown) {
    const e = err as Error & { name?: string; $metadata?: unknown; Code?: string };
    diagnostics.localSearch = {
      success: false,
      errorName: e.name,
      errorMessage: e.message,
      errorCode: e.Code,
      metadata: e.$metadata,
    };
  }

  // Test 2: Search for a TollFree number
  try {
    const tollFreeResult = await voice.send(
      new SearchAvailablePhoneNumbersCommand({
        PhoneNumberType: "TollFree",
        Country: "US",
        MaxResults: 1,
      })
    );
    diagnostics.tollFreeSearch = {
      success: true,
      count: tollFreeResult.E164PhoneNumbers?.length ?? 0,
      sample: tollFreeResult.E164PhoneNumbers?.[0] ?? null,
    };
  } catch (err: unknown) {
    const e = err as Error & { name?: string; $metadata?: unknown; Code?: string };
    diagnostics.tollFreeSearch = {
      success: false,
      errorName: e.name,
      errorMessage: e.message,
      errorCode: e.Code,
      metadata: e.$metadata,
    };
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
