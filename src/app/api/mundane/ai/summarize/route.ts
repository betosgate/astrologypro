import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { callMundaneAI } from "@/lib/mundane-ai";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  // Rate limit: 20 AI summarize calls per hour per user (each call hits Anthropic API)
  const rl = await rateLimit(`mundane-ai-summarize:${user.id}`, 20, 60 * 60 * 1_000);
  if (!rl.success) {
    return rateLimitResponse(rl, "AI summarization limit reached. You can run up to 20 summaries per hour.") as unknown as NextResponse;
  }

  let body: {
    project_id?: string;
    forecast_id?: string;
    entity_id?: string;
  };

  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "Invalid JSON body" },
      { status: 422 }
    );
  }

  const { project_id, forecast_id, entity_id } = body;
  const ids = [project_id, forecast_id, entity_id].filter(Boolean);

  if (ids.length !== 1) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/422",
        title: "Validation Error",
        status: 422,
        detail: "Exactly one of project_id, forecast_id, or entity_id is required",
      },
      { status: 422 }
    );
  }

  if (!process.env.MUNDANE_AI_LAMBDA_URL) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/503", title: "AI service not configured", status: 503 },
      { status: 503 }
    );
  }

  const admin = createAdminClient();
  let contentToSummarize = "";
  let subjectLabel = "";

  if (project_id) {
    const { data, error } = await admin
      .from("mundane_research_projects")
      .select("title, description, project_type")
      .eq("id", project_id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Research project not found" },
        { status: 404 }
      );
    }

    // Also pull notes for this project
    const { data: notes } = await admin
      .from("mundane_research_notes")
      .select("content, note_type, created_at")
      .eq("project_id", project_id)
      .order("created_at", { ascending: true })
      .limit(20);

    subjectLabel = `Research Project: ${data.title}`;
    contentToSummarize = [
      `Title: ${data.title}`,
      data.description ? `Description: ${data.description}` : "",
      `Type: ${data.project_type}`,
      notes?.length
        ? `\nResearch Notes:\n${notes.map((n: { note_type: string; content: string }) => `[${n.note_type}] ${n.content}`).join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
  } else if (forecast_id) {
    const { data, error } = await admin
      .from("mundane_forecasts")
      .select("title, narrative_summary, astrological_basis, outcome_status, confidence_level")
      .eq("id", forecast_id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Forecast not found" },
        { status: 404 }
      );
    }

    subjectLabel = `Forecast: ${data.title}`;
    contentToSummarize = [
      `Title: ${data.title}`,
      `Status: ${data.outcome_status}`,
      data.confidence_level ? `Confidence: ${data.confidence_level}` : "",
      data.narrative_summary ? `Narrative: ${data.narrative_summary}` : "",
      data.astrological_basis ? `Astrological Basis: ${data.astrological_basis}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  } else if (entity_id) {
    const { data, error } = await admin
      .from("mundane_entities")
      .select("name, entity_type, region, notes")
      .eq("id", entity_id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Entity not found" },
        { status: 404 }
      );
    }

    subjectLabel = `Entity: ${data.name}`;
    contentToSummarize = [
      `Name: ${data.name}`,
      `Type: ${data.entity_type}`,
      data.region ? `Region: ${data.region}` : "",
      data.notes ? `Notes: ${data.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (!contentToSummarize.trim()) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "No content available to summarize" },
      { status: 422 }
    );
  }

  const prompt = `You are a mundane astrology research assistant. Summarize the following research notes in 3-5 bullet points, focusing on key astrological patterns and their predicted mundane effects:\n\n${subjectLabel}\n\n${contentToSummarize}`;

  try {
    const result = await callMundaneAI({ prompt, aspect_type: "general", max_tokens: 512 });

    return NextResponse.json({
      summary: result.text,
      generated_at: result.generated_at,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown AI error";
    return NextResponse.json(
      { type: "https://httpstatuses.com/502", title: "AI Service Error", status: 502, detail: message },
      { status: 502 }
    );
  }
}
