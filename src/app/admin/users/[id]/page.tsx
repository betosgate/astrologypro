import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCommunityProfileCompletion } from "@/lib/community/profile-completion";
import {
  UserDetailClient,
  type UserDetailData,
  type BusinessData,
  type AffiliateBusinessData,
  type DivinerBusinessData,
  type DivinerAffiliate,
  type ReferralEntry,
} from "@/components/admin/user-detail-client";
import { getRoleServicePackages } from "@/lib/role-service-packages";
import { listSignedAgreementsForUser } from "@/lib/signed-agreements";

export const metadata = { title: "User Detail — Admin" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeTable(data: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(data)) return [];
  return data as Array<Record<string, unknown>>;
}

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getUserDetail(userId: string): Promise<UserDetailData> {
  const admin = createAdminClient();

  // Fetch profile rows + ancillary data in parallel.
  // We try all profile tables; one will have a match.
  const [
    divinerRes,
    clientRes,
    advocateRes,
    communityRes,
    traineeRes,
    loginLogsRes,
    notesRes,
    activityRes,
  ] = await Promise.all([
    admin
      .from("diviners")
      .select(
        "id, user_id, display_name, phone, is_active, is_certified, account_status, created_at, " +
        "username, avatar_url, charges_enabled, google_calendar_connected, onboarding_completed, service_package_code"
      )
      .eq("user_id", userId)
      .maybeSingle(),

    admin
      .from("clients")
      .select("id, user_id, full_name, email, phone, created_at")
      .eq("user_id", userId)
      .maybeSingle(),

    admin
      .from("social_advocates")
      .select("id, user_id, name, email, phone, is_active, referral_code, total_referrals, created_at")
      .eq("user_id", userId)
      .maybeSingle(),

    admin
      .from("community_members")
      .select("id, user_id, full_name, email, phone, membership_type, membership_status, joined_at, onboarding_completed")
      .eq("user_id", userId)
      .maybeSingle(),

    admin
      .from("trainees")
      .select("id, user_id, name, email, phone, username, training_status, created_at, service_package_code")
      .eq("user_id", userId)
      .maybeSingle(),

    // Last 20 login logs
    admin
      .from("user_login_logs")
      .select("id, user_id, ip_address, user_agent, city, country, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),

    // Admin notes
    admin
      .from("admin_user_notes")
      .select("id, note, created_by, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),

    // Admin activity log — admin actions targeting this user
    admin
      .from("admin_activity_log")
      .select("id, actor_email, action_type, details, created_at")
      .eq("target_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  // User-generated activity log — fire-and-forget; swallow errors if table absent
  const userActivityRes = await Promise.resolve(
    admin
      .from("user_activity_log")
      .select("id, user_id, actor_id, event_category, event_type, metadata, ip_address, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)
  ).catch(() => ({ data: [] as unknown[] }));

  // Sessions & account lock — may not exist before migration; swallow errors
  const [sessionsRes, accountLockRes] = await Promise.all([
    Promise.resolve(
      admin
        .from("user_sessions")
        .select(
          "id, session_ref, device_type, browser, os, ip_address, country_code, " +
          "last_seen_at, created_at, revoked_at, is_current"
        )
        .eq("user_id", userId)
        .order("last_seen_at", { ascending: false })
        .limit(20)
    ).catch(() => ({ data: [] as unknown[] })),

    Promise.resolve(
      admin
        .from("user_account_locks")
        .select("id, locked_at, locked_reason, locked_by, unlocked_at, unlocked_by")
        .eq("user_id", userId)
        .maybeSingle()
    ).catch(() => ({ data: null as unknown })),
  ]);

  // Optional tables — may not exist; swallow errors using Promise.resolve wrapper
  const [securityEventsRes, relationshipsRes] = await Promise.all([
    Promise.resolve(
      admin
        .from("user_security_events")
        .select("id, event_type, ip_address, actor_user_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20)
    ).catch(() => ({ data: [] as unknown[] })),

    Promise.resolve(
      admin
        .from("user_relationships")
        .select("id, parent_user_id, child_user_id, relationship_type, status, active_from, active_to")
        .or(`parent_user_id.eq.${userId},child_user_id.eq.${userId}`)
    ).catch(() => ({ data: [] as unknown[] })),
  ]);

  // Resolve which profile row matched
  // Cast through unknown to avoid Supabase's GenericStringError union
  const diviner   = divinerRes.data as Record<string, unknown> | null;
  const client    = clientRes.data as Record<string, unknown> | null;
  const advocate  = advocateRes.data as Record<string, unknown> | null;
  const community = communityRes.data as Record<string, unknown> | null;
  const trainee   = traineeRes.data as Record<string, unknown> | null;

  let role        = "";
  let roleLabel   = "";
  let rowId       = "";
  let name        = "";
  let email       = "";
  let phone: string | undefined;
  let isActive    = false;
  let accountStatus: string | undefined;
  let isCertified: boolean | undefined;
  let joinedAt    = new Date().toISOString();
  let profileFields: Record<string, string | null> = {};
  let servicePackageCode: string | null = null;

  if (diviner) {
    role          = "diviner";
    roleLabel     = "Diviner";
    rowId         = diviner.id as string;
    name          = (diviner.display_name as string) ?? "";
    phone         = (diviner.phone as string) ?? undefined;
    isActive      = !!(diviner.is_active as boolean);
    accountStatus = (diviner.account_status as string) ?? undefined;
    isCertified   = !!(diviner.is_certified as boolean);
    joinedAt      = diviner.created_at as string;
    profileFields = {
      username:                    (diviner.username as string) ?? null,
      onboarding_completed:        String(diviner.onboarding_completed ?? false),
      charges_enabled:             String(diviner.charges_enabled ?? false),
      google_calendar_connected:   String(diviner.google_calendar_connected ?? false),
    };
    servicePackageCode = (diviner.service_package_code as string) ?? null;

    // Fetch diviner email from auth
    const authRes = await admin.rpc("get_auth_users_by_ids", {
      user_ids: [userId],
    });
    const authList = (authRes.data ?? []) as Array<{ user_id: string; email: string }>;
    email = authList.find((u) => u.user_id === userId)?.email ?? "";

  } else if (client) {
    role      = "client";
    roleLabel = "Client";
    rowId     = client.id as string;
    name      = (client.full_name as string) ?? "";
    email     = (client.email as string) ?? "";
    phone     = (client.phone as string) ?? undefined;
    isActive  = true;
    joinedAt  = client.created_at as string;

  } else if (advocate) {
    role      = "advocate";
    roleLabel = "Social Advocate";
    rowId     = advocate.id as string;
    name      = (advocate.name as string) ?? "";
    email     = (advocate.email as string) ?? "";
    phone     = (advocate.phone as string) ?? undefined;
    isActive  = !!(advocate.is_active as boolean);
    joinedAt  = advocate.created_at as string;
    profileFields = {
      referral_code:   (advocate.referral_code as string) ?? null,
      total_referrals: String(advocate.total_referrals ?? 0),
    };

  } else if (community) {
    role      = "community";
    roleLabel = "Community Member";
    rowId     = community.id as string;
    name      = (community.full_name as string) ?? "";
    email     = (community.email as string) ?? "";
    phone     = (community.phone as string) ?? undefined;
    isActive  = (community.membership_status as string) === "active";
    accountStatus = community.membership_status as string | undefined;
    joinedAt  = (community.joined_at as string) ?? new Date().toISOString();
    profileFields = {
      membership_type:   (community.membership_type as string) ?? null,
      membership_status: (community.membership_status as string) ?? null,
      onboarding_completed: String(community.onboarding_completed ?? false),
    };

    const completion = await getCommunityProfileCompletion(admin, userId);
    if (completion) {
      profileFields.community_profile_completion = `${completion.overall_pct}%`;
      profileFields.community_missing_items = completion.items
        .filter((item) => !item.completed)
        .map((item) => item.label)
        .join(", ") || null;
    }

  } else if (trainee) {
    role      = "trainee";
    roleLabel = "Trainee";
    rowId     = trainee.id as string;
    name      = (trainee.name as string) ?? "";
    email     = (trainee.email as string) ?? "";
    phone     = (trainee.phone as string) ?? undefined;
    isActive  = ["active", "in_progress"].includes((trainee.training_status as string) ?? "");
    accountStatus = trainee.training_status as string | undefined;
    joinedAt  = trainee.created_at as string;
    profileFields = {
      username:        (trainee.username as string) ?? null,
      training_status: (trainee.training_status as string) ?? null,
    };
    servicePackageCode = (trainee.service_package_code as string) ?? null;

  } else {
    notFound();
  }

  // ── Login attempts — fetch now that email is resolved ────────────────────
  let loginAttemptsData: unknown[] = [];
  if (email) {
    const attRes = await Promise.resolve(
      admin
        .from("user_login_attempts")
        .select("id, email, ip_address, attempted_at, success")
        .eq("email", email)
        .order("attempted_at", { ascending: false })
        .limit(10)
    ).catch(() => ({ data: [] as unknown[] }));
    loginAttemptsData = (attRes.data as unknown[]) ?? [];
  }

  // ── Training status (trainee role) ─────────────────────────────────────────
  const trainingStatus = trainee
    ? (trainee.training_status as string) ?? "in_progress"
    : undefined;
  const servicePackages =
    role === "diviner" || role === "trainee"
      ? await getRoleServicePackages()
      : [];
  const signedAgreements = await listSignedAgreementsForUser(userId);

  // ── Referrals (affiliate/diviner) ─────────────────────────────────────────
  let referrals: ReferralEntry[] = [];
  let totalReferrals = 0;

  if (role === "diviner" || role === "affiliate") {
    const refRes = await Promise.resolve(
      admin
        .from("diviner_affiliates")
        .select("id, user_id, name, email, status, created_at", { count: "exact" })
        .eq("diviner_id", userId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(50)
    ).catch(() => ({ data: [] as unknown[], count: 0 }));

    totalReferrals = (refRes as { count?: number | null }).count ?? 0;
    referrals = safeTable((refRes as { data?: unknown }).data).map((r) => ({
      id: r.id as string,
      referred_user_id: (r.user_id as string) ?? "",
      referred_name: (r.name as string) ?? undefined,
      referred_email: (r.email as string) ?? undefined,
      referral_date: r.created_at as string,
      status: (r.status as string) ?? "active",
    }));
  }

  // ── Last login ────────────────────────────────────────────────────────────
  const loginLogsRaw = safeTable(loginLogsRes.data);
  const lastLoginAt  = loginLogsRaw[0]?.created_at as string | undefined;

  // ── Relationships — enrich with partner names (best-effort) ──────────────
  const relsRaw = safeTable((relationshipsRes as { data?: unknown }).data);
  const partnerIds = relsRaw.map((r) =>
    (r.parent_user_id as string) === userId
      ? (r.child_user_id as string)
      : (r.parent_user_id as string)
  );

  let partnerNameMap: Record<string, { name: string; email: string }> = {};
  if (partnerIds.length > 0) {
    // Try to get names from all profile tables — merge best-effort
    const [pDiv, pCli, pAdv] = await Promise.all([
      admin
        .from("diviners")
        .select("user_id, display_name")
        .in("user_id", partnerIds),
      admin
        .from("clients")
        .select("user_id, full_name, email")
        .in("user_id", partnerIds),
      admin
        .from("social_advocates")
        .select("user_id, name, email")
        .in("user_id", partnerIds),
    ]);

    for (const d of safeTable(pDiv.data)) {
      partnerNameMap[d.user_id as string] = {
        name: (d.display_name as string) ?? "",
        email: "",
      };
    }
    for (const c of safeTable(pCli.data)) {
      partnerNameMap[c.user_id as string] = {
        name: (c.full_name as string) ?? "",
        email: (c.email as string) ?? "",
      };
    }
    for (const a of safeTable(pAdv.data)) {
      partnerNameMap[a.user_id as string] = {
        name: (a.name as string) ?? "",
        email: (a.email as string) ?? "",
      };
    }
  }

  const relationships = relsRaw.map((r) => {
    const partnerId =
      (r.parent_user_id as string) === userId
        ? (r.child_user_id as string)
        : (r.parent_user_id as string);
    const partner = partnerNameMap[partnerId];
    return {
      id:                r.id as string,
      parent_user_id:    r.parent_user_id as string,
      child_user_id:     r.child_user_id as string,
      relationship_type: r.relationship_type as string,
      status:            r.status as string,
      active_from:       r.active_from as string | undefined,
      active_to:         r.active_to as string | undefined,
      partner_name:      partner?.name,
      partner_email:     partner?.email,
    };
  });

  return {
    userId,
    rowId,
    email,
    name,
    phone,
    role,
    roleLabel,
    accountStatus,
    isActive,
    isCertified,
    joinedAt,
    lastLoginAt,
    profileFields,
    notes: safeTable(notesRes.data).map((n) => ({
      id:         n.id as string,
      note:       n.note as string,
      created_by: n.created_by as string | undefined,
      created_at: n.created_at as string,
    })),
    loginLogs: loginLogsRaw.map((l) => ({
      id:           l.id as string,
      user_id:      l.user_id as string,
      ip_address:   l.ip_address as string | undefined,
      user_agent:   l.user_agent as string | undefined,
      city:         l.city as string | undefined,
      country:      l.country as string | undefined,
      created_at:   l.created_at as string,
    })),
    securityEvents: safeTable((securityEventsRes as { data?: unknown }).data).map((e) => ({
      id:            e.id as string,
      event_type:    e.event_type as string,
      ip_address:    e.ip_address as string | undefined,
      actor_user_id: e.actor_user_id as string | undefined,
      created_at:    e.created_at as string,
    })),
    relationships,
    activityLog: safeTable(activityRes.data).map((a) => ({
      id:          a.id as string,
      actor_email: a.actor_email as string | undefined,
      action_type: a.action_type as string,
      details:     a.details as string | undefined,
      created_at:  a.created_at as string,
    })),
    userActivityLog: safeTable((userActivityRes as { data?: unknown }).data).map((a) => ({
      id:             a.id as string,
      event_category: a.event_category as string | undefined,
      event_type:     a.event_type as string,
      metadata:       a.metadata as Record<string, unknown> | undefined,
      ip_address:     a.ip_address as string | undefined,
      actor_id:       a.actor_id as string | undefined,
      created_at:     a.created_at as string,
    })),
    commPrefs: null,
    businessData: await fetchBusinessData(admin, userId, role),
    sessions: safeTable((sessionsRes as { data?: unknown }).data).map((s) => ({
      id:           s.id as string,
      session_ref:  s.session_ref as string | undefined,
      device_type:  s.device_type as string | undefined,
      browser:      s.browser as string | undefined,
      os:           s.os as string | undefined,
      ip_address:   s.ip_address as string | undefined,
      country_code: s.country_code as string | undefined,
      last_seen_at: s.last_seen_at as string,
      created_at:   s.created_at as string,
      revoked_at:   s.revoked_at as string | undefined,
      is_current:   !!(s.is_current as boolean),
    })),
    accountLock: (() => {
      const lock = (accountLockRes as { data?: unknown }).data as Record<string, unknown> | null;
      if (!lock || lock.unlocked_at) return null;
      return {
        locked_at:     lock.locked_at as string,
        locked_reason: lock.locked_reason as string | undefined,
        locked_by:     lock.locked_by as string | undefined,
      };
    })(),
    loginAttempts: safeTable(loginAttemptsData).map((a) => ({
      id:           a.id as string,
      email:        a.email as string,
      ip_address:   a.ip_address as string | undefined,
      attempted_at: a.attempted_at as string,
      success:      !!(a.success as boolean),
    })),
    trainingStatus,
    referrals,
    totalReferrals,
    servicePackageCode,
    signedAgreements,
    servicePackages: servicePackages.map((pkg) => ({
      package_code: pkg.package_code,
      display_name: pkg.display_name,
      is_active: pkg.is_active,
    })),
  };
}

// ─── Business data fetch ──────────────────────────────────────────────────────

async function fetchBusinessData(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  role: string
): Promise<BusinessData> {
  if (role === "advocate") {
    // Advocate = an entry in diviner_affiliates where user_id = userId
    const { data: affRow } = await admin
      .from("diviner_affiliates")
      .select(
        "id, diviner_id, status, default_commission_type, default_commission_value, created_at"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (!affRow) return null;

    const affRec = affRow as Record<string, unknown>;

    // Resolve parent diviner name
    let parentDivinerName = affRec.diviner_id as string;
    const { data: divinerRow } = await admin
      .from("diviners")
      .select("display_name")
      .eq("user_id", affRec.diviner_id as string)
      .maybeSingle();
    if (divinerRow) {
      parentDivinerName =
        (divinerRow as Record<string, unknown>).display_name as string ?? parentDivinerName;
    }

    const affiliateData: AffiliateBusinessData = {
      affiliate_row_id:   affRec.id as string,
      parent_diviner_id:  affRec.diviner_id as string,
      parent_diviner_name: parentDivinerName,
      commission_type:    affRec.default_commission_type as string | undefined,
      commission_value:   affRec.default_commission_value as number | undefined,
      status:             affRec.status as string,
      created_at:         affRec.created_at as string,
    };

    return { kind: "affiliate", data: affiliateData };
  }

  if (role === "diviner") {
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    ).toISOString();

    // Fetch affiliates + service count + bookings this month in parallel
    const [affiliatesRes, serviceCountRes, bookingsRes] = await Promise.all([
      admin
        .from("diviner_affiliates")
        .select("id, name, email, status, created_at", { count: "exact" })
        .eq("diviner_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),

      admin
        .from("diviner_services")
        .select("id", { count: "exact", head: true })
        .eq("diviner_id", userId),

      admin
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("diviner_id", userId)
        .gte("created_at", startOfMonth),
    ]);

    const affiliates: DivinerAffiliate[] = safeTable(affiliatesRes.data).map((a) => ({
      id:         a.id as string,
      name:       a.name as string,
      email:      a.email as string | undefined,
      status:     a.status as string,
      created_at: a.created_at as string,
    }));

    const divinerData: DivinerBusinessData = {
      service_count:        serviceCountRes.count ?? 0,
      bookings_this_month:  bookingsRes.count ?? 0,
      affiliates,
      total_affiliates:     affiliatesRes.count ?? affiliates.length,
    };

    return { kind: "diviner", data: divinerData };
  }

  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUserDetail(id);

  return (
    <div className="space-y-6">
      <UserDetailClient user={user} />
    </div>
  );
}
