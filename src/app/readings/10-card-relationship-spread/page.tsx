import type { Metadata } from "next";
import { ReadingPageTemplate, type DivinerLandingCard } from "@/components/marketing/reading-page-template";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "10 Card Relationship Tarot Spread | AstrologyPro",
    description:
      "A 10-card relationship tarot spread offers a complete astrological portrait of a romantic or important personal connection — covering both people's feelings, the connection's dynamics, challenges, and where the relationship is heading.",
    alternates: { canonical: `${APP_URL}/readings/10-card-relationship-spread` },
    openGraph: {
      title: "10 Card Relationship Tarot Spread | AstrologyPro",
      description:
        "A 10-card relationship tarot spread offers a complete astrological portrait of a romantic or important personal connection — covering both people's feelings, the connection's dynamics, challenges, and where the relationship is heading.",
      type: "website",
      url: `${APP_URL}/readings/10-card-relationship-spread`,
      images: [{ url: "https://astrologypro.com/images/services/10-card-relationship.png", width: 1200, height: 630, alt: "10-Card Relationship Spread" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "10 Card Relationship Tarot Spread | AstrologyPro",
      description:
        "A 10-card relationship tarot spread offers a complete astrological portrait of a romantic or important personal connection — covering both people's feelings, the connection's dynamics, challenges, and where the relationship is heading.",
      images: ["https://astrologypro.com/images/services/10-card-relationship.png"],
    },
  };
}

async function getRelationshipSpreadDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "10_card_relationship_spread")
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

