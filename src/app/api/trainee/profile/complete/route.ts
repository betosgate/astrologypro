import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncProfileAcrossRoles } from "@/lib/profile-sync";

export const dynamic = "force-dynamic";

const ALLOWED_SPECIALTIES = [
  "Astrology",
  "Tarot",
  "Numerology",
  "Human Design",
  "Oracle Cards",
  "Palmistry",
  "Runes",
  "Crystal Healing",
];

/**
 * POST /api/trainee/profile/complete
 *
 * Saves trainee profile data collected during onboarding and marks
 * onboarding_completed = true. Also upserts the clients record with
 * optional birth data for chart calculations.
 *
 * Body:
 *   display_name  string (required)
 *   bio           string | null
 *   avatar_url    string | null
 *   phone         string | null
 *   timezone      string | null
 *   specialties   string[]
 *   goals         string | null
 *   birth_date    string | null  (YYYY-MM-DD)
 *   birth_time    string | null  (HH:MM)
 *   birth_city    string | null
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      display_name,
      bio,
      avatar_url,
      phone,
      timezone,
      specialties,
      goals,
      birth_date,
      birth_time,
      birth_city,
    } = body;

    // ── Validate required fields ──
    if (!display_name || typeof display_name !== "string" || !display_name.trim()) {
      return NextResponse.json(
        { error: "Display name is required." },
        { status: 422 }
      );
    }

    // Validate specialties array
    const validSpecialties: string[] = [];
    if (Array.isArray(specialties)) {
      for (const s of specialties) {
        if (typeof s === "string" && ALLOWED_SPECIALTIES.includes(s)) {
          validSpecialties.push(s);
        }
      }
    }

    // Validate bio length
    if (bio && typeof bio === "string" && bio.length > 500) {
      return NextResponse.json(
        { error: "Bio must be 500 characters or fewer." },
        { status: 422 }
      );
    }

    const admin = createAdminClient();

    // ── Look up trainee ──
    const { data: trainee, error: lookupError } = await admin
      .from("trainees")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (lookupError || !trainee) {
      return NextResponse.json(
        { error: "Trainee record not found." },
        { status: 404 }
      );
    }

    // ── Update trainee record ──
    const { error: updateError } = await admin
      .from("trainees")
      .update({
        name: display_name.trim(),
        bio: bio?.trim() || null,
        avatar_url: avatar_url?.trim() || null,
        phone: phone?.trim() || null,
        timezone: timezone || null,
        specialties: validSpecialties,
        goals: goals?.trim() || null,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", trainee.id);

    if (updateError) {
      console.error("[trainee/profile/complete] Failed to update trainee:", updateError);
      return NextResponse.json(
        { error: "Failed to save profile." },
        { status: 500 }
      );
    }

    // ── Upsert client record with birth data ──
    if (birth_date || birth_time || birth_city) {
      const clientPayload: Record<string, unknown> = {
        user_id: user.id,
        email: user.email!,
        full_name: display_name.trim(),
      };
      if (birth_date) clientPayload.birth_date = birth_date;
      if (birth_time) clientPayload.birth_time = birth_time;
      if (birth_city) clientPayload.birth_city = birth_city.trim();

      const { error: clientError } = await admin
        .from("clients")
        .upsert(clientPayload, { onConflict: "user_id" });

      if (clientError) {
        // Non-fatal — profile is still saved, just log the issue
        console.error("[trainee/profile/complete] Client upsert failed:", clientError);
      }
    }

    // Fire-and-forget: sync shared fields to other role tables
    syncProfileAcrossRoles(
      user.id,
      {
        display_name: display_name.trim(),
        bio: bio?.trim() || undefined,
        avatar_url: avatar_url?.trim() || undefined,
        specialties: validSpecialties.length > 0 ? validSpecialties : undefined,
        phone: phone?.trim() || undefined,
        timezone: timezone || undefined,
      },
      "trainees"
    ).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[trainee/profile/complete] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
