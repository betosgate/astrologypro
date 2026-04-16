import { NextRequest, NextResponse } from "next/server";
import { createChimeAttendee } from "@/lib/chime-meetings";

export const dynamic = "force-dynamic";

/**
 * POST /api/chime/voice/create-attendee
 * Called by the SMA Lambda to create a Chime meeting attendee and get a
 * fresh JoinToken. We need this because JoinTokens are too long to pass
 * through the SMA ArgumentsMap (which may truncate long values).
 *
 * Body: { meetingId, externalUserId }
 * Returns: { attendeeId, joinToken }
 */
export async function POST(request: NextRequest) {
  try {
    // Auth: Lambda uses CRON_SECRET
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET;
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { meetingId, externalUserId } = await request.json();

    if (!meetingId || !externalUserId) {
      return NextResponse.json(
        { error: "Missing meetingId or externalUserId" },
        { status: 400 }
      );
    }

    const attendee = await createChimeAttendee(meetingId, externalUserId);

    return NextResponse.json({
      attendeeId: attendee.attendeeId,
      joinToken: attendee.joinToken,
    });
  } catch (error) {
    console.error("[chime/voice/create-attendee] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create attendee",
      },
      { status: 500 }
    );
  }
}
