import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { MediaItemsClient } from "@/components/admin/media-items-client";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Media Items — Admin" };

async function getDiviners() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("diviners")
    .select("id, username, display_name")
    .eq("is_active", true)
    .order("display_name", { ascending: true });
  return data ?? [];
}

export default async function AdminMediaItemsPage() {
  const user = await requireAdmin();
  if (!user) redirect("/login");

  const diviners = await getDiviners();

  return (
    <div className="space-y-6">
      <MediaItemsClient diviners={diviners} />
    </div>
  );
}
