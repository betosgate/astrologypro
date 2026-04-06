import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const LAMBDA_URL = process.env.ASTRO_PLANET_RETURN_URL ?? "https://a5p6f3zd26utex5rxmbu7vromu0jsszy.lambda-url.us-east-1.on.aws/";

const ALLOWED_STEPS = [
  "jupiter_return",
  "saturn_return",
  "mars_return",
  "uranus_return",
  "astrology_report_weekly",
  "astrology_report_monthly",
];

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { steps } = body as { steps: string };

  if (!steps || !ALLOWED_STEPS.includes(steps)) {
    return NextResponse.json({ error: "Invalid steps value" }, { status: 400 });
  }

  try {
    const res = await fetch(LAMBDA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Lambda error ${res.status}: ${text}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Planet return error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
