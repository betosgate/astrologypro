import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/community/rituals/preview-steps?tags=tag1,tag2,tag3
// Returns count of matching active ritual_invocations for the given tags.
// Requires authenticated community member — not admin-only, but does not expose instructions.
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const rawTags = searchParams.get("tags");

  if (!rawTags) {
    return NextResponse.json(
      { error: "tags query parameter is required" },
      { status: 422 }
    );
  }

  const tags = rawTags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (tags.length === 0) {
    return NextResponse.json(
      { error: "At least one tag is required" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ritual_invocations")
    .select("name")
    .in("name", tags)
    .eq("is_active", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const matchedNames = new Set((data ?? []).map((r) => r.name));
  const missingTags = tags.filter((t) => !matchedNames.has(t));

  return NextResponse.json({
    matched_steps: matchedNames.size,
    total_tags: tags.length,
    missing_tags: missingTags,
  });
}
