/**
 * Client-side helpers for the diviner affiliate UI.
 *
 * All helpers POST JSON to their respective endpoints and return parsed data
 * on success or throw an Error with the server-provided detail/title on
 * failure. Callers typically wrap in toast.promise() for UX.
 *
 * Sprint: docs/tasks/2026-04-23/affiliate-identity-refactor/
 */

type ProblemResponse = {
  type?: string;
  title?: string;
  detail?: string;
  status?: number;
};

async function postJson<T>(url: string, body: unknown = {}): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as ProblemResponse & {
    data?: T;
  };
  if (!res.ok) {
    throw new Error(json.detail ?? json.title ?? `Request failed (${res.status})`);
  }
  return json.data as T;
}

// ── Invite create ──────────────────────────────────────────────────────────

export interface CreateInvitePayload {
  email: string;
  name: string;
  message?: string;
  phone?: string;
  default_commission_type?: "percentage" | "fixed";
  default_commission_value?: number;
}

export interface InviteCreateResult {
  invite_id: string;
  junction_id: string;
  affiliate_account_id: string;
  accept_url_masked: string;
  expires_at: string;
  email_delivery: "sent" | "failed";
}

export function createInvite(payload: CreateInvitePayload) {
  return postJson<InviteCreateResult>(
    "/api/dashboard/affiliates/invite",
    payload,
  );
}

// ── Invite resend (by inviteId — when we have an affiliate_invites row) ────

export interface InviteResendResult {
  invite_id: string;
  junction_id: string;
  affiliate_account_id: string;
  accept_url_masked: string;
  expires_at: string;
  resent_count: number;
  email_delivery: "sent" | "failed";
}

export function resendInvite(inviteId: string) {
  return postJson<InviteResendResult>(
    `/api/dashboard/affiliates/invite/${inviteId}/resend`,
  );
}

// ── Invite resend (by junctionId — for any pending junction) ───────────────
//
// Works for legacy-pending junctions (no prior invite row) AND for junctions
// that already have a prior invite (the RPC revokes the prior and issues a
// fresh token). Use this in UI row-actions when you don't want to branch on
// whether latest_invite exists.

export function resendInviteByJunction(junctionId: string) {
  return postJson<InviteResendResult>(
    `/api/dashboard/affiliates/invite/junction/${junctionId}/resend`,
  );
}

// ── Invite revoke ──────────────────────────────────────────────────────────

export interface InviteRevokeResult {
  invite_id: string;
  junction_id: string;
  junction_action: "deleted" | "suspended";
}

export function revokeInvite(inviteId: string) {
  return postJson<InviteRevokeResult>(
    `/api/dashboard/affiliates/invite/${inviteId}/revoke`,
  );
}

