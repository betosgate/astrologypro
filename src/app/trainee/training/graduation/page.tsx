import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap,
  CheckCircle2,
  Copy,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { CertificateCopyButton } from "@/components/trainee/certificate-copy-button";
import { SectionContainer } from "@/components/shared/section-container";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Graduation Certificate - AstrologyPro",
};

export default async function TrainingGraduationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch the trainee record — must exist and be graduated
  const { data: trainee } = await supabase
    .from("trainees")
    .select("id, training_status, graduated_at, certificate_code")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!trainee) redirect("/join/trainee");

  const isGraduated =
    trainee.training_status === "graduated" && !!trainee.graduated_at;

  // Fetch completed program/lesson counts for the certificate summary
  const [programsResult, lessonsResult] = await Promise.all([
    supabase
      .from("training_programs")
      .select("id, name")
      .eq("is_active", true),
    supabase
      .from("lesson_completions")
      .select("lesson_id")
      .eq("user_id", user.id),
  ]);

  const programs = programsResult.data ?? [];
  const totalLessonsCompleted = (lessonsResult.data ?? []).length;

  const graduatedAt = trainee.graduated_at
    ? new Date(trainee.graduated_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const verifyUrl = trainee.certificate_code
    ? `${appUrl}/verify/certificate/${trainee.certificate_code}`
    : null;

  if (!isGraduated) {
    return (
      <SectionContainer size="narrow" verticalPadding="md" className="space-y-6">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/trainee/training" className="hover:text-foreground transition-colors">
            Training
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Graduation</span>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <GraduationCap className="size-8 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Not Yet Graduated</h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                Complete all training programs to earn your certificate. Keep
                going — you're making progress!
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/trainee/training">
                <BookOpen className="size-4 mr-1.5" />
                Continue Training
              </Link>
            </Button>
          </CardContent>
        </Card>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer verticalPadding="md" className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/trainee/training" className="hover:text-foreground transition-colors">
          Training
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Graduation</span>
      </div>

      {/* Certificate card */}
      <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-b from-primary/[0.04] to-card overflow-hidden shadow-sm">
        {/* Header strip */}
        <div className="bg-primary/10 px-6 py-4 flex items-center justify-between gap-3 flex-wrap border-b border-primary/10">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <GraduationCap className="size-5 shrink-0" />
            Certificate of Completion
          </div>
          <Badge className="bg-green-500/15 text-green-700 border-green-500/30">
            <CheckCircle2 className="size-3.5 mr-1" />
            Verified
          </Badge>
        </div>

        <div className="px-6 py-8 space-y-6 text-center">
          {/* Seal icon */}
          <div className="flex justify-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/20">
              <GraduationCap className="size-10 text-primary" />
            </div>
          </div>

          {/* Title block */}
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              This certifies that
            </p>
            <p className="text-2xl font-bold">
              {(user.user_metadata?.full_name as string) ??
                user.email?.split("@")[0] ??
                "Trainee"}
            </p>
            <p className="text-sm text-muted-foreground">
              has successfully completed all required training programs
            </p>
          </div>

          {/* Programs list */}
          {programs.length > 0 && (
            <div className="text-left rounded-xl border bg-card/60 divide-y">
              {programs.map((prog) => (
                <div
                  key={prog.id}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm"
                >
                  <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                  <span>{prog.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-card/60 px-4 py-3 text-center">
              <p className="text-2xl font-bold tabular-nums text-primary">
                {programs.length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Programs Completed
              </p>
            </div>
            <div className="rounded-xl border bg-card/60 px-4 py-3 text-center">
              <p className="text-2xl font-bold tabular-nums text-primary">
                {totalLessonsCompleted}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Lessons Completed
              </p>
            </div>
          </div>

          {/* Graduation date */}
          {graduatedAt && (
            <p className="text-sm text-muted-foreground">
              Awarded on{" "}
              <span className="font-medium text-foreground">{graduatedAt}</span>
            </p>
          )}

          {/* Certificate code + verify link */}
          {trainee.certificate_code && (
            <div className="rounded-xl border bg-muted/40 px-5 py-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Certificate Code
              </p>
              <p className="text-lg font-mono font-bold tracking-widest text-foreground">
                {trainee.certificate_code}
              </p>
              {verifyUrl && (
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <a
                    href={verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline underline-offset-2 break-all"
                  >
                    {verifyUrl}
                  </a>
                  <CertificateCopyButton text={verifyUrl} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Back nav */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/trainee/training">
          <ArrowLeft className="size-4 mr-1" />
          Back to Training
        </Link>
      </Button>
    </SectionContainer>
  );
}
