import type { Metadata } from "next";
import { ReadingPageTemplate, type DivinerLandingCard } from "@/components/marketing/reading-page-template";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";
import { getReadingOgImageUrl } from "@/lib/service-images";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "3 Card Tarot Spread Readings | AstrologyPro",
    description:
      "A focused 3-card tarot reading gives you direct clarity on any question — past, present, and future, or situation, action, and outcome. Quick, powerful, and surprisingly precise.",
    alternates: { canonical: `${APP_URL}/readings/3-card-basic-question-spread` },
    openGraph: {
      title: "3 Card Tarot Spread Readings | AstrologyPro",
      description:
        "A focused 3-card tarot reading gives you direct clarity on any question — past, present, and future, or situation, action, and outcome. Quick, powerful, and surprisingly precise.",
      type: "website",
      url: `${APP_URL}/readings/3-card-basic-question-spread`,
      images: [{ url: "https://astrologypro.com/images/services/3-card-basic.png", width: 1200, height: 630, alt: "3-Card Basic Question Spread" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "3 Card Tarot Spread Readings | AstrologyPro",
      description:
        "A focused 3-card tarot reading gives you direct clarity on any question — past, present, and future, or situation, action, and outcome. Quick, powerful, and surprisingly precise.",
      images: ["https://astrologypro.com/images/services/3-card-basic.png"],
    },
  };
}

async function get3CardBasicQuestionSpreadDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "3_card_basic_question_spread")
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

