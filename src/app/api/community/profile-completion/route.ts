import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export type ProfileCompletionItem = {
  key: string;
  label: string;
  completed: boolean;
  pct: number;
  action_url: string;
};

export type ProfileCompletionData = {
  overall_pct: number;
  items: ProfileCompletionItem[];
};

/**
 * GET /api/community/profile-completion
 *
 * Returns profile completion percentage and per-item breakdown for the
 * authenticated PM/Mystery School community member.
 *
 * Completion weights:
 *   profile_photo    20%
 *   full_name        10%
 *   birth_data       25%  (birth_date + birth_time + birth_city all set)
 *   natal_chart      20%  (any family member has natal_chart data)
 *   family_member    10%  (at least 1 family member added)
 *   relationship_chart 15% (at least 1 relationship_chart generated)
 *
 * Response: { overall_pct: number, items: ProfileCompletionItem[] }
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // ── Step 1: Fetch member + client in parallel ─────────────────────────────
  const [memberResult, clientResult] = await Promise.all([
    admin
      .from("community_members")
      .select("id, full_name")
      .eq("user_id", user.id)
      .single(),

    admin
      .from("clients")
      .select("birth_date, birth_time, birth_city")
      .eq("user_id", user.id)
      .single(),
  ]);

  const member = memberResult.data;
  if (!member) {
    return NextResponse.json({ error: "Community member not found." }, { status: 404 });
  }

  // ── Step 2: Fetch family + relationship charts using resolved member.id ───
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

  const client = clientResult.data;
  const familyMembers = familyMembersResult.data ?? [];
  const relationshipCharts = relationshipChartResult.data ?? [];

  // ── Evaluate each completion item ─────────────────────────────────────────

  // 1. Profile photo (20%) — stored in Supabase auth user_metadata
  const hasPhoto = Boolean(
    user.user_metadata?.avatar_url &&
      String(user.user_metadata.avatar_url).trim() !== ""
  );

  // 2. Full name (10%)
  const hasFullName = Boolean(member.full_name && member.full_name.trim() !== "");

  // 3. Birth data (25%) — all three fields must be set
  const hasBirthData = Boolean(
    client?.birth_date && client?.birth_time && client?.birth_city
  );

  // 4. Natal chart generated (20%) — any family member has natal_chart JSONB data
  const hasNatalChart = familyMembers.some(
    (fm) => fm.natal_chart != null && Object.keys(fm.natal_chart as object).length > 0
  );

  // 5. At least 1 family member added (10%)
  const hasFamilyMember = familyMembers.length > 0;

  // 6. Relationship chart generated (15%)
  const hasRelationshipChart = relationshipCharts.length > 0;

  // ── Build items array ──────────────────────────────────────────────────────
  const items: ProfileCompletionItem[] = [
    {
      key: "profile_photo",
      label: "Profile photo uploaded",
      completed: hasPhoto,
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

  return NextResponse.json({ overall_pct, items } satisfies ProfileCompletionData);
}
