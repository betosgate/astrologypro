import type { Metadata } from "next";
import { ReadingPageTemplate, type DivinerLandingCard } from "@/components/marketing/reading-page-template";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Romantic Relationship Readings | AstrologyPro",
    description:
      "Synastry and composite chart analysis for romantic compatibility — revealing how two people connect, communicate, clash, and grow together astrologically.",
    openGraph: {
      title: "Romantic Relationship Readings | AstrologyPro",
      description:
        "Synastry and composite chart analysis for romantic compatibility — revealing how two people connect, communicate, clash, and grow together astrologically.",
      type: "website",
      url: `${APP_URL}/readings/romantic-relationships`,
    },
    twitter: {
      card: "summary_large_image",
      title: "Romantic Relationship Readings | AstrologyPro",
      description:
        "Synastry and composite chart analysis for romantic compatibility — revealing how two people connect, communicate, clash, and grow together astrologically.",
    },
  };
}

async function getRomanticRelationshipsDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "romantic_relationships")
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

export default async function RomanticRelationshipsPage() {
  const diviners = await getRomanticRelationshipsDiviners();
  return (
    <ReadingPageTemplate
      serviceType="astrology"
      badge="Relationship Astrology"
      heroTitleBefore="Romantic Relationships: "
      heroTitleGradient="The Astrology of Love & Connection"
      heroSubtitle="Every relationship has its own astrological signature. Synastry reveals how two charts interact — the magnetic pull, the friction points, the growth edges. The composite chart reveals the relationship itself as its own living entity."
      heroStats={[
        { value: "Synastry", label: "Two Charts in Contact" },
        { value: "Composite", label: "The Relationship's Own Chart" },
      ]}
      startingPrice={125}
      whatIsTitle="What Is a Romantic Relationship Astrology Reading?"
      whatIsParagraphs={[
        "A romantic relationship reading uses two primary techniques. Synastry overlays one person's natal chart on top of another's, examining the aspects formed between their planetary placements — what draws them together, where they energize each other, and where tension naturally arises.",
        "The composite chart takes a different approach: it calculates the midpoints between the two individuals' charts to create an entirely new chart — the chart of the relationship itself. This chart reveals the purpose, dynamics, and evolutionary direction of the partnership as a whole.",
        "Used together, synastry and composite analysis provide the most complete astrological portrait of a romantic connection. Whether you're in a new relationship, navigating long-term partnership, or trying to understand a past connection, this reading offers clarity that few other tools can match.",
      ]}
      revealsItems={[
        { label: "Attraction & Chemistry", desc: "The planetary contacts that create magnetic pull, fascination, and physical attraction between two people" },
        { label: "Communication & Understanding", desc: "How each person thinks, speaks, and processes — and where natural understanding or misunderstanding lives" },
        { label: "Emotional Connection", desc: "Moon and Venus interactions showing how each person's emotional needs and love language align or clash" },
        { label: "Growth & Challenge", desc: "Saturn, Mars, and outer planet contacts that create the friction and pressure points that drive growth" },
        { label: "Long-Term Potential", desc: "The composite chart's signature revealing the purpose, direction, and evolutionary arc of the relationship" },
      ]}
      expectCards={[
        { icon: "💫", title: "Synastry Analysis", desc: "Your astrologer will identify the most significant contacts between your two charts — the Venus-Mars aspects, Moon connections, Saturn contacts, and nodal links that form the core story of how these two people affect each other." },
        { icon: "💑", title: "Composite Chart Reading", desc: "The composite chart is examined as its own entity — what is this relationship here to do? What themes does it carry? What does it ask of both people? Where does it flourish and where does it struggle?" },
        { icon: "🌱", title: "Practical Relationship Guidance", desc: "The reading closes with grounded, compassionate guidance on communication strategies, navigating the tension points, and how to align with the highest expression of what your connection is capable of." },
      ]}
      testimonials={[
        { quote: "My partner and I got a synastry reading together. Understanding the chart dynamics completely changed how we communicate.", name: "Elena V.", location: "Paris, FR", service: "Relationship Reading" },
        { quote: "I got a reading on a relationship that had ended and finally understood why it felt so intense and why it couldn't work. Deeply healing.", name: "Daniel S.", location: "Los Angeles, US", service: "Synastry Reading" },
        { quote: "The composite chart reading for my marriage was the most meaningful thing we've done together. We reference it constantly.", name: "Ami & Kenji L.", location: "Tokyo, JP", service: "Composite Chart Reading" },
      ]}
      diviners={diviners}
      discoverLink="/discover?type=astrologer"
      discoverLabel="See All Astrologers"
      divinerSectionTitle="Find Your Relationship Astrologer"
      divinerSectionSubtitle="These practitioners specialize in synastry and composite chart readings"
      emailGuideSubject="your relationship astrology reading"
      faqItems={[
        { q: "Do I need both people's birth data for a relationship reading?", a: "Yes — you'll need the birth date, time, and location for both individuals. The more precise the data (especially birth time), the more accurate and nuanced the synastry and composite analysis will be. If your partner's birth time is unknown, the reading will still provide valuable insight using a solar chart." },
        { q: "Does my partner need to be present for the reading?", a: "No. The reading is done with chart data alone. You can have the reading on your own, and your astrologer will interpret both charts objectively without requiring your partner's participation or knowledge." },
        { q: "Can astrology tell me if someone is my soulmate?", a: "Astrology can reveal deep resonance, karmic connection (through nodal contacts), and powerful energetic pull between two charts. However, the concept of a 'soulmate' goes beyond technique — your astrologer can show you what the connection is astrologically built for, but the choices you make within it determine the outcome." },
        { q: "Can this reading be done for a relationship that has ended?", a: "Absolutely. Many people seek a relationship reading specifically to understand a past connection — why it felt so intense, what the purpose of it was, and what patterns to carry forward. Past relationship readings are some of the most healing and clarifying sessions available." },
        { q: "Is synastry or composite more important?", a: "They answer different questions. Synastry shows how two individuals interact — their chemistry, tensions, and communication patterns. The composite chart shows what the relationship itself is — its purpose, themes, and direction. Both are needed for a complete picture. Most skilled astrologers use them together." },
      ]}
      ctaTitle="Ready to understand your connection at its deepest level?"
      ctaBody="Connect with a certified relationship astrologer who can decode the synastry and composite charts — revealing the magnetic pull, growth edges, and deeper purpose of your most important connection."
      ctaButtonLabel="Browse All Astrologers"
      relatedReadings={[
        { title: "Friendship Relationship Reading", href: "/readings/friendship-relationships", icon: "🤝" },
        { title: "Business Relationship Reading", href: "/readings/business-relationship", icon: "💼" },
        { title: "Nativity Birth Chart", href: "/readings/nativity-birth-chart", icon: "🌟" },
      ]}
      pageUrl={`${APP_URL}/readings/romantic-relationships`}
    />
  );
}
