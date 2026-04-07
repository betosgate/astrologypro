import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { VideoRoom } from "@/components/dashboard/video-room";
import { generateVideoSDKToken, isVideoSDKConfigured } from "@/lib/videosdk";

export const dynamic = "force-dynamic";

interface VideoSessionPageProps {
  params: Promise<{ id: string }>;
}

export default async function VideoSessionPage({ params }: VideoSessionPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Get diviner record
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) redirect("/onboarding");

  // Fetch session with ownership check
  const { data: session } = await admin
    .from("video_sessions")
    .select(
      `id, room_id, room_name, status, diviner_token, client_token, client_id,
       started_at, ended_at, duration_seconds, created_at`
    )
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .maybeSingle();

  if (!session) notFound();

  // Participant count
  const { count: participantCount } = await admin
    .from("video_session_participants")
    .select("id", { count: "exact", head: true })
    .eq("session_id", id);

  // Refresh tokens server-side so they are fresh on page load
  if (!isVideoSDKConfigured()) {
    return (
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-6 py-8 text-center">
        <p className="text-sm text-yellow-300">
          Video reading system not configured. Contact support.
        </p>
      </div>
    );
  }

  const divinerToken = await generateVideoSDKToken(
    session.room_id,
    diviner.id,
    diviner.display_name ?? "Host",
    "host",
    3600
  );

  let clientToken: string | undefined;
  if (session.client_id && session.client_token) {
    const { data: clientRow } = await admin
      .from("clients")
      .select("id, full_name")
      .eq("id", session.client_id)
      .maybeSingle();
    if (clientRow) {
      clientToken = await generateVideoSDKToken(
        session.room_id,
        clientRow.id,
        clientRow.full_name ?? "Guest",
        "guest",
        3600
      );
    }
  }

  return (
    <VideoRoom
      sessionId={session.id}
      roomId={session.room_id}
      token={divinerToken}
      role="host"
      sessionName={session.room_name ?? "Video Reading"}
      sessionStatus={session.status}
      clientToken={clientToken ?? session.client_token ?? undefined}
      participantCount={participantCount ?? 0}
    />
  );
}
