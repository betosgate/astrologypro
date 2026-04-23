import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CommunityProfileForm } from "@/components/community/profile-form";

export const metadata = { title: "Profile - AstrologyPro" };

export default async function CommunityProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Task 04 (community-horoscope-birth-country):
  // `birth_country` is required for the shared Horoscope Toolkit but was
  // previously not loaded from `community_members`, so the profile form
  // could not hydrate or save it. The column is provisioned by migration
  // `20260422000006_add_birth_country_to_community_members.sql` and the
  // `/api/community/onboarding/complete` route already persists it — we
  // just need to select + pass it through.
  const { data: member } = await supabase
    .from("community_members")
    .select("id, full_name, first_name, last_name, email, phone, gender, date_of_birth, birth_time, birth_city, birth_country, address, city, state, zip, relationship_status, intake_data, membership_type, membership_status, joined_at, expires_at")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/get-started");

  // Community Journey Progress reads the avatar off auth.users.user_metadata,
  // so that is the source of truth for this form too.
  const rawAvatarUrl = user.user_metadata?.avatar_url;
  const initialAvatarUrl =
    typeof rawAvatarUrl === "string" && rawAvatarUrl.trim() !== ""
      ? rawAvatarUrl
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Manage your membership details</p>
      </div>


      <CommunityProfileForm
        member={member}
        userId={user.id}
        initialAvatarUrl={initialAvatarUrl}
      />
    </div>
  );
}
