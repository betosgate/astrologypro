import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

/**
 * POST /api/stripe/connect/fix-payouts
 *
 * Diagnostic + fix endpoint for connected account payout issues.
 *
 * Actions:
 *   "diagnose" — full account diagnosis (default)
 *   "fix"      — attach test bank + set daily payouts
 *   "topup"    — add test funds as available balance (test mode only)
 *   "payout"   — trigger a manual payout of available balance
 *
 * Body: { action?: "diagnose" | "fix" | "topup" | "payout", amount?: number }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: diviner } = await admin
      .from("diviners")
      .select("id, stripe_account_id")
      .eq("user_id", user.id)
      .single();

    if (!diviner?.stripe_account_id) {
      return NextResponse.json(
        { error: "No Stripe account connected" },
        { status: 404 }
      );
    }

    const accountId = diviner.stripe_account_id as string;
    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      amount?: number;
    };
    const action = body.action ?? "diagnose";

    const isTestMode = (process.env.STRIPE_SECRET_KEY ?? "").startsWith(
      "sk_test_"
    );

    // ─── DIAGNOSE ──────────────────────────────────────────────
    if (action === "diagnose") {
      const account = await stripe.accounts.retrieve(accountId);
      const externalAccounts = await stripe.accounts.listExternalAccounts(
        accountId,
        { limit: 10 }
      );
      const balance = await stripe.balance.retrieve(
        {},
        { stripeAccount: accountId }
      );
      const payouts = await stripe.payouts.list(
        { limit: 5 },
        { stripeAccount: accountId }
      );

      const availableUsd = balance.available.find(
        (b) => b.currency === "usd"
      );
      const pendingUsd = balance.pending.find((b) => b.currency === "usd");
      const hasBankAccount = externalAccounts.data.some(
        (ea) => ea.object === "bank_account"
      );

      const issues: string[] = [];
      if (!hasBankAccount) {
        issues.push(
          'No bank account attached — run with action:"fix" to attach one'
        );
      }
      if (account.settings?.payouts?.schedule?.interval === "manual") {
        issues.push(
          'Payout schedule is MANUAL — run with action:"fix" to set daily'
        );
      }
      if (!account.payouts_enabled) {
        issues.push("Payouts are not enabled on this account");
      }
      if (
        (pendingUsd?.amount ?? 0) > 0 &&
        (availableUsd?.amount ?? 0) === 0 &&
        isTestMode
      ) {
        issues.push(
          'All funds are pending — test mode does not auto-mature. Run with action:"topup" to add available test funds'
        );
      }
      if (issues.length === 0) {
        issues.push("No issues found — payouts should work normally");
      }

      return NextResponse.json({
        action: "diagnose",
        accountId,
        isTestMode,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        payoutSchedule: account.settings?.payouts?.schedule ?? null,
        hasBankAccount,
        externalAccounts: externalAccounts.data.map((ea) => ({
          id: ea.id,
          object: ea.object,
          ...(ea.object === "bank_account"
            ? {
                bankName: (ea as { bank_name?: string }).bank_name,
                last4: (ea as { last4?: string }).last4,
                status: (ea as { status?: string }).status,
              }
            : {}),
        })),
        balance: {
          available: (availableUsd?.amount ?? 0) / 100,
          pending: (pendingUsd?.amount ?? 0) / 100,
        },
        recentPayouts: payouts.data.map((p) => ({
          id: p.id,
          amount: p.amount / 100,
          status: p.status,
          arrivalDate: new Date(p.arrival_date * 1000).toISOString(),
        })),
        issues,
      });
    }

    // ─── FIX ──────────────────────────────────────────────────
    if (action === "fix") {
      const account = await stripe.accounts.retrieve(accountId);
      const externalAccounts = await stripe.accounts.listExternalAccounts(
        accountId,
        { limit: 10 }
      );
      const hasBankAccount = externalAccounts.data.some(
        (ea) => ea.object === "bank_account"
      );
      const fixes: string[] = [];

      if (!hasBankAccount && isTestMode) {
        await stripe.accounts.createExternalAccount(accountId, {
          external_account: "btok_us",
        });
        fixes.push("Attached test bank account (btok_us)");
      }

      if (account.settings?.payouts?.schedule?.interval === "manual") {
        await stripe.accounts.update(accountId, {
          settings: {
            payouts: {
              schedule: {
                interval: "daily",
                delay_days: "minimum",
              },
            },
          },
        });
        fixes.push("Updated payout schedule to daily with minimum delay");
      }

      if (fixes.length === 0) {
        fixes.push(
          "No fixes needed — bank account exists and schedule is daily"
        );
      }

      return NextResponse.json({ action: "fix", fixes });
    }

    // ─── TOPUP ────────────────────────────────────────────────
    // In test mode, create a direct charge on the connected account
    // using a test card. This lands as available balance immediately.
    if (action === "topup") {
      if (!isTestMode) {
        return NextResponse.json(
          { error: "Topup test funds is only available in test mode" },
          { status: 400 }
        );
      }

      const topupAmount = Math.round((body.amount ?? 100) * 100); // default $100

      try {
        // Create a test charge directly on the connected account
        // using Stripe's test token — this settles immediately as available
        const charge = await stripe.charges.create(
          {
            amount: topupAmount,
            currency: "usd",
            source: "tok_bypassPending", // Stripe test token that bypasses pending
            description: "Test topup to make funds available",
          },
          { stripeAccount: accountId }
        );

        // Check balance after
        const balance = await stripe.balance.retrieve(
          {},
          { stripeAccount: accountId }
        );
        const availableUsd = balance.available.find(
          (b) => b.currency === "usd"
        );

        return NextResponse.json({
          action: "topup",
          success: true,
          chargeId: charge.id,
          amount: topupAmount / 100,
          newAvailableBalance: (availableUsd?.amount ?? 0) / 100,
          message: `Added $${(topupAmount / 100).toFixed(2)} as available balance. Now run action:"payout" to trigger a payout.`,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Topup failed";
        return NextResponse.json(
          {
            action: "topup",
            success: false,
            error: msg,
            hint: "Try using Stripe CLI instead: stripe charges create --amount 10000 --currency usd --source tok_bypassPending --stripe-account=" +
              accountId,
          },
          { status: 400 }
        );
      }
    }

    // ─── PAYOUT ───────────────────────────────────────────────
    if (action === "payout") {
      const balance = await stripe.balance.retrieve(
        {},
        { stripeAccount: accountId }
      );
      const availableUsd = balance.available.find(
        (b) => b.currency === "usd"
      );
      const pendingUsd = balance.pending.find((b) => b.currency === "usd");
      const availableAmount = availableUsd?.amount ?? 0;

      if (availableAmount <= 0) {
        return NextResponse.json({
          action: "payout",
          success: false,
          balance: {
            available: 0,
            pending: (pendingUsd?.amount ?? 0) / 100,
          },
          message:
            'No available funds to pay out. In test mode, first run action:"topup" to add available test funds, then run action:"payout".',
        });
      }

      try {
        const payout = await stripe.payouts.create(
          {
            amount: availableAmount,
            currency: "usd",
          },
          { stripeAccount: accountId }
        );

        return NextResponse.json({
          action: "payout",
          success: true,
          payoutId: payout.id,
          amount: payout.amount / 100,
          status: payout.status,
          arrivalDate: new Date(
            payout.arrival_date * 1000
          ).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          message: `Payout of $${(payout.amount / 100).toFixed(2)} created — status: ${payout.status}`,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Payout failed";
        return NextResponse.json(
          { action: "payout", success: false, error: msg },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: `Unknown action: "${action}". Use: diagnose, fix, topup, or payout`,
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("[stripe/connect/fix-payouts] error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
