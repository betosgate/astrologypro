import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { formatCurrency } from "@/lib/format";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - 7);
  const lastWeekStart = new Date(now);
  lastWeekStart.setDate(now.getDate() - 14);

  const thisWeekISO = thisWeekStart.toISOString();
  const lastWeekISO = lastWeekStart.toISOString();
  const nowISO = now.toISOString();

  // Fetch all active diviners
  const { data: diviners, error: divinersError } = await supabase
    .from("diviners")
    .select("id, display_name, username, notification_email")
    .eq("onboarding_completed", true);

  if (divinersError || !diviners) {
    console.error("[Weekly Digest] Failed to fetch diviners:", divinersError);
    return NextResponse.json(
      { error: "Failed to fetch diviners" },
      { status: 500 }
    );
  }

  let sent = 0;
  let failed = 0;

  for (const diviner of diviners) {
    try {
      // Get the diviner's email from auth
      const { data: authUser } = await supabase
        .from("diviners")
        .select("user_id")
        .eq("id", diviner.id)
        .single();

      if (!authUser) continue;

      const { data: userData } = await supabase.auth.admin.getUserById(
        authUser.user_id
      );
      const email = userData?.user?.email;
      if (!email) continue;

      // Fetch this week's stats
      const [
        thisWeekBookings,
        lastWeekBookings,
        thisWeekCompleted,
        lastWeekCompleted,
        thisWeekNewClients,
        lastWeekNewClients,
        allTimeRevenue,
        trackingClicks,
      ] = await Promise.all([
        // This week bookings
        supabase
          .from("bookings")
          .select("id, base_price, status, services(name)", { count: "exact" })
          .eq("diviner_id", diviner.id)
          .gte("created_at", thisWeekISO)
          .lte("created_at", nowISO),
        // Last week bookings
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("diviner_id", diviner.id)
          .gte("created_at", lastWeekISO)
          .lt("created_at", thisWeekISO),
        // This week completed
        supabase
          .from("bookings")
          .select("id, base_price", { count: "exact" })
          .eq("diviner_id", diviner.id)
          .eq("status", "completed")
          .gte("created_at", thisWeekISO)
          .lte("created_at", nowISO),
        // Last week completed
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("diviner_id", diviner.id)
          .eq("status", "completed")
          .gte("created_at", lastWeekISO)
          .lt("created_at", thisWeekISO),
        // This week new clients
        supabase
          .from("client_diviners")
          .select("id", { count: "exact", head: true })
          .eq("diviner_id", diviner.id)
          .gte("created_at", thisWeekISO)
          .lte("created_at", nowISO),
        // Last week new clients
        supabase
          .from("client_diviners")
          .select("id", { count: "exact", head: true })
          .eq("diviner_id", diviner.id)
          .gte("created_at", lastWeekISO)
          .lt("created_at", thisWeekISO),
        // All time revenue
        supabase
          .from("bookings")
          .select("base_price")
          .eq("diviner_id", diviner.id)
          .eq("status", "completed"),
        // Tracking link clicks this week
        supabase
          .from("tracking_links")
          .select("clicks")
          .eq("diviner_id", diviner.id),
      ]);

      const thisWeekRevenue =
        thisWeekCompleted.data?.reduce(
          (sum, b) => sum + (b.base_price ?? 0),
          0
        ) ?? 0;
      const thisWeekBookingCount = thisWeekBookings.count ?? 0;
      const lastWeekBookingCount = lastWeekBookings.count ?? 0;
      const thisWeekCompletedCount = thisWeekCompleted.count ?? 0;
      const lastWeekCompletedCount = lastWeekCompleted.count ?? 0;
      const thisWeekNewClientCount = thisWeekNewClients.count ?? 0;
      const lastWeekNewClientCount = lastWeekNewClients.count ?? 0;

      const totalRevenue =
        allTimeRevenue.data?.reduce(
          (sum, b) => sum + (b.base_price ?? 0),
          0
        ) ?? 0;

      const totalClicks =
        trackingClicks.data?.reduce((sum, l) => sum + (l.clicks ?? 0), 0) ??
        0;

      // Top performing service
      const serviceCounts: Record<string, number> = {};
      if (thisWeekBookings.data) {
        for (const b of thisWeekBookings.data) {
          const name = (b.services as any)?.name ?? "Unknown";
          serviceCounts[name] = (serviceCounts[name] ?? 0) + 1;
        }
      }
      const topService =
        Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
        null;

      // Calculate completion rate
      const completionRate =
        thisWeekBookingCount > 0
          ? Math.round(
              (thisWeekCompletedCount / thisWeekBookingCount) * 100
            )
          : 0;

      // Trend helpers
      function trendArrow(current: number, previous: number): string {
        if (current > previous)
          return `<span style="color: #22c55e;">&#9650; +${current - previous}</span>`;
        if (current < previous)
          return `<span style="color: #ef4444;">&#9660; -${previous - current}</span>`;
        return `<span style="color: #a1a1aa;">&#8212; same</span>`;
      }

      // Suggested action
      let suggestedAction = "";
      if (thisWeekBookingCount === 0) {
        suggestedAction =
          "Share your page on social media to start getting bookings this week.";
      } else if (completionRate < 70 && thisWeekBookingCount > 2) {
        suggestedAction =
          "Add more testimonials to your page to improve client confidence and conversion.";
      } else if (
        thisWeekBookingCount > lastWeekBookingCount &&
        thisWeekBookingCount >= 3
      ) {
        suggestedAction =
          "Your bookings are growing! Consider raising your prices to match the demand.";
      } else {
        suggestedAction =
          "Keep up the great work! Try sharing a recent testimonial on social media.";
      }

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #e4e4e7; background: #18181b; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 32px 24px;">
            <h1 style="margin: 0; font-size: 24px; color: #fff;">Your Week in Review</h1>
            <p style="margin: 8px 0 0; font-size: 14px; color: #c4b5fd;">Hi ${diviner.display_name}, here is how your practice performed this week.</p>
          </div>

          <div style="padding: 24px;">
            <!-- Stats grid -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 12px; background: #27272a; border-radius: 8px; text-align: center; width: 25%;">
                  <div style="font-size: 24px; font-weight: bold; color: #fff;">${formatCurrency(thisWeekRevenue)}</div>
                  <div style="font-size: 11px; color: #a1a1aa; margin-top: 4px;">Revenue</div>
                  <div style="font-size: 11px; margin-top: 2px;">${trendArrow(thisWeekRevenue, 0)}</div>
                </td>
                <td style="width: 8px;"></td>
                <td style="padding: 12px; background: #27272a; border-radius: 8px; text-align: center; width: 25%;">
                  <div style="font-size: 24px; font-weight: bold; color: #fff;">${thisWeekBookingCount}</div>
                  <div style="font-size: 11px; color: #a1a1aa; margin-top: 4px;">Bookings</div>
                  <div style="font-size: 11px; margin-top: 2px;">${trendArrow(thisWeekBookingCount, lastWeekBookingCount)}</div>
                </td>
                <td style="width: 8px;"></td>
                <td style="padding: 12px; background: #27272a; border-radius: 8px; text-align: center; width: 25%;">
                  <div style="font-size: 24px; font-weight: bold; color: #fff;">${thisWeekNewClientCount}</div>
                  <div style="font-size: 11px; color: #a1a1aa; margin-top: 4px;">New Clients</div>
                  <div style="font-size: 11px; margin-top: 2px;">${trendArrow(thisWeekNewClientCount, lastWeekNewClientCount)}</div>
                </td>
                <td style="width: 8px;"></td>
                <td style="padding: 12px; background: #27272a; border-radius: 8px; text-align: center; width: 25%;">
                  <div style="font-size: 24px; font-weight: bold; color: #fff;">${thisWeekCompletedCount}</div>
                  <div style="font-size: 11px; color: #a1a1aa; margin-top: 4px;">Sessions</div>
                  <div style="font-size: 11px; margin-top: 2px;">${trendArrow(thisWeekCompletedCount, lastWeekCompletedCount)}</div>
                </td>
              </tr>
            </table>

            <!-- Running total -->
            <div style="background: #27272a; border-radius: 8px; padding: 16px; margin-bottom: 16px; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #a1a1aa;">Total earned on AstrologyPro</p>
              <p style="margin: 4px 0 0; font-size: 28px; font-weight: bold; color: #7c3aed;">${formatCurrency(totalRevenue)}</p>
            </div>

            ${
              topService
                ? `<div style="background: #27272a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <p style="margin: 0; font-size: 13px; color: #a1a1aa;">Top Performing Service</p>
                <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #fff;">${topService}</p>
              </div>`
                : ""
            }

            ${
              totalClicks > 0
                ? `<div style="background: #27272a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <p style="margin: 0; font-size: 13px; color: #a1a1aa;">Page Views (from tracking links)</p>
                <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #fff;">${totalClicks} clicks</p>
                ${completionRate > 0 ? `<p style="margin: 4px 0 0; font-size: 12px; color: #a1a1aa;">Session completion rate: ${completionRate}%</p>` : ""}
              </div>`
                : ""
            }

            <!-- Suggested action -->
            <div style="background: #7c3aed20; border: 1px solid #7c3aed40; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 13px; font-weight: 600; color: #c4b5fd;">Suggested Action</p>
              <p style="margin: 8px 0 0; font-size: 14px; color: #e4e4e7;">${suggestedAction}</p>
            </div>

            <a href="${appUrl}/dashboard" style="display: block; background: #7c3aed; color: #fff; padding: 14px 24px; border-radius: 8px; text-decoration: none; text-align: center; font-weight: 600; font-size: 14px;">
              View Full Dashboard &rarr;
            </a>
          </div>

          <div style="padding: 16px 24px; border-top: 1px solid #27272a;">
            <p style="margin: 0; font-size: 11px; color: #71717a; text-align: center;">
              You are receiving this because you are a diviner on AstrologyPro. Sent every Monday.
            </p>
          </div>
        </div>
      `;

      await sendEmail({
        to: email,
        subject: `Your Week in Review — ${formatCurrency(thisWeekRevenue)} earned`,
        html,
      });

      sent++;
    } catch (error) {
      console.error(
        `[Weekly Digest] Failed for diviner ${diviner.id}:`,
        error
      );
      failed++;
    }
  }

  return NextResponse.json({
    success: true,
    sent,
    failed,
    total: diviners.length,
  });
}
