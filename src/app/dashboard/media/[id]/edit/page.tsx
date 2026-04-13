import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { MediaItemForm } from "@/components/dashboard/media-item-form";

export default async function EditMediaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const [{ data: item }, { count: imageCount }, { data: albumRows }] = await Promise.all([
    admin
      .from("media_items")
      .select(
        "id, type, url, title, description, thumbnail_url, album_name, is_featured, is_active"
      )
      .eq("id", id)
      .eq("diviner_id", diviner.id)
      .maybeSingle(),
    admin
      .from("media_items")
      .select("id", { count: "exact", head: true })
      .eq("diviner_id", diviner.id)
      .eq("type", "image"),
    admin
      .from("media_items")
      .select("album_name")
      .eq("diviner_id", diviner.id)
      .eq("type", "image")
      .not("album_name", "is", null),
  ]);

  if (!item) redirect("/dashboard/media");

  const existingAlbumNames = Array.from(
    new Set((albumRows ?? []).map((row) => row.album_name).filter(Boolean))
  ) as string[];

  return (
    <MediaItemForm
      mode="edit"
      divinerId={diviner.id}
      existingAlbumNames={existingAlbumNames}
      currentImageCount={imageCount ?? 0}
      initialItem={item}
    />
  );
}
