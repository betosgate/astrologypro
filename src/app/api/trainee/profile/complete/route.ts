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

const ALLOWED_TIMEZONES = new Set([
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Europe/London",
  "Europe/Berlin",
  "Australia/Sydney",
]);

function normalizePhone(value: unknown) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return null;

  const compact = trimmed.replace(/[\s().-]/g, "");
  if (/^\+[1-9]\d{7,14}$/.test(compact)) return compact;

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return digits;

  return undefined;
}

function validateOptionalUrl(value: unknown) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return trimmed;
  } catch {
    return undefined;
  }
}

function validateOptionalBirthDate(value: unknown) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return undefined;
  const parsed = new Date(`${trimmed}T12:00:00`);
  if (Number.isNaN(parsed.getTime()) || parsed > new Date()) return undefined;

  return trimmed;
}

function validateOptionalBirthTime(value: unknown) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return null;
  return /^\d{2}:\d{2}$/.test(trimmed) ? trimmed : undefined;
}

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
    if (display_name.trim().length < 2) {
      return NextResponse.json(
        { error: "Display name must be at least 2 characters." },
        { status: 422 }
      );
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 422 }
      );
    }
    if (normalizedPhone === undefined) {
      return NextResponse.json(
        { error: "Phone must be a valid E.164 number or a 10-digit number." },
        { status: 422 }
      );
    }

    if (!timezone || typeof timezone !== "string" || !ALLOWED_TIMEZONES.has(timezone)) {
      return NextResponse.json(
        { error: "A supported timezone is required." },
        { status: 422 }
      );
    }

    const normalizedAvatarUrl = validateOptionalUrl(avatar_url);
    if (normalizedAvatarUrl === undefined) {
      return NextResponse.json(
        { error: "Avatar URL must be a valid http or https URL." },
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

    if (goals && typeof goals === "string" && goals.length > 1000) {
      return NextResponse.json(
        { error: "Goals must be 1000 characters or fewer." },
        { status: 422 }
      );
    }

    const normalizedBirthDate = validateOptionalBirthDate(birth_date);
    if (normalizedBirthDate === undefined) {
      return NextResponse.json(
        { error: "Birth date must be a valid past date." },
        { status: 422 }
      );
    }

    const normalizedBirthTime = validateOptionalBirthTime(birth_time);
    if (normalizedBirthTime === undefined) {
      return NextResponse.json(
        { error: "Birth time must use HH:MM format." },
        { status: 422 }
      );
    }

    const normalizedBirthCity =
      typeof birth_city === "string" && birth_city.trim()
        ? birth_city.trim()
        : null;
    if (normalizedBirthCity && normalizedBirthCity.length > 120) {
      return NextResponse.json(
        { error: "Birth city must be 120 characters or fewer." },
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
    const selectedAllowedSpecialties = validSpecialties.filter((item) =>
      allowedSpecialtiesForPackage.has(item),
    );

    if (selectedAllowedSpecialties.length === 0) {
      return NextResponse.json(
        { error: "Select at least one specialty or area of interest." },
        { status: 422 }
      );
    }

    // ── Update trainee record ──
    const { error: updateError } = await admin
      .from("trainees")
      .update({
        name: display_name.trim(),
        bio: bio?.trim() || null,
        avatar_url: normalizedAvatarUrl,
        phone: normalizedPhone,
        timezone,
        specialties: selectedAllowedSpecialties,
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
    if (normalizedBirthDate || normalizedBirthTime || normalizedBirthCity) {
      const clientPayload: Record<string, unknown> = {
        user_id: user.id,
        email: user.email!,
        full_name: display_name.trim(),
      };
      if (normalizedBirthDate) clientPayload.birth_date = normalizedBirthDate;
      if (normalizedBirthTime) clientPayload.birth_time = normalizedBirthTime;
      if (normalizedBirthCity) clientPayload.birth_city = normalizedBirthCity;

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
        avatar_url: normalizedAvatarUrl || undefined,
        specialties: selectedAllowedSpecialties,
        phone: normalizedPhone,
        timezone,
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
