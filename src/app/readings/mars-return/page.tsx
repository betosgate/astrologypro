import type { Metadata } from "next";
import { ReadingPageTemplate, type DivinerLandingCard } from "@/components/marketing/reading-page-template";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";
import { getReadingOgImageUrl } from "@/lib/service-images";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Mars Return Readings | AstrologyPro",
    description:
      "Every two years, Mars returns to its natal position — beginning a new cycle of drive, ambition, and assertive energy. A Mars Return reading reveals the themes, battles, and momentum that will define your next chapter of action.",
    alternates: { canonical: `${APP_URL}/readings/mars-return` },
    openGraph: {
      title: "Mars Return Readings | AstrologyPro",
      description:
        "Every two years, Mars returns to its natal position — beginning a new cycle of drive, ambition, and assertive energy. A Mars Return reading reveals the themes, battles, and momentum that will define your next chapter of action.",
      type: "website",
      url: `${APP_URL}/readings/mars-return`,
      images: [{ url: "https://astrologypro.com/images/home/og-card.jpg", width: 1200, height: 630, alt: "Mars Return Readings" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Mars Return Readings | AstrologyPro",
      description:
        "Every two years, Mars returns to its natal position — beginning a new cycle of drive, ambition, and assertive energy. A Mars Return reading reveals the themes, battles, and momentum that will define your next chapter of action.",
      images: ["https://astrologypro.com/images/home/og-card.jpg"],
    },
  };
}

async function getMarsReturnDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "mars_return")
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

