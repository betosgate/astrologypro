// Task 05 (2026-04-23): rehabilitated affiliate portal layout.
//
// Was: client-only shell reading diviner_affiliates.user_id (always null →
//      every page empty-stated into "Not registered as an affiliate").
// Now: server component that resolves the canonical affiliate_accounts row
//      via user_id, redirects unauthed + no-account users appropriately,
//      and passes the account down to a client header.
//
// Sprint: docs/tasks/2026-04-23/affiliate-identity-refactor/05-affiliate-portal.md

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAffiliateAccountByUserId } from "@/lib/affiliate-accounts";
import { AffiliateHeader } from "../_components/affiliate-header";
import { SectionContainer } from "@/components/shared/section-container";

export const dynamic = "force-dynamic";

export const metadata = { title: "Affiliate Portal — AstrologyPro" };

export default async function AffiliateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/affiliate");

  const admin = createAdminClient();
  const account = await getAffiliateAccountByUserId(admin, user.id);

  // No canonical account → route back to login with an explanation param so
  // the UI can say "no affiliate identity found for this account".
  if (!account) redirect("/login?e=no_affiliate_account");

  // Blocked / unclaimed accounts: show a read-only gate rather than
  // redirecting in a loop. Status transitions back to 'active' restore
  // access on next navigation.
  if (account.status !== "active") {
    return (
      <AccountGateShell status={account.status}>
        <p>
          Your affiliate account is currently{" "}
          <strong className="text-foreground">{account.status}</strong>.
        </p>
        {account.status === "blocked" && (
          <p>Contact support if you believe this is a mistake.</p>
        )}
        {account.status === "unclaimed" && (
          <p>
            This account hasn&rsquo;t been claimed yet. Open the invite link
            you received by email to finish setup.
          </p>
        )}
      </AccountGateShell>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AffiliateHeader
        accountName={account.name}
        accountEmail={account.email}
        avatarUrl={account.avatar_url}
      />
      <SectionContainer as="main" verticalPadding="lg">
        {children}
      </SectionContainer>
    </div>
  );
}

function AccountGateShell({
  status,
  children,
}: {
  status: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <SectionContainer className="flex items-center justify-between gap-6 py-3">
          <span className="text-sm font-semibold tracking-tight">
            Affiliate Portal
          </span>
        </SectionContainer>
      </header>
      <SectionContainer as="main" verticalPadding="lg">
        <div className="mx-auto max-w-md space-y-3 rounded-md border p-6">
          <h1 className="text-lg font-semibold">
            Affiliate account {status}
          </h1>
          <div className="space-y-2 text-sm text-muted-foreground">
            {children}
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
