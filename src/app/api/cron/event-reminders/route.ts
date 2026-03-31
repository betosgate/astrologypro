import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEventReminder } from "@/lib/email";

// Map event types to recommended service trigger_event slugs
const EVENT_SERVICE_MAP: Record<string, string> = {
  solar_return: "solar-return",
  saturn_return: "saturn-return",
  jupiter_return: "jupiter-return",
};

// Compelling email subject lines per event
const EVENT_SUBJECTS: Record<string, (date: string) => string> = {
  solar_return: (date: string) =>
    `The stars are aligning for your Solar Return on ${date}!`,
  saturn_return: (_date: string) =>
    `Your Saturn Return is approaching — a pivotal life transit`,
  jupiter_return: (_date: string) =>
    `Your Jupiter Return is near — expansion and fortune await`,
};

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const results: Array<{
    clientEmail: string;
    eventType: string;
    daysUntil: number;
  }> = [];

  try {
    // Fetch all clients who have a birth_date and a diviner relationship
    const { data: clientDiviners, error } = await admin
      .from("client_diviners")
      .select(
        "client_id, diviner_id, clients(id, email, display_name, birth_date), diviners(id, display_name, username)"
      )
      .not("clients.birth_date", "is", null);

    if (error) {
      console.error("[Cron] Failed to fetch client_diviners:", error);
      return NextResponse.json(
        { error: "Failed to fetch clients" },
        { status: 500 }
      );
    }

    if (!clientDiviners || clientDiviners.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No clients with birth dates found",
        sent: 0,
      });
    }

    // Pre-fetch all diviner services that match event triggers for service-specific booking links
    const divinerIds = [
      ...new Set(clientDiviners.map((cd) => cd.diviner_id)),
    ];
    const { data: eventServices } = await admin
      .from("services")
      .select("id, diviner_id, slug, trigger_event, name")
      .in("diviner_id", divinerIds)
      .in("trigger_event", ["solar-return", "saturn-return", "jupiter-return"])
      .eq("is_active", true);

    // Build a lookup: { divinerId: { triggerEvent: service } }
    const serviceMap: Record<string, Record<string, any>> = {};
    for (const svc of eventServices ?? []) {
      if (!serviceMap[svc.diviner_id]) serviceMap[svc.diviner_id] = {};
      serviceMap[svc.diviner_id][svc.trigger_event] = svc;
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

    for (const cd of clientDiviners) {
      const client = cd.clients as any;
      const diviner = cd.diviners as any;

      if (!client?.birth_date || !client?.email || !diviner) continue;

      const birthDate = new Date(client.birth_date);
      const birthYear = birthDate.getFullYear();
      const ageNow = now.getFullYear() - birthYear;

      // Helper to build a one-click booking link with the correct service
      function buildBookingLink(eventType: string): string {
        const triggerSlug = EVENT_SERVICE_MAP[eventType];
        const matchedService = serviceMap[diviner.id]?.[triggerSlug];
        if (matchedService) {
          return `${appUrl}/${diviner.username}/book/${matchedService.slug}?client=${encodeURIComponent(client.email)}`;
        }
        return `${appUrl}/${diviner.username}?client=${encodeURIComponent(client.email)}`;
      }

      // --- Solar Return (birthday) — actual solar return date calculation ---
      const thisYearBirthday = new Date(
        now.getFullYear(),
        birthDate.getMonth(),
        birthDate.getDate()
      );

      const nextBirthday =
        thisYearBirthday >= now
          ? thisYearBirthday
          : new Date(
              now.getFullYear() + 1,
              birthDate.getMonth(),
              birthDate.getDate()
            );

      const daysUntilBirthday = Math.round(
        (nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (
        daysUntilBirthday === 30 ||
        daysUntilBirthday === 7 ||
        daysUntilBirthday === 1
      ) {
        const eventDate = nextBirthday.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        await scheduleAndSend(admin, {
          clientId: client.id,
          clientEmail: client.email,
          divinerId: diviner.id,
          divinerName: diviner.display_name,
          eventType: "solar_return",
          eventDate,
          bookingLink: buildBookingLink("solar_return"),
          daysUntil: daysUntilBirthday,
        });
        results.push({
          clientEmail: client.email,
          eventType: "solar_return",
          daysUntil: daysUntilBirthday,
        });
      }

      // --- Saturn Return check (age 28-30 or 57-59 window) ---
      const inSaturnWindow =
        (ageNow >= 28 && ageNow <= 30) || (ageNow >= 57 && ageNow <= 59);

      if (inSaturnWindow) {
        // Calculate the exact Saturn return date based on the nearest return age
        const saturnReturnAge = ageNow <= 30 ? 29 : 58;
        const saturnDate = new Date(
          birthYear + saturnReturnAge,
          birthDate.getMonth(),
          birthDate.getDate()
        );
        // Also check saturnReturnAge+1 in case exact birthday hasn't happened yet
        const saturnDateAlt = new Date(
          birthYear + saturnReturnAge + 1,
          birthDate.getMonth(),
          birthDate.getDate()
        );

        for (const sd of [saturnDate, saturnDateAlt]) {
          const daysUntilSaturn = Math.round(
            (sd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (
            daysUntilSaturn === 30 ||
            daysUntilSaturn === 7 ||
            daysUntilSaturn === 1
          ) {
            const eventDate = sd.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            });
            await scheduleAndSend(admin, {
              clientId: client.id,
              clientEmail: client.email,
              divinerId: diviner.id,
              divinerName: diviner.display_name,
              eventType: "saturn_return",
              eventDate,
              bookingLink: buildBookingLink("saturn_return"),
              daysUntil: daysUntilSaturn,
            });
            results.push({
              clientEmail: client.email,
              eventType: "saturn_return",
              daysUntil: daysUntilSaturn,
            });
            break; // Only one reminder per Saturn return window
          }
        }
      }

      // --- Jupiter Return check (~12 year cycle, within 0-1 year of a return) ---
      const yearsSinceBirth = ageNow;
      const nearestJupiterMultiple = Math.round(yearsSinceBirth / 12) * 12;
      const distFromJupiter = Math.abs(yearsSinceBirth - nearestJupiterMultiple);

      if (distFromJupiter <= 1 && nearestJupiterMultiple > 0) {
        const jupiterDate = new Date(
          birthYear + nearestJupiterMultiple,
          birthDate.getMonth(),
          birthDate.getDate()
        );

        const daysUntilJupiter = Math.round(
          (jupiterDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (
          daysUntilJupiter === 30 ||
          daysUntilJupiter === 7 ||
          daysUntilJupiter === 1
        ) {
          const eventDate = jupiterDate.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          });
          await scheduleAndSend(admin, {
            clientId: client.id,
            clientEmail: client.email,
            divinerId: diviner.id,
            divinerName: diviner.display_name,
            eventType: "jupiter_return",
            eventDate,
            bookingLink: buildBookingLink("jupiter_return"),
            daysUntil: daysUntilJupiter,
          });
          results.push({
            clientEmail: client.email,
            eventType: "jupiter_return",
            daysUntil: daysUntilJupiter,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent: results.length,
      results,
    });
  } catch (err) {
    console.error("[Cron] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function scheduleAndSend(
  admin: ReturnType<typeof createAdminClient>,
  params: {
    clientId: string;
    clientEmail: string;
    divinerId: string;
    divinerName: string;
    eventType: string;
    eventDate: string;
    bookingLink: string;
    daysUntil: number;
  }
) {
  // Check if we already sent this notification to avoid duplicates
  const { data: existing } = await admin
    .from("scheduled_notifications")
    .select("id")
    .eq("client_id", params.clientId)
    .eq("diviner_id", params.divinerId)
    .eq("event_type", params.eventType)
    .eq("event_date", params.eventDate)
    .eq("days_before", params.daysUntil)
    .maybeSingle();

  if (existing) {
    console.log(
      `[Cron] Already sent ${params.eventType} ${params.daysUntil}d reminder to ${params.clientEmail}`
    );
    return;
  }

  // Insert notification record
  await admin.from("scheduled_notifications").insert({
    client_id: params.clientId,
    diviner_id: params.divinerId,
    event_type: params.eventType,
    event_date: params.eventDate,
    days_before: params.daysUntil,
    status: "sent",
    sent_at: new Date().toISOString(),
  });

  // Send email
  await sendEventReminder({
    clientEmail: params.clientEmail,
    divinerName: params.divinerName,
    eventType: params.eventType,
    eventDate: params.eventDate,
    bookingLink: params.bookingLink,
  });

  console.log(
    `[Cron] Sent ${params.eventType} ${params.daysUntil}d reminder to ${params.clientEmail}`
  );
}
