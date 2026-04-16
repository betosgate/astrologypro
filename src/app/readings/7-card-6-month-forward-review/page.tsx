import type { Metadata } from "next";
import { ReadingPageTemplate, type DivinerLandingCard } from "@/components/marketing/reading-page-template";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "7 Card 6-Month Forecast Tarot Reading | AstrologyPro",
    description:
      "A 7-card tarot forecast spread gives you a month-by-month preview of the next six months — with an overall guidance card revealing the overarching energy of the period ahead.",
    alternates: { canonical: `${APP_URL}/readings/7-card-6-month-forward-review` },
    openGraph: {
      title: "7 Card 6-Month Forecast Tarot Reading | AstrologyPro",
      description:
        "A 7-card tarot forecast spread gives you a month-by-month preview of the next six months — with an overall guidance card revealing the overarching energy of the period ahead.",
      type: "website",
      url: `${APP_URL}/readings/7-card-6-month-forward-review`,
      images: [{ url: "https://astrologypro.com/images/services/7-card-forecast.png", width: 1200, height: 630, alt: "7-Card 6-Month Forward Review" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "7 Card 6-Month Forecast Tarot Reading | AstrologyPro",
      description:
        "A 7-card tarot forecast spread gives you a month-by-month preview of the next six months — with an overall guidance card revealing the overarching energy of the period ahead.",
      images: ["https://astrologypro.com/images/services/7-card-forecast.png"],
    },
  };
}

async function get7Card6MonthForwardReviewDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "7_card_6_month_forward_review")
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

