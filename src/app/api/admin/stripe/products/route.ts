import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET  /api/admin/stripe/products?q=...  — search existing Stripe products
 * POST /api/admin/stripe/products        — create a new Stripe product
 */

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  const products = await stripe.products.list({
    limit: 20,
    active: true,
    ...(q ? {} : {}),
  });

  // Client-side filter by name since Stripe doesn't support name search
  const filtered = q
    ? products.data.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
    : products.data;

  return NextResponse.json({
    products: filtered.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
    })),
  });
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

  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 422 });

  const description = typeof body.description === "string" ? body.description.trim() || undefined : undefined;

  try {
    const product = await stripe.products.create({ name, description });
    return NextResponse.json({
      product: { id: product.id, name: product.name, description: product.description },
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Stripe error" },
      { status: 500 },
    );
  }
}
