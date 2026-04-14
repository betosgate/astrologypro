import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import {
  getSignedAgreementArtifact,
  resolveSignerProfile,
  sendSignedAgreementEmail,
} from "@/lib/signed-agreements";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [artifact, adminUser] = await Promise.all([
    getSignedAgreementArtifact(id),
    getAdminUser(),
  ]);

  if (!artifact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = Boolean(adminUser);
  if (artifact.user_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const recipient =
    artifact.signer_email ?? (await resolveSignerProfile(artifact.user_id)).signerEmail;

  if (!recipient) {
    return NextResponse.json(
      { error: "No account email found for the signed agreement recipient" },
      { status: 422 },
    );
  }

  await sendSignedAgreementEmail({
    artifact,
    requesterUserId: user.id,
    requestedByRole: isAdmin ? "admin" : "user",
    targetEmail: recipient,
    internalNote: isAdmin ? "Admin resend from backend tools" : "User self-service resend",
  });

  return NextResponse.json({ ok: true });
}
