import type { Metadata } from "next";
import { ReadingPageTemplate, type DivinerLandingCard } from "@/components/marketing/reading-page-template";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "7 Card Horseshoe Tarot Spread | AstrologyPro",
    description:
      "The horseshoe spread is one of tarot's most elegant seven-card layouts — covering past, present, hidden influences, obstacles, outside influences, advice, and outcome in a single cohesive reading.",
    openGraph: {
      title: "7 Card Horseshoe Tarot Spread | AstrologyPro",
      description:
        "The horseshoe spread is one of tarot's most elegant seven-card layouts — covering past, present, hidden influences, obstacles, outside influences, advice, and outcome in a single cohesive reading.",
      type: "website",
      url: `${APP_URL}/readings/7-card-horseshoe-spread-major-read`,
    },
    twitter: {
      card: "summary_large_image",
      title: "7 Card Horseshoe Tarot Spread | AstrologyPro",
      description:
        "The horseshoe spread is one of tarot's most elegant seven-card layouts — covering past, present, hidden influences, obstacles, outside influences, advice, and outcome in a single cohesive reading.",
    },
  };
}

async function get7CardHorseshoeSpreadMajorReadDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "7_card_horseshoe_spread_major_read")
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
    .select("id, username, display_name, tagline, avatar_url, is_certified")
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
      .select("id, username, display_name, tagline, avatar_url, is_certified")
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
    isCertified: !!(d.is_certified as boolean | null),
    startingPrice: priceByDiviner.get(d.id as string) ?? null,
  }));
}

