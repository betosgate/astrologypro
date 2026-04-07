import type { Metadata } from "next";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { CheckInForm } from "@/components/public/check-in-form";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DivinerRow {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
}

interface LiveSessionRow {
  id: string;
  title: string | null;
  check_in_form_title: string | null;
  check_in_form_subtitle: string | null;
  check_in_enabled: boolean;
}

interface PageProps {
  params: Promise<{ username: string }>;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("display_name")
    .eq("username", username)
    .maybeSingle();

  const name = diviner?.display_name ?? username;
  return {
    title: `Check In with ${name} | AstrologyPro`,
    description: `Check in to ${name}'s live session and get personalized insights.`,
    robots: { index: false, follow: false },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CheckInPage({ params }: PageProps) {
  const { username } = await params;
  const admin = createAdminClient();

  // Fetch diviner
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, display_name, username, avatar_url")
    .eq("username", username)
    .maybeSingle<DivinerRow>();

  if (!diviner) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ background: "#06080f" }}
      >
        <div className="text-center">
          <p className="text-lg font-medium" style={{ color: "#f5f0e8" }}>
            Diviner not found.
          </p>
          <p className="mt-2 text-sm" style={{ color: "rgba(184,188,208,0.6)" }}>
            Please check the URL and try again.
          </p>
        </div>
      </div>
    );
  }

  // Find active live session
  const { data: session } = await admin
    .from("live_sessions")
    .select("id, title, check_in_form_title, check_in_form_subtitle, check_in_enabled")
    .eq("diviner_id", diviner.id)
    .eq("status", "live")
    .maybeSingle<LiveSessionRow>();

  const hasActiveSession = session !== null && session.check_in_enabled;

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-12"
      style={{ background: "#06080f" }}
    >
      {/* Card */}
      <div
        className="w-full max-w-md rounded-2xl border px-6 py-8"
        style={{
          background: "rgba(255,255,255,0.03)",
          borderColor: "rgba(255,255,255,0.07)",
        }}
      >
        {/* Diviner branding */}
        <div className="mb-6 flex flex-col items-center gap-3">
          {diviner.avatar_url ? (
            <Image
              src={diviner.avatar_url}
              alt={diviner.display_name}
              width={64}
              height={64}
              className="rounded-full object-cover ring-2"
              style={{ ringColor: "#c9a84c" } as React.CSSProperties}
            />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold"
              style={{ background: "rgba(201,168,76,0.15)", color: "#c9a84c" }}
              aria-hidden="true"
            >
              {diviner.display_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="text-center">
            <h1 className="text-base font-semibold" style={{ color: "#f5f0e8" }}>
              {diviner.display_name}
            </h1>
            {session?.title && (
              <p className="mt-0.5 text-xs font-medium" style={{ color: "#c9a84c" }}>
                {session.title}
              </p>
            )}
          </div>
        </div>

        {/* Form or no-session message */}
        {hasActiveSession && session ? (
          <CheckInForm
            divinerId={diviner.id}
            divinerUsername={diviner.username}
            sessionTitle={session.title ?? undefined}
            formTitle={session.check_in_form_title ?? "Get Your Free Birth Chart Reading"}
            formSubtitle={session.check_in_form_subtitle ?? "Join live and get personalized insights"}
          />
        ) : (
          <div
            className="rounded-lg border px-5 py-6 text-center"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}
            role="status"
          >
            <p className="text-base font-medium" style={{ color: "#f5f0e8" }}>
              No active session
            </p>
            <p className="mt-2 text-sm" style={{ color: "rgba(184,188,208,0.6)" }}>
              {diviner.display_name} is not currently live. Check back soon!
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs" style={{ color: "rgba(184,188,208,0.35)" }}>
        Powered by AstrologyPro
      </p>
    </div>
  );
}
