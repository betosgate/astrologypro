import { createAdminClient } from "@/lib/supabase/admin";
import { Award, CheckCircle2, XCircle } from "lucide-react";

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { code } = await params;
  return {
    title: `Certificate Verification — ${code} | AstrologyPro`,
    description: "Verify an AstrologyPro Training Certificate.",
  };
}

export default async function CertificateVerifyPage({ params }: Props) {
  const { code } = await params;
  const admin = createAdminClient();

  const { data: trainee } = await admin
    .from("trainees")
    .select("name, graduated_at, certificate_code")
    .eq("certificate_code", code.toUpperCase())
    .maybeSingle();

  const isValid = !!trainee && !!trainee.graduated_at;

  const graduatedDate = isValid
    ? new Date(trainee!.graduated_at!).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 to-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-amber-200 bg-white shadow-lg p-10 text-center space-y-6">
        {/* AstrologyPro brand header */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-14 items-center justify-center rounded-full bg-amber-100 ring-4 ring-amber-200">
            <Award className="size-8 text-amber-600" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">
            AstrologyPro Training School
          </p>
          <h1 className="text-2xl font-bold text-gray-800">
            Certificate Verification
          </h1>
        </div>

        {/* Verification result */}
        {isValid ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-emerald-600">
              <CheckCircle2 className="size-7" />
              <span className="text-xl font-semibold">Certificate Verified</span>
            </div>

            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6 space-y-3 text-left">
              <Row label="Name" value={trainee!.name ?? "Trainee"} />
              <Row
                label="Program"
                value="AstrologyPro Diviner Training Program"
              />
              <Row label="Graduated" value={graduatedDate!} />
              <Row label="Certificate Code" value={trainee!.certificate_code!} mono />
            </div>

            <p className="text-sm text-gray-500">
              This certificate was issued by AstrologyPro Training School and is
              verified as authentic.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-red-500">
              <XCircle className="size-7" />
              <span className="text-xl font-semibold">Certificate Not Found</span>
            </div>

            <div className="rounded-xl bg-red-50 border border-red-200 p-5 text-sm text-red-700">
              No certificate was found for code{" "}
              <span className="font-mono font-semibold">{code.toUpperCase()}</span>.
              Please double-check the code and try again.
            </div>

            <p className="text-sm text-gray-500">
              If you believe this is an error, please contact support at{" "}
              <a
                href="mailto:support@astrologypro.com"
                className="text-amber-600 underline hover:text-amber-700"
              >
                support@astrologypro.com
              </a>
              .
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100">
          <a
            href="/"
            className="text-sm text-amber-600 hover:text-amber-700 underline"
          >
            astrologypro.com
          </a>
        </div>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span
        className={`text-sm font-semibold text-gray-800 text-right ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
