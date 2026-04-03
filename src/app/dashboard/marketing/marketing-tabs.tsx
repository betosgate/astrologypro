"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Megaphone,
  Calendar,
  BarChart3,
  Library,
  Clock,
  Share2,
  Check,
  ExternalLink,
  Mail,
  Smartphone,
  Star,
  Moon,
  Sun,
  Sparkles,
  Loader2,
  Plus,
} from "lucide-react";

// ---- Types ----------------------------------------------------------------

export interface ShareBatch {
  id: string;
  token: string;
  caption: string | null;
  image_url: string | null;
  shares: Record<string, string> | null; // platform -> ISO timestamp
  sent_at: string | null;
  share_date: string | null;
  share_number: number | null;
  is_mundane: boolean | null;
  recipient_name: string | null;
  diviner_username: string | null;
}

export interface PlatformStat {
  platform: string;
  shares: number;
  percentage: number;
}

export interface AnalyticsData {
  totalBatches: number;
  totalShares: number;
  avgCompletion: number;
  bestPlatform: string | null;
  bestPlatformRate: number;
  platformStats: PlatformStat[];
}

export interface MarketingTabsProps {
  batches: ShareBatch[];
  analytics: AnalyticsData;
  smsEnabled: boolean;
}

// ---- Helpers ----------------------------------------------------------------

