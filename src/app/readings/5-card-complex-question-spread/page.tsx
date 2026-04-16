import type { Metadata } from "next";
import { ReadingPageTemplate, type DivinerLandingCard } from "@/components/marketing/reading-page-template";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "5 Card Tarot Spread Readings | AstrologyPro",
    description:
      "The 5-card spread adds layers of nuance to complex questions — covering situation, past influences, future possibilities, the advice card, and the hidden factor affecting the outcome.",
    alternates: { canonical: `${APP_URL}/readings/5-card-complex-question-spread` },
    openGraph: {
      title: "5 Card Tarot Spread Readings | AstrologyPro",
      description:
        "The 5-card spread adds layers of nuance to complex questions — covering situation, past influences, future possibilities, the advice card, and the hidden factor affecting the outcome.",
      type: "website",
      url: `${APP_URL}/readings/5-card-complex-question-spread`,
      images: [{ url: "https://astrologypro.com/images/services/5-card-complex.png", width: 1200, height: 630, alt: "5-Card Complex Question Spread" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "5 Card Tarot Spread Readings | AstrologyPro",
      description:
        "The 5-card spread adds layers of nuance to complex questions — covering situation, past influences, future possibilities, the advice card, and the hidden factor affecting the outcome.",
      images: ["https://astrologypro.com/images/services/5-card-complex.png"],
    },
  };
}

async function get5CardComplexQuestionSpreadDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "5_card_complex_question_spread")
    .eq("is_active", true);

  let divinerIds: string[] = [];
  const priceByDiviner = new Map<string, number>();

  if (taggedServices && taggedServices.length > 0) {
    for (const svc of taggedServices) {
      const id = svc.diviner_id as string;
      const price = Number(svc.base_price);
      if (!priceByDiviner.has(id) || price < priceByDiviner.get(id)!) {
        priceByDiviner.set(id, price);
      }
    }
    divinerIds = [...priceByDiviner.keys()];
  }

  let query = admin
    .from("diviners")
    .select("id, username, display_name, tagline, avatar_url, specialties, is_certified")
    .eq("is_active", true)
    .eq("onboarding_completed", true)
    .eq("charges_enabled", true)
    .limit(6);

  if (divinerIds.length > 0) {
    query = query.in("id", divinerIds);
  } else {
    query = query.eq("is_certified", true).order("is_certified", { ascending: false });
  }

  const { data: diviners } = await query;

  if (!diviners || diviners.length === 0) {
    const { data: fallback } = await admin
      .from("diviners")
      .select("id, username, display_name, tagline, avatar_url, specialties, is_certified")
      .eq("is_active", true)
      .eq("onboarding_completed", true)
      .eq("charges_enabled", true)
      .eq("is_certified", true)
      .limit(6);

    if (!fallback) return [];
    const fallbackIds = fallback.map((d) => d.id as string);
    const { data: fallbackServices } = await admin
      .from("services")
      .select("diviner_id, base_price")
      .in("diviner_id", fallbackIds)
      .eq("is_active", true);

    const fallbackPrices = new Map<string, number>();
    for (const svc of fallbackServices ?? []) {
      const id = svc.diviner_id as string;
      const price = Number(svc.base_price);
      if (!fallbackPrices.has(id) || price < fallbackPrices.get(id)!) fallbackPrices.set(id, price);
    }
    return fallback.map((d) => ({
      username: d.username as string,
      displayName: d.display_name as string,
      tagline: (d.tagline as string | null) ?? null,
      avatarUrl: (d.avatar_url as string | null) ?? null,
      specialties: (d.specialties as string[] | null) ?? null,
      isCertified: !!(d.is_certified as boolean | null),
      startingPrice: fallbackPrices.get(d.id as string) ?? null,
    }));
  }

  const missingPriceIds = diviners.map((d) => d.id as string).filter((id) => !priceByDiviner.has(id));
  if (missingPriceIds.length > 0) {
    const { data: extraServices } = await admin
      .from("services")
      .select("diviner_id, base_price")
      .in("diviner_id", missingPriceIds)
      .eq("is_active", true);
    for (const svc of extraServices ?? []) {
      const id = svc.diviner_id as string;
      const price = Number(svc.base_price);
      if (!priceByDiviner.has(id) || price < priceByDiviner.get(id)!) priceByDiviner.set(id, price);
    }
  }

  return diviners.map((d) => ({
    username: d.username as string,
    displayName: d.display_name as string,
    tagline: (d.tagline as string | null) ?? null,
    avatarUrl: (d.avatar_url as string | null) ?? null,
    specialties: (d.specialties as string[] | null) ?? null,
    isCertified: !!(d.is_certified as boolean | null),
    startingPrice: priceByDiviner.get(d.id as string) ?? null,
  }));
}

