import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/trainee/print-button";
import { ShareButton } from "@/components/trainee/share-button";
import Link from "next/link";

export const metadata = { title: "Certificate of Completion - AstrologyPro" };

// ── Fallbacks (used only if DB config is missing) ─────────────────────────────
const DEFAULT_ASTROLOGY_PROGRAMS = [
  "Natal Chart Reading",
  "Solar Return",
  "Monthly Transit & Lunar Return",
  "Weekly Transits",
  "Romantic Relationship Reading",
  "Friendship Relationship Reading",
  "Business Relationship Reading",
  "Predictive Event (Horary)",
];

const DEFAULT_TAROT_PROGRAMS = [
  "3-Card Basic Question Spread",
  "5-Card Complex Question Spread",
  "7-Card Six-Month Forward Review",
  "7-Card Horseshoe Spread",
  "10-Card Relationship Spread",
  "10-Card Celtic Cross",
  "12-Card Astrological Spread",
];

// ── SVG helpers ────────────────────────────────────────────────────────────────

function CornerOrnament({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" fill="none">
      <path d="M4 4 L44 4 L4 44 Z" fill="none" stroke="#B8860B" strokeWidth="1" />
      <path d="M4 4 L24 4 L4 24 Z" fill="#B8860B" fillOpacity="0.15" />
      <circle cx="4" cy="4" r="3.5" fill="#B8860B" fillOpacity="0.8" />
      <line x1="4" y1="48" x2="4" y2="82" stroke="#B8860B" strokeWidth="0.7" strokeOpacity="0.45" />
      <line x1="48" y1="4" x2="82" y2="4" stroke="#B8860B" strokeWidth="0.7" strokeOpacity="0.45" />
      <circle cx="4" cy="64" r="1.5" fill="#B8860B" fillOpacity="0.35" />
      <circle cx="64" cy="4" r="1.5" fill="#B8860B" fillOpacity="0.35" />
      <path
        d="M18 18 L20.5 26 L28 23.5 L22.5 30 L30 33 L22.5 36 L28 42.5 L20.5 40 L18 48 L15.5 40 L8 42.5 L13.5 36 L6 33 L13.5 30 L8 23.5 L15.5 26 Z"
        fill="#B8860B" fillOpacity="0.6"
      />
    </svg>
  );
}

function OrnamentalDivider() {
  return (
    <div className="flex items-center gap-3 w-full" aria-hidden="true">
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, #B8860B 60%)" }} />
      <svg viewBox="0 0 60 20" className="w-12 shrink-0" fill="none">
        <path d="M0 10 Q15 2 30 10 Q45 18 60 10" stroke="#B8860B" strokeWidth="0.8" strokeOpacity="0.6" fill="none" />
        <circle cx="10" cy="10" r="2" fill="#B8860B" fillOpacity="0.5" />
        <circle cx="30" cy="10" r="3" fill="#B8860B" fillOpacity="0.8" />
        <circle cx="50" cy="10" r="2" fill="#B8860B" fillOpacity="0.5" />
      </svg>
      <svg viewBox="0 0 20 20" className="w-4 shrink-0" fill="none">
        <path d="M10 1 L11.8 7.5 L18 5.5 L13.5 10 L18 14.5 L11.8 12.5 L10 19 L8.2 12.5 L2 14.5 L6.5 10 L2 5.5 L8.2 7.5 Z" fill="#B8860B" fillOpacity="0.9" />
      </svg>
      <svg viewBox="0 0 60 20" className="w-12 shrink-0" fill="none">
        <path d="M60 10 Q45 2 30 10 Q15 18 0 10" stroke="#B8860B" strokeWidth="0.8" strokeOpacity="0.6" fill="none" />
        <circle cx="50" cy="10" r="2" fill="#B8860B" fillOpacity="0.5" />
        <circle cx="30" cy="10" r="3" fill="#B8860B" fillOpacity="0.8" />
        <circle cx="10" cy="10" r="2" fill="#B8860B" fillOpacity="0.5" />
      </svg>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, #B8860B 60%)" }} />
    </div>
  );
}

