import type { Metadata } from "next";
import { ReadingPageTemplate, type DivinerLandingCard } from "@/components/marketing/reading-page-template";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Solar Return Readings | AstrologyPro",
    description:
      "Every year on your birthday, the Sun returns to its exact natal position — creating a new energetic blueprint. Book a Solar Return reading to discover what the year ahead holds.",
    alternates: { canonical: `${APP_URL}/readings/solar-return` },
    openGraph: {
      title: "Solar Return Readings | AstrologyPro",
      description:
        "Every year on your birthday, the Sun returns to its exact natal position — creating a new energetic blueprint for the year ahead.",
      type: "website",
      url: `${APP_URL}/readings/solar-return`,
      images: [{ url: "https://astrologypro.com/images/services/solar-return.png", width: 1200, height: 630, alt: "Solar Return Readings" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Solar Return Readings | AstrologyPro",
      description:
        "Every year on your birthday, the Sun returns to its exact natal position — discover what the year ahead holds.",
      images: ["https://astrologypro.com/images/services/solar-return.png"],
    },
  };
}

async function getSolarReturnDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "solar_return")
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

export default async function SolarReturnPage() {
  const diviners = await getSolarReturnDiviners();
  return (
    <ReadingPageTemplate
      serviceType="astrology"
      badge="Annual Astrological Event"
      heroTitleBefore="Your Solar Return:"
      heroTitleGradient="A New Year in the Stars"
      heroSubtitle="Every year on your birthday, the Sun returns to its exact natal position — creating a new energetic blueprint for the year ahead. A Solar Return reading reveals what the universe has in store for you."
      heroStats={[
        { value: "Annual", label: "Happens Every Year" },
        { value: "Your Birthday", label: "Personal New Year" },
      ]}
      startingPrice={125}
      whatIsTitle="What Is a Solar Return?"
      whatIsParagraphs={[
        "Each year, the Sun returns to the exact degree and minute it occupied at the moment of your birth. This event — your Solar Return — marks the beginning of your personal astrological new year and creates a unique birth chart for the coming 12 months.",
        "Unlike your natal chart, which remains fixed, your Solar Return chart shifts every year — reflecting the new themes, opportunities, and challenges the universe is activating specifically for this cycle of your life.",
        "Where you are physically on your Solar Return day can influence the chart. Some astrologers travel to specific locations to intentionally shape the year ahead.",
      ]}
      revealsItems={[
        { label: "Year's Primary Theme", desc: "The overarching energy and focus for the next 12 months" },
        { label: "Key Life Areas", desc: "Which areas of life will be most activated this year" },
        { label: "Major Opportunities", desc: "Windows of expansion, luck, and forward momentum" },
        { label: "Challenges to Navigate", desc: "Areas requiring attention, patience, or deliberate effort" },
        { label: "Optimal Timing", desc: "When to push forward and when to consolidate" },
      ]}
      expectCards={[
        {
          icon: "☀️",
          title: "Year Ahead Preview",
          desc: "Get a comprehensive look at the energies, themes, and life areas that will be most prominent over the next 12 months — before they unfold.",
        },
        {
          icon: "🌟",
          title: "Opportunities & Themes",
          desc: "Identify where Jupiter, Venus, and supportive planets are placing gifts in your year-ahead chart — and how to act on them with perfect timing.",
        },
        {
          icon: "🧭",
          title: "Challenges to Navigate",
          desc: "Understand where Saturn, Mars, or tense aspects may bring friction — so you can approach those areas with awareness rather than being caught off guard.",
        },
      ]}
      testimonials={[
        {
          quote: "I get a solar return reading every year on my birthday. It's become my annual planning ritual — more useful than any goal-setting exercise I've tried.",
          name: "Laura P.",
          location: "Barcelona, ES",
          service: "Solar Return Reading",
        },
        {
          quote: "My reader predicted that my birthday year would be dominated by relationship themes and home changes. Both happened exactly as described.",
          name: "Nathan F.",
          location: "Vancouver, CA",
          service: "Solar Return",
        },
        {
          quote: "I travel to a specific city every year for my solar return based on my astrologer's recommendations. The difference in my years since starting this practice has been remarkable.",
          name: "Yuki M.",
          location: "Kyoto, JP",
          service: "Solar Return Reading",
        },
      ]}
      diviners={diviners}
      discoverLink="/discover?type=astrologer"
      discoverLabel="See All Astrologers"
      divinerSectionTitle="Find Your Solar Return Astrologer"
      divinerSectionSubtitle="These practitioners specialize in Solar Return readings"
      emailGuideSubject="your Solar Return reading"
      faqItems={[
        {
          q: "What is a Solar Return?",
          a: "A Solar Return is the moment each year when the Sun returns to the exact position it occupied at the time of your birth. Astrologers cast a new chart for this moment, which serves as a forecast for your personal year ahead.",
        },
        {
          q: "Is a Solar Return the same as my birthday?",
          a: "Close, but not exactly. The Sun returns to its precise natal degree within a day or two of your birthday each year — sometimes the day before, sometimes on the day itself, occasionally the day after. The exact moment depends on your birth year and location.",
        },
        {
          q: "Does it matter where I am on my Solar Return?",
          a: "Yes — your location at the moment of your Solar Return affects the Rising sign of the new chart, which changes the house emphases for the year. Some people intentionally travel to a specific city to influence the themes of their Solar Return chart.",
        },
        {
          q: "How far in advance should I book a Solar Return reading?",
          a: "Ideally a few weeks before your birthday, so you can absorb the insights and set intentions before the new year begins. However, a reading is still valuable any time during the year it covers.",
        },
        {
          q: "Can a Solar Return reading replace my natal chart reading?",
          a: "They serve different purposes. Your natal chart reveals your core nature and lifetime themes. Your Solar Return chart shows which of those themes are activated this particular year. The two are most powerful read together.",
        },
      ]}
      ctaTitle="Ready to map your year ahead?"
      ctaBody="Connect with a certified astrologer who can decode your Solar Return chart and help you move through the year with clarity, intention, and grace."
      ctaButtonLabel="Browse All Astrologers"
      relatedReadings={[
        { title: "Nativity Birth Chart", href: "/readings/nativity-birth-chart", icon: "🌟" },
        { title: "Saturn Return Reading", href: "/readings/saturn-return", icon: "🪐" },
        { title: "Monthly Transits & Lunar Return", href: "/readings/monthly-transits-lunar-return", icon: "🌙" },
      ]}
      pageUrl={`${APP_URL}/readings/solar-return`}
    />
  );
}
