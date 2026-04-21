import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const USERNAME_RE = /^[a-z0-9][a-z0-9-_]{2,31}$/;

/**
 * Derive a usable slug from an email prefix. Replaces invalid chars with `-`,
 * strips leading/trailing dashes, pads to min length. Always returns a string
 * that satisfies USERNAME_RE.
 */
function deriveSlugFromEmail(email: string): string {
  const prefix = email.split("@")[0]?.toLowerCase() ?? "";
  const sanitized = prefix
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 32);

  if (sanitized.length >= 3 && /^[a-z0-9]/.test(sanitized)) {
    return sanitized;
  }

  // Fallback: ensure a valid slug always comes back.
  const padded = `admin-${sanitized || Math.random().toString(36).slice(2, 8)}`;
  return padded.slice(0, 32);
}

/** Check whether a candidate username is free across diviners + other admins. */
async function isSlugFree(
  admin: SupabaseClient,
  candidate: string,
  selfUserId: string,
): Promise<boolean> {
  const [{ data: divinerClash }, { data: adminClash }] = await Promise.all([
    admin.from("diviners").select("id").ilike("username", candidate).maybeSingle(),
    admin
      .from("admin_users")
      .select("user_id")
      .ilike("username", candidate)
      .neq("user_id", selfUserId)
      .maybeSingle(),
  ]);
  return !divinerClash && !adminClash;
}

/** Find an available slug, adding `-2`, `-3`, ... suffix on collision. */
async function findAvailableSlug(
  admin: SupabaseClient,
  base: string,
  selfUserId: string,
): Promise<string> {
  if (await isSlugFree(admin, base, selfUserId)) return base;
  for (let i = 2; i <= 50; i++) {
    const suffix = `-${i}`;
    const candidate = `${base.slice(0, 32 - suffix.length)}${suffix}`;
    if (await isSlugFree(admin, candidate, selfUserId)) return candidate;
  }
  // Extremely unlikely fallthrough — stamp with random suffix.
  const random = Math.random().toString(36).slice(2, 6);
  return `${base.slice(0, 27)}-${random}`;
}

export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_users")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();

  // Already claimed — return as-is.
  if (data?.username) {
    return NextResponse.json({ username: data.username });
  }

  // No username yet — auto-claim one derived from the admin's email so the
  // booking link is ready on first view. The admin can still override via POST.
  if (!user.email) {
    return NextResponse.json({ username: null });
  }

  try {
    const base = deriveSlugFromEmail(user.email);
    const chosen = await findAvailableSlug(admin, base, user.id);

    const { error: updateError } = await admin
      .from("admin_users")
      .update({ username: chosen })
      .eq("user_id", user.id);

    if (updateError) {
      const msg = updateError.message.toLowerCase();
      // Column missing → migration not applied. Return null so the UI shows
      // the claim form + the migration-not-applied error from POST.
      if (msg.includes("username") || msg.includes("column")) {
        return NextResponse.json({ username: null });
      }
      console.error("[booking-profile] auto-claim update error:", updateError);
      return NextResponse.json({ username: null });
    }

    return NextResponse.json({ username: chosen });
  } catch (err) {
    console.error("[booking-profile] auto-claim error:", err);
    return NextResponse.json({ username: null });
  }
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const rawUsername =
    typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";

  if (!rawUsername) {
    return NextResponse.json(
      { error: "Username is required." },
      { status: 422 },
    );
  }

  if (!USERNAME_RE.test(rawUsername)) {
    return NextResponse.json(
      {
        error:
          "Username must be 3–32 characters, lowercase letters/numbers/-/_, starting with a letter or number.",
      },
      { status: 422 },
    );
  }

  const admin = createAdminClient();

  // Reject collisions with existing diviner usernames — diviners own the
  // /<username>/book namespace and we don't want the admin /book/<username>
  // surface to shadow a diviner's public profile.
  const { data: divinerClash } = await admin
    .from("diviners")
    .select("id")
    .ilike("username", rawUsername)
    .maybeSingle();
  if (divinerClash) {
    return NextResponse.json(
      { error: "That username is already taken by a diviner." },
      { status: 409 },
    );
  }

  // Reject collisions with other admins.
  const { data: adminClash } = await admin
    .from("admin_users")
    .select("user_id")
    .ilike("username", rawUsername)
    .neq("user_id", user.id)
    .maybeSingle();
  if (adminClash) {
    return NextResponse.json(
      { error: "That username is already taken." },
      { status: 409 },
    );
  }

  const { error } = await admin
    .from("admin_users")
    .update({ username: rawUsername })
    .eq("user_id", user.id);

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("username")) {
      return NextResponse.json(
        {
          error:
            "Admin booking calendar requires a pending database migration. Apply '20260421000020_admin_booking_calendar' at /admin/db/migrations.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ username: rawUsername });
}