export default async function ThreeCardBasicQuestionSpreadPage() {
  const diviners = await get3CardBasicQuestionSpreadDiviners();
  return (
    <ReadingPageTemplate
      serviceType="tarot"
      badge="The Classic Tarot Spread"
      heroImage={getReadingOgImageUrl("3-card-basic-question-spread")}
      heroTitleBefore="The 3-Card Spread:"
      heroTitleGradient="Fast Clarity on Any Question"
      heroSubtitle="Three cards. Three positions. Infinite clarity. The 3-card spread is the most versatile tool in tarot — deceptively simple but capable of remarkable depth when read by a skilled practitioner."
      heroStats={[
        { value: "3 Cards", label: "One Question Focus" },
        { value: "20 Minutes", label: "Direct & Precise" },
      ]}
      startingPrice={35}
      whatIsTitle="What Is a 3-Card Tarot Reading?"
      whatIsParagraphs={[
        "The 3-card spread is the foundational tarot layout — three cards drawn and placed in sequence, each representing a distinct dimension of a situation. The most common interpretation maps the cards to past, present, and future, but the spread adapts to any question: situation, action, outcome; mind, body, spirit; the problem, the obstacle, the solution.",
        "Despite its simplicity, a 3-card reading in the hands of a skilled reader is not shallow. Each card carries a rich system of symbolism, numerology, elemental correspondence, and traditional meaning. The relationship between the three cards — how they speak to each other across positions — adds another full layer of meaning that a beginner often misses.",
        "The 3-card spread excels at focused questions with a defined scope: a decision point, a relationship dynamic, a career choice. For complex situations with many moving parts, a larger spread will serve better — but for precision and direct guidance, the 3-card is unmatched.",
      ]}
      revealsItems={[
        { label: "Root Cause or Past Context", desc: "The first card reveals what has brought you to this moment — the situation's origin or the energy you're carrying in" },
        { label: "Present Energy", desc: "The second card shows the current state of the situation — what is active, what you're working with right now" },
        { label: "Most Likely Outcome", desc: "The third card reveals the probable outcome if current energies continue, or the advice for the path forward" },
        { label: "Core Tension or Theme", desc: "The interplay between all three cards often reveals the central tension or lesson the situation is asking you to work with" },
        { label: "Immediate Actionable Guidance", desc: "What you can do right now — within days or weeks — based on what the spread is showing" },
      ]}
      expectCards={[
        {
          icon: "🃏",
          title: "Prepare Your Question",
          desc: "The more focused your question, the sharper the reading. A clear, specific question ('Should I accept this job offer?' vs. 'What should I do with my life?') allows the reader to draw cards with precise intent and deliver the most actionable insight.",
        },
        {
          icon: "🔍",
          title: "Card-by-Card Interpretation",
          desc: "Your reader explains each card in its position — its traditional meaning, the imagery and symbolism at work, and how it specifically applies to your question and situation. Nothing is generic; the interpretation is always personalized to your context.",
        },
        {
          icon: "💡",
          title: "Synthesis & Guidance",
          desc: "The reading concludes with a synthesis of all three cards together — the story they're collectively telling, the key message for your situation, and grounded, practical guidance on what to do or consider next.",
        },
      ]}
      testimonials={[
        {
          quote: "Three cards and I had more clarity than I'd found in six months of overthinking. I come back whenever I'm stuck.",
          name: "Maria T.",
          location: "Chicago, US",
          service: "3-Card Tarot Reading",
        },
        {
          quote: "I was skeptical about tarot but a friend recommended a 3-card reading as a low-stakes first try. I'm now a convert and a regular client.",
          name: "Sam H.",
          location: "London, UK",
          service: "3-Card Spread",
        },
        {
          quote: "The reader interpreted all three cards as one connected story rather than three separate answers. That's when I understood what good tarot actually is.",
          name: "Isabelle D.",
          location: "Montréal, CA",
          service: "3-Card Reading",
        },
      ]}
      diviners={diviners}
      discoverLink="/discover?type=tarot"
      discoverLabel="See All Tarot Readers"
      divinerSectionTitle="Find Your Tarot Reader"
      divinerSectionSubtitle="These readers specialize in focused question spreads and direct guidance"
      emailGuideSubject="your tarot reading"
      faqItems={[
        {
          q: "What questions work best for a 3-card reading?",
          a: "Focused, specific questions with a defined scope work best: 'What do I need to know about this relationship?', 'What will happen if I take this job?', 'What is blocking my progress right now?' Questions that are too broad ('What is my life purpose?') are better suited for larger spreads that can hold more complexity.",
        },
        {
          q: "How accurate are tarot readings?",
          a: "Tarot is not prediction in the deterministic sense — it's a symbolic language that surfaces what's present in a situation, including factors your conscious mind may not be fully registering. Skilled readers consistently deliver insights that clients describe as remarkably accurate to their experience. The accuracy reflects the reader's skill and the quality of the question as much as the cards themselves.",
        },
        {
          q: "Do I need to be present for the reading, or can it be done remotely?",
          a: "Tarot readings work just as effectively remotely as in person — many readers do their most focused work via video call or even asynchronous audio/video recordings. The card draw is equally valid either way. Ask your reader about their preferred format.",
        },
        {
          q: "Can I ask the same question in multiple readings?",
          a: "It's fine to revisit a question as circumstances evolve. However, repeatedly drawing for the same question without giving time for the situation to develop — out of anxiety rather than genuine inquiry — tends to produce muddier readings. Give at least a few weeks between readings on the same topic.",
        },
        {
          q: "Is a 3-card reading appropriate for a first tarot session?",
          a: "It's an excellent starting point. The 3-card spread gives you a clear sense of the reader's style and the process without being overwhelming. Many long-term tarot clients keep returning to the 3-card format precisely for its directness and efficiency, even after experiencing larger spreads.",
        },
      ]}
      ctaTitle="Ready for direct clarity on your question?"
      ctaBody="Connect with a skilled tarot reader who can translate the symbolism of three cards into grounded, actionable guidance — the fast-track to clarity when you need a focused answer."
      ctaButtonLabel="Browse All Tarot Readers"
      relatedReadings={[
  { title: "5-Card Complex Spread", href: "/readings/5-card-complex-question-spread", icon: "🃏" },
  { title: "Celtic Cross Reading", href: "/readings/10-card-celtic-cross-major-read", icon: "✨" },
  { title: "10-Card Relationship Spread", href: "/readings/10-card-relationship-spread", icon: "💞" },
]}
      pageUrl={`${APP_URL}/readings/3-card-basic-question-spread`}
    />
  );
}
