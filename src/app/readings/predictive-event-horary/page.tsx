import type { Metadata } from "next";
import { ReadingPageTemplate, type DivinerLandingCard } from "@/components/marketing/reading-page-template";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Horary Astrology Readings | AstrologyPro",
    description:
      "Horary astrology answers specific questions by casting a chart for the exact moment the question is asked. One of the most precise predictive techniques in all of traditional astrology.",
    openGraph: {
      title: "Horary Astrology Readings | AstrologyPro",
      description:
        "Horary astrology answers specific questions by casting a chart for the exact moment the question is asked. One of the most precise predictive techniques in all of traditional astrology.",
      type: "website",
      url: `${APP_URL}/readings/predictive-event-horary`,
    },
    twitter: {
      card: "summary_large_image",
      title: "Horary Astrology Readings | AstrologyPro",
      description:
        "Horary astrology answers specific questions by casting a chart for the exact moment the question is asked. One of the most precise predictive techniques in all of traditional astrology.",
    },
  };
}

async function getHoraryDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "horary")
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

export default async function PredictiveEventHoraryPage() {
  const diviners = await getHoraryDiviners();
  return (
    <ReadingPageTemplate
      serviceType="astrology"
      badge="Traditional Predictive Astrology"
      heroTitleBefore="Horary Astrology:"
      heroTitleGradient="One Question. One Chart. One Answer."
      heroSubtitle="Horary astrology is the ancient art of answering a specific question by casting a chart for the precise moment the question is asked. The resulting chart — born from the question itself — contains the answer. Remarkably accurate in practiced hands."
      heroStats={[
        { value: "Question-Based", label: "One Question Per Chart" },
        { value: "Precise Timing", label: "Cast at the Moment of Asking" },
      ]}
      startingPrice={95}
      whatIsTitle="What Is Horary Astrology?"
      whatIsParagraphs={[
        "Horary astrology is one of the most ancient and precise branches of the art. Rather than analyzing a birth chart, horary casts a new chart for the exact moment a specific question is sincerely asked — and reads the answer from that chart's planetary positions, aspects, and dignities.",
        "The technique dates back to ancient Babylon and was codified extensively in medieval Arabic and European astrology. A skilled horary astrologer uses strict traditional rules — planetary dignities, house rulerships, applying aspects, and timing methods — to derive a yes/no answer, probable timing, or detailed outcome description.",
        "Horary is uniquely suited to specific, answerable questions: Will I get this job? Is this person trustworthy? Where is my lost item? Should I accept this offer? When questions have a clear answer to seek, horary is often the most direct and reliable astrological tool available.",
      ]}
      revealsItems={[
        { label: "Answer to Your Question", desc: "A clear yes, no, or qualified answer derived from the planetary significators in the horary chart" },
        { label: "Probable Timing", desc: "When an outcome is likely to manifest — based on applying aspects and arc measurements in the chart" },
        { label: "Hidden Factors", desc: "Circumstances or people you may not be aware of that are influencing the situation" },
        { label: "The Other Party's Intentions", desc: "In interpersonal questions, the chart reveals what the other person's significator is doing — their likely motivation and direction" },
        { label: "Best Course of Action", desc: "Whether to act, wait, or release — and what the chart suggests will unfold if you do" },
      ]}
      expectCards={[
        { icon: "❓", title: "Prepare One Clear Question", desc: "Horary works best with a single, specific, sincere question. Vague or compound questions produce murky charts. Your astrologer may help you clarify your question before casting the chart to ensure the best possible answer." },
        { icon: "📜", title: "Traditional Chart Analysis", desc: "Your astrologer casts the horary chart for the moment of your question and applies classical rules — planetary dignities, applying aspects, house rulerships — to extract a clear, justified answer from the chart's symbolism." },
        { icon: "⏳", title: "Timing & Outcome", desc: "Beyond yes/no, skilled horary analysis often reveals probable timing — when an outcome is likely to manifest — along with any qualifying factors or conditions the chart suggests should be considered." },
      ]}
      testimonials={[
        { quote: "I asked one specific question about a job offer. The chart said yes. I took the job. Best decision of my career.", name: "Claire M.", location: "Dublin, IE", service: "Horary Reading" },
        { quote: "Horary is unlike any other astrology I've experienced. The precision of the answer from just the time of asking is remarkable.", name: "Jonathan P.", location: "Cape Town, ZA", service: "Horary Astrology" },
        { quote: "My reader answered a question about a property purchase I'd been agonizing over for weeks. The chart gave me a clear answer in 20 minutes.", name: "Mei L.", location: "Hong Kong, HK", service: "Horary Reading" },
      ]}
      diviners={diviners}
      discoverLink="/discover?type=astrologer"
      discoverLabel="See All Astrologers"
      divinerSectionTitle="Find Your Horary Astrologer"
      divinerSectionSubtitle="These practitioners specialize in traditional horary and predictive astrology"
      emailGuideSubject="your horary astrology reading"
      faqItems={[
        { q: "What kinds of questions work best for horary astrology?", a: "Specific, sincere, answerable questions work best: Will I get this job? Is this property a good investment? Will this relationship work out? Should I take this opportunity? Questions that are too vague ('Am I on the right path?') or too compound ('What should I do about my career, relationship, and health?') produce ambiguous charts. One clear question at a time." },
        { q: "Do I need my birth data for a horary reading?", a: "No — this is one of horary's great advantages. The chart is cast for the moment the question is asked, not for your birth. Your personal birth data is not required for the horary chart itself, though a skilled astrologer may briefly note your sun sign for context." },
        { q: "How accurate is horary astrology?", a: "In the hands of a skilled practitioner following traditional rules rigorously, horary has an impressive accuracy record — historically considered one of the most reliable predictive techniques available. The quality of the answer depends entirely on the clarity of the question and the skill of the astrologer." },
        { q: "Can I ask the same question multiple times?", a: "Traditional horary holds that the same question should not be re-asked if a clear chart has already been cast for it — doing so suggests insincerity or anxiety about the answer rather than genuine inquiry. If circumstances change significantly, a new question reflecting the new situation can be cast." },
        { q: "What if the chart says 'no' but I still want the outcome?", a: "Horary reveals probability, not fate. A 'no' chart does not mean something is impossible — it indicates that at this moment, under current conditions, the described outcome is not the most likely trajectory. Sometimes timing, a change in approach, or new information can shift the situation that a different chart would reflect differently." },
      ]}
      ctaTitle="Have a question that deserves a real answer?"
      ctaBody="Connect with a certified horary astrologer who can cast a chart for your specific question and apply classical techniques to extract a clear, grounded answer from the stars."
      ctaButtonLabel="Browse All Astrologers"
      pageUrl={`${APP_URL}/readings/predictive-event-horary`}
    />
  );
}
