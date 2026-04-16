import type { Metadata } from "next";
import { ReadingPageTemplate, type DivinerLandingCard } from "@/components/marketing/reading-page-template";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "12 Card Astrological Tarot Spread | AstrologyPro",
    description:
      "The 12-card astrological spread maps one card to each astrological house — creating a holistic yearly overview covering all major life areas from identity and money to relationships, career, and spirituality.",
    alternates: { canonical: `${APP_URL}/readings/12-card-astrological-spread-major-read` },
    openGraph: {
      title: "12 Card Astrological Tarot Spread | AstrologyPro",
      description:
        "The 12-card astrological spread maps one card to each astrological house — creating a holistic yearly overview covering all major life areas from identity and money to relationships, career, and spirituality.",
      type: "website",
      url: `${APP_URL}/readings/12-card-astrological-spread-major-read`,
      images: [{ url: "https://astrologypro.com/images/services/12-card-astrological.png", width: 1200, height: 630, alt: "12-Card Astrological Spread" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "12 Card Astrological Tarot Spread | AstrologyPro",
      description:
        "The 12-card astrological spread maps one card to each astrological house — creating a holistic yearly overview covering all major life areas from identity and money to relationships, career, and spirituality.",
      images: ["https://astrologypro.com/images/services/12-card-astrological.png"],
    },
  };
}

async function getAstrologicalSpreadDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "12_card_astrological_spread_major_read")
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

