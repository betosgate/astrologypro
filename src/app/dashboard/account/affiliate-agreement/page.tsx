// /dashboard/account/affiliate-agreement
//
// Diviner-facing page to review + sign the affiliate partnership agreement.
// Without signing, /dashboard/affiliates' Invite button is disabled and the
// matching server-side gate in POST /api/dashboard/affiliates/invite returns
// 403. This page was referenced by the Task 04 agreement-gate banner but
// never created.
//
// Sprint: docs/tasks/2026-04-23/affiliate-identity-refactor/

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, FileText, ArrowLeft } from "lucide-react";
import { SignAgreementButton } from "./sign-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Affiliate Agreement — AstrologyPro" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function AffiliateAgreementPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/account/affiliate-agreement");

  const admin = createAdminClient();

  const [divRes, docRes] = await Promise.all([
    admin
      .from("diviners")
      .select("id, affiliate_agreement_signed, affiliate_agreement_signed_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    admin
      .from("legal_documents")
      .select("id, title, version, content, effective_date")
      .eq("document_type", "affiliate_agreement")
      .eq("is_active", true)
      .order("effective_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!divRes.data) redirect("/dashboard");
  if (!docRes.data) notFound();

  const diviner = divRes.data as {
    id: string;
    affiliate_agreement_signed: boolean | null;
    affiliate_agreement_signed_at: string | null;
  };
  const doc = docRes.data as {
    id: string;
    title: string;
    version: string;
    content: string;
    effective_date: string;
  };

  const alreadySigned = Boolean(diviner.affiliate_agreement_signed);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/affiliates" aria-label="Back to affiliates">
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{doc.title}</h1>
          <p className="text-sm text-muted-foreground">
            Version {doc.version} · effective {formatDate(doc.effective_date)}
          </p>
        </div>
      </div>

      {alreadySigned ? (
        <Alert className="border-emerald-400/40 bg-emerald-50 dark:bg-emerald-950/20">
          <CheckCircle2 className="size-4 text-emerald-500" aria-hidden />
          <AlertTitle>Agreement signed</AlertTitle>
          <AlertDescription className="mt-1 space-y-3">
            <p>
              You accepted this agreement on{" "}
              <strong>
                {diviner.affiliate_agreement_signed_at
                  ? formatDate(diviner.affiliate_agreement_signed_at)
                  : "an earlier date"}
              </strong>
              . You can invite affiliates from the affiliates page.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/affiliates">Go to affiliates</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-amber-400/40 bg-amber-50 dark:bg-amber-950/20">
          <FileText className="size-4 text-amber-500" aria-hidden />
          <AlertTitle>Review and sign to enable affiliate invitations</AlertTitle>
          <AlertDescription className="mt-1">
            Read the agreement below. Signing is required before you can invite
            affiliates under your account.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{doc.title}</CardTitle>
          <CardDescription>
            Last updated {formatDate(doc.effective_date)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <article
            className="prose prose-sm dark:prose-invert max-w-none"
            // Legal docs are admin-authored + stored as HTML; trusted source.
            // If the docs store Markdown instead, a follow-up can add
            // react-markdown here — current storage is already pre-rendered.
            dangerouslySetInnerHTML={{ __html: doc.content }}
          />
        </CardContent>
      </Card>

      {!alreadySigned && <SignAgreementButton />}
    </div>
  );
}
