import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function trimString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function normalizeDate(value: unknown): string | null {
  const date = trimString(value, 10);
  if (!date) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date
    ? null
    : date;
}

function normalizeTime(value: unknown): string | null {
  const time = trimString(value, 10);
  if (!time) return null;
  const match = time.match(/^([01]\d|2[0-3]):[0-5]\d$/);
  return match ? match[0] : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name?: unknown;
      email?: unknown;
      life_area?: unknown;
      service_type?: unknown;
      service_name?: unknown;
      service_slug?: unknown;
      birth_date?: unknown;
      birth_time?: unknown;
      birth_place?: unknown;
      birth_timezone?: unknown;
      current_timezone?: unknown;
      question?: unknown;
      additional_context?: unknown;
      source_url?: unknown;
    };

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const name = trimString(body.name, 120);
    const lifeArea = trimString(body.life_area, 80);
    const serviceType = trimString(body.service_type, 20)?.toLowerCase() ?? null;
    const serviceName = trimString(body.service_name, 120);
    const serviceSlug = trimString(body.service_slug, 120);
    const birthDate = normalizeDate(body.birth_date);
    const birthTime = normalizeTime(body.birth_time);
    const birthPlace = trimString(body.birth_place, 200);
    const birthTimezone = trimString(body.birth_timezone, 100);
    const currentTimezone = trimString(body.current_timezone, 100);
    const rawQuestion = trimString(body.question, 2000);
    const additionalContext = trimString(body.additional_context, 2000) ?? rawQuestion;
    const question = rawQuestion ?? additionalContext;
    const sourceUrl = trimString(body.source_url, 500);

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (body.birth_date && !birthDate) {
      return NextResponse.json(
        { error: "Birth date must use YYYY-MM-DD format." },
        { status: 400 }
      );
    }

    if (body.birth_time && !birthTime) {
      return NextResponse.json(
        { error: "Birth time must use HH:MM format." },
        { status: 400 }
      );
    }

    if (
      serviceType === "astrology" &&
      (!birthDate || !birthPlace || !birthTimezone)
    ) {
      return NextResponse.json(
        { error: "Date of birth, birth location, and timezone are required." },
        { status: 400 }
      );
    }

    if (serviceType === "tarot" && !additionalContext) {
      return NextResponse.json(
        { error: "Please add your question or situation." },
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
      service_slug: serviceSlug,
      birth_date: birthDate,
      birth_time: birthTime,
      birth_place: birthPlace,
      birth_timezone: birthTimezone,
      current_timezone: currentTimezone,
      question,
      additional_context: additionalContext,
      source_url: sourceUrl,
      metadata: {
        form_version: "reading-lead-v2",
        service_slug: serviceSlug,
        birth_timezone: birthTimezone,
        current_timezone: currentTimezone,
      },
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
