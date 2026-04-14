import crypto from "node:crypto";
import { sendEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSimplePdfDocument } from "@/lib/simple-pdf";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

export interface SignedAgreementArtifact {
  id: string;
  acceptance_id: string;
  user_id: string;
  document_id: string;
  document_type: string;
  document_version: string;
  title: string;
  content_snapshot: string;
  rendered_variables: Record<string, unknown> | null;
  signer_email: string | null;
  signer_name: string | null;
  accepted_at: string;
  content_hash: string;
  created_at: string;
}

export async function resolveSignerProfile(userId: string) {
  const admin = createAdminClient();
  const [clientRes, communityRes, divinerRes, traineeRes, advocateRes] = await Promise.all([
    admin.from("clients").select("full_name, email").eq("user_id", userId).maybeSingle(),
    admin.from("community_members").select("full_name, email").eq("user_id", userId).maybeSingle(),
    admin.from("diviners").select("display_name").eq("user_id", userId).maybeSingle(),
    admin.from("trainees").select("name, email").eq("user_id", userId).maybeSingle(),
    admin.from("social_advocates").select("name, email").eq("user_id", userId).maybeSingle(),
  ]);

  const signerName =
    clientRes.data?.full_name ??
    communityRes.data?.full_name ??
    divinerRes.data?.display_name ??
    traineeRes.data?.name ??
    advocateRes.data?.name ??
    null;

  const signerEmail =
    clientRes.data?.email ??
    communityRes.data?.email ??
    traineeRes.data?.email ??
    advocateRes.data?.email ??
    null;

  return {
    signerName,
    signerEmail,
  };
}

