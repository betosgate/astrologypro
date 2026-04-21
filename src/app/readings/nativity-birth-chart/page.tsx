import type { Metadata } from "next";
import Image from "next/image";
import { ReadingPageTemplate, type DivinerLandingCard } from "@/components/marketing/reading-page-template";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";
import { getReadingOgImageUrl } from "@/lib/service-images";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Nativity Birth Chart Readings | AstrologyPro",
    description:
      "Your natal chart is the celestial blueprint of your entire life — cast at the exact moment you drew your first breath. Book a birth chart reading to understand your core nature, purpose, and life path.",
    alternates: { canonical: `${APP_URL}/readings/nativity-birth-chart` },
    openGraph: {
      title: "Nativity Birth Chart Readings | AstrologyPro",
      description:
        "Your natal chart is the celestial blueprint of your entire life — cast at the exact moment you drew your first breath. Book a birth chart reading to understand your core nature, purpose, and life path.",
      type: "website",
      url: `${APP_URL}/readings/nativity-birth-chart`,
      images: [{ url: "https://astrologypro.com/images/services/natal-chart.png", width: 1200, height: 630, alt: "Nativity Birth Chart Readings" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Nativity Birth Chart Readings | AstrologyPro",
      description:
        "Your natal chart is the celestial blueprint of your entire life — cast at the exact moment you drew your first breath.",
      images: ["https://astrologypro.com/images/services/natal-chart.png"],
    },
  };
}

