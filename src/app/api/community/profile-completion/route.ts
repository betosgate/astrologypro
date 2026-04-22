import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getCommunityProfileCompletion,
  type CommunityProfileCompletionData as ProfileCompletionData,
  type CommunityProfileCompletionItem as ProfileCompletionItem,
} from "@/lib/community/profile-completion";

export const dynamic = "force-dynamic";

/**
 * GET /api/community/profile-completion
 *
 * Returns profile completion percentage and per-item breakdown for the
 * authenticated PM/Mystery School community member.
 *
 * Completion weights:
 *   profile_photo    20%
 *   full_name        10%
 *   birth_data       25%  (community_members date_of_birth + birth_time + birth_city all set)
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
  const completion = await getCommunityProfileCompletion(admin, user.id);
  if (!completion) {
    return NextResponse.json({ error: "Community member not found." }, { status: 404 });
  }
  const items = completion.items.map((item) =>
    item.key === "profile_photo"
      ? {
          ...item,
          completed: Boolean(
            user.user_metadata?.avatar_url &&
              String(user.user_metadata.avatar_url).trim() !== ""
          ),
        }
      : item
  );

  const overall_pct = items
    .filter((item) => item.completed)
    .reduce((sum, item) => sum + item.pct, 0);

  return NextResponse.json({ overall_pct, items } satisfies ProfileCompletionData);
}
