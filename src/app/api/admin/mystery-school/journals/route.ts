import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/mystery-school/journals
 * Query params:
 *   type       - "scry" | "mundane" | "all" (default "all")
 *   decan_number - integer filter (optional)
 *   date_from  - ISO date string (optional)
 *   date_to    - ISO date string (optional)
 *   limit      - number (default 100)
 *   offset     - number (default 0)
 *
 * Returns unified list of journal entries with student + decan info.
 */
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "all";
  const decanNumberRaw = url.searchParams.get("decan_number");
  const dateFrom = url.searchParams.get("date_from");
  const dateTo = url.searchParams.get("date_to");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10), 200);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

  const admin = createAdminClient();

  type JournalRow = {
    journal_type: "scry" | "mundane";
    id: string;
    submitted_at: string;
    // student
    student_email: string | null;
    student_name: string | null;
    // decan
    decan_number: number;
    decan_title: string;
    // scry-specific
    assigned_card: string | null;
    alternate_card: string | null;
    experience_text: string | null;
    content_preview: string | null;
    // mundane-specific
    relationships_section: string | null;
    business_work_section: string | null;
    shifts_perception_section: string | null;
  };

  const results: JournalRow[] = [];

  // Fetch scry journals
  if (type === "scry" || type === "all") {
    let q = admin
      .from("scry_journals")
      .select(
        `id,
         assigned_card, alternate_card, experience_text, content, submitted_at,
         mystery_school_students!inner(
           id,
           profiles:user_id(email, full_name)
         ),
         decans!inner(decan_number, title)`
      )
      .order("submitted_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (decanNumberRaw) {
      q = q.eq("decans.decan_number", parseInt(decanNumberRaw, 10));
    }
    if (dateFrom) q = q.gte("submitted_at", dateFrom);
    if (dateTo) q = q.lte("submitted_at", dateTo);

    const { data: scryRows } = await q;

    for (const row of scryRows ?? []) {
      const student = row.mystery_school_students as unknown as {
        profiles: { email: string | null; full_name: string | null } | null;
      };
      const decan = row.decans as unknown as { decan_number: number; title: string };
      const profileData = Array.isArray(student?.profiles)
        ? student.profiles[0]
        : student?.profiles;

      results.push({
        journal_type: "scry",
        id: row.id,
        submitted_at: row.submitted_at,
        student_email: profileData?.email ?? null,
        student_name: profileData?.full_name ?? null,
        decan_number: decan?.decan_number ?? 0,
        decan_title: decan?.title ?? "",
        assigned_card: row.assigned_card ?? null,
        alternate_card: row.alternate_card ?? null,
        experience_text: row.experience_text ?? null,
        content_preview: (row.experience_text ?? row.content ?? "").slice(0, 150),
        relationships_section: null,
        business_work_section: null,
        shifts_perception_section: null,
      });
    }
  }

  // Fetch mundane journals
  if (type === "mundane" || type === "all") {
    let q = admin
      .from("mundane_journals")
      .select(
        `id,
         relationships_section, business_work_section, shifts_perception_section, content, submitted_at,
         mystery_school_students!inner(
           id,
           profiles:user_id(email, full_name)
         ),
         decans!inner(decan_number, title)`
      )
      .order("submitted_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (decanNumberRaw) {
      q = q.eq("decans.decan_number", parseInt(decanNumberRaw, 10));
    }
    if (dateFrom) q = q.gte("submitted_at", dateFrom);
    if (dateTo) q = q.lte("submitted_at", dateTo);

    const { data: mundaneRows } = await q;

    for (const row of mundaneRows ?? []) {
      const student = row.mystery_school_students as unknown as {
        profiles: { email: string | null; full_name: string | null } | null;
      };
      const decan = row.decans as unknown as { decan_number: number; title: string };
      const profileData = Array.isArray(student?.profiles)
        ? student.profiles[0]
        : student?.profiles;

      results.push({
        journal_type: "mundane",
        id: row.id,
        submitted_at: row.submitted_at,
        student_email: profileData?.email ?? null,
        student_name: profileData?.full_name ?? null,
        decan_number: decan?.decan_number ?? 0,
        decan_title: decan?.title ?? "",
        assigned_card: null,
        alternate_card: null,
        experience_text: null,
        content_preview: (row.relationships_section ?? row.content ?? "").slice(0, 150),
        relationships_section: row.relationships_section ?? null,
        business_work_section: row.business_work_section ?? null,
        shifts_perception_section: row.shifts_perception_section ?? null,
      });
    }
  }

  // Sort combined results by submitted_at desc
  results.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

  return NextResponse.json(results);
}
