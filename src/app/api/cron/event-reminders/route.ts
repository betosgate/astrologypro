import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEventReminder } from "@/lib/email";

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
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

    for (const cd of clientDiviners) {
      const client = cd.clients as any;
      const diviner = cd.diviners as any;

      if (!client?.birth_date || !client?.email || !diviner) continue;

      const birthDate = new Date(client.birth_date);
      const birthYear = birthDate.getFullYear();
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
      const bookingLink = `${appUrl}/${diviner.username}`;

      // --- Solar Return (birthday) check ---
      const thisYearBirthday = new Date(
        now.getFullYear(),
        birthDate.getMonth(),
        birthDate.getDate()
      );

      // If birthday already passed this year, check next year
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
        await scheduleAndSend(admin, {
          clientId: client.id,
          clientEmail: client.email,
          divinerId: diviner.id,
          divinerName: diviner.display_name,
          eventType: "solar_return",
          eventDate: nextBirthday.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          bookingLink,
          daysUntil: daysUntilBirthday,
        });
        results.push({
          clientEmail: client.email,
          eventType: "solar_return",
          daysUntil: daysUntilBirthday,
        });
      }

      // --- Saturn Return check (~29.5 year cycle) ---
      const saturnReturnYears = [29, 58, 87];
      for (const offset of saturnReturnYears) {
        const saturnYear = birthYear + offset;
        const saturnDate = new Date(
          saturnYear,
          birthDate.getMonth(),
          birthDate.getDate()
        );
        const daysUntilSaturn = Math.round(
          (saturnDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (
          daysUntilSaturn === 30 ||
          daysUntilSaturn === 7 ||
          daysUntilSaturn === 1
        ) {
          await scheduleAndSend(admin, {
            clientId: client.id,
            clientEmail: client.email,
            divinerId: diviner.id,
            divinerName: diviner.display_name,
            eventType: "saturn_return",
            eventDate: saturnDate.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            }),
            bookingLink,
            daysUntil: daysUntilSaturn,
          });
          results.push({
            clientEmail: client.email,
            eventType: "saturn_return",
            daysUntil: daysUntilSaturn,
          });
        }
      }

      // --- Jupiter Return check (~12 year cycle) ---
      for (let offset = 12; offset <= 96; offset += 12) {
        const jupiterYear = birthYear + offset;
        const jupiterDate = new Date(
          jupiterYear,
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
          await scheduleAndSend(admin, {
            clientId: client.id,
            clientEmail: client.email,
            divinerId: diviner.id,
            divinerName: diviner.display_name,
            eventType: "jupiter_return",
            eventDate: jupiterDate.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            }),
            bookingLink,
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
