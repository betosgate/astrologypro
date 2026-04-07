import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMembershipExpiryWarning } from "@/lib/email";
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const admin = createAdminClient();
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

  // Window: members whose expires_at is between now and 3 days from now
  const now = new Date().toISOString();
  const threeDaysFromNow = new Date(
    Date.now() + 3 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: members, error } = await admin
    .from("community_members")
    .select("id, email, full_name, expires_at")
    .eq("membership_status", "active")
    .gte("expires_at", now)
    .lte("expires_at", threeDaysFromNow);

  if (error) {
    console.error("[Cron] Failed to fetch community members for expiry warnings:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }

  if (!members || members.length === 0) {
    return NextResponse.json({ success: true, message: "No memberships expiring in 3 days", sent: 0 });
  }

  let sent = 0;

  for (const member of members) {
    if (!member.email || !member.expires_at) continue;

    const expiryDate = new Date(member.expires_at).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    sendMembershipExpiryWarning({
      to: member.email,
      name: member.full_name ?? "Member",
      expiryDate,
      renewUrl: `${appUrl}/community/join`,
    }).catch((err) =>
      console.error(`[Cron] Failed to send expiry warning to ${member.email}:`, err)
    );

    sent++;
  }

  return NextResponse.json({ success: true, sent });
}
