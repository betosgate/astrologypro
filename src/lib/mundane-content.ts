/**
 * mundane-content.ts
 * Generates social-media-ready mundane astrology content using Claude API.
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export interface GeneratedContent {
  description: string; // 2-3 sentences, mundane astrology interpretation
  hashtags: string; // space-separated hashtags string
}

/** Generate description + hashtags for a mundane astrology event */
export async function generateMundaneContent(
  eventLabel: string
): Promise<GeneratedContent> {
  if (!ANTHROPIC_API_KEY) {
    return fallbackContent(eventLabel);
  }

  try {
    const prompt = `You are an expert mundane astrologer writing social media content.

Write content for this event: "${eventLabel}"

Provide:
1. A 2-3 sentence description of what this means in MUNDANE astrology (effects on world events, societies, nations, economies, and collective human experience — NOT personal horoscopes). Keep it accessible, mystical but clear, and relevant to current global themes.
2. 10 relevant, searchable hashtags including the event name, general astrology tags, and trending spirituality tags.

Format your response EXACTLY as:
DESCRIPTION: [your 2-3 sentences here]
HASHTAGS: #tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8 #tag9 #tag10`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      content?: Array<{ text?: string }>;
    };
    const text = data.content?.[0]?.text ?? "";

    const descMatch = text.match(/DESCRIPTION:\s*([\s\S]+?)(?=\nHASHTAGS:|$)/);
    const hashMatch = text.match(/HASHTAGS:\s*([\s\S]+)/);

    return {
      description:
        descMatch?.[1]?.trim() ??
        `${eventLabel} influences collective world events and societal energy.`,
      hashtags:
        hashMatch?.[1]?.trim() ??
        "#MundaneAstrology #Astrology #PlanetaryTransits #CosmicEnergy #AstrologyForecast",
    };
  } catch (err) {
    console.error("[MundaneContent] Failed to generate content:", err);
    return fallbackContent(eventLabel);
  }
}

function fallbackContent(eventLabel: string): GeneratedContent {
  return {
    description: `${eventLabel} marks a significant shift in collective planetary energy. This cosmic event influences world affairs, institutions, and the global zeitgeist. Astrologers worldwide are watching this transit closely.`,
    hashtags:
      "#MundaneAstrology #Astrology #PlanetaryTransits #CosmicEnergy #AstrologyForecast #Horoscope #AstroUpdate #CelestialEvents #Planets #AstrologyToday",
  };
}
