// Task 03 — /affiliate/accept/[token]
// Public Server Component. Loads the invite by its SHA-256(token) hash and
// routes to the right view: not-found / consumed / revoked / expired /
// email-mismatch / accept form. Accept submission goes to
// POST /api/affiliate/accept.
//
// Sprint: docs/tasks/2026-04-23/affiliate-identity-refactor/03-accept-flow.md

import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAffiliateIdentityV2Enabled } from "@/lib/feature-flags";
import { AcceptScreen } from "./components/AcceptScreen";
import {
  InviteNotFoundView,
  InviteAlreadyUsedView,
  InviteRevokedView,
  InviteExpiredView,
  EmailMismatchView,
} from "./components/StateViews";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = { title: "Accept affiliate invitation — AstrologyPro" };

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function AffiliateAcceptPage({ params }: PageProps) {
  if (!isAffiliateIdentityV2Enabled()) {
    return (
      <div className="mx-auto max-w-md p-8">
        <h1 className="text-xl font-semibold">Feature not available</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The affiliate invitation flow is not enabled in this environment.
        </p>
      </div>
    );
  }

  const { token } = await params;
  if (!token || !/^[A-Za-z0-9_-]{16,64}$/.test(token)) {
    return <InviteNotFoundView />;
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const admin = createAdminClient();

  // Load invite + join display context
  const { data: invite } = await admin
    .from("affiliate_invites")
    .select(
      "id, email, expires_at, consumed_at, revoked_at, message, diviner_id, junction_id, affiliate_account_id",
    )
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!invite) return <InviteNotFoundView />;
  if (invite.consumed_at) return <InviteAlreadyUsedView />;
  if (invite.revoked_at) return <InviteRevokedView />;
  if (new Date(invite.expires_at).getTime() <= Date.now()) {
    return <InviteExpiredView />;
  }

  // Load diviner display name + commission preview
  const [{ data: diviner }, { data: junction }] = await Promise.all([
    admin.from("diviners").select("display_name, username").eq("id", invite.diviner_id).single(),
    admin
      .from("diviner_affiliates")
      .select("default_commission_type, default_commission_value")
      .eq("id", invite.junction_id)
      .single(),
  ]);

  // Determine auth state
  const supabase = await createClient();
  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser();

  // Already-linked check: does an auth user already exist for this invite email?
  const { data: canonical } = await admin
    .from("affiliate_accounts")
    .select("user_id, name")
    .eq("id", invite.affiliate_account_id)
    .maybeSingle();
  const existingAuthUser = Boolean(canonical?.user_id);

  // Mismatch branch
  if (
    sessionUser &&
    sessionUser.email &&
    sessionUser.email.toLowerCase() !== invite.email.toLowerCase()
  ) {
    return (
      <EmailMismatchView
        currentEmail={sessionUser.email}
        inviteEmail={invite.email}
      />
    );
  }

  return (
    <AcceptScreen
      token={token}
      inviteEmail={invite.email}
      inviteMessage={invite.message ?? null}
      divinerDisplayName={diviner?.display_name ?? "A diviner"}
      commissionType={junction?.default_commission_type ?? null}
      commissionValue={
        typeof junction?.default_commission_value === "number"
          ? junction.default_commission_value
          : junction?.default_commission_value
            ? Number(junction.default_commission_value)
            : null
      }
      expiresAt={invite.expires_at}
      isLoggedInAsInvitee={Boolean(sessionUser)}
      existingAuthUser={existingAuthUser}
      defaultName={canonical?.name ?? null}
    />
  );
}

