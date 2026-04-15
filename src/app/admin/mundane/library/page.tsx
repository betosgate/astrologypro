import Link from "next/link";
import { ArrowLeft, BookMarked } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

// ─── Reference Data ──────────────────────────────────────────────────────────

type CountryRulership = { sign: string; countries: string[] };
type PlanetCommodity = { planet: string; keywords: string[] };
type SignIndustry = { sign: string; industries: string[] };
type IngressEntry = { name: string; timing: string; significance: string };

const SIGN_SYMBOL: Record<string, string> = {
  aries: "♈", taurus: "♉", gemini: "♊", cancer: "♋",
  leo: "♌", virgo: "♍", libra: "♎", scorpio: "♏",
  sagittarius: "♐", capricorn: "♑", aquarius: "♒", pisces: "♓",
};

const SIGN_COLOR: Record<string, string> = {
  aries: "bg-red-50 border-red-200 text-red-700",
  taurus: "bg-emerald-50 border-emerald-200 text-emerald-700",
  gemini: "bg-yellow-50 border-yellow-200 text-yellow-700",
  cancer: "bg-sky-50 border-sky-200 text-sky-700",
  leo: "bg-orange-50 border-orange-200 text-orange-700",
  virgo: "bg-lime-50 border-lime-200 text-lime-700",
  libra: "bg-pink-50 border-pink-200 text-pink-700",
  scorpio: "bg-rose-50 border-rose-200 text-rose-700",
  sagittarius: "bg-violet-50 border-violet-200 text-violet-700",
  capricorn: "bg-slate-50 border-slate-200 text-slate-700",
  aquarius: "bg-cyan-50 border-cyan-200 text-cyan-700",
  pisces: "bg-indigo-50 border-indigo-200 text-indigo-700",
};

const PLANET_COLOR: Record<string, string> = {
  Sun: "bg-amber-100 text-amber-700 border-amber-200",
  Moon: "bg-slate-100 text-slate-600 border-slate-200",
  Mercury: "bg-teal-100 text-teal-700 border-teal-200",
  Venus: "bg-pink-100 text-pink-700 border-pink-200",
  Mars: "bg-red-100 text-red-700 border-red-200",
  Jupiter: "bg-violet-100 text-violet-700 border-violet-200",
  Saturn: "bg-gray-100 text-gray-600 border-gray-200",
  Uranus: "bg-cyan-100 text-cyan-700 border-cyan-200",
  Neptune: "bg-blue-100 text-blue-700 border-blue-200",
  Pluto: "bg-rose-100 text-rose-700 border-rose-200",
};

const COUNTRY_RULERSHIPS: CountryRulership[] = [
  { sign: "aries", countries: ["England", "Germany", "Lithuania", "Palestine"] },
  { sign: "taurus", countries: ["Ireland", "Iran", "Cyprus", "Georgia", "Tanzania"] },
  { sign: "gemini", countries: ["USA (Gemini tradition)", "Belgium", "Wales", "Morocco"] },
  { sign: "cancer", countries: ["USA (Cancer tradition)", "Holland", "Scotland", "Mauritius", "Paraguay"] },
  { sign: "leo", countries: ["France", "Italy", "Romania", "Czech Republic", "South Sudan"] },
  { sign: "virgo", countries: ["Brazil", "Greece", "Switzerland", "Turkey", "Uruguay"] },
  { sign: "libra", countries: ["Austria", "Argentina", "Burma", "Canada", "China"] },
  { sign: "scorpio", countries: ["Norway", "Morocco", "Syria", "Korea", "Algeria"] },
  { sign: "sagittarius", countries: ["Australia", "Hungary", "Saudi Arabia", "Spain", "Chile"] },
  { sign: "capricorn", countries: ["India", "Albania", "Bulgaria", "Mexico", "UK (Capricorn tradition)"] },
  { sign: "aquarius", countries: ["Russia", "Sweden", "Finland", "Ethiopia", "Poland"] },
  { sign: "pisces", countries: ["Portugal", "Egypt", "Samoa", "Mozambique"] },
];

