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

  // Richer metadata for mundane shares
  const isMundane = !!(batch as Record<string, unknown>).is_mundane;
  const title = isMundane
    ? `Mundane Astrology Share - ${diviner?.display_name ?? "AstrologyPro"}`
    : `Share Content - ${diviner?.display_name ?? "AstrologyPro"}`;

  return {
    title,
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

  // Cast to access new mundane columns (added by migration)
  const batchRecord = batch as Record<string, unknown>;
  const isMundane = !!(batchRecord.is_mundane);
  const shareNumber =
    typeof batchRecord.share_number === "number"
      ? (batchRecord.share_number as number)
      : null;
  const shareDate =
    typeof batchRecord.share_date === "string"
      ? (batchRecord.share_date as string)
      : null;
  const imageUrl =
    typeof batchRecord.image_url === "string"
      ? (batchRecord.image_url as string)
      : null;

  return (
    <div className="min-h-screen bg-background">
      <ShareHub
        token={batch.token as string}
        caption={batch.caption as string}
        imageUrl={imageUrl}
        trackingUrl={batch.tracking_url as string}
        initialShares={
          typeof batch.shares === "object" && batch.shares !== null
            ? (batch.shares as Record<string, string>)
            : {}
        }
        divinerName={diviner?.display_name ?? "Diviner"}
        divinerUsername={diviner?.username ?? ""}
        divinerAvatar={diviner?.avatar_url ?? null}
        isMundane={isMundane}
        shareNumber={shareNumber}
        shareDate={shareDate}
      />
    </div>
  );
}
