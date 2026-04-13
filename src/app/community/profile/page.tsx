import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CommunityProfileForm } from "@/components/community/profile-form";
import { ProfileCompletionBar } from "@/components/ui/profile-completion-bar";
import { calculateProfileCompletion } from "@/lib/profile-completion";

export const metadata = { title: "Profile - AstrologyPro" };

export default async function CommunityProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("community_members")
    .select("id, full_name, first_name, last_name, email, phone, gender, date_of_birth, birth_time, birth_city, address, city, state, zip, relationship_status, intake_data, membership_type, membership_status, joined_at, expires_at")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/join/community");

  const completion = calculateProfileCompletion([
    { key: "full_name", label: "Full Name", value: member.full_name },
    { key: "phone", label: "Phone", value: member.phone },
    { key: "gender", label: "Gender", value: member.gender },
    { key: "date_of_birth", label: "Date of Birth", value: member.date_of_birth },
    { key: "birth_time", label: "Birth Time", value: member.birth_time },
    { key: "birth_city", label: "Birth City", value: member.birth_city },
    { key: "address", label: "Address", value: member.address },
    { key: "city", label: "City", value: member.city },
    { key: "state", label: "State", value: member.state },
    { key: "zip", label: "ZIP Code", value: member.zip },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Manage your membership details</p>
      </div>

      <ProfileCompletionBar
        percentage={completion.percentage}
        missingFields={completion.missingFields}
        completedCount={completion.completedCount}
        totalCount={completion.totalCount}
      />

      <CommunityProfileForm member={member} userId={user.id} />
    </div>
  );
}
