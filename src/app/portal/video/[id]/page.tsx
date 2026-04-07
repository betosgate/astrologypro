import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { VideoJoin } from "@/components/portal/video-join";

export const dynamic = "force-dynamic";

interface PortalVideoPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}

export default async function PortalVideoPage({
  params,
  searchParams,
}: PortalVideoPageProps) {
  const { id } = await params;
  const { t } = await searchParams;
  const admin = createAdminClient();

  const { data: session } = await admin
    .from("video_sessions")
    .select(
      `id, room_id, room_name, status,
       diviners(id, display_name)`
    )
    .eq("id", id)
    .in("status", ["created", "waiting", "live"])
    .maybeSingle();

  if (!session) notFound();

  // `t` is the client_token passed in the URL — it will be validated by the
  // join API endpoint. We do not expose the stored client_token to the browser.
  const clientSessionToken = t ?? "";

  const divinerName =
    (session.diviners as { display_name?: string | null } | null)
      ?.display_name ?? "Your Diviner";

  return (
    <VideoJoin
      sessionId={session.id}
      sessionName={session.room_name ?? "Video Reading"}
      divinerName={divinerName}
      clientSessionToken={clientSessionToken}
      sessionStatus={session.status}
    />
  );
}
