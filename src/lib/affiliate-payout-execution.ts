import type { SupabaseClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe/client";
import { syncAffiliateStripeStatus } from "@/lib/affiliate-stripe-sync";

export interface ExecutePayoutsResult {
  scanned: number;
  affiliatesProcessed: number;
  payoutsCreated: number;
  totalNetCents: number;
  dryRun: boolean;
  blocked: { affiliateAccountId: string; reason: string }[];
  failed: { payoutId: string; reason: string }[];
}

interface RipeRow {
  id: string;
  commission_amount_cents: number | null;
  affiliate_id: string | null;
  affiliate_account_id: string | null;
}

interface AccountRow {
  id: string;
  stripe_account_id: string | null;
  stripe_payouts_enabled: boolean | null;
  balance_offset_cents: number | null;
}

interface Group {
  affiliateAccountId: string;
  stripeAccountId: string | null;
  payoutsEnabled: boolean;
  balanceOffsetCents: number;
  conversions: { id: string; cents: number }[];
}

/**
 * Promote ripe conversions, group by affiliate, write payout +
 * payout_items rows, attempt Stripe transfer (or dry-run), and
 * reconcile state.
 *
 * Idempotent. Safe to call from cron (no-args) or admin (per-affiliate).
 *
 * Honors `platform_settings.affiliate_payouts_enabled`:
 *   - FALSE: writes payouts with status='dry_run', skips Stripe call,
 *            reverts conversion linkage so the next real run finds them
 *   - TRUE:  writes payouts with status='pending', then either flips
 *            to 'completed' (transfer succeeds) or 'failed' (transfer fails)
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-payouts-phase-2/04-payout-trigger-and-execution.md
 */
export async function executeAffiliatePayouts(input: {
  admin: SupabaseClient;
  /**
   * Optional filter: when set, only process this one affiliate
   * (admin manual trigger). When omitted, process all affiliates with
   * ripe conversions (cron mode).
   */
  onlyAffiliateAccountId?: string;
  triggerSource?: "cron" | "admin_manual" | "admin_retry";
  triggeredBy?: string | null;
  /** Limit affiliates processed in one call (default 25). */
  affiliateBatchSize?: number;
}): Promise<ExecutePayoutsResult> {
  const {
    admin,
    onlyAffiliateAccountId,
    triggerSource = "cron",
    triggeredBy = null,
    affiliateBatchSize = 25,
  } = input;

  // ─── Read kill-switch ──────────────────────────────────────────────
  const { data: settings } = await admin
    .from("platform_settings")
    .select("affiliate_payouts_enabled")
    .limit(1)
    .single();
  const dryRun = !((settings as Record<string, unknown> | null)
    ?.affiliate_payouts_enabled as boolean | null);

  const result: ExecutePayoutsResult = {
    scanned: 0,
    affiliatesProcessed: 0,
    payoutsCreated: 0,
    totalNetCents: 0,
    dryRun,
    blocked: [],
    failed: [],
  };

  const nowIso = new Date().toISOString();

  // ─── Step 1: promote ripe conversions in-place ─────────────────────
  await admin
    .from("campaign_conversions")
    .update({ payout_status: "ripe" })
    .eq("payout_status", "unpaid")
    .lte("ripeness_at", nowIso)
    .is("reversed_at", null);

  // ─── Step 2: find affiliates with ripe conversions ─────────────────
  let ripeQuery = admin
    .from("campaign_conversions")
    .select(
      "id, commission_amount_cents, affiliate_id, affiliate_account_id",
    )
    .eq("payout_status", "ripe")
    .is("reversed_at", null)
    .is("payout_id", null);

  if (onlyAffiliateAccountId) {
    ripeQuery = ripeQuery.eq("affiliate_account_id", onlyAffiliateAccountId);
  }

  const { data: ripeRowsRaw, error: ripeErr } = await ripeQuery.limit(2000);
  if (ripeErr) throw ripeErr;
  const ripeRows = (ripeRowsRaw ?? []) as RipeRow[];
  if (ripeRows.length === 0) return result;

  result.scanned = ripeRows.length;

  // Resolve affiliate_account_id for any rows missing it (pre-Phase-2 inserts)
  const accountIdsSet = new Set<string>();
  const conversionsNeedingResolve: RipeRow[] = [];
  for (const r of ripeRows) {
    if (r.affiliate_account_id) {
      accountIdsSet.add(r.affiliate_account_id);
    } else if (r.affiliate_id) {
      conversionsNeedingResolve.push(r);
    }
  }
  if (conversionsNeedingResolve.length > 0) {
    const { data: junctions } = await admin
      .from("diviner_affiliates")
      .select("id, affiliate_account_id")
      .in(
        "id",
        conversionsNeedingResolve.map((c) => c.affiliate_id as string),
      );
    const junctionMap = new Map<string, string>();
    for (const j of (junctions ?? []) as Array<{
      id: string;
      affiliate_account_id: string | null;
    }>) {
      if (j.affiliate_account_id) {
        junctionMap.set(j.id, j.affiliate_account_id);
        accountIdsSet.add(j.affiliate_account_id);
      }
    }
    for (const r of conversionsNeedingResolve) {
      if (r.affiliate_id && junctionMap.has(r.affiliate_id)) {
        r.affiliate_account_id = junctionMap.get(r.affiliate_id) ?? null;
      }
    }
  }

  if (accountIdsSet.size === 0) return result;

  // Read affiliate accounts in one batch
  const { data: accountsRaw } = await admin
    .from("affiliate_accounts")
    .select(
      "id, stripe_account_id, stripe_payouts_enabled, balance_offset_cents",
    )
    .in("id", Array.from(accountIdsSet));
  const accounts = (accountsRaw ?? []) as AccountRow[];
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  // ─── Step 3: group by affiliate_account_id ──────────────────────────
  const groups = new Map<string, Group>();
  for (const r of ripeRows) {
    const accId = r.affiliate_account_id;
    if (!accId) continue;
    const acc = accountMap.get(accId);
    if (!acc) continue;
    const cents = Number(r.commission_amount_cents ?? 0);
    const existing = groups.get(accId);
    if (existing) {
      existing.conversions.push({ id: r.id, cents });
    } else {
      groups.set(accId, {
        affiliateAccountId: accId,
        stripeAccountId: acc.stripe_account_id ?? null,
        payoutsEnabled: !!acc.stripe_payouts_enabled,
        balanceOffsetCents: Number(acc.balance_offset_cents ?? 0),
        conversions: [{ id: r.id, cents }],
      });
    }
  }

  const affiliatesToProcess = Array.from(groups.values()).slice(
    0,
    affiliateBatchSize,
  );

  // ─── Step 4: process each affiliate ─────────────────────────────────
  for (const g of affiliatesToProcess) {
    result.affiliatesProcessed += 1;

    if (!g.stripeAccountId || !g.payoutsEnabled) {
      result.blocked.push({
        affiliateAccountId: g.affiliateAccountId,
        reason: !g.stripeAccountId
          ? "no_stripe_account"
          : "stripe_payouts_disabled",
      });
      if (g.stripeAccountId) {
        try {
          await syncAffiliateStripeStatus({
            admin,
            affiliateAccountId: g.affiliateAccountId,
            knownStripeAccountId: g.stripeAccountId,
          });
        } catch {
          /* swallow; sync is best-effort */
        }
      }
      continue;
    }

    const ripeTotal = g.conversions.reduce((s, c) => s + c.cents, 0);
    const offsetApplied = Math.min(ripeTotal, g.balanceOffsetCents);
    const net = ripeTotal - offsetApplied;

    const payoutRowId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const idempotencyKey = `affiliate-payout-${payoutRowId}`;
    const initialStatus = dryRun ? "dry_run" : "pending";

    const { error: insErr } = await admin.from("affiliate_payouts").insert({
      id: payoutRowId,
      affiliate_account_id: g.affiliateAccountId,
      stripe_account_id: g.stripeAccountId,
      ripe_total_cents: ripeTotal,
      offset_applied_cents: offsetApplied,
      net_transferred_cents: net,
      stripe_idempotency_key: idempotencyKey,
      status: initialStatus,
      trigger_source: triggerSource,
      triggered_by: triggeredBy,
    });
    if (insErr) {
      result.failed.push({
        payoutId: payoutRowId,
        reason: insErr.message,
      });
      continue;
    }

    const itemRows = distributeOffset(g.conversions, offsetApplied);
    const { error: itemErr } = await admin
      .from("affiliate_payout_items")
      .insert(
        itemRows.map((it) => ({
          payout_id: payoutRowId,
          conversion_id: it.conversionId,
          applied_amount_cents: it.applied,
          offset_applied_cents: it.offset,
        })),
      );
    if (itemErr) {
      await admin
        .from("affiliate_payouts")
        .update({
          status: "failed",
          failure_reason: `items_insert: ${itemErr.message}`,
        })
        .eq("id", payoutRowId);
      result.failed.push({
        payoutId: payoutRowId,
        reason: itemErr.message,
      });
      continue;
    }

    // Lock conversions into 'paying' to prevent parallel double-claim
    await admin
      .from("campaign_conversions")
      .update({ payout_status: "paying", payout_id: payoutRowId })
      .in(
        "id",
        g.conversions.map((c) => c.id),
      );

    if (dryRun) {
      // Revert conversion linkage so the next real run finds them again
      await admin
        .from("campaign_conversions")
        .update({ payout_status: "ripe", payout_id: null })
        .in(
          "id",
          g.conversions.map((c) => c.id),
        );
      result.payoutsCreated += 1;
      result.totalNetCents += net;
      continue;
    }

    if (net <= 0) {
      // Offset fully consumed the ripe total — no transfer, but record paid
      // for audit and decrement the offset.
      const completedAt = new Date().toISOString();
      await admin
        .from("affiliate_payouts")
        .update({
          status: "completed",
          stripe_transfer_id: null,
          transferred_at: completedAt,
          notes: "offset_fully_consumed",
        })
        .eq("id", payoutRowId);
      // Per-row updates: each conversion gets its own paid_amount_cents
      for (const it of itemRows) {
        await admin
          .from("campaign_conversions")
          .update({
            payout_status: "offset_applied",
            paid_at: completedAt,
            paid_amount_cents: it.applied,
          })
          .eq("id", it.conversionId);
      }
      await admin
        .from("affiliate_accounts")
        .update({
          balance_offset_cents: g.balanceOffsetCents - offsetApplied,
          balance_offset_last_changed_at: completedAt,
        })
        .eq("id", g.affiliateAccountId);

      // Phase 3 prep (Task 10): stamp first_payout_at on first success
      try {
        await admin
          .from("affiliate_accounts")
          .update({ first_payout_at: completedAt })
          .eq("id", g.affiliateAccountId)
          .is("first_payout_at", null);
      } catch (err) {
        console.error(
          "[executeAffiliatePayouts] first_payout_at stamp failed",
          err,
        );
      }

      // Task 09 hook: notify the affiliate
      try {
        const { notifyAffiliatePayoutCompleted } = await import(
          "@/lib/affiliate-notifications"
        );
        await notifyAffiliatePayoutCompleted({
          admin,
          affiliateAccountId: g.affiliateAccountId,
          netCents: 0,
          payoutId: payoutRowId,
          stripeTransferId: null,
        });
      } catch (err) {
        console.error(
          "[executeAffiliatePayouts] notify offset-consumed failed",
          err,
        );
      }

      result.payoutsCreated += 1;
      continue;
    }

    // Real transfer
    try {
      const transfer = await stripe.transfers.create(
        {
          amount: net,
          currency: "usd",
          destination: g.stripeAccountId,
          metadata: {
            payout_id: payoutRowId,
            affiliate_account_id: g.affiliateAccountId,
            ripe_total_cents: String(ripeTotal),
            offset_applied_cents: String(offsetApplied),
          },
        },
        { idempotencyKey },
      );

      const transferIso = new Date(transfer.created * 1000).toISOString();
      await admin
        .from("affiliate_payouts")
        .update({
          status: "completed",
          stripe_transfer_id: transfer.id,
          transferred_at: transferIso,
        })
        .eq("id", payoutRowId);

      // Per-row updates so each conversion gets its proportional
      // paid_amount_cents (offset distribution lands here).
      for (const it of itemRows) {
        await admin
          .from("campaign_conversions")
          .update({
            payout_status: "paid",
            paid_at: transferIso,
            paid_amount_cents: it.applied,
          })
          .eq("id", it.conversionId);
      }

      if (offsetApplied > 0) {
        await admin
          .from("affiliate_accounts")
          .update({
            balance_offset_cents: g.balanceOffsetCents - offsetApplied,
            balance_offset_last_changed_at: transferIso,
          })
          .eq("id", g.affiliateAccountId);
      }

      // Phase 3 prep (Task 10): stamp first_payout_at on first success
      try {
        await admin
          .from("affiliate_accounts")
          .update({ first_payout_at: transferIso })
          .eq("id", g.affiliateAccountId)
          .is("first_payout_at", null);
      } catch (err) {
        console.error(
          "[executeAffiliatePayouts] first_payout_at stamp failed",
          err,
        );
      }

      // Task 09 hook: notify affiliate of successful payout
      try {
        const { notifyAffiliatePayoutCompleted } = await import(
          "@/lib/affiliate-notifications"
        );
        await notifyAffiliatePayoutCompleted({
          admin,
          affiliateAccountId: g.affiliateAccountId,
          netCents: net,
          payoutId: payoutRowId,
          stripeTransferId: transfer.id,
        });
      } catch (err) {
        console.error(
          "[executeAffiliatePayouts] notify completed failed",
          err,
        );
      }

      result.payoutsCreated += 1;
      result.totalNetCents += net;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await admin
        .from("affiliate_payouts")
        .update({
          status: "failed",
          failure_reason: message.slice(0, 500),
        })
        .eq("id", payoutRowId);
      // Revert conversions to ripe so the next tick retries
      await admin
        .from("campaign_conversions")
        .update({ payout_status: "ripe", payout_id: null })
        .in(
          "id",
          g.conversions.map((c) => c.id),
        );
      result.failed.push({ payoutId: payoutRowId, reason: message });

      // Task 09 hook: notify affiliate of failed payout
      try {
        const { notifyAffiliatePayoutFailed } = await import(
          "@/lib/affiliate-notifications"
        );
        await notifyAffiliatePayoutFailed({
          admin,
          affiliateAccountId: g.affiliateAccountId,
          netCents: net,
          payoutId: payoutRowId,
          failureReason: message,
        });
      } catch (notifyErr) {
        console.error(
          "[executeAffiliatePayouts] notify failed-payout failed",
          notifyErr,
        );
      }
    }
  }

  return result;
}

/**
 * Pure helper — proportional offset distribution across line items.
 * Floors each share, then redistributes the rounding remainder to the
 * largest conversions first (so cents always balance).
 */
function distributeOffset(
  conversions: { id: string; cents: number }[],
  totalOffset: number,
): { conversionId: string; applied: number; offset: number }[] {
  if (totalOffset <= 0 || conversions.length === 0) {
    return conversions.map((c) => ({
      conversionId: c.id,
      applied: c.cents,
      offset: 0,
    }));
  }

  const ripeTotal = conversions.reduce((s, c) => s + c.cents, 0);
  if (ripeTotal <= 0) {
    return conversions.map((c) => ({
      conversionId: c.id,
      applied: 0,
      offset: 0,
    }));
  }

  const provisional = conversions.map((c) => {
    const off = Math.floor((c.cents * totalOffset) / ripeTotal);
    return { conversionId: c.id, cents: c.cents, offset: off };
  });

  const distributed = provisional.reduce((s, p) => s + p.offset, 0);
  let remainder = totalOffset - distributed;
  const sorted = [...provisional].sort((a, b) => b.cents - a.cents);
  for (let i = 0; remainder > 0 && i < sorted.length; i++) {
    const headroom = sorted[i].cents - sorted[i].offset;
    const take = Math.min(headroom, remainder);
    sorted[i].offset += take;
    remainder -= take;
  }

  return provisional.map((p) => ({
    conversionId: p.conversionId,
    applied: p.cents - p.offset,
    offset: p.offset,
  }));
}
