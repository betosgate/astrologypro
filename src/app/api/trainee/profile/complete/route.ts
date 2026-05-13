import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncProfileAcrossRoles } from "@/lib/profile-sync";
import { sendTraineeWelcome } from "@/lib/email";
import {
  getAllowedSpecialtiesForPackage,
  getRoleServicePackages,
  resolveRoleServicePackage,
} from "@/lib/role-service-packages";

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
    let { data: trainee, error: lookupError } = await admin
      .from("trainees")
      .select("id, service_package_code, paid_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json(
        { error: "Error looking up trainee record." },
        { status: 500 }
      );
    }

    if (!trainee) {
      // Webhook might not have fired yet, create the trainee record now
      const username = (user.user_metadata?.username as string) || user.email!.split("@")[0] || "trainee";
      const { data: newTrainee, error: insertError } = await admin
        .from("trainees")
        .insert({
          user_id: user.id,
          name: display_name.trim(),
          email: user.email!,
          username,
          training_status: "active",
          onboarding_completed: false,
        })
        .select("id, service_package_code, paid_at")
        .single();

      if (insertError) {
        console.error("[trainee/profile/complete] Failed to create trainee:", insertError);
        return NextResponse.json(
          { error: "Failed to initialize trainee record." },
          { status: 500 }
        );
      }
      trainee = newTrainee;
    }

    if (user.user_metadata?.invited_by_admin === true && !trainee.paid_at) {
      return NextResponse.json(
        { error: "Please complete your trainee program payment before profile setup." },
        { status: 402 }
      );
    }

    const allowedSpecialtiesForPackage = new Set(
      getAllowedSpecialtiesForPackage(
        ALLOWED_SPECIALTIES,
        resolveRoleServicePackage(
          await getRoleServicePackages(),
          trainee.service_package_code,
        ),
      ),
    );

    // ── Update trainee record ──
    const { error: updateError } = await admin
      .from("trainees")
      .update({
        name: display_name.trim(),
        bio: bio?.trim() || null,
        avatar_url: avatar_url?.trim() || null,
        phone: phone?.trim() || null,
        timezone: timezone || null,
        specialties: validSpecialties.filter((item) =>
          allowedSpecialtiesForPackage.has(item),
        ),
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

    // Fire-and-forget welcome email — fetch mentor name best-effort
    (async () => {
      try {
        const { data: fullTrainee } = await admin
          .from("trainees")
          .select("mentor_diviner_id")
          .eq("id", trainee.id)
          .single();
        let mentorName: string | null = null;
        if (fullTrainee?.mentor_diviner_id) {
          const { data: mentor } = await admin
            .from("diviners")
            .select("display_name")
            .eq("id", fullTrainee.mentor_diviner_id)
            .single();
          mentorName = mentor?.display_name ?? null;
        }
        await sendTraineeWelcome({
          to: user.email!,
          name: display_name.trim(),
          mentorName,
        });
      } catch (err) {
        console.error("[trainee/profile/complete] Welcome email failed:", err);
      }
    })();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[trainee/profile/complete] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
