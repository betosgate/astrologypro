import { createAdminClient } from "@/lib/supabase/admin";
import { ChimeQuotasBanner } from "@/components/admin/chime-quotas-banner";
import {
  DivinerManagementClient,
  type AdminDiviner,
} from "@/components/admin/diviner-management-client";

export const metadata = { title: "Diviners — Admin" };

// ─── Types ────────────────────────────────────────────────────────────────────

interface DivinersSearchParams {
  q?: string;
  status?: string;
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortDir?: string;
  joinedFrom?: string;
  joinedTo?: string;
}

const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 10;

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getDiviners(
  params: DivinersSearchParams,
  pageSize: number,
): Promise<{
  diviners: AdminDiviner[];
  total: number;
  counts: { all: number; active: number; suspended: number };
}> {
  const admin = createAdminClient();

  const q = params.q?.trim() ?? "";
  const statusFilter = params.status ?? "all";
  const sortBy = params.sortBy ?? "joinedAt";
  const sortDir = (params.sortDir ?? "desc") as "asc" | "desc";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const joinedFrom = params.joinedFrom ?? "";
  const joinedTo = params.joinedTo ?? "";

  // NOTE: `google_calendar_connected` is legacy — the source of truth is the
  // `calendar_connections` table (migrated in 20260408000110). We no longer
  // read the legacy column here.
  //
  // Reading phone numbers come from either Twilio or AWS Chime depending on
  // each diviner's `phone_provider`. Surface whichever is provisioned.
  const selectStr =
    "id, user_id, display_name, username, avatar_url, account_status, " +
    "is_active, charges_enabled, is_certified, onboarding_completed, " +
    "phone, twilio_phone_number, chime_phone_number, phone_provider, " +
    "created_at";

  // Map UI sort keys → DB columns (keep whitelist for safety)
  const dbSort: string = (() => {
    switch (sortBy) {
      case "name":
        return "display_name";
      case "username":
        return "username";
      case "isActive":
        return "is_active";
      case "joinedAt":
      default:
        return "created_at";
    }
  })();

  // Using `any` keeps us compatible with Supabase's chained generics without
  // having to spell out the full QueryBuilder type for every branch.
  const buildFiltered = (base: any): any => {
    let query: any = base;
    if (statusFilter === "active") query = query.eq("is_active", true);
    if (statusFilter === "suspended")
      query = query.eq("account_status", "suspended");
    if (q) {
      // Escape commas and special PostgREST chars in q (basic safety)
      const safe = q.replace(/[,()]/g, " ");
      query = query.or(
        `display_name.ilike.%${safe}%,username.ilike.%${safe}%,phone.ilike.%${safe}%`,
      );
    }
    if (joinedFrom) query = query.gte("created_at", joinedFrom);
    if (joinedTo) query = query.lte("created_at", joinedTo + "T23:59:59Z");
    return query;
  };

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  const [pageRes, allCountRes, activeCountRes, suspendedCountRes] =
    await Promise.all([
      // Paginated page + total-with-filters count
      buildFiltered(admin.from("diviners").select(selectStr, { count: "exact" }))
        .order(dbSort, { ascending: sortDir === "asc" })
        .order("id", { ascending: true }) // deterministic tie-breaker
        .range(start, end),

      // Unfiltered status-tab counts (ignores search — tabs show global totals)
      admin
        .from("diviners")
        .select("id", { count: "exact", head: true }),
      admin
        .from("diviners")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      admin
        .from("diviners")
        .select("id", { count: "exact", head: true })
        .eq("account_status", "suspended"),
    ]);

  const divinersPage = (pageRes.data ?? []) as Array<Record<string, unknown>>;
  const total = pageRes.count ?? 0;

  const counts = {
    all: allCountRes.count ?? 0,
    active: activeCountRes.count ?? 0,
    suspended: suspendedCountRes.count ?? 0,
  };

  // ── Resolve emails + affiliate counts + calendar connections for this page ─
  const userIds = divinersPage
    .map((d) => d.user_id as string)
    .filter(Boolean);
  const divinerIds = divinersPage.map((d) => d.id as string).filter(Boolean);

  const emailMap: Record<string, string> = {};
  const affiliateCountMap: Record<string, number> = {};
  const calendarConnectedSet = new Set<string>(); // diviner.id set

  if (userIds.length > 0) {
    const [authRes, relRes, calRes] = await Promise.all([
      Promise.resolve(
        admin.rpc("get_auth_users_by_ids", { user_ids: userIds }),
      ).catch(() => ({ data: [] as unknown[] })),

      Promise.resolve(
        admin
          .from("user_relationships")
          .select("parent_user_id")
          .in("parent_user_id", userIds)
          .eq("relationship_type", "affiliate"),
      ).catch(() => ({ data: [] as unknown[] })),

      // Calendar connections — source of truth since migration
      // 20260408000110_backfill_calendar_connections. Keyed by owner_id =
      // diviner.id. A diviner is "connected" if ANY row exists (google or
      // microsoft) with a refresh_token.
      divinerIds.length > 0
        ? Promise.resolve(
            admin
              .from("calendar_connections")
              .select("owner_id")
              .in("owner_id", divinerIds),
          ).catch(() => ({ data: [] as unknown[] }))
        : Promise.resolve({ data: [] as unknown[] }),
    ]);

    for (const u of (((authRes as { data?: unknown }).data ?? []) as Array<
      Record<string, unknown>
    >)) {
      emailMap[u.user_id as string] = (u.email as string) ?? "";
    }

    for (const rel of (((relRes as { data?: unknown }).data ?? []) as Array<
      Record<string, unknown>
    >)) {
      const pid = rel.parent_user_id as string;
      affiliateCountMap[pid] = (affiliateCountMap[pid] ?? 0) + 1;
    }

    for (const c of (((calRes as { data?: unknown }).data ?? []) as Array<
      Record<string, unknown>
    >)) {
      const ownerId = c.owner_id as string;
      if (ownerId) calendarConnectedSet.add(ownerId);
    }
  }

  const diviners: AdminDiviner[] = divinersPage.map((d) => {
    const twilio = (d.twilio_phone_number as string) ?? "";
    const chime = (d.chime_phone_number as string) ?? "";
    const provider = (d.phone_provider as string) ?? "twilio";
    // Active reading number = whichever provider the diviner is set to use
    const readingNumber =
      provider === "chime" ? chime || twilio : twilio || chime;

    return {
      id: d.id as string,
      userId: d.user_id as string,
      displayName: (d.display_name as string) ?? "—",
      username: (d.username as string) ?? "",
      email: emailMap[d.user_id as string] ?? "",
      phone: (d.phone as string) ?? "",
      accountStatus: (d.account_status as string) ?? undefined,
      isActive: !!(d.is_active as boolean),
      chargesEnabled: !!(d.charges_enabled as boolean),
      calendarConnected: calendarConnectedSet.has(d.id as string),
      phoneConnected: !!readingNumber,
      phoneProvider: provider,
      readingPhoneNumber: readingNumber,
      isCertified: !!(d.is_certified as boolean),
      onboardingCompleted: !!(d.onboarding_completed as boolean),
      affiliateCount: affiliateCountMap[d.user_id as string] ?? 0,
      joinedAt: d.created_at as string,
    };
  });

  return { diviners, total, counts };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDivinersPage({
  searchParams,
}: {
  searchParams: Promise<DivinersSearchParams>;
}) {
  const params = await searchParams;
  const rawPageSize = parseInt(
    params.pageSize ?? String(DEFAULT_PAGE_SIZE),
    10,
  );
  const pageSize = ALLOWED_PAGE_SIZES.includes(rawPageSize)
    ? rawPageSize
    : DEFAULT_PAGE_SIZE;

  const { diviners, total, counts } = await getDiviners(params, pageSize);

  return (
    <div className="space-y-6">
      {/* ── Chime quotas notice ──────────────────────────────────────────── */}
      <ChimeQuotasBanner />

      <DivinerManagementClient
        diviners={diviners}
        total={total}
        counts={counts}
        pageSize={pageSize}
        searchParams={params}
      />
    </div>
  );
}
