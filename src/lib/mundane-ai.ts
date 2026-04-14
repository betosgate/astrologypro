/**
 * mundane-ai.ts
 * Central utility for calling the Mundane AI Lambda endpoint.
 * Server-only: MUNDANE_AI_LAMBDA_URL must never reach the client.
 */

/** Cache version map keyed by aspect_type. */
const CACHE_VERSION_MAP: Record<string, string> = {
  general: "mundane-ai-general-v1",
  entity: "mundane-entity-summary-v1",
  forecast: "mundane-forecast-narrative-v1",
  weekly_brief: "mundane-weekly-brief-v1",
  eclipse: "mundane-eclipse-report-v1",
  cycle: "mundane-cycle-analysis-v1",
};

export interface MundaneAIRequest {
  /** User-facing prompt / question. Maps to inputs.with_values.user_prompt in the Lambda envelope. */
  prompt: string;
  /** Optional system instruction override. Defaults to a standard mundane astrology system prompt. */
  system_instruction?: string;
  /** Short label describing the subject (entity name, forecast title, etc.). */
  subject_label?: string;
  /** Additional context data to inject alongside the user prompt. */
  context?: string;
  /**
   * Determines routing, cache version, and terminology.
   * Supported: 'general' | 'entity' | 'forecast' | 'weekly_brief' | 'eclipse' | 'cycle'
   */
  aspect_type?: string;
  max_tokens?: number;
  /** Override the resolved cache version. */
  cache_version?: string;
}

export interface MundaneAIResponse {
  text: string;
  model?: string;
  generated_at: string;
}

/**
 * Calls the Mundane AI Lambda endpoint using the structured prompt envelope.
 * Throws on missing env var, non-2xx responses, Lambda ok=false, or timeout.
 */
export async function callMundaneAI(req: MundaneAIRequest): Promise<MundaneAIResponse> {
  const url = process.env.MUNDANE_AI_LAMBDA_URL;
  if (!url) {
    throw new Error("MUNDANE_AI_LAMBDA_URL is not configured");
  }

  const aspectType = req.aspect_type ?? "general";
  const cacheVersion = req.cache_version ?? CACHE_VERSION_MAP[aspectType] ?? "mundane-ai-general-v1";
  const systemInstruction =
    req.system_instruction ??
    "You are a professional mundane astrology analyst. Provide clear, evidence-based analysis using standard mundane astrology terminology.";

  const lambdaBody = {
    prompt: {
      instruction: systemInstruction,
      response_schema: { type: "object", properties: { text: { type: "string" } } },
      inputs: {
        with_values: {
          user_prompt: req.prompt,
          subject_label: req.subject_label ?? "",
          context: req.context ?? "",
          aspect_type: aspectType,
        },
      },
      rules: [
        "Respond only in the requested format",
        "Use professional mundane astrology terminology",
        "Be specific, concise, and evidence-based",
      ],
    },
    skip_kb: false,
    structured_validate_fallback: true,
    confidence_threshold: 0.25,
    max_tokens: req.max_tokens ?? 1000,
    cache_version: cacheVersion,
    cache_nonce: crypto.randomUUID(),
    force_openai: true,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  let raw: Response;
  try {
    raw = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lambdaBody),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  let envelope: Record<string, unknown>;
  try {
    envelope = (await raw.json()) as Record<string, unknown>;
  } catch {
    if (!raw.ok) {
      throw new Error(`AI Lambda returned HTTP ${raw.status}`);
    }
    throw new Error("AI Lambda returned non-JSON response");
  }

  if (!raw.ok) {
    const detail =
      (envelope["detail"] as string | undefined) ??
      (envelope["error"] as string | undefined) ??
      (envelope["message"] as string | undefined) ??
      `AI Lambda returned HTTP ${raw.status}`;
    throw new Error(detail);
  }

  if (!envelope["ok"]) {
    const diagnostics = envelope["diagnostics"] ?? {};
    throw new Error(`Lambda returned ok=false: ${JSON.stringify(diagnostics)}`);
  }

  const data = envelope["data"] as Record<string, unknown> | undefined;
  let text: unknown = data?.["response"] ?? data?.["answer"] ?? "";

  if (typeof text === "string") {
    text = text
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
    try {
      text = JSON.parse(text as string);
    } catch {
      // leave as string
    }
  }

  const resolvedText = typeof text === "string" ? text : JSON.stringify(text);

  if (!resolvedText.trim()) {
    throw new Error("AI Lambda returned an empty or unrecognised response shape");
  }

  return {
    text: resolvedText,
    model: data?.["model_id"] as string | undefined,
    generated_at: new Date().toISOString(),
  };
}
