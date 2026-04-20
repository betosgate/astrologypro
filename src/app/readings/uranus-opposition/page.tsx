import type { Metadata } from "next";
import { ReadingPageTemplate, type DivinerLandingCard } from "@/components/marketing/reading-page-template";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";
import { getReadingOgImageUrl } from "@/lib/service-images";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Uranus Opposition Readings | AstrologyPro",
    description:
      "Around age 42, Uranus reaches the point exactly opposite its natal position — triggering the astrological mid-life awakening. A Uranus Opposition reading helps you navigate this profound turning point with awareness and intention.",
    alternates: { canonical: `${APP_URL}/readings/uranus-opposition` },
    openGraph: {
      title: "Uranus Opposition Readings | AstrologyPro",
      description:
        "Around age 42, Uranus reaches the point exactly opposite its natal position — triggering the astrological mid-life awakening. A Uranus Opposition reading helps you navigate this profound turning point with awareness and intention.",
      type: "website",
      url: `${APP_URL}/readings/uranus-opposition`,
      images: [{ url: getReadingOgImageUrl("uranus-opposition"), width: 1200, height: 630, alt: "Uranus Opposition Readings" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Uranus Opposition Readings | AstrologyPro",
      description:
        "Around age 42, Uranus reaches the point exactly opposite its natal position — triggering the astrological mid-life awakening. A Uranus Opposition reading helps you navigate this profound turning point with awareness and intention.",
      images: [getReadingOgImageUrl("uranus-opposition")],
    },
  };
}

async function getUranusOppositionDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "uranus_opposition")
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

