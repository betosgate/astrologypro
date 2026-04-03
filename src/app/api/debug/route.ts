import { NextResponse } from "next/server";

export async function GET() {
  const sk = process.env.STRIPE_SECRET_KEY ?? "";
  return NextResponse.json({
    sk_prefix: sk.slice(0, 12) || "MISSING",
    sk_length: sk.length,
    tarot_setup: process.env.STRIPE_PRICE_TAROT_SETUP || "MISSING",
    both_setup: process.env.STRIPE_PRICE_BOTH_SETUP || "MISSING",
    both_monthly: process.env.STRIPE_PRICE_BOTH_MONTHLY || "MISSING",
  });
}
