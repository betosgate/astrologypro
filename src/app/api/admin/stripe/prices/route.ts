import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminUser } from "@/lib/admin-auth";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET  /api/admin/stripe/prices?product_id=...  — list prices for a Stripe product
 * POST /api/admin/stripe/prices                 — create a new Stripe price
 */

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const productId = req.nextUrl.searchParams.get("product_id")?.trim();
  if (!productId) return NextResponse.json({ error: "product_id is required" }, { status: 422 });

  try {
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
      limit: 50,
    });

    return NextResponse.json({
      prices: prices.data.map((p) => ({
        id: p.id,
        nickname: p.nickname,
        unit_amount: p.unit_amount,
        currency: p.currency.toUpperCase(),
        type: p.type,
        recurring: p.recurring ? { interval: p.recurring.interval, interval_count: p.recurring.interval_count } : null,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Stripe error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const productId = String(body.product_id ?? "").trim();
  const nickname = String(body.nickname ?? "").trim();
  const currency = String(body.currency ?? "USD").trim().toLowerCase();
  const amountRaw = body.amount;

  if (!productId) return NextResponse.json({ error: "product_id is required" }, { status: 422 });
  if (!nickname) return NextResponse.json({ error: "nickname (price name) is required" }, { status: 422 });

  const amount = typeof amountRaw === "number" ? amountRaw : Number(amountRaw);
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: "amount must be a non-negative number" }, { status: 422 });
  }

  // Stripe expects amount in smallest currency unit (cents)
  const unitAmount = Math.round(amount * 100);

  // Determine if this is recurring
  const recurring = body.recurring as { interval?: string; interval_count?: number } | undefined;

  try {
    const priceParams: Stripe.PriceCreateParams = {
      product: productId,
      nickname,
      currency,
      unit_amount: unitAmount,
      ...(recurring?.interval
        ? { recurring: { interval: recurring.interval as Stripe.PriceCreateParams.Recurring["interval"], interval_count: recurring.interval_count ?? 1 } }
        : {}),
    };

    const price = await stripe.prices.create(priceParams);

    return NextResponse.json({
      price: {
        id: price.id,
        nickname: price.nickname,
        unit_amount: price.unit_amount,
        currency: price.currency.toUpperCase(),
        type: price.type,
        recurring: price.recurring ? { interval: price.recurring.interval, interval_count: price.recurring.interval_count } : null,
      },
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Stripe error" },
      { status: 500 },
    );
  }
}