export default async function UranusOppositionPage() {
  const diviners = await getUranusOppositionDiviners();
  return (
    <ReadingPageTemplate
      serviceType="astrology"
      badge="The Mid-Life Awakening Transit"
      heroImage={getReadingOgImageUrl("uranus-opposition")}
      heroTitleBefore="Uranus Opposition:"
      heroTitleGradient="The Astrological Mid-Life Turning Point"
      heroSubtitle="Around your early 40s, Uranus reaches the point directly opposite its natal position — and everything that has been repressed, suppressed, or outgrown begins demanding release. This is the astrological engine behind the mid-life awakening."
      heroStats={[
        { value: "Around Age 42", label: "Once in a Lifetime Event" },
        { value: "Uranus Opposite Uranus", label: "Liberation & Awakening" },
      ]}
      startingPrice={125}
      whatIsTitle="What Is the Uranus Opposition?"
      whatIsParagraphs={[
        "Uranus is the planet of sudden change, liberation, awakening, rebellion, and the desire to break free from anything that constrains authentic self-expression. It takes approximately 84 years to complete its journey through the zodiac — meaning at around age 42, it reaches the point exactly opposite where it was at your birth.",
        "This transit — called the Uranus Opposition — is one of the most powerful and personally disruptive transits of adult life. It tends to surface everything you've buried, delayed, or suppressed in your authentic expression: the career you never pursued, the relationship patterns you never questioned, the identity you never gave yourself permission to inhabit.",
        "The Uranus Opposition is often behind what's popularly called the 'mid-life crisis' — though astrologers understand it not as a crisis but as an awakening. Those who work with the transit consciously often describe it as one of the most liberating and clarifying periods of their lives.",
      ]}
      revealsItems={[
        { label: "What's Ready for Liberation", desc: "The life areas, roles, and self-concepts that Uranus is signaling are ready to be released or radically transformed" },
        { label: "Suppressed Authenticity", desc: "What aspects of your true nature have been repressed that are now pushing powerfully for expression" },
        { label: "Relationship Shake-Ups", desc: "Where Uranus's awakening energy is applying pressure to relationships that no longer reflect who you're becoming" },
        { label: "Career & Purpose Pivots", desc: "Professional changes, identity shifts, and vocational realignments being activated by the opposition" },
        { label: "The Gift of the Transit", desc: "What this awakening is ultimately trying to bring into your life — the freedom, authenticity, and aliveness waiting on the other side" },
      ]}
      expectCards={[
        { icon: "⚡", title: "Transit Analysis", desc: "Your astrologer examines exactly where Uranus falls in your natal chart, what house and planets the opposition activates, and how current supporting transits (especially Saturn) are shaping the overall mid-life picture at this specific moment in your life." },
        { icon: "🦋", title: "What's Being Liberated", desc: "The reading maps what Uranus is specifically asking you to release, question, or transform — whether in career, relationships, identity, or worldview — with the goal of moving through the transit with awareness rather than crisis." },
        { icon: "🧭", title: "Navigating the Awakening", desc: "The closing section offers concrete guidance on how to work with Uranus's energy constructively — welcoming the call for change while avoiding the reactive choices (impulsive decisions, sudden abandonments) that can create unnecessary damage during this powerful window." },
      ]}
      testimonials={[
        { quote: "I was in the middle of my mid-life awakening and feeling completely lost. My Uranus opposition reading gave me a framework that made everything feel purposeful rather than chaotic.", name: "Rachel D.", location: "Melbourne, AU", service: "Uranus Opposition Reading" },
        { quote: "I'd made several sudden life changes in my early 40s and couldn't explain why. The Uranus opposition reading was the first time I understood what was actually happening.", name: "Paul V.", location: "Amsterdam, NL", service: "Mid-Life Transit Reading" },
        { quote: "My reader helped me distinguish between Uranian liberation (good) and Uranian chaos (avoidable). That nuance saved my marriage.", name: "Diana F.", location: "Montreal, CA", service: "Uranus Opposition" },
      ]}
      diviners={diviners}
      discoverLink="/discover?type=astrologer"
      discoverLabel="See All Astrologers"
      divinerSectionTitle="Find Your Uranus Opposition Astrologer"
      divinerSectionSubtitle="These practitioners specialize in mid-life transits and outer planet readings"
      emailGuideSubject="your Uranus opposition reading"
      methodNotes={[
        {
          label: "Technique",
          title: "Uranus opposite natal Uranus",
          desc: "The astrologer studies the Uranus half-return alongside Saturn, Neptune, and natal house themes to locate the real pressure for change.",
        },
        {
          label: "Best For",
          title: "Midlife reinvention without chaos",
          desc: "Use it when restlessness, career pivots, relationship shifts, or identity questions are asking for freedom without reactive damage.",
        },
        {
          label: "Prepare",
          title: "Name what feels too small now",
          desc: "Bring the roles, routines, obligations, or relationships that feel constricting so your reader can separate authentic liberation from impulse.",
        },
      ]}
      faqItems={[
        { q: "How do I know if I'm in my Uranus Opposition?", a: "The Uranus Opposition typically peaks between ages 40 and 44, though the exact timing depends on your birth year and Uranus's position. If you're in that age range and experiencing unusual restlessness, a desire to break free from established patterns, sudden changes, or a strong inner push toward reinvention — you're likely in it. An astrologer can calculate the exact timing from your birth data." },
        { q: "Is the Uranus Opposition always disruptive?", a: "Not inevitably — but it is always significant. People who have already been living in alignment with their authentic nature often experience it as exciting expansion. People who have built lives heavily at odds with their core truth tend to experience more disruption. The more suppression, the more explosive the release tends to be." },
        { q: "Does everyone go through this transit?", a: "Yes — every person alive experiences the Uranus Opposition if they live past age 40. It is a universal transit, happening to every human at roughly the same age, though the way it manifests is entirely personal based on where Uranus falls in your natal chart." },
        { q: "What if I made impulsive decisions during my Uranus Opposition?", a: "Many people do — sudden career changes, relationship upheavals, major relocations. A reading can help you understand the underlying Uranian impulse driving those choices, evaluate which ones are serving genuine awakening versus which created unnecessary destruction, and plan the most constructive path forward from where you are now." },
        { q: "Can a reading help me prepare for the Uranus Opposition before it peaks?", a: "Absolutely — and this is one of the best uses of the reading. Understanding what Uranus will be activating in your chart before the peak allows you to make conscious, considered changes rather than reactive ones. Many people who prepare for the transit proactively describe it as one of the most creative and transformative periods of their lives." },
      ]}
      ctaTitle="Ready to navigate your mid-life awakening with clarity?"
      ctaBody="Connect with a certified astrologer who specializes in outer planet transits — helping you understand what Uranus is asking of you and how to move through this profound turning point with intention rather than crisis."
      ctaButtonLabel="Browse All Astrologers"
      relatedReadings={[
        { title: "Saturn Return Reading", href: "/readings/saturn-return", icon: "🪐" },
        { title: "Jupiter Return Reading", href: "/readings/jupiter-return", icon: "💫" },
        { title: "Nativity Birth Chart", href: "/readings/nativity-birth-chart", icon: "🌟" },
      ]}
      pageUrl={`${APP_URL}/readings/uranus-opposition`}
    />
  );
}
