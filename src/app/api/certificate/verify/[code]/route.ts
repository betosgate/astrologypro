import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/certificate/verify/[code]
 * Public endpoint — no auth required.
 * Looks up a trainee by certificate_code and returns verification status.
 *
 * 200 { valid: true, name, program, graduated_at, certificate_code }
 * 200 { valid: false }
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code || typeof code !== "string" || code.length > 64) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  const admin = createAdminClient();

  const { data: trainee } = await admin
    .from("trainees")
    .select("name, graduated_at, certificate_code")
    .eq("certificate_code", code.toUpperCase())
    .maybeSingle();

  if (!trainee || !trainee.graduated_at) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  return NextResponse.json(
    {
      valid: true,
      name: trainee.name ?? "Trainee",
      program: "AstrologyPro Diviner Training Program",
      graduated_at: trainee.graduated_at,
      certificate_code: trainee.certificate_code,
    },
    { status: 200 }
  );
}
