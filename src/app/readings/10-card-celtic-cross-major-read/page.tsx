import type { Metadata } from "next";
import { ReadingPageTemplate, type DivinerLandingCard } from "@/components/marketing/reading-page-template";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Celtic Cross Tarot Reading | AstrologyPro",
    description:
      "The Celtic Cross is the most iconic and comprehensive spread in all of tarot — 10 cards covering the full spectrum of a situation: present, past, future, subconscious, external influences, hopes, fears, and outcome.",
    openGraph: {
      title: "Celtic Cross Tarot Reading | AstrologyPro",
      description:
        "The Celtic Cross is the most iconic and comprehensive spread in all of tarot — 10 cards covering the full spectrum of a situation: present, past, future, subconscious, external influences, hopes, fears, and outcome.",
      type: "website",
      url: `${APP_URL}/readings/10-card-celtic-cross-major-read`,
    },
    twitter: {
      card: "summary_large_image",
      title: "Celtic Cross Tarot Reading | AstrologyPro",
      description:
        "The Celtic Cross is the most iconic and comprehensive spread in all of tarot — 10 cards covering the full spectrum of a situation: present, past, future, subconscious, external influences, hopes, fears, and outcome.",
    },
  };
}

async function getCelticCrossDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "10_card_celtic_cross_major_read")
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

