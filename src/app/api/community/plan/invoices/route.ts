import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

/**
 * GET /api/community/plan/invoices
 *
 * Returns the last 12 Stripe invoices for the authenticated PM member.
 * Returns an empty array if no stripe_customer_id is on record.
 *
 * Response shape:
 * {
 *   invoices: Array<{
 *     id, number, amount_due, amount_paid, currency, status,
 *     created, invoice_pdf, hosted_invoice_url, period_start, period_end
 *   }>
 * }
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: member, error: memberError } = await admin
      .from("community_members")
      .select("id, stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: "No community membership found" },
        { status: 404 }
      );
    }

    if (!member.stripe_customer_id) {
      return NextResponse.json({ invoices: [] });
    }

    const stripeInvoices = await stripe.invoices.list({
      customer: member.stripe_customer_id,
      limit: 12,
    });

    const invoices = stripeInvoices.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      amount_due: inv.amount_due,
      amount_paid: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      created: inv.created,
      invoice_pdf: inv.invoice_pdf,
      hosted_invoice_url: inv.hosted_invoice_url,
      period_start: inv.lines.data[0]?.period?.start ?? null,
      period_end: inv.lines.data[0]?.period?.end ?? null,
    }));

    return NextResponse.json({ invoices });
  } catch (err) {
    console.error("[community/plan/invoices] GET error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve invoices" },
      { status: 500 }
    );
  }
}
