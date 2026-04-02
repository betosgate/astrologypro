import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { sendSMS } from "@/lib/sms";
import { APP_URL } from "@/lib/constants";

function generateToken(): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const results: Array<{ diviner: string; token: string; email: boolean; sms: boolean }> = [];

  try {
    // Fetch all active diviners with notifications enabled
    const { data: diviners, error: divinerError } = await admin
      .from("diviners")
      .select("id, user_id, username, display_name, phone, share_notifications_enabled")
      .eq("is_active", true)
      .eq("share_notifications_enabled", true);

    if (divinerError) {
      console.error("[Weekly Content] Failed to fetch diviners:", divinerError);
      return NextResponse.json(
        { error: "Failed to fetch diviners" },
        { status: 500 }
      );
    }

    if (!diviners || diviners.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active diviners with notifications enabled",
        sent: 0,
      });
    }

    // Fetch active marketing content templates
    const { data: contentTemplates, error: contentError } = await admin
      .from("marketing_content")
      .select("*")
      .eq("is_active", true);

    if (contentError || !contentTemplates || contentTemplates.length === 0) {
      console.error("[Weekly Content] No content templates found:", contentError);
      return NextResponse.json(
        { error: "No content templates available" },
        { status: 500 }
      );
    }

    // Get diviner emails via auth users
    const userIds = diviners.map((d) => d.user_id);
    const { data: authUsers } = await admin.auth.admin.listUsers();
    const emailMap = new Map<string, string>();
    if (authUsers?.users) {
      for (const user of authUsers.users) {
        if (userIds.includes(user.id) && user.email) {
          emailMap.set(user.id, user.email);
        }
      }
    }

    for (const diviner of diviners) {
      // Pick a random content template
      const template =
        contentTemplates[Math.floor(Math.random() * contentTemplates.length)];

      // Build tracking URL
      const trackingUrl = `${APP_URL}/${diviner.username}?utm_source=social&utm_medium=share&utm_campaign=weekly`;

      // Generate personalized caption
      const caption = template.caption_template
        .replace(/\{username\}/g, diviner.username)
        .replace(/\{link\}/g, trackingUrl);

      // Generate unique token
      const token = generateToken();

      // Create share batch record
      const { error: insertError } = await admin
        .from("share_batches")
        .insert({
          diviner_id: diviner.id,
          content_id: template.id,
          token,
          caption,
          image_url: template.image_url ?? null,
          tracking_url: trackingUrl,
          sent_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error(
          `[Weekly Content] Failed to create batch for ${diviner.username}:`,
          insertError
        );
        continue;
      }

      const shareUrl = `${APP_URL}/share/${token}`;
      let emailSent = false;
      let smsSent = false;

      // Send email notification
      const divinerEmail = emailMap.get(diviner.user_id);
      if (divinerEmail) {
        try {
          await sendEmail({
            to: divinerEmail,
            subject: "Your weekly content is ready to share!",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fafafa; padding: 32px; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <p style="font-size: 14px; color: #a1a1aa; margin: 0;">AstrologyPro</p>
                  <h1 style="font-size: 24px; margin: 8px 0;">Your Weekly Content is Ready</h1>
                  <p style="color: #a1a1aa;">Hi ${diviner.display_name}, your branded content is ready to share!</p>
                </div>
                <div style="background: #18181b; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <p style="font-size: 14px; line-height: 1.6; margin: 0;">${caption}</p>
                </div>
                <div style="text-align: center; margin-top: 24px;">
                  <a href="${shareUrl}" style="display: inline-block; background: #7c3aed; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                    Share Now &rarr;
                  </a>
                  <p style="color: #71717a; font-size: 12px; margin-top: 16px;">
                    Share to all your social platforms in 30 seconds
                  </p>
                </div>
              </div>
            `,
          });
          emailSent = true;
        } catch (err) {
          console.error(
            `[Weekly Content] Failed to send email to ${divinerEmail}:`,
            err
          );
        }
      }

      // Send SMS notification
      if (diviner.phone) {
        try {
          await sendSMS({
            to: diviner.phone,
            body: `Your weekly content is ready! Share to your socials in 30 sec: ${shareUrl}`,
          });
          smsSent = true;
        } catch (err) {
          console.error(
            `[Weekly Content] Failed to send SMS to ${diviner.phone}:`,
            err
          );
        }
      }

      // Update sent flags
      await admin
        .from("share_batches")
        .update({
          sent_via_email: emailSent,
          sent_via_sms: smsSent,
        })
        .eq("token", token);

      results.push({
        diviner: diviner.username,
        token,
        email: emailSent,
        sms: smsSent,
      });
    }

    return NextResponse.json({
      success: true,
      sent: results.length,
      results,
    });
  } catch (err) {
    console.error("[Weekly Content] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
