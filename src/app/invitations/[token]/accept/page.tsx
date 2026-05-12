import { createHash } from "crypto";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { AcceptInvitationForm } from "./accept-invitation-form";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  client: "Client",
  advocate: "Social Advocate",
  social_advo: "Social Advocate",
  trainee: "Trainee",
  community_mystery_school: "Community - Mystery School",
  community_perennial_mandalism: "Community - Perennial Mandalism",
};

function roleLabel(role: string) {
  return (
    ROLE_LABELS[role] ??
    role
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

export default async function AcceptInvitationPage({ params }: Params) {
  const { token } = await params;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const admin = createAdminClient();

  const { data: invitation, error } = await admin
    .from("invitations")
    .select("email, role_slug, status, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!invitation) {
    return (
      <AcceptInvitationForm
        token={token}
        state="invalid"
        title="Invitation Not Found"
        message="This invitation link is invalid or has already been replaced."
      />
    );
  }

  if (invitation.status !== "pending") {
    return (
      <AcceptInvitationForm
        token={token}
        state="invalid"
        title="Invitation Unavailable"
        message="This invitation has already been used, cancelled, or expired."
      />
    );
  }

  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return (
      <AcceptInvitationForm
        token={token}
        state="invalid"
        title="Invitation Expired"
        message="This invitation link has expired. Ask an admin to resend it."
      />
    );
  }

  if (invitation.role_slug === "diviner") {
    redirect(
      `/join/diviner?email=${encodeURIComponent(invitation.email)}&inviteToken=${encodeURIComponent(token)}`
    );
  }

  return (
    <AcceptInvitationForm
      token={token}
      state="ready"
      email={invitation.email}
      roleSlug={invitation.role_slug}
      roleLabel={roleLabel(invitation.role_slug)}
    />
  );
}
