import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import Anthropic from "@anthropic-ai/sdk";
import JSZip from "jszip";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";
export const maxDuration = 60;


/**
 * Extracts plain text from a PPTX file buffer.
 * PPTX is a ZIP archive containing XML files under ppt/slides/slide*.xml.
 * We strip XML tags and return concatenated slide text.
 */
async function extractPptxText(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const slideTexts: string[] = [];

  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] ?? "0");
      const numB = parseInt(b.match(/\d+/)?.[0] ?? "0");
      return numA - numB;
    });

  for (const slideFile of slideFiles) {
    const xml = await zip.files[slideFile].async("string");
    // Strip XML tags, decode common entities, collapse whitespace
    const text = xml
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#x[0-9A-Fa-f]+;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length > 10) {
      const slideNum = slideFile.match(/slide(\d+)/)?.[1] ?? "?";
      slideTexts.push(`[Slide ${slideNum}] ${text}`);
    }
  }

  return slideTexts.join("\n\n");
}

/**
 * POST /api/admin/quiz-generate
 * Body: multipart/form-data
 *   file: PPTX file
 *   lessonId: optional UUID
 *   questionCount: number (default 10)
 */
export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const lessonId = (formData.get("lessonId") as string | null) || null;
  const questionCount = Math.min(
    parseInt((formData.get("questionCount") as string) || "10"),
    20
  );

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const filename = file.name;
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext !== "pptx") {
    return NextResponse.json(
      { error: "Only .pptx files are supported" },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let slideText: string;
  try {
    slideText = await extractPptxText(buffer);
  } catch (err) {
    console.error("[quiz-generate] PPTX parse error:", err);
    return NextResponse.json(
      { error: "Could not parse PPTX file" },
      { status: 422 }
    );
  }

  if (!slideText || slideText.length < 50) {
    return NextResponse.json(
      { error: "Slide content is too short to generate questions" },
      { status: 422 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = `You are an expert quiz writer for an astrology and divination training program.
Given slide content, generate exactly ${questionCount} multiple-choice quiz questions.
Each question must have exactly 4 answer options where exactly one is correct.

Respond ONLY with valid JSON in this exact format:
[
  {
    "question": "Question text here?",
    "options": [
      { "text": "Correct answer", "correct": true },
      { "text": "Wrong answer 1", "correct": false },
      { "text": "Wrong answer 2", "correct": false },
      { "text": "Wrong answer 3", "correct": false }
    ]
  }
]

Rules:
- Questions must be answerable from the slide content
- Shuffle the position of the correct answer (don't always put it first)
- No trick questions — questions should test genuine understanding
- Keep questions concise (under 20 words when possible)`;

  let draftJson: unknown[];
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Generate ${questionCount} quiz questions from these presentation slides:\n\n${slideText.slice(0, 8000)}`,
        },
      ],
      system: systemPrompt,
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    // Extract JSON from response (Claude sometimes wraps in markdown code fences)
    const jsonMatch =
      content.text.match(/```(?:json)?\s*([\s\S]+?)\s*```/) ??
      content.text.match(/(\[[\s\S]+\])/);

    const jsonStr = jsonMatch ? jsonMatch[1] : content.text;
    draftJson = JSON.parse(jsonStr);

    if (!Array.isArray(draftJson)) throw new Error("Response is not an array");
  } catch (err) {
    console.error("[quiz-generate] Claude error:", err);
    return NextResponse.json(
      { error: "Failed to generate questions from Claude API" },
      { status: 500 }
    );
  }

  // Save draft to DB
  const admin = createAdminClient();
  const { data: draft, error: insertError } = await admin
    .from("quiz_generation_drafts")
    .insert({
      lesson_id: lessonId,
      filename,
      slide_text: slideText.slice(0, 50000),
      draft_json: draftJson,
      status: "pending",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("[quiz-generate] DB insert error:", insertError);
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
  }

  return NextResponse.json({
    draftId: draft.id,
    questions: draftJson,
    slideTextPreview: slideText.slice(0, 500),
    totalSlideChars: slideText.length,
  });
}
