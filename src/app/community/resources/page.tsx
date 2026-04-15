import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Video, Radio, Megaphone, PlayCircle, Lock, BookOpen } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import Link from "next/link";

export const metadata = { title: "Resources - AstrologyPro Community" };
export const dynamic = "force-dynamic";

type ContentType = "live_stream" | "video" | "document" | "youtube" | "announcement";

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  live_stream: "Live Stream",
  video: "Video",
  document: "Document",
  youtube: "YouTube",
  announcement: "Announcement",
};

const CONTENT_TYPE_BADGE_COLORS: Record<ContentType, string> = {
  live_stream: "bg-red-500/10 text-red-500",
  video: "bg-blue-500/10 text-blue-500",
  document: "bg-yellow-500/10 text-yellow-600",
  youtube: "bg-red-600/10 text-red-600",
  announcement: "bg-purple-500/10 text-purple-500",
};

function extractYouTubeId(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    return u.searchParams.get("v") ?? "";
  } catch {
    return "";
  }
}

export default async function CommunityResourcesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_type, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/join/community");
  if (member.membership_status !== "active") redirect("/join/community/resubscribe");

  const isActiveMember = member.membership_status === "active";

  const { data: allContent } = await supabase
    .from("mandalism_content")
    .select("id, content_type, title, description, url, pdf_url, content_body, start_at, end_at, access_control, priority, is_published")
    .eq("is_published", true)
    .order("priority", { ascending: true });

  const content = (allContent ?? []).filter((item) =>
    item.access_control === "free" || isActiveMember
  );

  const grouped: Record<ContentType, typeof content> = {
    live_stream: content.filter((c) => c.content_type === "live_stream"),
    youtube: content.filter((c) => c.content_type === "youtube"),
    video: content.filter((c) => c.content_type === "video"),
    document: content.filter((c) => c.content_type === "document"),
    announcement: content.filter((c) => c.content_type === "announcement"),
  };

  const sections: { key: ContentType; label: string; Icon: React.ElementType }[] = [
    { key: "live_stream", label: "Live Streams", Icon: Radio },
    { key: "youtube", label: "Videos (YouTube)", Icon: PlayCircle },
    { key: "video", label: "Videos", Icon: Video },
    { key: "document", label: "Documents", Icon: FileText },
    { key: "announcement", label: "Announcements", Icon: Megaphone },
  ];

  const totalVisible = content.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
        <p className="text-muted-foreground">Community content library</p>
      </div>

      {totalVisible === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <BookOpen className="size-7 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-medium">No resources available yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Community resources will appear here once published. Check back soon.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/community">Back to Community</Link>
          </Button>
        </div>
      )}

      {sections.map(({ key, label, Icon }) => {
        const items = grouped[key];
        if (items.length === 0) return null;

        return (
          <section key={key} className="space-y-4">
            <div className="flex items-center gap-2">
              <Icon className="size-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">{label}</h2>
              <span className="text-sm text-muted-foreground">({items.length})</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const isMemberOnly = item.access_control !== "free";
                const canAccess = !isMemberOnly || isActiveMember;
                const contentType = item.content_type as ContentType;

                return (
                  <Card key={item.id} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
                        {isMemberOnly && (
                          <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={CONTENT_TYPE_BADGE_COLORS[contentType] ?? ""}
                        >
                          {CONTENT_TYPE_LABELS[contentType] ?? contentType}
                        </Badge>
                        {isMemberOnly && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 text-xs">
                            Members only
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col gap-3">
                      {item.description && (
                        <CardDescription className="text-sm">{item.description}</CardDescription>
                      )}

                      {/* Live Stream */}
                      {contentType === "live_stream" && (
                        <div className="space-y-2">
                          {item.start_at && (
                            <p className="text-xs text-muted-foreground">
                              Starts: {formatDateTime(item.start_at)}
                            </p>
                          )}
                          {item.end_at && (
                            <p className="text-xs text-muted-foreground">
                              Ends: {formatDateTime(item.end_at)}
                            </p>
                          )}
                          {canAccess && item.url ? (
                            <Button size="sm" asChild>
                              <a href={item.url} target="_blank" rel="noopener noreferrer">
                                Join Live
                              </a>
                            </Button>
                          ) : !canAccess ? (
                            <p className="text-xs text-muted-foreground">Active membership required.</p>
                          ) : null}
                        </div>
                      )}

                      {/* YouTube embed */}
                      {contentType === "youtube" && item.url && (
                        canAccess ? (
                          <div className="aspect-video w-full overflow-hidden rounded-md bg-muted">
                            <iframe
                              src={`https://www.youtube.com/embed/${extractYouTubeId(item.url)}`}
                              title={item.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="h-full w-full"
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Active membership required to watch.</p>
                        )
                      )}

                      {/* Video link */}
                      {contentType === "video" && item.url && (
                        canAccess ? (
                          <Button size="sm" variant="outline" asChild>
                            <a href={item.url} target="_blank" rel="noopener noreferrer">
                              Watch Video
                            </a>
                          </Button>
                        ) : (
                          <p className="text-xs text-muted-foreground">Active membership required.</p>
                        )
                      )}

                      {/* Document PDF */}
                      {contentType === "document" && item.pdf_url && (
                        canAccess ? (
                          <Button size="sm" variant="outline" asChild>
                            <a href={item.pdf_url} target="_blank" rel="noopener noreferrer">
                              Download PDF
                            </a>
                          </Button>
                        ) : (
                          <p className="text-xs text-muted-foreground">Active membership required.</p>
                        )
                      )}

                      {/* Announcement text */}
                      {contentType === "announcement" && item.content_body && (
                        <p className="whitespace-pre-wrap text-sm text-foreground">
                          {item.content_body}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
