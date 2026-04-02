/**
 * mundane-content.ts
 * Generates social-media-ready mundane astrology content using Claude API.
 * Voice: 1st-person authoritative astrologer speaking directly to followers.
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export interface GeneratedContent {
  description: string; // 3-4 sentences, first-person mundane astrology
  hashtags: string;    // space-separated hashtags string
}

export type EventType = 'ingress' | 'retrograde' | 'direct' | 'aspect';

/** Context phrases to set the scene for each event type */
const EVENT_TYPE_CONTEXT: Record<EventType, string> = {
  ingress:
    'a planet entering a new zodiac sign — a new chapter opening that shifts collective energy for weeks or months ahead',
  retrograde:
    'a planet appearing to move backward — a time of review, revision, and reckoning for the themes that planet governs on the world stage',
  direct:
    'a planet returning to forward motion after retrograde — the pressure lifts, clarity returns, and stalled situations begin moving again',
  aspect:
    'two planets in a precise geometric alignment — their energies are in active dialogue, blending and pushing against each other in world events',
};

/** Generate description + hashtags for a mundane astrology event */
export async function generateMundaneContent(
  eventLabel: string,
  eventType: EventType = 'aspect'
): Promise<GeneratedContent> {
  if (!ANTHROPIC_API_KEY) {
    return fallbackContent(eventLabel, eventType);
  }

  const typeContext = EVENT_TYPE_CONTEXT[eventType] ?? EVENT_TYPE_CONTEXT.aspect;

  const prompt = `You are a professional mundane astrologer writing social media content as an authority speaking directly to your followers in first person.

Event: "${eventLabel}"
Type: ${eventType} — ${typeContext}

Write as if you are sharing your expert observations right now. Mundane astrology = world events, institutions, nations, economies, social movements, collective human experience — NOT personal horoscopes.

VOICE REQUIREMENTS (critical):
- Write in first person: "I'm watching...", "Right now...", "Pay attention to...", "We are seeing...", "Today marks..."
- Sound like an astrologer who SEES patterns others miss — specific, authoritative, grounded
- Reference real-world domains: geopolitics, markets, technology, social movements, environment, culture
- End with one concrete "watch for" observation or prediction
- 3-4 sentences total — dense with meaning, not filler

Provide:
1. The 3-4 sentence first-person description
2. 10 hashtags: mix the specific event name, trending astrology tags, spirituality tags, current themes

Format EXACTLY as:
DESCRIPTION: [3-4 sentences]
HASHTAGS: #tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8 #tag9 #tag10`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
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
        `${eventLabel} is active right now — watch for shifts in collective energy and world events tied to this planetary alignment.`,
      hashtags:
        hashMatch?.[1]?.trim() ??
        "#MundaneAstrology #Astrology #PlanetaryTransits #CosmicEnergy #AstrologyForecast",
    };
  } catch (err) {
    console.error("[MundaneContent] Failed to generate content:", err);
    return fallbackContent(eventLabel, eventType);
  }
}

function fallbackContent(eventLabel: string, eventType: EventType): GeneratedContent {
  const hooks: Record<EventType, string> = {
    ingress: `I'm watching ${eventLabel} — a pivotal shift that changes the collective terrain for the weeks ahead.`,
    retrograde: `Pay attention: ${eventLabel} is happening now, and the world-stage reversal is real.`,
    direct: `${eventLabel} marks the end of a correction period — what was stalled is beginning to move again.`,
    aspect: `Right now I'm tracking ${eventLabel}, and the planetary tension is showing up in world events.`,
  };
  return {
    description: `${hooks[eventType]} This is a significant moment in mundane astrology, influencing institutions, governments, and collective experience. Astrologers worldwide are watching this transit closely — the effects ripple through world affairs for days to come. Watch for news and events that reflect this energy over the next week.`,
    hashtags:
      "#MundaneAstrology #Astrology #PlanetaryTransits #CosmicEnergy #AstrologyForecast #Horoscope #AstroUpdate #CelestialEvents #Planets #AstrologyToday",
  };
}
