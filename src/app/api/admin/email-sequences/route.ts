import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Fetch all sequences
  const { data: sequences, error } = await admin
    .from("email_sequence_controls")
    .select("*")
    .order("display_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Subscriber counts
  const [communityRes, msRes] = await Promise.all([
    admin
      .from("community_members")
      .select("id", { count: "exact", head: true })
      .eq("membership_status", "active"),
    admin
      .from("mystery_school_students")
      .select("id", { count: "exact", head: true })
      .in("training_status", ["foundation", "decans"]),
  ]);

  const communityCount = communityRes.count ?? 0;
  const msCount = msRes.count ?? 0;

  // Attach subscriber count to each sequence
  const MS_SEQUENCES = new Set([
    "mystery_school_enrollment",
    "decan_lifecycle",
  ]);

  const rows = (sequences ?? []).map((seq) => ({
    ...seq,
    subscriber_count: MS_SEQUENCES.has(seq.sequence_name) ? msCount : communityCount,
  }));

  return NextResponse.json({ sequences: rows });
}
