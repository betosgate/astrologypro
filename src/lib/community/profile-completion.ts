import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export type CommunityProfileCompletionItem = {
  key: string;
  label: string;
  completed: boolean;
  pct: number;
  action_url: string;
};

export type CommunityProfileCompletionData = {
  overall_pct: number;
  items: CommunityProfileCompletionItem[];
};

export async function getCommunityProfileCompletion(
  admin: AdminClient,
  userId: string
): Promise<CommunityProfileCompletionData | null> {
  const memberResult = await admin
    .from("community_members")
    .select("id, full_name, date_of_birth, birth_time, birth_city")
    .eq("user_id", userId)
    .maybeSingle();

  const member = memberResult.data;
  if (!member) return null;

  const [familyMembersResult, relationshipChartResult] = await Promise.all([
    admin
      .from("community_family_members")
      .select("id, natal_chart")
      .eq("member_id", member.id),
    admin
      .from("relationship_charts")
      .select("id, generated_at")
      .eq("member_id", member.id)
      .not("generated_at", "is", null)
      .limit(1),
  ]);

  const familyMembers = familyMembersResult.data ?? [];
  const relationshipCharts = relationshipChartResult.data ?? [];

  const hasFullName = Boolean(member.full_name && member.full_name.trim() !== "");
  const hasBirthData = Boolean(
    member.date_of_birth && member.birth_time && member.birth_city
  );
  const hasNatalChart = familyMembers.some(
    (familyMember) =>
      familyMember.natal_chart != null &&
      Object.keys(familyMember.natal_chart as object).length > 0
  );
  const hasFamilyMember = familyMembers.length > 0;
  const hasRelationshipChart = relationshipCharts.length > 0;

  const items: CommunityProfileCompletionItem[] = [
    {
      key: "profile_photo",
      label: "Profile photo uploaded",
      completed: false,
      pct: 20,
      action_url: "/community/profile",
    },
    {
      key: "full_name",
      label: "Full name set",
      completed: hasFullName,
      pct: 10,
      action_url: "/community/profile",
    },
    {
      key: "birth_data",
      label: "Birth data complete (date, time & location)",
      completed: hasBirthData,
      pct: 25,
      action_url: "/community/profile",
    },
    {
      key: "natal_chart",
      label: "Natal chart generated",
      completed: hasNatalChart,
      pct: 20,
      action_url: "/community/family",
    },
    {
      key: "family_member",
      label: "At least 1 family member added",
      completed: hasFamilyMember,
      pct: 10,
      action_url: "/community/family",
    },
    {
      key: "relationship_chart",
      label: "Relationship chart generated",
      completed: hasRelationshipChart,
      pct: 15,
      action_url: "/community/family",
    },
  ];

  const overall_pct = items
    .filter((item) => item.completed)
    .reduce((sum, item) => sum + item.pct, 0);

  return { overall_pct, items };
}
