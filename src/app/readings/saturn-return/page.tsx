import type { Metadata } from "next";
import { ReadingPageTemplate, type DivinerLandingCard } from "@/components/marketing/reading-page-template";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Saturn Return Readings | AstrologyPro",
    description:
      "Your Saturn Return is one of the most significant astrological events of your life. Book a personal reading with a certified astrologer to navigate this powerful transition.",
    openGraph: {
      title: "Saturn Return Readings | AstrologyPro",
      description:
        "Your Saturn Return is one of the most significant astrological events of your life. Book a personal reading with a certified astrologer to navigate this powerful transition.",
      type: "website",
      url: `${APP_URL}/readings/saturn-return`,
    },
    twitter: {
      card: "summary_large_image",
      title: "Saturn Return Readings | AstrologyPro",
      description:
        "Your Saturn Return is one of the most significant astrological events of your life. Book a personal reading with a certified astrologer to navigate this powerful transition.",
    },
  };
}

async function getSaturnReturnDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  // First: find diviners with services tagged trigger_event = 'saturn_return'
  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "saturn_return")
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

  // Fetch matching diviners (or fall back to certified astrologers)
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
    // Fallback: certified astrologers
    query = query
      .eq("is_certified", true)
      .contains("specialties", ["Saturn Return"])
      .order("is_certified", { ascending: false });
  }

  const { data: diviners } = await query;

  if (!diviners || diviners.length === 0) {
    // Final fallback: any certified astrologer
    const { data: fallback } = await admin
      .from("diviners")
      .select("id, username, display_name, tagline, avatar_url, specialties, is_certified")
      .eq("is_active", true)
      .eq("onboarding_completed", true)
      .eq("charges_enabled", true)
      .eq("is_certified", true)
      .limit(6);

    if (!fallback) return [];

    // Fetch starting prices for fallback diviners
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

  // Fetch starting prices for matching diviners not already in priceByDiviner
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

export default async function SaturnReturnPage() {
  const diviners = await getSaturnReturnDiviners();
  return (
    <ReadingPageTemplate
      serviceType="astrology"
      badge="Astrological Life Events"
      heroTitleBefore="Your Saturn Return"
      heroTitleGradient="Is Calling"
      heroSubtitle="Occurring every ~29.5 years, your Saturn Return is a defining life transition. Work with a certified astrologer to understand what it means for you."
      heroStats={[
        { value: "~Age 29", label: "First Return" },
        { value: "~Age 59", label: "Second Return" },
      ]}
      startingPrice={125}
      whatIsTitle="What Is a Saturn Return?"
      whatIsParagraphs={[
        "Saturn, the planet of discipline, structure, and karma, takes approximately 29.5 years to complete one full orbit around the Sun. When it returns to the exact position it held at the moment of your birth, you experience what astrologers call a Saturn Return.",
        "This transit marks a rite of passage — a cosmic audit of your life choices, values, and foundations. Saturn asks you to take responsibility, shed what no longer serves you, and step into the next chapter of your life with greater maturity.",
        "Common themes include career pivots, relationship milestones or endings, identity shifts, and a deep reassessment of what you truly want from life.",
      ]}
      revealsItems={[
        { label: "Ages 27–30", desc: "First Saturn Return — the entry into true adulthood" },
        { label: "Ages 56–60", desc: "Second Saturn Return — stepping into elder wisdom" },
        { label: "Ages 84–88", desc: "Third Saturn Return — the master's harvest" },
        { label: "Duration", desc: "The transit itself typically spans 2–3 years per return" },
        { label: "Exact Timing", desc: "A certified astrologer can calculate precise dates from your birth date, time, and location" },
      ]}
      expectCards={[
        {
          icon: "🪐",
          title: "Career & Purpose",
          desc: "Saturn forces a reckoning with your professional path. Dead-end jobs, unfulfilling careers, and misaligned ambitions are brought to the surface — and replaced with direction grounded in your true calling.",
        },
        {
          icon: "💞",
          title: "Relationships",
          desc: "Commitments are tested under Saturn's watchful eye. Relationships built on solid foundations deepen and mature; those without roots may dissolve — making room for what is truly aligned.",
        },
        {
          icon: "🌱",
          title: "Identity & Growth",
          desc: "Perhaps the most profound shift: the shedding of who you thought you were to reveal who you are becoming. Saturn demands you step fully into adulthood — and then later, elderhood.",
        },
      ]}
      testimonials={[
        {
          quote: "I booked my Saturn return reading at 29 not knowing what to expect. It described the next two years of my life with alarming accuracy — and helped me navigate them consciously.",
          name: "Beth A.",
          location: "Edinburgh, UK",
          service: "Saturn Return Reading",
        },
        {
          quote: "My Saturn return coincided with my divorce and career change simultaneously. The reading helped me understand both as part of the same restructuring rather than failures.",
          name: "Michael O.",
          location: "Chicago, US",
          service: "Saturn Return",
        },
        {
          quote: "Every person in their late 20s or late 50s should get a Saturn return reading. It's the astrological GPS for the most important transition of your adult life.",
          name: "Fatima R.",
          location: "Casablanca, MA",
          service: "Saturn Return Reading",
        },
      ]}
      diviners={diviners}
      discoverLink="/discover?type=astrologer"
      discoverLabel="See All Astrologers"
      divinerSectionTitle="Find Your Saturn Return Guide"
      divinerSectionSubtitle="These practitioners specialize in Saturn Return readings"
      emailGuideSubject="your Saturn return reading"
      faqItems={[
        {
          q: "What is a Saturn Return?",
          a: "A Saturn Return occurs when Saturn completes a full orbit of the Sun and returns to the zodiac position it occupied at the time of your birth. This transit, which happens around ages 27–30, 56–60, and 84–88, is associated with major life reassessments and restructuring.",
        },
        {
          q: "When exactly does my Saturn Return happen?",
          a: "The timing depends on the exact degree Saturn occupied in your birth chart. A certified astrologer can calculate the precise dates of your Saturn Return using your birth date, time, and location. The transit itself typically spans 2–3 years.",
        },
        {
          q: "Do I need my exact birth time for a Saturn Return reading?",
          a: "Your birth time gives the astrologer the most complete picture, including your Ascendant and house placements — all of which influence how Saturn's return manifests in your life. However, a skilled reader can still offer valuable insight without the exact time.",
        },
        {
          q: "What if I am in the middle of my Saturn Return right now?",
          a: "This is the ideal time to book a reading. Understanding Saturn's specific placement and aspects in your chart helps you work with the energy consciously rather than simply enduring it. Many clients find a Saturn Return reading to be one of the most clarifying readings of their life.",
        },
        {
          q: "What happens during a second Saturn Return?",
          a: "Around age 56–60, Saturn returns for a second time. Where the first return initiates true adulthood, the second invites a transition into elderhood, legacy, and wisdom. It is often a time of releasing outdated roles and stepping into a more authentic, authoritative expression of the self.",
        },
      ]}
      ctaTitle="Ready to navigate your Saturn Return?"
      ctaBody="Connect with a certified astrologer who can illuminate what this powerful transition means for your unique chart — and how to move through it with clarity."
      ctaButtonLabel="Browse All Astrologers"
      pageUrl={`${APP_URL}/readings/saturn-return`}
    />
  );
}
