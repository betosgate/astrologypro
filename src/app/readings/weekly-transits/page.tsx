import type { Metadata } from "next";
import { ReadingPageTemplate, type DivinerLandingCard } from "@/components/marketing/reading-page-template";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Weekly Transit Readings | AstrologyPro",
    description:
      "Personalized weekly transit readings show you exactly how current planetary movements activate your natal chart — so you can act with precision rather than guesswork.",
    openGraph: {
      title: "Weekly Transit Readings | AstrologyPro",
      description:
        "Personalized weekly transit readings show you exactly how current planetary movements activate your natal chart — so you can act with precision rather than guesswork.",
      type: "website",
      url: `${APP_URL}/readings/weekly-transits`,
    },
    twitter: {
      card: "summary_large_image",
      title: "Weekly Transit Readings | AstrologyPro",
      description:
        "Personalized weekly transit readings show you exactly how current planetary movements activate your natal chart — so you can act with precision rather than guesswork.",
    },
  };
}

async function getWeeklyTransitsDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "weekly_transits")
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

export default async function WeeklyTransitsPage() {
  const diviners = await getWeeklyTransitsDiviners();
  return (
    <ReadingPageTemplate
      serviceType="astrology"
      badge="Real-Time Planetary Weather"
      heroTitleBefore="Weekly Transits: "
      heroTitleGradient="Your Personal Planetary Forecast"
      heroSubtitle="The planets never stop moving — and their movement creates a constantly shifting field of energy around your natal chart. A weekly transit reading shows you exactly what's activating right now and how to work with it."
      heroStats={[
        { value: "7-Day Window", label: "Focused Weekly Forecast" },
        { value: "Personalized", label: "Mapped to Your Natal Chart" },
      ]}
      startingPrice={65}
      whatIsTitle="What Are Weekly Transits?"
      whatIsParagraphs={[
        "Transits are the ongoing movements of planets through the zodiac. As each planet moves, it forms angular relationships — called aspects — with the planets in your natal chart. These contacts create windows of heightened energy, opportunity, challenge, and change in specific areas of your life.",
        "A weekly transit reading identifies which natal placements are being activated right now, what the activating planet is bringing to the table, and how the combined energy plays out for you specifically — not for your sun sign in general.",
        "Unlike a monthly or annual forecast, a weekly transit reading is surgical in its focus. It captures the precise window of a transit's peak influence so you can schedule important decisions, conversations, and actions around the cosmic weather rather than against it.",
      ]}
      revealsItems={[
        { label: "Active Transits This Week", desc: "Which planets are making exact aspects to your natal chart and when each peaks" },
        { label: "Best Days for Action", desc: "Optimal timing windows for launching, communicating, deciding, and resting" },
        { label: "Tension Points", desc: "Where friction, delays, or heightened intensity is likely — and how to navigate it" },
        { label: "Opportunity Windows", desc: "Jupiter, Venus, and other supportive transits opening doors in specific life areas" },
        { label: "Energy Themes", desc: "The overarching energetic story of your week and what it's asking you to focus on" },
      ]}
      expectCards={[
        { icon: "📅", title: "Day-by-Day Cosmic Map", desc: "Get a clear breakdown of which days carry the most energetic weight — and why — so you can plan meetings, launches, difficult conversations, or rest days with full cosmic context." },
        { icon: "⚡", title: "Precision Timing Insight", desc: "Know exactly when a transit is at peak exactness — the window when its energy is strongest — versus when it's applying (building) or separating (fading). Timing matters enormously in astrological work." },
        { icon: "🛡️", title: "Navigating Difficult Transits", desc: "When Saturn, Mars, or outer planets activate sensitive natal points, your reader will help you understand what the pressure is asking for — and the most constructive way to respond rather than react." },
      ]}
      testimonials={[
        { quote: "I started planning my week around my transit forecast and the difference in how things flow is remarkable. I'm a convert.", name: "Anna T.", location: "Chicago, US", service: "Weekly Transits Reading" },
        { quote: "I always thought astrology was about personality types. Learning how transits work in real time changed everything.", name: "Marcus W.", location: "Sydney, AU", service: "Transit Reading" },
        { quote: "My reader explained exactly why the week felt so tense — Saturn hitting my natal Mercury. Made perfect sense retroactively.", name: "Leila H.", location: "Dubai, UAE", service: "Weekly Transits" },
      ]}
      diviners={diviners}
      discoverLink="/discover?type=astrologer"
      discoverLabel="See All Astrologers"
      divinerSectionTitle="Find Your Weekly Transit Astrologer"
      divinerSectionSubtitle="These practitioners specialize in transit readings and timing"
      emailGuideSubject="your weekly transit reading"
      faqItems={[
        { q: "Do I need to know my natal chart for a weekly transit reading?", a: "It helps enormously if you have your birth data ready (date, time, and location), as the reading maps current transits against your personal chart. If you have a copy of your natal chart already, share it with your reader in advance. If not, your astrologer will cast it from your birth data at the start of the session." },
        { q: "How are personal transits different from general horoscopes?", a: "A general weekly horoscope applies to everyone born under your sun sign — roughly 500 million people. A personal transit reading maps actual planetary positions against your specific natal chart. The results are incomparably more precise and relevant to your actual life circumstances." },
        { q: "How often should I get a weekly transit reading?", a: "Monthly is the most common cadence — reading the upcoming month's most significant transits in one session. Weekly readings are best when you're navigating a high-stakes period: a major decision, a career change, a relationship turning point, or significant outer planet activity." },
        { q: "What's the most important planet to watch in transits?", a: "Saturn (structure and responsibility), Jupiter (expansion and opportunity), and the outer planets Uranus, Neptune, and Pluto are the most transformative because they move slowly and stay active for months. Faster planets like Mercury, Venus, and Mars create short-term weather — useful for timing but not life-changing on their own." },
        { q: "Can transits predict specific events?", a: "Transits describe energetic conditions and themes rather than predicting specific events. A Saturn transit to your natal Venus doesn't guarantee a breakup — it signals a period of relationship seriousness, testing, and maturation. What unfolds depends on your circumstances and choices within that energetic field." },
      ]}
      ctaTitle="Ready to navigate your week with cosmic precision?"
      ctaBody="Work with a certified astrologer to map the planetary movements activating your chart this week — so you can act with clarity, timing, and intention."
      ctaButtonLabel="Browse All Astrologers"
      relatedReadings={[
        { title: "Nativity Birth Chart", href: "/readings/nativity-birth-chart", icon: "🌟" },
        { title: "Monthly Transits & Lunar Return", href: "/readings/monthly-transits-lunar-return", icon: "🌙" },
        { title: "Predictive Event (Horary)", href: "/readings/predictive-event-horary", icon: "🔮" },
      ]}
      pageUrl={`${APP_URL}/readings/weekly-transits`}
    />
  );
}