async function getNativityBirthChartDiviners(): Promise<DivinerLandingCard[]> {
  const admin = createAdminClient();

  const { data: taggedServices } = await admin
    .from("services")
    .select("diviner_id, base_price")
    .eq("trigger_event", "natal_chart")
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

const ZODIAC_MARKERS = [
  { sign: "Ar", name: "Aries", left: "50%", top: "1%" },
  { sign: "Ta", name: "Taurus", left: "74%", top: "8%" },
  { sign: "Ge", name: "Gemini", left: "91%", top: "26%" },
  { sign: "Ca", name: "Cancer", left: "98%", top: "50%" },
  { sign: "Le", name: "Leo", left: "91%", top: "74%" },
  { sign: "Vi", name: "Virgo", left: "74%", top: "92%" },
  { sign: "Li", name: "Libra", left: "50%", top: "99%" },
  { sign: "Sc", name: "Scorpio", left: "26%", top: "92%" },
  { sign: "Sg", name: "Sagittarius", left: "9%", top: "74%" },
  { sign: "Cp", name: "Capricorn", left: "2%", top: "50%" },
  { sign: "Aq", name: "Aquarius", left: "9%", top: "26%" },
  { sign: "Pi", name: "Pisces", left: "26%", top: "8%" },
];

const PLANET_MARKERS = [
  { name: "Sun", image: "/images/horoscope-zodiac/sun.png", label: "identity", left: "62%", top: "24%" },
  { name: "Moon", image: "/images/horoscope-zodiac/moon.png", label: "instinct", left: "28%", top: "37%" },
  { name: "Mercury", image: "/images/horoscope-zodiac/mercury.png", label: "mind", left: "68%", top: "65%" },
  { name: "Venus", image: "/images/horoscope-zodiac/venus.png", label: "love", left: "42%", top: "71%" },
  { name: "Mars", image: "/images/horoscope-zodiac/mars.png", label: "drive", left: "78%", top: "44%" },
];

const CHART_LAYERS = [
  {
    eyebrow: "01 / Birth Data",
    title: "Time, date, and place set the chart.",
    desc: "Your exact birth moment anchors the ascendant, houses, angles, and planetary degrees.",
  },
  {
    eyebrow: "02 / Planetary Pattern",
    title: "Planets reveal the inner architecture.",
    desc: "Sun, Moon, Mercury, Venus, Mars, and the outer planets map identity, instinct, love, action, growth, and pressure.",
  },
  {
    eyebrow: "03 / Houses",
    title: "Life areas show where themes land.",
    desc: "The twelve houses translate chart symbolism into work, home, intimacy, vocation, creativity, and spiritual development.",
  },
  {
    eyebrow: "04 / Aspects",
    title: "Angles show how your chart talks to itself.",
    desc: "Trines, squares, oppositions, and conjunctions reveal the gifts and tensions that shape repeated life patterns.",
  },
];

const AXIS_POINTS = [
  { label: "Ascendant", detail: "How life meets you and how others first read your energy." },
  { label: "Midheaven", detail: "Public direction, vocation, reputation, and the work that asks for maturity." },
  { label: "Moon", detail: "Emotional weather, attachment style, and the conditions that feel like home." },
  { label: "Saturn", detail: "Growth through responsibility, boundary, repetition, and long-term mastery." },
];

function NativityHeroVisual() {
  return (
    <div className="relative isolate mx-auto aspect-square w-full max-w-[43rem] overflow-visible">
      <div className="pointer-events-none absolute -inset-12 rounded-full bg-[radial-gradient(circle,rgba(201,168,76,0.24)_0%,rgba(102,217,199,0.12)_34%,transparent_68%)] blur-2xl" />
      <div className="pointer-events-none absolute inset-0 rounded-full opacity-45 [background-image:linear-gradient(rgba(255,255,255,0.075)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.075)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(circle,black_0%,black_62%,transparent_78%)]" />
      <div className="pointer-events-none absolute inset-8 rounded-full bg-[linear-gradient(135deg,rgba(201,168,76,0.20),transparent_34%,rgba(102,217,199,0.12)_70%,transparent)]" />

      <div className="absolute left-2 top-6 z-20 rounded-lg border border-white/[0.10] bg-[#06080f]/82 px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur sm:left-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#c9a84c]/75">Natal Wheel</p>
        <p className="mt-1 text-sm font-semibold text-[#f5f0e8]">12 houses / 10 planets</p>
      </div>

      <div className="absolute bottom-6 right-2 z-20 max-w-[12rem] rounded-lg border border-white/[0.10] bg-[#06080f]/82 px-4 py-3 text-right shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur sm:right-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#66d9c7]/75">Reader Focus</p>
        <p className="mt-1 text-sm font-semibold text-[#f5f0e8]">Purpose, timing, patterns</p>
      </div>

      <div className="absolute left-1/2 top-1/2 size-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#c9a84c]/40 shadow-[0_0_90px_rgba(201,168,76,0.16)]">
        <div className="absolute inset-[5%] rounded-full border border-white/[0.08]" />
        <div className="absolute inset-[14%] rounded-full border border-[#66d9c7]/20" />
        <div className="absolute inset-[24%] rounded-full border border-[#c06b79]/22" />
        <div className="absolute inset-[34%] rounded-full border border-[#c9a84c]/25" />

        <div
          className="absolute inset-[2%] rounded-full opacity-80 motion-safe:animate-[zodiac-spin_90s_linear_infinite]"
          style={{
            background:
              "conic-gradient(from 12deg, rgba(201,168,76,0.35), transparent 8deg 25deg, rgba(102,217,199,0.18) 30deg, transparent 36deg 55deg, rgba(192,107,121,0.20) 60deg, transparent 66deg 85deg, rgba(201,168,76,0.28) 90deg, transparent 96deg 115deg, rgba(102,217,199,0.16) 120deg, transparent 126deg 145deg, rgba(192,107,121,0.18) 150deg, transparent 156deg 175deg, rgba(201,168,76,0.30) 180deg, transparent 186deg 205deg, rgba(102,217,199,0.18) 210deg, transparent 216deg 235deg, rgba(192,107,121,0.18) 240deg, transparent 246deg 265deg, rgba(201,168,76,0.28) 270deg, transparent 276deg 295deg, rgba(102,217,199,0.16) 300deg, transparent 306deg 325deg, rgba(192,107,121,0.18) 330deg, transparent 336deg)",
          }}
        />

        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#c9a84c]/20" />
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#c9a84c]/20" />
        <div className="absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white/[0.08]" />
        <div className="absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-white/[0.08]" />

        {ZODIAC_MARKERS.map((marker) => (
          <div
            key={marker.name}
            className="absolute z-10 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#c9a84c]/25 bg-[#06080f]/80 text-[10px] font-bold text-[#f5f0e8] shadow-[0_0_18px_rgba(201,168,76,0.12)]"
            style={{ left: marker.left, top: marker.top }}
            title={marker.name}
          >
            {marker.sign}
          </div>
        ))}

        {PLANET_MARKERS.map((planet) => (
          <div
            key={planet.name}
            className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-white/[0.08] bg-[#06080f]/85 px-2 py-1 backdrop-blur"
            style={{ left: planet.left, top: planet.top }}
          >
            <Image src={planet.image} alt="" width={20} height={20} className="size-5" />
            <span className="hidden text-[10px] font-semibold uppercase tracking-widest text-[#b8bcd0]/65 sm:inline">
              {planet.label}
            </span>
          </div>
        ))}

        <div className="absolute inset-[28%] overflow-hidden rounded-full border border-[#c9a84c]/30 bg-[#06080f] shadow-[0_0_45px_rgba(201,168,76,0.18)]">
          <Image
            src="/images/services/natal-chart.png"
            alt="Natal chart artwork"
            fill
            priority
            sizes="(max-width: 1024px) 70vw, 24rem"
            className="object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(6,8,15,0.30))]" />
        </div>
      </div>
    </div>
  );
}

function NativityChartExperience({ readerCtaHref }: { readerCtaHref: string }) {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#c9a84c]/70">
            Full-chart synthesis
          </p>
          <h2 className="mt-3 text-4xl font-bold leading-tight text-[#fff8ea] sm:text-5xl">
            A birth chart reading turns a static wheel into a living map.
          </h2>
        </div>

        <div className="grid items-stretch gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative min-h-[620px] overflow-hidden rounded-lg border border-white/[0.08] bg-[#080a12]">
            <Image
              src="/images/services/natal-chart.png"
              alt="Detailed natal chart reading artwork"
              fill
              sizes="(max-width: 1024px) 100vw, 48vw"
              className="object-cover opacity-55"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,8,15,0.92),rgba(6,8,15,0.34)_48%,rgba(6,8,15,0.88))]" />
            <div className="absolute inset-8 rounded-full border border-[#c9a84c]/30" />
            <div className="absolute inset-16 rounded-full border border-[#66d9c7]/18" />
            <div className="absolute inset-x-8 top-1/2 h-px bg-[#c9a84c]/25" />
            <div className="absolute inset-y-8 left-1/2 w-px bg-[#c9a84c]/25" />
            <div className="absolute left-8 top-8 rounded-lg border border-[#c9a84c]/25 bg-[#06080f]/82 px-4 py-3 backdrop-blur">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#c9a84c]/75">Ascendant</p>
              <p className="mt-1 text-sm font-semibold text-[#f5f0e8]">Outer style and first response</p>
            </div>
            <div className="absolute bottom-8 right-8 rounded-lg border border-[#66d9c7]/20 bg-[#06080f]/82 px-4 py-3 text-right backdrop-blur">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#66d9c7]/75">Midheaven</p>
              <p className="mt-1 text-sm font-semibold text-[#f5f0e8]">Work, calling, public path</p>
            </div>
          </div>

          <div className="flex flex-col justify-center border-y border-[#c9a84c]/16 py-8 lg:border-y-0 lg:border-l lg:pl-10">
            <p className="max-w-xl text-base leading-8 text-[#f5f0e8]/72">
              The session moves from precise birth data into the story of your planets, houses, angles, and repeating life themes.
            </p>

            <div className="mt-8 space-y-5">
              {CHART_LAYERS.map((layer) => (
                <div key={layer.eyebrow} className="border-l border-[#c9a84c]/28 pl-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#66d9c7]/75">
                    {layer.eyebrow}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-[#f5f0e8]">{layer.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#b8bcd0]/58">{layer.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href={readerCtaHref}
                className="inline-flex h-11 items-center rounded-lg bg-[#c9a84c] px-6 text-sm font-semibold text-black transition-colors hover:bg-[#e2c97e]"
              >
                Choose a Birth Chart Reader
              </a>
              <a
                href="#free-guide"
                className="inline-flex h-11 items-center rounded-lg border border-white/[0.10] px-5 text-sm font-semibold text-[#f5f0e8] transition-colors hover:border-[#66d9c7]/30 hover:bg-white/[0.04]"
              >
                Prepare My Birth Details
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NativityAxisSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#c9a84c]/70">
              Chart anatomy
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold text-[#f5f0e8]">
              The strongest placements become the reading path.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[#b8bcd0]/58">
            Your astrologer follows the chart's loudest signatures first, then connects them back to practical questions.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.08] md:grid-cols-4">
          {AXIS_POINTS.map((point, index) => (
            <div key={point.label} className="bg-[#080a12] p-7 transition-colors hover:bg-[#0d0d0a]">
              <div className="mb-8 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#66d9c7]/70">
                  Axis {index + 1}
                </span>
                <span className="text-2xl text-[#c9a84c]/55" aria-hidden="true">
                  {index === 0 ? "ASC" : index === 1 ? "MC" : index === 2 ? "MO" : "SA"}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-[#f5f0e8]">{point.label}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#b8bcd0]/58">{point.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NativityPreparationStrip() {
  return (
    <section className="px-4 pb-12 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-lg border border-[#c9a84c]/18 bg-[#080a12] shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
        <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
          <div className="relative min-h-[320px] border-b border-white/[0.08] p-7 lg:border-b-0 lg:border-r">
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(115deg,transparent_0%,rgba(201,168,76,0.14)_34%,transparent_35%,transparent_62%,rgba(102,217,199,0.12)_63%,transparent_100%)]" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#c9a84c]/70">
                Before you book
              </p>
              <h2 className="mt-3 text-3xl font-bold text-[#f5f0e8]">
                Bring the exact birth details. Leave with the pattern.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#b8bcd0]/60">
                Date, location, and the closest possible time let the reader work with the full house structure and timing angles.
              </p>
            </div>

            <div className="absolute bottom-7 left-7 right-7 flex items-center gap-3">
              {PLANET_MARKERS.slice(0, 4).map((planet) => (
                <div
                  key={planet.name}
                  className="flex size-11 items-center justify-center rounded-full border border-white/[0.08] bg-[#06080f]/80"
                >
                  <Image src={planet.image} alt="" width={24} height={24} className="size-6" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid divide-y divide-white/[0.08] md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              ["Birth moment", "Give your date, time, and city so the chart can be cast cleanly."],
              ["Session focus", "Name the patterns you want to understand before the reading starts."],
              ["Reader match", "Choose an astrologer whose style fits natal interpretation."],
            ].map(([title, desc], index) => (
              <div key={title} className="p-7">
                <span className="text-5xl font-black leading-none text-white/[0.05]">0{index + 1}</span>
                <h3 className="mt-8 text-base font-semibold text-[#f5f0e8]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#b8bcd0]/58">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function NativityBirthChartPage() {
  const diviners = await getNativityBirthChartDiviners();
  const readerCtaHref = diviners.length > 0 ? "#diviners" : "/discover?type=astrologer";

  return (
    <ReadingPageTemplate
      serviceType="astrology"
      presentation="immersive"
      hideServiceVisualCta
      badge="The Foundation of All Astrology"
      heroImage={getReadingOgImageUrl("nativity-birth-chart")}
      heroVisual={<NativityHeroVisual />}
      heroTitleBefore="Your Natal Chart: "
      heroTitleGradient="The Map of Your Soul"
      heroSubtitle="Cast at the precise moment you were born, your natal chart is the most personal astrological document that exists — a complete portrait of your soul's journey, gifts, challenges, and purpose."
      heroStats={[
        { value: "Lifetime Blueprint", label: "Unique to Your Birth Moment" },
        { value: "Your Birth Moment", label: "Exact to the Minute & Location" },
      ]}
      startingPrice={175}
      whatIsTitle="What Is a Nativity Birth Chart?"
      whatIsParagraphs={[
        "Your natal chart — also called a nativity or birth chart — is a map of where every planet in the solar system was positioned at the exact moment and place of your birth. It is unique to you, functioning as a cosmic fingerprint that never repeats.",
        "Unlike sun sign horoscopes that apply to one-twelfth of the population, your natal chart captures the placement of the Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto — each in a specific zodiac sign, house, and angular relationship to the others.",
        "Reading the natal chart is the most foundational skill in astrology. Every other technique — solar returns, transits, progressions — layers on top of this bedrock map. Understanding your chart is understanding yourself at the deepest level.",
      ]}
      revealsItems={[
        { label: "Core Identity & Purpose", desc: "Sun sign, rising sign, and their combined message about who you are and why you're here" },
        { label: "Emotional Landscape", desc: "Moon placement revealing your instincts, emotional needs, and what makes you feel safe" },
        { label: "Mind & Communication Style", desc: "Mercury position showing how you think, learn, process information, and express yourself" },
        { label: "Relationship Patterns", desc: "Venus and 7th house themes revealing how you love, attract, and connect with others" },
        { label: "Career & Life Path", desc: "10th house, Midheaven, and Saturn placement mapping your vocational calling and public legacy" },
      ]}
      expectCards={[
        { icon: "🌟", title: "Complete Planetary Portrait", desc: "Your reader will walk through every major planet, its sign and house placement, and what each reveals about a distinct dimension of your personality and life experience." },
        { icon: "🔗", title: "How the Chart Speaks as a Whole", desc: "Beyond individual placements, your astrologer will reveal the key aspect patterns and configurations that link the planets — showing the core themes and tensions that run through your entire life." },
        { icon: "🗺️", title: "Practical Life Guidance", desc: "The reading translates abstract symbolism into grounded insight — how your chart speaks to relationships, career, timing, and the soul-level purpose that underlies your specific incarnation." },
      ]}
      testimonials={[
        { quote: "I had no idea how much my natal chart could explain about patterns I've carried my whole life. This reading changed how I see everything.", name: "Sarah K.", location: "London, UK", service: "Birth Chart Reading" },
        { quote: "My reader decoded my chart with such depth — it felt like she'd known me for years. Completely transformed my self-understanding.", name: "James R.", location: "New York, US", service: "Natal Chart Reading" },
        { quote: "I was skeptical, but the accuracy blew me away. I've since referred three close friends. Worth every penny.", name: "Priya M.", location: "Toronto, CA", service: "Natal Chart Reading" },
      ]}
      diviners={diviners}
      discoverLink="/discover?type=astrologer"
      discoverLabel="See All Astrologers"
      divinerSectionTitle="Find Your Birth Chart Astrologer"
      divinerSectionSubtitle="These practitioners specialize in natal chart readings"
      emailGuideSubject="your natal chart reading"
      methodNotes={[
        {
          label: "Technique",
          title: "Natal chart synthesis",
          desc: "Your astrologer reads planets, signs, houses, angles, and major aspects together rather than treating your sun sign as the whole story.",
        },
        {
          label: "Best For",
          title: "Lifelong pattern clarity",
          desc: "Use this session for identity, emotional needs, relationship patterns, vocation, and the repeating themes that shape long-term choices.",
        },
        {
          label: "Prepare",
          title: "Exact birth data matters",
          desc: "Bring your date, location, and closest possible birth time so the Ascendant, Midheaven, house structure, and timing-sensitive angles can be read cleanly.",
        },
      ]}
      afterTrustContent={<NativityChartExperience readerCtaHref={readerCtaHref} />}
      afterWhatIsContent={<NativityAxisSection />}
      beforeExpectContent={<NativityPreparationStrip />}
      faqItems={[
        { q: "What information do I need for a birth chart reading?", a: "You'll need your birth date, birth time, and birth location. The birth time is crucial — even a few minutes of difference changes your Rising sign and shifts all the house cusps. If you don't know your exact birth time, check your birth certificate or ask a parent. A rectified chart (without birth time) is still valuable but less precise." },
        { q: "I already know my sun sign — will I learn anything new?", a: "Enormously more. Your sun sign is one placement out of many in your natal chart. A full reading covers the Moon (emotional nature), Rising sign (outer personality), Mercury (how you think), Venus (how you love), Mars (how you act), and several outer planets — each adding layers of nuance your sun sign alone cannot offer." },
        { q: "How long does a birth chart reading typically take?", a: "A thorough natal chart reading runs 60–90 minutes. The chart contains a lifetime of information, and a skilled astrologer will pace the session to cover the most personally relevant themes rather than rushing through every placement mechanically." },
        { q: "Can I get a birth chart reading if I don't know my birth time?", a: "Yes — a solar chart (using noon as default time) still covers most planetary placements accurately. You'll miss the precise Rising sign and house structure, but the reading remains highly informative. Some astrologers offer rectification services to narrow down the likely birth time through key life events." },
        { q: "Is a natal chart reading the same as a horoscope?", a: "No. A horoscope is a generalized sun-sign forecast written for millions of people. A natal chart reading is personalized to you specifically — based on the unique planetary map of your birth moment. The two are not comparable in depth or precision." },
      ]}
      ctaTitle="Ready to understand your soul's blueprint?"
      ctaBody="Connect with a certified astrologer who can decode the full architecture of your natal chart — revealing the gifts, challenges, and purpose written in the stars at the moment of your birth."
      ctaButtonLabel="Browse All Astrologers"
      relatedReadings={[
        { title: "Solar Return Reading", href: "/readings/solar-return", icon: "☀️" },
        { title: "Saturn Return Reading", href: "/readings/saturn-return", icon: "🪐" },
        { title: "Romantic Relationship Reading", href: "/readings/romantic-relationships", icon: "💞" },
      ]}
      pageUrl={`${APP_URL}/readings/nativity-birth-chart`}
    />
  );
}