function formatBatchDate(isoString: string | null): string {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getShareProgress(shares: Record<string, string> | null): {
  sharedCount: number;
  platforms: [string, boolean][];
} {
  if (!shares || typeof shares !== "object") {
    return { sharedCount: 0, platforms: [] };
  }
  const platforms: [string, boolean][] = Object.entries(shares).map(
    ([platform, value]) => [platform, !!value]
  );
  const sharedCount = platforms.filter(([, done]) => done).length;
  return { sharedCount, platforms };
}

function getCaptionPreview(caption: string | null): string {
  if (!caption) return "No caption";
  const firstLine = caption.split("\n")[0].trim();
  return firstLine.length > 80 ? firstLine.slice(0, 77) + "…" : firstLine;
}

// ---- ShareSystemTab --------------------------------------------------------

function ShareSystemTab({
  batches,
  smsEnabled,
}: {
  batches: ShareBatch[];
  smsEnabled: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* How it works */}
      <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="size-5 text-violet-400" />
            Push-to-Share Marketing
          </CardTitle>
          <CardDescription>
            No accounts to connect. We send you branded cosmic content — tied to
            real planetary events — via email and text. Just tap to share in 30
            seconds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                <Mail className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium">1. We Send Content</p>
                <p className="text-xs text-muted-foreground">
                  Planetary events trigger branded posts — up to 2 per day —
                  with your personal link.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                <Share2 className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium">2. You Tap Share</p>
                <p className="text-xs text-muted-foreground">
                  Open the Share Hub and share to all your platforms with one
                  tap each.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                <BarChart3 className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium">3. We Track It</p>
                <p className="text-xs text-muted-foreground">
                  See which platforms you shared to and track your marketing
                  consistency over time.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification methods */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Mail className="size-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Email Notifications</p>
              <p className="text-xs text-green-500">Active</p>
            </div>
            <Badge
              variant="outline"
              className="border-green-500/30 bg-green-500/10 text-green-500"
            >
              <Check className="mr-1 size-3" />
              On
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Smartphone className="size-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">SMS Notifications</p>
              {smsEnabled ? (
                <p className="text-xs text-green-500">Active</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Add your phone in Settings to enable
                </p>
              )}
            </div>
            {smsEnabled ? (
              <Badge
                variant="outline"
                className="border-green-500/30 bg-green-500/10 text-green-500"
              >
                <Check className="mr-1 size-3" />
                On
              </Badge>
            ) : (
              <Badge variant="secondary">Off</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent share batches */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Share History</CardTitle>
          <CardDescription>
            Your recent content packages and sharing status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No share batches yet. Your first cosmic content will arrive when
              the next planetary event triggers a share.
            </p>
          ) : (
            <div className="space-y-3">
              {batches.map((batch) => {
                const { sharedCount, platforms } = getShareProgress(
                  batch.shares
                );
                const total = platforms.length;
                const percent =
                  total > 0 ? Math.round((sharedCount / total) * 100) : 0;

                return (
                  <div
                    key={batch.id}
                    className="flex items-center gap-4 rounded-lg border border-border/50 p-3"
                  >
                    {/* Thumbnail */}
                    {batch.image_url && (
                      <div className="hidden shrink-0 sm:block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={batch.image_url}
                          alt=""
                          className="size-12 rounded-md object-cover"
                        />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {formatBatchDate(batch.sent_at)}
                        </p>
                        {batch.is_mundane && batch.share_number != null && (
                          <Badge variant="outline" className="text-[10px]">
                            Share {batch.share_number} of 2
                          </Badge>
                        )}
                        <Badge
                          variant={percent === 100 ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {percent}%
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-sm text-foreground/80">
                        {getCaptionPreview(batch.caption)}
                      </p>
                      {platforms.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {platforms.map(([platform, done]) => (
                            <span
                              key={platform}
                              className={`inline-block rounded px-1.5 py-0.5 text-[10px] ${
                                done
                                  ? "bg-green-500/10 text-green-400"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {platform}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Progress ring + CTA */}
                    <div className="flex shrink-0 flex-col items-center gap-2">
                      <div className="relative flex size-12 items-center justify-center">
                        <svg
                          className="size-12 -rotate-90"
                          viewBox="0 0 36 36"
                        >
                          <path
                            className="text-muted"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          />
                          <path
                            className={
                              percent === 100
                                ? "text-green-500"
                                : "text-violet-500"
                            }
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeDasharray={`${percent}, 100`}
                          />
                        </svg>
                        <span className="absolute text-[10px] font-bold">
                          {total > 0 ? `${sharedCount}/${total}` : "—"}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 px-2 text-[11px]"
                        asChild
                      >
                        <Link
                          href={`/share/${batch.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="size-3" />
                          Share Hub
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---- ContentLibraryTab -----------------------------------------------------

interface ContentItem {
  id: string;
  title: string;
  caption_template: string;
  platforms: string[] | null;
  category: string | null;
  created_at: string;
}

function ContentLibraryTab() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/marketing/content")
      .then((r) => r.ok ? r.json() : { data: [] })
      .then((json) => setItems(json.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const iconForCategory = (cat: string | null) => {
    if (cat === "moon") return Moon;
    if (cat === "sun" || cat === "solar") return Sun;
    if (cat === "testimonial") return Star;
    return Sparkles;
  };

  const colorForCategory = (cat: string | null) => {
    if (cat === "moon") return "text-amber-400";
    if (cat === "sun" || cat === "solar") return "text-yellow-400";
    if (cat === "testimonial") return "text-emerald-400";
    return "text-purple-400";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Your saved content templates will appear here. Create your first one to get started.
        </p>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Library className="mb-3 size-8 text-muted-foreground" />
            <p className="text-sm font-medium">No content yet</p>
            <p className="text-xs text-muted-foreground mb-4">
              Add captions and templates you want to reuse for social posts.
            </p>
            <Button asChild size="sm">
              <Link href="/dashboard/marketing/content">
                <Plus className="mr-1.5 size-3.5" />
                Create Content
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} saved template{items.length !== 1 ? "s" : ""}
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/marketing/content">
            <Plus className="mr-1.5 size-3.5" />
            Add Content
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((content) => {
          const Icon = iconForCategory(content.category);
          const color = colorForCategory(content.category);
          return (
            <Card key={content.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`flex size-10 items-center justify-center rounded-lg bg-muted ${color}`}>
                    <Icon className="size-5" />
                  </div>
                </div>
                <CardTitle className="text-sm">{content.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-3">
                <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                  {content.caption_template}
                </p>
                {content.platforms && content.platforms.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {content.platforms.map((p) => (
                      <Badge key={p} variant="secondary" className="text-[10px]">
                        {p}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ---- UpcomingSharesTab -----------------------------------------------------

function UpcomingSharesTab() {
  // Upcoming is always "scheduled" — we show placeholder dates since the
  // system generates batches from real planetary events, not a fixed schedule.
  const upcomingBatches = [
    { id: "1", date: "Next planetary event", template: "Mundane shares — Share 1 of 2" },
    { id: "2", date: "Same day (if 2 events)", template: "Mundane shares — Share 2 of 2" },
    { id: "3", date: "Following planetary event", template: "Next cosmic content package" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Content packages are triggered by real planetary events — not a fixed
        weekly schedule. On active cosmic days you may receive up to{" "}
        <strong>2 share batches</strong> (Share 1 of 2 and Share 2 of 2), each
        with a different image and caption tied to that event.
      </p>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {upcomingBatches.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell className="text-sm">{batch.date}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {batch.template}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    <Clock className="mr-1 size-3" />
                    scheduled
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Card className="border-dashed">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>How it works:</strong> Our system monitors planetary
            alignments daily. When a significant event occurs (conjunctions,
            retrogrades, full moons, etc.), we generate a branded image and
            caption personalised with your name and booking link, then send you
            an email and SMS with a Share Hub link. Just tap to share everywhere
            in 30 seconds.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- ShareAnalyticsTab -----------------------------------------------------

function ShareAnalyticsTab({ analytics }: { analytics: AnalyticsData }) {
  const {
    totalBatches,
    totalShares,
    avgCompletion,
    bestPlatform,
    bestPlatformRate,
    platformStats,
  } = analytics;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Track your sharing consistency across platforms.
      </p>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Packages Sent</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalBatches}</p>
            <p className="text-xs text-muted-foreground">total share batches</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Shares</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalShares}</p>
            <p className="text-xs text-muted-foreground">
              across all platforms
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Completion</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {totalBatches === 0 ? "—" : `${avgCompletion}%`}
            </p>
            <p className="text-xs text-muted-foreground">platforms per batch</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Best Platform</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {bestPlatform ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {bestPlatform ? `${bestPlatformRate}% share rate` : "No data yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-platform breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform Breakdown</CardTitle>
          <CardDescription>
            How consistently you share to each platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {platformStats.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No sharing data yet. Complete your first batch to see stats here.
            </p>
          ) : (
            <div className="space-y-3">
              {platformStats.map((row) => (
                <div key={row.platform} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">
                      {row.platform}
                    </span>
                    <span className="text-muted-foreground">
                      {row.shares} shares ({row.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all"
                      style={{ width: `${row.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Main exported tabs wrapper --------------------------------------------

export function MarketingTabs({
  batches,
  analytics,
  smsEnabled,
}: MarketingTabsProps) {
  return (
    <Tabs defaultValue="sharing">
      <TabsList>
        <TabsTrigger value="sharing">
          <Share2 className="mr-1.5 size-3.5" />
          Push-to-Share
        </TabsTrigger>
        <TabsTrigger value="content">
          <Library className="mr-1.5 size-3.5" />
          Content Library
        </TabsTrigger>
        <TabsTrigger value="upcoming">
          <Calendar className="mr-1.5 size-3.5" />
          Upcoming
        </TabsTrigger>
        <TabsTrigger value="analytics">
          <BarChart3 className="mr-1.5 size-3.5" />
          Share Tracking
        </TabsTrigger>
      </TabsList>

      <TabsContent value="sharing">
        <ShareSystemTab batches={batches} smsEnabled={smsEnabled} />
      </TabsContent>
      <TabsContent value="content">
        <ContentLibraryTab />
      </TabsContent>
      <TabsContent value="upcoming">
        <UpcomingSharesTab />
      </TabsContent>
      <TabsContent value="analytics">
        <ShareAnalyticsTab analytics={analytics} />
      </TabsContent>
    </Tabs>
  );
}