export default async function SevenCardHorseshoeSpreadMajorReadPage() {
  const diviners = await get7CardHorseshoeSpreadMajorReadDiviners();
  return (
    <ReadingPageTemplate
      serviceType="tarot"
      badge="Classic Major Tarot Spread"
      heroTitleBefore="The 7-Card Horseshoe Spread:"
      heroTitleGradient="A Complete View of Any Situation"
      heroSubtitle="The horseshoe spread has been a cornerstone of tarot practice for centuries. Seven positions covering past, present, hidden factors, obstacles, external influences, advice, and outcome — it's the most complete single-question spread in the classical tarot canon."
      heroStats={[
        { value: "7 Cards", label: "Seven Positions" },
        { value: "45 Minutes", label: "The Full Situation Picture" },
      ]}
      startingPrice={75}
      whatIsTitle="What Is the Horseshoe Tarot Spread?"
      whatIsParagraphs={[
        "The horseshoe spread arranges seven cards in an arc — like the horseshoe shape that gives it its name. Each of the seven positions addresses a distinct dimension of the situation: where you've been, where you are, what's hidden beneath the surface, what's in your way, what outside forces are at play, what advice the cards offer, and where things are heading.",
        "Unlike question spreads that focus narrowly on a single thread, the horseshoe gives you the full picture: not just what will likely happen, but why the situation has developed this way, what you may not be seeing clearly, and what specific guidance the cards are offering. It's a complete situational analysis rather than a directional prediction.",
        "The horseshoe's structure makes it especially valuable for complex personal situations — ongoing conflicts, relationship crossroads, career transitions, or any situation where you feel like you don't have the full picture. The hidden influences position alone often delivers the most transformative insight of the entire reading.",
      ]}
      revealsItems={[
        { label: "Past Context", desc: "What has shaped the current situation — the history and prior choices that have led to this point" },
        { label: "Present Reality", desc: "Where you actually are right now — including what may be happening beneath the surface of appearances" },
        { label: "Hidden Influences", desc: "Factors operating beneath conscious awareness — subconscious patterns, unseen dynamics, or overlooked forces affecting the outcome" },
        { label: "Obstacles & External Forces", desc: "What is standing in the way and what outside influences (other people, circumstances, timing) are shaping the trajectory" },
        { label: "Advice & Most Likely Outcome", desc: "The most relevant guidance for navigating the situation, and where things are heading if current energies continue" },
      ]}
      expectCards={[
        { icon: "🧩", title: "Full Situational Mapping", desc: "Seven cards are drawn and placed in the horseshoe layout, each occupying a specific position that addresses a distinct dimension of the situation. You'll see the full architecture of what you're navigating before your reader interprets a single card." },
        { icon: "🔍", title: "The Hidden Influences Position", desc: "Often the most powerful card in the spread, position three surfaces what's operating below conscious awareness — the invisible dynamic, the overlooked factor, or the subconscious pattern that is quietly driving the situation more than anything visible." },
        { icon: "🎯", title: "Integrated Outcome & Advice", desc: "The reading closes by synthesizing all seven positions into a coherent narrative — understanding not just where things are headed but what you can specifically do with the advice card's guidance to shift or support the outcome." },
      ]}
      testimonials={[
        { quote: "The horseshoe spread showed me the full picture of a situation I'd been partially blind to. The hidden influences card alone was worth the entire reading.", name: "Chloe B.", location: "Edinburgh, UK", service: "Horseshoe Spread Reading" },
        { quote: "I've tried many spreads but the horseshoe remains my go-to for complex personal situations. It maps the whole territory, not just one path.", name: "Arnav K.", location: "Mumbai, IN", service: "7-Card Horseshoe" },
        { quote: "My reader surfaced an external obstacle I hadn't even considered. Once I knew it was there, I could work around it. The outcome changed completely.", name: "Simone V.", location: "Lyon, FR", service: "Horseshoe Reading" },
      ]}
      diviners={diviners}
      discoverLink="/discover?type=tarot"
      discoverLabel="See All Tarot Readers"
      divinerSectionTitle="Find Your Horseshoe Spread Reader"
      divinerSectionSubtitle="These readers specialize in comprehensive classical tarot spreads"
      emailGuideSubject="your horseshoe spread reading"
      faqItems={[
        { q: "What kinds of situations is the horseshoe spread best for?", a: "Situations with multiple layers of complexity where you want more than just a yes/no or directional answer. Relationship dilemmas, ongoing life challenges, career crossroads, or any situation where you feel you're missing part of the picture. The horseshoe's seven positions are specifically designed to surface hidden factors and external influences that simpler spreads leave uncovered." },
        { q: "How is the horseshoe different from the Celtic Cross?", a: "Both are comprehensive spreads, but the horseshoe (7 cards) is slightly more streamlined than the Celtic Cross (10 cards). The horseshoe covers all essential angles efficiently; the Celtic Cross adds extra positions for subconscious themes and final outcome. Choose horseshoe for a thorough but focused reading; choose Celtic Cross when you want maximum depth." },
        { q: "Do I need to bring a specific question?", a: "A question helps focus the spread, but the horseshoe also works as a general situational reading — 'What do I most need to know about my life right now?' is a valid opening. That said, the most powerful readings come from a specific, sincere question that gives the reader a clear lens through which to interpret the positions." },
        { q: "Can the hidden influences position show information about other people?", a: "Yes — the hidden influences position often surfaces what another person is thinking, feeling, or intending that you're not fully aware of. It can also show your own subconscious attitudes, overlooked practical factors, or timing elements that haven't been considered. It tends to be the most revelatory position in the entire spread." },
        { q: "Is the horseshoe spread suitable for recurring life themes rather than a one-time question?", a: "Absolutely. The spread's structure handles recurring patterns particularly well — the past position traces the pattern's origin, the hidden influences reveals what perpetuates it, and the advice and outcome positions chart a constructive path forward. It's an excellent format for working with persistent life themes." },
      ]}
      ctaTitle="Ready for the full picture of your situation?"
      ctaBody="Connect with a skilled tarot reader who can use the horseshoe spread to map every dimension of your situation — from hidden influences to final outcome — in one comprehensive, actionable reading."
      ctaButtonLabel="Browse All Tarot Readers"
      relatedReadings={[
  { title: "5-Card Complex Spread", href: "/readings/5-card-complex-question-spread", icon: "🃏" },
  { title: "Celtic Cross Reading", href: "/readings/10-card-celtic-cross-major-read", icon: "✨" },
  { title: "6-Month Forward Review", href: "/readings/7-card-6-month-forward-review", icon: "📆" },
]}
      pageUrl={`${APP_URL}/readings/7-card-horseshoe-spread-major-read`}
    />
  );
}
