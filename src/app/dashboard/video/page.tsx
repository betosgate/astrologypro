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

  // Creation of new video rooms requires VideoSDK API credentials. Historical
  // `video_sessions` rows, however, live in our own Supabase table and are safe
  // (and expected) to display regardless of current env configuration. We used
  // to bail out early here with a "not configured" banner, which hid years of
  // completed sessions from diviners. Instead: always query the table, and
  // gate only the "New Session" action via the `canCreateNew` prop.
  const canCreateNew = isVideoSDKConfigured();

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
      canCreateNew={canCreateNew}
    />
  );
}
