import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Dequeue route — called by Twilio when the diviner answers (mobile or browser).
 * Returns TwiML that dequeues the waiting caller from the diviner's queue.
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const diviner_id = searchParams.get("diviner_id");

    if (!diviner_id) {
      return twimlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Configuration error. Please try again.</Say>
  <Hangup/>
</Response>`);
    }

    const supabase = createAdminClient();

    const { data: diviner } = await supabase
      .from("diviners")
      .select("id")
      .eq("id", diviner_id)
      .single();

    if (!diviner) {
      return twimlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">We could not locate this reader. Please try again.</Say>
  <Hangup/>
</Response>`);
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dequeue name="diviner-${diviner_id}"/>
</Response>`;

    return twimlResponse(twiml);
  } catch (error) {
    console.error("[Twilio Dequeue] Error:", error);
    return twimlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">A technical error occurred. Please try again.</Say>
  <Hangup/>
</Response>`);
  }
}

function twimlResponse(twiml: string): NextResponse {
  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
