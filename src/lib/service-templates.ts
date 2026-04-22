/**
 * Service template catalog — predefined service types available for diviners.
 *
 * Hardcoded arrays (ASTROLOGY_TEMPLATES, TAROT_TEMPLATES, ALL_SERVICE_TEMPLATES)
 * are kept for backward compatibility and as a fallback.
 *
 * Prefer the async functions (getActiveServiceTemplates, getServiceTemplatesByCategory)
 * which query the database and reflect admin changes in real time.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceTemplateFormConfig } from "@/lib/service-template-form";

// ── DB-backed service template (superset of ServiceTemplate) ─────────────────

export interface DbServiceTemplate {
  id: string;
  name: string;
  slug: string;
  category: "astrology" | "tarot";
  description: string | null;
  long_description: string | null;
  image_url: string | null;
  form_enabled: boolean;
  form_config: ServiceTemplateFormConfig | null;
  base_price: number;
  overage_rate: number | null;
  duration_minutes: number;
  is_primary: boolean;
  requires_birth_data: boolean;
  trigger_event: string | null;
  sort_order: number;
  display_order: number;
  is_active: boolean;
  icon_name: string | null;
  color: string | null;
  whats_included: string[];
  who_its_for: string[];
  faq: { question: string; answer: string }[];
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string | null;
}

/**
 * Fetch all active service templates from the database.
 * Replaces the old hardcoded arrays for dynamic admin-managed catalog.
 * Uses the admin client (server-side only).
 */
export async function getActiveServiceTemplates(): Promise<DbServiceTemplate[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("service_templates")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw new Error(`Failed to fetch service templates: ${error.message}`);
  return (data ?? []) as DbServiceTemplate[];
}

/**
 * Fetch active service templates filtered by category.
 */
export async function getServiceTemplatesByCategory(
  category: "astrology" | "tarot"
): Promise<DbServiceTemplate[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("service_templates")
    .select("*")
    .eq("is_active", true)
    .eq("category", category)
    .order("display_order", { ascending: true });

  if (error) throw new Error(`Failed to fetch service templates: ${error.message}`);
  return (data ?? []) as DbServiceTemplate[];
}

/**
 * Fetch a single service template by slug.
 */
export async function getServiceTemplateBySlug(
  slug: string
): Promise<DbServiceTemplate | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("service_templates")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return (data as DbServiceTemplate | null);
}

/**
 * Fetch a single service template by id.
 */
