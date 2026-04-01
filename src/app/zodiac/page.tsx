import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { CtaBanner } from "@/components/seo/cta-banner";
import { JsonLd } from "@/components/seo/json-ld";
import zodiacSigns from "@/data/zodiac-signs";

export const metadata: Metadata = {
  title: "All 12 Zodiac Signs: Traits, Dates & Compatibility | AstrologyPro",
  description:
    "Explore all 12 zodiac signs with in-depth guides on personality traits, compatibility, ruling planets, and astrological meaning. From Aries to Pisces, discover your sign.",
  openGraph: {
    title: "All 12 Zodiac Signs: Traits, Dates & Compatibility | AstrologyPro",
    description:
      "Explore all 12 zodiac signs with in-depth guides on personality traits, compatibility, ruling planets, and astrological meaning.",
    type: "website",
    url: "https://www.astrologypro.com/zodiac",
    siteName: "AstrologyPro",
  },
};

const elementColors: Record<string, string> = {
  Fire: "border-red-700/40 bg-red-900/20 text-red-300",
  Earth: "border-emerald-700/40 bg-emerald-900/20 text-emerald-300",
  Air: "border-sky-700/40 bg-sky-900/20 text-sky-300",
  Water: "border-blue-700/40 bg-blue-900/20 text-blue-300",
};

const elementGlow: Record<string, string> = {
  Fire: "hover:shadow-red-900/20",
  Earth: "hover:shadow-emerald-900/20",
  Air: "hover:shadow-sky-900/20",
  Water: "hover:shadow-blue-900/20",
};

export default function ZodiacHubPage() {
  return (
    <div className="min-h-screen bg-[#040610]">
      <MarketingHeader />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "All 12 Zodiac Signs",
          description:
            "Complete guide to all 12 zodiac signs including personality traits, compatibility, and astrological meaning.",
          url: "https://www.astrologypro.com/zodiac",
          publisher: {
            "@type": "Organization",
            name: "AstrologyPro",
            url: "https://www.astrologypro.com",
          },
        }}
      />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Zodiac Signs" },
        ]}
      />

      {/* Hero */}
      <section className="px-4 pb-12 pt-8 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl font-bold text-[#f5f0e8] sm:text-5xl lg:text-6xl">
            The 12 Zodiac Signs
          </h1>
          <p className="mt-4 text-lg text-[#b8bcd0]">
            Explore the archetypal energies, planetary rulers, and elemental
            forces that shape each sign of the zodiac. Dive deep into
            personality traits, compatibility, career strengths, and the
            astrological wisdom that has guided humanity for millennia.
          </p>
        </div>
      </section>

      {/* Signs Grid */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {zodiacSigns.map((sign) => (
            <Link
              key={sign.slug}
              href={`/zodiac/${sign.slug}`}
              className={`group rounded-2xl border border-[#c9a84c]/15 bg-[#0a0d1a] p-6 transition-all hover:border-[#c9a84c]/40 hover:shadow-xl ${elementGlow[sign.element] || ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="text-5xl">{sign.symbol}</div>
                <span
                  className={`rounded-full border px-3 py-0.5 text-xs font-medium ${elementColors[sign.element] || ""}`}
                >
                  {sign.element}
                </span>
              </div>
              <h2 className="font-display mt-4 text-2xl font-bold text-[#f5f0e8] transition-colors group-hover:text-[#c9a84c]">
                {sign.name}
              </h2>
              <p className="mt-1 text-sm text-[#c9a84c]/80">{sign.dates}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs text-[#b8bcd0]/60">
                  {sign.modality}
                </span>
                <span className="text-[#b8bcd0]/30">|</span>
                <span className="text-xs text-[#b8bcd0]/60">
                  {sign.rulingPlanet}
                </span>
                <span className="text-[#b8bcd0]/30">|</span>
                <span className="text-xs text-[#b8bcd0]/60">
                  {sign.house}
                </span>
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#b8bcd0]/80">
                {sign.overview.slice(0, 180)}...
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Elements Overview */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-center text-3xl font-bold text-[#f5f0e8]">
            The Four Elements
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[#b8bcd0]">
            Each zodiac sign belongs to one of four elemental groups, shaping
            their fundamental nature and how they interact with the world.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[
              {
                element: "Fire",
                signs: "Aries, Leo, Sagittarius",
                description:
                  "Fire signs are passionate, dynamic, and temperamental. They get angry quickly but also forgive easily. Adventurous with immense energy, they are physically strong and serve as a source of inspiration for others.",
                color: "border-red-700/30 bg-red-900/10",
                textColor: "text-red-300",
              },
              {
                element: "Earth",
                signs: "Taurus, Virgo, Capricorn",
                description:
                  "Earth signs are grounded, practical, and conservative. They are loyal and stable, standing by their people through hard times. Connected to the material world, they appreciate luxury and sensual pleasures.",
                color: "border-emerald-700/30 bg-emerald-900/10",
                textColor: "text-emerald-300",
              },
              {
                element: "Air",
                signs: "Gemini, Libra, Aquarius",
                description:
                  "Air signs are rational, social, and communicative. They love philosophical discussions, social gatherings, and good books. They enjoy giving advice but can be superficial. They are analytical, intellectual, and communicative.",
                color: "border-sky-700/30 bg-sky-900/10",
                textColor: "text-sky-300",
              },
              {
                element: "Water",
                signs: "Cancer, Scorpio, Pisces",
                description:
                  "Water signs are exceptionally emotional and ultra-sensitive. They are highly intuitive and mysterious. Water signs love profound conversations and intimacy. They are supportive of loved ones and can be as deep as the ocean itself.",
                color: "border-blue-700/30 bg-blue-900/10",
                textColor: "text-blue-300",
              },
            ].map((el) => (
              <div
                key={el.element}
                className={`rounded-xl border ${el.color} p-6`}
              >
                <h3
                  className={`font-display text-xl font-bold ${el.textColor}`}
                >
                  {el.element}
                </h3>
                <p className="mt-1 text-sm font-medium text-[#c9a84c]/70">
                  {el.signs}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#b8bcd0]">
                  {el.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner variant="client" />

      <MarketingFooter />
    </div>
  );
}
