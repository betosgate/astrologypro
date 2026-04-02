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
  Megaphone,
  Calendar,
  BarChart3,
  Library,
  Clock,
  Image as ImageIcon,
  Sparkles,
  Moon,
  Sun,
  Star,
  Share2,
  Check,
  ExternalLink,
  MessageSquare,
  Mail,
  Smartphone,
} from "lucide-react";

// --- Push-to-Share Explanation Tab ---

function ShareSystemTab() {
  // Placeholder share batches (would come from Supabase in production)
  const recentBatches = [
    {
      id: "1",
      date: "Mar 31, 2026",
      caption: "Discover what the stars wrote in your birth chart...",
      shared: { facebook: true, twitter: true, whatsapp: true, linkedin: false, instagram: false, tiktok: false },
      token: "abc123",
    },
    {
      id: "2",
      date: "Mar 24, 2026",
      caption: "The cards have a message for you today...",
      shared: { facebook: true, twitter: true, whatsapp: true, linkedin: true, instagram: true, tiktok: false },
      token: "def456",
    },
    {
      id: "3",
      date: "Mar 17, 2026",
      caption: "Your birthday is more than a celebration...",
      shared: { facebook: true, twitter: true, whatsapp: true, linkedin: true, instagram: true, tiktok: true },
      token: "ghi789",
    },
  ];

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
            No accounts to connect. We send you branded content weekly via email
            and text. Just tap to share — it takes 30 seconds.
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
                  Every Monday at 10am, you get a branded post with your custom link.
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
                  Open the Share Hub and share to all your platforms with one tap each.
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
                  See which platforms you shared to and track your marketing consistency.
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
              <p className="text-xs text-muted-foreground">
                Add your phone in Settings to enable
              </p>
            </div>
            <Badge variant="secondary">Off</Badge>
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
          <div className="space-y-3">
            {recentBatches.map((batch) => {
              const platforms = Object.entries(batch.shared);
              const sharedCount = platforms.filter(([, v]) => v).length;
              const total = platforms.length;
              const percent = Math.round((sharedCount / total) * 100);

              return (
                <div
                  key={batch.id}
                  className="flex items-center gap-4 rounded-lg border border-border/50 p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {batch.date}
                      </p>
                      <Badge
                        variant={percent === 100 ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {percent}%
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-foreground/80">
                      {batch.caption}
                    </p>
                    <div className="mt-2 flex gap-1">
                      {platforms.map(([platform, shared]) => (
                        <span
                          key={platform}
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] ${
                            shared
                              ? "bg-green-500/10 text-green-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {/* Progress ring */}
                    <div className="relative flex size-12 items-center justify-center">
                      <svg className="size-12 -rotate-90" viewBox="0 0 36 36">
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
                        {sharedCount}/{total}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
    platforms: ["Facebook", "Twitter / X", "WhatsApp"],
    icon: Sparkles,
    color: "text-purple-400",
  },
  {
    id: "2",
    title: "Full Moon Reading Promo",
    caption:
      "The Full Moon illuminates what is hidden. Discover what the universe has in store for you with a personalized reading. {link}",
    platforms: ["Facebook", "Instagram", "WhatsApp"],
    icon: Moon,
    color: "text-amber-400",
  },
  {
    id: "3",
    title: "New Client Welcome",
    caption:
      "Welcome to your cosmic journey! As your astrologer, I am here to help you navigate life with celestial wisdom. Book your first session: {link}",
    platforms: ["Facebook", "Twitter / X"],
    icon: Star,
    color: "text-cyan-400",
  },
  {
    id: "4",
    title: "Tarot Tuesday",
    caption:
      "It is Tarot Tuesday! Discover what the cards reveal about your week ahead. Limited slots available. {link}",
    platforms: ["Facebook", "Twitter / X", "Instagram"],
    icon: Sparkles,
    color: "text-pink-400",
  },
  {
    id: "5",
    title: "Solar Return Season",
    caption:
      "Birthday coming up? A Solar Return reading reveals the themes and opportunities for your year ahead. Gift yourself cosmic insight. {link}",
    platforms: ["Facebook", "Instagram", "LinkedIn"],
    icon: Sun,
    color: "text-yellow-400",
  },
  {
    id: "6",
    title: "Client Testimonial Share",
    caption:
      "Grateful for this beautiful feedback from a client. Every reading is a sacred exchange. Book your session: {link}",
    platforms: ["Facebook", "Twitter / X", "WhatsApp"],
    icon: Star,
    color: "text-emerald-400",
  },
];

function ContentLibraryTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Content templates we cycle through for your weekly shares. New templates are added regularly.
        </p>
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
                <div className="flex flex-wrap gap-1">
                  {content.platforms.map((p) => (
                    <Badge key={p} variant="secondary" className="text-[10px]">
                      {p}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// --- Upcoming Shares ---

function UpcomingSharesTab() {
  const upcomingBatches = [
    {
      id: "1",
      date: "Apr 7, 2026 at 10:00 AM",
      status: "scheduled" as const,
      template: "Random from content library",
    },
    {
      id: "2",
      date: "Apr 14, 2026 at 10:00 AM",
      status: "scheduled" as const,
      template: "Random from content library",
    },
    {
      id: "3",
      date: "Apr 21, 2026 at 10:00 AM",
      status: "scheduled" as const,
      template: "Random from content library",
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Content packages are automatically prepared and sent every Monday at 10:00 AM UTC.
      </p>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Delivery Date</TableHead>
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
                    {batch.status}
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
            <strong>How it works:</strong> Each Monday, we pick a content template from your library,
            personalize it with your name and booking link, and send you an email and text with a
            Share Hub link. Just tap to share everywhere in 30 seconds.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Share Analytics ---

function ShareAnalyticsTab() {
  const platformStats = [
    { platform: "Facebook", shares: 12, percentage: 100 },
    { platform: "Twitter / X", shares: 11, percentage: 92 },
    { platform: "WhatsApp", shares: 10, percentage: 83 },
    { platform: "LinkedIn", shares: 8, percentage: 67 },
    { platform: "Instagram", shares: 7, percentage: 58 },
    { platform: "TikTok", shares: 5, percentage: 42 },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Track your sharing consistency across platforms.
      </p>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Content Sent</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">12</p>
            <p className="text-xs text-muted-foreground">weekly packages</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Shares</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">53</p>
            <p className="text-xs text-muted-foreground">across all platforms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Completion</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">73%</p>
            <p className="text-xs text-muted-foreground">platforms per batch</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Best Platform</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Facebook</p>
            <p className="text-xs text-muted-foreground">100% share rate</p>
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
          <div className="space-y-3">
            {platformStats.map((row) => (
              <div key={row.platform} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{row.platform}</span>
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
          We send you branded content every week. Tap to share everywhere in 30 seconds.
        </p>
      </div>

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
          <ShareSystemTab />
        </TabsContent>
        <TabsContent value="content">
          <ContentLibraryTab />
        </TabsContent>
        <TabsContent value="upcoming">
          <UpcomingSharesTab />
        </TabsContent>
        <TabsContent value="analytics">
          <ShareAnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
