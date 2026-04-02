import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Zap } from "lucide-react";
import { MarketingTabs } from "./marketing-tabs";
import type { ShareBatch, AnalyticsData, PlatformStat } from "./marketing-tabs";

export const metadata = {
  title: "Marketing",
};

// ---------------------------------------------------------------------------
// Analytics computation
// ---------------------------------------------------------------------------

function computeAnalytics(batches: ShareBatch[]): AnalyticsData {
  if (batches.length === 0) {
    return {
      totalBatches: 0,
      totalShares: 0,
      avgCompletion: 0,
      bestPlatform: null,
      bestPlatformRate: 0,
      platformStats: [],
    };
  }

  // Collect per-platform counts
  const platformShareCounts: Record<string, number> = {};
  const platformTotalOpportunities: Record<string, number> = {};
  let totalShares = 0;
  let totalCompletionPct = 0;

  for (const batch of batches) {
    const shares = batch.shares;
    if (!shares || typeof shares !== "object") continue;

    const entries = Object.entries(shares);
    const sharedCount = entries.filter(([, v]) => !!v).length;
    const total = entries.length;

    totalShares += sharedCount;
    if (total > 0) {
      totalCompletionPct += Math.round((sharedCount / total) * 100);
    }

    for (const [platform, value] of entries) {
      platformTotalOpportunities[platform] =
        (platformTotalOpportunities[platform] ?? 0) + 1;
      if (value) {
        platformShareCounts[platform] =
          (platformShareCounts[platform] ?? 0) + 1;
      }
    }
  }

  const batchesWithShares = batches.filter(
    (b) => b.shares && typeof b.shares === "object"
  ).length;

  const avgCompletion =
    batchesWithShares > 0
      ? Math.round(totalCompletionPct / batchesWithShares)
      : 0;

  // Build platform stats sorted by share count desc
  const platformStats: PlatformStat[] = Object.keys(
    platformTotalOpportunities
  )
    .map((platform) => {
      const shares = platformShareCounts[platform] ?? 0;
      const opportunities = platformTotalOpportunities[platform] ?? 1;
      return {
        platform,
        shares,
        percentage: Math.round((shares / opportunities) * 100),
      };
    })
    .sort((a, b) => b.shares - a.shares);

  const best = platformStats[0] ?? null;

  return {
    totalBatches: batches.length,
    totalShares,
    avgCompletion,
    bestPlatform: best?.platform ?? null,
    bestPlatformRate: best?.percentage ?? 0,
    platformStats,
  };
}

// ---------------------------------------------------------------------------
// Today's Shares section
// ---------------------------------------------------------------------------

function TodaySharesBanner({ todayBatches }: { todayBatches: ShareBatch[] }) {
  if (todayBatches.length === 0) {
    return (
      <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-indigo-500/5">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
            <Zap className="size-5 text-violet-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Today&apos;s Shares</p>
            <p className="text-xs text-muted-foreground">
              Today&apos;s cosmic content is being prepared — check back at 10am
              UTC.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/10">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-500/20">
              <Zap className="size-5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">Today&apos;s Shares</p>
                <Badge className="bg-violet-500 text-white text-[10px]">
                  {todayBatches.length} ready
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {todayBatches.length === 1
                  ? "Your cosmic content is ready to share."
                  : `${todayBatches.length} content packages ready — share both for maximum reach.`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {todayBatches.map((batch, i) => (
              <Button
                key={batch.id}
                size="sm"
                className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
                asChild
              >
                <Link
                  href={`/share/${batch.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Share2 className="size-3.5" />
                  {todayBatches.length > 1
                    ? `Share Now (${i + 1} of ${todayBatches.length})`
                    : "Share Now →"}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page (server component)
// ---------------------------------------------------------------------------

export default async function MarketingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: diviner } = await supabase
    .from("diviners")
    .select("id, phone, share_notifications_enabled")
    .eq("user_id", user.id)
    .single();

  if (!diviner) redirect("/onboarding");

  // Fetch last 10 share batches for this diviner (own batches only, not affiliates)
  const { data: rawBatches } = await supabase
    .from("share_batches")
    .select(
      "id, token, caption, image_url, shares, sent_at, share_date, share_number, is_mundane, recipient_name, diviner_username"
    )
    .eq("diviner_id", diviner.id)
    .is("affiliate_id", null)
    .order("sent_at", { ascending: false })
    .limit(10);

  const batches: ShareBatch[] = (rawBatches ?? []).map((b: any) => ({
    id: b.id,
    token: b.token,
    caption: b.caption,
    image_url: b.image_url,
    shares: b.shares,
    sent_at: b.sent_at,
    share_date: b.share_date,
    share_number: b.share_number,
    is_mundane: b.is_mundane,
    recipient_name: b.recipient_name,
    diviner_username: b.diviner_username,
  }));

  // Determine today's batches (UTC date match)
  const todayUtc = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const todayBatches = batches.filter((b) => {
    const batchDay =
      b.share_date ??
      (b.sent_at ? b.sent_at.slice(0, 10) : null);
    return batchDay === todayUtc;
  });

  // Compute analytics
  const analytics = computeAnalytics(batches);

  // SMS enabled if diviner has a phone and notifications enabled
  const smsEnabled = !!(
    diviner.phone && diviner.share_notifications_enabled
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Social Media Marketing
        </h1>
        <p className="text-muted-foreground">
          We send you branded cosmic content — tied to real planetary events.
          Tap to share everywhere in 30 seconds.
        </p>
      </div>

      {/* Today's shares — prominently above the tabs */}
      <TodaySharesBanner todayBatches={todayBatches} />

      {/* Tabs (client component for state) */}
      <MarketingTabs
        batches={batches}
        analytics={analytics}
        smsEnabled={smsEnabled}
      />
    </div>
  );
}
