import { createAdminClient } from "@/lib/supabase/admin";
import {
  InvitationsClient,
  type InvitationRow,
} from "@/components/admin/invitations-client";

export const metadata = { title: "Invitations — Admin" };

interface InvitationSearchParams {
  q?: string;
  role?: string;
  status?: string;
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortDir?: string;
}

const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;
const ALLOWED_SORT_COLUMNS = ["email", "role_slug", "status", "invited_by", "expires_at", "created_at"];

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getData(params: InvitationSearchParams) {
  const admin = createAdminClient();

  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const rawPageSize = parseInt(params.pageSize ?? String(DEFAULT_PAGE_SIZE), 10);
  const pageSize = ALLOWED_PAGE_SIZES.includes(rawPageSize) ? rawPageSize : DEFAULT_PAGE_SIZE;
  const sortBy = ALLOWED_SORT_COLUMNS.includes(params.sortBy ?? "") ? params.sortBy! : "created_at";
  const sortDir = params.sortDir === "asc" ? "asc" : "desc";
  const q = params.q?.trim() ?? "";
  const status = params.status?.trim().toLowerCase() ?? "";
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let invitationsQuery = admin
    .from("invitations")
    .select("id, email, role_slug, status, invited_by, expires_at, resent_count, created_at, metadata", {
      count: "exact",
    })
    .order(sortBy, { ascending: sortDir === "asc", nullsFirst: false })
    .order("id", { ascending: false });

  if (status && status !== "all") {
    if (status === "active" || status === "completed") {
      invitationsQuery = invitationsQuery.eq("status", "accepted");
    } else {
      invitationsQuery = invitationsQuery.eq("status", status);
    }
  }

  if (q) {
    invitationsQuery = invitationsQuery.or(
      [
        `email.ilike.%${q}%`,
        `role_slug.ilike.%${q}%`,
        `invited_by.ilike.%${q}%`,
      ].join(","),
    );
  }

  const filteredInvitationsRes = await invitationsQuery;

  const rawInvitations = (filteredInvitationsRes.data ?? []) as Array<Record<string, unknown>>;

  const invitedByIds = [...new Set(rawInvitations.map((inv) => inv.invited_by).filter(Boolean))];
  const invitedByMap = new Map<string, string>();
  for (const userId of invitedByIds) {
    const { data: authUser } = await admin.auth.admin.getUserById(userId as string);
    const inviterEmail = authUser?.user?.email;
    if (inviterEmail) {
      invitedByMap.set(userId as string, inviterEmail);
    }
  }

  const divinerEmails = rawInvitations
    .filter(
      (inv) =>
        inv.role_slug === "diviner" &&
        (inv.status === "accepted" || inv.status === "pending")
    )
    .map((inv) => String(inv.email).toLowerCase());

  const divinerSubStatusByEmail = new Map<string, string | null>();
  if (divinerEmails.length > 0) {
    const { data: usersList } = await admin.auth.admin.listUsers();
    const emailToUserId = new Map<string, string>();
    for (const user of usersList?.users ?? []) {
      const email = user.email?.toLowerCase();
      if (email) {
        emailToUserId.set(email, user.id);
      }
    }

    const userIds = divinerEmails
      .map((email) => emailToUserId.get(email))
      .filter((value): value is string => Boolean(value));

    if (userIds.length > 0) {
      const { data: divinerRows } = await admin
        .from("diviners")
        .select("user_id, subscription_status")
        .in("user_id", userIds);

      const userIdToStatus = new Map<string, string | null>();
      for (const row of divinerRows ?? []) {
        userIdToStatus.set(
          row.user_id as string,
          (row.subscription_status as string | null) ?? null
        );
      }

      for (const email of divinerEmails) {
        const userId = emailToUserId.get(email);
        if (userId) {
          divinerSubStatusByEmail.set(email, userIdToStatus.get(userId) ?? null);
        }
      }
    }
  }

  const invitations: InvitationRow[] = rawInvitations.map((inv) => {
    const metadata =
      inv.metadata && typeof inv.metadata === "object"
        ? (inv.metadata as Record<string, unknown>)
        : null;
    const completedAt =
      typeof metadata?.completed_at === "string" ? metadata.completed_at : null;
    const email = String(inv.email).toLowerCase();
    const liveSubStatus = divinerSubStatusByEmail.get(email) ?? null;

    return {
      id: inv.id as string,
      email,
      role_slug: inv.role_slug as string,
      status: inv.status as string,
      invited_by:
        (inv.invited_by as string | undefined) &&
        invitedByMap.get(inv.invited_by as string)
          ? invitedByMap.get(inv.invited_by as string)
          : (inv.invited_by as string | undefined),
      expires_at: inv.expires_at as string | undefined,
      resent_count: inv.resent_count as number | undefined,
      created_at: inv.created_at as string,
      diviner_subscription_status:
        inv.role_slug === "diviner"
          ? completedAt
            ? "active"
            : liveSubStatus
          : null,
    };
  });

  const filteredInvitations = invitations.filter((invitation) => {
    if (!status || status === "all") return true;
    if (status === "active") {
      return (
        invitation.role_slug === "diviner" &&
        invitation.status === "accepted" &&
        invitation.diviner_subscription_status !== "active"
      );
    }
    if (status === "completed") {
      return (
        invitation.role_slug === "diviner" &&
        invitation.status === "accepted" &&
        invitation.diviner_subscription_status === "active"
      );
    }
    return invitation.status === status;
  });

  const pagedInvitations = filteredInvitations.slice(from, to + 1);

  return {
    invitations: pagedInvitations,
    total: filteredInvitations.length,
    page,
    pageSize,
    sortBy,
    sortDir,
    q,
    status: status || "all",
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminInvitationsPage({
  searchParams,
}: {
  searchParams: Promise<InvitationSearchParams>;
}) {
  const params = await searchParams;
  const { invitations, total, page, pageSize, sortBy, sortDir, q, status } =
    await getData(params);

  return (
    <div className="space-y-6">
      <InvitationsClient
        invitations={invitations}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={Math.max(1, Math.ceil(total / pageSize))}
        sortBy={sortBy}
        sortDir={sortDir}
        q={q}
        status={status}
        initialRoleSlug={params.role}
      />
    </div>
  );
}
