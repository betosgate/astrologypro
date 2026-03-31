"use client";

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
  Camera,
  AtSign,
  Tv,
  Hash,
  Globe,
  Megaphone,
  Calendar,
  BarChart3,
  Library,
  Link2,
  Clock,
  Image as ImageIcon,
  Sparkles,
  Moon,
  Sun,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// --- Connected Accounts ---

interface PlatformConfig {
  name: string;
  icon: LucideIcon;
  connected: boolean;
  handle: string | null;
  oauthUrl: string | null;
}

const PLATFORM_INSTAGRAM = "Instagram";
const PLATFORM_TWITTER = "Twitter / X";
const PLATFORM_YOUTUBE = "YouTube";
const PLATFORM_TIKTOK = "TikTok";
const PLATFORM_FACEBOOK = "Facebook";

const platforms: PlatformConfig[] = [
  {
    name: PLATFORM_INSTAGRAM,
    icon: Camera,
    connected: false,
    handle: null,
    oauthUrl: "https://app.ayrshare.com/oauth/instagram",
  },
  {
    name: PLATFORM_TWITTER,
    icon: AtSign,
    connected: false,
    handle: null,
    oauthUrl: "https://app.ayrshare.com/oauth/twitter",
  },
  {
    name: PLATFORM_YOUTUBE,
    icon: Tv,
    connected: false,
    handle: null,
    oauthUrl: "https://app.ayrshare.com/oauth/youtube",
  },
  {
    name: PLATFORM_TIKTOK,
    icon: Hash,
    connected: false,
    handle: null,
    oauthUrl: "https://app.ayrshare.com/oauth/tiktok",
  },
  {
    name: PLATFORM_FACEBOOK,
    icon: Globe,
    connected: false,
    handle: null,
    oauthUrl: null, // manual posting
  },
];

function ConnectedAccountsTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Connect your social media accounts to schedule and publish posts
        directly from your dashboard.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          return (
            <Card key={platform.name}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{platform.name}</p>
                    {platform.connected ? (
                      <p className="text-xs text-green-500">
                        Connected as {platform.handle}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Not connected
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {platform.connected ? (
                    <Badge
                      variant="outline"
                      className="border-green-500/30 bg-green-500/10 text-green-500"
                    >
                      Connected
                    </Badge>
                  ) : platform.oauthUrl ? (
                    <Button size="sm" variant="outline" asChild>
                      <a href={platform.oauthUrl}>
                        <Link2 className="mr-1.5 size-3.5" />
                        Connect
                      </a>
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" disabled>
                      Manual Only
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card className="border-dashed">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Facebook personal profiles require manual
            posting — we will send you a link to share.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Content Library ---

const placeholderContent = [
  {
    id: "1",
    title: "Mercury Retrograde Alert",
    caption:
      "Mercury retrograde is approaching! Book a session to prepare for this cosmic shift. {link}",
    platforms: [PLATFORM_INSTAGRAM, PLATFORM_TWITTER, PLATFORM_FACEBOOK],
    icon: Sparkles,
    color: "text-purple-400",
  },
  {
    id: "2",
    title: "Full Moon Reading Promo",
    caption:
      "The Full Moon illuminates what is hidden. Discover what the universe has in store for you with a personalized reading. {link}",
    platforms: [PLATFORM_INSTAGRAM, PLATFORM_FACEBOOK, PLATFORM_TIKTOK],
    icon: Moon,
    color: "text-amber-400",
  },
  {
    id: "3",
    title: "New Client Welcome",
    caption:
      "Welcome to your cosmic journey! As your astrologer, I am here to help you navigate life with celestial wisdom. Book your first session: {link}",
    platforms: [PLATFORM_INSTAGRAM, PLATFORM_TWITTER],
    icon: Star,
    color: "text-cyan-400",
  },
  {
    id: "4",
    title: "Tarot Tuesday",
    caption:
      "It is Tarot Tuesday! Discover what the cards reveal about your week ahead. Limited slots available. {link}",
    platforms: [PLATFORM_INSTAGRAM, PLATFORM_TWITTER, PLATFORM_TIKTOK],
    icon: Sparkles,
    color: "text-pink-400",
  },
  {
    id: "5",
    title: "Solar Return Season",
    caption:
      "Birthday coming up? A Solar Return reading reveals the themes and opportunities for your year ahead. Gift yourself cosmic insight. {link}",
    platforms: [PLATFORM_INSTAGRAM, PLATFORM_FACEBOOK, PLATFORM_YOUTUBE],
    icon: Sun,
    color: "text-yellow-400",
  },
  {
    id: "6",
    title: "Client Testimonial Share",
    caption:
      "Grateful for this beautiful feedback from a client. Every reading is a sacred exchange. Book your session: {link}",
    platforms: [PLATFORM_INSTAGRAM, PLATFORM_FACEBOOK, PLATFORM_TWITTER],
    icon: Star,
    color: "text-emerald-400",
  },
];

function ContentLibraryTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Pre-made content templates ready to customize and schedule.
        </p>
        <Button size="sm" variant="outline" asChild>
          <a href="/dashboard/marketing/content">
            <ImageIcon className="mr-1.5 size-3.5" />
            Manage Content
          </a>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {placeholderContent.map((content) => {
          const Icon = content.icon;
          return (
            <Card key={content.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div
                    className={`flex size-10 items-center justify-center rounded-lg bg-muted ${content.color}`}
                  >
                    <Icon className="size-5" />
                  </div>
                </div>
                <CardTitle className="text-sm">{content.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-3">
                <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
                  {content.caption}
                </p>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {content.platforms.map((p) => (
                      <Badge key={p} variant="secondary" className="text-[10px]">
                        {p}
                      </Badge>
                    ))}
                  </div>
                  <Button size="sm" className="w-full">
                    <Calendar className="mr-1.5 size-3.5" />
                    Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// --- Scheduled Posts ---

const placeholderPosts = [
  {
    id: "1",
    date: "2026-04-02 10:00 AM",
    content: "Mercury retrograde is approaching! Book a session...",
    platforms: [PLATFORM_INSTAGRAM, PLATFORM_TWITTER],
    status: "scheduled" as const,
  },
  {
    id: "2",
    date: "2026-04-05 2:00 PM",
    content: "The Full Moon illuminates what is hidden...",
    platforms: [PLATFORM_INSTAGRAM, PLATFORM_FACEBOOK],
    status: "scheduled" as const,
  },
  {
    id: "3",
    date: "2026-03-28 9:00 AM",
    content: "It is Tarot Tuesday! Discover what the cards...",
    platforms: [PLATFORM_INSTAGRAM, PLATFORM_TWITTER, PLATFORM_TIKTOK],
    status: "posted" as const,
  },
  {
    id: "4",
    date: "2026-03-25 12:00 PM",
    content: "Welcome to your cosmic journey...",
    platforms: [PLATFORM_INSTAGRAM],
    status: "failed" as const,
  },
];

function ScheduledPostsTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        View and manage your scheduled social media posts.
      </p>
      {placeholderPosts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="mb-3 size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No scheduled posts yet. Head to the Content Library to get
              started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Platforms</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {placeholderPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="text-sm">{post.date}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {post.content}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {post.platforms.map((p) => (
                        <Badge
                          key={p}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        post.status === "posted"
                          ? "default"
                          : post.status === "failed"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {post.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// --- Analytics ---

function AnalyticsTab() {
  const placeholderAnalytics = [
    { platform: PLATFORM_INSTAGRAM, posts: 12, clicks: 342, impressions: 4521 },
    { platform: PLATFORM_TWITTER, posts: 8, clicks: 156, impressions: 2103 },
    { platform: PLATFORM_FACEBOOK, posts: 5, clicks: 89, impressions: 1245 },
    { platform: PLATFORM_TIKTOK, posts: 3, clicks: 67, impressions: 890 },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Track the performance of your social media posts across platforms.
      </p>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Posts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">28</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Clicks</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">654</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Impressions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">8,759</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Click Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">7.5%</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-platform breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead className="text-right">Posts</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">Click Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {placeholderAnalytics.map((row) => (
                <TableRow key={row.platform}>
                  <TableCell className="font-medium">{row.platform}</TableCell>
                  <TableCell className="text-right">{row.posts}</TableCell>
                  <TableCell className="text-right">{row.clicks}</TableCell>
                  <TableCell className="text-right">
                    {row.impressions.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {((row.clicks / row.impressions) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Main Page ---

export default function MarketingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Social Media Marketing
        </h1>
        <p className="text-muted-foreground">
          Connect your accounts, create content, and grow your practice.
        </p>
      </div>

      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">
            <Link2 className="mr-1.5 size-3.5" />
            Connected Accounts
          </TabsTrigger>
          <TabsTrigger value="content">
            <Library className="mr-1.5 size-3.5" />
            Content Library
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <Calendar className="mr-1.5 size-3.5" />
            Scheduled Posts
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="mr-1.5 size-3.5" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <ConnectedAccountsTab />
        </TabsContent>
        <TabsContent value="content">
          <ContentLibraryTab />
        </TabsContent>
        <TabsContent value="scheduled">
          <ScheduledPostsTab />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
