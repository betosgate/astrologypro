import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { ShareHub } from "@/components/share/share-hub";

interface PageProps {
  params: Promise<{ token: string }>;
}

async function getShareBatch(token: string) {
  const admin = createAdminClient();

  const { data: batch, error } = await admin
    .from("share_batches")
    .select(
      "*, diviners(id, username, display_name, avatar_url)"
    )
    .eq("token", token)
    .single();

  if (error || !batch) {
    return null;
  }

  return batch;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { token } = await params;
  const batch = await getShareBatch(token);

  if (!batch) {
    return { title: "Share Not Found" };
  }

  const diviner = batch.diviners as {
    display_name: string;
    username: string;
  } | null;

  return {
    title: `Share Content - ${diviner?.display_name ?? "AstrologyPro"}`,
    description: "Share your branded content to all social platforms in seconds.",
  };
}

export default async function SharePage({ params }: PageProps) {
  const { token } = await params;
  const batch = await getShareBatch(token);

  if (!batch) {
    notFound();
  }

  const diviner = batch.diviners as {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;

  return (
    <div className="min-h-screen bg-background">
      <ShareHub
        token={batch.token}
        caption={batch.caption}
        imageUrl={batch.image_url}
        trackingUrl={batch.tracking_url}
        initialShares={
          typeof batch.shares === "object" && batch.shares !== null
            ? (batch.shares as Record<string, string>)
            : {}
        }
        divinerName={diviner?.display_name ?? "Diviner"}
        divinerUsername={diviner?.username ?? ""}
        divinerAvatar={diviner?.avatar_url ?? null}
      />
    </div>
  );
}
