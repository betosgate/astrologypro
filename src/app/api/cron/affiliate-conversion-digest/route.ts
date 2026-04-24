// GET /api/cron/affiliate-conversion-digest
//
// Daily cron. For each affiliate with at least one new `campaign_conversions`
// row in the past 24h (not reversed), sends a single digest email summing
// the day's earnings. In-app notifications stay individual (fired at
// credit time); this cron only emits the consolidated email.
//
// Scheduled at 00:00 UTC via the cron provider of record. Auth is Bearer
// token matching process.env.CRON_SECRET (see src/lib/cron-auth.ts).
//
// Respects `affiliate_accounts.notification_prefs[affiliate.conversion].email`
// — digest is skipped for any affiliate who opted out of conversion emails.
//
// Task: docs/tasks/2026-04-24/affiliate-commission-v2/05-rate-edit-history-and-notifications.md
// Spec: docs/specs/affiliate-commission-system.md §7

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronAuth } from "@/lib/cron-auth";
import { sendEmail } from "@/lib/email";
import { buildEmailHtml } from "@/lib/email-base";
import { resolveAffiliatePrefs } from "@/lib/affiliate-notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const admin = createAdminClient();
  const startedAt = new Date().toISOString();

  try {
    // 24h window
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Pull all non-reversed conversions in the window. Group by junction
    // (affiliate_id = diviner_affiliates.id) in JS.
    const { data: conversions, error: convErr } = await admin
      .from("campaign_conversions")
      .select(
        "id, affiliate_id, commission_amount_cents, created_at, reversed_at",
      )
      .gte("created_at", since)
      .is("reversed_at", null);

    if (convErr) {
      console.error("[affiliate-conversion-digest] fetch failed", convErr);
      return NextResponse.json(
        { error: "Fetch failed", detail: convErr.message },
        { status: 500 },
      );
    }

    const rows = conversions ?? [];
    if (rows.length === 0) {
      return NextResponse.json({
        data: {
          started_at: startedAt,
          digest_window_start: since,
          affiliates_sent: 0,
          total_rows: 0,
        },
      });
    }

    const byJunction = new Map<
      string,
      { count: number; total_cents: number }
    >();
    for (const c of rows) {
      const key = c.affiliate_id as string;
      const cur = byJunction.get(key) ?? { count: 0, total_cents: 0 };
      cur.count += 1;
      cur.total_cents += Number(c.commission_amount_cents ?? 0);
      byJunction.set(key, cur);
    }

    // Resolve each junction to its affiliate account (user_id + email + prefs).
    const junctionIds = Array.from(byJunction.keys());
    const { data: junctionRows } = await admin
      .from("diviner_affiliates")
      .select("id, affiliate_account_id")
      .in("id", junctionIds);

    const accountIdByJunction = new Map<string, string>();
    for (const j of junctionRows ?? []) {
      if (j.affiliate_account_id) {
        accountIdByJunction.set(
          j.id as string,
          j.affiliate_account_id as string,
        );
      }
    }

    const accountIds = Array.from(new Set(accountIdByJunction.values()));
    const { data: accounts } = await admin
      .from("affiliate_accounts")
      .select("id, email, name, status, notification_prefs")
      .in("id", accountIds);

    type AccountRow = {
      id: string;
      email: string;
      name: string | null;
      status: string;
      notification_prefs: Record<string, unknown> | null;
    };
    const accountById = new Map<string, AccountRow>();
    for (const a of (accounts ?? []) as unknown as AccountRow[]) {
      accountById.set(a.id, a);
    }

    // Aggregate per-account (an affiliate with multiple junctions gets one
    // email summing across all their partnerships).
    const byAccount = new Map<string, { count: number; total_cents: number }>();
    for (const [junctionId, totals] of byJunction.entries()) {
      const accountId = accountIdByJunction.get(junctionId);
      if (!accountId) continue;
      const cur = byAccount.get(accountId) ?? { count: 0, total_cents: 0 };
      cur.count += totals.count;
      cur.total_cents += totals.total_cents;
      byAccount.set(accountId, cur);
    }

    let sent = 0;
    let skippedInactive = 0;
    let skippedOptedOut = 0;
    let skippedNoEmail = 0;
    let failed = 0;

    for (const [accountId, totals] of byAccount.entries()) {
      const account = accountById.get(accountId);
      if (!account) continue;
      if (account.status !== "active") {
        skippedInactive += 1;
        continue;
      }
      if (!account.email) {
        skippedNoEmail += 1;
        continue;
      }

      const prefs = resolveAffiliatePrefs(
        account.notification_prefs,
        "affiliate.conversion",
      );
      if (!prefs.email) {
        skippedOptedOut += 1;
        continue;
      }

      const dollars = (totals.total_cents / 100).toFixed(2);
      const convWord = totals.count === 1 ? "conversion" : "conversions";

      try {
        await sendEmail({
          to: account.email,
          subject: `You earned $${dollars} yesterday (${totals.count} ${convWord})`,
          html: buildEmailHtml({
            title: "Affiliate earnings digest",
            preheader: `$${dollars} from ${totals.count} ${convWord} in the past 24 hours.`,
            content: `
              <p>Hi ${account.name ?? "there"},</p>
              <p>Your referrals earned <strong>$${dollars}</strong> from
                <strong>${totals.count}</strong> ${convWord} in the past
                24 hours.</p>
              <p>Tap below to see the full list and per-campaign breakdown.</p>
            `,
            ctaText: "View earnings",
            ctaUrl: absoluteUrl("/affiliate/earnings"),
          }),
        });
        sent += 1;
      } catch (err) {
        failed += 1;
        console.error("[affiliate-conversion-digest] email send failed", {
          accountId,
          err: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({
      data: {
        started_at: startedAt,
        digest_window_start: since,
        total_rows: rows.length,
        affiliates_eligible: byAccount.size,
        affiliates_sent: sent,
        skipped_inactive: skippedInactive,
        skipped_opted_out: skippedOptedOut,
        skipped_no_email: skippedNoEmail,
        failed,
      },
    });
  } catch (err) {
    console.error("[affiliate-conversion-digest] run failed", err);
    return NextResponse.json(
      {
        error: "Run failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

function absoluteUrl(path: string): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://astrologypro.com";
  return `${appUrl.replace(/\/$/, "")}${path}`;
}
