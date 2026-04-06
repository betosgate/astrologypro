import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSundayServiceNewEpisode } from "@/lib/email";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const admin = createAdminClient();

  // Fetch current session state to detect live publish transition
  const { data: current } = await admin
    .from("sunday_service_sessions")
    .select("is_live, title, description")
    .eq("id", id)
    .single();

  const { data, error } = await admin
    .from("sunday_service_sessions")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ── Send email to all active community members when episode goes live ─────
  const goingLive = body.is_live === true && current?.is_live === false;
  if (goingLive) {
    try {
      const { data: members } = await admin
        .from("community_members")
        .select("email")
        .eq("membership_status", "active")
        .not("email", "is", null);

      const emailPromises = (members ?? [])
        .filter((m) => !!m.email)
        .map((m) =>
          sendSundayServiceNewEpisode({
            to: m.email as string,
            episodeTitle: data.title,
            episodeDescription: data.description ?? null,
            watchUrl: `${APP_URL}/community/sunday-service`,
          })
        );

      // Fire-and-forget — do not block the response
      Promise.allSettled(emailPromises).catch(() => {});
    } catch {
      // Email errors must not fail the PATCH response
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin
    .from("sunday_service_sessions")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
