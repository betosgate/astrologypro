import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/debug/chime-flow
 * Admin-only diagnostic — tests each step of the Chime inbound call flow.
 * Checks DB tables, env vars, and simulates a lookup call.
 * DELETE before production launch.
 */
export async function GET() {
  const adminEmail = await getAdminUser();
  if (!adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const checks: Record<string, unknown> = {};

  // ── 1. Check CRON_SECRET is set ────────────────────────────────────────
  checks["1_cron_secret"] = {
    set: !!process.env.CRON_SECRET,
    prefix: process.env.CRON_SECRET?.slice(0, 16) ?? "NOT SET",
    length: process.env.CRON_SECRET?.length ?? 0,
  };

  // ── 2. Check phone_call_notifications table exists ─────────────────────
  try {
    const { data, error } = await admin
      .from("phone_call_notifications")
      .select("id")
      .limit(1);
    checks["2_phone_call_notifications_table"] = {
      exists: !error,
      error: error?.message ?? null,
      rowCount: data?.length ?? 0,
    };
  } catch (err) {
    checks["2_phone_call_notifications_table"] = {
      exists: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // ── 3. Check phone_sessions table + status constraint ──────────────────
  try {
    const { error: insertErr } = await admin
      .from("phone_sessions")
      .select("id, status")
      .limit(1);
    checks["3_phone_sessions_table"] = {
      exists: !insertErr,
      error: insertErr?.message ?? null,
    };
  } catch (err) {
    checks["3_phone_sessions_table"] = {
      exists: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // ── 4. Check diviners with Chime phone numbers ─────────────────────────
  try {
    const { data, error } = await admin
      .from("diviners")
      .select("id, display_name, chime_phone_number, chime_sip_rule_id, phone_provider, phone_dialin_enabled")
      .not("chime_phone_number", "is", null);
    checks["4_diviners_with_chime_numbers"] = {
      count: data?.length ?? 0,
      error: error?.message ?? null,
      diviners: (data ?? []).map((d) => ({
        id: d.id,
        name: d.display_name,
        phone: d.chime_phone_number,
        hasSipRule: !!d.chime_sip_rule_id,
        provider: d.phone_provider,
        dialinEnabled: d.phone_dialin_enabled,
      })),
    };
  } catch (err) {
    checks["4_diviners_with_chime_numbers"] = {
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // ── 5. Check Chime env vars ────────────────────────────────────────────
  checks["5_chime_env_vars"] = {
    AWS_CHIME_ACCESS_KEY_ID: !!process.env.AWS_CHIME_ACCESS_KEY_ID,
    AWS_CHIME_SECRET_ACCESS_KEY: !!process.env.AWS_CHIME_SECRET_ACCESS_KEY,
    CHIME_SMA_ID: process.env.CHIME_SMA_ID ?? "NOT SET",
    NEXT_PUBLIC_CHIME_ENABLED: process.env.NEXT_PUBLIC_CHIME_ENABLED ?? "NOT SET",
  };

  // ── 6. Simulate lookup auth check ──────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  const testAuthHeader = `Bearer ${cronSecret}`;
  const expectedCheck = cronSecret && testAuthHeader === `Bearer ${cronSecret}`;
  checks["6_lookup_auth_simulation"] = {
    cronSecretSet: !!cronSecret,
    authHeaderWouldMatch: expectedCheck,
    note: !cronSecret
      ? "CRON_SECRET is not set — lookup will skip auth (insecure but won't block)"
      : "Auth header would match — lookup should pass",
  };

  // ── 7. Test self-call to lookup endpoint ───────────────────────────────
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const lookupRes = await fetch(`${appUrl}/api/chime/voice/lookup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cronSecret}`,
      },
      body: JSON.stringify({
        callerPhone: "+10000000000",
        calledNumber: "+10000000001",
        callId: "debug-test-call",
      }),
    });

    const lookupBody = await lookupRes.text();
    checks["7_lookup_self_test"] = {
      url: `${appUrl}/api/chime/voice/lookup`,
      status: lookupRes.status,
      response: lookupBody.slice(0, 500),
      note: lookupRes.status === 401
        ? "❌ UNAUTHORIZED — CRON_SECRET mismatch or middleware blocking"
        : lookupRes.status === 400
        ? "✅ Auth passed (got 400 = missing params, which is expected for test data)"
        : `Status ${lookupRes.status}`,
    };
  } catch (err) {
    checks["7_lookup_self_test"] = {
      error: err instanceof Error ? err.message : String(err),
      note: "Failed to self-call lookup endpoint",
    };
  }

  // ── 8. Check SMA Lambda APP_URL matches this deployment ────────────────
  checks["8_app_url_config"] = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "NOT SET",
    VERCEL_URL: process.env.VERCEL_URL ?? "NOT SET",
    note: "SMA Lambda APP_URL must point to the deployed URL (check Lambda env vars)",
  };

  // ── 9. Check currently logged-in diviner's phone setup ─────────────────
  // Shows ALL diviners and their phone config so you can verify the test diviner
  try {
    const { data: allDiviners, error } = await admin
      .from("diviners")
      .select(
        "id, user_id, display_name, username, " +
        "chime_phone_number, chime_sma_phone_arn, chime_sip_rule_id, " +
        "twilio_phone_number, twilio_phone_sid, " +
        "phone_provider, phone_dialin_enabled, phone_answer_mode, phone_mobile, " +
        "is_active, account_status"
      )
      .order("created_at", { ascending: false });

    if (error) {
      checks["9_all_diviners_phone_config"] = { error: error.message };
    } else {
      // Get emails for each diviner
      const userIds = (allDiviners ?? []).map((d) => d.user_id).filter(Boolean);
      let emailMap: Record<string, string> = {};
      if (userIds.length > 0) {
        try {
          const { data: users } = await admin.rpc("get_auth_users_by_ids", { user_ids: userIds });
          for (const u of (users ?? []) as Array<Record<string, unknown>>) {
            emailMap[u.user_id as string] = (u.email as string) ?? "";
          }
        } catch { /* ignore */ }
      }

      checks["9_all_diviners_phone_config"] = {
        total: allDiviners?.length ?? 0,
        diviners: (allDiviners ?? []).map((d) => ({
          id: d.id,
          userId: d.user_id,
          email: emailMap[d.user_id] ?? "unknown",
          name: d.display_name,
          username: d.username,
          isActive: d.is_active,
          accountStatus: d.account_status,
          phoneProvider: d.phone_provider ?? "not set",
          dialinEnabled: d.phone_dialin_enabled ?? false,
          answerMode: d.phone_answer_mode ?? "not set",
          mobileFallback: d.phone_mobile ?? "not set",
          chime: {
            phoneNumber: d.chime_phone_number ?? "❌ none",
            phoneArn: d.chime_sma_phone_arn ? "✅ set" : "❌ not set",
            sipRuleId: d.chime_sip_rule_id ?? "❌ not set",
          },
          twilio: {
            phoneNumber: d.twilio_phone_number ?? "❌ none",
            phoneSid: d.twilio_phone_sid ?? "❌ not set",
          },
          issues: [
            ...(!d.phone_dialin_enabled ? ["⚠️ phone_dialin_enabled is FALSE — calls will be rejected by pending-calls route"] : []),
            ...(!d.phone_provider ? ["⚠️ phone_provider not set — widget loader won't know which widget to show"] : []),
            ...(d.phone_provider === "chime" && !d.chime_phone_number ? ["❌ provider is chime but no chime_phone_number"] : []),
            ...(d.phone_provider === "chime" && !d.chime_sip_rule_id ? ["❌ provider is chime but no chime_sip_rule_id — calls won't route"] : []),
            ...(d.chime_phone_number && !d.chime_sip_rule_id ? ["⚠️ has chime number but no SIP rule — provisioning may have partially failed"] : []),
            ...(!d.is_active ? ["⚠️ diviner is_active = false"] : []),
          ],
        })),
      };
    }
  } catch (err) {
    checks["9_all_diviners_phone_config"] = {
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // ── 10. Recent phone_call_notifications (last 10) ──────────────────────
  try {
    const { data, error } = await admin
      .from("phone_call_notifications")
      .select("id, diviner_id, phone_session_id, caller_phone, call_id, status, provider, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    checks["10_recent_notifications"] = {
      error: error?.message ?? null,
      count: data?.length ?? 0,
      rows: data ?? [],
    };
  } catch (err) {
    checks["10_recent_notifications"] = {
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // ── 11. Recent phone_sessions (last 10) ────────────────────────────────
  try {
    const { data, error } = await admin
      .from("phone_sessions")
      .select("id, diviner_id, client_id, caller_phone, session_type, status, created_at, ended_at, duration_seconds")
      .order("created_at", { ascending: false })
      .limit(10);
    checks["11_recent_phone_sessions"] = {
      error: error?.message ?? null,
      count: data?.length ?? 0,
      rows: data ?? [],
    };
  } catch (err) {
    checks["11_recent_phone_sessions"] = {
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return NextResponse.json(checks, { status: 200 });
}
