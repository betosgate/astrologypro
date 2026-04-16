import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name?: unknown;
      email?: unknown;
      life_area?: unknown;
      service_type?: unknown;
      service_name?: unknown;
      birth_date?: unknown;
      birth_time?: unknown;
      birth_place?: unknown;
      question?: unknown;
      source_url?: unknown;
    };

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const name =
      typeof body.name === "string" ? body.name.trim().slice(0, 120) : null;
    const lifeArea =
      typeof body.life_area === "string" ? body.life_area.trim().slice(0, 80) : null;
    const serviceType =
      typeof body.service_type === "string" ? body.service_type.trim().slice(0, 20) : null;
    const serviceName =
      typeof body.service_name === "string" ? body.service_name.trim().slice(0, 120) : null;
    const birthDate =
      typeof body.birth_date === "string" && body.birth_date
        ? body.birth_date
        : null;
    const birthTime =
      typeof body.birth_time === "string" && body.birth_time
        ? body.birth_time.slice(0, 10)
        : null;
    const birthPlace =
      typeof body.birth_place === "string" ? body.birth_place.trim().slice(0, 200) : null;
    const question =
      typeof body.question === "string" ? body.question.trim().slice(0, 2000) : null;
    const sourceUrl =
      typeof body.source_url === "string" ? body.source_url.trim().slice(0, 500) : null;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { error } = await admin.from("reading_leads").insert({
      email,
      name,
      life_area: lifeArea,
      service_type: serviceType,
      service_name: serviceName,
      birth_date: birthDate,
      birth_time: birthTime,
      birth_place: birthPlace,
      question,
      source_url: sourceUrl,
    });

    if (error) {
      console.error("[reading-lead] DB error:", error.message);
      return NextResponse.json(
        { error: "Could not save your details. Please try again." },
        { status: 500 }
      );
    }

    // Also upsert to blog_subscribers for email list
    await admin.from("blog_subscribers").upsert(
      {
        email,
        subscribed_at: new Date().toISOString(),
        source: "reading_lead_form",
      },
      { onConflict: "email" }
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
