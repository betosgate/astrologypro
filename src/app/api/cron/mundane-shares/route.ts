import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { sendSMS } from "@/lib/sms";
import { APP_URL } from "@/lib/constants";
import { getMundaneEventsForDate, selectDailyEvents } from "@/lib/mundane-events";
import { generateMundaneContent, EventType } from "@/lib/mundane-content";
import { verifyCronAuth } from "@/lib/cron-auth";

function generateToken(): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function getUTCDateString(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const shareNumber = parseInt(searchParams.get("n") ?? "1", 10) === 2 ? 2 : 1;

  const now = new Date();
  const shareDate = getUTCDateString(now);
  const dateStr = formatDateLabel(now);

  const admin = createAdminClient();

  try {
    // --- 1. Check deduplication: was this share number already sent today? ---
    const { count: alreadySentCount, error: dedupError } = await admin
      .from("share_batches")
      .select("id", { count: "exact", head: true })
      .eq("share_date", shareDate)
      .eq("share_number", shareNumber)
      .eq("is_mundane", true);

    if (dedupError) {
      console.error("[Mundane Shares] Dedup check error:", dedupError);
      return NextResponse.json({ error: "Dedup check failed" }, { status: 500 });
    }

    if (alreadySentCount && alreadySentCount > 0) {
      return NextResponse.json({
        success: true,
        message: `Share ${shareNumber} for ${shareDate} already sent`,
        sent: 0,
      });
    }

    // --- 2. Get mundane events for today ---
    const allEvents = await getMundaneEventsForDate(now);

    if (!allEvents || allEvents.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No notable events today",
        sent: 0,
      });
    }

    // --- 3. Check deduplication against mundane_event_log for ingress/retrograde events ---
    const eventKeys = allEvents
      .filter((e) => e.event_key)
      .map((e) => e.event_key as string);

    let activeEventKeys: string[] = [];
    if (eventKeys.length > 0) {
      const { data: activeLogEntries } = await admin
        .from("mundane_event_log")
        .select("event_key")
        .in("event_key", eventKeys)
        .eq("active", true);

      activeEventKeys = (activeLogEntries ?? []).map((r) => r.event_key as string);
    }

    // --- 4. Select the event for this share number ---
    const selectedEvents = selectDailyEvents(allEvents, new Set(activeEventKeys));

    if (!selectedEvents || selectedEvents.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No notable events today",
        sent: 0,
      });
    }

    // share 1 → index 0, share 2 → index 1 (fall back to index 0 if only one event)
    const eventIndex = shareNumber === 2 ? Math.min(1, selectedEvents.length - 1) : 0;
    const selectedEvent = selectedEvents[eventIndex];

    // --- 5. Check / create event in mundane_event_log ---
    const { data: existingLog, error: logFetchError } = await admin
      .from("mundane_event_log")
      .select("*")
      .eq("event_key", selectedEvent.event_key)
      .maybeSingle();

    if (logFetchError) {
      console.error("[Mundane Shares] Failed to fetch event log:", logFetchError);
      return NextResponse.json({ error: "Event log fetch failed" }, { status: 500 });
    }

    let mundaneEventId: string;
    let content: { description: string; hashtags: string };
    let imageStorageUrl: string | null = null;

    if (!existingLog) {
      // Generate content and insert new log entry
      content = await generateMundaneContent(selectedEvent.event_label, selectedEvent.event_type as EventType);

      const { data: newLog, error: insertLogError } = await admin
        .from("mundane_event_log")
        .insert({
          event_key: selectedEvent.event_key,
          event_label: selectedEvent.event_label,
          event_type: selectedEvent.event_type,
          image_filename: selectedEvent.image_filename,
          image_storage_url: `https://wyluvclvtvwptsvvtgkv.supabase.co/storage/v1/object/public/mundane-images/${encodeURIComponent(selectedEvent.image_filename)}`,
          content_short: content.description,
          hashtags: content.hashtags,
          active: true,
          sent_count: 0,
          event_start_date: shareDate,
        })
        .select()
        .single();

      if (insertLogError || !newLog) {
        console.error("[Mundane Shares] Failed to insert event log:", insertLogError);
        return NextResponse.json({ error: "Event log insert failed" }, { status: 500 });
      }

      mundaneEventId = newLog.id as string;
      imageStorageUrl = newLog.image_storage_url as string | null ?? null;
    } else {
      // Reuse existing log entry (active or inactive — aspects may repeat)
      mundaneEventId = existingLog.id as string;
      content = {
        description: existingLog.content_short as string,
        hashtags: existingLog.hashtags as string,
      };
      imageStorageUrl = existingLog.image_storage_url as string | null ?? null;
    }

    // --- 6. Fetch all active diviners with notifications enabled ---
    const { data: diviners, error: divinerError } = await admin
      .from("diviners")
      .select("id, user_id, username, display_name, phone, share_notifications_enabled")
      .eq("is_active", true)
      .eq("share_notifications_enabled", true);

    if (divinerError) {
      console.error("[Mundane Shares] Failed to fetch diviners:", divinerError);
      return NextResponse.json({ error: "Failed to fetch diviners" }, { status: 500 });
    }

    if (!diviners || diviners.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active diviners with notifications enabled",
        sent: 0,
      });
    }

    // Build email map from auth users
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

    const results: Array<{
      diviner: string;
      token: string;
      email: boolean;
      sms: boolean;
      affiliates: number;
    }> = [];

    for (const diviner of diviners) {
      // --- 7. Generate composited image and upload to Supabase Storage ---
      // Pre-uploading gives Facebook/LinkedIn a clean static URL for og:image
      let staticImageUrl: string | null = null;
      if (imageStorageUrl) {
        try {
          const dynamicUrl = `${APP_URL}/api/mundane/image?img=${encodeURIComponent(imageStorageUrl)}&user=${encodeURIComponent(diviner.username)}`;
          const imgRes = await fetch(dynamicUrl);
          if (imgRes.ok) {
            const imgBuffer = await imgRes.arrayBuffer();
            const imgPath = `shares/${diviner.username}-${shareDate}-${shareNumber}.jpg`;
            const { error: uploadErr } = await admin.storage
              .from("mundane-images")
              .upload(imgPath, imgBuffer, {
                contentType: "image/jpeg",
                upsert: true,
              });
            if (!uploadErr) {
              staticImageUrl = `https://wyluvclvtvwptsvvtgkv.supabase.co/storage/v1/object/public/mundane-images/${imgPath}`;
            }
          }
        } catch (imgErr) {
          console.error(`[Mundane Shares] Image upload failed for ${diviner.username}:`, imgErr);
        }
      }
      const compositedUrl = staticImageUrl
        ?? (imageStorageUrl ? `${APP_URL}/api/mundane/image?img=${encodeURIComponent(imageStorageUrl)}&user=${encodeURIComponent(diviner.username)}` : null);

      // --- 8. Build caption ---
      const EVENT_EMOJI: Record<string, string> = {
        ingress: '✨', retrograde: '🔄', direct: '⬆️', aspect: '⚡',
      };
      const emoji = EVENT_EMOJI[selectedEvent.event_type] ?? '🌟';
      const caption = `${emoji} ${selectedEvent.event_label}\n\n${content.description}\n\n${content.hashtags}\n\n🔮 Book a reading: https://astrologypro.com/${diviner.username}`;

      // --- 9. Build tracking URL ---
      const trackingUrl = `${APP_URL}/${diviner.username}`;

      // --- 10. Generate token and create share_batches row for diviner ---
      const token = generateToken();
      const shareUrl = `${APP_URL}/share/${token}`;

      const divinerEmail = emailMap.get(diviner.user_id);

      const { error: insertError } = await admin.from("share_batches").insert({
        diviner_id: diviner.id,
        token,
        caption,
        image_url: compositedUrl,
        tracking_url: trackingUrl,
        sent_at: new Date().toISOString(),
        share_number: shareNumber,
        share_date: shareDate,
        is_mundane: true,
        mundane_event_id: mundaneEventId,
        recipient_email: divinerEmail ?? null,
        recipient_name: diviner.display_name,
        diviner_username: diviner.username,
      });

      // Pre-warm the share page cache so Facebook's scraper gets a fast response
      fetch(shareUrl, { headers: { "User-Agent": "AstrologyPro-CacheWarm/1.0" } }).catch(() => {});

      if (insertError) {
        console.error(
          `[Mundane Shares] Failed to create batch for ${diviner.username}:`,
          insertError
        );
        continue;
      }

      let emailSent = false;
      let smsSent = false;

      // --- 11. Send email to diviner ---
      if (divinerEmail) {
        try {
          await sendEmail({
            to: divinerEmail,
            subject: `Your Share ${shareNumber} for ${dateStr} is Ready — ${selectedEvent.event_label}`,
            html: buildEmailHtml({
              shareNumber,
              dateStr,
              eventLabel: selectedEvent.event_label,
              description: content.description,
              compositedUrl,
              caption,
              shareUrl,
              recipientName: diviner.display_name,
            }),
          });
          emailSent = true;
        } catch (err) {
          console.error(
            `[Mundane Shares] Failed to send email to ${divinerEmail}:`,
            err
          );
        }
      }

      // --- 12. Send SMS to diviner ---
      if (diviner.phone) {
        try {
          await sendSMS({
            to: diviner.phone,
            body: `Your Share ${shareNumber} for ${dateStr} — ${selectedEvent.event_label}: ${shareUrl}`,
          });
          smsSent = true;
        } catch (err) {
          console.error(
            `[Mundane Shares] Failed to send SMS to ${diviner.phone}:`,
            err
          );
        }
      }

      // Update sent flags on diviner row
      await admin
        .from("share_batches")
        .update({ sent_via_email: emailSent, sent_via_sms: smsSent })
        .eq("token", token);

      // --- 13. Send to affiliates ---
      const { data: affiliates } = await admin
        .from("affiliates")
        .select("id, name, email, phone")
        .eq("diviner_id", diviner.id)
        .eq("is_active", true);

      let affiliateSentCount = 0;

      if (affiliates && affiliates.length > 0) {
        for (const affiliate of affiliates) {
          const affiliateToken = generateToken();
          const affiliateShareUrl = `${APP_URL}/share/${affiliateToken}`;

          const { error: affInsertError } = await admin.from("share_batches").insert({
            diviner_id: diviner.id,
            token: affiliateToken,
            caption,
            image_url: compositedUrl,
            tracking_url: trackingUrl,
            sent_at: new Date().toISOString(),
            share_number: shareNumber,
            share_date: shareDate,
            is_mundane: true,
            mundane_event_id: mundaneEventId,
            affiliate_id: affiliate.id,
            recipient_email: affiliate.email ?? null,
            recipient_name: affiliate.name,
            diviner_username: diviner.username,
          });

          if (affInsertError) {
            console.error(
              `[Mundane Shares] Failed to create affiliate batch for ${affiliate.name}:`,
              affInsertError
            );
            continue;
          }

          let affEmailSent = false;
          let affSmsSent = false;

          if (affiliate.email) {
            try {
              await sendEmail({
                to: affiliate.email,
                subject: `Your Share ${shareNumber} for ${dateStr} is Ready — ${selectedEvent.event_label}`,
                html: buildEmailHtml({
                  shareNumber,
                  dateStr,
                  eventLabel: selectedEvent.event_label,
                  description: content.description,
                  compositedUrl,
                  caption,
                  shareUrl: affiliateShareUrl,
                  recipientName: affiliate.name,
                }),
              });
              affEmailSent = true;
              affiliateSentCount++;
            } catch (err) {
              console.error(
                `[Mundane Shares] Failed to send email to affiliate ${affiliate.email}:`,
                err
              );
            }
          }

          if (affiliate.phone) {
            try {
              await sendSMS({
                to: affiliate.phone,
                body: `Your Share ${shareNumber} for ${dateStr} — ${selectedEvent.event_label}: ${affiliateShareUrl}`,
              });
              affSmsSent = true;
            } catch (err) {
              console.error(
                `[Mundane Shares] Failed to send SMS to affiliate ${affiliate.phone}:`,
                err
              );
            }
          }

          await admin
            .from("share_batches")
            .update({ sent_via_email: affEmailSent, sent_via_sms: affSmsSent })
            .eq("token", affiliateToken);
        }
      }

      results.push({
        diviner: diviner.username,
        token,
        email: emailSent,
        sms: smsSent,
        affiliates: affiliateSentCount,
      });
    }

    // --- 14. Increment sent_count on the mundane_event_log entry ---
    await admin
      .from("mundane_event_log")
      .update({ sent_count: (existingLog?.sent_count ?? 0) + 1 })
      .eq("id", mundaneEventId);

    return NextResponse.json({
      success: true,
      shareNumber,
      shareDate,
      event: selectedEvent.event_label,
      sent: results.length,
      results,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[Mundane Shares] Uncaught error:", msg, stack);
    return NextResponse.json({ error: "Internal server error", detail: msg }, { status: 500 });
  }
}

