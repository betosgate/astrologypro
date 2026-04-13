import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Play,
  Video,
  Music,
  Image,
  FileText,
  Link2,
  Star,
  PlusCircle,
  Eye,
} from "lucide-react";
import {
  MediaActiveToggle,
  MediaFeaturedToggle,
  MediaDeleteButton,
  MediaEditButton,
  MediaReorderButtons,
} from "@/components/dashboard/media-controls";
import { MAX_MEDIA_IMAGES } from "@/lib/media-gallery";

export const metadata = { title: "Media Gallery" };

const TYPE_META: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  video: { label: "Video", icon: Video, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  audio: { label: "Audio", icon: Music, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  image: { label: "Image", icon: Image, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  article: { label: "Article", icon: FileText, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  link: { label: "Link", icon: Link2, color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
};

export default async function MediaGalleryPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) redirect("/admin");

  const { data: items } = await admin
    .from("media_items")
    .select(
      "id, type, url, title, description, thumbnail_url, album_name, sort_order, is_active, is_featured, view_count, created_at"
    )
    .eq("diviner_id", diviner.id)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  const allItems = items ?? [];
  const totalCount = allItems.length;
  const featuredCount = allItems.filter((i) => i.is_featured).length;
  const activeCount = allItems.filter((i) => i.is_active).length;
  const imageItems = allItems.filter((i) => i.type === "image");
  const imageCount = imageItems.length;
  const albums = Array.from(
    new Set(
      imageItems
        .map((item) => item.album_name?.trim())
        .filter((album): album is string => !!album)
    )
  );

  // Shape for reorder buttons
  const reorderItems = allItems.map((i) => ({ id: i.id, sort_order: i.sort_order }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Play className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Media Gallery</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Manage videos, recordings, articles, and links that showcase your work.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/media/new">
            <PlusCircle className="mr-2 size-4" />
            Add Media
          </Link>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="py-4">
          <CardContent className="flex flex-col items-center gap-1 px-4">
            <span className="text-2xl font-bold">{totalCount}</span>
            <span className="text-xs text-muted-foreground">Total Items</span>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="flex flex-col items-center gap-1 px-4">
            <span className="text-2xl font-bold">{featuredCount}</span>
            <span className="text-xs text-muted-foreground">Featured</span>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="flex flex-col items-center gap-1 px-4">
            <span className="text-2xl font-bold">{activeCount}</span>
            <span className="text-xs text-muted-foreground">Active</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Image albums</p>
              <p className="text-xs text-muted-foreground">
                {imageCount}/{MAX_MEDIA_IMAGES} images used across {albums.length} album{albums.length === 1 ? "" : "s"}
              </p>
            </div>
            <Badge variant={imageCount >= MAX_MEDIA_IMAGES ? "destructive" : "secondary"}>
              {MAX_MEDIA_IMAGES - imageCount} slots left
            </Badge>
          </div>
          {albums.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {albums.map((album) => {
                const count = imageItems.filter((item) => item.album_name === album).length;
                return (
                  <Badge key={album} variant="outline" className="font-normal">
                    {album} · {count}
                  </Badge>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items grid or empty state */}
      <Card>
        <CardHeader>
          <CardTitle>Your Media</CardTitle>
          <CardDescription>
            {totalCount} item{totalCount !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalCount === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                <Play className="size-7 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">No media yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add videos, recordings, or articles to showcase your work.
                </p>
              </div>
              <Button asChild>
                <Link href="/dashboard/media/new">
                  <PlusCircle className="mr-2 size-4" />
                  Add Media
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allItems.map((item) => {
                const meta = TYPE_META[item.type] ?? TYPE_META.link;
                const Icon = meta.icon;
                return (
                  <div
                    key={item.id}
                    className="group relative rounded-lg border bg-card p-4 space-y-3"
                  >
                    {/* Thumbnail or type icon */}
                    <div className="aspect-video w-full overflow-hidden rounded-md bg-muted flex items-center justify-center">
                      {item.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.thumbnail_url}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className={`flex size-12 items-center justify-center rounded-full ${meta.color}`}>
                          <Icon className="size-6" />
                        </div>
                      )}
                    </div>

                    {/* Title + badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">{item.title}</p>
                        {item.type === "image" && item.album_name && (
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            Album: {item.album_name}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className={`shrink-0 text-xs ${meta.color}`}>
                        {meta.label}
                      </Badge>
                    </div>

                    {/* View count */}
                    {(item.view_count ?? 0) > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="size-3" />
                        {item.view_count} view{item.view_count !== 1 ? "s" : ""}
                      </div>
                    )}

                    {/* Controls row */}
                    <div className="flex items-center justify-between border-t pt-3">
                      <div className="flex items-center gap-3">
                        {/* Featured */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="size-3" />
                          <MediaFeaturedToggle itemId={item.id} featured={item.is_featured} />
                        </div>
                        {/* Active */}
                        <MediaActiveToggle itemId={item.id} active={item.is_active} />
                      </div>

                      <div className="flex items-center gap-1">
                        <MediaReorderButtons
                          itemId={item.id}
                          sortOrder={item.sort_order}
                          allItems={reorderItems}
                        />
                        <MediaEditButton itemId={item.id} />
                        <MediaDeleteButton itemId={item.id} />
                      </div>
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
