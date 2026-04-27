// /affiliate/notifications/preferences
//
// Per-kind per-channel toggles, persisted in
// `affiliate_accounts.notification_prefs` (JSONB). Defaults to all-on
// when a key is missing — see resolveAffiliatePrefs in
// src/lib/affiliate-notifications.ts.
//
// Spec: docs/specs/affiliate-commission-system.md §3.6 + §7

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAffiliateForCaller } from "@/lib/affiliate-accounts";
import {
  resolveAffiliatePrefs,
  type AffiliateNotificationKind,
} from "@/lib/affiliate-notifications";
import { PreferencesForm } from "./preferences-form";

export const dynamic = "force-dynamic";

const KINDS: Array<{
  kind: AffiliateNotificationKind;
  label: string;
  description: string;
}> = [
  {
    kind: "affiliate.assigned",
    label: "New assignment",
    description: "When a diviner assigns you a new product or profile.",
  },
  {
    kind: "affiliate.rate_changed",
    label: "Commission rate changed",
    description:
      "When a diviner edits the commission rate on one of your assignments.",
  },
  {
    kind: "affiliate.revoked",
    label: "Assignment revoked",
    description: "When a diviner ends an affiliate partnership with you.",
  },
  {
    kind: "affiliate.conversion",
    label: "Commission earned",
    description:
      "When a referred customer pays. Email arrives as a daily digest; in-app appears immediately.",
  },
  {
    kind: "affiliate.reversal",
    label: "Commission reversed",
    description:
      "When a previously earned commission is reversed (refund, dispute, manual adjustment).",
  },
  {
    kind: "admin.override.assignment_revoked",
    label: "Admin revoked your assignment",
    description: "Rare. Only used for incident response.",
  },
  {
    kind: "admin.override.campaign_archived",
    label: "Admin archived your campaign",
    description: "Rare. Only used for incident response.",
  },
];

export default async function NotificationPreferencesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/affiliate/notifications/preferences");

  const admin = createAdminClient();
  const ctx = await resolveAffiliateForCaller(admin, user.id);
  if (!ctx) redirect("/login?e=no_affiliate_account");

  const prefs = ctx.account.notification_prefs ?? {};

  const initialPrefs = Object.fromEntries(
    KINDS.map(({ kind }) => {
      const channels = resolveAffiliatePrefs(
        prefs as Record<string, unknown>,
        kind,
      );
      return [kind, channels];
    }),
  ) as Record<
    AffiliateNotificationKind,
    { email: boolean; in_app: boolean }
  >;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">
          Notification preferences
        </h1>
        <p className="text-muted-foreground">
          Pick which notification channels you want for each event. Everything
          is on by default.
        </p>
      </header>
      <PreferencesForm
        accountId={ctx.account.id}
        kinds={KINDS}
        initialPrefs={initialPrefs}
      />
    </div>
  );
}