export default async function CelticCrossPage() {
  const diviners = await getCelticCrossDiviners();
  return (
    <ReadingPageTemplate
      serviceType="tarot"
      badge="The Gold Standard of Tarot Spreads"
      heroTitleBefore="The Celtic Cross:"
      heroTitleGradient="Tarot's Most Complete Spread"
      heroSubtitle="For over a century, the Celtic Cross has been the definitive major tarot reading — ten cards, ten positions, covering every dimension of a situation from your deepest subconscious to the most likely final outcome."
      heroStats={[
        { value: "10 Cards", label: "10 Distinct Positions" },
        { value: "60 Minutes", label: "The Complete Tarot Picture" },
      ]}
      startingPrice={95}
      whatIsTitle="What Is the Celtic Cross Tarot Spread?"
      whatIsParagraphs={[
        "The Celtic Cross is the most recognized and widely used spread in tarot history. First documented in A.E. Waite's 1910 'Pictorial Key to the Tarot' — written alongside the creation of the iconic Rider-Waite-Smith deck — the Celtic Cross has remained the benchmark for comprehensive single-session tarot work for well over a century.",
        "Ten cards are laid in a specific pattern: a central cross of six cards surrounded by a staff of four. Each position addresses a unique dimension of the situation: the present energy, the crossing influence, the foundation, the recent past, the possible future, the near future, the querent's position, external influences, hopes and fears, and the final outcome.",
        "The Celtic Cross is appropriate whenever you want the fullest possible picture of a situation. It covers more ground than any other common spread — including subconscious and conscious dimensions, past and future, internal and external forces. For major life decisions or deep personal questions, it remains unmatched.",
      ]}
      revealsItems={[
        { label: "The Core Situation & Crossing Influence", desc: "What is at the heart of the matter and what is the primary force crossing, challenging, or shaping it" },
        { label: "Past Foundation & Recent Events", desc: "The root basis of the situation and what recent events have contributed to the current circumstances" },
        { label: "Subconscious & Conscious Themes", desc: "What is operating below the surface of awareness and what is consciously known or desired" },
        { label: "External Influences & Near Future", desc: "The people, circumstances, or energies outside yourself affecting the situation, and what is immediately approaching" },
        { label: "Hopes, Fears & Final Outcome", desc: "What you most hope for and fear in the situation, and the most likely final outcome based on current trajectory" },
      ]}
      expectCards={[
        { icon: "✝️", title: "The Ten-Position Layout", desc: "Your reader places ten cards in the classic Celtic Cross formation and walks through each position in sequence — building a complete, interconnected story of the situation rather than interpreting cards in isolation." },
        { icon: "🧠", title: "Conscious & Subconscious Layers", desc: "Two positions are specifically dedicated to what is conscious versus subconscious in the situation — one of the Celtic Cross's most powerful features, as it often surfaces the self-sabotage, hidden desire, or unconscious belief that is the real driver of the situation." },
        { icon: "🏁", title: "Hopes, Fears & Outcome", desc: "The final three cards in the staff form the most anticipated part of the reading: what you most deeply hope for and fear (often the same card — a profound insight in itself), and the final outcome card showing where the situation is likely to land." },
      ]}
      testimonials={[
        { quote: "I've had Celtic Cross readings from three different readers and each one delivered something the others missed. It's endlessly layered — the spread handles complexity like nothing else.", name: "Robert S.", location: "Boston, US", service: "Celtic Cross Reading" },
        { quote: "The hopes and fears card was a single card representing both — and my reader's interpretation of that paradox was the most personally resonant thing I've ever heard in a reading.", name: "Aya M.", location: "Cairo, EG", service: "Celtic Cross" },
        { quote: "I always thought tarot was simple — three cards and a one-liner. A Celtic Cross reading showed me what the art can actually do when given room to breathe.", name: "Finn O.", location: "Oslo, NO", service: "Celtic Cross Major Read" },
      ]}
      diviners={diviners}
      discoverLink="/discover?type=tarot"
      discoverLabel="See All Tarot Readers"
      divinerSectionTitle="Find Your Celtic Cross Reader"
      divinerSectionSubtitle="These readers specialize in comprehensive major tarot spreads"
      emailGuideSubject="your Celtic Cross reading"
      faqItems={[
        { q: "How is the Celtic Cross different from other 10-card spreads?", a: "The Celtic Cross has a very specific, codified layout where each of the 10 positions has a defined meaning established by over a century of tarot tradition. The relationship spread also uses 10 cards but in a different arrangement optimized for two-person dynamics. The Celtic Cross is a general-purpose comprehensive spread; the relationship spread is purpose-built for interpersonal questions." },
        { q: "Is the Celtic Cross appropriate for beginners?", a: "As a querent (the person receiving the reading), absolutely — you don't need to know anything about tarot to receive a Celtic Cross reading. The depth and complexity is the reader's job to manage. As a reader, it requires significant experience to interpret all 10 positions and their interplay accurately — which is why you want a skilled practitioner." },
        { q: "What is the 'hopes and fears' position and why is one card used for both?", a: "One of the most philosophically rich aspects of the Celtic Cross — a single card occupies both the 'hopes' and 'fears' positions, because what we most deeply hope for and what we most deeply fear are often the same thing. The card in this position reveals the core ambivalence or paradox at the heart of what you want. Many clients describe it as the most personally resonant card of the spread." },
        { q: "Can I ask a yes/no question for a Celtic Cross?", a: "You can, but it's somewhat like using a Swiss Army knife to slice bread — it works, but the tool has more capacity than the task requires. The Celtic Cross is designed for complex, multi-dimensional questions. A 3-card spread handles yes/no questions more efficiently. Use the Celtic Cross when you want the full landscape of a situation." },
        { q: "How often should I get a Celtic Cross reading?", a: "Unlike weekly or monthly readings that track fast-moving energy, a Celtic Cross is a deep-dive into a specific situation or life area. Most people find one every few months — or whenever a major crossroads arises — is the right cadence. More frequently than that tends to create noise rather than clarity, as the cards need time to play out." },
      ]}
      ctaTitle="Ready for the most complete tarot reading available?"
      ctaBody="Connect with a skilled tarot reader who can navigate all ten positions of the Celtic Cross — giving you the full picture of your situation from subconscious roots to final outcome."
      ctaButtonLabel="Browse All Tarot Readers"
      relatedReadings={[
  { title: "3-Card Basic Spread", href: "/readings/3-card-basic-question-spread", icon: "🃏" },
  { title: "5-Card Complex Spread", href: "/readings/5-card-complex-question-spread", icon: "🃏" },
  { title: "Horseshoe Spread", href: "/readings/7-card-horseshoe-spread-major-read", icon: "🧲" },
]}
      pageUrl={`${APP_URL}/readings/10-card-celtic-cross-major-read`}
    />
  );
}
