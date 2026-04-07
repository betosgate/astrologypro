import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { VideoSessionsList } from "@/components/dashboard/video-sessions-list";
import { isVideoSDKConfigured } from "@/lib/videosdk";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Video Sessions",
};

export default async function DashboardVideoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) redirect("/onboarding");

  if (!isVideoSDKConfigured()) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-[#f5f0e8]">Video Sessions</h1>
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-6 py-8 text-center">
          <p className="text-sm text-yellow-300">
            Video reading system not configured. Contact support to enable video sessions.
          </p>
        </div>
      </div>
    );
  }

  const LIMIT = 20;
  const { data: rawData } = await admin
    .from("video_sessions")
    .select(
      `id, booking_id, room_id, room_name, status,
       started_at, ended_at, duration_seconds, phone_dial_in_enabled,
       created_at,
       clients(id, full_name, email)`
    )
    .eq("diviner_id", diviner.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(LIMIT + 1);

  const rows = rawData ?? [];
  const hasMore = rows.length > LIMIT;
  const sessions = hasMore ? rows.slice(0, LIMIT) : rows;
  const lastItem = sessions[sessions.length - 1];
  const nextCursor =
    hasMore && lastItem
      ? `${lastItem.created_at}:${lastItem.id}`
      : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedSessions = (sessions as any[]).map((s) => ({
    ...s,
    clients: Array.isArray(s.clients) ? (s.clients[0] ?? null) : s.clients,
  })) as Parameters<typeof VideoSessionsList>[0]["initialSessions"];

  return (
    <VideoSessionsList
      initialSessions={typedSessions}
      initialNextCursor={nextCursor}
      initialHasMore={hasMore}
    />
  );
}
