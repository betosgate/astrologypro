/**
 * Service-specific intake question configuration.
 *
 * Each service slug maps to an array of extra questions that appear below the
 * universal intake fields. Questions that apply to ALL services live in
 * UNIVERSAL_QUESTIONS.  Relationship-type services are detected by slug and
 * automatically get the second-person section.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QuestionType =
  | "text"
  | "textarea"
  | "select"
  | "multiselect"
  | "date"
  | "city";

export interface IntakeQuestion {
  /** Unique key stored in questionnaire_responses JSON */
  key: string;
  label: string;
  type: QuestionType;
  /** Shown as helper text under the label */
  hint?: string;
  placeholder?: string;
  /** For select / multiselect */
  options?: string[];
  required?: boolean;
}

// ---------------------------------------------------------------------------
// Relationship detection
// ---------------------------------------------------------------------------

const RELATIONSHIP_SLUGS = new Set([
  "romantic-relationship-reading",
  "friendship-compatibility-reading",
  "business-relationship-reading",
  "10-card-relationship-spread",
  "synastry-reading",
  "composite-chart-reading",
  "partnership-reading",
  "love-compatibility-reading",
  "relationship-compatibility-reading",
  "couples-reading",
]);

export function isRelationshipService(slug: string, category?: string): boolean {
  if (RELATIONSHIP_SLUGS.has(slug)) return true;
  if (category && /relationship|compatibility|synastry|partnership|couples/i.test(category)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Universal questions (all services)
// ---------------------------------------------------------------------------

export const UNIVERSAL_QUESTIONS: IntakeQuestion[] = [
  {
    key: "readingExperience",
    label: "How experienced are you with this type of reading?",
    type: "select",
    options: [
      "This is my first time",
      "I've had a few readings",
      "I'm experienced — I get readings regularly",
    ],
    required: false,
  },
  {
    key: "communicationStyle",
    label: "How would you like your reader to communicate?",
    type: "select",
    options: [
      "Be direct and straightforward — don't sugarcoat",
      "Gentle and supportive — ease into difficult topics",
      "Whatever feels right in the moment",
    ],
    required: false,
  },
  {
    key: "currentEmotionalState",
    label: "How are you feeling going into this reading?",
    type: "select",
    hint: "This helps your reader set the right tone from the start.",
    options: [
      "Calm and curious",
      "Anxious or worried",
      "Excited and hopeful",
      "Grieving or processing a loss",
      "Confused — seeking clarity",
      "Frustrated or stuck",
      "Open — no strong feelings either way",
    ],
    required: false,
  },
  {
    key: "whatPromptedReading",
    label: "What prompted you to book this reading now?",
    type: "textarea",
    hint: "Understanding the 'why now' helps your reader focus on what matters most.",
    placeholder:
      "e.g., I'm facing a big decision, something happened recently, I've been feeling drawn to get guidance...",
    required: false,
  },
  {
    key: "sensitivities",
    label: "Any topics your reader should approach with extra care?",
    type: "textarea",
    hint: "Completely optional. Helps your reader avoid accidentally hitting painful areas.",
    placeholder: "e.g., recent loss of a family member, health concerns...",
    required: false,
  },
];

// ---------------------------------------------------------------------------
// Relationship section questions (shown when isRelationshipService)
// ---------------------------------------------------------------------------

export const RELATIONSHIP_QUESTIONS: IntakeQuestion[] = [
  {
    key: "partnerRelationship",
    label: "What is your relationship to this person?",
    type: "select",
    options: [
      "Romantic partner / Spouse",
      "Ex-partner",
      "Someone I'm interested in",
      "Friend",
      "Family member",
      "Business partner / Colleague",
      "Someone new in my life",
    ],
    required: true,
  },
  {
    key: "relationshipDuration",
    label: "How long have you known each other?",
    type: "select",
    options: [
      "Less than 6 months",
      "6 months – 1 year",
      "1 – 3 years",
      "3 – 10 years",
      "10+ years",
      "We haven't met yet",
    ],
    required: false,
  },
  {
    key: "relationshipDynamic",
    label: "How would you describe the current dynamic?",
    type: "select",
    options: [
      "Harmonious — things are going well",
      "Tense — there's friction or conflict",
      "Evolving — things are shifting",
      "New and uncertain",
      "Reconnecting after time apart",
      "One-sided — I feel more invested",
      "Complicated — it's hard to describe",
    ],
    required: false,
  },
  {
    key: "relationshipGoal",
    label: "What do you most want to understand about this relationship?",
    type: "textarea",
    placeholder:
      "e.g., Whether we're compatible long-term, how to improve communication, if this partnership will work...",
    required: false,
  },
];

// ---------------------------------------------------------------------------
// Service-specific questions
// ---------------------------------------------------------------------------

const SERVICE_QUESTIONS: Record<string, IntakeQuestion[]> = {
  // ---- ASTROLOGY ----
  "natal-chart-reading": [
    {
      key: "chartFocusAreas",
      label: "Which areas of your chart are you most curious about?",
      type: "multiselect",
      hint: "Select all that apply — or skip to let your reader choose.",
      options: [
        "Career & life purpose",
        "Love & relationships",
        "Family dynamics",
        "Creativity & self-expression",
        "Finances & resources",
        "Health patterns",
        "Spiritual growth",
        "Communication style",
        "Hidden strengths & challenges",
      ],
      required: false,
    },
    {
      key: "currentLifePhase",
      label: "Where are you in life right now?",
      type: "select",
      hint: "Helps your reader contextualize your chart for your current chapter.",
      options: [
        "Student / Early career",
        "Building career or family",
        "Mid-life transition",
        "Established / Reflecting",
        "Going through a major life change",
        "Starting something completely new",
        "Retired / New chapter",
      ],
      required: false,
    },
  ],

  "solar-return-reading": [
    {
      key: "solarReturnGoals",
      label: "What goals or intentions do you have for the coming year?",
      type: "textarea",
      placeholder:
        "e.g., Change careers, deepen a relationship, travel, find more peace...",
      required: false,
    },
    {
      key: "solarReturnLocation",
      label: "Where will you be on your birthday this year?",
      type: "city",
      hint: "Your location on your birthday affects the Solar Return chart. If unsure, leave blank.",
      required: false,
    },
    {
      key: "solarReturnAnticipated",
      label: "Any major changes or events you're anticipating?",
      type: "textarea",
      placeholder: "e.g., Moving, getting married, starting a business, a new baby...",
      required: false,
    },
  ],

  "monthly-transit-reading": [
    {
      key: "upcomingDecisions",
      label: "Any upcoming decisions or events this month?",
      type: "textarea",
      placeholder:
        "e.g., Job interview on the 15th, relationship talk planned, moving date...",
      required: false,
    },
    {
      key: "currentChallenges",
      label: "What current challenges are you navigating?",
      type: "textarea",
      placeholder: "What's been weighing on you lately?",
      required: false,
    },
  ],

  "weekly-transit-reading": [
    {
      key: "upcomingDecisions",
      label: "Anything happening this week that you want insight on?",
      type: "textarea",
      placeholder: "Meetings, dates, deadlines, travel...",
      required: false,
    },
    {
      key: "currentChallenges",
      label: "What's on your mind right now?",
      type: "textarea",
      placeholder: "What would be most helpful to get clarity on?",
      required: false,
    },
  ],

  "saturn-return-reading": [
    {
      key: "saturnReturnPhase",
      label: "Is this your first or second Saturn Return?",
      type: "select",
      hint: "First Saturn Return is around ages 27–30. Second is around ages 57–60.",
      options: [
        "First Saturn Return (ages ~27–30)",
        "Second Saturn Return (ages ~57–60)",
        "I'm not sure",
      ],
      required: false,
    },
    {
      key: "saturnReturnUnstable",
      label: "What areas of your life feel unstable or under pressure?",
      type: "multiselect",
      hint: "Saturn often tests the foundations of our lives.",
      options: [
        "Career / Work",
        "Relationship / Marriage",
        "Living situation",
        "Identity / Purpose",
        "Health",
        "Finances",
        "Family dynamics",
        "Friendships",
      ],
      required: false,
    },
    {
      key: "saturnReturnReflection",
      label: "What structures in your life do you feel outgrowing?",
      type: "textarea",
      placeholder:
        "e.g., A job that no longer fits, a relationship pattern, a belief system...",
      required: false,
    },
  ],

  "jupiter-return-reading": [
    {
      key: "jupiterExpansion",
      label: "What areas of growth or expansion are you experiencing?",
      type: "textarea",
      placeholder: "Where in life do things feel like they're opening up?",
      required: false,
    },
    {
      key: "jupiterAttract",
      label: "What would you like to expand or attract?",
      type: "textarea",
      placeholder:
        "e.g., Abundance, new opportunities, deeper faith, education, travel...",
      required: false,
    },
  ],

  "romantic-relationship-reading": [
    {
      key: "relationshipWorking",
      label: "What's working well in this relationship?",
      type: "textarea",
      placeholder: "What draws you together? What do you appreciate about them?",
      required: false,
    },
    {
      key: "relationshipChallenge",
      label: "What's the main challenge you're facing?",
      type: "textarea",
      placeholder: "e.g., Communication issues, trust, long distance, timing...",
      required: false,
    },
  ],

  "friendship-compatibility-reading": [
    {
      key: "friendshipContext",
      label: "What's going on in this friendship right now?",
      type: "textarea",
      placeholder:
        "e.g., Growing apart, having conflict, considering a business together...",
      required: false,
    },
  ],

  "business-relationship-reading": [
    {
      key: "businessRelType",
      label: "What type of business relationship is this?",
      type: "select",
      options: [
        "Co-founder / Business partner",
        "Employer / Employee",
        "Client relationship",
        "Investor / Advisor",
        "Mentor / Mentee",
        "Potential collaboration",
      ],
      required: false,
    },
    {
      key: "businessDecision",
      label: "What decision are you facing about this relationship?",
      type: "textarea",
      placeholder:
        "e.g., Whether to partner up, how to resolve conflict, if we should part ways...",
      required: false,
    },
  ],

  "horary-predictive-event-reading": [
    {
      key: "horaryExactQuestion",
      label: "State your exact question as specifically as possible",
      type: "textarea",
      hint: "Horary astrology works best with a single, precise question. Frame it as a yes/no or 'will X happen?' question if possible.",
      placeholder:
        'e.g., "Will I get the job at [Company]?", "Should I move to [City] this year?"',
      required: true,
    },
    {
      key: "horaryQuestionDate",
      label: "When did this question first become pressing?",
      type: "date",
      hint: "The moment a question crystallizes matters in horary astrology.",
      required: false,
    },
    {
      key: "horaryContext",
      label: "Relevant background for this question",
      type: "textarea",
      placeholder:
        "Any context that would help your reader understand the situation...",
      required: false,
    },
  ],

  "freelance-astrology-reading": [
    {
      key: "freelanceGoal",
      label: "What do you most want to explore in this reading?",
      type: "textarea",
      placeholder: "This is an open-format reading — tell your astrologer what you'd like to focus on.",
      required: false,
    },
  ],

  // ---- TAROT ----
  "3-card-basic-spread": [
    {
      key: "spreadPreference",
      label: "Would you like a specific 3-card layout?",
      type: "select",
      hint: "Or let your reader choose what's best for your question.",
      options: [
        "Past / Present / Future",
        "Situation / Action / Outcome",
        "Mind / Body / Spirit",
        "You / The Other Person / The Relationship",
        "Let my reader decide",
      ],
      required: false,
    },
  ],

  "10-card-celtic-cross": [
    {
      key: "celticCrossSituation",
      label: "Is there a specific situation this reading should focus on?",
      type: "textarea",
      hint: "The Celtic Cross gives a comprehensive picture — a specific focus helps the reader go deeper.",
      placeholder:
        "e.g., My career crossroads, a relationship decision, a creative block...",
      required: false,
    },
  ],

  "10-card-relationship-spread": [
    {
      key: "relationshipWorking",
      label: "What's working well in this relationship?",
      type: "textarea",
      placeholder: "What draws you together? What do you appreciate?",
      required: false,
    },
    {
      key: "relationshipChallenge",
      label: "What's the main challenge?",
      type: "textarea",
      placeholder: "e.g., Communication, trust, timing, outside pressures...",
      required: false,
    },
  ],

  "7-card-6-month-forecast": [
    {
      key: "forecastTimeframe",
      label: "Any specific timeframe concerns within the next 6 months?",
      type: "textarea",
      placeholder: "e.g., Starting a new job in 2 months, a wedding in April...",
      required: false,
    },
    {
      key: "forecastAreas",
      label: "Which areas do you most want insight on?",
      type: "multiselect",
      options: [
        "Career & finances",
        "Love & relationships",
        "Health & wellness",
        "Creativity & projects",
        "Spiritual growth",
        "Travel & relocation",
        "Family",
      ],
      required: false,
    },
  ],

  "7-card-horseshoe-spread": [
    {
      key: "horseshoeSituation",
      label: "What situation or decision would you like guidance on?",
      type: "textarea",
      placeholder: "The Horseshoe spread is great for seeing how a specific situation unfolds...",
      required: false,
    },
  ],

  "5-card-complex-spread": [
    {
      key: "complexSpreadFocus",
      label: "What specific question or situation should this reading focus on?",
      type: "textarea",
      placeholder: "The more specific you are, the clearer the reading...",
      required: false,
    },
  ],

  "12-card-astrological-spread": [
    {
      key: "knownSigns",
      label: "Do you know your Sun, Moon, or Rising signs?",
      type: "text",
      hint: "Optional — helps your reader contextualize the astrological positions in the spread.",
      placeholder: "e.g., Scorpio Sun, Pisces Moon, Leo Rising",
      required: false,
    },
    {
      key: "astroSpreadFocus",
      label: "Any life areas you're especially curious about?",
      type: "multiselect",
      options: [
        "Identity & self-image",
        "Finances & values",
        "Communication & learning",
        "Home & family",
        "Creativity & romance",
        "Health & daily life",
        "Partnerships",
        "Transformation & intimacy",
        "Travel & higher learning",
        "Career & reputation",
        "Community & friendships",
        "Spirituality & the unconscious",
      ],
      required: false,
    },
  ],

  "freelance-tarot-reading": [
    {
      key: "freelanceTarotGoal",
      label: "What do you most want to explore in this reading?",
      type: "textarea",
      placeholder: "This is an open-format reading — tell your reader what you'd like to focus on.",
      required: false,
    },
  ],
};

export function getServiceQuestions(slug: string): IntakeQuestion[] {
  return SERVICE_QUESTIONS[slug] ?? [];
}
