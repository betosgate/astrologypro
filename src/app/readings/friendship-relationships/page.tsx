import type { Metadata } from "next";
import { ReadingPageTemplate, type DivinerLandingCard } from "@/components/marketing/reading-page-template";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";
import { getReadingOgImageUrl } from "@/lib/service-images";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Friendship Compatibility Readings | AstrologyPro",
    description:
      "Understand your friendships through synastry and composite chart analysis — revealing the shared values, communication chemistry, and long-term connection potential between you and your closest companions.",
    alternates: { canonical: `${APP_URL}/readings/friendship-relationships` },
    openGraph: {
      title: "Friendship Compatibility Readings | AstrologyPro",
      description:
        "Understand your friendships through synastry and composite chart analysis — revealing the shared values, communication chemistry, and long-term connection potential between you and your closest companions.",
      type: "website",
      url: `${APP_URL}/readings/friendship-relationships`,
      images: [{ url: "https://astrologypro.com/images/services/friendship-relationships.png", width: 1200, height: 630, alt: "Friendship Relationship Readings" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Friendship Compatibility Readings | AstrologyPro",
      description:
        "Understand your friendships through synastry and composite chart analysis — revealing the shared values, communication chemistry, and long-term connection potential between you and your closest companions.",
      images: ["https://astrologypro.com/images/services/friendship-relationships.png"],
    },
  };
}

async function getFriendshipRelationshipsDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "friendship_relationships")
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

