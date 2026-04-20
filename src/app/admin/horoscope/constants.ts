// Planet & Zodiac symbols
export const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
  Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇",
  Node: "☊", "Part of Fortune": "⊕", Fortune: "⊕", Chiron: "⚷", Lilith: "⚸",
};

export const ZODIAC_SYMBOLS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋", Leo: "♌", Virgo: "♍",
  Libra: "♎", Scorpio: "♏", Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

export const ASPECT_SYMBOLS: Record<string, string> = {
  Conjunction: "☌", Sextile: "⚹", Square: "□", Trine: "△", Opposition: "☍",
};

export const PLANET_ORDER = ["Moon", "Mercury", "Venus", "Sun", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Other"];

// AWS S3 planet images
export const PLANET_IMAGES: Record<string, string> = {
  Sun: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/sun+(2).png",
  Moon: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/moon+(3).png",
  Mercury: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/mercury+(2).png",
  Venus: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/vinus_sign.png",
  Mars: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/mars+(2).png",
  Jupiter: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/jupiton_sign.png",
  Saturn: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/satarn+(1).png",
  Uranus: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/urenus_sign.png",
  Neptune: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/neptune_sign.png",
  Pluto: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/pluto_sign.png",
  Node: "",
  "Part of Fortune": "",
  Fortune: "",
  Chiron: "",
};

export const LADDER_PLANET_IMAGES: Record<string, string> = {
  Sun: "/images/horoscope-zodiac/sun.png",
  Moon: "/images/horoscope-zodiac/moon.png",
  Mercury: "/images/horoscope-zodiac/mercury.png",
  Venus: "/images/horoscope-zodiac/venus.png",
  Mars: "/images/horoscope-zodiac/mars.png",
  Jupiter: "/images/horoscope-zodiac/jupiter.png",
  Saturn: "/images/horoscope-zodiac/saturn.png",
  Uranus: "/images/horoscope-zodiac/uranus.png",
  Neptune: "/images/horoscope-zodiac/neptune.png",
  Pluto: "/images/horoscope-zodiac/pluto.png",
  Node: "/images/horoscope-zodiac/node.png",
  "Part of Fortune": "/images/horoscope-zodiac/part_of_fortune.png",
  Fortune: "/images/horoscope-zodiac/part_of_fortune.png",
  Chiron: "/images/horoscope-zodiac/chiron.png",
};

// Planet sign images + aspect images
export const ASTRO_HEADER_IMAGES: Record<string, string> = {
  // Planets (planet_singn/ folder)
  Sun: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/sun+(2).png",
  Moon: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/moon+(3).png",
  Mercury: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/mercury+(2).png",
  Venus: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/vinus_sign.png",
  Mars: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/mars+(2).png",
  Jupiter: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/jupiton_sign.png",
  Saturn: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/satarn+(1).png",
  Uranus: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/urenus_sign.png",
  Neptune: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/neptune_sign.png",
  Pluto: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/pluto_sign.png",
  // Aspect types
  Conjunction: "https://all-frontend-assets.s3.us-east-1.amazonaws.com/divine_astro_assates/connection_singn/conjuction_sign.png",
  Conjunct: "https://all-frontend-assets.s3.us-east-1.amazonaws.com/divine_astro_assates/connection_singn/conjuction_sign.png",
  Opposition: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/connection_singn/opposit.png",
  Square: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/connection_singn/squar.png",
  Trine: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/connection_singn/trine.png",
  Sextile: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/connection_singn/sextile.png",
  // Zodiac signs (empty - Manual icons)
  Aries: "", Taurus: "", Gemini: "", Cancer: "", Leo: "", Virgo: "",
  Libra: "", Scorpio: "", Sagittarius: "", Capricorn: "", Aquarius: "", Pisces: "",
};

export const ASPECT_IMAGES: Record<string, string> = {
  Conjunction: ASTRO_HEADER_IMAGES.Conjunction,
  Opposition: ASTRO_HEADER_IMAGES.Opposition,
  Square: ASTRO_HEADER_IMAGES.Square,
  Trine: ASTRO_HEADER_IMAGES.Trine,
  Sextile: ASTRO_HEADER_IMAGES.Sextile,
};

// Word association keyword maps
export const PLANET_KEYWORDS: Record<string, string[]> = {
  Sun: ["identity", "ego", "vitality", "purpose", "willpower", "consciousness", "leadership", "creativity", "authority", "radiance"],
  Moon: ["emotions", "intuition", "nurturing", "subconscious", "cycles", "receptivity", "instinct", "memory", "home", "comfort"],
  Mercury: ["communication", "intellect", "analysis", "logic", "adaptability", "learning", "expression", "curiosity", "wit", "thought"],
  Venus: ["love", "beauty", "harmony", "values", "pleasure", "relationships", "aesthetics", "attraction", "grace", "affection"],
  Mars: ["action", "drive", "ambition", "energy", "courage", "desire", "assertiveness", "passion", "competition", "force"],
  Jupiter: ["expansion", "wisdom", "abundance", "optimism", "growth", "philosophy", "opportunity", "fortune", "benevolence", "faith"],
  Saturn: ["discipline", "structure", "karma", "responsibility", "limitation", "mastery", "perseverance", "authority", "endurance", "time"],
  Uranus: ["innovation", "rebellion", "awakening", "freedom", "disruption", "originality", "breakthrough", "revolution", "insight", "change"],
  Neptune: ["spirituality", "dreams", "illusion", "compassion", "mysticism", "transcendence", "sensitivity", "fantasy", "inspiration", "dissolution"],
  Pluto: ["transformation", "power", "regeneration", "depth", "shadow", "rebirth", "evolution", "intensity", "obsession", "renewal"],
  Node: ["destiny", "karma", "life path", "growth", "soul mission", "connection", "evolution", "purpose", "collective", "direction"],
  Chiron: ["healing", "wounds", "wisdom", "mentorship", "pain", "wholeness", "integration", "teaching", "vulnerability", "breakthrough"],
};

export const ASPECT_KEYWORDS: Record<string, string[]> = {
  Conjunction: ["fusion", "intensification", "merging", "unity", "amplification", "focus", "new beginning", "power", "initiation", "strength"],
  Opposition: ["tension", "balance", "awareness", "polarity", "integration", "projection", "challenge", "contrast", "opposition", "reflection"],
  Square: ["challenge", "conflict", "dynamic", "pressure", "friction", "growth", "obstacle", "crisis", "motivation", "breakthrough"],
  Trine: ["harmony", "flow", "ease", "talent", "natural ability", "grace", "gift", "support", "opportunity", "alignment"],
  Sextile: ["opportunity", "cooperation", "potential", "synergy", "support", "effort", "productivity", "skill", "resource", "connection"],
};

export const ASPECT_TYPE_WORDS = ["Conjunction", "Conjunct", "Opposition", "Square", "Trine", "Sextile"];

export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const RELATIONSHIP_AI_SECTIONS = [
  { key: "synastry_horoscope", label: "Synastry Horoscope" },
  { key: "composite_horoscope", label: "Composite Horoscope" },
  { key: "davison_relationship", label: "Davison Relationship" },
  { key: "major_aspects_and_connections", label: "Major Aspects & Connections" },
  { key: "compatibility_score_or_summary", label: "Compatibility Score / Summary" },
  { key: "elemental_balance", label: "Elemental Balance" },
  { key: "timing_and_transits", label: "Timing & Transits" },
  { key: "karmic_and_soulmate_indicators", label: "Karmic & Soulmate Indicators" },
  { key: "professional_alignment_and_goals", label: "Professional Alignment & Goals" },
];

export const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
export const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));
