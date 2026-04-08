import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const FROM_EMAIL     = process.env.RESEND_FROM_EMAIL ?? "admin@divineinfinitebeing.com";

// ─── POST /api/admin/bulk-email ───────────────────────────────────────────────
// Body: { user_ids: string[], subject: string, message: string }

export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { user_ids?: unknown; subject?: unknown; message?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 422 });
  }

  const user_ids: string[] = Array.isArray(body.user_ids)
    ? (body.user_ids as string[]).filter((id) => typeof id === "string" && id.trim())
    : [];
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (user_ids.length === 0) {
    return NextResponse.json({ error: "user_ids array is required and must not be empty" }, { status: 422 });
  }
  if (!subject) {
    return NextResponse.json({ error: "subject is required" }, { status: 422 });
  }
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 422 });
  }
  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
  }

  const admin = createAdminClient();

  // Fetch emails for the given user IDs from all role tables + auth
  const authRes = await admin.rpc("get_auth_users_by_ids", { user_ids });
  const authUsers = (authRes.data ?? []) as Array<{ user_id: string; email: string }>;

  // Build email list — auth is the authoritative source
  const emailList: Array<{ to: string; user_id: string }> = authUsers
    .filter((u) => u.email)
    .map((u) => ({ to: u.email, user_id: u.user_id }));

  if (emailList.length === 0) {
    return NextResponse.json({ error: "No valid email addresses found for the given user IDs" }, { status: 422 });
  }

  // Send via Resend in batches of 50
  const BATCH_SIZE = 50;
  let sent = 0;
  let failed = 0;

  // Plain-text to HTML conversion (preserve line breaks)
  const htmlBody = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
${message.split("\n").map((line) => `<p style="margin:0 0 12px">${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`).join("")}
<hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
<p style="font-size:12px;color:#999">This message was sent by an administrator of Divine Infinite Being.</p>
</div>`;

  for (let i = 0; i < emailList.length; i += BATCH_SIZE) {
    const batch = emailList.slice(i, i + BATCH_SIZE);
    const payload = {
      from:    FROM_EMAIL,
      to:      batch.map((e) => e.to),
      subject: subject,
      html:    htmlBody,
    };

    try {
      const resendRes = await fetch("https://api.resend.com/emails/batch", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify(
          batch.map((e) => ({
            from:    FROM_EMAIL,
            to:      [e.to],
            subject: subject,
            html:    htmlBody,
          }))
        ),
      });

      if (resendRes.ok) {
        sent += batch.length;
      } else {
        const errData = await resendRes.json().catch(() => ({}));
        console.error("[bulk-email] Resend batch error:", errData);
        failed += batch.length;
      }
    } catch (err) {
      console.error("[bulk-email] Network error:", err);
      failed += batch.length;
    }

    // Small pause between batches to respect Resend rate limits
    if (i + BATCH_SIZE < emailList.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  // Log to admin activity log
  await admin.from("admin_activity_log").insert({
    admin_user_id: adminUser.email,
    target_user_id: null,
    action_type:   "bulk_email",
    details: {
      subject,
      user_count: user_ids.length,
      sent,
      failed,
    },
  }).maybeSingle();

  return NextResponse.json({ sent, failed });
}
