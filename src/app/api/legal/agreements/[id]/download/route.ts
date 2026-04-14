import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import {
  buildSignedAgreementFilename,
  buildSignedAgreementPdf,
  getSignedAgreementArtifact,
  logSignedAgreementDelivery,
} from "@/lib/signed-agreements";

export const dynamic = "force-dynamic";

export async function GET(
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

  const pdf = buildSignedAgreementPdf(artifact);
  const filename = buildSignedAgreementFilename(artifact);

  await logSignedAgreementDelivery({
    artifactId: artifact.id,
    requesterUserId: user.id,
    subjectUserId: artifact.user_id,
    requestedByRole: isAdmin ? "admin" : "user",
    deliveryType: "download",
    deliveryStatus: "downloaded",
  });

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
