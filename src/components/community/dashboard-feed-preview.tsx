"use client";

import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  ExternalLink,
  FileText,
  Megaphone,
  Pin,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardFeedItem } from "@/lib/dashboard-content";

const CATEGORY_META = {
  blog: { icon: BookOpen, accent: "from-amber-500/15 to-orange-500/20" },
  announcement: { icon: Megaphone, accent: "from-sky-500/15 to-cyan-500/20" },
  calendar_event: { icon: CalendarDays, accent: "from-violet-500/15 to-fuchsia-500/20" },
  system_video: { icon: PlayCircle, accent: "from-rose-500/15 to-red-500/20" },
  youtube_video: { icon: PlayCircle, accent: "from-red-500/15 to-rose-500/20" },
  document: { icon: FileText, accent: "from-emerald-500/15 to-teal-500/20" },
} as const;

function formatPublishDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getHostLabel(url: string) {
  try {
    const parsed = new URL(url, "https://astrologypro.com");
    return parsed.hostname === "astrologypro.com" ? "AstrologyPro" : parsed.hostname;
  } catch {
    return "AstrologyPro";
  }
}

export function DashboardFeedPreview({
  items,
}: {
  items: DashboardFeedItem[];
}) {
  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">More guidance is on the way</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your dashboard feed will populate automatically as new Perennial Mandalism content is published.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const meta = CATEGORY_META[item.category];
        const Icon = meta.icon;
        const sourceLabel = getHostLabel(item.ctaUrl);

        return (
          <Card key={item.id} className="overflow-hidden transition-colors hover:border-primary/30">
            <div className={`relative h-32 bg-gradient-to-br ${meta.accent}`}>
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <div className="absolute left-3 top-3 flex items-center gap-2">
                <Badge variant="secondary" className="bg-white/90 text-slate-900">
                  {item.badgeLabel}
                </Badge>
                {item.isPinned ? (
                  <Badge variant="outline" className="border-white/60 bg-black/35 text-white">
                    <Pin className="mr-1 size-3" />
                    Pinned
                  </Badge>
                ) : null}
                {item.isNew ? (
                  <Badge className="bg-emerald-500/90 text-white hover:bg-emerald-500/90">
                    New
                  </Badge>
                ) : null}
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
                <div className="flex items-center gap-2 text-white">
                  <div className="flex size-9 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                    <Icon className="size-4" />
                  </div>
                  <div className="text-xs">
                    <div className="font-medium">{sourceLabel}</div>
                    <div className="text-white/80">{formatPublishDate(item.publishAt)}</div>
                  </div>
                </div>
              </div>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="line-clamp-2 text-base">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.description ? (
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
              <Button asChild size="sm" className="w-full">
                <Link
                  href={item.ctaUrl}
                  target={item.ctaUrl.startsWith("http") ? "_blank" : undefined}
                  rel={item.ctaUrl.startsWith("http") ? "noreferrer noopener" : undefined}
                >
                  {item.ctaLabel}
                  <ExternalLink className="ml-1.5 size-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
