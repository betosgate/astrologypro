import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

/**
 * POST /api/stripe/connect/fix-payouts
 *
 * Diagnostic + fix endpoint for connected account payout issues.
 * Checks whether the connected account has a bank account attached
 * and the payout schedule is set correctly. In test mode, attaches
 * a Stripe test bank token if missing.
 *
 * Also allows triggering a manual test payout.
 *
 * Body (optional): { action?: "diagnose" | "fix" | "payout" }
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
    };
    const action = body.action ?? "diagnose";

    // Retrieve full account details
    const account = await stripe.accounts.retrieve(accountId);

    // Check if test mode
    const isTestMode = (process.env.STRIPE_SECRET_KEY ?? "").startsWith(
      "sk_test_"
    );

    // Check external accounts (bank accounts)
    const externalAccounts = await stripe.accounts.listExternalAccounts(
      accountId,
      { limit: 10 }
    );
    const hasBankAccount = externalAccounts.data.some(
      (ea) => ea.object === "bank_account"
    );

    // Check balance
    const balance = await stripe.balance.retrieve(
      {},
      { stripeAccount: accountId }
    );
    const availableUsd = balance.available.find((b) => b.currency === "usd");
    const pendingUsd = balance.pending.find((b) => b.currency === "usd");

    // Check recent payouts
    const payouts = await stripe.payouts.list(
      { limit: 5 },
      { stripeAccount: accountId }
    );

    const diagnosis = {
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
      requirements: {
        currentlyDue: account.requirements?.currently_due ?? [],
        eventuallyDue: account.requirements?.eventually_due ?? [],
        disabledReason: account.requirements?.disabled_reason ?? null,
      },
      issues: [] as string[],
      fixes: [] as string[],
    };

    // Diagnose issues
    if (!hasBankAccount) {
      diagnosis.issues.push(
        "No bank account attached — payouts cannot be created"
      );
    }
    if (account.settings?.payouts?.schedule?.interval === "manual") {
      diagnosis.issues.push(
        "Payout schedule is set to MANUAL — payouts will not auto-create"
      );
    }
    if (!account.payouts_enabled) {
      diagnosis.issues.push("Payouts are not enabled on this account");
    }
    if (
      (pendingUsd?.amount ?? 0) > 0 &&
      (availableUsd?.amount ?? 0) === 0 &&
      isTestMode
    ) {
      diagnosis.issues.push(
        "All funds are pending (test mode does not auto-mature funds)"
      );
    }
    if (diagnosis.issues.length === 0) {
      diagnosis.issues.push("No issues found — payouts should work normally");
    }

    // Fix mode — attach test bank and set payout schedule
    if (action === "fix") {
      if (!hasBankAccount && isTestMode) {
        // Attach Stripe's test bank account token
        await stripe.accounts.createExternalAccount(accountId, {
          external_account: "btok_us",
        });
        diagnosis.fixes.push("Attached test bank account (btok_us)");
      }

      // Ensure payout schedule is daily with minimum delay
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
        diagnosis.fixes.push(
          "Updated payout schedule to daily with minimum delay"
        );
      }

      if (diagnosis.fixes.length === 0) {
        diagnosis.fixes.push("No fixes needed");
      }
    }

    // Payout mode — trigger a manual payout of available balance
    if (action === "payout") {
      const availableAmount = availableUsd?.amount ?? 0;

      if (availableAmount <= 0) {
        diagnosis.fixes.push(
          `No available funds to pay out (available: $${(availableAmount / 100).toFixed(2)}, pending: $${((pendingUsd?.amount ?? 0) / 100).toFixed(2)})`
        );

        // In test mode, try to move pending to available first
        if (isTestMode && (pendingUsd?.amount ?? 0) > 0) {
          diagnosis.fixes.push(
            "In test mode, pending funds don't auto-mature. Use Stripe Dashboard → Developers → Clock to advance time, or use stripe CLI: stripe testclock advance"
          );
        }
      } else {
        const payout = await stripe.payouts.create(
          {
            amount: availableAmount,
            currency: "usd",
          },
          { stripeAccount: accountId }
        );
        diagnosis.fixes.push(
          `Payout created: ${payout.id} for $${(payout.amount / 100).toFixed(2)} — status: ${payout.status}`
        );
      }
    }

    return NextResponse.json(diagnosis);
  } catch (error) {
    console.error("[stripe/connect/fix-payouts] error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to diagnose payouts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
