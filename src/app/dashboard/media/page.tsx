import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, PlusCircle } from "lucide-react";
import { ImportLiveSessionButton } from "@/components/dashboard/import-live-session-button";
import { MediaGalleryGrid } from "@/components/dashboard/media-gallery-grid";
import { MAX_MEDIA_IMAGES } from "@/lib/media-gallery";

export const metadata = { title: "Media Gallery" };

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
      "id, type, url, title, description, thumbnail_url, album_name, sort_order, is_active, is_featured, moderation_status, submitted_for_review_at, reviewed_at, admin_review_notes, view_count, created_at"
    )
    .eq("diviner_id", diviner.id)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  const allItems = items ?? [];
  const totalCount = allItems.length;
  const featuredCount = allItems.filter((i) => i.is_featured).length;
  const activeCount = allItems.filter((i) => i.is_active).length;
  const pendingReviewCount = allItems.filter((i) => i.moderation_status === "pending").length;
  const blockedCount = allItems.filter((i) => i.moderation_status === "blocked").length;
  const imageItems = allItems.filter((i) => i.type === "image");
  const imageCount = imageItems.length;
  const albums = Array.from(
    new Set(
      imageItems
        .map((item) => item.album_name?.trim())
        .filter((album): album is string => !!album)
    )
  );

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
        <div className="flex items-center gap-2">
          <ImportLiveSessionButton />
          <Button asChild>
            <Link href="/dashboard/media/new">
              <PlusCircle className="mr-2 size-4" />
              Add Media
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-5">
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
        <Card className="py-4">
          <CardContent className="flex flex-col items-center gap-1 px-4">
            <span className="text-2xl font-bold">{pendingReviewCount}</span>
            <span className="text-xs text-muted-foreground">Pending Review</span>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="flex flex-col items-center gap-1 px-4">
            <span className="text-2xl font-bold">{blockedCount}</span>
            <span className="text-xs text-muted-foreground">Blocked</span>
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
            <MediaGalleryGrid items={allItems} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
