import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { callMundaneAI } from "@/lib/mundane-ai";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

type RequestBody = {
  prompt: string;
  aspect_type?: string;
  subject_type?: string;
  subject_id?: string;
  context?: string;
  auto_save?: boolean;
};

// ─── POST — generate ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  // Rate limit: 30 per hour per user
  const rl = await rateLimit(`mundane-ai-generate:${user.id}`, 30, 60 * 60 * 1_000);
  if (!rl.success) {
    return rateLimitResponse(rl, "AI generation limit reached. You can generate up to 30 times per hour.") as unknown as NextResponse;
  }

  if (!process.env.MUNDANE_AI_LAMBDA_URL) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/503", title: "AI service not configured", status: 503 },
      { status: 503 }
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "Invalid JSON body" },
      { status: 422 }
    );
  }

  const { prompt, aspect_type = "general", subject_type, subject_id, context, auto_save = false } = body;

  // Validate prompt
  if (!prompt || typeof prompt !== "string" || prompt.trim().length < 10) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "prompt must be at least 10 characters" },
      { status: 422 }
    );
  }
  if (prompt.trim().length > 2000) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "prompt must not exceed 2000 characters" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // ── Fetch subject context from DB ──────────────────────────────────────────
  let subjectContext = "";
  let subjectLabel = "";

  if (subject_type && subject_id) {
    if (subject_type === "entity") {
      const { data } = await admin
        .from("mundane_entities")
        .select("name, entity_type, region, notes")
        .eq("id", subject_id)
        .single();

      if (data) {
        subjectLabel = `Entity: ${data.name}`;
        subjectContext = [
          `Entity: ${data.name}`,
          `Type: ${data.entity_type}`,
          data.region ? `Region: ${data.region}` : "",
          data.notes ? `Notes: ${data.notes}` : "",
        ]
          .filter(Boolean)
          .join("\n");
      }
    } else if (subject_type === "forecast") {
      const { data } = await admin
        .from("mundane_forecasts")
        .select("title, narrative_summary, astrological_basis, outcome_status")
        .eq("id", subject_id)
        .single();

      if (data) {
        subjectLabel = `Forecast: ${data.title}`;
        subjectContext = [
          `Forecast: ${data.title}`,
          `Status: ${data.outcome_status}`,
          data.narrative_summary ? `Narrative: ${data.narrative_summary}` : "",
          data.astrological_basis ? `Astrological Basis: ${data.astrological_basis}` : "",
        ]
          .filter(Boolean)
          .join("\n");
      }
    } else if (subject_type === "leader") {
      const { data } = await admin
        .from("mundane_leaders")
        .select("full_name, office_title, birth_date")
        .eq("id", subject_id)
        .single();

      if (data) {
        subjectLabel = `Leader: ${data.full_name}`;
        subjectContext = [
          `Leader: ${data.full_name}`,
          data.office_title ? `Office: ${data.office_title}` : "",
          data.birth_date ? `Birth Date: ${data.birth_date}` : "",
        ]
          .filter(Boolean)
          .join("\n");
      }
    } else if (subject_type === "event") {
      const { data } = await admin
        .from("mundane_astro_events")
        .select("title, event_type, event_datetime_utc, planet_primary")
        .eq("id", subject_id)
        .single();

      if (data) {
        subjectLabel = `Event: ${data.title}`;
        subjectContext = [
          `Event: ${data.title}`,
          `Type: ${data.event_type}`,
          `Date: ${data.event_datetime_utc}`,
          data.planet_primary ? `Planet: ${data.planet_primary}` : "",
        ]
          .filter(Boolean)
          .join("\n");
      }
    }
  }

  // ── Build rich prompt ──────────────────────────────────────────────────────
  const systemPrefix = "You are an expert mundane astrology analyst. Provide clear, professional, and insightful analysis.";

  const parts: string[] = [systemPrefix];
  if (subjectContext) {
    parts.push(`\nContext:\n${subjectContext}`);
  }
  if (context) {
    parts.push(`\nAdditional Context:\n${context}`);
  }
  parts.push(`\nRequest:\n${prompt.trim()}`);

  const fullPrompt = parts.join("\n");
  const contextUsed = [subjectContext, context].filter(Boolean).join("\n\n") || null;

  // ── Call AI ────────────────────────────────────────────────────────────────
  const startMs = Date.now();
  let aiText = "";
  let aiModel: string | undefined;

  try {
    const result = await callMundaneAI({
      prompt: fullPrompt,
      aspect_type,
      subject_label: subjectLabel || undefined,
    });
    aiText = result.text;
    aiModel = result.model;
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown AI error";
    return NextResponse.json(
      { type: "https://httpstatuses.com/502", title: "AI Service Error", status: 502, detail },
      { status: 502 }
    );
  }

  const durationMs = Date.now() - startMs;

  // ── Record generation ──────────────────────────────────────────────────────
  const { data: gen, error: insertError } = await admin
    .from("mundane_ai_generations")
    .insert({
      user_id: user.id,
      aspect_type,
      subject_type: subject_type ?? null,
      subject_id: subject_id ?? null,
      subject_label: subjectLabel || null,
      prompt: prompt.trim(),
      context_used: contextUsed,
      response: aiText,
      model: aiModel ?? null,
      duration_ms: durationMs,
      is_saved: auto_save,
    })
    .select("id, created_at")
    .single();

  if (insertError || !gen) {
    // Generation happened — return text even if logging failed
    return NextResponse.json({
      id: null,
      response: aiText,
      generated_at: new Date().toISOString(),
      subject_label: subjectLabel || null,
    });
  }

  return NextResponse.json({
    id: gen.id,
    response: aiText,
    generated_at: gen.created_at,
    subject_label: subjectLabel || null,
  });
}

// ─── GET — list recent generations ───────────────────────────────────────────

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const limitParam = searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitParam ?? "20", 10) || 20, 1), 100);
  const subject_type = searchParams.get("subject_type");
  const subject_id = searchParams.get("subject_id");
  const is_saved = searchParams.get("is_saved");

  const admin = createAdminClient();

  let query = admin
    .from("mundane_ai_generations")
    .select("id, aspect_type, subject_type, subject_id, subject_label, prompt, response, model, duration_ms, is_saved, saved_to_type, saved_to_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (subject_type) {
    query = query.eq("subject_type", subject_type);
  }
  if (subject_id) {
    query = query.eq("subject_id", subject_id);
  }
  if (is_saved !== null) {
    query = query.eq("is_saved", is_saved === "true");
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ generations: data ?? [], count: (data ?? []).length });
}
