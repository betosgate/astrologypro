import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCommunityRenewalReminder } from "@/lib/email";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

  // Window: members whose current_period_end is between 6 and 8 days from now
  const sixDaysFromNow = new Date(
    Date.now() + 6 * 24 * 60 * 60 * 1000
  ).toISOString();
  const eightDaysFromNow = new Date(
    Date.now() + 8 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: members, error } = await admin
    .from("community_members")
    .select("id, email, full_name, membership_type, plan_type, current_period_end")
    .eq("membership_status", "active")
    .gte("current_period_end", sixDaysFromNow)
    .lte("current_period_end", eightDaysFromNow);

  if (error) {
    console.error("[Cron] Failed to fetch community members for renewal reminders:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }

  if (!members || members.length === 0) {
    return NextResponse.json({ success: true, message: "No renewals due in 7 days", sent: 0 });
  }

  let sent = 0;

  for (const member of members) {
    if (!member.email) continue;

    const renewalDate = member.current_period_end
      ? new Date(member.current_period_end).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "soon";

    const planName =
      member.membership_type === "mystery_school"
        ? "Mystery School"
        : member.plan_type === "family"
        ? "Family Plan"
        : "Community Membership";

    sendCommunityRenewalReminder({
      to: member.email,
      name: member.full_name ?? "Member",
      renewalDate,
      amount: "See your billing portal for the exact amount",
      planName,
      billingPortalUrl: `${appUrl}/community/plan?tab=billing`,
    }).catch((err) =>
      console.error(`[Cron] Failed to send renewal reminder to ${member.email}:`, err)
    );

    sent++;
  }

  return NextResponse.json({ success: true, sent });
}
