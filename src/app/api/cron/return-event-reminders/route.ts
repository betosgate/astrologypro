import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronAuth } from "@/lib/cron-auth";
import {
  computeSaturnReturns,
  computeJupiterReturns,
  computeSolarReturn,
  type ReturnEventType,
} from "@/lib/return-events";
import {
  sendSaturnReturnReminder,
  sendJupiterReturnReminder,
  sendSolarReturnReminder,
} from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/cron/return-event-reminders
 * Runs daily at 08:00 UTC.
 *
 * For each person with a birth date (clients + community_family_members):
 *   1. Compute their upcoming Saturn / Jupiter / Solar returns
 *   2. Upsert each event into lifecycle_return_events (ON CONFLICT DO NOTHING
 *      prevents duplicates for the same person + event_type + event_date)
 *   3. Query events in the reminder windows (30d / 7d / 1d / 0d from today)
 *      where the corresponding reminder has not yet been sent
 *   4. Send the appropriate email and mark the sent column
 *
 * Returns: { processed, emailsSent, errors }
 */
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const admin = createAdminClient();

  let processed = 0;
  let emailsSent = 0;
  let errors = 0;

  // -------------------------------------------------------------------------
  // Phase 1: Compute and upsert return events for all clients
  // -------------------------------------------------------------------------

  // Process in batches of 50 to avoid timeout
  const BATCH_SIZE = 50;

  let clientOffset = 0;
  while (true) {
    const { data: clients, error: clientsError } = await admin
      .from("clients")
      .select("id, birth_date")
      .not("birth_date", "is", null)
      .order("id")
      .range(clientOffset, clientOffset + BATCH_SIZE - 1);

    if (clientsError) {
      console.error("[return-event-reminders] Error fetching clients:", clientsError);
      break;
    }

    if (!clients || clients.length === 0) break;

    for (const client of clients) {
      try {
        const birthDate = new Date(client.birth_date as string);
        const events = [
          ...computeSaturnReturns(birthDate),
          ...computeJupiterReturns(birthDate),
          computeSolarReturn(birthDate),
        ];

        for (const evt of events) {
          await admin.from("lifecycle_return_events").upsert(
            {
              client_id: client.id,
              family_member_id: null,
              event_type: evt.eventType,
              event_date: evt.eventDate.toISOString().split("T")[0],
              occurrence_number: evt.occurrenceNumber,
            },
            {
              onConflict: "client_id,event_type,event_date",
              ignoreDuplicates: true,
            }
          );
        }

        processed++;
      } catch (err) {
        console.error("[return-event-reminders] Error processing client", client.id, err);
        errors++;
      }
    }

    if (clients.length < BATCH_SIZE) break;
    clientOffset += BATCH_SIZE;
  }

  // -------------------------------------------------------------------------
  // Phase 2: Compute and upsert return events for community_family_members
  // -------------------------------------------------------------------------

  let familyOffset = 0;
  while (true) {
    const { data: familyMembers, error: familyError } = await admin
      .from("community_family_members")
      .select("id, date_of_birth")
      .not("date_of_birth", "is", null)
      .order("id")
      .range(familyOffset, familyOffset + BATCH_SIZE - 1);

    if (familyError) {
      console.error("[return-event-reminders] Error fetching family members:", familyError);
      break;
    }

    if (!familyMembers || familyMembers.length === 0) break;

    for (const fm of familyMembers) {
      try {
        const birthDate = new Date(fm.date_of_birth as string);
        const events = [
          ...computeSaturnReturns(birthDate),
          ...computeJupiterReturns(birthDate),
          computeSolarReturn(birthDate),
        ];

        for (const evt of events) {
          await admin.from("lifecycle_return_events").upsert(
            {
              client_id: null,
              family_member_id: fm.id,
              event_type: evt.eventType,
              event_date: evt.eventDate.toISOString().split("T")[0],
              occurrence_number: evt.occurrenceNumber,
            },
            {
              onConflict: "family_member_id,event_type,event_date",
              ignoreDuplicates: true,
            }
          );
        }

        processed++;
      } catch (err) {
        console.error("[return-event-reminders] Error processing family member", fm.id, err);
        errors++;
      }
    }

    if (familyMembers.length < BATCH_SIZE) break;
    familyOffset += BATCH_SIZE;
  }

  // -------------------------------------------------------------------------
  // Phase 3: Send reminders for events in the active windows
  // -------------------------------------------------------------------------
  // Query events where event_date is within today..today+30 and at least one
  // reminder is due but not yet sent. We load the event + person rows together.

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const plus30 = new Date(today);
  plus30.setDate(plus30.getDate() + 30);
  const plus30Str = plus30.toISOString().split("T")[0];

  // Include a 1-day buffer before today to catch any events missed at midnight
  const minus1 = new Date(today);
  minus1.setDate(minus1.getDate() - 1);
  const minus1Str = minus1.toISOString().split("T")[0];

  const { data: dueEvents, error: dueError } = await admin
    .from("lifecycle_return_events")
    .select("*")
    .gte("event_date", minus1Str)
    .lte("event_date", plus30Str);

  if (dueError) {
    console.error("[return-event-reminders] Error fetching due events:", dueError);
    return NextResponse.json({ processed, emailsSent, errors: errors + 1 }, { status: 500 });
  }

  for (const evt of dueEvents ?? []) {
    try {
      const eventDateObj = new Date(evt.event_date as string);
      const daysUntil = Math.round(
        (eventDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Determine which reminder window applies
      const reminderWindow = getReminderWindow(daysUntil);
      if (!reminderWindow) continue;

      // Check if this reminder was already sent
      const sentColumn = reminderSentColumn(reminderWindow);
      if (evt[sentColumn]) continue;

      // Resolve email address
      let email: string | null = null;
      let fullName: string | null = null;

      if (evt.client_id) {
        const { data: client } = await admin
          .from("clients")
          .select("email, full_name")
          .eq("id", evt.client_id)
          .single();
        email = client?.email ?? null;
        fullName = client?.full_name ?? null;
      } else if (evt.family_member_id) {
        const { data: fm } = await admin
          .from("community_family_members")
          .select("full_name, member_id")
          .eq("id", evt.family_member_id)
          .single();

        fullName = fm?.full_name ?? null;

        if (fm?.member_id) {
          const { data: owner } = await admin
            .from("community_members")
            .select("email")
            .eq("id", fm.member_id)
            .single();
          email = owner?.email ?? null;
        }
      }

      if (!email) continue;

      const name = fullName ?? "Friend";
      const formattedDate = eventDateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const eventType = evt.event_type as ReturnEventType;

      // Send the appropriate email
      const landingUrl = landingPageForEvent(eventType);

      if (eventType === "saturn_return") {
        await sendSaturnReturnReminder({
          to: email,
          name,
          eventDate: formattedDate,
          daysUntil,
          occurrenceNumber: evt.occurrence_number as number,
          landingPageUrl: landingUrl,
        });
      } else if (eventType === "jupiter_return") {
        await sendJupiterReturnReminder({
          to: email,
          name,
          eventDate: formattedDate,
          daysUntil,
          occurrenceNumber: evt.occurrence_number as number,
          landingPageUrl: landingUrl,
        });
      } else if (eventType === "solar_return") {
        await sendSolarReturnReminder({
          to: email,
          name,
          eventDate: formattedDate,
          daysUntil,
          landingPageUrl: landingUrl,
        });
      }

      // Mark reminder as sent
      await admin
        .from("lifecycle_return_events")
        .update({ [sentColumn]: new Date().toISOString() })
        .eq("id", evt.id);

      emailsSent++;
    } catch (err) {
      console.error("[return-event-reminders] Error sending reminder for event", evt.id, err);
      errors++;
    }
  }

  console.log(
    `[return-event-reminders] processed=${processed} emailsSent=${emailsSent} errors=${errors}`
  );

  return NextResponse.json({ processed, emailsSent, errors });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type ReminderWindow = "30d" | "7d" | "1d" | "0d";

function getReminderWindow(daysUntil: number): ReminderWindow | null {
  // Day of (0 days, allow -1 for timezone drift)
  if (daysUntil <= 0 && daysUntil >= -1) return "0d";
  if (daysUntil === 1) return "1d";
  if (daysUntil >= 6 && daysUntil <= 8) return "7d";
  if (daysUntil >= 28 && daysUntil <= 31) return "30d";
  return null;
}

function reminderSentColumn(window: ReminderWindow): string {
  switch (window) {
    case "30d": return "reminder_30d_sent_at";
    case "7d":  return "reminder_7d_sent_at";
    case "1d":  return "reminder_1d_sent_at";
    case "0d":  return "reminder_day_of_sent_at";
  }
}

function landingPageForEvent(type: ReturnEventType): string {
  switch (type) {
    case "saturn_return":  return "/readings/saturn-return";
    case "jupiter_return": return "/readings/jupiter-return";
    case "solar_return":   return "/readings/solar-return";
  }
}