export default async function RelationshipSpreadPage() {
  const diviners = await getRelationshipSpreadDiviners();
  return (
    <ReadingPageTemplate
      serviceType="tarot"
      badge="Deep Relationship Tarot"
      heroTitleBefore="10-Card Relationship Spread:"
      heroTitleGradient="The Complete Portrait of a Connection"
      heroSubtitle="Ten positions. Two people. One complete picture. The relationship spread maps both sides of a connection — how each person feels, what draws and divides them, what's hidden, and where the bond is heading."
      heroStats={[
        { value: "10 Cards", label: "Both Perspectives Covered" },
        { value: "60 Minutes", label: "Complete Relationship Analysis" },
      ]}
      startingPrice={95}
      whatIsTitle="What Is the 10-Card Relationship Tarot Spread?"
      whatIsParagraphs={[
        "The 10-card relationship spread is purpose-built for complex interpersonal questions — romantic relationships, family dynamics, friendships at a turning point, or professional partnerships under strain. It dedicates separate card positions to each person's perspective, making it one of the few spreads that actively maps both sides of a two-person dynamic.",
        "Unlike a general question spread, the relationship spread includes positions specifically designed to surface the hidden layer of a connection: what each person is not saying, the subconscious hopes or fears driving behavior, the external forces affecting the relationship, and the deeper purpose or lesson the connection carries.",
        "At 10 cards and typically 60 minutes, this is a major reading — not for casual curiosity, but for situations that truly matter. It's the spread to reach for when a relationship is at a significant crossroads, when communication has broken down, when you're trying to understand someone's true feelings, or when you need clarity on whether a connection has a viable future.",
      ]}
      revealsItems={[
        { label: "Your Feelings & Perspective", desc: "Cards specifically representing your current emotional state, conscious desires, and what you're bringing to the connection" },
        { label: "Their Feelings & Perspective", desc: "Cards representing the other person's energy, intentions, and what they are experiencing in the connection" },
        { label: "The Bond Between You", desc: "How the connection itself is functioning — the quality of the space between both people right now" },
        { label: "Hidden Factors & Challenges", desc: "What neither party is fully seeing or saying, and what is creating the most significant obstacle to connection" },
        { label: "Future Trajectory", desc: "Where the relationship is heading if current dynamics continue — and what change would be required for a different outcome" },
      ]}
      expectCards={[
        { icon: "💑", title: "Both Perspectives Mapped", desc: "Your reader draws cards dedicated to each person's experience separately — giving you genuine insight into what the other person is likely feeling, thinking, and needing, without projection or assumption coloring the interpretation." },
        { icon: "🔍", title: "Hidden Dynamics Surfaced", desc: "Several positions in this spread are specifically designed to surface what's operating below conscious awareness: unspoken needs, unconscious patterns, hidden fears, and the invisible dynamic that may be running the relationship more than anything either person is consciously doing." },
        { icon: "🌱", title: "Path Forward Guidance", desc: "The reading closes with the outcome card's message and specific guidance on what each person would need to shift for the relationship to reach its highest potential — grounded, compassionate, and actionable." },
      ]}
      testimonials={[
        { quote: "The reading showed both sides of the relationship with uncomfortable accuracy. My reader handled the difficult parts with such compassion it didn't feel like a verdict — more like a map.", name: "Talia M.", location: "Tel Aviv, IL", service: "Relationship Spread Reading" },
        { quote: "I got this reading to understand why I kept attracting the same relationship dynamic. Seeing both cards — mine and theirs — simultaneously was genuinely illuminating.", name: "Patrick H.", location: "Dublin, IE", service: "10-Card Relationship Reading" },
        { quote: "I asked about a relationship that had ended and finally got the closure I'd been unable to find on my own. Understanding both charts changed how I see what happened.", name: "Nadia R.", location: "Beirut, LB", service: "Relationship Spread" },
      ]}
      diviners={diviners}
      discoverLink="/discover?type=tarot"
      discoverLabel="See All Tarot Readers"
      divinerSectionTitle="Find Your Relationship Tarot Reader"
      divinerSectionSubtitle="These readers specialize in in-depth relationship and interpersonal spreads"
      emailGuideSubject="your relationship tarot reading"
      faqItems={[
        { q: "Do I need the other person's birth data or permission?", a: "No — unlike astrological synastry, tarot relationship spreads require no data from the other person and no permission. The reading draws cards to represent both energies without requiring either party's participation. You can have this reading entirely on your own." },
        { q: "Can I get this reading for a relationship that has ended?", a: "Yes — understanding the dynamics of a past relationship can be one of the most clarifying and healing reading experiences available. Knowing what was really happening, what patterns were at play, and what the connection was ultimately for can help you process it fully and carry those insights into future relationships." },
        { q: "Is this spread for romantic relationships only?", a: "The spread works for any significant two-person dynamic: romantic partnerships, close friendships, parent-child relationships, or key professional relationships. Your reader adapts the interpretation based on the specific relationship type you're exploring." },
        { q: "Can the spread show if someone has romantic feelings for me?", a: "The spread can reveal the energy and emotional state of the person you're asking about with considerable accuracy — including whether their energy is warm, withdrawn, conflicted, or engaged. However, tarot shows energetic patterns rather than direct thoughts, and skilled readers are careful to interpret what they see rather than telling you what you want to hear." },
        { q: "What should I bring to this reading?", a: "Come with clarity about which relationship and which specific aspect you want to explore. 'What's happening between me and [person]?' is a fine opening question. If you have a specific concern — a recent conflict, a change in behavior, a crossroads decision — articulate it clearly. The more honest and specific your opening, the more relevant and direct the reading." },
      ]}
      ctaTitle="Ready to understand your most important connection?"
      ctaBody="Connect with a skilled tarot reader who can map both sides of your relationship — surfacing hidden dynamics, both perspectives, and the clearest possible path forward."
      ctaButtonLabel="Browse All Tarot Readers"
      relatedReadings={[
  { title: "3-Card Basic Spread", href: "/readings/3-card-basic-question-spread", icon: "🃏" },
  { title: "Celtic Cross Reading", href: "/readings/10-card-celtic-cross-major-read", icon: "✨" },
  { title: "12-Card Astrological Spread", href: "/readings/12-card-astrological-spread-major-read", icon: "🌌" },
]}
      pageUrl={`${APP_URL}/readings/10-card-relationship-spread`}
    />
  );
}
