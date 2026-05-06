import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

const THRESHOLD_CENTS = 60_000; // $600 — IRS 1099-NEC trigger
const APPROACHING_CENTS = 54_000; // 90% of threshold
const TAX_KEYWORDS = ["tax", "ssn", "w8", "w9"];

/**
 * GET /api/admin/reports/1099-tracker?year=2026
 *
 * Buckets affiliates by YTD payout total against the IRS $600 threshold:
 *   - issued      ≥ $600
 *   - approaching ≥ $540 (90%)
 *   - atRisk      ≥ $600 AND Stripe.requirements has tax-related fields
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-analytics-phase-3/05-1099-tracker.md
 */
export async function GET(request: Request) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const year = Number(url.searchParams.get("year")) || new Date().getUTCFullYear();

  const admin = createAdminClient();
  const { data: rows, error } = await admin.rpc("affiliate_1099_ytd_totals", {
    p_year: year,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type Bucket = {
    affiliateAccountId: string;
    name: string;
    email: string;
    stripeAccountId: string | null;
    ytdPaidCents: number;
    ytdPaidDollars: number;
    conversionCount: number;
    firstPayoutAt: string | null;
    lastPayoutAt: string | null;
    stripeRequirementsDue: string[];
  };

  const issued: Bucket[] = [];
  const approaching: Bucket[] = [];
  const atRisk: Bucket[] = [];
  let issuedCount = 0;
  let approachingCount = 0;
  let atRiskCount = 0;
  let totalIssuedAmountCents = 0;

  for (const row of (rows ?? []) as Array<Record<string, unknown>>) {
    const ytd = Number(row.ytd_paid_cents as number);
    const stripeAccountId = (row.stripe_account_id as string | null) ?? null;

    const base: Bucket = {
      affiliateAccountId: row.affiliate_account_id as string,
      name: ((row.affiliate_email as string | null) ?? "—") + "",
      email: ((row.affiliate_email as string | null) ?? "—") + "",
      stripeAccountId,
      ytdPaidCents: ytd,
      ytdPaidDollars: ytd / 100,
      conversionCount: Number(row.conversion_count as number),
      firstPayoutAt: (row.first_payout_at as string | null) ?? null,
      lastPayoutAt: (row.last_payout_at as string | null) ?? null,
      stripeRequirementsDue: [],
    };

    if (ytd >= THRESHOLD_CENTS) {
      issued.push(base);
      issuedCount += 1;
      totalIssuedAmountCents += ytd;

      // At-risk check: query Stripe for outstanding tax requirements.
      // Only do this for issued affiliates (limited blast radius).
      if (stripeAccountId) {
        try {
          const account = await stripe.accounts.retrieve(stripeAccountId);
          const due = [
            ...(account.requirements?.currently_due ?? []),
            ...(account.requirements?.past_due ?? []),
          ];
          const taxDue = due.filter((req) =>
            TAX_KEYWORDS.some((kw) => req.toLowerCase().includes(kw)),
          );
          if (taxDue.length > 0) {
            const flagged = { ...base, stripeRequirementsDue: taxDue };
            atRisk.push(flagged);
            atRiskCount += 1;
          }
        } catch (err) {
          console.error("[1099-tracker] stripe lookup failed", {
            stripeAccountId,
            err: err instanceof Error ? err.message : String(err),
          });
        }
      }
    } else if (ytd >= APPROACHING_CENTS) {
      approaching.push(base);
      approachingCount += 1;
    }
  }

  return NextResponse.json({
    year,
    threshold: THRESHOLD_CENTS,
    issued,
    approaching,
    atRisk,
    totals: {
      issuedCount,
      approachingCount,
      atRiskCount,
      totalIssuedAmountCents,
    },
  });
}
