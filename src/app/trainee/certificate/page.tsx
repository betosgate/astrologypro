import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/trainee/print-button";
import { ShareButton } from "@/components/trainee/share-button";
import Link from "next/link";

export const metadata = { title: "Certificate of Completion - AstrologyPro" };

// ── SVG Decorations ───────────────────────────────────────────────────────────

function CornerOrnament({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      className={className}
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M2 2 L30 2 L2 30 Z" fill="none" stroke="#C9922A" strokeWidth="1.2" />
      <path d="M2 2 L18 2 L2 18 Z" fill="#C9922A" fillOpacity="0.18" stroke="none" />
      <circle cx="2" cy="2" r="3" fill="#C9922A" fillOpacity="0.7" />
      <line x1="2" y1="32" x2="2" y2="60" stroke="#C9922A" strokeWidth="0.8" strokeOpacity="0.5" />
      <line x1="32" y1="2" x2="60" y2="2" stroke="#C9922A" strokeWidth="0.8" strokeOpacity="0.5" />
      <circle cx="40" cy="2" r="1.5" fill="#C9922A" fillOpacity="0.4" />
      <circle cx="2" cy="42" r="1.5" fill="#C9922A" fillOpacity="0.4" />
      <path
        d="M14 14 L22 8 L18 18 L26 14 L18 20 L22 30 L14 22 L8 30 L12 20 L4 24 L10 16 L4 10 Z"
        fill="#C9922A"
        fillOpacity="0.55"
      />
    </svg>
  );
}

function StarDivider() {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400/60 to-amber-400/60" />
      <svg viewBox="0 0 40 40" className="size-5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M20 4 L22.5 14.5 L33 12 L25.5 20 L33 28 L22.5 25.5 L20 36 L17.5 25.5 L7 28 L14.5 20 L7 12 L17.5 14.5 Z"
          fill="#C9922A"
          fillOpacity="0.85"
        />
      </svg>
      <svg viewBox="0 0 28 28" className="size-3.5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M14 2 L15.8 10.2 L24 8 L18 14 L24 20 L15.8 17.8 L14 26 L12.2 17.8 L4 20 L10 14 L4 8 L12.2 10.2 Z"
          fill="#D4AF37"
          fillOpacity="0.6"
        />
      </svg>
      <svg viewBox="0 0 40 40" className="size-5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M20 4 L22.5 14.5 L33 12 L25.5 20 L33 28 L22.5 25.5 L20 36 L17.5 25.5 L7 28 L14.5 20 L7 12 L17.5 14.5 Z"
          fill="#C9922A"
          fillOpacity="0.85"
        />
      </svg>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-400/60 to-amber-400/60" />
    </div>
  );
}

