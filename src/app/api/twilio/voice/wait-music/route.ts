import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Wait music webhook — called by Twilio for callers waiting in a queue.
 * Returns TwiML that says a brief message then loops calming music.
 */
export async function POST(_request: NextRequest) {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Please hold while we connect you to your reader.</Say>
  <Play loop="0">https://com.twilio.music.classical.s3.amazonaws.com/BusyStrings.mp3</Play>
</Response>`;

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
