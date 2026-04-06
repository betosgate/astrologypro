import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, ExternalLink, Star, BookMarked } from "lucide-react";
import Link from "next/link";
import type { MandalismContent } from "@/components/community/mandalism-content-preview";

// ── Mandalism content card sub-components are rendered server-side here.
// We import the type only — the full client component is used in the dashboard.
// The library page renders its own server-side card markup directly.

export const metadata = { title: "Library - AstrologyPro Community" };
export const dynamic = "force-dynamic";

// ── Static content ───────────────────────────────────────────────────────────

const HOLY_BOOKS = [
  {
    id: "bhagavad-gita",
    title: "Bhagavad Gita",
    subtitle: "The Song of God",
    description:
      "A 700-verse Hindu scripture that is part of the epic Mahabharata. A conversation between prince Arjuna and his guide Krishna on duty, righteousness, and the nature of the soul.",
    storageKey: "holy-books/bhagavad-gita.pdf",
  },
  {
    id: "gospel-of-thomas",
    title: "Gospel of Thomas",
    subtitle: "The Secret Sayings of Jesus",
    description:
      "114 sayings attributed to Jesus, discovered in Nag Hammadi, Egypt in 1945. A Gnostic text offering a contemplative path to the Kingdom of Heaven within.",
    storageKey: "holy-books/gospel-of-thomas.pdf",
  },
  {
    id: "tao-te-ching",
    title: "Tao Te Ching",
    subtitle: "The Way and Its Virtue",
    description:
      "Lao Tzu's foundational text of Taoism — 81 short chapters on the nature of the Tao, effortless action (wu wei), and living in harmony with the flow of existence.",
    storageKey: "holy-books/tao-te-ching.pdf",
  },
];

const DOCTRINE_LINKS = [
  {
    id: "central-doctrine",
    label: "Central Doctrine",
    description: "The core metaphysical principles of Divine Infinite Being.",
    href: "/community/resources#central-doctrine",
    internal: true,
  },
  {
    id: "fivefold-creed",
    label: "Five-fold Creed",
    description: "The five foundational affirmations of the tradition.",
    href: "/community/resources#fivefold-creed",
    internal: true,
  },
];

// ── Type filter config ───────────────────────────────────────────────────────

type ContentTypeFilter =
  | "all"
  | "video"
  | "youtube"
  | "live_stream"
  | "announcement"
  | "document";