function CelestialSeal() {
  return (
    <svg
      viewBox="0 0 120 120"
      className="size-28 drop-shadow-md"
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer ring */}
      <circle cx="60" cy="60" r="56" stroke="#C9922A" strokeWidth="1.5" strokeOpacity="0.9" />
      <circle cx="60" cy="60" r="50" stroke="#C9922A" strokeWidth="0.6" strokeOpacity="0.5" />
      {/* Inner fill */}
      <circle cx="60" cy="60" r="49" fill="#FBF5E6" />
      {/* Radial tick marks */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i * 360) / 24;
        const rad = (angle * Math.PI) / 180;
        const x1 = 60 + 50 * Math.cos(rad);
        const y1 = 60 + 50 * Math.sin(rad);
        const x2 = 60 + (i % 6 === 0 ? 43 : 46) * Math.cos(rad);
        const y2 = 60 + (i % 6 === 0 ? 43 : 46) * Math.sin(rad);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#C9922A"
            strokeWidth={i % 6 === 0 ? "1.2" : "0.6"}
            strokeOpacity="0.7"
          />
        );
      })}
      {/* 8-point star center */}
      <path
        d="M60 32 L63.5 50 L78 42 L66 56 L84 60 L66 64 L78 78 L63.5 70 L60 88 L56.5 70 L42 78 L54 64 L36 60 L54 56 L42 42 L56.5 50 Z"
        fill="#C9922A"
        fillOpacity="0.85"
      />
      {/* Small center dot */}
      <circle cx="60" cy="60" r="5" fill="#1a0f00" fillOpacity="0.7" />
      {/* Tiny decorative dots on ring */}
      {[0, 90, 180, 270].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <circle
            key={angle}
            cx={60 + 53 * Math.cos(rad)}
            cy={60 + 53 * Math.sin(rad)}
            r="2.5"
            fill="#C9922A"
          />
        );
      })}
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TraineeCertificatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainee } = await supabase
    .from("trainees")
    .select("id, name, graduated_at, training_status, specialties, certificate_code")
    .eq("user_id", user.id)
    .single();

  if (!trainee) redirect("/join/trainee");
  if (!trainee.graduated_at) redirect("/trainee/progress");

  const graduatedDate = new Date(trainee.graduated_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const displayCode =
    trainee.certificate_code ?? trainee.id.split("-")[0].toUpperCase();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const verifyUrl = trainee.certificate_code
    ? `${appUrl}/certificate/verify/${trainee.certificate_code}`
    : null;

  return (
    <div className="space-y-6">
      {/* Action bar — hidden when printing */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Button variant="outline" size="sm" asChild>
          <Link href="/trainee/progress">← Back to Progress</Link>
        </Button>
        <div className="flex items-center gap-2">
          {verifyUrl && <ShareButton shareUrl={verifyUrl} />}
          <PrintButton />
        </div>
      </div>

      {/* ── Certificate ─────────────────────────────────────────────────────── */}
      <div
        id="certificate"
        className="relative mx-auto max-w-3xl overflow-hidden print:max-w-none print:shadow-none"
        style={{
          background: "#FFFDF5",
          border: "3px solid #C9922A",
          borderRadius: "4px",
          boxShadow: "0 0 0 6px #FBF0D5, 0 0 0 9px #C9922A, 0 20px 60px rgba(0,0,0,0.18)",
        }}
      >
        {/* Subtle background watermark pattern */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpath d='M40 10 L42 28 L58 22 L46 36 L62 40 L46 44 L58 58 L42 52 L40 70 L38 52 L22 58 L34 44 L18 40 L34 36 L22 22 L38 28 Z' fill='%23C9922A'/%3E%3C/svg%3E")`,
            backgroundSize: "80px 80px",
          }}
        />

        {/* Corner ornaments */}
        <CornerOrnament className="absolute top-4 left-4 size-16 opacity-80" />
        <CornerOrnament className="absolute top-4 right-4 size-16 opacity-80 scale-x-[-1]" />
        <CornerOrnament className="absolute bottom-4 left-4 size-16 opacity-80 scale-y-[-1]" />
        <CornerOrnament className="absolute bottom-4 right-4 size-16 opacity-80 scale-x-[-1] scale-y-[-1]" />

        {/* Inner content */}
        <div className="relative px-16 py-12 print:px-12 print:py-10">

          {/* Brand header */}
          <div className="mb-6 text-center">
            <p
              className="text-[11px] font-bold tracking-[0.35em] uppercase"
              style={{ color: "#8B6914" }}
            >
              ✦ &nbsp; AstrologyPro &nbsp; ✦
            </p>
            <div className="mt-1 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
          </div>

          {/* Seal + Title block */}
          <div className="flex flex-col items-center gap-4 text-center">
            <CelestialSeal />

            <div className="space-y-1">
              <p
                className="text-[11px] font-semibold tracking-[0.3em] uppercase"
                style={{ color: "#A07820" }}
              >
                Training School
              </p>
              <h1
                className="text-4xl font-bold tracking-tight sm:text-5xl print:text-4xl"
                style={{
                  color: "#1a0f00",
                  fontFamily: "Georgia, 'Times New Roman', serif",
                }}
              >
                Certificate
              </h1>
              <p
                className="text-lg tracking-[0.15em] uppercase font-light"
                style={{ color: "#6B4C10" }}
              >
                of Completion
              </p>
            </div>
          </div>

          {/* Star divider */}
          <div className="my-7">
            <StarDivider />
          </div>

          {/* Body */}
          <div className="space-y-5 text-center">
            <p
              className="text-sm tracking-[0.12em] uppercase"
              style={{ color: "#7A5C14" }}
            >
              This is to certify that
            </p>

            {/* Recipient name */}
            <div className="relative py-3">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
              <p
                className="text-5xl font-bold leading-tight sm:text-6xl print:text-5xl"
                style={{
                  color: "#1a0f00",
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  textShadow: "0 1px 2px rgba(0,0,0,0.08)",
                }}
              >
                {trainee.name ?? "Trainee"}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm" style={{ color: "#5C4A1E" }}>
                has successfully completed all required modules of the
              </p>
              <p
                className="text-xl font-bold tracking-wide"
                style={{
                  background: "linear-gradient(135deg, #C9922A 0%, #f8d275 50%, #C9922A 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                AstrologyPro Diviner Training Program
              </p>
            </div>

            {trainee.specialties && trainee.specialties.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs tracking-widest uppercase" style={{ color: "#9A7A2A" }}>
                  with specializations in
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {(trainee.specialties as string[]).map((s) => (
                    <span
                      key={s}
                      className="rounded-full px-3 py-0.5 text-xs font-semibold"
                      style={{
                        background: "linear-gradient(135deg, #FDF0CC 0%, #FBE5A0 100%)",
                        color: "#7A5010",
                        border: "1px solid #D4AF5A",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm" style={{ color: "#5C4A1E" }}>
              Awarded on{" "}
              <span className="font-semibold" style={{ color: "#2A1A00" }}>
                {graduatedDate}
              </span>
            </p>
          </div>

          {/* Star divider */}
          <div className="my-7">
            <StarDivider />
          </div>

          {/* Signature area */}
          <div className="grid grid-cols-2 gap-12 text-center">
            <div className="space-y-2">
              <div
                className="mx-auto h-px w-full"
                style={{ background: "linear-gradient(90deg, transparent, #C9922A 30%, #C9922A 70%, transparent)" }}
              />
              <p className="text-[10px] font-bold tracking-[0.25em] uppercase" style={{ color: "#8B6914" }}>
                Program Director
              </p>
              <p className="text-sm font-semibold" style={{ color: "#2A1A00" }}>
                AstrologyPro
              </p>
            </div>
            <div className="space-y-2">
              <div
                className="mx-auto h-px w-full"
                style={{ background: "linear-gradient(90deg, transparent, #C9922A 30%, #C9922A 70%, transparent)" }}
              />
              <p className="text-[10px] font-bold tracking-[0.25em] uppercase" style={{ color: "#8B6914" }}>
                Date Issued
              </p>
              <p className="text-sm font-semibold" style={{ color: "#2A1A00" }}>
                {graduatedDate}
              </p>
            </div>
          </div>

          {/* Certificate ID + verification */}
          <div className="mt-8 space-y-3 text-center">
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#A08030" }}>
              CERTIFICATE ID &nbsp;·&nbsp; {displayCode}
            </p>

            {verifyUrl && (
              <div
                className="rounded-lg px-5 py-3 space-y-1"
                style={{
                  background: "linear-gradient(135deg, #FDF5DC 0%, #FBF0CC 100%)",
                  border: "1px solid #D4AF5A",
                }}
              >
                <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "#8B6914" }}>
                  Verify Authenticity
                </p>
                <p className="font-mono text-[10px] break-all" style={{ color: "#7A5010" }}>
                  {verifyUrl}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground print:hidden">
        Use the &ldquo;Download PDF&rdquo; button above, or your browser&apos;s print
        function, to save this certificate.
      </p>
    </div>
  );
}
