import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/trainee/print-button";
import { Award, Star } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Certificate of Completion - AstrologyPro" };

export default async function TraineeCertificatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainee } = await supabase
    .from("trainees")
    .select("id, name, graduated_at, training_status, specialties")
    .eq("user_id", user.id)
    .single();

  if (!trainee) redirect("/join/trainee");
  if (!trainee.graduated_at) redirect("/trainee/progress");

  const graduatedDate = new Date(trainee.graduated_at).toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" }
  );

  return (
    <div className="space-y-6">
      {/* Actions — hidden when printing */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Button variant="outline" size="sm" asChild>
          <Link href="/trainee/progress">← Back to Progress</Link>
        </Button>
        <PrintButton />
      </div>

      {/* Certificate */}
      <div
        id="certificate"
        className="mx-auto max-w-2xl rounded-2xl border-4 border-double border-amber-400/60 bg-gradient-to-br from-amber-50 to-white p-10 shadow-lg print:border-amber-500 print:shadow-none"
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-amber-100 ring-4 ring-amber-200">
            <Award className="size-9 text-amber-600" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">
              AstrologyPro Training School
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-800 sm:text-4xl">
              Certificate of Completion
            </h1>
          </div>

          <div className="my-2 flex items-center gap-2">
            <Star className="size-4 text-amber-400 fill-amber-400" />
            <Star className="size-4 text-amber-400 fill-amber-400" />
            <Star className="size-4 text-amber-400 fill-amber-400" />
          </div>
        </div>

        {/* Body */}
        <div className="my-8 space-y-6 text-center">
          <p className="text-base text-gray-600">
            This is to certify that
          </p>

          <p className="text-4xl font-bold text-gray-900 tracking-tight font-serif">
            {trainee.name ?? "Trainee"}
          </p>

          <div className="space-y-2">
            <p className="text-base text-gray-600">
              has successfully completed all required modules of the
            </p>
            <p className="text-xl font-semibold text-amber-700">
              AstrologyPro Diviner Training Program
            </p>
          </div>

          {trainee.specialties && trainee.specialties.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm text-gray-500">with specializations in</p>
              <p className="text-base font-medium text-gray-800">
                {trainee.specialties.join(" · ")}
              </p>
            </div>
          )}

          <p className="text-base text-gray-600">
            on{" "}
            <span className="font-semibold text-gray-800">{graduatedDate}</span>
          </p>
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-amber-200" />
          <Star className="size-4 text-amber-300 fill-amber-300" />
          <div className="h-px flex-1 bg-amber-200" />
        </div>

        {/* Footer signature area */}
        <div className="grid grid-cols-2 gap-8 text-center">
          <div>
            <div className="mb-2 h-px w-full bg-gray-300" />
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">
              Program Director
            </p>
            <p className="text-sm font-semibold text-gray-800 mt-1">AstrologyPro</p>
          </div>
          <div>
            <div className="mb-2 h-px w-full bg-gray-300" />
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">
              Date Issued
            </p>
            <p className="text-sm font-semibold text-gray-800 mt-1">
              {graduatedDate}
            </p>
          </div>
        </div>

        {/* Certificate ID */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400 font-mono">
            Certificate ID: {trainee.id.split("-")[0].toUpperCase()}
          </p>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground print:hidden">
        Use your browser&apos;s print function or the button above to save as PDF.
      </p>
    </div>
  );
}