export default async function MarsReturnPage() {
  const diviners = await getMarsReturnDiviners();
  return (
    <ReadingPageTemplate
      serviceType="astrology"
      badge="Two-Year Mars Cycle"
      heroImage={getReadingOgImageUrl("mars-return")}
      heroTitleBefore="Your Mars Return:"
      heroTitleGradient="A New Cycle of Drive & Desire"
      heroSubtitle="Every two years, Mars returns to the exact position it occupied at your birth — resetting your personal engine. A Mars Return reading reveals the themes of drive, ambition, desire, conflict, and action that will define your next chapter."
      heroStats={[
        { value: "Every ~2 Years", label: "Mars Completes Its Cycle" },
        { value: "Forward Momentum", label: "Drive, Ambition & Initiative" },
      ]}
      startingPrice={95}
      whatIsTitle="What Is a Mars Return?"
      whatIsParagraphs={[
        "Mars is the planet of drive, ambition, desire, physical energy, assertiveness, and conflict. It takes approximately two years to travel through all twelve zodiac signs and return to the degree it occupied at the moment of your birth. This return marks the beginning of a new Mars cycle in your life.",
        "At the Mars Return, astrologers cast a new chart for the exact moment of the return. This chart reveals the quality of the Mars energy you'll be working with for the coming two years: where your drive will be most powerfully focused, what battles and competitions may arise, how your physical vitality will fare, and what ambitions are ready to launch.",
        "Understanding your Mars Return is especially valuable when you're preparing to start a new venture, compete for an opportunity, navigate a period of intense action or conflict, or recalibrate your relationship with ambition, anger, and desire.",
      ]}
      revealsItems={[
        { label: "Drive & Motivation Themes", desc: "Where your ambition and initiative will be most powerfully focused for the next two years" },
        { label: "Conflict & Competition Patterns", desc: "Where battles, competition, or assertiveness themes are most likely to arise in this cycle" },
        { label: "Physical Energy & Vitality", desc: "The quality and sustainability of your physical energy, endurance, and body-based drive during this Mars cycle" },
        { label: "Desire & What You're Pursuing", desc: "What you want most urgently right now — and whether the chart supports pursuing it directly or with patience" },
        { label: "Optimal Launch Windows", desc: "When to initiate, compete, and push forward — and when to recover and consolidate energy rather than force" },
      ]}
      expectCards={[
        { icon: "🔥", title: "Mars Return Chart Reading", desc: "Your astrologer casts your Mars Return chart and interprets the house where Mars falls, its aspects to natal planets, and the Rising sign of the return — painting a complete picture of what this two-year cycle activates in your life." },
        { icon: "⚔️", title: "Conflict & Competition Themes", desc: "Mars governs battles — external conflicts with others and internal battles with your own resistance. Your reader will identify where conflict themes are most active and how to channel Mars energy constructively rather than destructively." },
        { icon: "🚀", title: "Ambition & Launch Strategy", desc: "The reading closes with concrete guidance on what to initiate during this cycle, where to invest your drive most productively, and how to pace your energy across the full two-year window for maximum effectiveness." },
      ]}
      testimonials={[
        { quote: "My Mars return reading predicted a two-year period of intense professional competition. Knowing it was coming helped me channel the energy rather than be overwhelmed by it.", name: "Alex B.", location: "London, UK", service: "Mars Return Reading" },
        { quote: "I had no idea Mars returns were a thing until this reading. Now I track my cycle every two years. It's uncannily accurate for predicting drive and conflict patterns.", name: "Keisha R.", location: "Atlanta, US", service: "Mars Return Cycle" },
        { quote: "The reading helped me understand why I suddenly felt this enormous drive to start something new. Mars had returned to my natal 10th house. Everything made sense.", name: "Thomas N.", location: "Stockholm, SE", service: "Mars Return Reading" },
      ]}
      diviners={diviners}
      discoverLink="/discover?type=astrologer"
      discoverLabel="See All Astrologers"
      divinerSectionTitle="Find Your Mars Return Astrologer"
      divinerSectionSubtitle="These practitioners specialize in Mars return and predictive astrology"
      emailGuideSubject="your Mars return reading"
      methodNotes={[
        {
          label: "Technique",
          title: "A two-year action cycle",
          desc: "The Mars Return chart is read for initiative, conflict, desire, physical drive, and where your energy wants a cleaner outlet.",
        },
        {
          label: "Best For",
          title: "Launches, stamina, and conflict strategy",
          desc: "Use it before starting a venture, training cycle, campaign, competitive push, or direct confrontation that needs disciplined force.",
        },
        {
          label: "Prepare",
          title: "Bring your current fight or goal",
          desc: "Share where you feel urgency, anger, ambition, or burnout so the reader can help you channel Mars without wasting energy.",
        },
      ]}
      faqItems={[
        { q: "How often does a Mars Return happen?", a: "Mars takes approximately 687 days (just under two years) to return to its natal position. So you experience a Mars Return roughly every two years, though the exact timing shifts based on Mars's elliptical orbit and whether it goes retrograde during the cycle." },
        { q: "Is a Mars Return always significant?", a: "More significant than many minor returns, less sweeping than a Jupiter or Saturn return. The Mars Return is especially important when Mars occupies an angular house (1st, 4th, 7th, or 10th) in the return chart, or when it makes powerful aspects to your natal Sun, Moon, or angles — in those cases, the cycle often brings major initiative-taking, major conflicts, or significant physical exertion." },
        { q: "Should I be worried about my Mars Return?", a: "Mars energy is neutral — it's a force of initiative and drive. The quality of your Mars Return depends on how Mars is configured in both the return chart and your natal chart. Some returns bring exciting forward momentum; others bring necessary battles or physical intensity. A reading gives you the context to work with the energy rather than be blindsided by it." },
        { q: "How does a Mars Return differ from a Saturn Return?", a: "A Saturn Return (around age 29-30 and 58-59) is a major life-restructuring event marking a new chapter of maturity and responsibility. A Mars Return is a shorter, more frequent cycle focused specifically on drive, ambition, and action themes — not the life-overhaul quality of Saturn. Think of Saturn as rebuilding the entire structure and Mars as recharging the engine." },
        { q: "What information do I need for a Mars Return reading?", a: "Your full birth data — date, time, and location — is needed to calculate both your natal Mars position and the Mars Return chart. The more precise the birth time, the more accurate the return chart's Rising sign and house placements will be." },
      ]}
      ctaTitle="Ready to harness your next Mars cycle?"
      ctaBody="Connect with a certified astrologer who can decode your Mars Return chart — showing you where your drive is focused, what ambitions are ready to launch, and how to channel your energy for maximum impact over the next two years."
      ctaButtonLabel="Browse All Astrologers"
      relatedReadings={[
        { title: "Saturn Return Reading", href: "/readings/saturn-return", icon: "🪐" },
        { title: "Jupiter Return Reading", href: "/readings/jupiter-return", icon: "💫" },
        { title: "Nativity Birth Chart", href: "/readings/nativity-birth-chart", icon: "🌟" },
      ]}
      pageUrl={`${APP_URL}/readings/mars-return`}
    />
  );
}
