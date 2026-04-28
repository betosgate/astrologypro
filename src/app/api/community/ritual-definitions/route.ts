import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listPublishedRitualDefinitions } from "@/lib/community/ritual-asset-resolver";
import {
  getStaticRitualTagsForKey,
  isCommunityCreatableRitualKey,
  PLANETARY_ZODIACAL_RITUAL_KEY,
} from "@/lib/community/ritual-definition-options";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member || member.membership_status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const definitions = await listPublishedRitualDefinitions();
  const ritualDefinitions = definitions
    .filter((definition) => isCommunityCreatableRitualKey(definition.key))
    .map((definition) => {
      const staticTags = getStaticRitualTagsForKey(definition.key);
      const isCustom = definition.key === PLANETARY_ZODIACAL_RITUAL_KEY;

      return {
        id: definition.id,
        key: definition.key,
        name: definition.cardTitleOverride ?? definition.title,
        ritual_name: definition.title,
        description:
          definition.cardDescriptionOverride ?? definition.description ?? "",
        ritual_type: definition.ritualType,
        supported_mode: definition.supportedMode,
        badge_label:
          definition.badgeLabel ?? (isCustom ? "Custom" : "Static"),
        icon_key: definition.iconKey,
        tags: staticTags,
        requires_configuration: isCustom,
      };
    });

  return NextResponse.json({ ritualDefinitions });
}