export default async function FriendshipRelationshipsPage() {
  const diviners = await getFriendshipRelationshipsDiviners();
  return (
    <ReadingPageTemplate
      serviceType="astrology"
      badge="Friendship Astrology"
      heroImage={getReadingOgImageUrl("friendship-relationships")}
      heroTitleBefore="Friendship Compatibility: "
      heroTitleGradient="The Astrology of Your Closest Bonds"
      heroSubtitle="Friendships are not random. The people who become your trusted companions carry specific astrological signatures that resonate with your own chart. Understanding that resonance reveals why certain connections feel effortless — and why others require more conscious navigation."
      heroStats={[
        { value: "Synastry", label: "Two Charts in Dialogue" },
        { value: "Composite", label: "The Friendship's Own Identity" },
      ]}
      startingPrice={125}
      whatIsTitle="What Is a Friendship Compatibility Reading?"
      whatIsParagraphs={[
        "A friendship compatibility reading uses the same core techniques as romantic relationship astrology — synastry and composite chart analysis — but with the lens focused on platonic connection: mutual understanding, shared values, intellectual chemistry, and the quality of emotional support between two people.",
        "Synastry overlays your birth chart on your friend's, examining the angular contacts between your planets. Mercury connections reveal how naturally your minds click. Jupiter aspects show where you expand each other. Saturn contacts point to where the friendship carries responsibility and depth.",
        "The composite chart synthesizes both charts into one, revealing the friendship's own astrological character — what it is built for, what themes it carries, and what it asks of both people to sustain and grow.",
      ]}
      revealsItems={[
        { label: "Natural Rapport", desc: "The planetary contacts that create instant ease, shared humor, and the sense of 'we just get each other'" },
        { label: "Communication Chemistry", desc: "Mercury and 3rd house interactions showing how naturally — or with what effort — you understand each other's minds" },
        { label: "Shared Values & Worldview", desc: "Jupiter and Venus contacts revealing overlapping values, pleasures, and ways of seeing the world" },
        { label: "Where Tension Lives", desc: "Saturn, Mars, and challenging aspect patterns that create friction — and the growth those tensions enable" },
        { label: "Long-Term Potential", desc: "Composite chart themes revealing whether this friendship deepens over time or serves a specific seasonal purpose" },
      ]}
      expectCards={[
        { icon: "🤝", title: "Synastry Between Friends", desc: "Your astrologer examines the most significant contacts between both charts — the Mercury trines that make conversation flow, the Saturn oppositions that create respectful challenge, and the nodal contacts that suggest a soul-level connection." },
        { icon: "🌐", title: "Composite Chart for the Friendship", desc: "The composite chart is read as its own entity — what is this friendship here to do? What does it bring into both people's lives? What themes and purposes does it carry beyond individual preference?" },
        { icon: "💬", title: "Practical Navigation", desc: "The reading closes with grounded insights on communication styles, how each person gives and receives support, where natural misunderstandings arise, and how to bring out the best in the connection." },
      ]}
      testimonials={[
        { quote: "I got a reading on my friendship with my best friend and the synastry explained everything — why we click and where we clash.", name: "Sara J.", location: "Amsterdam, NL", service: "Friendship Reading" },
        { quote: "I was puzzled why a close friendship suddenly became difficult. The chart showed exactly what transits were activating the tension.", name: "Carlos R.", location: "Buenos Aires, AR", service: "Friendship Compatibility" },
        { quote: "The composite chart for my friendship group was fascinating. It showed the purpose and limits of the connection so clearly.", name: "Yuki T.", location: "Osaka, JP", service: "Friendship Reading" },
      ]}
      diviners={diviners}
      discoverLink="/discover?type=astrologer"
      discoverLabel="See All Astrologers"
      divinerSectionTitle="Find Your Friendship Compatibility Astrologer"
      divinerSectionSubtitle="These practitioners specialize in synastry and compatibility readings"
      emailGuideSubject="your friendship compatibility reading"
      methodNotes={[
        {
          label: "Technique",
          title: "Platonic synastry and composite analysis",
          desc: "The reading uses relationship-chart techniques but prioritizes Mercury, Moon, Jupiter, 3rd-house, and 11th-house themes over romance.",
        },
        {
          label: "Best For",
          title: "Support, trust, and changing dynamics",
          desc: "Use it for best friends, creative collaborators, chosen family, strained friendships, or connections that feel meaningful but hard to define.",
        },
        {
          label: "Prepare",
          title: "Bring both charts and the friendship story",
          desc: "Share both birth records plus how the friendship began, what changed, and what kind of support or repair you want to understand.",
        },
      ]}
      faqItems={[
        { q: "Do I need both people's birth data for a friendship reading?", a: "Yes — you'll need the birth date, time, and location for both individuals. Birth time is especially important for accurate house placements and rising sign contacts. If you only have the date (no time), the reading will still be valuable but will use a solar chart with less precise house analysis." },
        { q: "Can this reading be done for a friendship that has become strained?", a: "Absolutely. Many people seek this reading when a close friendship has changed or grown difficult. The chart can reveal what created the original bond, what's currently being activated to create tension, and whether the connection has long-term composite chart support to work through the difficulty." },
        { q: "Is this different from a romantic relationship reading?", a: "The techniques are the same — synastry and composite — but the interpretive focus shifts. A friendship reading looks at Mercury, Jupiter, and mental chemistry as primary themes rather than Venus, Mars, and erotic attraction. A skilled astrologer will frame the reading entirely within the context of platonic connection." },
        { q: "Can I bring more than two friends into the reading?", a: "Most readings focus on two charts at a time for depth and clarity. If you want to understand group dynamics (e.g., a trio of close friends), that's possible but typically requires a longer, more complex session. Ask your astrologer about multi-chart readings before booking." },
        { q: "Does a good synastry guarantee a lifelong friendship?", a: "Easy synastry creates natural rapport, but lasting friendships require shared investment and care regardless of astrology. Challenging synastry doesn't prevent deep friendship either — some of the most growthful and meaningful connections have difficult aspects that create depth precisely because of the friction. Context and intention matter as much as chart compatibility." },
      ]}
      ctaTitle="Ready to understand your closest connections more deeply?"
      ctaBody="Connect with a certified astrologer to explore the synastry and composite chart of your most significant friendships — discovering the astrological roots of the bonds that shape your life."
      ctaButtonLabel="Browse All Astrologers"
      relatedReadings={[
        { title: "Romantic Relationship Reading", href: "/readings/romantic-relationships", icon: "💞" },
        { title: "Business Relationship Reading", href: "/readings/business-relationship", icon: "💼" },
        { title: "Nativity Birth Chart", href: "/readings/nativity-birth-chart", icon: "🌟" },
      ]}
      pageUrl={`${APP_URL}/readings/friendship-relationships`}
    />
  );
}
