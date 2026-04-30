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
  const status = params.status?.trim() ?? "";
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let invitationsQuery = admin
    .from("invitations")
    .select("id, email, role_slug, status, invited_by, expires_at, resent_count, created_at", {
      count: "exact",
    })
    .order(sortBy, { ascending: sortDir === "asc", nullsFirst: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (status) {
    invitationsQuery = invitationsQuery.eq("status", status);
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

  const invitations: InvitationRow[] = (
    (filteredInvitationsRes.data ?? []) as Array<Record<string, unknown>>
  ).map((inv) => ({
    id:           inv.id as string,
    email:        inv.email as string,
    role_slug:    inv.role_slug as string,
    status:       inv.status as string,
    invited_by:   inv.invited_by as string | undefined,
    expires_at:   inv.expires_at as string | undefined,
    resent_count: inv.resent_count as number | undefined,
    created_at:   inv.created_at as string,
  }));

  return {
    invitations,
    total: filteredInvitationsRes.count ?? 0,
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
