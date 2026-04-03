import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ShareHub } from "@/components/share/share-hub";

// Share pages are public read-only content — they never change after creation.
// force-static: tells Next.js to produce public Cache-Control headers even on
//   first render, breaking the ISR deadlock where dynamic Supabase fetches
//   cause "private, no-cache, no-store" which prevents Facebook from scraping.
// revalidate: ISR background refresh every hour.
// unstable_cache (on getShareBatch): caches the Supabase query in Next.js
//   data cache so repeated renders skip the round-trip to the database.
export const dynamic = "force-static";
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ token: string }>;
}

const getShareBatch = unstable_cache(
  async (token: string) => {
    const admin = createAdminClient();

    const { data: batch, error } = await admin
      .from("share_batches")
      .select("*, diviners(id, username, display_name, avatar_url)")
      .eq("token", token)
      .single();

    if (error || !batch) return null;
    return batch;
  },
  ["share-batch"],
  { revalidate: 3600 }
);

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

  const batchRecord = batch as Record<string, unknown>;
  const isMundane = !!(batchRecord.is_mundane);
  const imageUrl = typeof batchRecord.image_url === "string" ? batchRecord.image_url : null;
  const caption = typeof batch.caption === "string" ? batch.caption : "";

  // Extract event label (first line) and description (second paragraph) from caption
  const captionLines = caption.split("\n\n");
  const eventLabel = captionLines[0]?.trim() ?? "";
  const eventDescription = captionLines[1]?.trim() ?? "";

  const title = isMundane && eventLabel
    ? `${eventLabel} — ${diviner?.display_name ?? "AstrologyPro"}`
    : `Share Content - ${diviner?.display_name ?? "AstrologyPro"}`;

  const description = eventDescription || "Daily mundane astrology insights for your social media.";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const sharePageUrl = `${appUrl}/share/${token}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: sharePageUrl,
      siteName: "AstrologyPro",
      type: "website",
      ...(imageUrl ? {
        images: [{
          url: imageUrl,
          width: 1080,
          height: 1080,
          alt: eventLabel || title,
        }],
      } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
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