export default async function SevenCard6MonthForwardReviewPage() {
  const diviners = await get7Card6MonthForwardReviewDiviners();
  return (
    <ReadingPageTemplate
      serviceType="tarot"
      badge="6-Month Forecast Spread"
      heroTitleBefore="7-Card 6-Month Forecast:"
      heroTitleGradient="Your Roadmap for the Half-Year Ahead"
      heroSubtitle="Six cards for six months, plus one overarching guidance card — this spread gives you the most practical forward-looking tarot tool available, mapping the themes and energy of each coming month before they arrive."
      heroStats={[
        { value: "6 Months", label: "Month-by-Month Preview" },
        { value: "7 Cards", label: "Monthly Energy + Overall Guidance" },
      ]}
      startingPrice={75}
      whatIsTitle="What Is the 7-Card 6-Month Forecast Spread?"
      whatIsParagraphs={[
        "The 7-card 6-month forecast spread is a temporal map — one card for each of the next six calendar months, plus a seventh card drawn as the overall guiding energy for the entire six-month period. It's one of the most practically useful spreads in tarot, functioning as a forward-looking planner rather than a question-based reading.",
        "Each monthly card reveals the predominant energy, theme, or event archetype for that specific month — not a precise prediction, but a broad brushstroke of what the energetic climate is likely to bring. Some months will show action and initiative (fiery cards), others introspection or emotion (water cards), others structure and achievement (earth cards).",
        "The seventh 'overview' card ties the six-month journey together — revealing the unifying theme or lesson the period is collectively offering. It often serves as the most important card in the spread: the guiding star for navigating all six months with intention.",
      ]}
      revealsItems={[
        { label: "Month-by-Month Energy", desc: "The dominant theme or energy archetype for each of the six months ahead — what to expect and prepare for" },
        { label: "Peak Opportunity Months", desc: "Which months in the forecast carry the highest potential for growth, success, or pivotal forward movement" },
        { label: "Caution Months", desc: "Months where the energy calls for patience, rest, inner work, or careful navigation rather than bold action" },
        { label: "Recurring Themes", desc: "Patterns that appear across multiple months, pointing to a central lesson or area of focus for the entire period" },
        { label: "Overall Half-Year Guidance", desc: "The seventh card's message: the unifying theme, the big lesson, and the overarching advice for navigating the full six months" },
      ]}
      expectCards={[
        {
          icon: "📅",
          title: "Six Monthly Energy Cards",
          desc: "Your reader draws one card per month and interprets each in the context of that specific month's position in your life journey — showing you what each month is likely to bring as its dominant energy, challenge, or opportunity.",
        },
        {
          icon: "🌟",
          title: "Overall Guidance Card",
          desc: "The seventh card is drawn and interpreted as the overarching message for the full six-month arc — what this entire half-year is asking of you, offering you, or preparing you for at a larger scale than any single month.",
        },
        {
          icon: "📓",
          title: "Written Forecast Reference",
          desc: "Many readers provide a written or recorded summary of the full spread so you can revisit each monthly card as that month arrives — turning the reading into a practical reference document for the half-year ahead.",
        },
      ]}
      testimonials={[
        {
          quote: "I booked this reading in January and used the monthly cards as a reference all year. The accuracy of the monthly themes still amazes me.",
          name: "Clara S.",
          location: "Vienna, AT",
          service: "6-Month Forecast Reading",
        },
        {
          quote: "The overview card for my six months was The Star — and sure enough, it turned out to be the most hopeful and renewing period of my adult life.",
          name: "Jordan W.",
          location: "Nashville, US",
          service: "Forecast Spread",
        },
        {
          quote: "One of the monthly cards showed tension and disruption. I almost dismissed it, then that month turned out to be the hardest of the year. The reading had prepared me.",
          name: "Adaeze O.",
          location: "Abuja, NG",
          service: "6-Month Forecast",
        },
      ]}
      diviners={diviners}
      discoverLink="/discover?type=tarot"
      discoverLabel="See All Tarot Readers"
      divinerSectionTitle="Find Your Forecast Tarot Reader"
      divinerSectionSubtitle="These readers specialize in forward-looking forecast spreads"
      emailGuideSubject="your 6-month tarot forecast"
      faqItems={[
        {
          q: "When is the best time to get a 6-month forecast reading?",
          a: "Natural transition points work best: the beginning of a new year, just after your birthday, at a major life transition, or at the start of a new season. Many people get this reading in early January, midsummer, or just before a significant change to frame the period ahead.",
        },
        {
          q: "Are the monthly card predictions exact or approximate?",
          a: "They're energetic themes — broad-stroke guides to the quality of energy each month will carry. A card like The Tower doesn't predict a literal catastrophe; it suggests a month with significant disruption that breaks down what no longer serves. The interpretation always requires the reader's skill to contextualize within your specific situation.",
        },
        {
          q: "What if a monthly card looks concerning?",
          a: "Your reader is trained to present all cards constructively — including challenging ones. Every card, even the most 'difficult,' carries actionable wisdom. A 'hard' month revealed by the spread is far easier to navigate consciously than to enter blindly.",
        },
        {
          q: "Can I ask a follow-up question after the forecast spread?",
          a: "Most readers leave time within the session for clarification questions about specific months or cards. If you want deeper exploration of a specific month — perhaps because a major event is planned — let your reader know before the session starts so they can adjust the time allocation.",
        },
        {
          q: "Should I revisit the reading as each month arrives?",
          a: "Absolutely — this is one of the best features of a forecast spread. Many clients review their monthly card at the start of each month and find it remarkably applicable to what unfolds. It transforms a single reading session into six months of gentle astrological-style guidance.",
        },
      ]}
      ctaTitle="Ready to map the six months ahead?"
      ctaBody="Connect with a skilled tarot reader who can draw your 7-card 6-month forecast — giving you a month-by-month energy map and the overall guidance you need to move through the half-year with awareness."
      ctaButtonLabel="Browse All Tarot Readers"
      relatedReadings={[
  { title: "Celtic Cross Reading", href: "/readings/10-card-celtic-cross-major-read", icon: "✨" },
  { title: "5-Card Complex Spread", href: "/readings/5-card-complex-question-spread", icon: "🃏" },
  { title: "3-Card Basic Spread", href: "/readings/3-card-basic-question-spread", icon: "🃏" },
]}
      pageUrl={`${APP_URL}/readings/7-card-6-month-forward-review`}
    />
  );
}