const PLANET_COMMODITIES: PlanetCommodity[] = [
  { planet: "Sun", keywords: ["gold", "government bonds", "leaders", "authority", "royalty"] },
  { planet: "Moon", keywords: ["silver", "food / grains", "water", "the public", "tides"] },
  { planet: "Mercury", keywords: ["currencies", "communications", "trade", "transport", "news"] },
  { planet: "Venus", keywords: ["copper", "arts", "luxury goods", "textiles", "diplomacy"] },
  { planet: "Mars", keywords: ["iron", "steel", "military", "weapons", "fire", "conflict"] },
  { planet: "Jupiter", keywords: ["tin", "law", "religion", "expansion", "oil (traditional)", "prosperity"] },
  { planet: "Saturn", keywords: ["lead", "coal", "real estate", "agriculture", "time", "austerity"] },
  { planet: "Uranus", keywords: ["uranium", "electricity", "technology", "cryptocurrency", "revolution"] },
  { planet: "Neptune", keywords: ["oil", "gas", "alcohol", "pharmaceuticals", "deception", "inflation"] },
  { planet: "Pluto", keywords: ["plutonium", "transformation", "underworld", "debt", "power struggles"] },
];

const SIGN_INDUSTRIES: SignIndustry[] = [
  { sign: "aries", industries: ["military", "sports", "surgery", "new ventures", "weapons"] },
  { sign: "taurus", industries: ["banking", "real estate", "food production", "luxury goods", "agriculture"] },
  { sign: "gemini", industries: ["media", "transport", "education", "communication", "publishing"] },
  { sign: "cancer", industries: ["housing", "food industry", "shipping", "family services", "hospitality"] },
  { sign: "leo", industries: ["entertainment", "royalty", "speculation / markets", "gold", "children"] },
  { sign: "virgo", industries: ["healthcare", "labor", "agriculture", "crafts", "analysis"] },
  { sign: "libra", industries: ["law", "diplomacy", "luxury goods", "partnerships", "beauty industry"] },
  { sign: "scorpio", industries: ["insurance", "debt / finance", "intelligence services", "surgery", "secrets"] },
  { sign: "sagittarius", industries: ["religion", "law", "philosophy", "foreign trade", "higher education"] },
  { sign: "capricorn", industries: ["government", "corporations", "mining", "authority", "infrastructure"] },
  { sign: "aquarius", industries: ["technology", "science", "social movements", "aviation", "reform"] },
  { sign: "pisces", industries: ["ocean / shipping", "oil & gas", "pharmaceuticals", "institutions", "religion"] },
];

const INGRESS_REFERENCE: IngressEntry[] = [
  {
    name: "Aries Ingress (Spring Equinox)",
    timing: "Sun enters 0° Aries, ~March 20",
    significance:
      "The year chart — most important annual mundane chart. Valid until the next Aries Ingress. Cast for the capital of each nation to assess the year ahead.",
  },
  {
    name: "Cancer Ingress (Summer Solstice)",
    timing: "Sun enters 0° Cancer, ~June 21",
    significance:
      "Q3 quarter chart. Modifies the Aries Ingress themes for the summer quarter. Particularly relevant for the northern hemisphere.",
  },
  {
    name: "Libra Ingress (Fall Equinox)",
    timing: "Sun enters 0° Libra, ~September 22",
    significance:
      "Q4 quarter chart. Marks the autumn quarter; emphasizes diplomatic, legal, and partnership themes.",
  },
  {
    name: "Capricorn Ingress (Winter Solstice)",
    timing: "Sun enters 0° Capricorn, ~December 21",
    significance:
      "Q1 quarter chart for the following year. Highlights governmental, structural, and economic foundations.",
  },
  {
    name: "Solar Return (Entity Annual Chart)",
    timing: "Sun returns to exact natal degree each year",
    significance:
      "Annual chart for the entity's founding anniversary. Describes the year from birthday to birthday. Relocated chart if entity has moved headquarters.",
  },
  {
    name: "Lunar Return",
    timing: "Moon returns to natal degree, approximately monthly",
    significance:
      "Monthly forecasting frame. Useful for tracking short-term cycles and emotional/public sentiment shifts.",
  },
  {
    name: "New Moon Charts",
    timing: "Monthly, at exact Sun-Moon conjunction",
    significance:
      "Monthly forecasting frame. The sign and degree of the New Moon colors the following four-week lunar cycle.",
  },
  {
    name: "Eclipse Charts",
    timing: "Solar: New Moon conjunct node. Lunar: Full Moon conjunct node.",
    significance:
      "Cast for the moment of eclipse; considered valid until the next eclipse of the same Saros series. Solar eclipses are particularly potent — especially when conjunct natal points of an entity.",
  },
];

