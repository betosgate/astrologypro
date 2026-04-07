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
import Link from "next/link";
import { Tv, Radio } from "lucide-react";

export const metadata = { title: "Sunday Service - AstrologyPro Community" };
export const dynamic = "force-dynamic";

type ServiceSession = {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  recorded_at: string;
  is_live: boolean;
  live_starts_at: string | null;
  book_name: string | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function VideoEmbed({ url }: { url: string }) {
  // Support YouTube, Vimeo, and raw iframe-compatible URLs
  let embedUrl = url;

  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (ytMatch) {
    embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return (
    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
      <iframe
        src={embedUrl}
        className="absolute inset-0 h-full w-full rounded-md"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

interface SundayServicePageProps {
  searchParams: Promise<{ book?: string }>;
}

export default async function SundayServicePage({ searchParams }: SundayServicePageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/join/community");
  if (member.membership_status !== "active") redirect("/join/community?status=inactive");

  const { data: sessions } = await supabase
    .from("sunday_service_sessions")
    .select("id, title, description, video_url, thumbnail_url, recorded_at, is_live, live_starts_at, book_name")
    .order("recorded_at", { ascending: false });

  const allSessions = (sessions ?? []) as ServiceSession[];
  const liveSession = allSessions.find((s) => s.is_live);
  const archivedAll = allSessions.filter((s) => !s.is_live);

  // ── Book filter ───────────────────────────────────────────────────────────
  const resolvedParams = await searchParams;
  const activeBook = resolvedParams?.book ?? "";

  // Derive unique book names from archived sessions that have one
  const bookNames = Array.from(
    new Set(archivedAll.map((s) => s.book_name).filter((b): b is string => !!b))
  ).sort();

  const archived = activeBook
    ? archivedAll.filter((s) => s.book_name === activeBook)
    : archivedAll;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <Tv className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Sunday Service</h1>
        </div>
        <p className="text-muted-foreground">
          Weekly gatherings for the community — live and archived.
        </p>
      </div>

      {/* Live / upcoming */}
      {liveSession && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-red-500 animate-pulse" />
            <span className="text-sm font-semibold text-red-600 uppercase tracking-wider">
              Live Now
            </span>
          </div>
          <Card className="border-red-400/40 bg-red-50/30">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg">{liveSession.title}</CardTitle>
                <Badge variant="destructive" className="shrink-0">LIVE</Badge>
              </div>
              {liveSession.description && (
                <CardDescription>{liveSession.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <VideoEmbed url={liveSession.video_url} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Archive */}
      <div className="space-y-4">
        {archivedAll.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
              Archive
            </h2>

            {/* Book filter pills — only shown when there are book_name values */}
            {bookNames.length > 0 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by book">
                <Button
                  asChild
                  variant={!activeBook ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                >
                  <Link href="/community/sunday-service" aria-pressed={!activeBook}>
                    All
                  </Link>
                </Button>
                {bookNames.map((book) => (
                  <Button
                    key={book}
                    asChild
                    variant={activeBook === book ? "default" : "outline"}
                    size="sm"
                    className="rounded-full"
                  >
                    <Link
                      href={`/community/sunday-service?book=${encodeURIComponent(book)}`}
                      aria-pressed={activeBook === book}
                    >
                      {book}
                    </Link>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {archived.length === 0 && !liveSession && archivedAll.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Tv className="size-10 text-muted-foreground/40" />
              <div>
                <p className="font-medium">No sessions yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Sunday Service recordings will appear here after each gathering.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {archived.length === 0 && activeBook && (
          <p className="text-sm text-muted-foreground italic">
            No sessions found for &ldquo;{activeBook}&rdquo;.
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          {archived.map((session) => (
            <Card key={session.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">{session.title}</CardTitle>
                  {session.book_name && (
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {session.book_name}
                    </Badge>
                  )}
                </div>
                <CardDescription>{formatDate(session.recorded_at)}</CardDescription>
              </CardHeader>
              {session.description && (
                <div className="px-6 pb-2 text-sm text-muted-foreground line-clamp-2">
                  {session.description}
                </div>
              )}
              <CardContent className="pt-2">
                <VideoEmbed url={session.video_url} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