// --- Email template builder ---

interface EmailHtmlOptions {
  shareNumber: number;
  dateStr: string;
  eventLabel: string;
  description: string;
  compositedUrl: string | null;
  caption: string;
  shareUrl: string;
  recipientName: string;
}

function buildEmailHtml({
  shareNumber,
  dateStr,
  eventLabel,
  description,
  compositedUrl,
  caption,
  shareUrl,
  recipientName,
}: EmailHtmlOptions): string {
  const imageBlock = compositedUrl
    ? `<img src="${compositedUrl}" alt="${eventLabel}" style="width:100%;border-radius:8px;margin:16px 0;display:block;" />`
    : "";

  const escapedCaption = caption
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fafafa;padding:32px;border-radius:12px;">

  <!-- Header -->
  <div style="text-align:center;margin-bottom:24px;">
    <p style="font-size:13px;color:#a1a1aa;margin:0 0 6px;">AstrologyPro</p>
    <h1 style="font-size:22px;margin:0 0 6px;font-weight:700;">Your Share ${shareNumber} for ${dateStr}</h1>
    <p style="color:#a1a1aa;font-size:14px;margin:0;">Hi ${recipientName}, your branded content is ready to share!</p>
  </div>

  <!-- Gold badge -->
  <div style="text-align:center;margin-bottom:20px;">
    <span style="display:inline-block;background:#78350f;color:#fbbf24;font-size:12px;font-weight:700;padding:4px 14px;border-radius:999px;letter-spacing:0.05em;">
      Share ${shareNumber} of 2 &nbsp;|&nbsp; ${dateStr}
    </span>
  </div>

  <!-- Event title -->
  <div style="text-align:center;margin-bottom:16px;">
    <p style="font-size:18px;font-weight:700;color:#fbbf24;margin:0;">${eventLabel}</p>
  </div>

  <!-- Description -->
  <div style="background:#18181b;border-radius:8px;padding:16px;margin-bottom:16px;">
    <p style="font-size:14px;line-height:1.7;margin:0;color:#e4e4e7;">${description}</p>
  </div>

  <!-- Composited image -->
  ${imageBlock}

  <!-- Caption box -->
  <div style="background:#18181b;border-radius:8px;padding:16px;margin-bottom:20px;border:1px solid #27272a;">
    <p style="font-size:11px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px;">Your Caption — Copy &amp; Paste</p>
    <p style="font-size:13px;line-height:1.7;margin:0;color:#fafafa;white-space:pre-wrap;">${escapedCaption}</p>
  </div>

  <!-- CTA button -->
  <div style="text-align:center;margin-bottom:20px;">
    <a href="${shareUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">
      Open Share Tool &rarr;
    </a>
  </div>

  <!-- Instagram / TikTok tip -->
  ${compositedUrl ? `
  <div style="background:#1c1917;border:1px solid #292524;border-radius:8px;padding:14px;margin-bottom:14px;">
    <p style="font-size:13px;margin:0;color:#d4d4d8;">
      <strong style="color:#fbbf24;">&#128248; Instagram &amp; TikTok:</strong>
      Download the image above — your URL is already embedded in the bottom strip.
    </p>
  </div>
  ` : ""}

  <!-- Other platforms tip -->
  <div style="background:#1c1917;border:1px solid #292524;border-radius:8px;padding:14px;margin-bottom:24px;">
    <p style="font-size:13px;margin:0;color:#d4d4d8;">
      <strong style="color:#a78bfa;">Twitter, Facebook, LinkedIn:</strong>
      Share the link below — your URL is in the caption.
    </p>
  </div>

  <!-- Footer -->
  <div style="text-align:center;">
    <p style="font-size:11px;color:#52525b;margin:0;">Powered by AstrologyPro &mdash; <a href="https://astrologypro.com" style="color:#52525b;">astrologypro.com</a></p>
  </div>

</div>
  `.trim();
}