export async function getServiceTemplateById(
  id: string
): Promise<DbServiceTemplate | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("service_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as DbServiceTemplate | null);
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy hardcoded arrays — kept for backward compatibility.
// These are used by the onboarding UI as a fallback and for icon/color mapping.
// ─────────────────────────────────────────────────────────────────────────────

export interface ServiceTemplate {
  key: string;
  name: string;
  category: "astrology" | "tarot";
  description: string;
  duration_minutes: number;
  suggested_price: number;
  requires_birth_data: boolean;
  /** Lucide icon name rendered as the card thumbnail */
  icon: string;
  /** Tailwind color token used for the thumbnail background tint */
  color: "indigo" | "violet" | "amber" | "emerald" | "sky" | "rose" | "teal" | "orange" | "lime";
}

export const ASTROLOGY_TEMPLATES: ServiceTemplate[] = [
  {
    key: "nativity-birth-chart",
    name: "Nativity Birth Chart",
    category: "astrology",
    description: "A comprehensive analysis of the natal chart, covering personality, life path, key planetary placements, houses, and aspects.",
    duration_minutes: 90,
    suggested_price: 175,
    requires_birth_data: true,
    icon: "Sun",
    color: "amber",
  },
  {
    key: "solar-return",
    name: "Solar Return",
    category: "astrology",
    description: "Annual forecast reading based on the solar return chart — themes, opportunities, and challenges for the coming year.",
    duration_minutes: 60,
    suggested_price: 125,
    requires_birth_data: true,
    icon: "Sunrise",
    color: "orange",
  },
  {
    key: "weekly-transits",
    name: "Weekly Transits",
    category: "astrology",
    description: "Personalized transit forecast covering the current week's planetary movements and how they activate the natal chart.",
    duration_minutes: 30,
    suggested_price: 65,
    requires_birth_data: true,
    icon: "CalendarDays",
    color: "sky",
  },
  {
    key: "monthly-transits-lunar-return",
    name: "Monthly Transits + Lunar Return",
    category: "astrology",
    description: "Monthly overview combining current transits with the lunar return chart for emotional and practical themes.",
    duration_minutes: 45,
    suggested_price: 95,
    requires_birth_data: true,
    icon: "Moon",
    color: "indigo",
  },
  {
    key: "romantic-relationships",
    name: "Romantic Relationships",
    category: "astrology",
    description: "Synastry and composite chart analysis for romantic compatibility, communication styles, and relationship dynamics.",
    duration_minutes: 60,
    suggested_price: 125,
    requires_birth_data: true,
    icon: "Heart",
    color: "rose",
  },
  {
    key: "friendship-relationships",
    name: "Friendship Relationships",
    category: "astrology",
    description: "Compatibility analysis for friendships — shared values, communication patterns, and long-term potential.",
    duration_minutes: 60,
    suggested_price: 125,
    requires_birth_data: true,
    icon: "Users",
    color: "teal",
  },
  {
    key: "business-relationship",
    name: "Business Relationship",
    category: "astrology",
    description: "Astrological compatibility for business partnerships — strengths, blind spots, and timing considerations.",
    duration_minutes: 60,
    suggested_price: 125,
    requires_birth_data: true,
    icon: "Briefcase",
    color: "emerald",
  },
  {
    key: "predictive-event-horary",
    name: "Predictive Event (Horary)",
    category: "astrology",
    description: "Horary astrology reading for a specific question or event — answer sought from the chart cast at the time of the question.",
    duration_minutes: 45,
    suggested_price: 95,
    requires_birth_data: false,
    icon: "Eye",
    color: "violet",
  },
  {
    key: "jupiter-return",
    name: "Jupiter Return",
    category: "astrology",
    description: "Reading focused on the Jupiter return cycle — expansion, opportunity, and growth themes for the next 12-year chapter.",
    duration_minutes: 45,
    suggested_price: 95,
    requires_birth_data: true,
    icon: "Zap",
    color: "amber",
  },
  {
    key: "saturn-return",
    name: "Saturn Return",
    category: "astrology",
    description: "Deep dive into the Saturn return — major life restructuring, responsibility shifts, and long-term foundation building.",
    duration_minutes: 60,
    suggested_price: 125,
    requires_birth_data: true,
    icon: "Circle",
    color: "indigo",
  },
  {
    key: "mars-return",
    name: "Mars Return",
    category: "astrology",
    description: "Annual Mars return forecast covering drive, ambition, conflict patterns, and action themes for the coming year.",
    duration_minutes: 45,
    suggested_price: 95,
    requires_birth_data: true,
    icon: "Flame",
    color: "rose",
  },
  {
    key: "uranus-opposition",
    name: "Uranus Opposition",
    category: "astrology",
    description: "Mid-life Uranus opposition reading — awakening, rebellion, liberation themes and how to navigate the transition.",
    duration_minutes: 60,
    suggested_price: 125,
    requires_birth_data: true,
    icon: "Bolt",
    color: "sky",
  },
];

export const TAROT_TEMPLATES: ServiceTemplate[] = [
  {
    key: "3-card-basic-question-spread",
    name: "3 Card Basic Question Spread",
    category: "tarot",
    description: "Quick focused reading using a 3-card spread — past, present, and future or situation, action, outcome.",
    duration_minutes: 20,
    suggested_price: 35,
    requires_birth_data: false,
    icon: "Layers",
    color: "lime",
  },
  {
    key: "5-card-complex-question-spread",
    name: "5 Card Complex Question Spread",
    category: "tarot",
    description: "In-depth reading for complex questions using a 5-card spread covering context, influences, challenge, advice, and outcome.",
    duration_minutes: 30,
    suggested_price: 55,
    requires_birth_data: false,
    icon: "LayoutGrid",
    color: "emerald",
  },
  {
    key: "7-card-6-month-forward-review",
    name: "7 Card 6 Month Forward Review",
    category: "tarot",
    description: "Six-month forecast spread covering monthly energy themes and an overall guidance card for the period ahead.",
    duration_minutes: 45,
    suggested_price: 75,
    requires_birth_data: false,
    icon: "TrendingUp",
    color: "teal",
  },
  {
    key: "7-card-horseshoe-spread-major-read",
    name: "7 Card Horseshoe Spread (Major Read)",
    category: "tarot",
    description: "Classic horseshoe spread covering past, present, hidden influences, obstacles, external influences, advice, and outcome.",
    duration_minutes: 45,
    suggested_price: 75,
    requires_birth_data: false,
    icon: "Anchor",
    color: "violet",
  },
  {
    key: "10-card-relationship-spread",
    name: "10 Card Relationship Spread",
    category: "tarot",
    description: "Comprehensive relationship reading covering both parties' feelings, connection dynamics, challenges, and future potential.",
    duration_minutes: 60,
    suggested_price: 95,
    requires_birth_data: false,
    icon: "HeartHandshake",
    color: "rose",
  },
  {
    key: "10-card-celtic-cross-major-read",
    name: "10 Card Celtic Cross (Major Read)",
    category: "tarot",
    description: "The classic Celtic Cross — a thorough 10-card reading covering the full spectrum of a situation with deep insight.",
    duration_minutes: 60,
    suggested_price: 95,
    requires_birth_data: false,
    icon: "Cross",
    color: "orange",
  },
  {
    key: "12-card-astrological-spread-major-read",
    name: "12 Card Astrological Spread (Major Read)",
    category: "tarot",
    description: "Twelve-card spread mapped to the astrological houses — a holistic yearly overview covering all life areas.",
    duration_minutes: 75,
    suggested_price: 125,
    requires_birth_data: true,
    icon: "CircleDot",
    color: "indigo",
  },
];

export const ALL_SERVICE_TEMPLATES: ServiceTemplate[] = [
  ...ASTROLOGY_TEMPLATES,
  ...TAROT_TEMPLATES,
];