function SchoolSeal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 140" className={className ?? "size-28"} aria-hidden="true" fill="none">
      <circle cx="70" cy="70" r="66" stroke="#B8860B" strokeWidth="1.5" />
      <circle cx="70" cy="70" r="59" stroke="#B8860B" strokeWidth="0.5" strokeOpacity="0.6" />
      <circle cx="70" cy="70" r="58" fill="#FDF6E3" />
      {Array.from({ length: 36 }).map((_, i) => {
        const angle = (i * 10 * Math.PI) / 180;
        const isMajor = i % 9 === 0;
        const inner = isMajor ? 50 : 53;
        return (
          <line key={i}
            x1={70 + 59 * Math.cos(angle)} y1={70 + 59 * Math.sin(angle)}
            x2={70 + inner * Math.cos(angle)} y2={70 + inner * Math.sin(angle)}
            stroke="#B8860B" strokeWidth={isMajor ? "1.2" : "0.6"} strokeOpacity={isMajor ? "0.8" : "0.45"}
          />
        );
      })}
      <path d="M70 38 L72.5 58 L88 48 L76 64 L96 66 L76 72 L90 86 L72.5 78 L72 98 L67.5 78 L50 88 L63 72 L43 70 L63 64 L48 50 L67.5 58 Z" fill="#B8860B" fillOpacity="0.82" />
      <circle cx="70" cy="70" r="14" fill="#FDF6E3" />
      <circle cx="70" cy="70" r="11" stroke="#B8860B" strokeWidth="0.8" strokeOpacity="0.6" />
      <circle cx="70" cy="70" r="4" fill="#B8860B" fillOpacity="0.85" />
      {[0, 90, 180, 270].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return <circle key={deg} cx={70 + 63 * Math.cos(rad)} cy={70 + 63 * Math.sin(rad)} r="3" fill="#B8860B" fillOpacity="0.9" />;
      })}
      {[45, 135, 225, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return <circle key={deg} cx={70 + 63 * Math.cos(rad)} cy={70 + 63 * Math.sin(rad)} r="1.8" fill="#B8860B" fillOpacity="0.6" />;
      })}
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TraineeCertificatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainee } = await supabase
    .from("trainees")
    .select("id, name, graduated_at, training_status, specialties, certificate_code")
    .eq("user_id", user.id)
    .single();

  if (!trainee) redirect("/join/trainee");
  if (!trainee.graduated_at) redirect("/trainee/progress");

  // Load certificate config from DB (admin-managed), fall back to defaults
  const admin = createAdminClient();
  const { data: certConfig } = await admin
    .from("certificate_config")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();

  const SCHOOL_NAME = certConfig?.school_name ?? "School of Our Divine Infinite Being";
  const SCHOOL_TAGLINE = certConfig?.school_tagline ?? "Polytheistic Monism · Divine Theurgy · Oracle to the Gods";
  const DESIGNATION_TITLE = certConfig?.designation_title ?? "Certified Divination Consultant";
  const PROGRAM_TITLE = certConfig?.program_title ?? "Astrology & Tarot Consulting Certification Course";
  const HEAD_MASTER_NAME = certConfig?.head_master_name ?? "Eddie Paredes";
  const STUDY_HOURS = certConfig?.study_hours ?? "100+";
  const LIVE_CLASSROOM_HOURS = certConfig?.live_classroom_hours ?? "30";
  const LIVE_READINGS = certConfig?.live_readings ?? "20+";
  const CERTIFICATION_COUNT = certConfig?.certification_count ?? "15";
  const ASTROLOGY_PROGRAMS: string[] =
    Array.isArray(certConfig?.astrology_programs) && certConfig.astrology_programs.length > 0
      ? (certConfig.astrology_programs as string[])
      : DEFAULT_ASTROLOGY_PROGRAMS;
  const TAROT_PROGRAMS: string[] =
    Array.isArray(certConfig?.tarot_programs) && certConfig.tarot_programs.length > 0
      ? (certConfig.tarot_programs as string[])
      : DEFAULT_TAROT_PROGRAMS;

  const graduatedDate = new Date(trainee.graduated_at).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  const displayCode = trainee.certificate_code ?? trainee.id.split("-")[0].toUpperCase();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const verifyUrl = trainee.certificate_code
    ? `${appUrl}/certificate/verify/${trainee.certificate_code}`
    : null;

  const specialties: string[] = Array.isArray(trainee.specialties)
    ? (trainee.specialties as string[])
    : [];

  return (
    <>
      {/* ── Print CSS ── single landscape page, colours preserved ── */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 6mm;
          }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          #certificate-wrap {
            padding: 0 !important;
            margin: 0 !important;
          }
          #certificate {
            max-width: 100% !important;
            width: 100% !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          #cert-inner {
            padding: 18px 42px !important;
          }
          #cert-logo { display: none !important; }
          #cert-seal-top { width: 64px !important; height: 64px !important; }
          #cert-name { font-size: 36px !important; }
          #cert-designation { font-size: 16px !important; }
          #cert-program-title { font-size: 14px !important; }
          .cert-divider { margin-top: 8px !important; margin-bottom: 8px !important; }
          .cert-section { margin-top: 10px !important; margin-bottom: 10px !important; }
          .cert-stat-val { font-size: 16px !important; }
          .cert-prog-item { font-size: 9px !important; line-height: 1.4 !important; }
          .cert-prog-header { font-size: 8px !important; }
          .cert-specialty { font-size: 9px !important; padding: 1px 8px !important; }
          .cert-sig-seal { display: none !important; }
          .cert-footer { margin-top: 8px !important; padding-top: 6px !important; }
          .cert-verify-box { padding: 4px 12px !important; }
        }
      `}</style>

      <div id="certificate-wrap" className="space-y-6">
        {/* Action bar */}
        <div className="no-print flex items-center justify-between gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/trainee/progress">← Back to Progress</Link>
          </Button>
          <div className="flex items-center gap-2">
            {verifyUrl && <ShareButton shareUrl={verifyUrl} />}
            <PrintButton />
          </div>
        </div>

        {/* ── Certificate ─────────────────────────────────────────────── */}
        <div
          id="certificate"
          className="relative mx-auto overflow-hidden"
          style={{
            maxWidth: "860px",
            background: "#FFFDF5",
            border: "3px solid #B8860B",
            borderRadius: "2px",
            boxShadow: "0 0 0 7px #FDF0CC, 0 0 0 10px #B8860B, 0 0 0 14px #F5E4A0, 0 24px 80px rgba(0,0,0,0.2)",
          }}
        >
          {/* Watermark */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.028]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M50 12 L53 38 L76 28 L58 46 L84 50 L58 54 L76 72 L53 62 L50 88 L47 62 L24 72 L42 54 L16 50 L42 46 L24 28 L47 38 Z' fill='%23B8860B'/%3E%3C/svg%3E")`,
              backgroundSize: "100px 100px",
            }}
          />

          {/* Corner ornaments */}
          <CornerOrnament className="absolute top-3 left-3 size-20 opacity-90" />
          <CornerOrnament className="absolute top-3 right-3 size-20 opacity-90 scale-x-[-1]" />
          <CornerOrnament className="absolute bottom-3 left-3 size-20 opacity-90 scale-y-[-1]" />
          <CornerOrnament className="absolute bottom-3 right-3 size-20 opacity-90 scale-x-[-1] scale-y-[-1]" />

          {/* ── Inner content ──────────────────────────────────────────── */}
          <div id="cert-inner" className="relative px-20 py-12">

            {/* Institution header */}
            <div className="text-center space-y-3 mb-6 cert-section">
              <div id="cert-logo" className="flex justify-center">
                <Image
                  src="/images/home/png_logo_1.png"
                  alt="School of Our Divine Infinite Being"
                  width={72} height={72}
                  className="object-contain opacity-90"
                  style={{ filter: "sepia(0.4) brightness(0.85)" }}
                />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[0.4em] uppercase" style={{ color: "#7A5C0A" }}>
                  {SCHOOL_NAME.split(" ").slice(0, -2).join(" ")}
                </p>
                <h2 className="text-2xl font-bold tracking-widest uppercase mt-0.5"
                  style={{ color: "#2A1A00", fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "0.2em" }}>
                  {SCHOOL_NAME.split(" ").slice(-2).join(" ")}
                </h2>
                <p className="text-[9px] tracking-[0.22em] uppercase mt-1" style={{ color: "#9A7A2A" }}>
                  {SCHOOL_TAGLINE}
                </p>
              </div>
              <div className="cert-divider"><OrnamentalDivider /></div>
            </div>

            {/* Seal + certify block */}
            <div className="flex flex-col items-center gap-3 text-center mb-6 cert-section">
              <SchoolSeal className="size-24" />

              <div className="space-y-1.5 w-full">
                <p className="text-[10px] font-semibold tracking-[0.35em] uppercase" style={{ color: "#8B6914" }}>
                  This is to certify that
                </p>

                <div className="relative py-3">
                  <div className="absolute inset-x-8 top-0 h-px"
                    style={{ background: "linear-gradient(to right, transparent, #B8860B, transparent)" }} />
                  <div className="absolute inset-x-8 bottom-0 h-px"
                    style={{ background: "linear-gradient(to right, transparent, #B8860B, transparent)" }} />
                  <p id="cert-name" className="text-5xl font-bold leading-tight"
                    style={{ color: "#1a0f00", fontFamily: "Georgia, 'Times New Roman', serif" }}>
                    {trainee.name ?? "Trainee"}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-sm" style={{ color: "#4A3810" }}>
                    having fulfilled all academic requirements, practical examinations, and live classroom obligations of the
                  </p>
                  <p id="cert-program-title" className="text-xl font-bold tracking-wide leading-snug"
                    style={{
                      background: "linear-gradient(135deg, #8B6000 0%, #D4A017 40%, #C9922A 60%, #8B6000 100%)",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                    }}>
                    {PROGRAM_TITLE}
                  </p>
                  <p className="text-sm" style={{ color: "#4A3810" }}>
                    is hereby recognized and awarded the designation of
                  </p>
                  <p id="cert-designation" className="text-2xl font-bold tracking-[0.08em] uppercase"
                    style={{ color: "#1a0f00", fontFamily: "Georgia, 'Times New Roman', serif" }}>
                    {DESIGNATION_TITLE}
                  </p>
                </div>
              </div>
            </div>

            <div className="cert-divider"><OrnamentalDivider /></div>

            {/* Training stats */}
            <div className="my-4 cert-section space-y-2">
              <p className="text-center text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: "#7A5C0A" }}>
                Comprehensive Training Completed
              </p>
              <div className="flex justify-center gap-8 flex-wrap text-center">
                {[
                  { value: STUDY_HOURS, label: "Hours of Study" },
                  { value: LIVE_CLASSROOM_HOURS, label: "Hours Live Classroom" },
                  { value: LIVE_READINGS, label: "Live Readings Performed" },
                  { value: CERTIFICATION_COUNT, label: "Certification Programs" },
                ].map(({ value, label }) => (
                  <div key={label} className="flex flex-col items-center">
                    <span className="cert-stat-val text-2xl font-bold"
                      style={{
                        background: "linear-gradient(135deg, #C9922A, #f8d275, #C9922A)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                      }}>
                      {value}
                    </span>
                    <span className="text-[10px] tracking-widest uppercase" style={{ color: "#7A5C0A" }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="cert-divider"><OrnamentalDivider /></div>

            {/* 15 programs */}
            <div className="my-4 cert-section">
              <p className="text-center text-[10px] font-bold tracking-[0.3em] uppercase mb-3" style={{ color: "#7A5C0A" }}>
                Mastery Demonstrated Across All {CERTIFICATION_COUNT} Consultation Programs
              </p>
              <div className="grid grid-cols-2 gap-x-10 gap-y-2">
                <div className="space-y-1.5">
                  <p className="cert-prog-header text-[9px] font-bold tracking-[0.25em] uppercase border-b pb-0.5"
                    style={{ color: "#8B6914", borderColor: "#D4AF5A" }}>
                    Astrology Programs
                  </p>
                  <ul className="space-y-1">
                    {ASTROLOGY_PROGRAMS.map((p: string) => (
                      <li key={p} className="cert-prog-item flex items-start gap-1.5 text-[11px]" style={{ color: "#3A2A0A" }}>
                        <span style={{ color: "#B8860B", flexShrink: 0, marginTop: "1px" }}>✦</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1.5">
                  <p className="cert-prog-header text-[9px] font-bold tracking-[0.25em] uppercase border-b pb-0.5"
                    style={{ color: "#8B6914", borderColor: "#D4AF5A" }}>
                    Tarot Programs
                  </p>
                  <ul className="space-y-1">
                    {TAROT_PROGRAMS.map((p: string) => (
                      <li key={p} className="cert-prog-item flex items-start gap-1.5 text-[11px]" style={{ color: "#3A2A0A" }}>
                        <span style={{ color: "#B8860B", flexShrink: 0, marginTop: "1px" }}>✦</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Specializations */}
            {specialties.length > 0 && (
              <>
                <div className="cert-divider"><OrnamentalDivider /></div>
                <div className="my-3 text-center space-y-1.5 cert-section">
                  <p className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: "#7A5C0A" }}>
                    Declared Areas of Specialization
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {specialties.map((s) => (
                      <span key={s} className="cert-specialty rounded-full px-4 py-0.5 text-[11px] font-semibold"
                        style={{ background: "linear-gradient(135deg, #FDF0CC, #FBE5A0)", color: "#6B4A08", border: "1px solid #C9A84C" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="cert-divider"><OrnamentalDivider /></div>

            {/* Signatures — no center seal in print */}
            <div className="mt-5 cert-section">
              <div className="grid grid-cols-3 gap-8 text-center items-end">
                <div className="space-y-1.5">
                  <div className="h-10" />
                  <div className="h-px w-full"
                    style={{ background: "linear-gradient(to right, transparent, #B8860B, transparent)" }} />
                  <p className="text-[9px] font-bold tracking-[0.22em] uppercase" style={{ color: "#8B6914" }}>
                    Head Master
                  </p>
                  <p className="text-xs font-semibold" style={{ color: "#2A1A00" }}>{HEAD_MASTER_NAME}</p>
                </div>

                {/* Center seal — hidden in print via CSS */}
                <div className="cert-sig-seal flex flex-col items-center gap-1">
                  <SchoolSeal className="size-20" />
                  <p className="text-[9px] tracking-[0.18em] uppercase" style={{ color: "#9A7A2A" }}>Official Seal</p>
                </div>

                <div className="space-y-1.5">
                  <div className="h-10" />
                  <div className="h-px w-full"
                    style={{ background: "linear-gradient(to right, transparent, #B8860B, transparent)" }} />
                  <p className="text-[9px] font-bold tracking-[0.22em] uppercase" style={{ color: "#8B6914" }}>
                    Date Conferred
                  </p>
                  <p className="text-xs font-semibold" style={{ color: "#2A1A00" }}>{graduatedDate}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="cert-footer mt-6 space-y-2 text-center border-t pt-4" style={{ borderColor: "#E8D08A" }}>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase" style={{ color: "#A08030" }}>
                Certificate of Authenticity &nbsp;·&nbsp; ID:&nbsp;{displayCode}
              </p>
              <p className="text-[10px]" style={{ color: "#7A6030" }}>
                Issued by {SCHOOL_NAME} via AstrologyPro &nbsp;·&nbsp; {graduatedDate}
              </p>
              {verifyUrl && (
                <div className="cert-verify-box inline-block rounded-lg px-6 py-2 space-y-0.5"
                  style={{ background: "linear-gradient(135deg, #FDF5DC, #FBF0CC)", border: "1px solid #D4AF5A" }}>
                  <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "#8B6914" }}>
                    Verify Authenticity Online
                  </p>
                  <p className="font-mono text-[10px] break-all" style={{ color: "#7A5010" }}>
                    {verifyUrl}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

        <p className="no-print text-center text-sm text-muted-foreground">
          Use the &ldquo;Download PDF&rdquo; button above, or your browser&apos;s print
          function, to save this certificate. Choose &ldquo;Save as PDF&rdquo; as the destination.
        </p>
      </div>
    </>
  );
}
