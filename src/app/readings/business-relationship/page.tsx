import type { Metadata } from "next";
import { ReadingPageTemplate, type DivinerLandingCard } from "@/components/marketing/reading-page-template";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";
import { getReadingOgImageUrl } from "@/lib/service-images";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Business Relationship Astrology Readings | AstrologyPro",
    description:
      "Astrological compatibility for business partnerships — revealing strengths, blind spots, communication dynamics, and optimal timing for a professional alliance that lasts.",
    alternates: { canonical: `${APP_URL}/readings/business-relationship` },
    openGraph: {
      title: "Business Relationship Astrology Readings | AstrologyPro",
      description:
        "Astrological compatibility for business partnerships — revealing strengths, blind spots, communication dynamics, and optimal timing for a professional alliance that lasts.",
      type: "website",
      url: `${APP_URL}/readings/business-relationship`,
      images: [{ url: "https://astrologypro.com/images/services/business-relationships.png", width: 1200, height: 630, alt: "Business Relationship Readings" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Business Relationship Astrology Readings | AstrologyPro",
      description:
        "Astrological compatibility for business partnerships — revealing strengths, blind spots, communication dynamics, and optimal timing for a professional alliance that lasts.",
      images: ["https://astrologypro.com/images/services/business-relationships.png"],
    },
  };
}

async function getBusinessRelationshipDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "business_relationship")
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

export default async function BusinessRelationshipPage() {
  const diviners = await getBusinessRelationshipDiviners();
  return (
    <ReadingPageTemplate
      serviceType="astrology"
      badge="Business Astrology"
      heroImage={getReadingOgImageUrl("business-relationship")}
      heroTitleBefore="Business Relationships:"
      heroTitleGradient="Partnership Chemistry in the Stars"
      heroSubtitle="Business partnerships are among the highest-stakes relationships you'll enter. Astrology can reveal the natural strengths your charts bring together, where power dynamics or communication gaps could create friction, and the optimal timing for decisions that affect both parties."
      heroStats={[
        { value: "Partnership Analysis", label: "Synastry + Composite" },
        { value: "Strategic Timing", label: "Decision-Optimized Guidance" },
      ]}
      startingPrice={125}
      whatIsTitle="What Is a Business Relationship Reading?"
      whatIsParagraphs={[
        "A business relationship reading applies synastry and composite chart analysis to professional partnerships — co-founders, business partners, long-term clients, or employer-employee dynamics. The goal is to understand the astrological architecture of the professional alliance before friction arises.",
        "Unlike personal relationship readings that prioritize emotional connection, a business reading focuses on Saturn (structure and responsibility), Mercury (communication and contracts), Jupiter (expansion and opportunity), and Mars (drive, initiative, and conflict potential) — the planets most relevant to how two people build and sustain a professional venture together.",
        "The composite chart for a business partnership is especially revealing: it describes the venture itself as an astrological entity — its natural strengths, its most likely pressure points, and the optimal circumstances under which it thrives or struggles.",
      ]}
      revealsItems={[
        { label: "Complementary Strengths", desc: "Where each partner's chart brings something the other lacks — the astrological basis for a productive division of roles" },
        { label: "Communication & Decision Dynamics", desc: "Mercury and Saturn contacts showing how ideas are exchanged, decisions are made, and authority is navigated between partners" },
        { label: "Conflict Potential", desc: "Mars and Pluto interactions that could create power struggles, competition, or clashing approaches if left unaddressed" },
        { label: "Growth & Expansion Capacity", desc: "Jupiter and 10th house themes in the composite chart showing where the partnership has its greatest potential for external success" },
        { label: "Optimal Timing for Key Decisions", desc: "When to launch, sign agreements, expand, or pause — based on current transits to both charts and the composite" },
      ]}
      expectCards={[
        { icon: "🤝", title: "Synastry for the Partnership", desc: "Your astrologer examines the most significant planetary contacts between both charts — the Saturn structures that create reliability, the Mars dynamics that drive or compete, and the Mercury contacts that determine how smoothly communication flows." },
        { icon: "🏢", title: "Composite Chart for the Venture", desc: "The composite is read as the astrological entity of the business relationship itself — what it's built to do, where it naturally succeeds, what it needs from both parties, and where its greatest structural risks lie." },
        { icon: "⏱️", title: "Strategic Timing Guidance", desc: "Current transits to both charts and the composite reveal optimal windows for contract signings, major launches, fundraising rounds, pivots, or separations — so critical decisions are made at the right astrological moment." },
      ]}
      testimonials={[
        { quote: "Getting a compatibility reading with my business partner before we signed was the best decision I made. It flagged exactly the communication issue we later had — but we were prepared.", name: "Ravi K.", location: "Singapore, SG", service: "Business Compatibility Reading" },
        { quote: "I used astrology to choose the launch date for my company. My reader also did a composite chart with my co-founder. We've been aligned ever since.", name: "Sophia L.", location: "Berlin, DE", service: "Business Astrology" },
        { quote: "I was skeptical about using astrology for business decisions. Three months after the reading, everything the chart showed about the partnership has played out accurately.", name: "Mike T.", location: "Austin, US", service: "Partnership Reading" },
      ]}
      diviners={diviners}
      discoverLink="/discover?type=astrologer"
      discoverLabel="See All Astrologers"
      divinerSectionTitle="Find Your Business Relationship Astrologer"
      divinerSectionSubtitle="These practitioners specialize in partnership and business astrology"
      emailGuideSubject="your business relationship reading"
      faqItems={[
        { q: "Do I need my business partner's birth data?", a: "Yes — you'll need birth date, time, and location for both parties. The quality of the analysis directly corresponds to the precision of the data. If birth time is unknown for one partner, the reading uses a solar chart and focuses on planetary placements rather than house analysis." },
        { q: "Can this reading help me evaluate a potential partner before committing?", a: "Absolutely — this is one of the most valuable use cases. A pre-partnership reading can reveal natural synergies, potential friction points, and communication dynamics before any commitments are made, giving you astrological due diligence to complement financial and legal due diligence." },
        { q: "Can astrology help identify the best timing for signing contracts?", a: "Yes. Electional astrology — choosing auspicious moments for important actions — is one of the oldest applications of the art. Your astrologer can identify the most favorable windows for signing agreements, launching ventures, or making major decisions based on current transits to both charts and the composite." },
        { q: "What if my partnership is already struggling — is it too late?", a: "Not at all. A reading done during a difficult period can reveal whether the tension is driven by current transits (temporary) or deep chart incompatibilities (structural). Understanding the source of friction often makes it far easier to navigate consciously rather than reactively." },
        { q: "Is this only for equal business partnerships, or can it apply to employee relationships?", a: "The techniques apply to any significant professional relationship — co-founders, investor relationships, key employee dynamics, long-term client relationships, or mentorships. The interpretation shifts based on the nature of the relationship, but the core synastry and composite analysis remains the same." },
      ]}
      ctaTitle="Ready to build your partnership on solid astrological ground?"
      ctaBody="Connect with a certified astrologer who specializes in business relationship charts — revealing the strengths, blind spots, and optimal timing for your most important professional alliance."
      ctaButtonLabel="Browse All Astrologers"
      relatedReadings={[
        { title: "Romantic Relationship Reading", href: "/readings/romantic-relationships", icon: "💞" },
        { title: "Friendship Relationship Reading", href: "/readings/friendship-relationships", icon: "🤝" },
        { title: "Nativity Birth Chart", href: "/readings/nativity-birth-chart", icon: "🌟" },
      ]}
      pageUrl={`${APP_URL}/readings/business-relationship`}
    />
  );
}
