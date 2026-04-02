export type PlanId = "tarot" | "astrology" | "both";

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  setupPrice: number;
  monthlyPrice: number;
  setupEnvKey: string;
  monthlyEnvKey: string;
  serviceCount: number;
  serviceLabel: string;
  highlights: string[];
  isFeatured: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  tarot: {
    id: "tarot",
    name: "The Tarot Reader",
    tagline: "For dedicated card readers",
    setupPrice: 197,
    monthlyPrice: 97,
    setupEnvKey: "STRIPE_PRICE_TAROT_SETUP",
    monthlyEnvKey: "STRIPE_PRICE_TAROT_MONTHLY",
    serviceCount: 9,
    serviceLabel: "8 tarot spreads + freelance session",
    highlights: [
      "3-Card Basic to 12-Card Astrological spreads",
      "Celtic Cross, Horseshoe, Relationship spreads",
      "Freelance tarot sessions (any spread, any topic)",
    ],
    isFeatured: false,
  },
  both: {
    id: "both",
    name: "The Oracle",
    tagline: "The complete divination practice",
    setupPrice: 297,
    monthlyPrice: 147,
    setupEnvKey: "STRIPE_PRICE_BOTH_SETUP",
    monthlyEnvKey: "STRIPE_PRICE_BOTH_MONTHLY",
    serviceCount: 20,
    serviceLabel: "All 19 services + phone readings",
    highlights: [
      "Every astrology & tarot service combined",
      "Dedicated phone line for readings",
      "Save $97 on setup + $47/mo vs. buying both",
    ],
    isFeatured: true,
  },
  astrology: {
    id: "astrology",
    name: "The Astrologer",
    tagline: "For chart-focused practitioners",
    setupPrice: 197,
    monthlyPrice: 97,
    setupEnvKey: "STRIPE_PRICE_ASTROLOGY_SETUP",
    monthlyEnvKey: "STRIPE_PRICE_ASTROLOGY_MONTHLY",
    serviceCount: 12,
    serviceLabel: "11 astrology readings + freelance session",
    highlights: [
      "Natal, Solar Return, Saturn & Jupiter Return",
      "Relationship synastry (romantic, friendship, business)",
      "Weekly & monthly transits, horary questions",
    ],
    isFeatured: false,
  },
};

/** Display order: tarot, both (center), astrology */
export const PLAN_ORDER: PlanId[] = ["tarot", "both", "astrology"];

export const SHARED_FEATURES = [
  "Your branded landing page at astrologypro.com/you",
  "HD video sessions with screen sharing",
  "Automatic session recording & sharing",
  "Smart booking & calendar sync",
  "Stripe payment processing (clients pay you directly)",
  "Client CRM & birth data management",
  "Affiliate program tools",
  "Social media auto-posting (Push-to-Share)",
  "Email & SMS notifications",
  "Astrological event reminders for your clients",
  "Client testimonials system",
  "YouTube & Facebook Live embed",
  "Full back-office software access",
  "Post-session follow-up automation",
  "Diviner discovery page listing",
  "Gift certificate system",
  "Client loyalty discounts",
  "Analytics dashboard",
];