export async function ensureSignedAgreementArtifactForAcceptance(acceptanceId: string) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("signed_agreement_artifacts")
    .select("*")
    .eq("acceptance_id", acceptanceId)
    .maybeSingle();

  if (existing) {
    return existing as SignedAgreementArtifact;
  }

  const { data: acceptance, error: acceptanceError } = await admin
    .from("legal_acceptances")
    .select("id, user_id, document_id, document_type, document_version, accepted_at")
    .eq("id", acceptanceId)
    .single();

  if (acceptanceError || !acceptance) {
    throw new Error(acceptanceError?.message ?? "Acceptance not found");
  }

  const { data: document, error: documentError } = await admin
    .from("legal_documents")
    .select("id, title, content")
    .eq("id", acceptance.document_id)
    .single();

  if (documentError || !document) {
    throw new Error(documentError?.message ?? "Legal document not found");
  }

  const { signerEmail, signerName } = await resolveSignerProfile(acceptance.user_id);

  const contentHash = crypto
    .createHash("sha256")
    .update(`${document.title}|${acceptance.document_version}|${document.content}`)
    .digest("hex");

  const { data: artifact, error } = await admin
    .from("signed_agreement_artifacts")
    .insert({
      acceptance_id: acceptance.id,
      user_id: acceptance.user_id,
      document_id: document.id,
      document_type: acceptance.document_type,
      document_version: acceptance.document_version,
      title: document.title,
      content_snapshot: document.content,
      rendered_variables: {},
      signer_email: signerEmail,
      signer_name: signerName,
      accepted_at: acceptance.accepted_at,
      content_hash: contentHash,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return artifact as SignedAgreementArtifact;
}

export async function listSignedAgreementsForUser(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("signed_agreement_artifacts")
    .select("*")
    .eq("user_id", userId)
    .order("accepted_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SignedAgreementArtifact[];
}

export async function getSignedAgreementArtifact(artifactId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("signed_agreement_artifacts")
    .select("*")
    .eq("id", artifactId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as SignedAgreementArtifact | null;
}

export async function logSignedAgreementDelivery(params: {
  artifactId: string;
  requesterUserId: string | null;
  subjectUserId: string;
  requestedByRole: "user" | "admin" | "system";
  deliveryType: "view" | "download" | "email";
  deliveryStatus: "queued" | "sent" | "failed" | "viewed" | "downloaded";
  targetEmail?: string | null;
  internalNote?: string | null;
  errorMessage?: string | null;
}) {
  const admin = createAdminClient();
  await admin.from("signed_agreement_delivery_logs").insert({
    artifact_id: params.artifactId,
    requester_user_id: params.requesterUserId,
    subject_user_id: params.subjectUserId,
    requested_by_role: params.requestedByRole,
    delivery_type: params.deliveryType,
    delivery_status: params.deliveryStatus,
    target_email: params.targetEmail ?? null,
    internal_note: params.internalNote ?? null,
    error_message: params.errorMessage ?? null,
  });
}

function prettyDocumentType(documentType: string) {
  return documentType
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildSignedAgreementPdf(artifact: SignedAgreementArtifact) {
  const body = [
    artifact.title,
    "",
    `Document Type: ${prettyDocumentType(artifact.document_type)}`,
    `Version: ${artifact.document_version}`,
    `Signer: ${artifact.signer_name ?? "Account User"}`,
    `Signer Email: ${artifact.signer_email ?? "Not recorded"}`,
    `Accepted At: ${new Date(artifact.accepted_at).toLocaleString("en-US")}`,
    `Content Hash: ${artifact.content_hash}`,
    "",
    "Agreement Body",
    "",
    artifact.content_snapshot,
  ].join("\n");

  return buildSimplePdfDocument(body);
}

export function buildSignedAgreementFilename(artifact: SignedAgreementArtifact) {
  const signedDate = new Date(artifact.accepted_at).toISOString().slice(0, 10);
  return `${artifact.document_type}-${artifact.document_version}-${signedDate}.pdf`;
}

export async function sendSignedAgreementEmail(params: {
  artifact: SignedAgreementArtifact;
  requesterUserId: string | null;
  requestedByRole: "user" | "admin" | "system";
  targetEmail: string;
  internalNote?: string | null;
}) {
  const { artifact, requesterUserId, requestedByRole, targetEmail, internalNote } = params;
  const viewUrl = `${APP_URL}/community/legal/${artifact.id}`;
  const downloadUrl = `${APP_URL}/api/legal/agreements/${artifact.id}/download`;

  await logSignedAgreementDelivery({
    artifactId: artifact.id,
    requesterUserId,
    subjectUserId: artifact.user_id,
    requestedByRole,
    deliveryType: "email",
    deliveryStatus: "queued",
    targetEmail,
    internalNote,
  });

  try {
    await sendEmail({
      to: targetEmail,
      subject: `${artifact.title} signed agreement copy`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
          <h2 style="margin-bottom:12px;">${artifact.title}</h2>
          <p>Your signed agreement copy is ready.</p>
          <p><strong>Version:</strong> ${artifact.document_version}<br/>
          <strong>Signed:</strong> ${new Date(artifact.accepted_at).toLocaleString("en-US")}</p>
          <p>
            <a href="${viewUrl}" style="display:inline-block;padding:10px 16px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;margin-right:8px;">View Agreement</a>
            <a href="${downloadUrl}" style="display:inline-block;padding:10px 16px;background:#f3f4f6;color:#111827;text-decoration:none;border-radius:8px;">Download PDF</a>
          </p>
          <p style="color:#6b7280;font-size:12px;">For security, the links open your authenticated AstrologyPro account.</p>
        </div>
      `,
    });

    await logSignedAgreementDelivery({
      artifactId: artifact.id,
      requesterUserId,
      subjectUserId: artifact.user_id,
      requestedByRole,
      deliveryType: "email",
      deliveryStatus: "sent",
      targetEmail,
      internalNote,
    });
  } catch (error) {
    await logSignedAgreementDelivery({
      artifactId: artifact.id,
      requesterUserId,
      subjectUserId: artifact.user_id,
      requestedByRole,
      deliveryType: "email",
      deliveryStatus: "failed",
      targetEmail,
      internalNote,
      errorMessage: error instanceof Error ? error.message : "Email send failed",
    });
    throw error;
  }
}
