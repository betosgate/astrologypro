import type { Metadata } from "next";
import { ReadingPageTemplate, type DivinerLandingCard } from "@/components/marketing/reading-page-template";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Jupiter Return Readings | AstrologyPro",
    description:
      "Every ~12 years, Jupiter returns to its birth position — bringing a wave of expansion, opportunity, and good fortune. Book a reading to make the most of this powerful window.",
    openGraph: {
      title: "Jupiter Return Readings | AstrologyPro",
      description:
        "Every ~12 years, Jupiter returns to its birth position — bringing a wave of expansion, opportunity, and good fortune. Book a reading to make the most of this powerful window.",
      type: "website",
      url: `${APP_URL}/readings/jupiter-return`,
    },
    twitter: {
      card: "summary_large_image",
      title: "Jupiter Return Readings | AstrologyPro",
      description:
        "Every ~12 years, Jupiter returns to its birth position — bringing a wave of expansion, opportunity, and good fortune. Book a reading to make the most of this powerful window.",
    },
  };
}

async function getJupiterReturnDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "jupiter_return")
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
    query = query
      .eq("is_certified", true)
      .order("is_certified", { ascending: false });
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
      if (!fallbackPrices.has(id) || price < fallbackPrices.get(id)!) {
        fallbackPrices.set(id, price);
      }
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

  const missingPriceIds = diviners
    .map((d) => d.id as string)
    .filter((id) => !priceByDiviner.has(id));

  if (missingPriceIds.length > 0) {
    const { data: extraServices } = await admin
      .from("services")
      .select("diviner_id, base_price")
      .in("diviner_id", missingPriceIds)
      .eq("is_active", true);

    for (const svc of extraServices ?? []) {
      const id = svc.diviner_id as string;
      const price = Number(svc.base_price);
      if (!priceByDiviner.has(id) || price < priceByDiviner.get(id)!) {
        priceByDiviner.set(id, price);
      }
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

export default async function JupiterReturnPage() {
  const diviners = await getJupiterReturnDiviners();
  return (
    <ReadingPageTemplate
      serviceType="astrology"
      badge="Astrological Life Events"
      heroTitleBefore="Your Jupiter Return:"
      heroTitleGradient="A Cycle of Abundance Begins"
      heroSubtitle="Every ~12 years, Jupiter returns to its birth position — opening a new chapter of expansion, opportunity, and abundance. A Jupiter Return reading reveals exactly where that growth is directed in your unique chart and how to align with it."
      heroStats={[
        { value: "~Every 12 Years", label: "Jupiter Returns" },
        { value: "New 12-Year Chapter", label: "Begins at Each Return" },
      ]}
      startingPrice={95}
      whatIsTitle="What Is a Jupiter Return?"
      whatIsParagraphs={[
        "Jupiter, the planet of growth, luck, wisdom, and abundance, completes its orbit around the Sun approximately every 12 years. When it returns to the same zodiac position it occupied at your birth, you experience a Jupiter Return — a personal renewal of your potential and a reset of your 12-year cycle of expansion.",
        "Unlike Saturn's demanding energy, Jupiter brings gifts: expanded opportunities, renewed optimism, and a broader sense of what is possible. Each return opens a new chapter — in career, relationships, learning, and spiritual growth — and the house Jupiter occupies in your natal chart reveals exactly where that expansion is directed.",
        "The depth of what you experience depends on alignment. An astrologer reads your Jupiter placement, the transiting return chart, and the aspects forming to other planets — giving you a precise map of where to invest your energy, which doors are genuinely opening, and how to avoid Jupiter's shadow of overreach, overcommitment, or scattered focus.",
      ]}
      revealsItems={[
        { label: "Which Life Area Jupiter Is Activating", desc: "The specific house and domain — career, love, learning, travel, creativity — where expansion is most powerfully directed in your chart for this 12-year cycle" },
        { label: "Concrete Opportunities Opening Now", desc: "The real doors Jupiter is unlocking — business growth, educational paths, relationships, creative projects — and the optimal window to walk through them" },
        { label: "Your Philosophical & Spiritual Direction", desc: "How this return reorients your beliefs, values, and sense of meaning — and what Jupiter's placement says about the deeper purpose driving this new chapter" },
        { label: "Timing: When to Act Boldly", desc: "The peak months of the return transit and the specific windows when launching, investing, committing, or expanding will be most powerfully supported" },
        { label: "Blind Spots & Overreach Risks", desc: "Where Jupiter's excess may lead to overconfidence, overcommitment, or scattered energy — and how your reader helps you channel abundance without losing focus" },
      ]}
      expectCards={[
        { icon: "💰", title: "Career & Abundance", desc: "Jupiter returns often coincide with major career leaps, new business opportunities, financial expansion, and professional recognition. This is the time to take bold action toward your biggest goals." },
        { icon: "✈️", title: "Travel & Learning", desc: "The planet of philosophy, higher learning, and exploration encourages you to broaden your horizons — through travel, education, new belief systems, or cross-cultural connections." },
        { icon: "🌟", title: "Spiritual Growth", desc: "Jupiter rules wisdom and meaning. Its return can trigger profound spiritual awakenings, deepened faith, or an expanded sense of purpose. Many people describe this as a period of feeling truly guided." },
      ]}
      testimonials={[
        { quote: "I had my Jupiter return reading at 35 and used it as a roadmap for the next 12 years. Every major theme my reader identified has unfolded.", name: "Nia O.", location: "Lagos, NG", service: "Jupiter Return Reading" },
        { quote: "My reader showed me exactly which areas of life Jupiter was about to expand for the coming cycle. I made very different choices than I would have otherwise — all better ones.", name: "Henrik J.", location: "Oslo, NO", service: "Jupiter Return" },
        { quote: "I booked my Jupiter return reading six months before it peaked and used the insights to time my business launch perfectly. The timing worked out exactly as predicted.", name: "Isabel C.", location: "São Paulo, BR", service: "Jupiter Return Reading" },
      ]}
      diviners={diviners}
      discoverLink="/discover?type=astrologer"
      discoverLabel="See All Astrologers"
      divinerSectionTitle="Find Your Jupiter Return Guide"
      divinerSectionSubtitle="These practitioners specialize in Jupiter Return readings"
      emailGuideSubject="your Jupiter return reading"
      faqItems={[
        { q: "What is a Jupiter Return?", a: "A Jupiter Return occurs approximately every 12 years when Jupiter transits back to the zodiac sign and degree it occupied at the time of your birth. It marks the beginning of a new cycle of growth, expansion, and opportunity in your life." },
        { q: "How often does a Jupiter Return happen?", a: "Jupiter takes about 11.86 years to orbit the Sun, so you will experience a Jupiter Return roughly every 12 years — at ages 12, 24, 35–36, 47–48, 59–60, 71–72, and so on throughout your life." },
        { q: "How long does a Jupiter Return last?", a: "Jupiter moves relatively quickly through each sign over about 12 months. The exact return transit may last a few weeks, but the energy of the new cycle it initiates unfolds over the full 12 years that follow." },
        { q: "Do I need my birth time for a Jupiter Return reading?", a: "Your birth time provides the most complete picture, particularly for house placements. However, even without an exact time, an astrologer can identify significant themes and the primary areas of life Jupiter will activate." },
        { q: "What makes a Jupiter Return reading different from a general natal reading?", a: "A Jupiter Return reading focuses specifically on the current 12-year cycle being activated — the new chapter Jupiter is opening. The astrologer examines Jupiter's natal placement, the transiting return chart, and how it interacts with your current life circumstances." },
      ]}
      ctaTitle="Ready to harness your Jupiter Return?"
      ctaBody="Work with a certified astrologer to understand exactly where Jupiter's abundance is flowing in your chart — and how to align your actions with this cosmic window."
      ctaButtonLabel="Browse All Astrologers"
      relatedReadings={[
        { title: "Saturn Return Reading", href: "/readings/saturn-return", icon: "🪐" },
        { title: "Nativity Birth Chart", href: "/readings/nativity-birth-chart", icon: "🌟" },
        { title: "Solar Return Reading", href: "/readings/solar-return", icon: "☀️" },
      ]}
      pageUrl={`${APP_URL}/readings/jupiter-return`}
    />
  );
}