export default async function AstrologicalSpreadPage() {
  const diviners = await getAstrologicalSpreadDiviners();
  return (
    <ReadingPageTemplate
      serviceType="tarot"
      badge="Tarot Meets Astrology"
      heroTitleBefore="12-Card Astrological Spread:"
      heroTitleGradient="Your Life's Full Landscape"
      heroSubtitle="One card for each of the twelve astrological houses — this spread merges tarot symbolism with the holistic architecture of astrology to give you a panoramic view of every major dimension of your life in a single reading."
      heroStats={[
        { value: "12 Cards", label: "All 12 Astrological Houses" },
        { value: "75 Minutes", label: "Every Life Area Covered" },
      ]}
      startingPrice={125}
      whatIsTitle="What Is the 12-Card Astrological Tarot Spread?"
      whatIsParagraphs={[
        "The 12-card astrological spread draws one tarot card for each of the twelve astrological houses — the symbolic domains that astrology uses to map all areas of human experience. House 1 covers identity and self-image; House 2, finances and values; House 3, communication and siblings; and so on through House 12, which governs the hidden, spiritual, and subconscious.",
        "Each card is interpreted in the context of its house's themes, merging the rich symbolic language of tarot with the archetypal framework of astrological houses. The result is a uniquely holistic reading — one that addresses every major life area simultaneously rather than focusing narrowly on one question or situation.",
        "This spread works especially well as a yearly overview reading — a panoramic snapshot of where each life area stands right now and where it's moving. It reveals which areas are flourishing, which are under pressure, and which are ready for conscious attention — all in a single, integrated session.",
      ]}
      revealsItems={[
        { label: "Which Life Area Needs Your Attention Most", desc: "The spread instantly shows where strong or challenging cards cluster — revealing which houses are active and which are quiet, so you know where to direct your energy in the months ahead" },
        { label: "Your Financial & Relationship Energy Right Now", desc: "Separate cards for Houses 2 and 7 show the current state of your material resources and your most important partnership simultaneously — often revealing whether these two areas are supporting or draining each other" },
        { label: "Career Trajectory vs. Daily Work Reality", desc: "House 10 (long-term vocation) and House 6 (daily work and health) each get their own card — surfacing the gap or alignment between what you're building and what you're actually living day to day" },
        { label: "What's Hidden or Subconscious Right Now", desc: "House 12 is often the most surprising card of the spread — revealing what's operating beneath conscious awareness: what needs releasing, what's being quietly prepared, what you haven't yet let yourself see" },
        { label: "The Overarching Story Across All 12 Areas", desc: "Beyond individual houses, your reader identifies the dominant suit, the recurring archetypes, and the unifying message the full circle of twelve cards is collectively telling about where you are in your life right now" },
      ]}
      expectCards={[
        { icon: "🔮", title: "Twelve-Card Full Layout", desc: "Your reader draws one card for each of the 12 astrological houses and lays them in order, creating a full-circle map of your life. Even before interpretation begins, the overall energy pattern — which houses have 'strong' cards, which have 'quiet' cards — tells its own story." },
        { icon: "⭐", title: "House-by-House Interpretation", desc: "Each card is interpreted in the context of its house's themes — tarot's symbolism applied to astrology's structural framework. The result is a uniquely precise reading that brings each life area into focus with both systems working in concert." },
        { icon: "🗺️", title: "Yearly Life Overview", desc: "The reading closes with a synthesis of the full spread — which themes are dominant, which areas deserve the most attention, and the overall message the cards are carrying for where you are in your life right now and where the year ahead is inviting you to focus." },
      ]}
      testimonials={[
        { quote: "Twelve cards, twelve houses, one complete picture of my life. I came in with one question and left understanding every area I'd been neglecting.", name: "Zara P.", location: "Dubai, UAE", service: "Astrological Spread Reading" },
        { quote: "This is my annual review ritual. Every January I book a 12-card astrological spread to see where each life area stands. It's more useful than any business planning tool.", name: "Henry C.", location: "Hong Kong, HK", service: "12-Card Astrological Spread" },
        { quote: "My reader explained how the cards mapped to the astrological houses. Seeing tarot and astrology work together in the same reading was extraordinary.", name: "Amara D.", location: "Accra, GH", service: "Astrological Major Read" },
      ]}
      diviners={diviners}
      discoverLink="/discover?type=tarot"
      discoverLabel="See All Tarot Readers"
      divinerSectionTitle="Find Your Astrological Tarot Reader"
      divinerSectionSubtitle="These readers specialize in astrological tarot and comprehensive overview spreads"
      emailGuideSubject="your astrological tarot reading"
      faqItems={[
        { q: "Do I need to know astrology to benefit from this reading?", a: "Not at all. Your reader handles all the astrological framework — you simply receive the interpretation. The 12-house structure is entirely in the background; the reading you receive feels like a rich, multi-topic tarot session covering every area of your life. You don't need any astrology knowledge to get enormous value from it." },
        { q: "Does this reading require birth data?", a: "The 12-card astrological spread typically uses the 12 houses as a symbolic framework rather than calculating your personal astrological chart. However, some readers do incorporate your natal chart alongside the tarot spread for an even more personalized reading. Check with your practitioner about their approach before booking." },
        { q: "Which house cards tend to be most significant?", a: "The 1st house (self and identity), 10th house (career and public life), and 7th house (relationships and partnerships) are often the most immediately relevant to daily life. However, the most surprising and valuable insights often come from the 12th house (hidden matters) and the 8th house (transformation and shared resources), which people rarely examine consciously." },
        { q: "Is this spread suitable for a yearly review?", a: "It's ideal for it. Many people book this reading at the start of a new year, around their birthday, or at a major life transition — using it as an annual full-life audit. It answers 'Where am I right now in every area of my life?' in a single session, making it one of the most practically useful major readings available." },
        { q: "Can this spread address a specific question or is it always a general overview?", a: "It works best as a holistic overview — that's its design. If you have a specific, focused question, a 3-card or 5-card spread will serve it better. The 12-card astrological spread shines when you want the big picture: all twelve life areas, all at once, with the depth that brings clarity to each." },
      ]}
      ctaTitle="Ready for the full panorama of your life?"
      ctaBody="Connect with a skilled tarot reader who works fluently at the intersection of tarot and astrology — mapping one card to each of the twelve houses to give you the most complete single-session portrait of your life available anywhere."
      ctaButtonLabel="Browse All Tarot Readers"
      relatedReadings={[
  { title: "10-Card Relationship Spread", href: "/readings/10-card-relationship-spread", icon: "💞" },
  { title: "Celtic Cross Reading", href: "/readings/10-card-celtic-cross-major-read", icon: "✨" },
  { title: "Nativity Birth Chart", href: "/readings/nativity-birth-chart", icon: "🌟" },
]}
      pageUrl={`${APP_URL}/readings/12-card-astrological-spread-major-read`}
    />
  );
}
