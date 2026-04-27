import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAffiliateShareWithinCap } from "@/lib/affiliate-share-cap";

export const dynamic = "force-dynamic";

// GET /api/dashboard/affiliates/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  // Resolve diviner record for ownership check
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Not a diviner" },
      { status: 403 }
    );
  }

  const { data, error } = await admin
    .from("diviner_affiliates")
    .select(
      `id, diviner_id, user_id, name, email, phone, status, notes,
       default_commission_type, default_commission_value,
       affiliate_account_id, invited_at, accepted_at,
       created_at, updated_at,
       account:affiliate_accounts (
         id, user_id, email, name, phone, avatar_url, status, tax_form_status
       )`
    )
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Affiliate not found" },
      { status: 404 }
    );
  }

  // Additive canonical fields + partnership_count + latest_invite. Response
  // shape stays backward-compatible — existing UI callers read name/email/
  // phone/user_id/status from the top level.
  const row = data as unknown as {
    id: string;
    diviner_id: string;
    user_id: string | null;
    name: string | null;
    email: string | null;
    phone: string | null;
    status: string;
    notes: string | null;
    default_commission_type: string | null;
    default_commission_value: number | null;
    affiliate_account_id: string | null;
    invited_at: string | null;
    accepted_at: string | null;
    created_at: string;
    updated_at: string;
    account: {
      id: string;
      user_id: string | null;
      email: string;
      name: string;
      phone: string | null;
      avatar_url: string | null;
      status: string;
      tax_form_status: string;
    } | null;
  };

  // Count how many OTHER diviners partner with this same canonical account
  let partnershipCount = 0;
  if (row.affiliate_account_id) {
    const { count } = await admin
      .from("diviner_affiliates")
      .select("*", { count: "exact", head: true })
      .eq("affiliate_account_id", row.affiliate_account_id)
      .neq("id", row.id);
    partnershipCount = count ?? 0;
  }

  // Latest non-consumed invite for pending rows
  let latestInvite: {
    id: string;
    expires_at: string;
    revoked_at: string | null;
    resent_count: number;
    created_at: string;
  } | null = null;
  if (row.status === "pending") {
    const { data: inv } = await admin
      .from("affiliate_invites")
      .select("id, expires_at, revoked_at, resent_count, created_at")
      .eq("junction_id", row.id)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    latestInvite = inv
      ? {
          id: inv.id,
          expires_at: inv.expires_at,
          revoked_at: inv.revoked_at,
          resent_count: inv.resent_count ?? 0,
          created_at: inv.created_at,
        }
      : null;
  }

  // Flatten canonical fields into top-level (prefer account when present)
  const flat = {
    id: row.id,
    diviner_id: row.diviner_id,
    status: row.status,
    notes: row.notes,
    default_commission_type: row.default_commission_type,
    default_commission_value: row.default_commission_value,
    created_at: row.created_at,
    updated_at: row.updated_at,
    invited_at: row.invited_at,
    accepted_at: row.accepted_at,
    // Preferred canonical, fallback to legacy
    name: row.account?.name ?? row.name ?? "",
    email: row.account?.email ?? row.email ?? "",
    phone: row.account?.phone ?? row.phone ?? null,
    user_id: row.account?.user_id ?? row.user_id ?? null,
    // Additive canonical fields
    affiliate_account_id: row.account?.id ?? row.affiliate_account_id ?? null,
    avatar_url: row.account?.avatar_url ?? null,
    account_status: row.account?.status ?? null,
    tax_form_status: row.account?.tax_form_status ?? null,
    // Task-04 specific
    partnership_count: partnershipCount,
    latest_invite: latestInvite,
  };

  return NextResponse.json({ data: flat });
}

// PATCH /api/dashboard/affiliates/[id]
// Diviner can update notes, commission settings, status (within allowed transitions)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Invalid JSON body" },
      { status: 422 }
    );
  }

  const { notes, default_commission_type, default_commission_value, status } =
    body as Record<string, unknown>;

  const admin = createAdminClient();

  // Resolve diviner record
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Not a diviner" },
      { status: 403 }
    );
  }

  // Verify ownership
  const { data: existing } = await admin
    .from("diviner_affiliates")
    .select("id")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .single();

  if (!existing) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Affiliate not found" },
      { status: 404 }
    );
  }

  const allowedStatuses = ["active", "suspended", "blocked"];
  if (status !== undefined && !allowedStatuses.includes(status as string)) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Invalid status value" },
      { status: 422 }
    );
  }

  try {
    await assertAffiliateShareWithinCap({
      commissionType: default_commission_type,
      commissionValue: default_commission_value,
    });
  } catch (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Validation error", detail: error instanceof Error ? error.message : "Affiliate share exceeds allowed cap." },
      { status: 422 }
    );
  }

  const updatePayload: Record<string, unknown> = {};
  if (typeof notes === "string") updatePayload.notes = notes.trim() || null;
  if (typeof default_commission_type === "string") updatePayload.default_commission_type = default_commission_type;
  if (typeof default_commission_value === "number") updatePayload.default_commission_value = default_commission_value;
  if (typeof status === "string") updatePayload.status = status;

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "No updatable fields provided" },
      { status: 422 }
    );
  }

  const { data, error } = await admin
    .from("diviner_affiliates")
    .update(updatePayload)
    .eq("id", id)
    .select("id, name, email, status, notes, default_commission_type, default_commission_value, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}
