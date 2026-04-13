import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

interface ProfilePayload {
  display_name: string;
  bio: string;
  avatar_url: string;
  specialties: string[];
  phone: string;
  timezone: string;
  birth_date: string | null;
  birth_time: string | null;
  birth_city: string | null;
}

/**
 * GET /api/account/profile
 *
 * Fetches the authenticated user's profile data from all role tables
 * in parallel. Returns a merged object with roles array and unified
 * field values (priority: diviner > trainee > community > client).
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const [diviner, trainee, client, advocate, community] = await Promise.all([
      admin
        .from("diviners")
        .select("id, display_name, bio, avatar_url, specialties, phone, timezone")
        .eq("user_id", user.id)
        .maybeSingle(),
      admin
        .from("trainees")
        .select("id, name, bio, avatar_url, specialties, phone, timezone")
        .eq("user_id", user.id)
        .maybeSingle(),
      admin
        .from("clients")
        .select("id, full_name, birth_date, birth_time, birth_city")
        .eq("user_id", user.id)
        .maybeSingle(),
      admin
        .from("social_advocates")
        .select("id, name")
        .eq("user_id", user.id)
        .maybeSingle(),
      admin
        .from("community_members")
        .select("id, full_name, first_name, phone, date_of_birth, birth_time, birth_city")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    // Build roles array
    const roles: string[] = [];
    if (diviner.data) roles.push("diviner");
    if (trainee.data) roles.push("trainee");
    if (client.data) roles.push("client");
    if (advocate.data) roles.push("advocate");
    if (community.data) roles.push("community");

    // Merge fields with priority: diviner > trainee > community > client
    const display_name =
      diviner.data?.display_name ||
      trainee.data?.name ||
      advocate.data?.name ||
      community.data?.full_name ||
      client.data?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      "";

    const bio = diviner.data?.bio || trainee.data?.bio || "";

    const avatar_url =
      diviner.data?.avatar_url || trainee.data?.avatar_url || "";

    const specialties: string[] =
      diviner.data?.specialties ||
      trainee.data?.specialties ||
      [];

    const phone =
      diviner.data?.phone ||
      trainee.data?.phone ||
      community.data?.phone ||
      "";

    const timezone =
      diviner.data?.timezone || trainee.data?.timezone || "";

    const birth_date =
      client.data?.birth_date ||
      community.data?.date_of_birth ||
      null;

    const birth_time =
      client.data?.birth_time ||
      community.data?.birth_time ||
      null;

    const birth_city =
      client.data?.birth_city ||
      community.data?.birth_city ||
      null;

    return NextResponse.json({
      roles,
      display_name,
      bio,
      avatar_url,
      specialties,
      phone,
      timezone,
      birth_date,
      birth_time,
      birth_city,
      email: user.email,
    });
  } catch (err) {
    console.error("[api/account/profile] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/account/profile
 *
 * Accepts shared profile fields and updates ALL role tables that the
 * user has a record in. Uses createAdminClient() for writes.
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

    const body: ProfilePayload = await req.json();
    const {
      display_name,
      bio,
      avatar_url,
      specialties,
      phone,
      timezone,
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

    if (bio && typeof bio === "string" && bio.length > 500) {
      return NextResponse.json(
        { error: "Bio must be 500 characters or fewer." },
        { status: 422 }
      );
    }

    // Validate specialties
    const validSpecialties: string[] = [];
    if (Array.isArray(specialties)) {
      for (const s of specialties) {
        if (typeof s === "string" && ALLOWED_SPECIALTIES.includes(s)) {
          validSpecialties.push(s);
        }
      }
    }

    const admin = createAdminClient();
    const trimmedName = display_name.trim();
    const now = new Date().toISOString();

    // Look up which role tables have records for this user
    const [diviner, trainee, client, advocate, community] = await Promise.all([
      admin.from("diviners").select("id").eq("user_id", user.id).maybeSingle(),
      admin.from("trainees").select("id").eq("user_id", user.id).maybeSingle(),
      admin.from("clients").select("id").eq("user_id", user.id).maybeSingle(),
      admin.from("social_advocates").select("id").eq("user_id", user.id).maybeSingle(),
      admin.from("community_members").select("id").eq("user_id", user.id).maybeSingle(),
    ]);

    // Build update promises in parallel
    const updates: PromiseLike<unknown>[] = [];

    if (diviner.data) {
      updates.push(
        admin
          .from("diviners")
          .update({
            display_name: trimmedName,
            bio: bio?.trim() || null,
            avatar_url: avatar_url?.trim() || null,
            specialties: validSpecialties,
            phone: phone?.trim() || null,
            timezone: timezone || null,
            updated_at: now,
          })
          .eq("id", diviner.data.id)
          .then(({ error }) => {
            if (error) console.error("[account/profile] diviners update failed:", error);
          })
      );
    }

    if (trainee.data) {
      updates.push(
        admin
          .from("trainees")
          .update({
            name: trimmedName,
            bio: bio?.trim() || null,
            avatar_url: avatar_url?.trim() || null,
            specialties: validSpecialties,
            phone: phone?.trim() || null,
            timezone: timezone || null,
            updated_at: now,
          })
          .eq("id", trainee.data.id)
          .then(({ error }) => {
            if (error) console.error("[account/profile] trainees update failed:", error);
          })
      );
    }

    if (client.data) {
      updates.push(
        admin
          .from("clients")
          .update({
            full_name: trimmedName,
            birth_date: birth_date || null,
            birth_time: birth_time || null,
            birth_city: birth_city?.trim() || null,
            updated_at: now,
          })
          .eq("id", client.data.id)
          .then(({ error }) => {
            if (error) console.error("[account/profile] clients update failed:", error);
          })
      );
    }

    if (advocate.data) {
      updates.push(
        admin
          .from("social_advocates")
          .update({
            name: trimmedName,
            updated_at: now,
          })
          .eq("id", advocate.data.id)
          .then(({ error }) => {
            if (error) console.error("[account/profile] social_advocates update failed:", error);
          })
      );
    }

    if (community.data) {
      // Split display_name to get first_name for community_members
      const firstName = trimmedName.split(" ")[0] || trimmedName;
      updates.push(
        admin
          .from("community_members")
          .update({
            full_name: trimmedName,
            first_name: firstName,
            phone: phone?.trim() || null,
            date_of_birth: birth_date || null,
            birth_time: birth_time || null,
            birth_city: birth_city?.trim() || null,
            updated_at: now,
          })
          .eq("id", community.data.id)
          .then(({ error }) => {
            if (error) console.error("[account/profile] community_members update failed:", error);
          })
      );
    }

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/account/profile] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