// ─── Components ──────────────────────────────────────────────────────────────

function SignBadge({ sign }: { sign: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${SIGN_COLOR[sign] ?? "bg-gray-50 border-gray-200 text-gray-700"}`}
    >
      {SIGN_SYMBOL[sign] ?? ""} {sign}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type LibTab = "countries" | "commodities" | "industries" | "ingresses";

export default async function AdminMundaneLibraryPage() {
  const user = await requireAdmin();
  if (!user) redirect("/admin/login");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/mundane"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="size-4" /> Back to Mundane
        </Link>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookMarked className="size-6 text-indigo-500" />
          Mundane Reference Library
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Traditional rulerships, commodity correspondences, and ingress reference for mundane research.
        </p>
      </div>

      {/* Four reference tables rendered inline (server-side, no JS tab switching needed) */}
      <LibraryContent />
    </div>
  );
}

function LibraryContent() {
  return (
    <div className="space-y-10">
      {/* ── Tab 1: Country Rulerships ──────────────────────────────────────── */}
      <section id="countries">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Country–Sign Rulerships
          <Badge variant="outline" className="text-xs">{COUNTRY_RULERSHIPS.length} signs</Badge>
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COUNTRY_RULERSHIPS.map((r) => (
            <Card key={r.sign} className={`border ${SIGN_COLOR[r.sign] ?? ""}`}>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm capitalize flex items-center gap-1.5">
                  <span className="text-base">{SIGN_SYMBOL[r.sign] ?? ""}</span>
                  {r.sign}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="flex flex-wrap gap-1">
                  {r.countries.map((c) => (
                    <span
                      key={c}
                      className="inline-block rounded border bg-white/70 px-1.5 py-0.5 text-xs"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Traditional rulerships per Lilly, Houlding, and Baigent/Campion. Multiple traditions exist — some countries appear under more than one sign.
        </p>
      </section>

      {/* ── Tab 2: Planet–Commodity Map ───────────────────────────────────── */}
      <section id="commodities">
        <h2 className="text-lg font-semibold mb-4">Planet–Commodity Correspondences</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PLANET_COMMODITIES.map((pc) => (
            <Card key={pc.planet}>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold ${PLANET_COLOR[pc.planet] ?? ""}`}
                  >
                    {pc.planet}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="flex flex-wrap gap-1">
                  {pc.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-block rounded border bg-muted/50 px-1.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Classical correspondences from traditional mundane texts. Modern planets (Uranus, Neptune, Pluto) follow 20th-century consensus.
        </p>
      </section>

      {/* ── Tab 3: Sign–Industry Map ──────────────────────────────────────── */}
      <section id="industries">
        <h2 className="text-lg font-semibold mb-4">Sign–Industry Correspondences</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SIGN_INDUSTRIES.map((si) => (
            <Card key={si.sign} className="border">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm">
                  <SignBadge sign={si.sign} />
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="flex flex-wrap gap-1">
                  {si.industries.map((ind) => (
                    <span
                      key={ind}
                      className="inline-block rounded border bg-muted/50 px-1.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {ind}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Tab 4: Ingress Reference ──────────────────────────────────────── */}
      <section id="ingresses">
        <h2 className="text-lg font-semibold mb-4">Mundane Ingress Reference</h2>
        <div className="space-y-3">
          {INGRESS_REFERENCE.map((ing) => (
            <Card key={ing.name}>
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="sm:w-56 shrink-0">
                    <p className="font-semibold text-sm">{ing.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{ing.timing}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground leading-relaxed">{ing.significance}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Ingress charts are traditionally relocated to the capital city of each country being studied.
          The Aries Ingress is the primary annual chart; the three remaining cardinal ingresses provide quarterly refinement.
        </p>
      </section>
    </div>
  );
}