const TYPE_LABELS: Record<ContentTypeFilter, string> = {
  all: "All",
  video: "Video",
  youtube: "YouTube",
  live_stream: "Live Stream",
  announcement: "Announcement",
  document: "Document",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function extractYouTubeId(url: string | null): string | null {
  if (!url) return null;
  const shortMatch = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const longMatch = url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (longMatch) return longMatch[1];
  return null;
}

function getLiveStreamStatus(
  start_at: string | null,
  end_at: string | null
): "live" | "upcoming" | "past" | "unknown" {
  const now = Date.now();
  const start = start_at ? new Date(start_at).getTime() : null;
  const end = end_at ? new Date(end_at).getTime() : null;
  if (start && end) {
    if (now >= start && now <= end) return "live";
    if (now < start) return "upcoming";
    return "past";
  }
  if (start && now < start) return "upcoming";
  if (end && now > end) return "past";
  return "unknown";
}

// ── Server-rendered content cards ────────────────────────────────────────────

function MandalismCard({ item }: { item: MandalismContent }) {
  switch (item.content_type) {
    case "video":
      return (
        <Card className="flex flex-col overflow-hidden">
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            {item.content_thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.content_thumbnail_url}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-violet-600/30 to-indigo-600/30 flex items-center justify-center">
                <FileText className="size-8 text-muted-foreground/50" />
              </div>
            )}
            {item.duration_label && (
              <Badge className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0 hover:bg-black/70">
                {item.duration_label}
              </Badge>
            )}
          </div>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm leading-snug line-clamp-2">{item.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3 pb-4">
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-3">{item.description}</p>
            )}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <ExternalLink className="size-3.5" />
                Watch
              </a>
            )}
          </CardContent>
        </Card>
      );

    case "youtube": {
      const ytId = extractYouTubeId(item.url);
      const thumbSrc = ytId
        ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`
        : null;
      return (
        <Card className="flex flex-col overflow-hidden">
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            {thumbSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbSrc} alt={item.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-red-600/20 to-rose-600/20" />
            )}
          </div>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm leading-snug line-clamp-2">{item.title}</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <ExternalLink className="size-3.5 text-red-500" />
                Watch on YouTube
              </a>
            )}
          </CardContent>
        </Card>
      );
    }

    case "live_stream": {
      const status = getLiveStreamStatus(item.start_at, item.end_at);
      return (
        <Card className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 bg-gradient-to-r from-red-600/20 to-rose-600/20 px-4 py-4">
            <p className="text-xs font-medium text-red-600 uppercase tracking-wide flex-1">
              Live Stream
            </p>
            {status === "live" && (
              <Badge className="bg-red-500 text-white hover:bg-red-500 text-[10px] px-1.5 py-0">
                Live
              </Badge>
            )}
            {status === "upcoming" && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-400 text-amber-600">
                Upcoming
              </Badge>
            )}
            {status === "past" && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                Past
              </Badge>
            )}
          </div>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm leading-snug line-clamp-2">{item.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3 pb-4">
            {item.start_at && (
              <p className="text-xs text-muted-foreground">
                {formatDate(item.start_at)}
                {item.end_at && ` – ${formatDate(item.end_at)}`}
              </p>
            )}
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-3">{item.description}</p>
            )}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <ExternalLink className="size-3.5" />
                Join Stream
              </a>
            )}
          </CardContent>
        </Card>
      );
    }

    case "announcement":
      return (
        <Card className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-4 py-4">
            <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">
              Announcement
            </p>
          </div>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm leading-snug line-clamp-2">{item.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3 pb-4">
            {(item.start_at || item.end_at) && (
              <p className="text-xs text-muted-foreground">
                {item.start_at && formatDate(item.start_at)}
                {item.start_at && item.end_at && " – "}
                {item.end_at && formatDate(item.end_at)}
              </p>
            )}
            {item.description && (
              <p className="text-xs text-muted-foreground">{item.description}</p>
            )}
            {item.content_thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.content_thumbnail_url}
                alt={item.title}
                className="mt-1 rounded-md object-cover w-full max-h-40"
              />
            )}
          </CardContent>
        </Card>
      );

    case "document":
    default:
      return (
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                <FileText className="size-4 text-orange-500" />
              </div>
              <CardTitle className="text-sm leading-snug line-clamp-2">{item.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3 pb-4">
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-3">{item.description}</p>
            )}
            {item.pdf_url && (
              <a
                href={item.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <ExternalLink className="size-3.5" />
                Download PDF
              </a>
            )}
          </CardContent>
        </Card>
      );
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

interface LibraryPageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/join/community");
  if (member.membership_status !== "active") redirect("/join/community?status=inactive");

  // Resolve searchParams (Next.js 15 async searchParams)
  const resolvedParams = await searchParams;
  const rawType = resolvedParams?.type ?? "all";
  const activeFilter: ContentTypeFilter =
    (rawType as ContentTypeFilter) in TYPE_LABELS
      ? (rawType as ContentTypeFilter)
      : "all";

  // ── Parallel fetches ──────────────────────────────────────────────────────
  const [bookUrlsRaw, mandalismResult] = await Promise.all([
    // Signed URLs for holy book PDFs
    Promise.all(
      HOLY_BOOKS.map(async (book) => {
        const { data } = await supabase.storage
          .from("community-content")
          .createSignedUrl(book.storageKey, 3600);
        return { id: book.id, url: data?.signedUrl ?? null };
      })
    ),

    // All published mandalism content, access-control filtered
    supabase
      .from("mandalism_content")
      .select(
        "id, title, content_type, access_control, url, pdf_url, content_thumbnail_url, duration_label, description, start_at, end_at, priority"
      )
      .eq("is_published", true)
      .or(`access_control.eq.free,access_control.eq.members`)
      .order("priority", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
  ]);

  const bookUrls: Record<string, string | null> = Object.fromEntries(
    bookUrlsRaw.map(({ id, url }) => [id, url])
  );

  const allMandalismItems = (mandalismResult.data ?? []) as MandalismContent[];

  // Apply type filter
  const filteredItems =
    activeFilter === "all"
      ? allMandalismItems
      : allMandalismItems.filter((item) => item.content_type === activeFilter);

  // Derive which type filters to show (only types that actually have content)
  const availableTypes = new Set<string>(
    allMandalismItems.map((item) => item.content_type)
  );
  const filterOptions = (
    Object.keys(TYPE_LABELS) as ContentTypeFilter[]
  ).filter((t) => t === "all" || availableTypes.has(t));

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <BookOpen className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Community Library</h1>
        </div>
        <p className="text-muted-foreground">
          Sacred texts, doctrine references, and teaching materials.
        </p>
      </div>

      {/* ── Mandalism Content ──────────────────────────────────────────────── */}
      {allMandalismItems.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BookMarked className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
              Content
            </h2>
            <Badge variant="outline" className="text-xs">
              {allMandalismItems.length} item{allMandalismItems.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          {/* Filter pills */}
          {filterOptions.length > 2 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by content type">
              {filterOptions.map((t) => (
                <Button
                  key={t}
                  asChild
                  variant={activeFilter === t ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                >
                  <Link
                    href={`/community/library${t === "all" ? "" : `?type=${t}`}`}
                    aria-pressed={activeFilter === t}
                  >
                    {TYPE_LABELS[t]}
                    {t !== "all" && (
                      <span className="ml-1 text-[10px] opacity-70">
                        ({allMandalismItems.filter((i) => i.content_type === t).length})
                      </span>
                    )}
                  </Link>
                </Button>
              ))}
            </div>
          )}

          {/* Content grid */}
          {filteredItems.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <MandalismCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No {TYPE_LABELS[activeFilter].toLowerCase()} content yet.
            </p>
          )}
        </section>
      )}

      {/* ── Holy Books ────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-muted-foreground uppercase tracking-wider">
          <BookOpen className="size-4" />
          Holy Books
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {HOLY_BOOKS.map((book) => {
            const url = bookUrls[book.id];
            return (
              <Card key={book.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{book.title}</CardTitle>
                  <CardDescription>{book.subtitle}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <p className="text-sm text-muted-foreground flex-1">{book.description}</p>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <FileText className="size-3.5" />
                      Read PDF
                      <ExternalLink className="size-3 opacity-70" />
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      PDF coming soon
                    </span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Doctrine & Creed ──────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-muted-foreground uppercase tracking-wider">
          <Star className="size-4" />
          Doctrine &amp; Creed
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {DOCTRINE_LINKS.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-start justify-between gap-4 py-4">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link href={item.href}>View</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Diviner CTA ───────────────────────────────────────────────────── */}
      <section>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:text-left sm:gap-8">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Star className="size-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Ready to go deeper?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Book a personal reading with one of our Diviners to explore how these teachings
                apply to your chart and current transits.
              </p>
            </div>
            <Button asChild className="shrink-0">
              <Link href="/diviner">Book a Reading</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
