import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin-auth";
import { getSignedAgreementArtifact, logSignedAgreementDelivery } from "@/lib/signed-agreements";

export const dynamic = "force-dynamic";

function prettyDocumentType(documentType: string) {
  return documentType
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function SignedAgreementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [artifact, adminUser] = await Promise.all([
    getSignedAgreementArtifact(id),
    getAdminUser(),
  ]);

  if (!artifact) {
    notFound();
  }

  const isAdmin = Boolean(adminUser);
  if (artifact.user_id !== user.id && !isAdmin) {
    notFound();
  }

  await logSignedAgreementDelivery({
    artifactId: artifact.id,
    requesterUserId: user.id,
    subjectUserId: artifact.user_id,
    requestedByRole: isAdmin ? "admin" : "user",
    deliveryType: "view",
    deliveryStatus: "viewed",
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{artifact.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {prettyDocumentType(artifact.document_type)} · Version {artifact.document_version} · Signed{" "}
            {new Date(artifact.accepted_at).toLocaleString("en-US")}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/legal/agreements/${artifact.id}/download`}
            className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium"
          >
            Download PDF
          </a>
          <Link
            href="/account/legal"
            className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium"
          >
            Back to Agreements
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Signed Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-3 text-sm">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Signer</div>
              <div className="mt-1 font-medium">{artifact.signer_name ?? "Account User"}</div>
              <div className="text-muted-foreground">{artifact.signer_email ?? "Email not recorded"}</div>
            </div>
            <div className="rounded-lg border p-3 text-sm">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Content Hash</div>
              <div className="mt-1 break-all font-mono text-xs">{artifact.content_hash}</div>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4">
            <pre className="whitespace-pre-wrap text-sm leading-6">{artifact.content_snapshot}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
