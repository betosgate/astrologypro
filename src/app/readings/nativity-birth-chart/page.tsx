import type { Metadata } from "next";
import { ReadingPageTemplate, type DivinerLandingCard } from "@/components/marketing/reading-page-template";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";
import { getReadingOgImageUrl } from "@/lib/service-images";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Nativity Birth Chart Readings | AstrologyPro",
    description:
      "Your natal chart is the celestial blueprint of your entire life — cast at the exact moment you drew your first breath. Book a birth chart reading to understand your core nature, purpose, and life path.",
    alternates: { canonical: `${APP_URL}/readings/nativity-birth-chart` },
    openGraph: {
      title: "Nativity Birth Chart Readings | AstrologyPro",
      description:
        "Your natal chart is the celestial blueprint of your entire life — cast at the exact moment you drew your first breath. Book a birth chart reading to understand your core nature, purpose, and life path.",
      type: "website",
      url: `${APP_URL}/readings/nativity-birth-chart`,
      images: [{ url: "https://astrologypro.com/images/services/natal-chart.png", width: 1200, height: 630, alt: "Nativity Birth Chart Readings" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Nativity Birth Chart Readings | AstrologyPro",
      description:
        "Your natal chart is the celestial blueprint of your entire life — cast at the exact moment you drew your first breath.",
      images: ["https://astrologypro.com/images/services/natal-chart.png"],
    },
  };
}

async function getNativityBirthChartDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "natal_chart")
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

export default async function NativityBirthChartPage() {
  const diviners = await getNativityBirthChartDiviners();
  return (
    <ReadingPageTemplate
      serviceType="astrology"
      badge="The Foundation of All Astrology"
      heroImage={getReadingOgImageUrl("nativity-birth-chart")}
      heroTitleBefore="Your Natal Chart: "
      heroTitleGradient="The Map of Your Soul"
      heroSubtitle="Cast at the precise moment you were born, your natal chart is the most personal astrological document that exists — a complete portrait of your soul's journey, gifts, challenges, and purpose."
      heroStats={[
        { value: "Lifetime Blueprint", label: "Unique to Your Birth Moment" },
        { value: "Your Birth Moment", label: "Exact to the Minute & Location" },
      ]}
      startingPrice={175}
      whatIsTitle="What Is a Nativity Birth Chart?"
      whatIsParagraphs={[
        "Your natal chart — also called a nativity or birth chart — is a map of where every planet in the solar system was positioned at the exact moment and place of your birth. It is unique to you, functioning as a cosmic fingerprint that never repeats.",
        "Unlike sun sign horoscopes that apply to one-twelfth of the population, your natal chart captures the placement of the Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto — each in a specific zodiac sign, house, and angular relationship to the others.",
        "Reading the natal chart is the most foundational skill in astrology. Every other technique — solar returns, transits, progressions — layers on top of this bedrock map. Understanding your chart is understanding yourself at the deepest level.",
      ]}
      revealsItems={[
        { label: "Core Identity & Purpose", desc: "Sun sign, rising sign, and their combined message about who you are and why you're here" },
        { label: "Emotional Landscape", desc: "Moon placement revealing your instincts, emotional needs, and what makes you feel safe" },
        { label: "Mind & Communication Style", desc: "Mercury position showing how you think, learn, process information, and express yourself" },
        { label: "Relationship Patterns", desc: "Venus and 7th house themes revealing how you love, attract, and connect with others" },
        { label: "Career & Life Path", desc: "10th house, Midheaven, and Saturn placement mapping your vocational calling and public legacy" },
      ]}
      expectCards={[
        { icon: "🌟", title: "Complete Planetary Portrait", desc: "Your reader will walk through every major planet, its sign and house placement, and what each reveals about a distinct dimension of your personality and life experience." },
        { icon: "🔗", title: "How the Chart Speaks as a Whole", desc: "Beyond individual placements, your astrologer will reveal the key aspect patterns and configurations that link the planets — showing the core themes and tensions that run through your entire life." },
        { icon: "🗺️", title: "Practical Life Guidance", desc: "The reading translates abstract symbolism into grounded insight — how your chart speaks to relationships, career, timing, and the soul-level purpose that underlies your specific incarnation." },
      ]}
      testimonials={[
        { quote: "I had no idea how much my natal chart could explain about patterns I've carried my whole life. This reading changed how I see everything.", name: "Sarah K.", location: "London, UK", service: "Birth Chart Reading" },
        { quote: "My reader decoded my chart with such depth — it felt like she'd known me for years. Completely transformed my self-understanding.", name: "James R.", location: "New York, US", service: "Natal Chart Reading" },
        { quote: "I was skeptical, but the accuracy blew me away. I've since referred three close friends. Worth every penny.", name: "Priya M.", location: "Toronto, CA", service: "Natal Chart Reading" },
      ]}
      diviners={diviners}
      discoverLink="/discover?type=astrologer"
      discoverLabel="See All Astrologers"
      divinerSectionTitle="Find Your Birth Chart Astrologer"
      divinerSectionSubtitle="These practitioners specialize in natal chart readings"
      emailGuideSubject="your natal chart reading"
      faqItems={[
        { q: "What information do I need for a birth chart reading?", a: "You'll need your birth date, birth time, and birth location. The birth time is crucial — even a few minutes of difference changes your Rising sign and shifts all the house cusps. If you don't know your exact birth time, check your birth certificate or ask a parent. A rectified chart (without birth time) is still valuable but less precise." },
        { q: "I already know my sun sign — will I learn anything new?", a: "Enormously more. Your sun sign is one placement out of many in your natal chart. A full reading covers the Moon (emotional nature), Rising sign (outer personality), Mercury (how you think), Venus (how you love), Mars (how you act), and several outer planets — each adding layers of nuance your sun sign alone cannot offer." },
        { q: "How long does a birth chart reading typically take?", a: "A thorough natal chart reading runs 60–90 minutes. The chart contains a lifetime of information, and a skilled astrologer will pace the session to cover the most personally relevant themes rather than rushing through every placement mechanically." },
        { q: "Can I get a birth chart reading if I don't know my birth time?", a: "Yes — a solar chart (using noon as default time) still covers most planetary placements accurately. You'll miss the precise Rising sign and house structure, but the reading remains highly informative. Some astrologers offer rectification services to narrow down the likely birth time through key life events." },
        { q: "Is a natal chart reading the same as a horoscope?", a: "No. A horoscope is a generalized sun-sign forecast written for millions of people. A natal chart reading is personalized to you specifically — based on the unique planetary map of your birth moment. The two are not comparable in depth or precision." },
      ]}
      ctaTitle="Ready to understand your soul's blueprint?"
      ctaBody="Connect with a certified astrologer who can decode the full architecture of your natal chart — revealing the gifts, challenges, and purpose written in the stars at the moment of your birth."
      ctaButtonLabel="Browse All Astrologers"
      relatedReadings={[
        { title: "Solar Return Reading", href: "/readings/solar-return", icon: "☀️" },
        { title: "Saturn Return Reading", href: "/readings/saturn-return", icon: "🪐" },
        { title: "Romantic Relationship Reading", href: "/readings/romantic-relationships", icon: "💞" },
      ]}
      pageUrl={`${APP_URL}/readings/nativity-birth-chart`}
    />
  );
}
