import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

interface InviteProvisioningUser {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function getDisplayName(user: InviteProvisioningUser) {
  const metadata = user.user_metadata ?? {};
  const fullName =
    typeof metadata.full_name === "string" && metadata.full_name.trim()
      ? metadata.full_name.trim()
      : typeof metadata.name === "string" && metadata.name.trim()
        ? metadata.name.trim()
        : null;

  if (fullName) return fullName;

  const emailLocal = user.email?.split("@")[0]?.trim();
  if (emailLocal) return emailLocal;

  return `user-${user.id.slice(0, 8)}`;
}

function buildUniqueUsername(user: InviteProvisioningUser, fallbackPrefix: string) {
  const metadata = user.user_metadata ?? {};
  const rawUsername =
    typeof metadata.username === "string" && metadata.username.trim()
      ? metadata.username.trim()
      : getDisplayName(user);

  const base = slugify(rawUsername) || fallbackPrefix;
  return `${base}-${user.id.slice(0, 6)}`;
}

function buildReferralCode(user: InviteProvisioningUser) {
  const display = slugify(getDisplayName(user)).replace(/-/g, "").toUpperCase();
  const prefix = (display || "ADVOCATE").slice(0, 8);
  return `${prefix}${user.id.replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}

export async function ensureInvitedRoleProvisioning(
  admin: AdminClient,
  user: InviteProvisioningUser,
  role: string | undefined
) {
  if (!role) return;

  const email = user.email?.trim().toLowerCase() ?? null;
  const displayName = getDisplayName(user);
  const username = buildUniqueUsername(user, role);

  switch (role) {
    case "diviner": {
      await admin.from("diviners").upsert(
        {
          user_id: user.id,
          username,
          display_name: displayName,
          onboarding_completed: false,
          onboarding_step: 1,
          is_active: true,
        },
        { onConflict: "user_id" }
      );
      return;
    }
    case "trainee": {
      if (!email) return;
      await admin.from("trainees").upsert(
        {
          user_id: user.id,
          name: displayName,
          email,
          username,
          training_status: "active",
          onboarding_completed: false,
        },
        { onConflict: "user_id" }
      );
      return;
    }
    case "social_advo":
    case "advocate": {
      if (!email) return;
      await admin.from("social_advocates").upsert(
        {
          user_id: user.id,
          name: displayName,
          email,
          username,
          referral_code: buildReferralCode(user),
          is_active: true,
          onboarding_completed: false,
        },
        { onConflict: "user_id" }
      );
      return;
    }
    case "client": {
      if (!email) return;
      await admin.from("clients").upsert(
        {
          user_id: user.id,
          email,
          full_name: displayName,
        },
        { onConflict: "user_id" }
      );
      return;
    }
    default:
      return;
  }
}