export default async function FiveCardComplexQuestionSpreadPage() {
  const diviners = await get5CardComplexQuestionSpreadDiviners();
  return (
    <ReadingPageTemplate
      serviceType="tarot"
      badge="In-Depth Tarot Spread"
      heroTitleBefore="The 5-Card Spread:"
      heroTitleGradient="Nuance for Complex Questions"
      heroSubtitle="Some questions have more moving parts than a 3-card spread can hold. The 5-card spread adds context, influences, and deeper nuance — making it the ideal format for situations that require a fuller picture."
      heroStats={[
        { value: "5 Cards", label: "Layered Question Analysis" },
        { value: "30 Minutes", label: "Context + Guidance + Outcome" },
      ]}
      startingPrice={55}
      whatIsTitle="What Is a 5-Card Tarot Reading?"
      whatIsParagraphs={[
        "The 5-card spread builds on the foundation of the 3-card format by adding two critical layers: the context (what influences are at play beneath the surface) and the advice card (the recommended approach). This makes it the optimal format for questions that are more complex than 'what will happen' — for situations involving relationships, career decisions, or multi-factor choices.",
        "A common 5-card layout places cards in a cross or linear sequence: the central situation, the crossing factor (what's complicating or opposing), the root cause or past influence, the future trajectory, and the key advice. Variations exist, but the core principle is the same: more positions allow more of the situation's texture to surface.",
        "Where the 3-card reading is surgical, the 5-card reading is panoramic — it shows you the landscape of a situation from multiple angles simultaneously. For decisions with significant consequences or interpersonal situations with several actors, the 5-card spread provides the depth of context that one-liner answers cannot.",
      ]}
      revealsItems={[
        { label: "The Core Situation", desc: "The central card captures the heart of the matter — what the reading is fundamentally about at this moment" },
        { label: "Complicating or Opposing Factors", desc: "The crossing card reveals what is challenging, complicating, or working against the desired outcome" },
        { label: "Root Cause or Past Influence", desc: "What from the past is still shaping the present situation — the invisible hand affecting current circumstances" },
        { label: "Future Trajectory", desc: "Where the situation is heading if current energies and choices continue on their present course" },
        { label: "Key Advice", desc: "The most important thing to know, do, or consider — the reader's guidance distilled into the single most actionable recommendation" },
      ]}
      expectCards={[
        {
          icon: "🃏",
          title: "Multi-Dimensional Layout",
          desc: "Your reader draws five cards and places them in a deliberate layout, each position adding a new layer of context to your question. You'll see the full architecture of the situation rather than just its most visible surface.",
        },
        {
          icon: "🔄",
          title: "Interconnected Interpretation",
          desc: "A skilled 5-card reading isn't five separate card meanings — it's one continuous story told across five positions. Your reader weaves the cards together into a coherent narrative that makes sense of the full situation.",
        },
        {
          icon: "🧭",
          title: "Actionable Guidance",
          desc: "The reading closes with clear, practical guidance based on the full spread — not just what will likely happen but what you can do to navigate the situation most effectively given the cards' collective message.",
        },
      ]}
      testimonials={[
        {
          quote: "The five-card spread gave me context I didn't know I needed. It wasn't just what would happen, but why, and what I could do about it.",
          name: "Victor N.",
          location: "Lagos, NG",
          service: "5-Card Tarot Reading",
        },
        {
          quote: "The hidden influences card was the most valuable part. It surfaced a dynamic I'd been completely blind to — and once I could see it, everything shifted.",
          name: "Karen L.",
          location: "Seattle, US",
          service: "5-Card Spread",
        },
        {
          quote: "I use the 5-card spread for every major decision now. It's not about predicting the outcome — it's about seeing the situation clearly from multiple angles.",
          name: "Hiroshi Y.",
          location: "Tokyo, JP",
          service: "5-Card Reading",
        },
      ]}
      diviners={diviners}
      discoverLink="/discover?type=tarot"
      discoverLabel="See All Tarot Readers"
      divinerSectionTitle="Find Your Tarot Reader"
      divinerSectionSubtitle="These readers specialize in complex question spreads and multi-factor situations"
      emailGuideSubject="your 5-card tarot reading"
      faqItems={[
        {
          q: "When should I choose a 5-card reading over a 3-card reading?",
          a: "Choose 5-card when your question involves multiple people or factors, when a simple yes/no or past/present/future doesn't capture enough of the situation's texture, or when you want both an outcome prediction AND specific advice on how to act. Relationship decisions, career crossroads, and complex family situations often benefit from the extra positions.",
        },
        {
          q: "What kinds of questions work best for a 5-card spread?",
          a: "Questions with context and multiple contributing factors: 'Why is this relationship not progressing?', 'Should I take this business risk?', 'What's really going on with this situation and what should I do about it?' The more nuance the situation holds, the more valuable the additional positions become.",
        },
        {
          q: "How is the advice card determined?",
          a: "In most 5-card layouts, one specific position is designated as the advice position from the start — before any cards are drawn. The card drawn for that position is interpreted as the most relevant guidance the spread is offering for the question, shaped by what the other four cards have revealed about the situation.",
        },
        {
          q: "Can I ask about another person in a 5-card reading?",
          a: "Yes — and the 5-card format is particularly good for this. One position can represent the other person's perspective or energy, another the dynamic between you, and the remaining positions the trajectory and guidance. Your reader can adjust the layout to hold the interpersonal complexity.",
        },
        {
          q: "Is a 5-card reading suitable for yes/no questions?",
          a: "It can certainly answer yes/no questions, but it's somewhat overpowered for them — a 3-card spread is more efficient for binary questions. The 5-card spread is best used when you want to understand the why, the how, and the nuance behind an outcome, not just the outcome itself.",
        },
      ]}
      ctaTitle="Ready for a reading that holds your question's full complexity?"
      ctaBody="Connect with a skilled tarot reader who can use the 5-card spread to map every layer of your situation — from root cause to advice to outcome — in a single, cohesive reading."
      ctaButtonLabel="Browse All Tarot Readers"
      relatedReadings={[
  { title: "3-Card Basic Spread", href: "/readings/3-card-basic-question-spread", icon: "🃏" },
  { title: "Celtic Cross Reading", href: "/readings/10-card-celtic-cross-major-read", icon: "✨" },
  { title: "Horseshoe Spread", href: "/readings/7-card-horseshoe-spread-major-read", icon: "🧲" },
]}
      pageUrl={`${APP_URL}/readings/5-card-complex-question-spread`}
    />
  );
}
