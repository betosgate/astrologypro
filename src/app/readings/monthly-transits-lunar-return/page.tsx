import type { Metadata } from "next";
import { ReadingPageTemplate, type DivinerLandingCard } from "@/components/marketing/reading-page-template";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Monthly Transits + Lunar Return Readings | AstrologyPro",
    description:
      "Every month the Moon returns to its natal position, creating a personal lunar chart for the next 28 days. Combined with monthly transits, this reading maps your emotional and practical themes for the month ahead.",
    openGraph: {
      title: "Monthly Transits + Lunar Return Readings | AstrologyPro",
      description:
        "Every month the Moon returns to its natal position, creating a personal lunar chart for the next 28 days. Combined with monthly transits, this reading maps your emotional and practical themes for the month ahead.",
      type: "website",
      url: `${APP_URL}/readings/monthly-transits-lunar-return`,
    },
    twitter: {
      card: "summary_large_image",
      title: "Monthly Transits + Lunar Return Readings | AstrologyPro",
      description:
        "Every month the Moon returns to its natal position, creating a personal lunar chart for the next 28 days. Combined with monthly transits, this reading maps your emotional and practical themes for the month ahead.",
    },
  };
}

async function getMonthlyTransitsLunarReturnDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "monthly_transits_lunar_return")
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

export default async function MonthlyTransitsLunarReturnPage() {
  const diviners = await getMonthlyTransitsLunarReturnDiviners();
  return (
    <ReadingPageTemplate
      serviceType="astrology"
      badge="Monthly Cosmic Forecast"
      heroTitleBefore="Monthly Transits + Lunar Return: "
      heroTitleGradient="Your Month Mapped in the Stars"
      heroSubtitle="Each month, the Moon completes its return to your natal position — setting a new emotional tone for the 28 days ahead. Combined with the current planetary transits, this reading gives you the most complete monthly astrological picture available."
      heroStats={[
        { value: "Monthly", label: "Repeats Every 28 Days" },
        { value: "Dual Technique", label: "Transits + Lunar Return" },
      ]}
      startingPrice={95}
      whatIsTitle="What Is a Monthly Transits + Lunar Return Reading?"
      whatIsParagraphs={[
        "A Lunar Return occurs when the Moon returns to the exact degree and sign it occupied at the moment of your birth. This happens approximately every 27.3 days and creates a new chart — your Lunar Return chart — that governs the emotional tone, inner needs, and personal focus for the coming month.",
        "When layered with the current monthly transits — the ongoing movements of all planets through the zodiac — this combined reading becomes one of the most practical forecasting tools in astrology. You see both the emotional undercurrent (Lunar Return) and the external events and energies (transits) shaping your month.",
        "While a Solar Return gives your annual blueprint and weekly transits give surgical precision, the Monthly Transits + Lunar Return reading occupies the sweet spot: enough breadth for month-long planning with enough depth to be genuinely useful for decisions, relationships, and timing.",
      ]}
      revealsItems={[
        { label: "Monthly Lunar Themes", desc: "The emotional focus and inner needs your Lunar Return chart sets for the next 28 days" },
        { label: "Transit Story for the Month", desc: "The most significant planetary aspects and activations unfolding across the calendar month" },
        { label: "Emotional Peaks & Valleys", desc: "When emotional intensity rises and falls, and what's driving the inner climate changes" },
        { label: "Action Windows", desc: "Optimal timing for initiating, communicating, resting, and making decisions this month" },
        { label: "Key Dates", desc: "Specific days carrying heightened energy for relationships, career, finances, or personal matters" },
      ]}
      expectCards={[
        { icon: "🌙", title: "Lunar Return Chart Reading", desc: "Your astrologer will cast your Lunar Return chart and interpret the Rising sign, house activations, and planetary placements — giving you a clear picture of your emotional landscape for the month." },
        { icon: "📆", title: "Monthly Transit Overlay", desc: "The significant planetary transits of the month are mapped against your natal chart — showing you the external opportunities, pressures, and pivots that will shape your experience over the next 30 days." },
        { icon: "🎯", title: "Practical Month Planning", desc: "The reading concludes with concrete, actionable timing guidance — the best days for important conversations, launches, rest, and decisions — so you can plan your month with astrological precision." },
      ]}
      testimonials={[
        { quote: "I book my monthly lunar return reading every month without fail. It's the most useful planning tool I have.", name: "Rosa M.", location: "Madrid, ES", service: "Monthly Forecast Reading" },
        { quote: "The accuracy of the monthly themes is uncanny. My reader called the emotional intensity of a specific week two months in advance.", name: "Tom C.", location: "Melbourne, AU", service: "Lunar Return Reading" },
        { quote: "Combining the transits with the lunar return gives you a level of detail I had no idea was even possible from astrology.", name: "Naomi A.", location: "Lagos, NG", service: "Monthly Forecast" },
      ]}
      diviners={diviners}
      discoverLink="/discover?type=astrologer"
      discoverLabel="See All Astrologers"
      divinerSectionTitle="Find Your Monthly Forecast Astrologer"
      divinerSectionSubtitle="These practitioners specialize in lunar return and monthly transit readings"
      emailGuideSubject="your monthly forecast reading"
      faqItems={[
        { q: "What's the difference between a Lunar Return and a Solar Return?", a: "A Solar Return happens once a year around your birthday and maps the annual themes for the entire year ahead. A Lunar Return happens every 27–28 days and sets the emotional and personal focus for that specific month. They operate at different scales: annual vs. monthly." },
        { q: "Does location affect my Lunar Return like it does the Solar Return?", a: "Yes — just like with the Solar Return, where you are physically at the exact moment of your Lunar Return shifts the Rising sign of the chart, changing the house emphases for the month. Some people use this to intentionally influence their monthly emotional climate." },
        { q: "Do I need to have had a natal chart reading first?", a: "It's not required, but having your natal chart context makes this reading significantly richer. Your astrologer will still provide valuable monthly guidance without it — but knowing your natal planetary positions allows for more precise transit interpretation." },
        { q: "How far ahead can I book a monthly forecast reading?", a: "Most people book within a few days of their Lunar Return date (which your astrologer can calculate from your birth data). The reading is most useful when done at or just before the start of the month it covers." },
        { q: "Is this reading different each month?", a: "Every month produces a completely new Lunar Return chart, and the transit picture changes constantly. So yes — each monthly reading is entirely unique. Regular monthly readings are one of the most powerful ways to stay ahead of the astrological weather in your personal life." },
      ]}
      ctaTitle="Ready to map your month ahead?"
      ctaBody="Work with a certified astrologer to decode your Lunar Return chart and monthly transits — giving you a clear, practical roadmap for the 28 days ahead."
      ctaButtonLabel="Browse All Astrologers"
      pageUrl={`${APP_URL}/readings/monthly-transits-lunar-return`}
    />
  );
}
